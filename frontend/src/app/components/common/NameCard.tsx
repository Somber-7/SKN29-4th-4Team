import type { NameResult } from "@/app/types";
import { SourceChip } from "@/app/components/common/SourceChip";

/** 한지 노이즈 텍스처 (preview 변형 전용) */
const PAPER_NOISE_BG =
  "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix type=%22saturate%22 values=%220%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.2%22/%3E%3C/svg%3E')";

interface NameCardProps {
  result: NameResult;
  /** preview: 랜딩 샘플(한지 질감, 저장 버튼 없음) · detail: 결과 화면(가로 한 줄 레이아웃, 클릭 시 상세보기) */
  variant: "preview" | "detail";
  /** detail 변형: 추천 순번 (1부터) — 골드 넘버링으로 표시 */
  rank?: number;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  /** detail 변형에서 카드를 클릭/키보드로 선택했을 때 상세 정보를 열기 위한 콜백 */
  onOpenDetail?: (result: NameResult) => void;
}

export function NameCard({ result, variant, rank, saved = false, onToggleSave, onOpenDetail }: NameCardProps) {
  const isDetail = variant === "detail";
  const fullHanja = result.lastName.char + result.ruby.map((c) => c.char).join("");
  const fullHangul = result.lastName.reading + result.hangul;

  if (!isDetail) {
    return (
      <article
        className="w-full bg-white border border-border-warm rounded-2xl p-6 shadow-[0_12px_30px_rgba(46,30,8,0.04)] hover:shadow-[0_20px_45px_rgba(46,30,8,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
        style={{ backgroundImage: PAPER_NOISE_BG, backgroundColor: "white" }}
      >
        {/* Card Header */}
        <div className="border-b border-hanji pb-4 mb-4 text-left">
          <span className="text-[8px] font-bold tracking-[0.2em] text-gold-text uppercase">Myeongga Report</span>
          <h4 className="text-xs font-semibold text-foreground mt-0.5">명가작명소 추천 인증서</h4>
        </div>

        {/* Traditional Red Stamp Watermark */}
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full border border-red-500/20 flex items-center justify-center text-[9px] font-bold text-red-500/30 select-none pointer-events-none">
          명가검증
        </div>

        {/* The Name Block */}
        <div className="text-center my-5">
          <div className="inline-flex items-baseline gap-2 mb-1">
            <span className="font-hanja text-3xl font-semibold tracking-wide text-foreground" lang="ko-Hani">
              {fullHanja}
            </span>
            <span className="text-sm text-caption font-medium">({fullHangul})</span>
          </div>
          <p className="text-[11px] text-ink leading-relaxed break-keep">
            81수리 4격 : <span className="text-primary font-bold">{result.sukgyeok}</span>
          </p>
        </div>

        {/* Character details breakdown */}
        <div className="space-y-2 pt-3 border-t border-hanji text-left">
          {result.ruby.map((c, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-hanji/60 border border-border/20">
              <span className="text-[11px] font-medium text-foreground">
                {c.char}({c.reading}) <span className="text-[10px] text-caption font-normal">{c.meaning}</span>
              </span>
              <span className="text-[10px] text-primary font-bold">
                {c.strokes}획 · {c.element}行
              </span>
            </div>
          ))}
        </div>

        {/* Source chips at bottom */}
        <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-hanji">
          {result.sources.map((src, i) => (
            <SourceChip key={i} type={src.type} label={src.label} />
          ))}
        </div>
      </article>
    );
  }

  // ── detail 변형: 결과 화면 전용 — 한 줄(행) 레이아웃, 클릭하면 상세 정보 오픈 ──
  const handleActivate = () => onOpenDetail?.(result);

  return (
    <article
      role={onOpenDetail ? "button" : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
      onClick={onOpenDetail ? handleActivate : undefined}
      onKeyDown={
        onOpenDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      aria-label={onOpenDetail ? `${fullHanja} ${fullHangul} 상세 정보 보기` : undefined}
      className={`bg-white border border-border-warm rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-border/50 hover:shadow-[0_16px_36px_rgba(46,30,8,0.08)] ${
        onOpenDetail ? "cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary" : ""
      }`}
      style={{ animation: "mg-fadein 0.35s ease forwards" }}
    >
      {/* Name (+ 추천 순번) */}
      <div className="sm:w-48 flex-shrink-0 flex items-start gap-3">
        {rank !== undefined && (
          <span
            className="text-xl font-bold font-mono text-gold-text/70 leading-none pt-1.5 tabular-nums select-none"
            aria-label={`추천 ${rank}순위`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        )}
        <div>
          <div className="font-hanja text-3xl font-light text-foreground tracking-[0.04em] mb-0.5" lang="ko-Hani">
            {fullHanja}
          </div>
          <div className="text-lg font-semibold text-secondary-foreground tracking-wide">{fullHangul}</div>
        </div>
      </div>

      {/* Per-character breakdown (성 포함) */}
      <div className="flex-1 flex flex-col gap-y-1.5 sm:border-l sm:border-muted sm:pl-4 min-w-0">
        {[result.lastName, ...result.ruby].map((c, i) => (
          <div key={i} className="text-[11px] text-caption whitespace-nowrap">
            <span className="text-xs font-medium text-secondary-foreground">
              {c.char}({c.reading})
            </span>{" "}
            {c.meaning} · {c.strokes}획 · {c.element}行
          </div>
        ))}
      </div>

      {/* 81수리 + 출처 + 저장 */}
      <div className="flex items-center gap-4 sm:flex-shrink-0">
        <div className="text-right">
          <p className="text-[11px] text-caption">81수리 4격</p>
          <p className="text-xs font-semibold text-primary">{result.sukgyeok}</p>
        </div>

        <div className="hidden md:flex flex-wrap gap-1.5 max-w-[200px]">
          {result.sources.map((src, i) => (
            <SourceChip key={i} type={src.type} label={src.label} />
          ))}
        </div>

        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(result.id);
            }}
            aria-label={saved ? "저장됨" : "저장"}
            aria-pressed={saved}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0 ${
              saved
                ? "bg-primary border-primary text-white"
                : "border-border-warm text-faint hover:border-primary hover:text-primary"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
              <path d="M2 2h8v9l-4-2.5L2 11V2z" />
            </svg>
          </button>
        )}

        {onOpenDetail && (
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-faint flex-shrink-0" aria-hidden="true">
            <path d="M1 1l5 5-5 5" />
          </svg>
        )}
      </div>
    </article>
  );
}
