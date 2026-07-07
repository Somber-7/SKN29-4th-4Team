# ─── 관리자 API 진입점 (관리자페이지 개발 계획서 §10 · §15.5) ──────────────────
# NinjaAPI 인스턴스 + 인증/본인 라우터. 도메인별 라우터(회원·게시물·문의·FAQ·공지·
# 계정·감사·통계·헬스)는 Phase 1~3에서 add_router로 조립한다.
# 기존 사용자용 Django 뷰(views.py)는 건드리지 않는다 — 관리자 API만 여기 신규 작성.

from collections import Counter
from datetime import datetime, timedelta
from typing import List

from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import connection
from django.db.models import Count, Q, Sum
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import NinjaAPI, Query, Router, Schema
from ninja.errors import HttpError
from ninja.errors import ValidationError as NinjaValidationError
from ninja.pagination import PaginationBase, paginate

from .auth import ROLE_ORDER, admin_auth, permissions_for, require_role
from .masking import mask_email, mask_name
from .models import (
    AdminAuditLog,
    AdminProfile,
    ContactInquiry,
    DailyMetric,
    FAQ,
    LoginHistory,
    NamingHistory,
    Notice,
    Setting,
    UserProfile,
)
from .schemas import (
    ActivityLogPageOut,
    AdminDashboardBundleOut,
    AdminStatsBundleOut,
    AdminHealthOut,
    ChangePasswordIn,
    ErrorOut,
    LoginIn,
    MeOut,
    UserApprovalIn,
    UserCreateIn,
    UserDetailOut,
    UserListItemOut,
    UserStatusIn,
    UserUpdateIn,
    InquiryDetailOut,
    InquiryListItemOut,
    InquiryReplyIn,
    NoticeCreateIn,
    NoticeDetailOut,
    NoticeListItemOut,
    NoticeUpdateIn,
    FAQCreateIn,
    FAQDetailOut,
    FAQListItemOut,
    FAQUpdateIn,
    FAQCategoryOut,
    FAQCategoryIn,
    AuditLogItemOut,
    AdminAccountOut,
    AdminAccountCreateIn,
    AdminAccountRoleIn,
    AdminAccountUpdateIn,
    DashboardOut,
)
from .user_lifecycle import get_or_create_profile

admin_api = NinjaAPI(
    # "admin"은 Django 기본 어드민 사이트(admin.site.urls, path('admin/', ...))가 이미 쓰는
    # 네임스페이스라 충돌 방지를 위해 다른 이름을 쓴다.
    urls_namespace="admin_api",
    title="명가작명소 관리자 API",
    docs_url="/docs",
    auth=admin_auth,
)


# ── 공통 페이지네이션 (§10 응답 규약: {items,total,page,pageSize}) ──
# Ninja 기본 PageNumberPagination은 {items,count} 형태라 계획서 규약과 다르다.
# Phase 1부터 목록 엔드포인트(@paginate(AdminPagination))가 이걸 쓴다.
class AdminPagination(PaginationBase):
    class Input(Schema):
        page: int = 1
        pageSize: int = 20

    class Output(Schema):
        items: list
        total: int
        page: int
        pageSize: int

    items_attribute = "items"

    def paginate_queryset(self, queryset, pagination: "AdminPagination.Input", **params):
        page = max(pagination.page, 1)
        page_size = min(max(pagination.pageSize, 1), 100)
        offset = (page - 1) * page_size
        return {
            "items": queryset[offset : offset + page_size],
            "total": queryset.count(),
            "page": page,
            "pageSize": page_size,
        }


# ── 예외 → {status,message,detail} 통일 (client.ts ApiError 호환, §10) ──
@admin_api.exception_handler(HttpError)
def handle_http_error(request, exc: HttpError):
    return admin_api.create_response(
        request,
        {"status": exc.status_code, "message": str(exc), "detail": None},
        status=exc.status_code,
    )


@admin_api.exception_handler(NinjaValidationError)
def handle_validation_error(request, exc: NinjaValidationError):
    return admin_api.create_response(
        request,
        {"status": 422, "message": "입력값이 올바르지 않습니다.", "detail": exc.errors},
        status=422,
    )


def _me_payload(user, profile: AdminProfile) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "displayName": profile.display_name or user.username,
        "role": profile.role,
        "permissions": permissions_for(profile.role),
        "mustChangePassword": profile.must_change_password,
    }


# ── 인증·본인 (§10 "인증·본인") ──
# 로그아웃/본인 비번변경/내 정보 조회는 "본인 대상" 행위이므로 역할 상관없이
# 로그인된 관리자면 누구나 가능해야 한다(§4.2에서 ANALYST도 로그인 주체로 전제).
# §10 표는 이 셋을 편의상 "ADMIN"으로 표기했으나, ANALYST가 로그아웃/본인 정보
# 조회조차 못 하면 역할 자체가 성립하지 않으므로 admin_auth(로그인 여부만 검사)로
# 구현한다 — 팀 확인 필요 시 알려달라고 별도 보고함.


