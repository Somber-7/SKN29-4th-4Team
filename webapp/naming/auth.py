# ─── 관리자 API 인증·인가 (관리자페이지 개발 계획서 §4.2 · §15.5) ────────────────
# Django Ninja는 FastAPI의 Depends()가 없다(공식 미지원 — vitalik/django-ninja#1155).
# 대신 Ninja가 실제로 제공하는 확장점인 "auth=" 콜러블을 사용해 인증(401)과
# 역할 검사(403)를 함께 수행한다. require_role("ADMIN")은 라우터/오퍼레이션의
# auth=에 그대로 넘기는 팩토리 — 계획서의 "require_role() 의존성"과 동일한 효과.

from ninja.errors import HttpError

from .models import AdminProfile

# 역할 서열 — 상위 역할일수록 하위 역할의 권한을 포함한다.
ROLE_ORDER = {
    AdminProfile.Role.ANALYST: 0,
    AdminProfile.Role.ADMIN: 1,
    AdminProfile.Role.SUPERADMIN: 2,
}

# 권한 매트릭스(§4.2)를 서버 단일 상수로 관리 — 프론트는 /api/admin/me가
# 반환하는 permissions 배열만 보고 메뉴/버튼을 그린다. 최종 판정은 각 엔드포인트의
# auth=require_role(...)이 서버에서 강제한다.
PERMISSION_MATRIX: dict[str, str] = {
    "dashboard.view": AdminProfile.Role.ANALYST,
    "stats.view": AdminProfile.Role.ANALYST,
    "system.health": AdminProfile.Role.ANALYST,
    "users.view": AdminProfile.Role.ANALYST,
    "users.activity_log": AdminProfile.Role.ANALYST,
    "users.pii_view": AdminProfile.Role.ADMIN,
    "users.write": AdminProfile.Role.ADMIN,
    "users.status": AdminProfile.Role.ADMIN,
    "users.delete": AdminProfile.Role.ADMIN,
    "users.approval": AdminProfile.Role.ADMIN,
    "users.export": AdminProfile.Role.SUPERADMIN,
    "posts.write": AdminProfile.Role.ADMIN,
    "inquiries.write": AdminProfile.Role.ADMIN,
    "faqs.write": AdminProfile.Role.ADMIN,
    "notices.write": AdminProfile.Role.ADMIN,
    "accounts.manage": AdminProfile.Role.SUPERADMIN,
    "roles.manage": AdminProfile.Role.SUPERADMIN,
    "audit.view": AdminProfile.Role.SUPERADMIN,
    "settings.manage": AdminProfile.Role.ADMIN,
}


def permissions_for(role: str) -> list[str]:
    """해당 역할이 가진 권한 키 목록 — /api/admin/me 응답에 그대로 실어 보낸다."""
    order = ROLE_ORDER[role]
    return [key for key, min_role in PERMISSION_MATRIX.items() if order >= ROLE_ORDER[min_role]]


class AdminAuth:
    """세션 인증 + is_staff + 관리자 프로필 활성 여부 검증.

    비로그인은 None을 반환해 Ninja가 401을 내려주게 하고, 로그인은 했지만 관리자가
    아닌 경우는 HttpError(403)을 직접 던진다 — §14 검증 케이스 1(비로그인 401)과
    2(일반 사용자 403)를 구분하기 위함(§2 확정 사항 3 — 서버 강제)."""

    def __call__(self, request):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None  # 비로그인 — 401
        if not user.is_staff:
            raise HttpError(403, "관리자 권한이 없습니다.")
        profile = getattr(user, "admin_profile", None)
        if profile is None or not profile.is_active_admin:
            raise HttpError(403, "정지된 관리자 계정입니다.")
        request.admin_profile = profile
        return user


admin_auth = AdminAuth()


class _RoleAuth(AdminAuth):
    """AdminAuth를 통과한 뒤 최소 역할을 검사한다. 역할 미달이면 403(HttpError)."""

    def __init__(self, min_role: str):
        self.min_role = min_role

    def __call__(self, request):
        user = super().__call__(request)
        if user is None:
            return None  # 비로그인/비관리자 — 401
        if ROLE_ORDER[request.admin_profile.role] < ROLE_ORDER[self.min_role]:
            raise HttpError(403, "이 작업을 수행할 권한이 없습니다.")
        return user


def require_role(min_role: str):
    """require_role("ADMIN")처럼 사용 — 엔드포인트/라우터의 auth=에 넘기는 팩토리."""
    return _RoleAuth(min_role)
