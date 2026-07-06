import { useState } from "react";
import { UserRound, KeyRound, ScrollText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser, Screen } from "@/app/types";
import { useHistory } from "@/app/hooks/useHistory";
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

/** 데모용 프로필 부가 정보 (시안 단계 — API 연동 전) */
const DEMO_JOINED_AT = "2026.05.12";
const DEMO_CURRENT_PASSWORD = "user1234";

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm border bg-white placeholder:text-faint focus:outline-none transition-all ${
    hasError
      ? "border-destructive focus:ring-1 focus:ring-destructive"
      : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
  }`;

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
  // ── 프로필 (닉네임·연락처) ──
  const [nickname, setNickname] = useState(user.name);
  const [nicknameError, setNicknameError] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── 비밀번호 변경 ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [savingPw, setSavingPw] = useState(false);

  const { data: historyEntries = [] } = useHistory();
  const totalRequests = historyEntries.length;
  const totalSaved = historyEntries.reduce((sum, e) => sum + e.savedCount, 0);
  const recentEntries = historyEntries.slice(0, 2);

  const handleSaveProfile = () => {
    // TODO(API): PATCH /me 로 대체
    const name = nickname.trim();
    if (!name) {
      setNicknameError("닉네임을 입력해 주세요.");
      return;
    }
    if ([...name].length > 10) {
      setNicknameError("닉네임은 10자 이내로 입력해 주세요.");
      return;
    }
    setNicknameError("");
    // TODO: API 연동 — 저장 시뮬레이션
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      onUpdateUser({ ...user, name });
      toast.success("프로필이 저장되었습니다.");
    }, 600);
  };

  const handleChangePassword = () => {
    const next: typeof pwErrors = {};
    if (!currentPw) next.current = "현재 비밀번호를 입력해 주세요.";
    else if (currentPw !== DEMO_CURRENT_PASSWORD)
      next.current = "현재 비밀번호가 올바르지 않습니다. (데모: user1234)";
    if (!newPw) next.next = "새 비밀번호를 입력해 주세요.";
    else if (newPw.length < 8) next.next = "비밀번호는 8자 이상이어야 합니다.";
    else if (newPw === currentPw) next.next = "현재 비밀번호와 다른 비밀번호를 사용해 주세요.";
    if (!confirmPw) next.confirm = "새 비밀번호를 한 번 더 입력해 주세요.";
    else if (newPw && confirmPw !== newPw) next.confirm = "비밀번호가 일치하지 않습니다.";
    setPwErrors(next);
    if (Object.keys(next).length > 0) return;

    // TODO: API 연동 — 변경 시뮬레이션
    setSavingPw(true);
    setTimeout(() => {
      setSavingPw(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("비밀번호가 변경되었습니다.", {
        description: "지금은 시안 단계로, 실제 계정에는 반영되지 않습니다.",
      });
    }, 700);
  };

  const handleWithdraw = () => {
    toast.success("탈퇴 처리가 완료되었습니다.", {
      description: "그동안 명가작명소를 이용해 주셔서 감사합니다.",
    });
    onLogout();
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
              <p className="text-xs text-caption mt-0.5">{user.email}</p>
              <p className="text-[11px] text-hint mt-1">가입일 {DEMO_JOINED_AT}</p>

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
            <Reveal delay={60}>
              <SectionCard
                icon={UserRound}
                title="프로필 설정"
                description="닉네임과 연락처를 수정할 수 있습니다."
              >
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="mp-nickname" className="block text-xs font-medium text-label mb-1.5">
                      닉네임
                    </label>
                    <input
                      id="mp-nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value);
                        setNicknameError("");
                      }}
                      maxLength={10}
                      aria-invalid={!!nicknameError}
                      className={inputClass(!!nicknameError)}
                    />
                    {nicknameError && (
                      <p role="alert" className="text-xs text-destructive mt-1">{nicknameError}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="mp-phone" className="block text-xs font-medium text-label mb-1.5">
                      휴대폰 번호 <span className="font-normal text-caption">(선택)</span>
                    </label>
                    <input
                      id="mp-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      autoComplete="tel"
                      className={inputClass(false)}
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label htmlFor="mp-email" className="block text-xs font-medium text-label mb-1.5">
                    이메일 (로그인 계정)
                  </label>
                  <input
                    id="mp-email"
                    type="email"
                    value={user.email}
                    readOnly
                    aria-readonly="true"
                    tabIndex={-1}
                    className="w-full px-3 py-2.5 text-sm border border-border bg-muted/40 text-caption cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[11px] text-hint mt-1">
                    로그인 계정 이메일은 변경할 수 없습니다. 변경이 필요하면 문의를 남겨 주세요.
                  </p>
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

            {/* 비밀번호 변경 */}
            <Reveal delay={90}>
              <SectionCard
                icon={KeyRound}
                title="비밀번호 변경"
                description="8자 이상의 새 비밀번호를 설정해 주세요."
              >
                <div className="space-y-4 mb-5">
                  <div>
                    <label htmlFor="mp-pw-current" className="block text-xs font-medium text-label mb-1.5">
                      현재 비밀번호
                    </label>
                    <input
                      id="mp-pw-current"
                      type="password"
                      autoComplete="current-password"
                      value={currentPw}
                      onChange={(e) => {
                        setCurrentPw(e.target.value);
                        setPwErrors((prev) => ({ ...prev, current: undefined }));
                      }}
                      placeholder="••••••••"
                      aria-invalid={!!pwErrors.current}
                      className={inputClass(!!pwErrors.current)}
                    />
                    {pwErrors.current && (
                      <p role="alert" className="text-xs text-destructive mt-1">{pwErrors.current}</p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="mp-pw-new" className="block text-xs font-medium text-label mb-1.5">
                        새 비밀번호
                      </label>
                      <input
                        id="mp-pw-new"
                        type="password"
                        autoComplete="new-password"
                        value={newPw}
                        onChange={(e) => {
                          setNewPw(e.target.value);
                          setPwErrors((prev) => ({ ...prev, next: undefined }));
                        }}
                        placeholder="••••••••"
                        aria-invalid={!!pwErrors.next}
                        className={inputClass(!!pwErrors.next)}
                      />
                      {pwErrors.next && (
                        <p role="alert" className="text-xs text-destructive mt-1">{pwErrors.next}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="mp-pw-confirm" className="block text-xs font-medium text-label mb-1.5">
                        새 비밀번호 확인
                      </label>
                      <input
                        id="mp-pw-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPw}
                        onChange={(e) => {
                          setConfirmPw(e.target.value);
                          setPwErrors((prev) => ({ ...prev, confirm: undefined }));
                        }}
                        placeholder="••••••••"
                        aria-invalid={!!pwErrors.confirm}
                        className={inputClass(!!pwErrors.confirm)}
                      />
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

            {/* 작명 기록 */}
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

            {/* 계정 관리 */}
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
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none text-xs border-border hover:border-primary hover:text-primary">
                          취소
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleWithdraw}
                          className="rounded-none text-xs bg-destructive text-destructive-foreground hover:opacity-90"
                        >
                          탈퇴하기
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SectionCard>
            </Reveal>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
