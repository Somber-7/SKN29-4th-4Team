import json
from functools import wraps

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Q

from .forms import (
    ChangePasswordForm,
    CheckEmailForm,
    ContactForm,
    FindUsernameForm,
    ForgotPasswordForm,
    LoginForm,
    PasswordResetIdentityForm,
    SignupForm,
    UpdateProfileForm,
    WithdrawForm,
)
from .models import ContactInquiry, FAQ, LoginHistory, NamingHistory, NamingResult, Notice, Setting, UserProfile
from .user_lifecycle import get_or_create_profile
from functools import lru_cache


def _error(message, status=400, detail=None):
    return JsonResponse({"message": message, "detail": detail}, status=status)


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@lru_cache(maxsize=1)
def _signup_requires_approval() -> bool:
    """관리자페이지 개발 계획서 §7 — 기본값 false(자동 승인), 관리자가 설정 화면에서
    ServiceSetting(key="signup_requires_approval")을 켜면 승인 대기로 전환된다."""
    setting = Setting.objects.filter(key="signup_requires_approval").first()
    if not setting:
        return False
    return bool(setting.value.get("enabled", False))


def _user_to_auth_user(user):
    return {
        "name": user.first_name or user.username,
        "username": user.username,
        "email": user.email,
        "role": "admin" if user.is_staff else "user",
        "joinedAt": user.date_joined.strftime("%Y.%m.%d"),
    }


def _parse_json(request):
    try:
        return json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return {}


def api_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _error("로그인이 필요합니다.", 401)
        return view_func(request, *args, **kwargs)

    return wrapper


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@require_http_methods(["POST"])
def login_view(request):
    form = LoginForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    username = form.cleaned_data["username"]
    # 계정 존재 여부와 무관하게 아이디/비번 불일치는 항상 같은 메시지·401을 반환한다
    # (기존 정책 유지). 다만 이미 존재하는 계정에 한해서만 실패 이력을 남긴다 —
    # 존재하지 않는 아이디까지 기록하면 무의미한 로그가 쌓인다.
    matched_user = User.objects.filter(username__iexact=username).first()
    user = authenticate(request, username=username, password=form.cleaned_data["password"])
    if user is None:
        if matched_user:
            LoginHistory.objects.create(
                user=matched_user,
                ip=_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
                success=False,
            )
        return _error("아이디 또는 비밀번호를 확인해 주세요.", 401)

    # 비밀번호는 맞지만 정지/미승인 계정이면 세션을 만들지 않는다 — UserProfile.status·
    # approval_status는 관리자 화면(회원 정지·가입 승인)이 쓰는 실질적인 게이트인데
    # 지금까지는 이 값을 아무도 검사하지 않아 정지된 계정도 그냥 로그인됐다.
    profile = get_or_create_profile(user)
    if profile.status == UserProfile.Status.SUSPENDED:
        LoginHistory.objects.create(
            user=user,
            ip=_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
            success=False,
        )
        return _error("정지된 계정입니다. 고객센터로 문의해 주세요.", 403)
    if profile.approval_status == UserProfile.Approval.PENDING:
        LoginHistory.objects.create(
            user=user,
            ip=_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
            success=False,
        )
        return _error("가입 승인 대기 중인 계정입니다.", 403)
    if profile.approval_status == UserProfile.Approval.REJECTED:
        LoginHistory.objects.create(
            user=user,
            ip=_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
            success=False,
        )
        return _error("가입이 거절된 계정입니다.", 403)

    django_login(request, user)
    LoginHistory.objects.create(
        user=user,
        ip=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
        success=True,
    )
    return JsonResponse(_user_to_auth_user(user))


@require_http_methods(["POST"])
def logout_view(request):
    django_logout(request)
    return HttpResponse(status=204)


@require_http_methods(["POST"])
def check_email_view(request):
    form = CheckEmailForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    email = form.cleaned_data["email"]
    exists = User.objects.filter(email__iexact=email).exists()
    return JsonResponse({"available": not exists})


