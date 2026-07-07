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
  | "notices"
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

export type MyPageSection = "profile" | "password" | "history" | "account";

/** 관리자 화면 여부 — App에서 GNB 숨김/AdminLayout 분기에 사용 */
export function isAdminScreen(s: Screen): boolean {
  return s.startsWith("admin");
}

/** 로그인 사용자 (Django 세션 기반 인증) */
export interface AuthUser {
  name: string;
  username: string;
  email: string;
  role: "user" | "admin";
  joinedAt?: string;
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

export type FaqCategory = string;

export interface FaqItem {
  id: number;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface NoticeItem {
  id: number;
  title: string;
  body?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface AdminWeeklyRequest {
  day: string;
  요청: number;
  추천: number;
}

export interface AdminSourceDistribution {
  name: string;
  count: number;
}

export interface AdminRecentRequest {
  id: number;
  time: string;
  user: string;
  query: string;
  results: number;
  status: "완료" | "진행 중";
}

export interface AdminStatsPoint {
  date: string;
  signups: number;
  logins: number;
  namingRequests: number;
  inquiries: number;
  answeredInquiries: number;
}

export interface AdminStatsSummary {
  signups: number;
  logins: number;
  namingRequests: number;
  inquiries: number;
  answeredInquiries: number;
  pendingInquiries: number;
}

export interface AdminStatsBundle {
  points: AdminStatsPoint[];
  summary: AdminStatsSummary;
  sourceDistribution: AdminSourceDistribution[];
}

export interface AdminHealthService {
  name: string;
  status: "ok" | "error" | "unknown";
  detail: string;
}

export interface AdminHealth {
  status: "ok" | "error";
  checkedAt: string;
  services: AdminHealthService[];
}

export interface AdminAuditLogItem {
  id: number;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: unknown;
  ip: string | null;
  createdAt: string;
}

// 한자/출처 관리(AdminHanjaRow/AdminSourceRow)는 관리자페이지 개발 계획서 §2.1에 따라
// 게시물 관리(AdminPostRow 등, 아래)로 대체되어 제거되었다. 한자 데이터는 추천
// 파이프라인(FastAPI/Chroma/Neo4j) 내부 자산으로만 남고 관리자 UI에서 다루지 않는다.

// 관리자페이지 개발 계획서 §9 UserProfile 모델과 값을 맞춘다(서버가 진실 원천).
export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
export type AdminApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminUserRow {
  id: number;
  /** 목록 응답은 항상 마스킹된 값(§5.1) — 원본은 상세 조회에서만 role에 따라 노출 */
  name: string;
  email: string;
  /** ISO 문자열(서버가 datetime 그대로 내려줌) */
  joinedAt: string;
  status: AdminUserStatus;
  approvalStatus: AdminApprovalStatus;
  requests: number;
  saved: number;
}

/** GET /api/admin/users/{id} 응답 — ADMIN 이상은 masked=false(전체 PII), ANALYST는 masked=true */
export interface AdminUserDetail extends AdminUserRow {
  rejectedReason: string;
  isDeleted: boolean;
  masked: boolean;
}

/** §10 응답 규약 — 목록 계열 엔드포인트가 공통으로 쓰는 페이지 포맷 */
export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminActivityLogItem {
  id: number;
  type: "login" | "naming";
  /** ISO 문자열 */
  createdAt: string;
  detail: string;
  success: boolean | null;
  results?: any[];
}

// ─── 게시물 관리 (§9·§10, Phase 2 — 한자 화면 대체 §2.1) ───────────────────────

export type AdminPostStatus = "PUBLISHED" | "PRIVATE" | "DELETED";

export interface AdminPostCategory {
  id: number;
  name: string;
  order: number;
}

export interface AdminPostRow {
  id: number;
  title: string;
  status: AdminPostStatus;
  categoryId: number;
  categoryName: string;
  authorName: string;
  /** ISO 문자열 */
  updatedAt: string;
}

export interface AdminPostDetail extends AdminPostRow {
  body: string;
  /** ISO 문자열 — 게시 상태가 된 적 없으면 null */
  publishedAt: string | null;
}

// ─── 공지사항 관리 (§9·§10, Phase 2) ───────────────────────────────────────────

export type AdminNoticeStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ENDED";

export interface AdminNoticeRow {
  id: number;
  title: string;
  status: AdminNoticeStatus;
  isPinned: boolean;
  /** ISO 문자열 */
  startAt: string | null;
  /** ISO 문자열 */
  endAt: string | null;
  /** ISO 문자열 */
  updatedAt: string;
}

export interface AdminNoticeDetail extends AdminNoticeRow {
  body: string;
}

// ─── 문의 관리 (§9·§10, Phase 2) ───────────────────────────────────────────────
// 서버 ContactInquiry.Status는 소문자(received/in_progress/answered)를 그대로 쓴다.

export type AdminInquiryStatus = "received" | "in_progress" | "answered";

export interface AdminInquiryRow {
  id: number;
  name: string;
  email: string;
  topic: string;
  subject: string;
  status: AdminInquiryStatus;
  /** ISO 문자열 */
  createdAt: string;
}

export interface AdminInquiryDetail extends AdminInquiryRow {
  message: string;
  adminReply: string;
  /** ISO 문자열 — 답변 전이면 null */
  answeredAt: string | null;
}

// ─── FAQ 관리 (§9·§10, Phase 2 — 관리자 CRUD만) ─────────────────────────────────
// 사용자 화면(SupportScreen FAQ 탭)의 FaqCategory(service/evidence/account)와는
// 별개 체계다 — 연동은 백로그(사용자 확정).

export interface AdminFaqCategory {
  id: number;
  name: string;
  order: number;
}

export interface AdminFaqRow {
  id: number;
  question: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  order: number;
  /** ISO 문자열 */
  updatedAt: string;
}

export interface AdminFaqDetail extends AdminFaqRow {
  answer: string;
}

// ─── 관리자 계정 관리 (§10, Phase 4) ───────────────────────────────────────────

export type AdminRole = "SUPERADMIN" | "ADMIN" | "ANALYST";

export interface AdminAccount {
  id: number;
  username: string;
  displayName: string;
  role: AdminRole;
  isActiveAdmin: boolean;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── 서비스 설정 및 문구 관리 (§10, Phase 5) ────────────────────────────────────

export interface SiteTextSetting {
  key: string;
  label: string;
  value: string;
  description: string;
  updatedAt: string;
}

// ─── 문의 답변 템플릿 (§10, Phase 6) ──────────────────────────────────────────
export interface AdminInquiryTemplate {
  id: number;
  category: string;
  title: string;
  body: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API 모니터링 및 실시간 접속자 (§10, Phase 8 & 9) ──────────────────────────
export interface ApiUsageSummaryPoint {
  date: string;
  requests: number;
  failures: number;
  failureRate: number;
  avgLatency: number;
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
}

export interface ApiUsageStats {
  totalRequests: number;
  failureRate: number;
  avgLatency: number;
  totalCost: number;
  points: ApiUsageSummaryPoint[];
}

export interface ApiErrorLogItem {
  id: number;
  createdAt: string;
  endpoint: string;
  statusCode: number;
  errorType: string;
  latencyMs: number;
  modelName: string;
}
