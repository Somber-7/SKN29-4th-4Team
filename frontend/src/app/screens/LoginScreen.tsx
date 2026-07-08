import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";
import type { AuthUser, Screen } from "@/app/types";
import { PrimaryButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

/** 어떤 계정이 존재하는지 힌트를 주지 않는 공용 오류 문구 */
const INVALID_CREDENTIALS = "아이디 또는 비밀번호를 확인해 주세요.";
const USERNAME_MESSAGE = "아이디는 영문, 숫자, 밑줄(_) 4~20자로 입력해 주세요.";
const USERNAME_RE = /^[A-Za-z0-9_]{4,20}$/;
const PASSWORD_MESSAGE = "영문, 숫자, 기호를 포함해 8~15자로 입력해 주세요.";
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,15}$/;

type View = "login" | "find-id" | "find-id-done" | "reset-verify" | "reset-password" | "reset-done";
interface ResetErrors {
  name?: string;
  username?: string;
  email?: string;
  nextPassword?: string;
  confirm?: string;
}
interface FindIdErrors {
  name?: string;
  email?: string;
}

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

function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const detail = error.detail as { message?: string } | undefined;
    return detail?.message ?? error.message ?? fallback;
  }
  return fallback;
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 아이디 찾기 폼
  const [findIdName, setFindIdName] = useState("");
  const [findIdEmail, setFindIdEmail] = useState("");
  const [findIdErrors, setFindIdErrors] = useState<FindIdErrors>({});
  const [isFindingId, setIsFindingId] = useState(false);
  const [foundUsername, setFoundUsername] = useState("");

  // 비밀번호 재설정 폼
  const [resetName, setResetName] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetErrors, setResetErrors] = useState<ResetErrors>({});
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const validateUsernameField = (value: string) => {
    if (!value.trim()) return "아이디를 입력해 주세요.";
    if (!USERNAME_RE.test(value.trim())) return USERNAME_MESSAGE;
    return undefined;
  };

  const validateEmailField = (value: string) => {
    if (!value.trim()) return "이메일을 입력해 주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "올바른 이메일 형식이 아닙니다.";
    return undefined;
  };

  const validateResetPasswordField = (value: string) => {
    if (!value) return "새 비밀번호를 입력해 주세요.";
    if (!PASSWORD_RE.test(value)) return PASSWORD_MESSAGE;
    return undefined;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const next: { username?: string; password?: string } = {};
    const usernameError = validateUsernameField(username);
    if (usernameError) next.username = usernameError;
    if (!password) next.password = "비밀번호를 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const user = await authApi.login({ username: username.trim(), password });
      onLogin(user);
      toast.success(`${user.name}님, 환영합니다.`, { duration: 3500, id: "welcome" });
      onNavigate(user.role === "admin" ? "adminDashboard" : redirectTo);
    } catch (error) {
      setErrors({ password: getApiMessage(error, INVALID_CREDENTIALS) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setResetUsername(username);
    setResetPassword("");
    setResetConfirm("");
    setResetErrors({});
    setView("reset-verify");
  };

  const openFindId = () => {
    setFindIdName("");
    setFindIdEmail("");
    setFindIdErrors({});
    setView("find-id");
  };

  const handleFindUsername = async () => {
    if (isFindingId) return;
    const next: FindIdErrors = {};
    if (!findIdName.trim()) next.name = "이름을 입력해 주세요.";
    const emailError = validateEmailField(findIdEmail);
    if (emailError) next.email = emailError;
    setFindIdErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsFindingId(true);
    try {
      const { username: found } = await authApi.findUsername({
        name: findIdName.trim(),
        email: findIdEmail.trim(),
      });
      setFoundUsername(found);
      setView("find-id-done");
    } catch (error) {
      setFindIdErrors((prev) => ({
        ...prev,
        email: getApiMessage(error, "일치하는 계정을 찾을 수 없습니다."),
      }));
    } finally {
      setIsFindingId(false);
    }
  };

  /** 아이디 찾기 결과 → 찾은 아이디로 로그인 폼에 복귀 */
  const continueToLoginWithFoundId = () => {
    setUsername(foundUsername);
    setView("login");
  };

  /** 아이디 찾기 결과 → 같은 계정으로 비밀번호 재설정 이어가기 */
  const continueToResetFromFindId = () => {
    setResetUsername(foundUsername);
    setResetPassword("");
    setResetConfirm("");
    setResetErrors({});
    setView("reset-verify");
  };

  const handleVerifyResetAccount = async () => {
    if (isVerifyingReset) return;
    const next: ResetErrors = {};
    if (!resetName.trim()) next.name = "이름을 입력해 주세요.";
    const usernameError = validateUsernameField(resetUsername);
    if (usernameError) next.username = usernameError;
    const emailError = validateEmailField(resetEmail);
    if (emailError) next.email = emailError;
    setResetErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsVerifyingReset(true);
    try {
      await authApi.verifyPasswordResetAccount({
        name: resetName.trim(),
        username: resetUsername.trim(),
        email: resetEmail.trim(),
      });
      setResetPassword("");
      setResetConfirm("");
      setResetErrors({});
      setView("reset-password");
    } catch (error) {
      setResetErrors((prev) => ({
        ...prev,
        email: getApiMessage(error, "가입 정보를 확인할 수 없습니다."),
      }));
    } finally {
      setIsVerifyingReset(false);
    }
  };

  const handleSendReset = async () => {
    if (isResetting) return;
    const next: ResetErrors = {};
    const passwordError = validateResetPasswordField(resetPassword);
    if (passwordError) next.nextPassword = passwordError;
    if (!resetConfirm) next.confirm = "새 비밀번호를 한 번 더 입력해 주세요.";
    else if (resetPassword && resetConfirm !== resetPassword) next.confirm = "비밀번호가 일치하지 않습니다.";
    setResetErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsResetting(true);
    try {
      await authApi.resetPassword({
        name: resetName.trim(),
        username: resetUsername.trim(),
        email: resetEmail.trim(),
        nextPassword: resetPassword,
      });
      setPassword("");
      setResetPassword("");
      setResetConfirm("");
      setView("reset-done");
    } catch (error) {
      setResetErrors((prev) => ({
        ...prev,
        confirm: getApiMessage(error, "비밀번호 재설정에 실패했습니다."),
      }));
    } finally {
      setIsResetting(false);
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
                  <label htmlFor="login-username" className="block text-xs font-medium text-label mb-1.5">
                    아이디
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((prev) => ({ ...prev, username: undefined }));
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
                  <label htmlFor="login-password" className="block text-xs font-medium text-label mb-1.5">
                    비밀번호
                  </label>
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
                  <div className="flex items-center justify-center gap-3 mt-2.5">
                    <button
                      type="button"
                      onClick={openFindId}
                      className="text-[11px] text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      아이디 찾기
                    </button>
                    <span className="text-border" aria-hidden="true">|</span>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-[11px] text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      비밀번호 찾기
                    </button>
                  </div>
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

          {view === "find-id" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Find ID</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">아이디 찾기</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  가입 시 입력한 이름과 이메일로 아이디를 확인합니다.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div>
                  <label htmlFor="find-id-name" className="block text-xs font-medium text-label mb-1.5">
                    이름
                  </label>
                  <input
                    id="find-id-name"
                    type="text"
                    autoComplete="name"
                    value={findIdName}
                    disabled={isFindingId}
                    onChange={(e) => {
                      setFindIdName(e.target.value);
                      setFindIdErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="홍길동"
                    aria-invalid={!!findIdErrors.name}
                    className={inputClass(!!findIdErrors.name)}
                  />
                  {findIdErrors.name && (
                    <p role="alert" className="text-xs text-destructive mt-1">{findIdErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="find-id-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="find-id-email"
                    type="email"
                    autoComplete="email"
                    value={findIdEmail}
                    disabled={isFindingId}
                    onChange={(e) => {
                      setFindIdEmail(e.target.value);
                      setFindIdErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFindUsername();
                    }}
                    placeholder="name@example.com"
                    aria-invalid={!!findIdErrors.email}
                    className={inputClass(!!findIdErrors.email)}
                  />
                  {findIdErrors.email && (
                    <p role="alert" className="text-xs text-destructive mt-1">{findIdErrors.email}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleFindUsername}
                  disabled={isFindingId}
                  aria-busy={isFindingId}
                  className="w-full px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  {isFindingId && <ButtonSpinner />}
                  {isFindingId ? "확인 중" : "아이디 찾기"}
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

          {view === "find-id-done" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Find ID</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">아이디 확인 완료</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  입력하신 정보와 일치하는 아이디를 찾았습니다.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div className="border border-muted bg-muted/20 p-4 text-center">
                  <p className="text-xs text-label mb-1">회원님의 아이디</p>
                  <p className="text-lg font-semibold text-foreground tracking-wide">{foundUsername}</p>
                </div>

                <PrimaryButton onClick={continueToLoginWithFoundId} className="w-full px-4 py-3">
                  이 아이디로 로그인하기
                </PrimaryButton>

                <button
                  type="button"
                  onClick={continueToResetFromFindId}
                  className="w-full text-center text-xs text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  비밀번호도 재설정하기
                </button>
              </div>
            </>
          )}

          {view === "reset-verify" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Password Reset</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">비밀번호 재설정</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  가입 시 입력한 이름, 아이디, 이메일을 먼저 확인합니다.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div>
                  <label htmlFor="reset-name" className="block text-xs font-medium text-label mb-1.5">
                    이름
                  </label>
                  <input
                    id="reset-name"
                    type="text"
                    autoComplete="name"
                    value={resetName}
                    disabled={isVerifyingReset}
                    onChange={(e) => {
                      setResetName(e.target.value);
                      setResetErrors((prev) => ({ ...prev, name: undefined, confirm: undefined }));
                    }}
                    placeholder="홍길동"
                    aria-invalid={!!resetErrors.name}
                    className={inputClass(!!resetErrors.name)}
                  />
                  {resetErrors.name && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reset-username" className="block text-xs font-medium text-label mb-1.5">
                    아이디
                  </label>
                  <input
                    id="reset-username"
                    type="text"
                    autoComplete="username"
                    value={resetUsername}
                    disabled={isVerifyingReset}
                    onChange={(e) => {
                      setResetUsername(e.target.value);
                      setResetErrors((prev) => ({ ...prev, username: undefined, confirm: undefined }));
                    }}
                    placeholder="myeongga01"
                    aria-invalid={!!resetErrors.username}
                    className={inputClass(!!resetErrors.username)}
                  />
                  {resetErrors.username && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetErrors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    disabled={isVerifyingReset}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetErrors((prev) => ({ ...prev, email: undefined, confirm: undefined }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerifyResetAccount();
                    }}
                    placeholder="name@example.com"
                    aria-invalid={!!resetErrors.email}
                    className={inputClass(!!resetErrors.email)}
                  />
                  {resetErrors.email && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetErrors.email}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleVerifyResetAccount}
                  disabled={isVerifyingReset}
                  aria-busy={isVerifyingReset}
                  className="w-full px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  {isVerifyingReset && <ButtonSpinner />}
                  {isVerifyingReset ? "확인 중" : "가입 정보 확인"}
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

          {view === "reset-password" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Password Reset</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">새 비밀번호 설정</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  가입 정보가 확인되었습니다. 새 비밀번호를 입력해 주세요.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-5">
                <div className="grid grid-cols-1 gap-3 text-xs text-caption border border-muted bg-muted/20 p-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-label">이름</span>
                    <span className="text-foreground font-medium truncate">{resetName.trim()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-label">아이디</span>
                    <span className="text-foreground font-medium truncate">{resetUsername.trim()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-label">이메일</span>
                    <span className="text-foreground font-medium truncate">{resetEmail.trim()}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-password" className="block text-xs font-medium text-label mb-1.5">
                    새 비밀번호 <span className="font-normal text-caption">(영문+숫자+기호 8~15자)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showResetPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={resetPassword}
                      disabled={isResetting}
                      onChange={(e) => {
                        setResetPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, nextPassword: undefined, confirm: undefined }));
                      }}
                      placeholder="••••••••"
                      aria-invalid={!!resetErrors.nextPassword}
                      className={`${inputClass(!!resetErrors.nextPassword)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((v) => !v)}
                      aria-label={showResetPassword ? "새 비밀번호 숨기기" : "새 비밀번호 표시"}
                      className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {showResetPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  {resetErrors.nextPassword && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetErrors.nextPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-xs font-medium text-label mb-1.5">
                    새 비밀번호 확인
                    {resetConfirm && !resetErrors.confirm && (
                      <span className={`ml-2 font-normal ${resetConfirm === resetPassword ? "text-pine" : "text-destructive"}`}>
                        {resetConfirm === resetPassword ? "일치합니다" : "일치하지 않습니다"}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id="reset-confirm"
                      type={showResetConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={resetConfirm}
                      disabled={isResetting}
                      onChange={(e) => {
                        setResetConfirm(e.target.value);
                        setResetErrors((prev) => ({ ...prev, confirm: undefined }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendReset();
                      }}
                      placeholder="••••••••"
                      aria-invalid={!!resetErrors.confirm}
                      className={`${inputClass(!!resetErrors.confirm)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm((v) => !v)}
                      aria-label={showResetConfirm ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 표시"}
                      className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {showResetConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                  {resetErrors.confirm && (
                    <p role="alert" className="text-xs text-destructive mt-1">{resetErrors.confirm}</p>
                  )}
                </div>

                <PrimaryButton
                  onClick={handleSendReset}
                  disabled={isResetting}
                  aria-busy={isResetting}
                  className="w-full px-4 py-3 inline-flex items-center justify-center gap-2"
                >
                  {isResetting && <ButtonSpinner />}
                  {isResetting ? "재설정 중" : "비밀번호 재설정"}
                </PrimaryButton>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setView("reset-verify")}
                    className="w-full text-center text-xs text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    ← 가입 정보 다시 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="w-full text-center text-xs text-caption hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    로그인으로 돌아가기
                  </button>
                </div>
              </div>
            </>
          )}

          {view === "reset-done" && (
            <>
              <div className="relative z-10 mb-8 text-center">
                <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">Password Reset</p>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">재설정 완료</h1>
                <p className="text-sm text-muted-foreground break-keep">
                  새 비밀번호로 다시 로그인해 주세요.
                </p>
              </div>

              <div className="relative z-10 bg-white border border-border p-7 space-y-4">
                <p className="text-xs text-hint leading-relaxed break-keep">
                  가입 시 등록한 이름, 아이디, 이메일이 모두 일치하는 경우에만 비밀번호가 변경됩니다.
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
