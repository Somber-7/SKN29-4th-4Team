import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { NameRequest, Screen } from "@/app/types";
import { useAuth } from "@/app/providers/AuthProvider";
import { useNamingFlow } from "@/app/providers/NamingFlowProvider";
import { useScreenNav } from "@/app/hooks/useScreenNav";
import { useCurrentScreen } from "@/app/hooks/useCurrentScreen";
import { useHandleLogout } from "@/app/hooks/useHandleLogout";
import { hasSeenGateThisSession, markGateSeenThisSession } from "@/app/utils/gateSession";
import { GNB } from "@/app/components/layout/GNB";
import { Toaster } from "@/app/components/ui/sonner";
import { apiClient, USE_MOCK } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { supportApi } from "@/api/support";

// ─── 화면 지연 로딩 (React.lazy) ───────────────────────────────────────────────
// 화면 컴포넌트는 전부 named export이므로 default export로 어댑팅한다.
// 파일 단위로 쪼개지므로 recharts를 쓰는 InsightsScreen은 자신의 청크에만 포함되고
// 초기 청크에는 들어가지 않는다. 관리자 화면(Admin*Screen)은 이 번들에 없다 —
// 별도 진입점(admin.html/main.admin.tsx, base:/manage/)에서만 로드된다.

const LandingScreen = lazy(() =>
  import("@/app/screens/LandingScreen").then((m) => ({ default: m.LandingScreen })),
);
const ServiceIntroScreen = lazy(() =>
  import("@/app/screens/ServiceIntroScreen").then((m) => ({ default: m.ServiceIntroScreen })),
);
const LoginScreen = lazy(() =>
  import("@/app/screens/LoginScreen").then((m) => ({ default: m.LoginScreen })),
);
const SignupScreen = lazy(() =>
  import("@/app/screens/SignupScreen").then((m) => ({ default: m.SignupScreen })),
);
const InsightsScreen = lazy(() =>
  import("@/app/screens/InsightsScreen").then((m) => ({ default: m.InsightsScreen })),
);
const SupportScreen = lazy(() =>
  import("@/app/screens/SupportScreen").then((m) => ({ default: m.SupportScreen })),
);
const NoticesScreen = lazy(() =>
  import("@/app/screens/NoticesScreen").then((m) => ({ default: m.NoticesScreen })),
);
const PolicyScreen = lazy(() =>
  import("@/app/screens/PolicyScreen").then((m) => ({ default: m.PolicyScreen })),
);
const NotFoundScreen = lazy(() =>
  import("@/app/screens/NotFoundScreen").then((m) => ({ default: m.NotFoundScreen })),
);
const InputScreen = lazy(() =>
  import("@/app/screens/InputScreen").then((m) => ({ default: m.InputScreen })),
);
const GateScreen = lazy(() =>
  import("@/app/screens/GateScreen").then((m) => ({ default: m.GateScreen })),
);
const ProcessingScreen = lazy(() =>
  import("@/app/screens/ProcessingScreen").then((m) => ({ default: m.ProcessingScreen })),
);
const ResultsScreen = lazy(() =>
  import("@/app/screens/ResultsScreen").then((m) => ({ default: m.ResultsScreen })),
);
const ChatScreen = lazy(() =>
  import("@/app/screens/ChatScreen").then((m) => ({ default: m.ChatScreen })),
);
const MyPageScreen = lazy(() =>
  import("@/app/screens/MyPageScreen").then((m) => ({ default: m.MyPageScreen })),
);
const HistoryScreen = lazy(() =>
  import("@/app/screens/HistoryScreen").then((m) => ({ default: m.HistoryScreen })),
);
const MaintenanceScreen = lazy(() =>
  import("@/app/screens/MaintenanceScreen").then((m) => ({ default: m.MaintenanceScreen })),
);

/** results 화면에 request가 아직 없을 때(예: 직접 진입 등 비정상 경로) 쓰는 기본값 — 기존 App.tsx와 동일 */
const EMPTY_NATURAL_REQUEST: NameRequest = { type: "natural", query: "" };

/** 라우트 전환 중 잠깐 보이는 자리표시자 — 테마 배경만 유지해 깜빡임을 최소화 */
function RouteFallback() {
  return <div className="min-h-screen bg-background" />;
}

