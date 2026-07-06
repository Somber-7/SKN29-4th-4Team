import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/app/types";

/** 데모 인증 세션 저장 키 */
const AUTH_KEY = "mgUser";

function loadUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    // 호환: role이 없는 옛 세션은 일반 사용자로 보정
    return { ...parsed, role: parsed.role ?? "user" };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * sessionStorage("mgUser") 읽기/쓰기 · login/logout · role 판별을 전담한다.
 * App.tsx 등 소비자는 sessionStorage에 직접 접근하지 않고 useAuth()만 사용한다.
 * TODO(API): 서버 세션/JWT 기반 인증으로 대체 시 이 Provider 내부만 교체하면 된다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(AUTH_KEY);
    toast.success("로그아웃되었습니다.");
  }, []);

  const value: AuthContextValue = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
