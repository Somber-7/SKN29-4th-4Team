import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import type { NameResult, SourceType } from "@/app/types";
import { SourceChip } from "@/app/components/common/SourceChip";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";

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

export function NameDetailModal({ result, onClose }: NameDetailModalProps) {
  const fullHanja = result.lastName.char + result.ruby.map((c) => c.char).join("");
  const fullHangul = result.lastName.reading + result.hangul;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 페이지 전환 애니메이션(mg-hero-in)이 transform을 쓰는 상위 요소에 걸려 있으면, 그 요소가
  // position:fixed 자손의 containing block이 되어버려서 이 모달이 "뷰포트"가 아니라 그 상위
  // 요소(문서 전체 높이) 기준으로 위치하게 된다 — 그러면 스크롤을 내린 채로 열었을 때 모달이
  // 화면 중앙이 아니라 엉뚱한 위치에 뜬다. document.body에 포탈로 그려서 그 영향을 완전히 피하고,
  // 항상 "현재 보이는 화면" 기준 정중앙에 뜨도록 한다.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        id="mg-certificate"
        role="dialog"
        aria-modal="true"
        aria-label={`${fullHanja} ${fullHangul} 상세 정보`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-border-warm rounded-3xl w-full max-w-6xl max-h-[85vh] overflow-y-auto scrollbar-none shadow-[0_32px_80px_rgba(26,14,4,0.25)] relative print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
        style={{ animation: "mg-fadein 0.25s ease forwards" }}
      >
        {/* 명가인증 도장 워터마크 — 인증서 모티프. 헤더의 닫기 버튼(우측 상단)과
            겹치지 않도록 버튼 폭(w-10=40px)+여백을 감안해 right-24로 이격 */}
        <div
          className="absolute top-8 right-24 w-14 h-14 rounded-full border-2 border-red-500/20 hidden sm:flex print:flex items-center justify-center text-[10px] font-bold text-red-500/30 rotate-12 pointer-events-none select-none"
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
            <div
              className="font-hanja text-5xl sm:text-6xl font-light text-foreground tracking-[0.06em] mb-2"
              lang="ko-Hani"
            >
              {fullHanja}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl sm:text-2xl font-semibold text-foreground tracking-wide">
                {fullHangul}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-border-warm flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">
                81수리 4격 · {result.sukgyeok}
              </span>
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

        {/* Body — 데스크톱 3열: 한자 풀이 | 81수리 | 출처 (한 화면 안에 들어오도록 가로 배치, 스크롤 최소화) */}
        <div className="px-6 sm:px-10 py-7 grid gap-8 lg:grid-cols-3 lg:gap-8">
          {/* 한자 풀이 (성 포함) */}
          <section>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
              한자 풀이
            </p>
            <div className="flex flex-col gap-3">
              {[result.lastName, ...result.ruby].map((c, i) => (
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
                  <div className="min-w-0 flex-1 grid grid-cols-[36px_1fr] gap-3.5 items-center">
                    {/* 발음 및 획수 (좌측 정렬) */}
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-base font-semibold text-foreground leading-none mb-1.5">{c.reading}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums leading-none">{c.strokes}획</span>
                    </div>

                    {/* 뜻풀이 및 자원오행 (좌측 정렬로 가독성 극대화 및 칼정렬) */}
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs text-caption leading-none mb-2">{c.meaning}</span>
                      <span className="text-xs font-semibold text-primary leading-none">{c.element}行</span>
                    </div>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] font-bold text-gold-text bg-hanji border border-gold-border/30 rounded px-2 py-0.5 flex-shrink-0">
                      성(姓)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 81수리 4격 상세 */}
          <section className="flex flex-col lg:h-full">
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
              81수리 4격 상세
            </p>
            <div className="border border-border-warm/70 rounded-2xl divide-y divide-hanji overflow-hidden bg-white lg:flex-1 lg:flex lg:flex-col">
              {result.sukgyeokDetail.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 lg:flex-1">
                  <span className="text-sm font-medium text-foreground/75">{d.name}</span>
                  <div className="flex items-center gap-3.5">
                    <span className="text-base font-semibold text-foreground tabular-nums">
                      {d.value}수
                    </span>
                    <span
                      className={`text-xs font-medium w-14 flex-shrink-0 inline-flex items-center justify-center text-center py-0.5 rounded-md border transition-colors ${
                        d.fortune === "대길"
                          ? "text-primary border-gold-border/30 bg-hanji"
                          : d.fortune === "길" || d.fortune === "중길"
                            ? "text-primary/80 border-border-warm/75 bg-hanji/50"
                            : "text-muted-foreground border-border bg-muted"
                      }`}
                    >
                      {d.fortune}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 참고 출처 */}
          <section>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-4">
              참고 출처
            </p>
            <div className="space-y-3">
              {result.sources.map((src, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <SourceChip type={src.type} label={src.label} className="w-[110px] flex-shrink-0" />
                  <p className="text-xs text-ink break-keep flex-1 pt-0.5 l