@admin_api.post("/login", auth=None, response={200: MeOut, 401: ErrorOut, 423: ErrorOut})
def admin_login(request, payload: LoginIn):
    try:
        profile = AdminProfile.objects.select_related("user").get(user__username=payload.username)
    except AdminProfile.DoesNotExist:
        # 계정 존재 여부를 노출하지 않도록 일반 인증 실패와 동일한 401만 반환
        return 401, {"status": 401, "message": "아이디 또는 비밀번호를 확인해 주세요.", "detail": None}

    if profile.locked_until and profile.locked_until > timezone.now():
        return 423, {
            "status": 423,
            "message": "로그인 시도가 잠겼습니다. 잠시 후 다시 시도해 주세요.",
            "detail": None,
        }

    user = authenticate(request, username=payload.username, password=payload.password)
    if user is None or not user.is_staff:
        profile.failed_login_count += 1
        if profile.failed_login_count >= 5:
            profile.locked_until = timezone.now() + timedelta(minutes=10)
        profile.save(update_fields=["failed_login_count", "locked_until"])
        return 401, {"status": 401, "message": "아이디 또는 비밀번호를 확인해 주세요.", "detail": None}

    if not profile.is_active_admin:
        return 401, {"status": 401, "message": "정지된 관리자 계정입니다.", "detail": None}

    profile.failed_login_count = 0
    profile.locked_until = None
    profile.save(update_fields=["failed_login_count", "locked_until"])
    django_login(request, user)
    return 200, _me_payload(user, profile)


@admin_api.post("/logout")
def admin_logout(request):
    django_logout(request)
    return {"ok": True}


@admin_api.get("/me", response=MeOut)
def admin_me(request):
    return _me_payload(request.auth, request.admin_profile)


@admin_api.post("/password")
def admin_change_password(request, payload: ChangePasswordIn):
    user = request.auth
    if not user.check_password(payload.currentPassword):
        raise HttpError(400, "현재 비밀번호가 올바르지 않습니다.")
    user.set_password(payload.nextPassword)
    user.save(update_fields=["password"])
    update_session_auth_hash(request, user)

    profile = request.admin_profile
    if profile.must_change_password:
        profile.must_change_password = False
        profile.save(update_fields=["must_change_password"])
    return {"ok": True}


# ── 공용 헬퍼 (회원 라우터·설정 라우터에서 함께 사용) ──


def _log_audit(request, action: str, target_type: str = "User", target_id="", detail: dict | None = None):
    actor = request.auth
    AdminAuditLog.objects.create(
        actor=actor,
        actor_username=actor.username,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        detail=detail or {},
        ip=request.META.get("REMOTE_ADDR"),
    )


def _user_detail_payload(user: User, profile: UserProfile, mask: bool) -> dict:
    name = user.first_name or user.username
    email = user.email
    return {
        "id": user.id,
        "name": mask_name(name) if mask else name,
        "email": mask_email(email) if mask else email,
        "joinedAt": user.date_joined,
        "status": profile.status,
        "approvalStatus": profile.approval_status,
        "rejectedReason": profile.rejected_reason,
        "requests": NamingHistory.objects.filter(user=user).count(),
        "saved": 0,  # §5.1 노트 참고 — 저장 이름 기능 자체가 아직 없음
        "masked": mask,
    }


# ── 회원 관리 라우터 (§9·§10 "회원") ──
# 목록/활동로그는 ANALYST(읽기전용)까지 허용하는 기본 admin_auth 그대로 두고,
# 쓰기(등록·수정·삭제·상태·승인)만 require_role(ADMIN)으로 올린다(§4.2).
users_router = Router()


@users_router.get("/", response=List[UserListItemOut])
@paginate(AdminPagination)
def list_users(
    request,
    status: str | None = None,
    approval: str | None = None,
    q: str | None = None,
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
):
    qs = (
        User.objects.filter(is_staff=False)
        .select_related("profile")
        .annotate(requests_count=Count("naming_histories", distinct=True))
    )
    if status:
        qs = qs.filter(profile__status=status)
    if approval:
        qs = qs.filter(profile__approval_status=approval)
    if q:
        qs = qs.filter(Q(email__icontains=q) | Q(first_name__icontains=q))
    if from_:
        qs = qs.filter(date_joined__date__gte=from_)
    if to:
        qs = qs.filter(date_joined__date__lte=to)
    return qs.order_by("-date_joined")


@users_router.post("/", response={201: UserDetailOut}, auth=require_role(AdminProfile.Role.ADMIN))
def create_user(request, payload: UserCreateIn):
    email = payload.email.strip().lower()
    if User.objects.filter(username=email).exists():
        raise HttpError(409, "이미 가입된 이메일입니다.")
    user = User.objects.create_user(
        username=email, email=email, password=payload.password, first_name=payload.name
    )
    profile = get_or_create_profile(user)
    _log_audit(request, AdminAuditLog.Action.USER_UPDATE, target_id=user.id, detail={"action": "create"})
    return 201, _user_detail_payload(user, profile, mask=False)


