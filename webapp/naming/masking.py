# ─── PII 마스킹 헬퍼 (관리자페이지 개발 계획서 §5.1) ────────────────────────────
# 마스킹은 서버 직렬화 단계에서만 수행한다(§5.1) — 목록 응답의 email/name 필드는
# 항상 이 함수들을 거친 값만 담고, 원본은 상세 조회(§5.2, 역할 분기)에서만 노출한다.


def mask_email(email: str) -> str:
    """로컬파트 앞 3자 유지(3자 미만이면 1자)+'***', 도메인은 그대로 노출."""
    if not email or "@" not in email:
        return email
    local, domain = email.split("@", 1)
    visible = local[:3] if len(local) >= 3 else local[:1]
    return f"{visible}***@{domain}"


def mask_name(name: str) -> str:
    """첫·끝 1자 유지, 중간은 '*'(2자면 '이름 첫 글자'+'*')."""
    if not name or len(name) <= 1:
        return name
    if len(name) == 2:
        return f"{name[0]}*"
    return f"{name[0]}{'*' * (len(name) - 2)}{name[-1]}"
