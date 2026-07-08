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

/** 이름(성씨 제외) 한자 필드에 실제 한자(CJK 표의문자)가 하나도 없으면 순우리말 결과로 본다.
 * ruby 배열 길이만으로는 판별할 수 없다 — 순우리말 결과에도 구조화 단계가 음절 자리표시자를
 * ruby에 채워 보내는 경우가 있어(획수 0, 오행 빈 값), 실제 문자 종류로 판별해야 정확하다. */
function isKoreanNameResult(result: NameResult): boolean {
  return !/[一-鿿]/.test(result.hanja);
}

export function NameCard({ result, variant, rank, saved = false, onToggleSave, onOpenDetail }: NameCardProps) {
  const isDetail = variant === "detail";
  const isKoreanResult = isKoreanNameResult(result);
  const fullHanja = result.lastName.char + result.ruby.map((c) => c.char).join("");
  const fullHangul = result.lastName.reading + result.hangul;

  if (!isDetail) {
    return (
      <article
        className="w-full bg-white border border-border-warm rounded-2xl p-6 shadow-[0_12px_30px_rgba(46,30,8,0.04)] hover:shadow-[0_20px_45px_rgba(46,30,8,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
        style={{ backgroundImage: PAPER_NOISE_BG }}
      >
        {/* Traditional Red Stamp Watermark */}
        <div className="absolute top-5 right-5 w-12 h-12 rounded-full border border-red-500/20 flex items-center justify-center text-[9px] font-bold text-red-500/30 rotate-12 select-none pointer-events-none">
          명가검증
        </div>

        {/* Card Header */}
        <div className="border-b border-hanji pb-3 mb-4 text-left">
          <span className="text-[8px] font-bold tracking-[0.2em] text-gold-text uppercase">Myeongga Report</span>
          <h4 className="text-xs font-semibold text-foreground mt-0.5">명가작명소 추천 인증서</h4>
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
      aria-label={
        onOpenDetail
          ? `${isKoreanResult ? fullHangul : `${fullHanja} ${fullHangul}`} 상세 정보 보기`
          : undefined
      }
      className={`bg-white border border-border-warm rounded-2xl p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,17rem)] gap-x-4 gap-y-3 lg:items-start transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-border/50 hover:shadow-[0_16px_36px_rgba(46,30,8,0.08)] ${
        onOpenDetail ? "cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary" : ""
      }`}
      style={{ animation: "mg-fadein 0.35s ease forwards" }}
    >
      {/* Name (+ 추천 순번) — Grid 1열: 폭이 12rem으로 고정되어 옆 컬럼과 절대 겹치지 않는다 */}
      <div className="flex items-start gap-3 min-w-0">
        {rank !== undefined && (
          <span
            className="text-xl font-bold font-mono text-gold-text/70 leading-none pt-1.5 tabular-nums select-none"
            aria-label={`추천 ${rank}순위`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        )}
        <div>
          {isKoreanResult ? (
            <div className="text-lg font-semibold text-secondary-foreground tracking-wide">{fullHangul}</div>
          ) : (
            <>
              <div className="font-hanja text-3xl font-light text-foreground tracking-[0.04em] mb-0.5" lang="ko-Hani">
                {fullHanja}
              </div>
              <div className="text-lg font-semibold text-secondary-foreground tracking-wide">{fullHangul}</div>
            </>
          )}
        </div>
      </div>

      {/* Per-character breakdown (성 포함) — Grid 2열(가변 폭). 태블릿 폭(lg 미만)에서는 카드가
          이름만 보여주는 최소 정보 형태로 접히도록 이 블록 자체를 숨기고, 상세 내역은 클릭 시
          모달에서 확인한다. 글자마다 한 줄씩 세로로 쌓아(flex-col) 항상 카드 전체 폭을 쓰게
          하고, 칩 내부도 "글자(음)" / "뜻 · 획수 · 오행" 두 줄로 나눠 좁은 폭에 욱여넣다 뜻풀이가
          잘려 보이는 일이 없게 한다. 순우리말은 이름 부분에 한자 풀이가 없어 성씨만 표시된다
          (ruby에 음절 자리표시자가 채워져 와도 순우리말로 판별되면 표시하지 않는다 — 획수 0 등
          무의미한 값이라). */}
      <div className="hidden lg:flex flex-col gap-1.5 lg:border-l lg:border-muted lg:pl-4 min-w-0">
        {(isKoreanResult ? [result.lastName] : [result.lastName, ...result.ruby]).map((c, i) => (
          <div
            key={i}
            className="px-2.5 py-1.5 text-caption bg-hanji/50 border border-border-warm/60 rounded-lg"
          >
            <span className="text-xs font-medium text-secondary-foreground">
              {c.char}({c.reading})
            </span>
            <p className="text-[11px] break-keep">
              {c.meaning} · {c.strokes}획 · {c.element}行
            </p>
          </div>
        ))}
        {isKoreanResult && (
          <span className="text-[11px] text-caption whitespace-normal break-keep">
            이름은 순우리말이라 한자·오행·획수를 사용하지 않습니다.
          </span>
        )}
      </div>

      {/* 81수리/이름 풀이 + 저장 — Grid 3열(최대 17rem). 텍스트 줄과 아이콘 줄을 세로로
          분리해서, 컬럼 안에서 또 가로로 경쟁하며 겹치는 일이 없게 한다. 출처는 원본 논문
          제목·페이지를 그대로 박스로 나열하면 사용자에게 낯설고 카드 높이만 키우므로 목록에는
          싣지 않는다 — 친절한 문장 설명은 상세보기 모달의 "참고 출처" 섹션에서 제공한다. */}
      <div className="flex flex-col gap-2 min-w-0">
        {/* 4격 값이 한 줄에 다 들어가지 않으면(예: "원격23(대길)·형격16(길)·이격23(대길)·정격31(대길)")
            truncate로 말줄임표 처리하면 마지막 격의 길흉을 못 읽어 가독성이 떨어진다. 이 컬럼은
            독립된 grid 트랙(minmax(0,17rem))이라 줄바꿈해도 옆 컬럼과 겹치지 않으므로, 잘라내는
            대신 break-keep으로 필요한 만큼 줄바꿈해 전체 내용을 보여준다. */}
        <div className="text-right min-w-0">
          <p className="text-[11px] text-caption">{isKoreanResult ? "이름 풀이" : "81수리 4격"}</p>
          <p className="text-xs font-semibold text-primary break-keep">
            {result.sukgyeok}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
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
      </div>
    </article>
  );
}
