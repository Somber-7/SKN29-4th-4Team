import type { AdminStat, AdminUserRow } from "@/app/types";

export const ADMIN_ACCOUNTS: any[] = [];
export const ADMIN_FAQ_CATEGORIES: any[] = [];
export const ADMIN_FAQS: any[] = [];
export const ADMIN_INQUIRIES: any[] = [
  {
    id: 101,
    name: "김하늘",
    email: "haneul.kim@naver.com",
    topic: "작명 결과",
    subject: "추천 이름의 한자 의미를 더 알고 싶습니다",
    status: "received",
    createdAt: "2026-07-07T14:22:00+09:00",
  },
  {
    id: 100,
    name: "이준서",
    email: "junseo.lee@gmail.com",
    topic: "계정",
    subject: "마이페이지 작명 기록이 보이지 않습니다",
    status: "in_progress",
    createdAt: "2026-07-07T13:10:00+09:00",
  },
  {
    id: 99,
    name: "박서연",
    email: "seoyeon.park@daum.net",
    topic: "결제",
    subject: "서비스 이용권 결제 가능 여부 문의",
    status: "answered",
    createdAt: "2026-07-06T17:40:00+09:00",
  },
  {
    id: 98,
    name: "최민준",
    email: "minjun.choi@kakao.com",
    topic: "기타",
    subject: "개명용 이름 추천도 가능한가요?",
    status: "answered",
    createdAt: "2026-07-06T11:25:00+09:00",
  },
];
export const ADMIN_NOTICES: any[] = [];
export const ADMIN_POST_CATEGORIES: any[] = [];
export const ADMIN_POSTS: any[] = [];
export const ADMIN_STATS: AdminStat[] = [
  { label: "오늘 작명 요청", value: 128, suffix: "건", delta: 12.4 },
  { label: "누적 추천 이름", value: 24380, suffix: "개", delta: 3.1 },
  { label: "이번 주 신규 가입", value: 342, suffix: "명", delta: -4.2 },
  { label: "답변 대기 문의", value: 17, suffix: "건", delta: 8.0 },
];

export const ADMIN_USER_ROWS: AdminUserRow[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@naver.com", joinedAt: "2026-06-29T10:00:00+09:00", requests: 4, saved: 3, status: "ACTIVE", approvalStatus: "APPROVED" },
  { id: 2, name: "이준서", email: "junseo.lee@gmail.com", joinedAt: "2026-06-27T11:30:00+09:00", requests: 2, saved: 1, status: "ACTIVE", approvalStatus: "APPROVED" },
  { id: 3, name: "박서연", email: "seoyeon.park@daum.net", joinedAt: "2026-06-24T14:20:00+09:00", requests: 7, saved: 5, status: "ACTIVE", approvalStatus: "APPROVED" },
  { id: 4, name: "최민준", email: "minjun.choi@kakao.com", joinedAt: "2026-06-20T09:15:00+09:00", requests: 1, saved: 0, status: "ACTIVE", approvalStatus: "PENDING" },
  { id: 5, name: "정다은", email: "daeun.jung@naver.com", joinedAt: "2026-05-18T16:40:00+09:00", requests: 3, saved: 2, status: "SUSPENDED", approvalStatus: "APPROVED" },
];

export const RECENT_REQUESTS: any[] = [
  { id: 501, time: "14:22", user: "kim***@naver.com", query: "김씨 아이, 부드러운 기운을 보완하는 이름", results: 5, status: "완료" },
  { id: 500, time: "14:05", user: "lee***@gmail.com", query: "이씨 남아, 부르기 쉬운 한자 이름", results: 5, status: "완료" },
  { id: 499, time: "13:48", user: "par***@daum.net", query: "박씨 개명용 차분한 인상의 이름", results: 5, status: "완료" },
  { id: 498, time: "13:31", user: "cho***@naver.com", query: "최씨, 밝은 뜻이 들어간 중성적 이름", results: 5, status: "진행 중" },
  { id: 497, time: "13:12", user: "jun***@kakao.com", query: "정씨, 한글 발음이 자연스러운 이름", results: 5, status: "완료" },
];

export const SITE_TEXTS: any[] = [];
export const SOURCE_DISTRIBUTION: any[] = [
  { name: "자원오행", count: 1240 },
  { name: "81수리", count: 1180 },
  { name: "인명용 한자", count: 990 },
  { name: "학술 논문", count: 420 },
];
export const WEEKLY_REQUESTS: any[] = [
  { day: "6.25", requests: 86, recommendations: 430, 요청: 86, 추천: 430 },
  { day: "6.26", requests: 94, recommendations: 470, 요청: 94, 추천: 470 },
  { day: "6.27", requests: 132, recommendations: 660, 요청: 132, 추천: 660 },
  { day: "6.28", requests: 158, recommendations: 790, 요청: 158, 추천: 790 },
  { day: "6.29", requests: 121, recommendations: 605, 요청: 121, 추천: 605 },
  { day: "6.30", requests: 103, recommendations: 515, 요청: 103, 추천: 515 },
  { day: "7.1", requests: 128, recommendations: 640, 요청: 128, 추천: 640 },
];
export const MOCK_ADMIN_DASHBOARD: any = {};
