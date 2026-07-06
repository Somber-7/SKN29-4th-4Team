import type { AdminHanjaRow, AdminSourceRow, AdminStat, AdminUserRow } from "@/app/types";

// TODO(API): GET /admin/metrics 등으로 대체
// ─── 관리자 화면 더미 데이터 (UI 전용) ───────────────────────────────────────
// 이관 전 위치: src/app/data/admin.ts (원본은 _deprecated/app-data/admin.ts 보관)

export const ADMIN_STATS: AdminStat[] = [
  { label: "오늘 작명 요청", value: 128, suffix: "건", delta: 12.4 },
  { label: "누적 추천 이름", value: 24380, suffix: "개", delta: 3.1 },
  { label: "이번 주 신규 가입", value: 342, suffix: "명", delta: -4.2 },
  { label: "답변 대기 문의", value: 17, suffix: "건", delta: 8.0 },
];

/** 최근 7일 작명 요청 추이 */
export const WEEKLY_REQUESTS = [
  { day: "6.25", 요청: 86, 추천: 430 },
  { day: "6.26", 요청: 94, 추천: 470 },
  { day: "6.27", 요청: 132, 추천: 660 },
  { day: "6.28", 요청: 158, 추천: 790 },
  { day: "6.29", 요청: 121, 추천: 605 },
  { day: "6.30", 요청: 103, 추천: 515 },
  { day: "7.1", 요청: 128, 추천: 640 },
];

/** 근거 출처 유형별 인용 횟수 (이번 주) */
export const SOURCE_DISTRIBUTION = [
  { name: "자원오행", count: 1240 },
  { name: "81수리", count: 1180 },
  { name: "인명용 한자", count: 990 },
  { name: "학술 논문", count: 420 },
];

/** 대시보드 하단 — 최근 작명 요청 */
export const RECENT_REQUESTS = [
  { id: 501, time: "14:22", user: "kim***@naver.com", query: "김씨 성, 불(火) 기운 보완, 두 글자 여자 이름", results: 5, status: "완료" },
  { id: 500, time: "14:05", user: "lee***@gmail.com", query: "이씨, 획수 좋고 부르기 쉬운 남자 이름", results: 5, status: "완료" },
  { id: 499, time: "13:48", user: "par***@daum.net", query: "박씨 개명용, 차분한 인상의 이름", results: 5, status: "완료" },
  { id: 498, time: "13:31", user: "cho***@naver.com", query: "최씨, 밝다는 뜻이 들어간 중성적 이름", results: 5, status: "진행 중" },
  { id: 497, time: "13:12", user: "jun***@kakao.com", query: "정씨, 첫째 하윤이랑 어울리는 둘째 이름", results: 5, status: "완료" },
];

export const ADMIN_HANJA_ROWS: AdminHanjaRow[] = [
  { id: 1, char: "賢", reading: "현", meaning: "어질 현", strokes: 15, element: "土", inCourtList: true, updatedAt: "2026.06.30" },
  { id: 2, char: "道", reading: "도", meaning: "길 도", strokes: 12, element: "水", inCourtList: true, updatedAt: "2026.06.30" },
  { id: 3, char: "瑞", reading: "서", meaning: "상서 서", strokes: 13, element: "水", inCourtList: true, updatedAt: "2026.06.28" },
  { id: 4, char: "俊", reading: "준", meaning: "준재 준", strokes: 9, element: "木", inCourtList: true, updatedAt: "2026.06.28" },
  { id: 5, char: "智", reading: "지", meaning: "슬기 지", strokes: 12, element: "木", inCourtList: true, updatedAt: "2026.06.25" },
  { id: 6, char: "皓", reading: "호", meaning: "밝을 호", strokes: 12, element: "水", inCourtList: true, updatedAt: "2026.06.25" },
  { id: 7, char: "娟", reading: "연", meaning: "고울 연", strokes: 10, element: "土", inCourtList: true, updatedAt: "2026.06.22" },
  { id: 8, char: "昀", reading: "윤", meaning: "햇빛 윤", strokes: 8, element: "火", inCourtList: true, updatedAt: "2026.06.22" },
  { id: 9, char: "彗", reading: "혜", meaning: "살별 혜", strokes: 11, element: "火", inCourtList: false, updatedAt: "2026.06.20" },
  { id: 10, char: "澈", reading: "철", meaning: "맑을 철", strokes: 15, element: "水", inCourtList: true, updatedAt: "2026.06.18" },
  { id: 11, char: "岍", reading: "견", meaning: "산이름 견", strokes: 7, element: "土", inCourtList: false, updatedAt: "2026.06.15" },
  { id: 12, char: "赫", reading: "혁", meaning: "빛날 혁", strokes: 14, element: "火", inCourtList: true, updatedAt: "2026.06.12" },
];

export const ADMIN_SOURCE_ROWS: AdminSourceRow[] = [
  { id: 1, type: "beopryeong", label: "대법원 인명용 한자표 (2025 개정)", publisher: "대법원", year: 2025, linked: 8142, status: "게시" },
  { id: 2, type: "suri", label: "81수리 성명학 해석표", publisher: "내부 편찬", year: 2024, linked: 3120, status: "게시" },
  { id: 3, type: "hanja", label: "한자 자원오행 사전", publisher: "내부 편찬", year: 2024, linked: 5480, status: "게시" },
  { id: 4, type: "nonmun", label: "논문: 인명용한자의 자원오행 연구 (2019)", publisher: "KCI", year: 2019, linked: 412, status: "게시" },
  { id: 5, type: "nonmun", label: "논문: 신생아 이름의 음절 특성과 성별 경향 (2022)", publisher: "KCI", year: 2022, linked: 268, status: "게시" },
  { id: 6, type: "nonmun", label: "논문: 개명 신청 사유의 유형 분석 (2021)", publisher: "KCI", year: 2021, linked: 95, status: "검수 중" },
];

export const ADMIN_USER_ROWS: AdminUserRow[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@naver.com", joinedAt: "2026.06.29", requests: 4, saved: 3, status: "활성" },
  { id: 2, name: "이준서", email: "junseo.lee@gmail.com", joinedAt: "2026.06.27", requests: 2, saved: 1, status: "활성" },
  { id: 3, name: "박서연", email: "seoyeon.park@daum.net", joinedAt: "2026.06.24", requests: 7, saved: 5, status: "활성" },
  { id: 4, name: "최민준", email: "minjun.choi@kakao.com", joinedAt: "2026.06.20", requests: 1, saved: 0, status: "활성" },
  { id: 5, name: "정다은", email: "daeun.jung@naver.com", joinedAt: "2026.05.18", requests: 3, saved: 2, status: "휴면" },
  { id: 6, name: "강도윤", email: "doyun.kang@gmail.com", joinedAt: "2026.05.02", requests: 0, saved: 0, status: "휴면" },
  { id: 7, name: "윤대성", email: "daesung.yun@naver.com", joinedAt: "2026.04.11", requests: 12, saved: 8, status: "활성" },
  { id: 8, name: "임소율", email: "soyul.lim@daum.net", joinedAt: "2026.03.30", requests: 5, saved: 1, status: "정지" },
];
