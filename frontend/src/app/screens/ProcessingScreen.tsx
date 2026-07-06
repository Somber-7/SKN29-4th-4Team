import { useEffect, useState } from "react";
import type { NameRequest } from "@/app/types";
import { formatNameRequest } from "@/app/utils/formatNameRequest";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";

/** 서비스 소개의 4단계 검증 프로세스와 동일한 순서로 진행 상황을 표현 */
const PROCESSING_STEPS = [
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

/** 단계 사이 전환 간격 */
// TODO(API): POST /names/generate 응답 대기로 대체 (타이머 제거)
const STEP_INTERVAL_MS = 1400;
/** 마지막 단계 이후 결과 화면으로 넘어가기까지의 지연 */
const COMPLETE_DELAY_MS = 600;

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

  useEffect(() => {
    if (stopped) return;
    if (step >= PROCESSING_STEPS.length) {
      const t = setTimeout(onComplete, COMPLETE_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [step, stopped, onComplete]);

  const progress = Math.min(step / PROCESSING_STEPS.length, 1);

  return (
    <div className="pt-16 min-h-screen bg-hanji/40 relative overflow-hidden flex items-center justify-center">
      {/* Watermark hanja — 다른 화면과 동일한 배경 모티프 */}
      <span
        className="font-hanja pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[280px] sm:text-[420px] leading-none text-primary opacity-[0.04]"
        aria-hidden="true"
      >
        作
      </span>

      {/* 카드만 세로 중앙 정렬 대상으로 둔다 — 아래 안내문까지 같이 정렬 대상에 포함되면
          안내문 높이만큼 카드가 위로 밀려서 화면 위/아래 여백이 비대칭으로 보인다. */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-8">
        <div className="bg-white/95 backdrop-blur-md border border-border-warm rounded-3xl shadow-[0_20px_45px_rgba(46,30,8,0.06)] p-7 sm:p-10">
          {/* 가로 2열: 왼쪽(조건 요약·스피너·진행률) | 오른쪽(단계 목록) — 세로 스크롤 없이 한 화면에 들어오도록 배치.
              align-items 기본값(stretch)을 그대로 둬서 오른쪽 열이 왼쪽 열과 같은 높이로 늘어나고,
              내부에서 4단계를 justify-between으로 고르게 배분해 하단이 비어 보이지 않게 한다. */}
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <div>
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

              {/* 브랜드 스피너 — 회전 링 + 名. 왼쪽 열 안에서 항상 가운데 정렬 */}
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

            {/* Step list — md 이상에서는 왼쪽 열과 같은 높이로 늘어난 뒤(그리드 기본 stretch),
                아이템들을 세로축으로 중앙 정렬하고 일정한 간격을 두어 벌어짐을 방지합니다. */}
            <div
              className="flex flex-col justify-center gap-6 md:h-full md:gap-8 text-left md:border-l md:border-hanji md:pl-10"
              role="status"
              aria-live="polite"
            >
              {PROCESSING_STEPS.map((s, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <div key={i} className="relative flex items-start gap-3.5">
                    {/* 단계 연결선 (마지막 단계 제외) */}
                    {i < PROCESSING_STEPS.length - 1 && (
                      <div
                        className={`absolute left-3 top-[26px] w-[2px] -bottom-[28px] md:-bottom-[36px] transition-all duration-500 ${
                          done ? "bg-primary" : "bg-border-warm"
                        }`}
                        style={{ transform: "translateX(-50%)" }}
                      />
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 transition-all duration-400 ${
                        done
                          ? "bg-primary"
                          : active
                            ? "border-2 border-primary bg-white"
                            : "border border-border bg-white"
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
          </div>
        </div>
      </div>

      {/* 안내문 — 중앙 정렬 대상에서 분리해 화면 하단에 고정, 카드 위/아래 여백을 대칭으로 유지 */}
      <p className="absolute bottom-6 inset-x-0 z-10 text-center text-[11px] text-hint break-keep px-6">
        모든 추천에는 대법원 인명용 한자 8,142자와 KCI 학술 문헌 출처가 함께 제공됩니다.
      </p>
    </div>
  );
}
