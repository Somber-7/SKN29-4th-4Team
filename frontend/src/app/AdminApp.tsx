import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AdminAuthProvider, useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { AdminLoginScreen } from "@/app/screens/AdminLoginScreen";
import { AdminChangePasswordScreen } from "@/app/screens/AdminChangePasswordScreen";
import { Toaster } from "@/app/components/ui/sonner";

// 관리자 화면은 여기서만 로드된다 — 사용자 번들(router.tsx)은 이 파일을 import하지
// 않으므로 Admin*Screen 코드가 사용자 번들에 섞이지 않는다(§2 확정 사항 2).
const AdminDashboardScreen = lazy(() =>
  import("@/app/screens/AdminDashboardScreen").then((m) => ({ default: m.AdminDashboardScreen })),
);
// const AdminPostsScreen = lazy(() =>
//   import("@/app/screens/AdminPostsScreen").then((m) => ({ default: m.AdminPostsScreen })),
// );
const AdminNoticesScreen = lazy(() =>
  import("@/app/screens/AdminNoticesScreen").then((m) => ({ default: m.AdminNoticesScreen })),
);
const AdminInquiriesScreen = lazy(() =>
  import("@/app/screens/AdminInquiriesScreen").then((m) => ({ default: m.AdminInquiriesScreen })),
);
const AdminFaqScreen = lazy(() =>
  import("@/app/screens/AdminFaqScreen").then((m) => ({ default: m.AdminFaqScreen })),
);
const AdminUsersScreen = lazy(() =>
  import("@/app/screens/AdminUsersScreen").then((m) => ({ default: m.AdminUsersScreen })),
);
const AdminUserDetailScreen = lazy(() =>
  import("@/app/screens/AdminUserDetailScreen").then((m) => ({ default: m.AdminUserDetailScreen })),
);
const AdminAccountsScreen = lazy(() =>
  import("@/app/screens/AdminAccountsScreen").then((m) => ({ default: m.AdminAccountsScreen })),
);
const AdminStatsScreen = lazy(() =>
  import("@/app/screens/AdminStatsScreen").then((m) => ({ default: m.AdminStatsScreen })),
);
const AdminSettingsScreen = lazy(() =>
  import("@/app/screens/AdminSettingsScreen").then((m) => ({ default: m.AdminSettingsScreen })),
);
// const AdminAuditLogScreen = lazy(() =>
//   import("@/app/screens/AdminAuditLogScreen").then((m) => ({ default: m.AdminAuditLogScreen })),
// );
function RouteFallback() {
  return <div className="min-h-screen bg-background" />;
}

/** 비로그인이면 /login으로 — 서버(/api/admin/*)가 최종 판정이고 이건 UX 보조일 뿐(§2 확정 사항 3). */
function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !admin) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, admin, navigate]);

  if (isLoading) return <RouteFallback />;
  if (!admin) return null;
  return <>{children}</>;
}

/** 최초 로그인 강제 비번 변경이 끝나기 전까지는 업무 화면 대신 변경 화면으로 보낸다. */
function RequirePasswordChanged({ children }: { children: ReactNode }) {
  const { admin } = useAdminAuth();
  if (admin?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

function ProtectedScreen({ children }: { children: ReactNode }) {
  return (
    <RequireAdminAuth>
      <RequirePasswordChanged>
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </RequirePasswordChanged>
    </RequireAdminAuth>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginScreen />} />
      <Route
        path="/change-password"
        element={
          <RequireAdminAuth>
            <AdminChangePasswordScreen />
          </RequireAdminAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedScreen>
            <AdminDashboardScreen />
          </ProtectedScreen>
        }
      />
      {/* 
      <Route
        path="/posts"
        element={
          <ProtectedScreen>
            <AdminPostsScreen />
          </ProtectedScreen>
        }
      />
      */}
      <Route
        path="/notices"
        element={
          <ProtectedScreen>
            <AdminNoticesScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/inquiries"
        element={
          <ProtectedScreen>
            <AdminInquiriesScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/faqs"
        element={
          <ProtectedScreen>
            <AdminFaqScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedScreen>
            <AdminUsersScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedScreen>
            <AdminUserDetailScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedScreen>
            <AdminAccountsScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedScreen>
            <AdminStatsScreen />
          </ProtectedScreen>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedScreen>
            <AdminSettingsScreen />
          </ProtectedScreen>
        }
      />
      {/* 
      <Route
        path="/audit-logs"
        element={
          <ProtectedScreen>
            <AdminAuditLogScreen />
          </ProtectedScreen>
        }
      />
      */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * 관리자 전용 앱 진입점 — 사용자 앱(App.tsx)과 완전히 분리된 별도 React 트리다.
 * `main.admin.tsx`에서만 마운트되며, Vite가 `base:'/manage/'`로 별도 번들을 만든다
 * (§2 확정 사항 2). basename="/manage"이므로 아래 경로들은 실제로 /manage/dashboard 등이다.
 */
export default function AdminApp() {
  return (
    <BrowserRouter basename="/manage">
      <QueryProvider>
        <AdminAuthProvider>
          <AdminRoutes />
          <Toaster position="bottom-right" duration={3500} richColors={false} />
        </AdminAuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}
