import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";
import type { Screen } from "@/app/types";
import { isValidEmail } from "@/app/utils/validation";
import { PrimaryButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";
import { PolicyAgreementModal } from "@/app/components/common/PolicyAgreementModal";

interface SignupErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
  agree?: string;
}

const TERMS_VERSION = "2026-07-07";
const PRIVACY_VERSION = "2026-07-07";
const USERNAME_MESSAGE = "아이디는 영문, 숫자, 밑줄(_) 4~20자로 입력해 주세요.";
const USERNAME_RE = /^[A-Za-z0-9_]{4,20}$/;
const PASSWORD_MESSAGE = "영문, 숫자, 기호를 포함해 8~15자로 입력해 주세요.";
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,15}$/;
const DUPLICATE_USERNAME_MESSAGE = "중복된 아이디가 있습니다.";
const DUPLICATE_EMAIL_MESSAGE = "중복된 이메일이 있습니다.";

interface ApiErrorBody {
  message?: string;
  detail?: Record<string, string[]>;
}

function getApiFieldErrors(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  const body = error.detail as ApiErrorBody | undefined;
  return body?.detail;
}

function normalizeSignupError(field: "username" | "email", message?: string) {
  if (!message) return undefined;
  if (field === "username" && (message.includes("중복") || message.includes("사용 중"))) {
    return DUPLICATE_USERNAME_MESSAGE;
  }
  if (field === "email" && (message.includes("중복") || message.includes("가입된"))) {
    return DUPLICATE_EMAIL_MESSAGE;
  }
  return message;
}

