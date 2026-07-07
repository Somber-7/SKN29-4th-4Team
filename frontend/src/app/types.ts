// ─── Shared types ─────────────────────────────────────────────────────────────

export type Screen =
  | "landing"
  | "gate"
  | "input"
  | "processing"
  | "results"
  | "chat"
  | "intro"
  | "login"
  | "signup"
  // ── 사용자용 신규 화면 ──
  | "insights"
  | "faq"
  | "contact"
  | "history"
  | "mypage"
  | "terms"
  | "privacy"
  | "notFound"
  // ── 관리자 화면 그룹 (일반 GNB/푸터 없이 AdminLayout 사용) ──
  | "adminDashboard"
  | "adminContent"
  | "adminUsers"
  | "adminSettings";

/** 관리자 화면 여부 — App에서 GNB 숨김/AdminLayout 분기에 사용 */
export function isAdminScreen(s: Screen): boolean {
  return s.startsWith("admin");
}

/** 로그인 사용자 (시안 단계 — sessionStorage 기반 데모 인증) */
export interface AuthUser {
  name: string;
  email: string;
  role: "user" | "admin";
}

// ─── 작명 요청 DTO ──────────────────────────────────────────────────────────────
// TODO(API): POST /naming-api/names/generate 의 body 계약. 자연어/상세조건 두 모드를
// discriminated union으로 구분한다. 자연어 파싱(NLU)은 백엔드의 역할이며,
// nameQueryParser.parseNameQuery는 입력 미리보기 칩 용도로만 프론트에 남아있다.
export type NameRequest =
  | { type: "natural"; query: string; excludeNames?: string[] }
  | {
      type: "structured";
      lastName: string;
      gender?: "남자" | "여자";
      elements?: string[];
      strokeRange?: string;
      meaning?: string;
      /** 재생성 시 제외할 기존 추천 이름(hangul) — 백엔드가 동일 이름 재추천을 방지 */
      excludeNames?: string[];
    };

export type SourceType = "hanja" | "suri" | "beopryeong" | "nonmun";

export interface CharBreakdown {
  char: string;
  reading: string;
  meaning: string;
  strokes: number;
  element: string;
}

export interface SukgyeokDetail {
  /** 원격 · 형격 · 이격 · 정격 */
  name: string;
  value: number;
  fortune: string;
}

export interface NameResult {
  id: number;
  /** 사용자가 입력한 성씨 */
  lastName: CharBreakdown;
  /** 이름(주어진 이름)의 한자 */
  hanja: string;
  /** 이름(주어진 이름)의 한글 */
  hangul: string;
  ruby: CharBreakdown[];
  sukgyeok: string;
  sukgyeokDetail: SukgyeokDetail[];
  sources: { type: SourceType; label: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export type FaqCategory = "service" | "evidence" | "account";

export interface FaqItem {
  id: number;
  category: FaqCategory;
  question: string;
  answer: string;
}

// ─── 작명 기록 (History) ──────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number;
  /** YYYY.MM.DD */
  date: string;
  /** 사용자가 입력한 자연어 조건 */
  query: string;
  resultCount: number;
  savedCount: number;
  /** 추천 결과 중 대표 이름 미리보기 */
  topName: { hanja: string; hangul: string };
  status: "완료" | "진행 중";
}

// ─── 관리자 (Admin, UI 전용 더미) ─────────────────────────────────────────────

export interface AdminStat {
  label: string;
  value: number;
  suffix?: string;
  /** 전주 대비 증감 (%) */
  delta: number;
}

export interface AdminHanjaRow {
  id: number;
  char: string;
  reading: string;
  meaning: string;
  strokes: number;
  element: string;
  /** 대법원 인명용 한자 등재 여부 */
  inCourtList: boolean;
  updatedAt: string;
}

export interface AdminSourceRow {
  id: number;
  type: SourceType;
  label: string;
  publisher: string;
  year: number;
  /** 이 출처가 연결된 추천 이름 수 */
  linked: number;
  status: "게시" | "검수 중";
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  requests: number;
  saved: number;
  status: "활성" | "휴면" | "정지";
}
