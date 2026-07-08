// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminAuthApi } from "@/api/admin";
import { PrimaryButton } from "@/app/components/common/Button";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";

/**
 * 최초 로그인 강제 비밀번호 변경 화면(§2 확정 사항, §5.4).
 * AdminProfile.must_change_password가 true인 동안은 AdminApp.tsx의 라우트 가드가
 * 다른 화면 대신 이리로 보낸다.
 */
export function AdminChangePasswordScreen() {
  const { admin, logout, refreshAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (nextPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await adminAuthApi.changePassword({ currentPassword, nextPassword });
      await refreshAdmin();
      toast.success("비밀번호가 변경되었습니다.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">비밀번호 변경</h1>
          <p className="text-sm text-muted-foreground break-keep">
            {admin?.displayName ?? "관리자"}님, 최초 로그인 시에는 비밀번호를 변경해야 합니다.
          </p>
        </div>

        <div className="bg-white border border-border p-7 space-y-5">
          <div>
            <label htmlFor="current-password" className="block text-xs font-medium text-label mb-1.5">
              현재 비밀번호
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              disabled={isSubmitting}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="next-password" className="block text-xs font-medium text-label mb-1.5">
              새 비밀번호
            </label>
            <input
              id="next-password"
              type="password"
              autoComplete="new-password"
              value={nextPassword}
              disabled={isSubmitting}
              onChange={(e) => setNextPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-label mb-1.5">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full px-4 py-3"
          >
            {isSubmitting ? "변경하는 중" : "비밀번호 변경"}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => logout().then(() => navigate("/login", { replace: true }))}
            className="w-full text-center text-xs text-caption hover:text-primary transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