export function SignupScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  // 약관/방침을 끝까지 읽었는지 — 읽기 전에는 체크박스로 동의할 수 없다
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [policyModal, setPolicyModal] = useState<"terms" | "privacy" | null>(null);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const clearError = (key: keyof SignupErrors) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  const validateEmailField = (value: string) => {
    if (!value.trim()) return "이메일을 입력해 주세요.";
    if (!isValidEmail(value)) return "올바른 이메일 형식이 아닙니다.";
    return undefined;
  };

  const validateUsernameField = (value: string) => {
    if (!value.trim()) return "아이디를 입력해 주세요.";
    if (!USERNAME_RE.test(value.trim())) return USERNAME_MESSAGE;
    return undefined;
  };

  const validatePasswordField = (value: string) => {
    if (!value) return "비밀번호를 입력해 주세요.";
    if (!PASSWORD_RE.test(value)) return PASSWORD_MESSAGE;
    return undefined;
  };

  const validateConfirmField = (value: string) => {
    if (!value) return "비밀번호를 한 번 더 입력해 주세요.";
    if (value !== password) return "비밀번호가 일치하지 않습니다.";
    return undefined;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const next: SignupErrors = {};
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) next.name = "이름을 입력해 주세요.";
    const usernameError = validateUsernameField(trimmedUsername);
    if (usernameError) next.username = usernameError;
    if (!email.trim()) next.email = "이메일을 입력해 주세요.";
    else if (!isValidEmail(email))
      next.email = "올바른 이메일 형식이 아닙니다.";
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    else if (!PASSWORD_RE.test(password)) next.password = PASSWORD_MESSAGE;
    if (!confirm) next.confirm = "비밀번호를 한 번 더 입력해 주세요.";
    else if (password && confirm !== password) next.confirm = "비밀번호가 일치하지 않습니다.";
    if (!agreeTerms || !agreePrivacy) next.agree = "필수 약관에 모두 동의해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await authApi.signup({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        termsAgreed: agreeTerms,
        privacyAgreed: agreePrivacy,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      });
      setDone(true);
      toast.success("회원가입이 완료되었습니다.");
    } catch (error) {
      const detail = getApiFieldErrors(error);
      const usernameMessage = normalizeSignupError("username", detail?.username?.[0]);
      const emailMessage = normalizeSignupError("email", detail?.email?.[0]);
      const fieldErrors: SignupErrors = {
        name: detail?.name?.[0],
        username: usernameMessage,
        email: emailMessage,
        password: detail?.password?.[0],
        agree: detail?.termsAgreed?.[0] ?? detail?.privacyAgreed?.[0],
      };
      setErrors({
        name: fieldErrors.name,
        username: fieldErrors.username,
        email: fieldErrors.email,
        password: fieldErrors.password,
        agree: fieldErrors.agree,
      });
      const duplicateMessages = [usernameMessage, emailMessage].filter(
        (message): message is string =>
          message === DUPLICATE_USERNAME_MESSAGE || message === DUPLICATE_EMAIL_MESSAGE,
      );
      if (duplicateMessages.length > 0) {
        duplicateMessages.forEach((message) => toast.error(message));
      } else {
        toast.error(
          fieldErrors.name ??
            fieldErrors.username ??
            fieldErrors.email ??
            fieldErrors.password ??
            fieldErrors.agree ??
            "회원가입 정보를 다시 확인해 주세요.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
            登
          </span>

          {done ? (
            /* ── 가입 완료 ── */
            <div className="relative z-10 bg-white border border-border p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-primary flex items-center justify-center">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                  <path
                    d="M1.5 7L6.5 12L16.5 1.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2 break-keep">
                가입이 완료되었습니다
              </h1>
              <p className="text-sm text-muted-foreground break-keep mb-8">
                {name.trim()}님, 환영합니다.
                <br />
                이제 근거 있는 이름 짓기를 시작해 보세요.
              </p>
              <PrimaryButton onClick={() => onNavigate("login")} className="w-full px-4 py-3">
                로그인하러 가기
              </PrimaryButton>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">
                  Sign Up
                </p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">
                  회원가입
                </h1>
                <p className="text-sm text-muted-foreground break-keep">
                  추천받은 이름을 저장하고 언제든 다시 확인하세요.
                </p>
              </div>

              {/* Form */}
              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-medium text-label mb-1.5">
                    이름
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
                    placeholder="홍길동"
                    aria-invalid={!!errors.name}
                    className={inputClass(!!errors.name)}
                  />
                  {errors.name && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-username" className="block text-xs font-medium text-label mb-1.5">
                    아이디
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearError("username");
                    }}
                    onBlur={() => {
                      if (!username) return;
                      const err = validateUsernameField(username);
                      if (err) setErrors((prev) => ({ ...prev, username: err }));
                    }}
                    placeholder="myeongga01"
                    aria-invalid={!!errors.username}
                    className={inputClass(!!errors.username)}
                  />
                  {errors.username && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
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
                  <label htmlFor="signup-password" className="block text-xs font-medium text-label mb-1.5">
                    비밀번호 <span className="font-normal text-caption">(영문+숫자+기호 8~15자)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                        clearError("confirm");
                      }}
                      onBlur={() => {
                        if (!password) return;
                        const err = validatePasswordField(password);
                        if (err) setErrors((prev) => ({ ...prev, password: err }));
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
                      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-confirm" className="block text-xs font-medium text-label mb-1.5">
                    비밀번호 확인
                    {confirm && !errors.confirm && (
                      <span className={`ml-2 font-normal ${confirm === password ? "text-pine" : "text-destructive"}`}>
                        {confirm === password ? "일치합니다" : "일치하지 않습니다"}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        clearError("confirm");
                      }}
                      onBlur={() => {
                        if (!confirm) return;
                        const err = validateConfirmField(confirm);
                        if (err) setErrors((prev) => ({ ...prev, confirm: err }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
                      placeholder="••••••••"
                      aria-invalid={!!errors.confirm}
                      className={`${inputClass(!!errors.confirm)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 표시"}
                      className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p role="alert" className="text-xs text-destructive mt-1">{errors.confirm}</p>
                  )}
                </div>

                {/* Terms */}
                <div className="pt-1 space-y-2.5 border-t border-muted">
                  <div className="flex items-start gap-2.5 pt-3">
                    <input
                      id="agree-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      disabled={!termsRead}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        clearError("agree");
                      }}
                      className="mt-0.5 w-4 h-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="agree-terms" className="text-xs text-label leading-relaxed flex-1">
                      <span className="text-primary font-medium">(필수)</span> 이용약관에
                      동의합니다.
                    </label>
                    <button
                      type="button"
                      onClick={() => setPolicyModal("terms")}
                      className="text-[11px] text-caption underline hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0"
                    >
                      약관 보기
                    </button>
                  </div>
                  {!termsRead && (
                    <p className="text-[11px] text-hint pl-6 -mt-1">
                      약관을 끝까지 읽어야 동의할 수 있어요.
                    </p>
                  )}

                  <div className="flex items-start gap-2.5">
                    <input
                      id="agree-privacy"
                      type="checkbox"
                      checked={agreePrivacy}
                      disabled={!privacyRead}
                      onChange={(e) => {
                        setAgreePrivacy(e.target.checked);
                        clearError("agree");
                      }}
                      className="mt-0.5 w-4 h-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="agree-privacy" className="text-xs text-label leading-relaxed flex-1">
                      <span className="text-primary font-medium">(필수)</span> 개인정보 수집 및
                      이용에 동의합니다.
                    </label>
                    <button
                      type="button"
                      onClick={() => setPolicyModal("privacy")}
                      className="text-[11px] text-caption underline hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0"
                    >
                      방침 보기
                    </button>
                  </div>
                  {!privacyRead && (
                    <p className="text-[11px] text-hint pl-6 -mt-1">
                      개인정보처리방침을 끝까지 읽어야 동의할 수 있어요.
                    </p>
                  )}

                  {errors.agree && (
                    <p role="alert" className="text-xs text-destructive">{errors.agree}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full px-4 py-3"
                >
                  {isSubmitting ? "가입 처리 중" : "가입하기"}
                </PrimaryButton>
              </div>

              {/* Login link */}
              <p className="relative z-10 text-center text-sm text-muted-foreground mt-6">
                이미 계정이 있으신가요?{" "}
                <button
                  onClick={() => onNavigate("login")}
                  className="text-primary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  로그인
                </button>
              </p>

            </>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />

      {policyModal && (
        <PolicyAgreementModal
          kind={policyModal}
          alreadyRead={policyModal === "terms" ? termsRead : privacyRead}
          onClose={() => setPolicyModal(null)}
          onAgree={() => {
            if (policyModal === "terms") {
              setTermsRead(true);
              setAgreeTerms(true);
            } else {
              setPrivacyRead(true);
              setAgreePrivacy(true);
            }
            clearError("agree");
            setPolicyModal(null);
          }}
        />
      )}
    </div>
  );
}
