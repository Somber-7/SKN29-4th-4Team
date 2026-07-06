import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Screen } from "@/app/types";
import { useNamingFlow } from "@/app/providers/NamingFlowProvider";

/**
 * 기존 화면 컴포넌트들이 그대로 사용하는 Screen 기반 onNavigate(s: Screen) 시그니처를
 * react-router 내비게이션에 연결하는 어댑터. 화면 컴포넌트 자체는 한 줄도 바뀌지 않는다.
 *
 * processing·results·chat 세 화면은 라우트가 없는 "플로우 오버레이"이므로
 * (NamingFlowProvider 참고) 여기서 라우트 이동 대신 플로우 상태 전환으로 연결한다.
 *
 * "gate"(문 열림 연출)는 더 이상 여기서 트리거하지 않는다 — 브라우저 접속 시
 * 세션당 1회 router.tsx의 RootLayout에서 자동으로 노출되므로, "작명 시작하기" 등의
 * 버튼은 이제 곧바로 input 라우트로 이동한다(비로그인 시 RequireAuth가 로그인으로 안내).
 */
const SCREEN_PATHS: Partial<Record<Screen, string>> = {
  landing: "/",
  input: "/input",
  intro: "/intro",
  login: "/login",
  signup: "/signup",
  insights: "/insights",
  faq: "/faq",
  contact: "/contact",
  history: "/history",
  mypage: "/mypage",
  terms: "/terms",
  privacy: "/privacy",
  adminDashboard: "/adminDashboard",
  adminContent: "/adminContent",
  adminUsers: "/adminUsers",
  adminSettings: "/adminSettings",
};

export function useScreenNav(): (s: Screen) => void {
  const navigate = useNavigate();
  const { exitFlow } = useNamingFlow();

  return useCallback(
    (s: Screen) => {
      // gate는 더 이상 플로우 오버레이가 아니라 RootLayout의 세션당 1회 자동 노출이므로,
      // "작명 시작하기" 클릭은 곧바로 input 라우트로 보낸다.
      if (s === "gate") {
        exitFlow();
        navigate("/input");
        return;
      }
      // processing/results/chat은 onNavigate로 직접 진입하지 않는다(항상 플로우 내부 콜백으로만 전환).
      if (s === "processing" || s === "results" || s === "chat") return;
      // processing/results/chat 오버레이가 떠 있는 동안 GNB 등에서 실제 라우트로 이동하는 경우,
      // 오버레이를 먼저 닫아야 RootLayout이 <Outlet/>(새 라우트)을 렌더링한다. 이게 없으면
      // 주소는 바뀌어도 화면은 계속 오버레이(예: 결과 화면)에 머물러 있는 것처럼 보인다.
      exitFlow();
      navigate(SCREEN_PATHS[s] ?? "/");
    },
    [navigate, exitFlow],
  );
}