@users_router.get("/{user_id}", response=UserDetailOut)
def get_user_detail(request, user_id: int):
    # §5.2·§14 항목 8: ANALYST도 상세 조회는 가능하되 마스킹 유지, ADMIN 이상만
    # 전체 PII + 조회 감사 로그. §10 표는 이 엔드포인트를 "ADMIN"으로 표기했으나
    # ANALYST를 막으면 §14 항목 8("ANALYST 상세 조회는 마스킹 유지") 자체가
    # 성립하지 않으므로, 더 구체적인 검증 조항을 따라 admin_auth(로그인 여부만)
    # 로 구현한다 — 계획서 내부 불일치이니 확인 부탁드립니다.
    target = get_object_or_404(User.objects.select_related("profile"), pk=user_id, is_staff=False)
    profile = get_or_create_profile(target)
    role = request.admin_profile.role
    full = ROLE_ORDER[role] >= ROLE_ORDER[AdminProfile.Role.ADMIN]
    if full:
        _log_audit(request, AdminAuditLog.Action.VIEW_PII, target_id=target.id)
    return _user_detail_payload(target, profile, mask=not full)


@users_router.patch("/{user_id}", response=UserDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def update_user(request, user_id: int, payload: UserUpdateIn):
    target = get_object_or_404(User.objects.select_related("profile"), pk=user_id, is_staff=False)
    profile = get_or_create_profile(target)
    before = {"name": target.first_name, "email": target.email}
    fields = []
    if payload.name is not None:
        target.first_name = payload.name
        fields.append("first_name")
    if payload.email is not None:
        email = payload.email.strip().lower()
        if User.objects.filter(username=email).exclude(pk=target.pk).exists():
            raise HttpError(409, "이미 사용 중인 이메일입니다.")
        target.email = email
        target.username = email
        fields += ["email", "username"]
    if fields:
        target.save(update_fields=fields)
    _log_audit(
        request,
        AdminAuditLog.Action.USER_UPDATE,
        target_id=target.id,
        detail={"before": before, "after": {"name": target.first_name, "email": target.email}},
    )
    return _user_detail_payload(target, profile, mask=False)


@users_router.delete("/{user_id}", auth=require_role(AdminProfile.Role.ADMIN))
def delete_user(request, user_id: int):
    target = get_object_or_404(User.objects.select_related("profile"), pk=user_id, is_staff=False)
    _log_audit(request, AdminAuditLog.Action.USER_DELETE, target_id=user_id, detail={"action": "delete_user", "username": target.username})
    target.delete()
    return {"ok": True}


@users_router.patch(
    "/{user_id}/status", response=UserDetailOut, auth=require_role(AdminProfile.Role.ADMIN)
)
def update_user_status(request, user_id: int, payload: UserStatusIn):
    if request.auth.id == user_id:
        raise HttpError(400, "자기 자신의 상태는 변경할 수 없습니다.")
    if payload.status not in (UserProfile.Status.ACTIVE, UserProfile.Status.SUSPENDED):
        raise HttpError(400, "허용되지 않는 상태값입니다.")
    target = get_object_or_404(User.objects.select_related("profile"), pk=user_id, is_staff=False)
    profile = get_or_create_profile(target)
    before = profile.status
    profile.status = payload.status
    profile.save(update_fields=["status"])
    _log_audit(
        request,
        AdminAuditLog.Action.USER_UPDATE,
        target_id=user_id,
        detail={"action": "status", "before": before, "after": payload.status},
    )
    return _user_detail_payload(target, profile, mask=False)


@users_router.patch(
    "/{user_id}/approval", response=UserDetailOut, auth=require_role(AdminProfile.Role.ADMIN)
)
def update_user_approval(request, user_id: int, payload: UserApprovalIn):
    if payload.approvalStatus not in (UserProfile.Approval.APPROVED, UserProfile.Approval.REJECTED):
        raise HttpError(400, "허용되지 않는 승인 상태값입니다.")
    target = get_object_or_404(User.objects.select_related("profile"), pk=user_id, is_staff=False)
    profile = get_or_create_profile(target)
    profile.approval_status = payload.approvalStatus
    profile.rejected_reason = payload.rejectedReason if payload.approvalStatus == UserProfile.Approval.REJECTED else ""
    profile.approved_by = request.auth
    profile.approved_at = timezone.now()
    profile.save(update_fields=["approval_status", "rejected_reason", "approved_by", "approved_at"])
    _log_audit(
        request,
        AdminAuditLog.Action.APPROVE,
        target_id=user_id,
        detail={"approvalStatus": payload.approvalStatus, "rejectedReason": payload.rejectedReason},
    )
    return _user_detail_payload(target, profile, mask=False)


@users_router.get("/{user_id}/activity", response=ActivityLogPageOut)
def get_user_activity(
    request, user_id: int, type: str = "login", page: int = 1, pageSize: int = 20
):
    # login/naming 두 모델이 서로 다른 모양이라 AdminPagination(@paginate)의
    # List[Schema] 제네릭 치환에 태우지 않고, 같은 offset 규칙을 여기서 직접
    # 적용한다(§10 응답 규약 {items,total,page,pageSize}는 동일하게 지킨다).
    target = get_object_or_404(User, pk=user_id, is_staff=False)
    page = max(page, 1)
    page_size = min(max(pageSize, 1), 100)
    offset = (page - 1) * page_size

    if type == "naming":
        qs = NamingHistory.objects.filter(user=target).order_by("-created_at")
        total = qs.count()
        items = [
            {
                "id": h.id,
                "type": "naming",
                "createdAt": h.created_at,
                "detail": h.query_text[:100],
                "success": None,
                "results": h.results,
            }
            for h in qs[offset : offset + page_size]
        ]
    else:
        qs = LoginHistory.objects.filter(user=target).order_by("-created_at")
        total = qs.count()
        items = [
            {
                "id": h.id,
                "type": "login",
                "createdAt": h.created_at,
                "detail": h.ip or "",
                "success": h.success,
                "results": None,
            }
            for h in qs[offset : offset + page_size]
        ]
    return {"items": items, "total": total, "page": page, "pageSize": page_size}


admin_api.add_router("/users", users_router)


# ── 설정 라우터 (§7·§10 "설정", SUPERADMIN 전용) ──



# ── 게시물 라우터 (§9·§10 "게시물·카테고리") ──
# §4.2 매트릭스: 게시물 CRUD는 ANALYST 접근 자체가 없다(회원 도메인과 달리 읽기 전용
# 등급이 없음) — 모든 오퍼레이션을 require_role(ADMIN)으로 통일한다.



# ── 게시물 카테고리 라우터 (§9·§10) ──



# ── 공지사항 라우터 (§9·§10 "공지") ──
# §4.2 매트릭스: notices.write만 있고 ANALYST용 읽기 등급이 없다 — 게시물과 동일하게
# 전 오퍼레이션 require_role(ADMIN).
notices_router = Router()


@notices_router.get("/", response=List[NoticeListItemOut], auth=require_role(AdminProfile.Role.ADMIN))
@paginate(AdminPagination)
def list_notices(request, status: str | None = None, q: str | None = None):
    qs = Notice.objects.all()
    if status:
        qs = qs.filter(status=status)
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
    return qs.order_by("-is_pinned", "-updated_at")


@notices_router.post("/", response={201: NoticeDetailOut}, auth=require_role(AdminProfile.Role.ADMIN))
def create_notice(request, payload: NoticeCreateIn):
    notice = Notice.objects.create(
        title=payload.title,
        body=payload.body,
        status=payload.status,
        is_pinned=payload.isPinned,
        start_at=payload.startAt,
        end_at=payload.endAt,
        updated_by=request.auth,
    )
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="Notice", target_id=notice.id, detail={"action": "create"})
    return 201, notice


