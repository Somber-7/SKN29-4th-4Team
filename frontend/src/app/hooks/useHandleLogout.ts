import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";

/** 로그아웃 처리 + 랜딩으로 이동 (원래 App.tsx의 handleLogout과 동일) */
export function useHandleLogout(): () => void {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);
}
