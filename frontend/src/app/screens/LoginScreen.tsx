import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import type { AuthUser, Screen } from "@/app/types";
import { isValidEmail } from "@/app/utils/validation";
import { PrimaryButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

/** 데모용 테스트 계정 (시안 단계 — API 연동 전. 화면에는 더 이상 노출하지 않는다) */
const TEST_USER = {
  email: "user@myeongga.co.kr",
  password: "user1234",
  name: "김명가",
};

const ADMIN_EMAIL = "admin@myeongga.co.kr";

/** 어떤 계정이 존재하는지 힌트를 주지 않는 공용 오류 문구 */
const INVALID_CREDENTIALS = "이메일 또는 비밀번호를 확인해 주세요.";

type View = "login" | "forgot" | "forgot-sent";

/** 제출 중 버튼에 표시하는 작은 회전 링 — ProcessingScreen의 mg-spin과 동일 모션 */
function ButtonSpinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 relative flex-shrink-0" aria-hidden="true">
      <span className="absolute inset-0 border-2 border-background/30 rounded-full" />
      <span
        className="absolute inset-0 border-2 rounded-full border-r-transparent border-b-transparent border-background"
        style={{ animation: "mg-spin 0.8s linear infinite" }}
      />
    </span>
  );
}

export function LoginScreen({
  onNavigate,
  onLogin,
  redirectTo,
}: {
  onNavigate: (s: Screen) => void;
  onLogin: (u: AuthUser) => void;
  /** 일반 회원 로그인 성공 시 이동할 화면 — 보호된 화면에서 튕겨나온 경우 그 화면, 아니면 랜딩 */
  redirectTo: Screen;
}) {
  const [view, setView] = useState<View>("login");

  // 로그인 폼
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 비밀번호 재설정 폼
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const validateEmailField = (value: string) => {
    if (!value.trim()) return "이메일을 입력해 주세요.";
    if (!isValidEmail(value)) return "올바른 이메일 형식이 아닙니다.";
    return undefined;
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    const next: { email?: string; password?: string } = {};
    const emailError = validateEmailField(email);
    if (emailError) next.email = emailError;
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    // TODO(API): POST /auth/login 으로 대체 — role은 서버 세션/JWT의 role 클레임 사용.
    // 지금은 실제 네트워크 지연을 흉내낸 데모 타이머만 존재한다.
    window.setTimeout(() => {
      const normalized = email.trim().toLowerCase();

      if (normalized === ADMIN_EMAIL) {
        onLogin({ name: "관리자", email: ADMIN_EMAIL, role: "admin" });
        toast.success("관리자님, 환영합니다.", { duration: 3500, id: "welcome" });
        onNavigate("adminDashboard");
        return;
      }

      if (normalized === TEST_USER.email && password === TEST_USER.password) {
        onLogin({ name: TEST_USER.name, email: TEST_USER.email, role: "user" });
        toast.success(`${TEST_USER.name}님, 환영합니다.`, { duration: 3500, id: "welcome" });
        // "시작하기" 등에서 튕겨나왔다면 원래 가려던 화면(gate 등)으로, 로그인 메뉴로 바로 들어왔다면 랜딩으로
        onNavigate(redirectTo);
        return;
      }

      setErrors({ password: INVALID_CREDENTIALS });
      setIsSubmitting(false);
    }, 550);
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetError("");
    setView("forgot");
  };

  const handleSendReset = () => {
    if (isSendingReset) return;
    const emailError = validateEmailField(resetEmail);
    setResetError(emailError ?? "");
    if (emailError) return;

    setIsSendingReset(true);
    // TODO(API): POST /auth/forgot-password 로 대체 — 지금은 데모용 지연만 흉내낸다.
    window.setTimeout(() => {
      setIsSendingReset(false);
      setView("forgot-sent");
    }, 700);
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2.5 text-sm border bg-white focus:outline-none transition-all ${
      hasError
        ? "border-destructive focus:ring-1 focus:ring-destructive"
        : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
    }`;

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-8 py-14">
        <div className="relative w-full max-w-sm">
          {/* Watermark */}
          <span
            className="font-hanja pointer-events-none select-none absolute -top-14 -right-10 text-[130px] leading-none text-primary opacity-[0.05]"
            aria-hidden="true"
          >
            名
          </span>

          {view === "login" && (
            <>
              {/* Header */}
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Sign In</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">로그인</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  저장한 이름과 추천 기록을 이어서 보실 수 있습니다.
                </p>
              </div>

              {/* Form */}
              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onBlur={() => {
                      if (!email) return;
                      const err = validateEmailField(email);
                      if (err) setErrors((prev) => ({ ...prev, email: err }));
                    }}
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    className={inputClass(!!errors.email)}
                  />
                  {errors.email && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-medium text-label">
                      비밀번호
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-[11px] text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      placeholder="••••••••"
                      aria-invalid={!!errors.password}
                      className={`${inputClass(!!errors.password)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                      className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {showPassword ? (
                        <EyeOff size={16} aria-hidden="true" />
                      ) : (
                        <Eye size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.password}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  {isSubmitting && <ButtonSpinner />}
                  {isSubmitting ? "로그인하는 중" : "로그인"}
                </PrimaryButton>

                {/* Divider */}
                <div className="flex items-center gap-3" aria-hidden="true">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-hint">또는</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Kakao */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FEE500] text-[#191919] text-sm font-medium hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3C6.477 3 2 6.813 2 11.5c0 3.003 1.863 5.642 4.688 7.188l-.94 3.437a.25.25 0 0 0 .375.28L10.094 20A11.77 11.77 0 0 0 12 20.1c5.523 0 10-3.813 10-8.5C22 6.813 17.523 3 12 3Z" />
                  </svg>
                  카카오로 계속하기
                </button>
              </div>

              {/* Sign-up link */}
              <p className="relative z-10 text-center text-sm text-muted-foreground mt-6">
                아직 회원이 아니신가요?{" "}
                <button
                  onClick={() => onNavigate("signup")}
                  className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  회원가입
                </button>
              </p>
            </>
          )}

          {view === "forgot" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Password Reset</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">비밀번호 재설정</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    disabled={isSendingReset}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendReset();
                    }}
                    placeholder="name@example.com"
                    aria-invalid={!!resetError}
                    className={inputClass(!!resetError)}
                  />
                  {resetError && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetError}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleSendReset}
                  disabled={isSendingReset}
                  aria-busy={isSendingReset}
                  className="w-full px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  {isSendingReset && <ButtonSpinner />}
                  {isSendingReset ? "보내는 중" : "재설정 링크 보내기"}
                </PrimaryButton>

                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="w-full text-center text-xs text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  ← 로그인으로 돌아가기
                </button>
              </div>
            </>
          )}

          {view === "forgot-sent" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Password Reset</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">메일을 보냈습니다</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  <span className="text-foreground font-medium">{resetEmail}</span>로 재설정 안내를
                  보내드렸습니다.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-4">
                <p className="text-xs text-hint leading-relaxed break-keep">
                  시안 단계로, 실제 메일은 발송되지 않습니다. 실제 서비스에서는 이 메일의 링크로 새
                  비밀번호를 설정하게 됩니다.
                </p>
                <PrimaryButton onClick={() => setView("login")} className="w-full px-4 py-3">
                  로그인으로 돌아가기
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