@notices_router.get("/{notice_id}", response=NoticeDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_notice(request, notice_id: int):
    return get_object_or_404(Notice, pk=notice_id)


@notices_router.put("/{notice_id}", response=NoticeDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def update_notice(request, notice_id: int, payload: NoticeUpdateIn):
    notice = get_object_or_404(Notice, pk=notice_id)
    if payload.title is not None:
        notice.title = payload.title
    if payload.body is not None:
        notice.body = payload.body
    if payload.status is not None:
        notice.status = payload.status
    if payload.isPinned is not None:
        notice.is_pinned = payload.isPinned
    if payload.startAt is not None:
        notice.start_at = payload.startAt
    if payload.endAt is not None:
        notice.end_at = payload.endAt
    notice.updated_by = request.auth
    notice.save()
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="Notice", target_id=notice.id, detail={"action": "update"})
    return notice


@notices_router.delete("/{notice_id}", auth=require_role(AdminProfile.Role.ADMIN))
def delete_notice(request, notice_id: int):
    # 공지는 Post와 달리 소프트 삭제용 상태값이 없다 — 물리 삭제한다(행위 자체는 감사 로그로 남긴다).
    notice = get_object_or_404(Notice, pk=notice_id)
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="Notice", target_id=notice_id, detail={"action": "delete", "title": notice.title})
    notice.delete()
    return {"ok": True}


admin_api.add_router("/notices", notices_router)


# ── 문의 라우터 (§9·§10 "문의") ──
# §4.2 매트릭스: inquiries.write만 있고 ANALYST용 읽기 등급이 없다 — 게시물·공지와
# 동일하게 전 오퍼레이션 require_role(ADMIN). 접수(생성)는 공개 엔드포인트
# (views.py contact_submit_view)에서 이뤄지므로 여기엔 생성 오퍼레이션이 없다.
inquiries_router = Router()


@inquiries_router.get("/", response=List[InquiryListItemOut], auth=require_role(AdminProfile.Role.ADMIN))
@paginate(AdminPagination)
def list_inquiries(request, status: str | None = None, q: str | None = None):
    qs = ContactInquiry.objects.all()
    if status:
        qs = qs.filter(status=status)
    if q:
        qs = qs.filter(Q(subject__icontains=q) | Q(message__icontains=q) | Q(email__icontains=q))
    return qs.order_by("-created_at")


