# ─── 관리자 세션 쿠키 격리 (관리자페이지 개발 계획서 §15.1) ─────────────────────
# Django SessionMiddleware는 프로세스 전역 설정(SESSION_COOKIE_NAME 등) 하나만 써서
# 도메인당 세션 쿠키 하나를 다룬다. 그대로 두면 같은 브라우저에서 일반 로그인과
# 관리자 로그인이 같은 sessionid 쿠키를 덮어써 서로를 로그아웃시킬 수 있다(레드팀 1.1).
#
# 이 미들웨어는 SessionMiddleware를 상속해, 요청 경로가 /api/admin/이면 쿠키 이름·
# 경로·만료를 관리자 전용 값으로 바꿔 물리적으로 분리하고, 그 외 경로는 부모 클래스와
# 완전히 동일하게 동작한다(로직은 Django 6.0 SessionMiddleware.process_response를 그대로
# 따르되 상수만 관리자용으로 교체). settings.MIDDLEWARE에서 기존 SessionMiddleware
# 자리를 이 클래스로 대체한다.

import time

from django.conf import settings
from django.core.cache import cache
from django.contrib.sessions.backends.base import UpdateError
from django.contrib.sessions.exceptions import SessionInterrupted
from django.contrib.sessions.middleware import SessionMiddleware
from django.utils.cache import patch_vary_headers
from django.utils.http import http_date

ADMIN_PATH_PREFIX = "/api/admin/"
ADMIN_SESSION_COOKIE_NAME = "admin_sessionid"
ADMIN_SESSION_COOKIE_PATH = "/api/admin/"
ADMIN_SESSION_COOKIE_AGE = 60 * 60 * 8  # 8시간 — 매 요청 접근 시 갱신되는 유휴 타임아웃


class AdminSessionMiddleware(SessionMiddleware):
    def process_request(self, request):
        if not request.path.startswith(ADMIN_PATH_PREFIX):
            return super().process_request(request)
        session_key = request.COOKIES.get(ADMIN_SESSION_COOKIE_NAME)
        request.session = self.SessionStore(session_key)

    def process_response(self, request, response):
        if not request.path.startswith(ADMIN_PATH_PREFIX):
            return super().process_response(request, response)

        try:
            accessed = request.session.accessed
            modified = request.session.modified
            empty = request.session.is_empty()
        except AttributeError:
            return response

        if ADMIN_SESSION_COOKIE_NAME in request.COOKIES and empty:
            response.delete_cookie(
                ADMIN_SESSION_COOKIE_NAME,
                path=ADMIN_SESSION_COOKIE_PATH,
                domain=settings.SESSION_COOKIE_DOMAIN,
                samesite=settings.SESSION_COOKIE_SAMESITE,
            )
            need_vary_cookie = True
        else:
            # accessed만 되어도 갱신 대상으로 본다 — 로그인 유지 중인 관리자가 조회만 해도
            # 8시간 유휴 타임아웃이 매 요청마다 뒤로 밀리게 하기 위함("idle timeout", §15.1).
            need_vary_cookie = accessed
            if (accessed or modified) and not empty:
                request.session.set_expiry(ADMIN_SESSION_COOKIE_AGE)
                max_age = ADMIN_SESSION_COOKIE_AGE
                expires = http_date(time.time() + max_age)
                if response.status_code < 500:
                    try:
                        request.session.save()
                    except UpdateError:
                        raise SessionInterrupted(
                            "관리자 세션이 요청 처리 중 삭제되었습니다. "
                            "동시 요청에서 로그아웃되었을 수 있습니다."
                        )
                    response.set_cookie(
                        ADMIN_SESSION_COOKIE_NAME,
                        request.session.session_key,
                        max_age=max_age,
                        expires=expires,
                        domain=settings.SESSION_COOKIE_DOMAIN,
                        path=ADMIN_SESSION_COOKIE_PATH,
                        secure=settings.ADMIN_SESSION_COOKIE_SECURE or None,
                        httponly=True,
                        samesite=settings.SESSION_COOKIE_SAMESITE,
                    )
                    need_vary_cookie = True
        if need_vary_cookie:
            patch_vary_headers(response, ("Cookie",))
        return response


class ActiveUserMiddleware:
    """최근 3분 이내에 요청을 보낸 인증된 사용자(활성 유저)를 추적합니다."""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            active_users = cache.get("active_users_dict", {})
            now = time.time()
            active_users[request.user.id] = now
            # 3분(180초) 초과된 유저는 삭제
            active_users = {uid: ts for uid, ts in active_users.items() if now - ts < 180}
            cache.set("active_users_dict", active_users, 300)
            
        return self.get_response(request)
