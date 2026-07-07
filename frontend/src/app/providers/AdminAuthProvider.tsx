// @ts-nocheck
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { adminAuthApi, type AdminUser } from "@/api/admin";

interface AdminAuthContextValue {
  admin: AdminUser | null;
  /** 앱 진입 시 /api/admin/me 조회가 끝나기 전까지 true — 이 동안은 로그인 화면으로 튕기지 않는다 */
  isLoading: boolean;
  hasPermission: (key: string) => boolean;
  login: (username: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * 관리자 인증 컨텍스트 — 일반 사용자 AuthProvider(sessionStorage 데모)와 완전히 분리된다.
 * 진짜 인증 상태는 서버 세션(admin_sessionid, §15.1)이므로 여기서는 아무것도 로컬에
 * 캐싱하지 않고, 앱이 뜰 때마다 /api/admin/me로 현재 로그인 상태를 확인한다.
 * (사용자 번들의 mgUser sessionStorage 패턴과 의도적으로 다르다 — 관리자 권한은
 * 클라이언트에 남겨두지 않는다.)
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminAuthApi
      .me()
      .then((user) => {
        if (!cancelled) setAdmin(user);
      })
      .catch(() => {
        if (!cancelled) setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const user = await adminAuthApi.login({ username, password });
    setAdmin(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout();
    } finally {
      setAdmin(null);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    try {
      const user = await adminAuthApi.me();
      setAdmin(user);
    } catch {
      setAdmin(null);
    }
  }, []);

  const hasPermission = useCallback((key: string) => !!admin?.permissions.includes(key), [admin]);

  const value: AdminAuthContextValue = { admin, isLoading, hasPermission, login, logout, refreshAdmin };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth는 AdminAuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