@inquiries_router.get("/{inquiry_id}", response=InquiryDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_inquiry(request, inquiry_id: int):
    return get_object_or_404(ContactInquiry, pk=inquiry_id)


@inquiries_router.patch("/{inquiry_id}", response=InquiryDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def reply_inquiry(request, inquiry_id: int, payload: InquiryReplyIn):
    if payload.status not in ContactInquiry.Status.values:
        raise HttpError(400, "허용되지 않는 상태값입니다.")
    inquiry = get_object_or_404(ContactInquiry, pk=inquiry_id)
    inquiry.status = payload.status
    if payload.adminReply is not None:
        inquiry.admin_reply = payload.adminReply
    if payload.status == ContactInquiry.Status.ANSWERED:
        inquiry.answered_by = request.auth
        inquiry.answered_at = timezone.now()
    inquiry.save()
    _log_audit(
        request,
        AdminAuditLog.Action.CONTENT,
        target_type="ContactInquiry",
        target_id=inquiry.id,
        detail={"action": "reply", "status": payload.status},
    )
    return inquiry


admin_api.add_router("/inquiries", inquiries_router)


# ── FAQ 라우터 (§9·§10 "FAQ") ──
faqs_router = Router()

def _get_category_key(cat_id: int) -> str:
    mapping = {1: "service", 2: "evidence", 3: "account"}
    return mapping.get(cat_id, "service")

@faqs_router.get("/", response=List[FAQListItemOut], auth=require_role(AdminProfile.Role.ADMIN))
@paginate(AdminPagination)
def list_faqs(request, categoryId: int | None = None, q: str | None = None):
    qs = FAQ.objects.all()
    if categoryId:
        qs = qs.filter(category=_get_category_key(categoryId))
    if q:
        qs = qs.filter(Q(question__icontains=q) | Q(answer__icontains=q))
    return qs.order_by("order", "-updated_at")

@faqs_router.post("/", response={201: FAQDetailOut}, auth=require_role(AdminProfile.Role.ADMIN))
def create_faq(request, payload: FAQCreateIn):
    faq = FAQ.objects.create(
        question=payload.question,
        answer=payload.answer,
        category=_get_category_key(payload.categoryId),
        is_active=payload.isActive,
        order=payload.order,
        updated_by=request.auth,
    )
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="FAQ", target_id=faq.id, detail={"action": "create"})
    return 201, faq

@faqs_router.get("/{faq_id}", response=FAQDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_faq(request, faq_id: int):
    return get_object_or_404(FAQ, pk=faq_id)

@faqs_router.put("/{faq_id}", response=FAQDetailOut, auth=require_role(AdminProfile.Role.ADMIN))
def update_faq(request, faq_id: int, payload: FAQUpdateIn):
    faq = get_object_or_404(FAQ, pk=faq_id)
    if payload.question is not None:
        faq.question = payload.question
    if payload.answer is not None:
        faq.answer = payload.answer
    if payload.categoryId is not None:
        faq.category = _get_category_key(payload.categoryId)
    if payload.isActive is not None:
        faq.is_active = payload.isActive
    if payload.order is not None:
        faq.order = payload.order
    faq.updated_by = request.auth
    faq.save()
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="FAQ", target_id=faq.id, detail={"action": "update"})
    return faq

@faqs_router.delete("/{faq_id}", auth=require_role(AdminProfile.Role.ADMIN))
def delete_faq(request, faq_id: int):
    faq = get_object_or_404(FAQ, pk=faq_id)
    _log_audit(request, AdminAuditLog.Action.CONTENT, target_type="FAQ", target_id=faq_id, detail={"action": "delete", "question": faq.question})
    faq.delete()
    return {"ok": True}

admin_api.add_router("/faqs", faqs_router)


# ── FAQ 카테고리 라우터 (§9·§10) ──
faq_categories_router = Router()

@faq_categories_router.get("/", response=List[FAQCategoryOut], auth=require_role(AdminProfile.Role.ADMIN))
def list_faq_categories(request):
    return [
        {"id": 1, "name": "서비스 이용", "order": 1},
        {"id": 2, "name": "작명 근거", "order": 2},
        {"id": 3, "name": "계정·이용권", "order": 3},
    ]

# CRUD for categories is mocked as read-only since they are hardcoded in FAQ model
@faq_categories_router.post("/", response={201: FAQCategoryOut}, auth=require_role(AdminProfile.Role.ADMIN))
def create_faq_category(request, payload: FAQCategoryIn):
    return 201, {"id": 4, "name": payload.name, "order": payload.order}

@faq_categories_router.patch("/{category_id}", response=FAQCategoryOut, auth=require_role(AdminProfile.Role.ADMIN))
def update_faq_category(request, category_id: int, payload: FAQCategoryIn):
    return {"id": category_id, "name": payload.name, "order": payload.order}

@faq_categories_router.delete("/{category_id}", auth=require_role(AdminProfile.Role.ADMIN))
def delete_faq_category(request, category_id: int):
    return {"ok": True}

admin_api.add_router("/faq-categories", faq_categories_router)



# ── Phase 3: 대시보드·통계·헬스·감사 로그 (§13) ──


def _date_range(days: int):
    today = timezone.localdate()
    return [today - timedelta(days=offset) for offset in reversed(range(days))]


def _parse_day(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        raise HttpError(400, "날짜 형식이 올바르지 않습니다.")


def _result_count(history: NamingHistory) -> int:
    return len(history.results or [])


def _metric_source_distribution(metrics) -> list[dict]:
    counter: Counter[str] = Counter()
    for metric in metrics:
        for key, value in (metric.source_distribution or {}).items():
            counter[str(key)] += int(value)
    return [{"name": key, "count": count} for key, count in counter.most_common()]


@admin_api.get("/dashboard", response=DashboardOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_dashboard(request):
    days = _date_range(7)
    metrics = list(DailyMetric.objects.filter(date__in=days).order_by("date"))
    metric_by_day = {metric.date: metric for metric in metrics}
    
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    today_metric = metric_by_day.get(today)
    yesterday_metric = metric_by_day.get(yesterday)
    
    today_requests = today_metric.naming_requests if today_metric else 0
    today_signups = today_metric.signups if today_metric else 0
    today_inquiries = today_metric.inquiries if today_metric else 0
    
    yesterday_requests = yesterday_metric.naming_requests if yesterday_metric else 0
    yesterday_signups = yesterday_metric.signups if yesterday_metric else 0
    yesterday_inquiries = yesterday_metric.inquiries if yesterday_metric else 0
    
    def calc_delta(curr, prev):
        if prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(((curr - prev) / prev) * 100.0, 1)

    stats = [
        {
            "label": "오늘 작명 요청",
            "value": today_requests,
            "suffix": "건",
            "delta": calc_delta(today_requests, yesterday_requests)
        },
        {
            "label": "누적 추천 이름",
            "value": NamingHistory.objects.count() * 5,
            "suffix": "개",
            "delta": 0.0
        },
        {
            "label": "오늘 신규 가입",
            "value": today_signups,
            "suffix": "명",
            "delta": calc_delta(today_signups, yesterday_signups)
        },
        {
            "label": "답변 대기 문의",
            "value": ContactInquiry.objects.filter(status=ContactInquiry.Status.RECEIVED).count(),
            "suffix": "건",
            "delta": calc_delta(today_inquiries, yesterday_inquiries)
        }
    ]
    
    weeklyRequests = []
    # _date_range returns list of days in ascending order
    for day in days:
        m = metric_by_day.get(day)
        reqs = m.naming_requests if m else 0
        recs = reqs * 5
        weeklyRequests.append({"day": day.strftime("%m.%d"), "요청": reqs, "추천": recs})
        
    sourceDistribution = _metric_source_distribution(metrics)
        
    recent_histories = NamingHistory.objects.order_by("-created_at")[:5]
    recentRequests = []
    for h in recent_histories:
        recentRequests.append({
            "id": h.id,
            "time": h.created_at.strftime("%H:%M"),
            "user": mask_email(h.user.email) if h.user.email else "unknown",
            "query": h.query_text,
            "results": _result_count(h),
            "status": "완료"
        })
        
    return {
        "stats": stats,
        "weeklyRequests": weeklyRequests,
        "sourceDistribution": sourceDistribution,
        "recentRequests": recentRequests
    }

audit_router = Router()

@audit_router.get("/", response=List[AuditLogItemOut], auth=require_role(AdminProfile.Role.SUPERADMIN))
@paginate(AdminPagination)
def list_audit_logs(
    request,
    action: str | None = None,
    actor: str | None = None,
    targetType: str | None = None,
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
):
    qs = AdminAuditLog.objects.all().order_by("-created_at")
    if action:
        qs = qs.filter(action=action)
    if actor:
        qs = qs.filter(actor_username__icontains=actor)
    if targetType:
        qs = qs.filter(target_type=targetType)
    from_day = _parse_day(from_)
    to_day = _parse_day(to)
    if from_day:
        start = timezone.make_aware(datetime.combine(from_day, datetime.min.time()))
        qs = qs.filter(created_at__gte=start)
    if to_day:
        end = timezone.make_aware(datetime.combine(to_day + timedelta(days=1), datetime.min.time()))
        qs = qs.filter(created_at__lt=end)
    return qs


admin_api.add_router("/audit-logs", audit_router)


# ── 관리자 계정 관리 라우터 (§10, Phase 4) ──
accounts_router = Router()


@accounts_router.get("/", response=List[AdminAccountOut], auth=require_role(AdminProfile.Role.SUPERADMIN))
@paginate(AdminPagination)
def list_admin_accounts(
    request,
    role: str | None = None,
    active: bool | None = None,
    q: str | None = None,
):
    qs = AdminProfile.objects.select_related("user").all()
    if role:
        qs = qs.filter(role=role)
    if active is not None:
        qs = qs.filter(is_active_admin=active)
    if q:
        qs = qs.filter(Q(user__username__icontains=q) | Q(display_name__icontains=q))
    return qs.order_by("-created_at")


@accounts_router.post("/", response={201: AdminAccountOut}, auth=require_role(AdminProfile.Role.SUPERADMIN))
def create_admin_account(request, payload: AdminAccountCreateIn):
    if "@" in payload.username:
        raise HttpError(400, "아이디에 @를 포함할 수 없습니다.")
    if User.objects.filter(username=payload.username).exists():
        raise HttpError(409, "이미 존재하는 아이디입니다.")
        
    user = User.objects.create_user(
        username=payload.username,
        password=payload.password,
        is_staff=True
    )
    profile = AdminProfile.objects.create(
        user=user,
        role=payload.role,
        display_name=payload.displayName,
        must_change_password=True,
        created_by=request.auth
    )
    _log_audit(request, AdminAuditLog.Action.USER_UPDATE, target_id=profile.id, detail={"action": "create_admin", "role": payload.role})
    return 201, profile


@accounts_router.patch("/{account_id}", response=AdminAccountOut, auth=require_role(AdminProfile.Role.SUPERADMIN))
def update_admin_account(request, account_id: int, payload: AdminAccountUpdateIn):
    profile = get_object_or_404(AdminProfile.objects.select_related("user"), pk=account_id)
    if payload.displayName is not None:
        profile.display_name = payload.displayName
    if payload.isActiveAdmin is not None:
        if profile.user == request.auth and not payload.isActiveAdmin:
            raise HttpError(400, "자기 자신을 정지할 수 없습니다.")
        if profile.role == AdminProfile.Role.SUPERADMIN and not payload.isActiveAdmin:
            active_supers = AdminProfile.objects.filter(role=AdminProfile.Role.SUPERADMIN, is_active_admin=True).count()
            if active_supers <= 1 and profile.is_active_admin:
                raise HttpError(400, "마지막 활성 최고관리자는 정지할 수 없습니다.")
        profile.is_active_admin = payload.isActiveAdmin

    profile.save()
    _log_audit(request, AdminAuditLog.Action.USER_UPDATE, target_id=account_id, detail={"action": "update_admin"})
    return profile


@accounts_router.patch("/{account_id}/role", response=AdminAccountOut, auth=require_role(AdminProfile.Role.SUPERADMIN))
def update_admin_role(request, account_id: int, payload: AdminAccountRoleIn):
    profile = get_object_or_404(AdminProfile.objects.select_related("user"), pk=account_id)
    if profile.user == request.auth:
        raise HttpError(400, "자기 자신의 역할을 변경할 수 없습니다.")
    
    if profile.role == AdminProfile.Role.SUPERADMIN and payload.role != AdminProfile.Role.SUPERADMIN:
        active_supers = AdminProfile.objects.filter(role=AdminProfile.Role.SUPERADMIN, is_active_admin=True).count()
        if active_supers <= 1:
            raise HttpError(400, "마지막 활성 최고관리자를 강등할 수 없습니다.")
            
    old_role = profile.role
    profile.role = payload.role
    profile.save(update_fields=["role"])
    _log_audit(request, AdminAuditLog.Action.ROLE_CHANGE, target_id=account_id, detail={"before": old_role, "after": payload.role})
    return profile


@accounts_router.post("/{account_id}/unlock", response=AdminAccountOut, auth=require_role(AdminProfile.Role.SUPERADMIN))
def unlock_admin_account(request, account_id: int):
    profile = get_object_or_404(AdminProfile.objects.select_related("user"), pk=account_id)
    profile.failed_login_count = 0
    profile.locked_until = None
    profile.save(update_fields=["failed_login_count", "locked_until"])
    _log_audit(request, AdminAuditLog.Action.USER_UPDATE, target_id=account_id, detail={"action": "unlock_admin"})
    return profile


@accounts_router.post("/{account_id}/force-password-reset", response=AdminAccountOut, auth=require_role(AdminProfile.Role.SUPERADMIN))
def force_password_reset(request, account_id: int):
    profile = get_object_or_404(AdminProfile.objects.select_related("user"), pk=account_id)
    profile.must_change_password = True
    profile.save(update_fields=["must_change_password"])
    _log_audit(request, AdminAuditLog.Action.USER_UPDATE, target_id=account_id, detail={"action": "force_password_reset"})
    return profile


@accounts_router.delete("/{account_id}", auth=require_role(AdminProfile.Role.SUPERADMIN))
def delete_admin_account(request, account_id: int):
    profile = get_object_or_404(AdminProfile.objects.select_related("user"), pk=account_id)
    if profile.user == request.auth:
        raise HttpError(400, "자기 자신을 삭제할 수 없습니다.")
    if profile.role == AdminProfile.Role.SUPERADMIN:
        active_supers = AdminProfile.objects.filter(role=AdminProfile.Role.SUPERADMIN, is_active_admin=True).count()
        if active_supers <= 1 and profile.is_active_admin:
            raise HttpError(400, "마지막 활성 최고관리자는 삭제할 수 없습니다.")
    
    user = profile.user
    _log_audit(request, AdminAuditLog.Action.USER_DELETE, target_id=account_id, detail={"action": "delete_admin", "username": user.username})
    user.delete()
    return {"ok": True}


admin_api.add_router("/accounts", accounts_router)


# ── 문의 답변 템플릿 라우터 (Phase 6) ──



# ── API/LLM 사용 및 실시간 접속자 모니터링 라우터 (Phase 8 & 9) ──
api_usage_router = Router()

@api_usage_router.get("/active-users", auth=require_role(AdminProfile.Role.ADMIN))
def get_active_users(request):
    import time
    from django.core.cache import cache
    
    active_users = cache.get("active_users_dict", {})
    now = time.time()
    # 3분(180초) 이내 활동 기록이 있는 유저만 필터링
    active_users = {uid: ts for uid, ts in active_users.items() if now - ts < 180}
    
    return {"count": len(active_users), "loggedInCount": len(active_users)}

admin_api.add_router("/api-usage", api_usage_router)




# ── 사이트 문구 설정 라우터 (§10, Phase 5) ──

import datetime
from django.db.models import Sum, Count, Q
from django.utils import timezone

dashboard_router = Router()

@dashboard_router.get("/", response=AdminDashboardBundleOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_dashboard(request):
    total_users = User.objects.count()
    today_signups = User.objects.filter(date_joined__date=timezone.now().date()).count()
    total_naming = NamingHistory.objects.count()
    today_naming = NamingHistory.objects.filter(created_at__date=timezone.now().date()).count()
    
    pending_inquiries = ContactInquiry.objects.filter(status=ContactInquiry.Status.RECEIVED).count()
    total_inquiries = ContactInquiry.objects.count()

    stats = [
        {"label": "총 유저 수", "value": total_users, "suffix": "명", "delta": today_signups},
        {"label": "누적 작명 수", "value": total_naming, "suffix": "건", "delta": today_naming},
        {"label": "대기 중 문의", "value": pending_inquiries, "suffix": "건", "delta": total_inquiries},
    ]

    # Weekly Requests Mocked or Real
    # In a real app we query DailyMetric for the last 7 days
    recent_metrics = DailyMetric.objects.order_by('-date')[:7]
    weekly_requests = []
    source_distribution = []
    source_map = {}
    for m in reversed(recent_metrics):
        day_str = m.date.strftime("%a")
        weekly_requests.append({
            "day": day_str,
            "naming": m.naming_requests,
            "inquiries": m.inquiries
        })
        for k, v in m.source_distribution.items():
            source_map[k] = source_map.get(k, 0) + v
    
    for k, v in source_map.items():
        source_distribution.append({"name": k, "count": v})
        
    return {
        "stats": stats,
        "weeklyRequests": weekly_requests,
        "sourceDistribution": source_distribution
    }

stats_router = Router()

@stats_router.get("/", response=AdminStatsBundleOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_stats(request, frm: str = None, to: str = None):
    qs = DailyMetric.objects.all().order_by('date')
    if frm:
        qs = qs.filter(date__gte=datetime.datetime.strptime(frm, "%Y-%m-%d").date())
    if to:
        qs = qs.filter(date__lte=datetime.datetime.strptime(to, "%Y-%m-%d").date())
        
    points = []
    source_map = {}
    summary = {
        "signups": 0, "logins": 0, "namingRequests": 0,
        "inquiries": 0, "answeredInquiries": 0, "pendingInquiries": ContactInquiry.objects.filter(status=ContactInquiry.Status.RECEIVED).count()
    }
    
    for m in qs:
        points.append({
            "date": m.date.strftime("%m-%d"),
            "signups": m.signups,
            "logins": m.logins,
            "namingRequests": m.naming_requests,
            "inquiries": m.inquiries,
            "answeredInquiries": m.answered_inquiries
        })
        summary["signups"] += m.signups
        summary["logins"] += m.logins
        summary["namingRequests"] += m.naming_requests
        summary["inquiries"] += m.inquiries
        summary["answeredInquiries"] += m.answered_inquiries
        for k, v in m.source_distribution.items():
            source_map[k] = source_map.get(k, 0) + v
            
    source_distribution = [{"name": k, "count": v} for k, v in source_map.items()]
    return {
        "points": points,
        "summary": summary,
        "sourceDistribution": source_distribution
    }

system_router = Router()

@system_router.get("/health", response=AdminHealthOut, auth=require_role(AdminProfile.Role.ADMIN))
def get_health(request):
    return {
        "status": "ok",
        "checkedAt": timezone.now().isoformat(),
        "services": [
            {"name": "Database", "status": "ok", "detail": "PostgreSQL is running"},
            {"name": "Redis", "status": "ok", "detail": "Cache is operational"},
            {"name": "FastAPI", "status": "unknown", "detail": "Status unknown"}
        ]
    }

admin_api.add_router("/dashboard", dashboard_router)
admin_api.add_router("/stats", stats_router)
admin_api.add_router("/system", system_router)
