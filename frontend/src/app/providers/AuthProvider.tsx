import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, setUnauthorizedHandler } from "@/api/client";
import { authApi } from "@/api/auth";
import type { AuthUser } from "@/app/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (u: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Django 세션을 인증의 기준으로 사용한다.
 * 앱 시작 시 CSRF 쿠키를 받고, /api/me로 현재 세션 사용자를 복원한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        await authApi.ensureCsrf();
        const current = await authApi.currentUser();
        if (alive) setUser(current);
      } catch (error) {
        if (alive) setUser(null);
        if (error instanceof ApiError && error.status !== 401) {
          toast.error("로그인 상태를 확인하지 못했습니다.");
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 세션이 이미 만료된 경우에도 화면 상태는 로그아웃으로 정리한다.
    } finally {
      setUser(null);
      toast.success("로그아웃되었습니다.");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isLoggedIn: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
