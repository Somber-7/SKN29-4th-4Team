import { useEffect } from "react";
import { Printer } from "lucide-react";
import type { NameResult, SourceType } from "@/app/types";
import { SourceChip } from "@/app/components/common/SourceChip";
import { GhostButton } from "@/app/components/common/Button";

/** 근거 출처 유형별 설명 문구 */
const SOURCE_DESCRIPTIONS: Record<SourceType, string> = {
  hanja: "한자 자전과 자원오행 사전을 기준으로 각 글자의 획수와 오행을 확인했습니다.",
  suri: "81수리(원형이정) 획수 조합의 길흉 판단 기준에 따라 산출한 결과입니다.",
  beopryeong: "대법원 인명용 한자 목록에 등재된 한자만 사용해 구성했습니다.",
  nonmun: "관련 학술 논문의 인명용 한자 연구 결과를 참고했습니다.",
};

interface NameDetailModalProps {
  result: NameResult;
  onClose: () => void;
}

/** 이름(성씨 제외) 한자 필드에 실제 한자(CJK 표의문자)가 하나도 없으면 순우리말 결과로 본다.
 * ruby 배열 길이만으로는 판별할 수 없다 — 순우리말 결과에도 구조화 단계가 음절 자리표시자를
 * ruby에 채워 보내는 경우가 있어(획수 0, 오행 빈 값), 실제 문자 종류로 판별해야 정확하다. */
function isKoreanNameResult(result: NameResult): boolean {
  return !/[一-鿿]/.test(result.hanja);
}

export function NameDetailModal({ result, onClose }: NameDetailModalProps) {
  const isKoreanResult = isKoreanNameResult(result);
  const fullHanja = result.lastName.char + result.ruby.map((c) => c.char).join("");
  const fullHangul = result.lastName.reading + result.hangul;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        id="mg-certificate"
        role="dialog"
        aria-modal="true"
        aria-label={`${isKoreanResult ? fullHangul : `${fullHanja} ${fullHangul}`} 상세 정보`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-border-warm rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(26,14,4,0.25)] relative print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
        style={{ animation: "mg-fadein 0.25s ease forwards" }}
      >
        {/* 명가인증 도장 워터마크 — 인증서 모티프 */}
        <div
          className="absolute top-6 right-16 w-14 h-14 rounded-full border-2 border-red-500/20 hidden sm:flex print:flex items-center justify-center text-[10px] font-bold text-red-500/30 rotate-12 pointer-events-none select-none"
          aria-hidden="true"
        >
          명가인증
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b border-hanji">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-gold-text uppercase mb-3">
              Myeongga Report · 추천 이름 상세
            </p>
            {isKoreanResult ? (
              <div className="text-xl sm:text-2xl font-semibold text-secondary-foreground tracking-wide mb-2">
                {fullHangul}
              </div>
            ) : (
              <div
                className="font-hanja text-5xl sm:text-6xl font-light text-foreground tracking-[0.06em] mb-2"
                lang="ko-Hani"
              >
                {fullHanja}
              </div>
            )}
            <div className="flex items-baseline gap-2.5">
              {isKoreanResult ? null : (
                <>
                  <span className="text-xl sm:text-2xl font-semibold text-secondary-foreground tracking-wide">
                    {fullHangul}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    81수리 4격 · {result.sukgyeok}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="print:hidden w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-foreground hover:bg-hanji transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Body — 데스크톱 2열: 한자 풀이 | 81수리 + 출처 */}
        <div className="px-6 sm:px-10 py-7 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* 한자 풀이 (성 포함) — 순우리말은 이름 부분에 한자가 없어 성씨만 나온다 */}
          <section>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
              {isKoreanResult ? "성씨 한자" : "한자 풀이"}
            </p>
            <div className="flex flex-col gap-3">
              {(isKoreanResult ? [result.lastName] : [result.lastName, ...result.ruby]).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border border-border-warm/70 rounded-2xl px-4 py-3.5 bg-hanji/40"
                >
                  <span
                    className="font-hanja text-4xl font-light text-foreground w-12 text-center flex-shrink-0"
                    lang="ko-Hani"
                  >
                    {c.char}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-base font-semibold text-foreground">{c.reading}</span>
                      <span className="text-xs text-caption">{c.meaning}</span>
                    </div>
                    <p className="text-xs text-ink">
                      {c.strokes}획 · <span className="font-hanja">{c.element}</span>行
                    </p>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] font-bold text-gold-text bg-hanji border border-gold-border/30 rounded px-2 py-0.5 flex-shrink-0">
                      성(姓)
                    </span>
                  )}
                </div>
              ))}
            </div>
            {isKoreanResult && (
              <p className="text-xs text-caption break-keep leading-relaxed mt-3">
                이름 부분은 순우리말이라 한자·오행·획수를 사용하지 않습니다.
              </p>
            )}
          </section>

          <div className="space-y-8">
            {isKoreanResult ? (
              /* 이름 풀이 — 순우리말은 획수·오행 4격 대신 뜻풀이 문장으로 근거를 제공한다 */
              <section>
                <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
                  이름 풀이
                </p>
                <div className="border border-border-warm/70 rounded-2xl bg-hanji/40 px-4 py-3.5">
                  <p className="text-sm text-ink break-keep leading-relaxed">{result.sukgyeok}</p>
                </div>
              </section>
            ) : (
              /* 81수리 4격 상세 */
              <section>
                <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
                  81수리 4격 상세
                </p>
                <div className="border border-border-warm/70 rounded-2xl divide-y divide-hanji overflow-hidden bg-white">
                  {result.sukgyeokDetail.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-label">{d.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-foreground tabular-nums">
                          {d.value}수
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded border ${
                            d.fortune === "대길"
                              ? "text-primary border-border-warm bg-hanji"
                              : "text-ink border-border bg-muted"
                          }`}
                        >
                          {d.fortune}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 참고 출처 */}
            <section>
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
                참고 출처
              </p>
              <div className="space-y-3">
                {result.sources.map((src, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <SourceChip type={src.type} label={src.label} />
                    <p className="text-xs text-ink break-keep flex-1 pt-0.5 leading-relaxed">
                      {SOURCE_DESCRIPTIONS[src.type]}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-10 py-5 border-t border-hanji flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-hint break-keep">
              추천 결과는 참고용 정보이며 법적 효력이 없습니다.
            </p>
            {/* 인쇄/PDF 저장본에만 보이는 인증 서명 — 화면에서는 숨김 */}
            <p className="hidden print:flex items-center gap-2 text-[10px] text-caption mt-2 font-mono">
              <span>검증 엔진 v2.5</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-gold-text">MYEONGGA CERTIFIED</span>
            </p>
          </div>
          <div className="print:hidden flex gap-2 flex-shrink-0">
            <GhostButton
              onClick={() => window.print()}
              className="px-4 py-2.5 text-xs rounded-lg inline-flex items-center gap-1.5"
            >
              <Printer size={13} aria-hidden="true" />
              인증서 저장
            </GhostButton>
            <GhostButton onClick={onClose} className="px-5 py-2.5 text-xs rounded-lg">
              닫기
            </GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}