@require_http_methods(["POST"])
def signup_view(request):
    form = SignupForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    try:
        user = User.objects.create_user(
            username=form.cleaned_data["username"],
            email=form.cleaned_data["email"],
            password=form.cleaned_data["password"],
            first_name=form.cleaned_data["name"],
        )
    except IntegrityError:
        # clean_email의 iexact 중복 체크는 앱 레벨이라 동시 요청 사이의 레이스 컨디션은
        # 못 잡는다 — DB 유니크 인덱스(0004 마이그레이션)가 최종 방어선이다.
        return _error("입력값이 올바르지 않습니다.", 400, {"email": ["중복된 이메일이 있습니다."]})

    profile = get_or_create_profile(user)
    if _signup_requires_approval():
        profile.approval_status = UserProfile.Approval.PENDING
    
    now = timezone.now()
    profile.terms_version = form.cleaned_data["termsVersion"]
    profile.privacy_version = form.cleaned_data["privacyVersion"]
    profile.terms_agreed_at = now
    profile.privacy_agreed_at = now
    profile.agreed_ip = _client_ip(request)
    profile.user_agent = request.META.get("HTTP_USER_AGENT", "")[:1000]
    profile.save(update_fields=["approval_status", "terms_version", "privacy_version", "terms_agreed_at", "privacy_agreed_at", "agreed_ip", "user_agent"])

    return JsonResponse({}, status=201)


@require_http_methods(["POST"])
def find_username_view(request):
    form = FindUsernameForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    user = User.objects.filter(
        email__iexact=form.cleaned_data["email"],
        first_name__iexact=form.cleaned_data["name"],
    ).first()
    if user is None:
        return _error("입력한 이름과 이메일이 일치하는 계정을 찾을 수 없습니다.", 400)

    return JsonResponse({"username": user.username})


@require_http_methods(["POST"])
def verify_password_reset_account_view(request):
    form = PasswordResetIdentityForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    exists = User.objects.filter(
        username__iexact=form.cleaned_data["username"],
        email__iexact=form.cleaned_data["email"],
        first_name__iexact=form.cleaned_data["name"],
    ).exists()
    if not exists:
        return _error("입력한 가입 정보와 일치하는 계정을 찾을 수 없습니다.", 400)

    return JsonResponse({}, status=200)


@require_http_methods(["POST"])
def forgot_password_view(request):
    form = ForgotPasswordForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    user = User.objects.filter(
        username__iexact=form.cleaned_data["username"],
        email__iexact=form.cleaned_data["email"],
        first_name__iexact=form.cleaned_data["name"],
    ).first()
    if user is None:
        return _error("입력한 가입 정보와 일치하는 계정을 찾을 수 없습니다.", 400)

    user.set_password(form.cleaned_data["nextPassword"])
    user.save(update_fields=["password"])
    return JsonResponse({}, status=200)


@api_login_required
@require_http_methods(["GET", "POST"])
def history_view(request):
    if request.method == "GET":
        entries = []
        histories = NamingHistory.objects.filter(user=request.user).prefetch_related("result_set")
        for item in histories:
            results = list(item.result_set.all())
            first = results[0] if results else None
            entries.append({
                "id": item.id,
                "date": item.created_at.strftime("%Y.%m.%d"),
                "query": item.query_text,
                "resultCount": len(results),
                "savedCount": 0,
                "topName": {"hanja": first.hanja if first else "", "hangul": first.hangul if first else ""},
                "status": "완료",
            })
        return JsonResponse(entries, safe=False)

    body = _parse_json(request)
    history = NamingHistory.objects.create(
        user=request.user,
        query_text=body.get("query", ""),
        request_payload=body.get("request", {}),
    )
    NamingResult.objects.bulk_create(
        NamingResult(
            history=history,
            sort_order=i,
            hangul=item.get("hangul", "") or "",
            hanja=item.get("hanja", "") or "",
            sukgyeok=item.get("sukgyeok", "") or "",
            detail={
                "lastName": item.get("lastName", {}),
                "ruby": item.get("ruby", []),
                "sukgyeokDetail": item.get("sukgyeokDetail", []),
                "sources": item.get("sources", []),
            },
        )
        for i, item in enumerate(body.get("results", []))
        if isinstance(item, dict)
    )
    return JsonResponse({}, status=201)


@api_login_required
@require_http_methods(["GET", "DELETE"])
def history_detail_view(request, history_id):
    """GET: 저장된 작명 기록 하나의 전체 결과(NameResult[])를 반환한다 — "결과 다시 보기"가
    새 생성 요청을 다시 트리거하지 않고 그때 받은 결과를 그대로 보여주기 위함.
    DELETE: 기록을 삭제한다(연쇄 삭제로 NamingResult도 함께 삭제됨).
    두 경우 모두 user=request.user로 스코프해 다른 회원의 기록 id를 추측해도 접근할 수 없게 한다."""
    history = get_object_or_404(
        NamingHistory.objects.prefetch_related("result_set"), pk=history_id, user=request.user
    )

    if request.method == "DELETE":
        history.delete()
        return HttpResponse(status=204)

    return JsonResponse({
        "id": history.id,
        "date": history.created_at.strftime("%Y.%m.%d"),
        "query": history.query_text,
        "request": history.request_payload,
        "results": [r.to_dict() for r in history.result_set.all()],
    })


