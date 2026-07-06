// ─── 문(대문) 연출 — 브라우저 세션당 1회 노출 ─────────────────────────────────
// 브라우저에 처음 접속했을 때(=이 세션에서 아직 대문을 본 적 없을 때)만 보여주고,
// 새로고침하거나 다른 페이지에서 다시 진입해도 같은 세션 동안에는 다시 보여주지 않는다.
// 로그인 여부와는 무관하다 — 로그인 전/후 어느 화면이 먼저 뜨든 세션당 딱 한 번만 재생된다.

const GATE_SHOWN_SESSION_KEY = "mg-gate-shown";

export function hasSeenGateThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GATE_SHOWN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGateSeenThisSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GATE_SHOWN_SESSION_KEY, "1");
  } catch {
    // 세션 스토리지를 쓸 수 없어도(프라이빗 모드 등) 기능에 지장이 없도록 무시한다.
  }
}
