import json
from functools import wraps

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .forms import (
    ChangePasswordForm,
    CheckEmailForm,
    FindUsernameForm,
    ForgotPasswordForm,
    LoginForm,
    PasswordResetIdentityForm,
    SignupForm,
    UpdateProfileForm,
    WithdrawForm,
)
from .models import NamingHistory, UserConsent


def _error(message, status=400, detail=None):
    return JsonResponse({"message": message, "detail": detail}, status=status)


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


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


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
    user = authenticate(request, username=username, password=form.cleaned_data["password"])
    if user is None:
        return _error("아이디 또는 비밀번호를 확인해 주세요.", 401)

    django_login(request, user)
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

    user = User.objects.create_user(
        username=form.cleaned_data["username"],
        email=form.cleaned_data["email"],
        password=form.cleaned_data["password"],
        first_name=form.cleaned_data["name"],
    )

    now = timezone.now()
    UserConsent.objects.create(
        user=user,
        terms_version=form.cleaned_data["termsVersion"],
        privacy_version=form.cleaned_data["privacyVersion"],
        terms_agreed_at=now,
        privacy_agreed_at=now,
        agreed_ip=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:1000],
    )
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
        for item in NamingHistory.objects.filter(user=request.user):
            results = item.results or []
            first = results[0] if results else {}
            entries.append({
                "id": item.id,
                "date": item.created_at.strftime("%Y.%m.%d"),
                "query": item.query_text,
                "resultCount": len(results),
                "savedCount": 0,
                "topName": {"hanja": first.get("hanja", ""), "hangul": first.get("hangul", "")},
                "status": "완료",
            })
        return JsonResponse(entries, safe=False)

    body = _parse_json(request)
    NamingHistory.objects.create(
        user=request.user,
        query_text=body.get("query", ""),
        request_payload=body.get("request", {}),
        results=body.get("results", []),
    )
    return JsonResponse({}, status=201)


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
        request.user.delete()
        django_logout(request)
        return HttpResponse(status=204)

    form = UpdateProfileForm(_parse_json(request), user=request.user)
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    request.user.email = form.cleaned_data["email"]
    request.user.save(update_fields=["email"])
    return JsonResponse(_user_to_auth_user(request.user))


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