@api_login_required
@require_http_methods(["GET", "PATCH", "DELETE"])
def me_view(request):
    if request.method == "GET":
        return JsonResponse(_user_to_auth_user(request.user))

    if request.method == "DELETE":
        form = WithdrawForm(_parse_json(request))
        if not form.is_valid():
            return _error("입력값이 올바르지 않습니다.", 400, form.errors)
        if not request.user.check_password(form.cleaned_data["currentPassword"]):
            return _error("현재 비밀번호가 올바르지 않습니다.", 400)
        # 이제 완전 삭제(하드 삭제) 정책을 사용합니다.
        # 연쇄 삭제(CASCADE)로 인해 작명 기록, 로그인 이력 등도 삭제됩니다.
        request.user.delete()
        django_logout(request)
        return HttpResponse(status=204)

    form = UpdateProfileForm(_parse_json(request), user=request.user)
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    request.user.email = form.cleaned_data["email"]
    request.user.save(update_fields=["email"])
    return JsonResponse(_user_to_auth_user(request.user))


@require_http_methods(["POST"])
def contact_submit_view(request):
    """공개 문의 접수 — 로그인 여부와 무관하게 누구나 제출할 수 있다(§9 문의 관리).
    관리자페이지의 문의 관리 화면은 이렇게 쌓인 ContactInquiry를 그대로 목록/답변한다."""
    form = ContactForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    user = request.user if request.user.is_authenticated else None

    ContactInquiry.objects.create(
        user=user,
        name=form.cleaned_data["name"],
        email=form.cleaned_data["email"],
        topic=form.cleaned_data.get("topic", ""),
        subject=form.cleaned_data["subject"],
        message=form.cleaned_data["message"],
    )
    return JsonResponse({}, status=201)

@api_login_required
@require_http_methods(["GET"])
def inquiries_view(request):
    """사용자의 1:1 문의 내역을 반환합니다."""
    qs = ContactInquiry.objects.filter(user=request.user).order_by("-created_at")
    items = []
    for inquiry in qs:
        items.append({
            "id": inquiry.id,
            "topic": inquiry.topic,
            "subject": inquiry.subject,
            "message": inquiry.message,
            "status": inquiry.status,
            "adminReply": inquiry.admin_reply,
            "createdAt": inquiry.created_at.isoformat(),
            "answeredAt": inquiry.answered_at.isoformat() if inquiry.answered_at else None,
        })
    return JsonResponse(items, safe=False)




@api_login_required
@require_http_methods(["POST"])
def change_password_view(request):
    form = ChangePasswordForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    if not request.user.check_password(form.cleaned_data["currentPassword"]):
        return _error("현재 비밀번호가 올바르지 않습니다.", 400)
    if form.cleaned_data["currentPassword"] == form.cleaned_data["nextPassword"]:
        return _error("현재 비밀번호와 다른 비밀번호를 사용해 주세요.", 400)

    request.user.set_password(form.cleaned_data["nextPassword"])
    request.user.save(update_fields=["password"])
    update_session_auth_hash(request, request.user)
    return JsonResponse({}, status=200)


@require_http_methods(["GET"])
def notice_list_view(request):
    now = timezone.now()
    qs = Notice.objects.filter(
        status=Notice.Status.PUBLISHED
    ).filter(
        Q(start_at__isnull=True) | Q(start_at__lte=now)
    ).filter(
        Q(end_at__isnull=True) | Q(end_at__gte=now)
    ).order_by("-is_pinned", "-updated_at")
    
    items = []
    for notice in qs:
        items.append({
            "id": notice.id,
            "title": notice.title,
            "body": notice.body,
            "isPinned": notice.is_pinned,
            "createdAt": notice.created_at.isoformat(),
            "updatedAt": notice.updated_at.isoformat(),
        })
    return JsonResponse({"items": items})


@require_http_methods(["GET"])
def notice_detail_view(request, notice_id):
    now = timezone.now()
    try:
        notice = Notice.objects.get(
            pk=notice_id,
            status=Notice.Status.PUBLISHED
        )
        if notice.start_at and notice.start_at > now:
            return _error("공지를 찾을 수 없습니다.", 404)
        if notice.end_at and notice.end_at < now:
            return _error("공지를 찾을 수 없습니다.", 404)
    except Notice.DoesNotExist:
        return _error("공지를 찾을 수 없습니다.", 404)

    return JsonResponse({
        "id": notice.id,
        "title": notice.title,
        "body": notice.body,
        "isPinned": notice.is_pinned,
        "createdAt": notice.created_at.isoformat(),
        "updatedAt": notice.updated_at.isoformat(),
    })