// ─── 접근 가드 ─────────────────────────────────────────────────────────────────
// 원래 App.tsx의 "LOGIN_REQUIRED_SCREENS 포함 && !user → 로그인으로 안내" effect를
// 라우트 단위로 재현한다. effect 기반으로 두어, 로그인 처리와 같은 틱에 일어나는
// 리다이렉트에서도 항상 최신 user를 본다.
// 관리자 접근 가드(RequireAdmin)는 더 이상 이 번들에 없다 — 관리자는 별도 번들
// (`/manage/`)에서 서버 세션(`admin_sessionid`)으로만 판정한다(§2 확정 사항 3·5).

function RequireAuth({ screen, children }: { screen: Screen; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      toast.info("로그인이 필요한 페이지입니다.");
      navigate("/login", { state: { redirectTo: screen }, replace: true });
    }
  }, [isLoading, user, navigate, screen]);

  if (isLoading || !user) return null;
  return <>{children}</>;
}

// ─── 라우트별 래퍼 ─────────────────────────────────────────────────────────────
// 각 화면 컴포넌트의 props 시그니처(onNavigate: Screen 기반 등)는 손대지 않고,
// 여기서 컨텍스트(인증·플로우·라우팅)를 연결해 넘겨준다.

function LandingRoute() {
  return <LandingScreen onNavigate={useScreenNav()} />;
}
function ServiceIntroRoute() {
  return <ServiceIntroScreen onNavigate={useScreenNav()} />;
}
function LoginRoute() {
  const onNavigate = useScreenNav();
  const { login } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { redirectTo?: Screen } | null)?.redirectTo ?? "landing";
  return <LoginScreen onNavigate={onNavigate} onLogin={login} redirectTo={redirectTo} />;
}
function SignupRoute() {
  return <SignupScreen onNavigate={useScreenNav()} />;
}
function InsightsRoute() {
  return <InsightsScreen onNavigate={useScreenNav()} />;
}
function SupportNoticesRoute() {
  return <NoticesScreen onNavigate={useScreenNav()} />;
}
function SupportFaqRoute() {
  return <SupportScreen tab="faq" onNavigate={useScreenNav()} />;
}
function SupportContactRoute() {
  return <SupportScreen tab="contact" onNavigate={useScreenNav()} />;
}
function PolicyTermsRoute() {
  return <PolicyScreen kind="terms" onNavigate={useScreenNav()} />;
}
function PolicyPrivacyRoute() {
  return <PolicyScreen kind="privacy" onNavigate={useScreenNav()} />;
}
function InputRoute() {
  const { submitRequest } = useNamingFlow();
  return <InputScreen onSubmit={submitRequest} />;
}
function MyPageRoute() {
  const { user, login } = useAuth();
  const onNavigate = useScreenNav();
  const handleLogout = useHandleLogout();
  if (!user) return null;
  return <MyPageScreen user={user} onUpdateUser={login} onLogout={handleLogout} onNavigate={onNavigate} />;
}
function HistoryRoute() {
  const { openHistoryResult } = useNamingFlow();
  return <HistoryScreen onNavigate={useScreenNav()} onOpenResult={openHistoryResult} />;
}
function NotFoundRoute() {
  return <NotFoundScreen onNavigate={useScreenNav()} />;
}

// ─── 루트 레이아웃 ─────────────────────────────────────────────────────────────
// GNB + processing/results/chat 플로우 오버레이, 그 외 화면은 <Outlet/>으로 라우트
// 렌더링 — 원래 App.tsx의 렌더 분기를 그대로 재현한다. (관리자 화면은 이 레이아웃과
// 무관한 별도 번들이므로 여기서 더 이상 분기하지 않는다.)
//
// 문(대문) 열림 연출은 더 이상 "작명 시작하기" 클릭에 딸린 플로우가 아니라, 브라우저가
// 사이트에 접속했을 때(세션당 1회) 로그인 여부와 무관하게 가장 먼저 노출된다. 새로고침하거나
// 다른 화면에서 다시 진입해도 같은 세션에서 이미 봤다면 다시 보여주지 않는다(sessionStorage).

