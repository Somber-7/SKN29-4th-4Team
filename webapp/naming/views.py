import json

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .forms import ChangePasswordForm, ForgotPasswordForm, LoginForm, SignupForm, UpdateProfileForm
from .models import NamingHistory


def _error(message, status=400, detail=None):
    return JsonResponse({"message": message, "detail": detail}, status=status)


def _user_to_auth_user(user):
    return {
        "name": user.first_name or user.username,
        "email": user.email,
        "role": "admin" if user.is_staff else "user",
    }


def _parse_json(request):
    try:
        return json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return {}


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@require_http_methods(["POST"])
def login_view(request):
    form = LoginForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    email = form.cleaned_data["email"].strip().lower()
    user = authenticate(request, username=email, password=form.cleaned_data["password"])
    if user is None:
        return _error("이메일 또는 비밀번호를 확인해 주세요.", 401)

    django_login(request, user)
    return JsonResponse(_user_to_auth_user(user))


@require_http_methods(["POST"])
def signup_view(request):
    form = SignupForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    email = form.cleaned_data["email"]
    user = User.objects.create_user(
        username=email,
        email=email,
        password=form.cleaned_data["password"],
        first_name=form.cleaned_data["name"],
    )
    django_login(request, user)
    return JsonResponse({}, status=201)


@require_http_methods(["POST"])
def forgot_password_view(request):
    form = ForgotPasswordForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)
    # 이메일 발송은 범위 밖 — 계정 존재 여부 노출 방지를 위해 항상 200
    return JsonResponse({}, status=200)


@login_required
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


@login_required
@require_http_methods(["PATCH", "DELETE"])
def me_view(request):
    if request.method == "DELETE":
        request.user.delete()
        django_logout(request)
        return JsonResponse({}, status=204)

    form = UpdateProfileForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    if form.cleaned_data.get("name"):
        request.user.first_name = form.cleaned_data["name"]
        request.user.save(update_fields=["first_name"])
    return JsonResponse(_user_to_auth_user(request.user))


@login_required
@require_http_methods(["POST"])
def change_password_view(request):
    form = ChangePasswordForm(_parse_json(request))
    if not form.is_valid():
        return _error("입력값이 올바르지 않습니다.", 400, form.errors)

    if not request.user.check_password(form.cleaned_data["currentPassword"]):
        return _error("현재 비밀번호가 올바르지 않습니다.", 400)

    request.user.set_password(form.cleaned_data["nextPassword"])
    request.user.save(update_fields=["password"])
    update_session_auth_hash(request, request.user)
    return JsonResponse({}, status=200)
