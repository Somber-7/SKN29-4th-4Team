import { useEffect, useState } from "react";
import type { NameRequest } from "@/app/types";
import { formatNameRequest } from "@/app/utils/formatNameRequest";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { useNameResults } from "@/app/hooks/useNameResults";

/** 서비스 소개의 4단계 검증 프로세스와 동일한 순서로 진행 상황을 표현 (한자 이름) */
const HANJA_STEPS = [
  {
    label: "조건을 분석하는 중",
    desc: "입력하신 문장에서 성씨·오행·획수·의미를 추출합니다.",
  },
  {
    label: "한자·오행을 대조하는 중",
    desc: "자원오행 사전과 획수 조합을 정밀 대조합니다.",
  },
  {
    label: "법령·81수리를 검증하는 중",
    desc: "대법원 인명용 한자 등재와 81수리 4격을 확인합니다.",
  },
  {
    label: "최적의 이름을 엄선하는 중",
    desc: "검증을 통과한 이름만 근거와 함께 정리합니다.",
  },
];

/** 순우리말 이름 전용 단계 — 오행·획수·한자를 사용하지 않으므로 문구를 별도로 둔다 */
const KOREAN_STEPS = [
  {
    label: "조건을 분석하는 중",
    desc: "입력하신 문장에서 성씨·느낌·의미를 추출합니다.",
  },
  {
    label: "순우리말 낱말을 찾는 중",
    desc: "뜻과 어감이 어울리는 순우리말 낱말을 검색합니다.",
  },
  {
    label: "이름으로 어울리는지 검증하는 중",
    desc: "성씨와의 발음 조화, 어색한 표현 여부를 확인합니다.",
  },
  {
    label: "최적의 이름을 엄선하는 중",
    desc: "검증을 통과한 이름만 근거와 함께 정리합니다.",
  },
];

/** 단계 사이 전환 간격 */
const STEP_INTERVAL_MS = 1400;
/** 결과가 준비된 뒤 결과 화면으로 넘어가기까지의 지연 */
const COMPLETE_DELAY_MS = 600;
/** 마지막 단계 인덱스 — 실 응답이 도착할 때까지 여기서 대기한다 (두 유형 모두 4단계로 동일) */
const LAST_STEP = HANJA_STEPS.length - 1;