function RootLayout() {
  const { flow, request, chatQuestion, completeProcessing, cancelProcessing, openChat, backToResults, retryFromResults, regenerateWithExclusions } =
    useNamingFlow();
  const { isLoggedIn } = useAuth();
  const onNavigate = useScreenNav();
  const screen = useCurrentScreen();
  const handleLogout = useHandleLogout();
  const [entryGateDone, setEntryGateDone] = useState(() => hasSeenGateThisSession());

  const location = useLocation();

  // 원래 App.tsx는 화면(screen)이 바뀔 때마다 스크롤을 맨 위로 되돌렸다.
  // BrowserRouter는 이 동작을 자동으로 해 주지 않으므로 동일하게 재현한다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, flow]);

  // ─── 실시간 접속자 하트비트 (Phase 9) ───
  useEffect(() => {
    let clientId = localStorage.getItem("mg_client_id");
    if (!clientId) {
      clientId = typeof crypto.randomUUID === "function" 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("mg_client_id", clientId);
    }

    const sendHeartbeat = () => {
      if (USE_MOCK) return;
      apiClient.post("/support/heartbeat", {
        clientId,
        currentPath: location.pathname + location.search + location.hash
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, location.search, location.hash, flow]);

  // 이 세션에서 아직 대문을 안 봤다면, 어떤 경로로 접속했든 다른 무엇보다 먼저 전체 화면으로 노출한다.
  if (!entryGateDone) {
    return (
      <div className="min-h-screen bg-background">
        <div className="overflow-hidden">
          <Suspense fallback={null}>
            <GateScreen
              onComplete={() => {
                markGateSeenThisSession();
                setEntryGateDone(true);
              }}
            />
          </Suspense>
        </div>
        <Toaster position="bottom-right" duration={3500} richColors={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GNB activeScreen={screen} onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} />

      {/* 화면 전환 진입 모션: 짧은 페이드 + 위로 슬라이드 (gate 제외) — key로 매번 재생 */}
      <div key={flow ?? screen} className="overflow-hidden" style={{ animation: "mg-hero-in 0.4s ease-out both" }}>
        <Suspense fallback={<RouteFallback />}>
          {flow === "processing" && (
            <ProcessingScreen request={request} onComplete={completeProcessing} onCancel={cancelProcessing} />
          )}
          {flow === "results" && (
            <ResultsScreen
              request={request ?? EMPTY_NATURAL_REQUEST}
              onChat={openChat}
              onRetry={retryFromResults}
              onRegenerate={regenerateWithExclusions}
            />
          )}
          {flow === "chat" && <ChatScreen initialQuestion={chatQuestion} onBack={backToResults} />}
          {!flow && <Outlet />}
        </Suspense>
      </div>

      {/* 폼 제출·삭제 등 전역 토스트 피드백 (sonner) */}
      <Toaster position="bottom-right" duration={3500} richColors={false} />
    </div>
  );
}

// ─── 라우트 트리 ───────────────────────────────────────────────────────────────
// 경로는 원래 해시 문자열(#/faq 등)과 1:1로 동일 — BrowserRouter 전환 후에도 경로
// 자체는 바뀌지 않았고 앞의 '#'만 사라졌으므로 기존 딥링크가 그대로 동작한다.
// (구 '/#/...' 링크 하위호환은 index.html의 리다이렉트 스크립트가 처리한다.)

export function AppRoutes() {
  const { data: heartbeat, isLoading: isHeartbeatLoading } = useQuery({
    queryKey: ["system", "heartbeat"],
    queryFn: () => supportApi.getHeartbeat(),
    refetchInterval: 60000,
  });

  if (isHeartbeatLoading) {
    return <RouteFallback />;
  }

  if (heartbeat?.maintenance) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <MaintenanceScreen reason={heartbeat.reason} />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<LandingRoute />} />
        <Route path="intro" element={<ServiceIntroRoute />} />
        <Route path="login" element={<LoginRoute />} />
        <Route path="signup" element={<SignupRoute />} />
        <Route path="insights" element={<InsightsRoute />} />
        <Route path="notices" element={<SupportNoticesRoute />} />
        <Route path="faq" element={<SupportFaqRoute />} />
        <Route path="contact" element={<SupportContactRoute />} />
        <Route path="terms" element={<PolicyTermsRoute />} />
        <Route path="privacy" element={<PolicyPrivacyRoute />} />

        <Route
          path="input"
          element={
            <RequireAuth screen="input">
              <InputRoute />
            </RequireAuth>
          }
        />
        <Route
          path="mypage"
          element={
            <RequireAuth screen="mypage">
              <MyPageRoute />
            </RequireAuth>
          }
        />
        <Route
          path="history"
          element={
            <RequireAuth screen="history">
              <HistoryRoute />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  );
}
