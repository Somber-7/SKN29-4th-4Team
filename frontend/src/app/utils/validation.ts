// ─── 공통 폼 검증 유틸 ────────────────────────────────────────────────────────

/** 간단한 이메일 형식 검사 (로그인·회원가입·문의·관리자 설정 공용) */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
