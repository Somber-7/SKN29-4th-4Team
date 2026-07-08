# ─── 회원 소프트 삭제 공용 로직 (관리자페이지 개발 계획서 §15.3) ────────────────
# 관리자 삭제(api.py의 DELETE /api/admin/users/{id})와 회원 자기 탈퇴(views.py의
# DELETE /api/me)가 동일한 정책을 공유해야 감사 추적(NamingHistory·LoginHistory
# CASCADE)이 끊기지 않는다 — 두 경로 모두 이 모듈을 통해서만 회원을 삭제한다.
# 유예 기간 없음(사용자 확정: "탈퇴 유예 없애줘") — 즉시 재가입 허용.

from django.utils import timezone

from .models import UserProfile


def get_or_create_profile(user) -> UserProfile:
    """레거시 계정(모델 도입 이전 가입) 등 profile이 없는 경우를 방어적으로 처리."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile

