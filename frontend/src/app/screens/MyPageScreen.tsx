import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, UserRound, KeyRound, ScrollText, ShieldAlert, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";
import type { AuthUser, MyPageSection, Screen } from "@/app/types";
import { useHistory } from "@/app/hooks/useHistory";
import { useInquiries } from "@/app/hooks/useInquiries";
import { isValidEmail } from "@/app/utils/validation";
import { PageHeader } from "@/app/components/common/PageHeader";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

const PASSWORD_MESSAGE = "영문, 숫자, 기호를 포함해 8~15자로 입력해 주세요.";
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,15}$/;

const MY_PAGE_TABS: { section: MyPageSection; label: string }[] = [
  { section: "profile", label: "프로필 설정" },
  { section: "password", label: "비밀번호 변경" },
  { section: "history", label: "작명 기록" },
  { section: "inquiries", label: "문의 내역" },
  { section: "account", label: "계정 관리" },
];

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm border bg-white placeholder:text-faint focus:outline-none transition-all ${
    hasError
      ? "border-destructive focus:ring-1 focus:ring-destructive"
      : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
  }`;

function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const detail = error.detail as { message?: string } | undefined;
    return detail?.message ?? error.message ?? fallback;
  }
  return fallback;
}

function isMyPageSection(value: string | null): value is MyPageSection {
  return MY_PAGE_TABS.some((item) => item.section === value);
}

/** 섹션 공통 카드 프레임 — 아이콘 + 타이틀 + 내용 */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-border p-6 sm:p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-primary flex-shrink-0">
          <Icon size={16} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-caption break-keep mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function MyPageScreen({
  user,
  onUpdateUser,
  onLogout,
  onNavigate,
}: {
  user: AuthUser;
  onUpdateUser: (u: AuthUser) => void;
  onLogout: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeSection = isMyPageSection(sectionParam) ? sectionParam : "profile";

  // ── 프로필 (이름/아이디 읽기 전용, 이메일 수정) ──
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── 비밀번호 변경 ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [savingPw, setSavingPw] = useState(false);

  // ── 회원 탈퇴 ──
  const [withdrawPw, setWithdrawPw] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: historyEntries = [] } = useHistory();
  const { data: inquiries = [] } = useInquiries();
  const totalRequests = historyEntries.length;
  const totalSaved = historyEntries.reduce((sum, e) => sum + e.savedCount, 0);
  const recentEntries = historyEntries.slice(0, 5);

  const handleSectionChange = (section: MyPageSection) => {
    if (section === "profile") {
      setSearchParams({});
      return;
    }
    setSearchParams({ section });
  };

  const handleSaveProfile = async () => {
    const email = profileEmail.trim();
    if (!email) {
      setProfileError("이메일을 입력해 주세요.");
      return;
    }
    if (!isValidEmail(email)) {
      setProfileError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setProfileError("");
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({ email });
      onUpdateUser(updated);
      toast.success("프로필이 저장되었습니다.");
    } catch (error) {
      setProfileError(getApiMessage(error, "프로필 저장에 실패했습니다."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const next: typeof pwErrors = {};
    if (!currentPw) next.current = "현재 비밀번호를 입력해 주세요.";
    if (!newPw) next.next = "새 비밀번호를 입력해 주세요.";
    else if (!PASSWORD_RE.test(newPw)) next.next = PASSWORD_MESSAGE;
    else if (newPw === currentPw) next.next = "현재 비밀번호와 다른 비밀번호를 사용해 주세요.";
    if (!confirmPw) next.confirm = "새 비밀번호를 한 번 더 입력해 주세요.";
    else if (newPw && confirmPw !== newPw) next.confirm = "비밀번호가 일치하지 않습니다.";
    setPwErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, nextPassword: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("비밀번호가 변경되었습니다.");
    } catch (error) {
      setPwErrors((prev) => ({
        ...prev,
        current: getApiMessage(error, "비밀번호 변경에 실패했습니다."),
      }));
    } finally {
      setSavingPw(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawPw) {
      setWithdrawError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    setWithdrawError("");
    setWithdrawing(true);
    try {
      await authApi.withdraw({ currentPassword: withdrawPw });
      toast.success("탈퇴 처리가 완료되었습니다.", {
        description: "그동안 명가작명소를 이용해 주셔서 감사합니다.",
      });
      onLogout();
    } catch (error) {
      setWithdrawError(getApiMessage(error, "탈퇴 처리에 실패했습니다."));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow="My Page"
          title="마이페이지"
          description="프로필과 계정 설정, 작명 기록을 한곳에서 관리하세요."
          watermark="我"
        />

        <nav
          aria-label="마이페이지 메뉴"
          className="mb-8 grid grid-cols-2 sm:grid-cols-5 border border-border bg-white"
        >
          {MY_PAGE_TABS.map((item) => {
            const selected = activeSection === item.section;
            return (
              <button
                key={item.section}
                type="button"
                onClick={() => handleSectionChange(item.section)}
                aria-current={selected ? "page" : undefined}
                className={`min-h-11 px-3 text-xs sm:text-sm font-medium border-b sm:border-b-0 sm:border-r border-border last:border-r-0 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  selected
                    ? "bg-primary/10 text-primary"
                    : "text-label hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          {/* ── 좌측: 프로필 요약 카드 ── */}
          <Reveal>
            <aside className="bg-white border border-border p-6 text-center lg:sticky lg:top-24">
              <div
                className="font-hanja w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold select-none"
                aria-hidden="true"
              >
                {user.name.charAt(0)}
              </div>
              <p className="text-base font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-caption mt-0.5">{user.username}</p>
              <p className="text-xs text-hint mt-0.5">{user.email}</p>
              <p className="text-[11px] text-hint mt-1">가입일 {user.joinedAt ?? "-"}</p>

              <div className="grid grid-cols-2 divide-x divide-muted border-t border-muted mt-5 pt-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">{totalRequests}</p>
                  <p className="text-[11px] text-caption">작명 요청</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">{totalSaved}</p>
                  <p className="text-[11px] text-caption">저장한 이름</p>
                </div>
              </div>

              <GhostButton onClick={onLogout} className="w-full px-4 py-2.5 text-xs mt-5">
                로그아웃
              </GhostButton>
            </aside>
          </Reveal>

          {/* ── 우측: 설정 섹션들 ── */}
          <div className="space-y-4">
            {/* 프로필 설정 */}
            {activeSection === "profile" && (
            <Reveal delay={60}>
              <SectionCard
                icon={UserRound}
                title="프로필 설정"
                description="이름과 아이디는 가입 기준값으로 유지하고, 이메일만 수정할 수 있습니다."
              >
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="mp-name" className="block text-xs font-medium text-label mb-1.5">
                      이름
                    </label>
                    <input
                      id="mp-name"
                      type="text"
                      value={user.name}
                      readOnly
                      aria-readonly="true"
                      tabIndex={-1}
                      className="w-full px-3 py-2.5 text-sm border border-border bg-muted/40 text-caption cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="mp-username" className="block text-xs font-medium text-label mb-1.5">
                      아이디
                    </label>
                    <input
                      id="mp-username"
                      type="text"
                      value={user.username}
                      readOnly
                      aria-readonly="true"
                      tabIndex={-1}
                      className="w-full px-3 py-2.5 text-sm border border-border bg-muted/40 text-caption cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label htmlFor="mp-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일
                  </label>
                  <input
                    id="mp-email"
                    type="email"
                    autoComplete="email"
                    value={profileEmail}
                    onChange={(e) => {
                      setProfileEmail(e.target.value);
                      setProfileError("");
                    }}
                    aria-invalid={!!profileError}
                    className={inputClass(!!profileError)}
                  />
                  {profileError ? (
                    <p role="alert" className="text-xs text-destructive mt-1">{profileError}</p>
                  ) : (
                    <p className="text-[11px] text-hint mt-1">
                      아이디 로그인 기준은 유지되며, 안내 수신용 이메일만 변경됩니다.
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <PrimaryButton
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
                  >
                    {savingProfile ? "저장 중…" : "프로필 저장"}
                  </PrimaryButton>
                </div>
              </SectionCard>
            </Reveal>
            )}

            {/* 비밀번호 변경 */}
            {activeSection === "password" && (
            <Reveal delay={90}>
              <SectionCard
                icon={KeyRound}
                title="비밀번호 변경"
                description="영문, 숫자, 기호를 포함한 8~15자의 새 비밀번호를 설정해 주세요."
              >
                <div className="space-y-4 mb-5">
                  <div>
                    <label htmlFor="mp-pw-current" className="block text-xs font-medium text-label mb-1.5">
                      현재 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        id="mp-pw-current"
                        type={showCurrentPw ? "text" : "password"}
                        autoComplete="current-password"
                        value={currentPw}
                        onChange={(e) => {
                          setCurrentPw(e.target.value);
                          setPwErrors((prev) => ({ ...prev, current: undefined }));
                        }}
                        placeholder="••••••••"
                        aria-invalid={!!pwErrors.current}
                        className={`${inputClass(!!pwErrors.current)} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        aria-label={showCurrentPw ? "현재 비밀번호 숨기기" : "현재 비밀번호 표시"}
                        className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        {showCurrentPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </div>
                    {pwErrors.current && (
                      <p role="alert" className="text-xs text-destructive mt-1">{pwErrors.current}</p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="mp-pw-new" className="block text-xs font-medium text-label mb-1.5">
                        새 비밀번호
                      </label>
                      <div className="relative">
                        <input
                          id="mp-pw-new"
                          type={showNewPw ? "text" : "password"}
                          autoComplete="new-password"
                          value={newPw}
                          onChange={(e) => {
                            setNewPw(e.target.value);
                            setPwErrors((prev) => ({ ...prev, next: undefined, confirm: undefined }));
                          }}
                          placeholder="영문+숫자+기호 8~15자"
                          aria-invalid={!!pwErrors.next}
                          className={`${inputClass(!!pwErrors.next)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw((v) => !v)}
                          aria-label={showNewPw ? "새 비밀번호 숨기기" : "새 비밀번호 표시"}
                          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          {showNewPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                        </button>
                      </div>
                      {pwErrors.next && (
                        <p role="alert" className="text-xs text-destructive mt-1">{pwErrors.next}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="mp-pw-confirm" className="block text-xs font-medium text-label mb-1.5">
                        새 비밀번호 확인
                        {confirmPw && !pwErrors.confirm && (
                          <span className={`ml-2 font-normal ${confirmPw === newPw ? "text-pine" : "text-destructive"}`}>
                            {confirmPw === newPw ? "일치합니다" : "일치하지 않습니다"}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          id="mp-pw-confirm"
                          type={showConfirmPw ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPw}
                          onChange={(e) => {
                            setConfirmPw(e.target.value);
                            setPwErrors((prev) => ({ ...prev, confirm: undefined }));
                          }}
                          placeholder="••••••••"
                          aria-invalid={!!pwErrors.confirm}
                          className={`${inputClass(!!pwErrors.confirm)} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw((v) => !v)}
                          aria-label={showConfirmPw ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 표시"}
                          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-caption hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          {showConfirmPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                        </button>
                      </div>
                      {pwErrors.confirm && (
                        <p role="alert" className="text-xs text-destructive mt-1">{pwErrors.confirm}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <PrimaryButton
                    onClick={handleChangePassword}
                    disabled={savingPw}
                    className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
                  >
                    {savingPw ? "변경 중…" : "비밀번호 변경"}
                  </PrimaryButton>
                </div>
              </SectionCard>
            </Reveal>
            )}

            {/* 작명 기록 */}
            {activeSection === "history" && (
            <Reveal delay={120}>
              <SectionCard
                icon={ScrollText}
                title="작명 기록"
                description="최근 요청한 작명을 바로 확인할 수 있습니다."
              >
                <ul className="space-y-2.5 mb-4">
                  {recentEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-4 border border-border px-4 py-3"
                    >
                      <div className="flex-shrink-0 w-24">
                        <p
                          className="font-hanja text-lg font-light text-foreground leading-tight"
                          lang="ko-Hani"
                        >
                          {entry.topName.hanja}
                        </p>
                        <p className="text-xs font-semibold text-secondary-foreground">
                          {entry.topName.hangul}
                        </p>
                      </div>
                      <p className="flex-1 min-w-0 text-xs text-ink break-keep leading-relaxed line-clamp-2">
                        “{entry.query}”
                      </p>
                      <span className="text-[11px] text-caption whitespace-nowrap tabular-nums hidden sm:inline">
                        {entry.date}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <GhostButton onClick={() => onNavigate("history")} className="px-5 py-2.5 text-xs">
                    전체 기록 보기 →
                  </GhostButton>
                </div>
              </SectionCard>
            </Reveal>
            )}

            {/* 문의 내역 */}
            {activeSection === "inquiries" && (
            <Reveal delay={120}>
              <SectionCard
                icon={MessageSquare}
                title="문의 내역"
                description="고객센터에 남기신 문의 내역과 답변을 확인할 수 있습니다."
              >
                {inquiries.length === 0 ? (
                  <div className="py-10 text-center border border-border bg-muted/20">
                    <p className="text-sm text-caption">등록된 문의 내역이 없습니다.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {inquiries.map((inq) => (
                      <li key={inq.id} className="border border-border bg-white">
                        <div className="px-5 py-4 border-b border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-muted text-secondary-foreground">
                              {inq.topic || "일반 문의"}
                            </span>
                            <span className={`text-[11px] font-medium ${
                              inq.status === "answered" ? "text-primary" : "text-caption"
                            }`}>
                              {inq.status === "answered" ? "답변 완료" : (inq.status === "in_progress" ? "처리 중" : "접수 완료")}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground break-keep">{inq.subject}</p>
                          <p className="text-xs text-caption mt-1">{inq.createdAt.split("T")[0]}</p>
                          <div className="mt-3 text-xs text-ink whitespace-pre-wrap leading-relaxed bg-muted/20 p-3">
                            {inq.message}
                          </div>
                        </div>
                        {inq.status === "answered" && inq.adminReply && (
                          <div className="px-5 py-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-primary">명가작명소 고객센터</span>
                              <span className="text-[11px] text-caption">{inq.answeredAt?.split("T")[0]}</span>
                            </div>
                            <div className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                              {inq.adminReply}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end mt-4">
                  <GhostButton onClick={() => onNavigate("contact")} className="px-5 py-2.5 text-xs">
                    새 문의 남기기 →
                  </GhostButton>
                </div>
              </SectionCard>
            </Reveal>
            )}

            {/* 계정 관리 */}
            {activeSection === "account" && (
            <Reveal delay={150}>
              <SectionCard
                icon={ShieldAlert}
                title="계정 관리"
                description="탈퇴 시 저장한 이름과 작명 기록이 모두 삭제됩니다."
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-ink break-keep">
                    탈퇴 후에는 데이터를 복구할 수 없습니다. 신중하게 결정해 주세요.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <GhostButton tone="destructive" className="px-5 py-2.5 text-xs flex-shrink-0">
                        회원 탈퇴
                      </GhostButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">정말 탈퇴하시겠어요?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-ink break-keep">
                          저장한 이름 {totalSaved}개와 작명 기록 {totalRequests}건이 모두 삭제되며,
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div>
                        <label htmlFor="mp-withdraw-password" className="block text-xs font-medium text-label mb-1.5">
                          현재 비밀번호 확인
                        </label>
                        <input
                          id="mp-withdraw-password"
                          type="password"
                          autoComplete="current-password"
                          value={withdrawPw}
                          onChange={(e) => {
                            setWithdrawPw(e.target.value);
                            setWithdrawError("");
                          }}
                          placeholder="••••••••"
                          aria-invalid={!!withdrawError}
                          className={inputClass(!!withdrawError)}
                        />
                        {withdrawError && (
                          <p role="alert" className="text-xs text-destructive mt-1">{withdrawError}</p>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none text-xs border-border hover:border-primary hover:text-primary">
                          취소
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(event) => {
                            event.preventDefault();
                            handleWithdraw();
                          }}
                          disabled={withdrawing}
                          className="rounded-none text-xs bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {withdrawing ? "처리 중…" : "탈퇴하기"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SectionCard>
            </Reveal>
            )}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
