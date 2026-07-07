import { useLocation } from "react-router-dom";
import type { Screen } from "@/app/types";

/** 라우트 경로 → Screen 역매핑. GNB의 activeScreen 하이라이트 판별용. */
const PATH_TO_SCREEN: Record<string, Screen> = {
  "/": "landing",
  "/input": "input",
  "/intro": "intro",
  "/login": "login",
  "/signup": "signup",
  "/insights": "insights",
  "/notices": "notices",
  "/faq": "faq",
  "/contact": "contact",
  "/history": "history",
  "/mypage": "mypage",
  "/terms": "terms",
  "/privacy": "privacy",
  // 관리자 경로(/adminDashboard 등)는 별도 번들(/manage/)에만 존재 — 이 맵에 없다.
};

/** 현재 경로에 대응하는 Screen (매칭되지 않으면 notFound — 404 라우트) */
export function useCurrentScreen(): Screen {
  const location = useLocation();
  return PATH_TO_SCREEN[location.pathname] ?? "notFound";
}
