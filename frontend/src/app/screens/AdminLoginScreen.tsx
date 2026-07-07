import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PrimaryButton } from "@/app/components/common/Button";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";

/** 관리자 로그인 — 일반 회원과 달리 이메일이 아닌 ID로 로그인한다(§4.1). */
export function AdminLoginScreen() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!username.trim() || !password) {
      setError("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      toast.success(`${user.displayName}님, 환영합니다.`);
      navigate(user.mustChangePassword ? "/change-password" : "/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했습니다.";
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
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">관리자 로그인</h1>
          <p className="text-sm text-muted-foreground break-keep">명가작명소 관리자 페이지입니다.</p>
        </div>

        <div className="bg-white border border-border p-7 space-y-5">
          <div>
            <label htmlFor="admin-username" className="block text-xs font-medium text-label mb-1.5">
              아이디
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              disabled={isSubmitting}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-label mb-1.5">
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
            {isSubmitting ? "로그인하는 중" : "로그인"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