export function ProcessingScreen({
  request,
  onComplete,
  onCancel,
}: {
  /** 입력 화면에서 넘어온 작명 조건 (맥락 유지용) */
  request?: NameRequest;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [stopped, setStopped] = useState(false);
  const steps = request?.nameType === "korean" ? KOREAN_STEPS : HANJA_STEPS;

  // ResultsScreen과 같은 queryKey로 실 요청을 미리 시작한다 (react-query가 fetch를 공유).
  // 응답이 도착하면(성공/실패) 마지막 단계에서 결과 화면으로 넘어간다.
  const { isSuccess, isError } = useNameResults(request as NameRequest, !!request);
  const resultReady = request ? isSuccess || isError : true;

  useEffect(() => {
    if (stopped) return;
    // 애니메이션 단계는 마지막 직전까지만 타이머로 진행
    if (step < LAST_STEP) {
      const t = setTimeout(() => setStep((s) => s + 1), STEP_INTERVAL_MS);
      return () => clearTimeout(t);
    }
    // 마지막 단계 도달 후 실 응답이 준비되면 결과로 전환 (mock은 즉시 준비됨)
    if (step === LAST_STEP && resultReady) {
      const t = setTimeout(onComplete, COMPLETE_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [step, stopped, resultReady, onComplete]);

  // 진행률: 마지막 단계는 응답 대기 중이므로 응답 전까지 100%를 채우지 않는다
  const progress = Math.min((step + (resultReady ? 1 : 0)) / steps.length, 1);

  return (
    <div className="pt-16 min-h-screen bg-hanji/40 relative overflow-hidden flex items-center justify-center">
      {/* Watermark hanja — 다른 화면과 동일한 배경 모티프 */}
      <span
        className="font-hanja pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[280px] sm:text-[420px] leading-none text-primary opacity-[0.04]"
        aria-hidden="true"
      >
        作
      </span>

      <div className="relative z-10 w-full max-w-lg px-6 py-12">
        <div className="bg-white/95 backdrop-blur-md border border-border-warm rounded-3xl shadow-[0_20px_45px_rgba(46,30,8,0.06)] p-7 sm:p-10">
          {/* 입력한 조건 — 입력 화면과의 맥락 연결 */}
          {request && (
            <div className="mb-8 px-4 py-3 bg-hanji/70 border border-border-warm/70 rounded-2xl text-left">
              <p className="text-[10px] font-bold tracking-wider text-caption uppercase mb-1">
                입력한 조건
              </p>
              <p className="text-sm text-foreground break-keep leading-relaxed line-clamp-2">
                “{formatNameRequest(request)}”
              </p>
            </div>
          )}

          {/* 브랜드 스피너 — 회전 링 + 名 */}
          <div className="w-16 h-16 mx-auto mb-8 relative">
            <div className="absolute inset-0 border-2 border-border-warm rounded-full" />
            <div
              className="absolute inset-0 border-2 rounded-full border-r-transparent border-b-transparent"
              style={{
                borderColor: stopped
                  ? "var(--color-border)"
                  : "var(--color-primary) transparent transparent",
                animation: stopped ? "none" : "mg-spin 1.1s linear infinite",
              }}
            />
            <span
              className={`font-hanja absolute inset-0 flex items-center justify-center text-2xl select-none transition-colors duration-300 ${
                stopped ? "text-faint" : "text-primary"
              }`}
              aria-hidden="true"
            >
              名
            </span>
          </div>

          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.28em] text-caption uppercase mb-2">Processing</p>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground break-keep">
              {stopped ? "생성이 일시 중단되었습니다" : "근거 있는 이름을 찾고 있습니다"}
            </h2>
          </div>

          {/* 진행률 바 */}
          <div className="flex items-center gap-3 mb-8" aria-hidden="true">
            <div className="flex-1 h-1 rounded-full bg-border-warm overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-primary tabular-nums w-9 text-right">
              {Math.round(progress * 100)}%
            </span>
          </div>

          {/* Step list */}
          <div className="space-y-5 text-left mb-10" role="status" aria-live="polite">
            {steps.map((s, i) => {
              const done = step > i;
              const active = step === i;
              return (
                <div key={i} className="flex items-start gap-3.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-400 ${
                      done
                        ? "bg-primary"
                        : active
                          ? "border-2 border-primary"
                          : "border border-border"
                    }`}
                  >
                    {done ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : active ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm transition-colors ${
                        done
                          ? "text-primary font-medium"
                          : active
                            ? "text-foreground font-semibold"
                            : "text-faint"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p
                      className={`text-xs break-keep leading-relaxed mt-0.5 transition-colors ${
                        active ? "text-caption" : "text-faint/70"
                      }`}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            {stopped ? (
              <div className="flex justify-center gap-2">
                <PrimaryButton onClick={() => setStopped(false)} className="text-xs px-5 py-2.5">
                  이어서 진행
                </PrimaryButton>
                <GhostButton onClick={onCancel} className="text-xs px-5 py-2.5">
                  조건 수정하기
                </GhostButton>
              </div>
            ) : (
              <GhostButton
                onClick={() => setStopped(true)}
                tone="destructive"
                className="text-xs px-5 py-2.5"
              >
                생성 중단
              </GhostButton>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-hint mt-5 break-keep">
          모든 추천에는 대법원 인명용 한자 8,142자와 KCI 학술 문헌 출처가 함께 제공됩니다.
        </p>
      </div>
    </div>
  );
}
