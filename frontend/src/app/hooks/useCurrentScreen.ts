import { useLocation } from "react-router-dom";
import type { Screen } from "@/app/types";

/** 라우트 경로 → Screen 역매핑. GNB/AdminLayout의 activeScreen 하이라이트, isAdminScreen 판별용. */
const PATH_TO_SCREEN: Record<string, Screen> = {
  "/": "landing",
  "/input": "input",
  "/intro": "intro",
  "/login": "login",
  "/signup": "signup",
  "/insights": "insights",
  "/faq": "faq",
  "/contact": "contact",
  "/history": "history",
  "/mypage": "mypage",
  "/terms": "terms",
  "/privacy": "privacy",
  "/adminDashboard": "adminDashboard",
  "/adminContent": "adminContent",
  "/adminUsers": "adminUsers",
  "/adminSettings": "adminSettings",
};

/** 현재 경로에 대응하는 Screen (매칭되지 않으면 notFound — 404 라우트) */
export function useCurrentScreen(): Screen {
  const location = useLocation();
  return PATH_TO_SCREEN[location.pathname] ?? "notFound";
}