@require_http_methods(["GET"])
def faq_list_view(request):
    qs = FAQ.objects.filter(is_active=True).order_by("category", "order", "-updated_at")
    
    items = []
    category_labels = {}
    
    CATEGORY_MAP = {
        "service": "서비스 이용",
        "evidence": "작명 근거",
        "account": "계정·이용권"
    }
    
    for faq in qs:
        cat_name = faq.category
        if cat_name not in category_labels:
            category_labels[cat_name] = CATEGORY_MAP.get(cat_name, cat_name)
            
        items.append({
            "id": faq.id,
            "category": cat_name,
            "categorySlug": cat_name,
            "question": faq.question,
            "answer": faq.answer,
        })
        
    return JsonResponse({
        "items": items,
        "categoryLabels": category_labels
    })


from .models import NameTrendStat, TrendArticle
from django.db.models import Sum

@require_http_methods(["GET", "POST"])
def heartbeat_view(request):
    """GET: 유지보수 모드 상태 확인. POST: 프론트엔드가 세션 유지를 위해
    30초마다 보내는 ping(clientId·currentPath는 응답에 영향 없이 무시됨)."""
    if request.method == "POST":
        return JsonResponse({"status": "ok"})

    from .models import Setting
    setting = Setting.objects.filter(key="maintenance").first()
    maintenance = False
    reason = ""
    if setting:
        maintenance = setting.value.get("enabled", False)
        reason = setting.value.get("reason", "")
    return JsonResponse({
        "status": "ok",
        "maintenance": maintenance,
        "reason": reason
    })

@require_http_methods(["GET"])
def insights_view(request):
    # Fetch latest 5 years of NameTrendStat
    years_qs = NameTrendStat.objects.values_list('year', flat=True).distinct().order_by('-year')[:5]
    years = list(years_qs)
    
    # We will fetch data for all these 5 years to send to frontend
    # But since the current frontend InsightsBundle expects trendNamesBoy/Girl
    # We will group by year and send the structure
    # Actually, the mock had only one array for Boy and one for Girl.
    # To support 5 years, we might need to send a dictionary grouped by year,
    # or just send the latest year if the frontend hasn't been updated yet.
    # We'll send a grouped structure and we'll update the frontend to use it.
    
    all_trends = NameTrendStat.objects.filter(year__in=years).order_by('-year', 'rank')
    
    trend_data = {}
    for t in all_trends:
        if t.year not in trend_data:
            trend_data[t.year] = []
        trend_data[t.year].append({
            "rank": t.rank,
            "name": t.name,
            "hanja": t.hanja,
            "count": t.count,
            "delta": t.delta
        })
        
    # Yearly counts for totalTrendCombined (exclude 2026 as it's partial data causing a sharp drop)
    yearly_counts = NameTrendStat.objects.exclude(year=2026).values('year').annotate(total_count=Sum('count')).order_by('year')
    total_trend_combined = [{"year": str(y["year"]), "count": y["total_count"]} for y in yearly_counts]
    
    # Articles
    articles_qs = TrendArticle.objects.all().order_by('-date')
    articles = []
    for a in articles_qs:
        articles.append({
            "id": a.id,
            "category": a.category,
            "title": a.title,
            "summary": a.summary,
            "paragraphs": a.paragraphs,
            "views": a.views,
            "date": a.date.strftime("%Y.%m.%d"),
            "thumbnailUrl": a.thumbnail_url,
            "url": a.url,
            "createdAt": a.created_at.isoformat()
        })
        
    insight_cards = [
        {"title": "순우리말 이름", "desc": "부드럽고 친근한 어감으로 꾸준히 사랑받는 순우리말 이름", "stat": "선호도 1위", "hanja": "한"},
        {"title": "중성적 어감", "desc": "성별에 구애받지 않는 세련된 느낌의 중성적 이름", "stat": "최근 급상승", "hanja": "류"},
        {"title": "대법원 인명용", "desc": "사주와 조화를 이루며 뜻이 깊은 인명용 한자 이름", "stat": "스테디셀러", "hanja": "명"}
    ]
    
    category_labels = {
        "trend": "작명 트렌드",
        "hanja": "한자 추천",
        "guide": "작명 가이드"
    }
    
    return JsonResponse({
        "trendsByYear": trend_data,
        "availableYears": years,
        "totalTrendCombined": total_trend_combined,
        "trendMeta": {
            "sample": "2016-2026",
            "period": "전체 데이터",
            "updatedAt": "2026.07"
        },
        "insightCards": insight_cards,
        "categoryLabels": category_labels,
        "articles": articles
    })





