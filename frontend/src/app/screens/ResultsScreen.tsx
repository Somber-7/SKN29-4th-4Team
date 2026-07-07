import { useEffect, useMemo, useState } from "react";
import { USE_MOCK_NAMES } from "@/api/client";
import { extractLastNameCharMock, isKnownLastNameMock } from "@/api/names";
import { useNameResults } from "@/app/hooks/useNameResults";
import { nameRequestToParsedQuery } from "@/app/utils/nameQueryParser";
import { formatNameRequest } from "@/app/utils/formatNameRequest";
import { ParsedChipRow } from "@/app/components/common/ParsedChips";
import { NameCard } from "@/app/components/common/NameCard";
import { NameDetailModal } from "@/app/components/common/NameDetailModal";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";
import type { NameRequest, NameResult } from "@/app/types";

/** 목업 스트리밍(결과 생성 중 표시)이 끝나기까지의 시간 */
const STREAMING_DURATION_MS = 1800;
/** 이름 카드가 한 장씩 나타나는 간격 */
const CARD_REVEAL_INTERVAL_MS = 280;

function SkeletonCard() {
  return (
    <div className="bg-white border border-border-warm rounded-2xl p-5 sm:p-6 flex items-center gap-4">
      <div className="animate-pulse flex items-center gap-4 w-full">
        <div className="h-9 w-24 bg-muted rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-input-background rounded" />
          <div className="h-3 w-1/3 bg-input-background rounded hidden sm:block" />
        </div>
        <div className="h-8 w-16 bg-muted rounded-lg flex-shrink-0 hidden sm:block" />
      </div>
    </div>
  );
}

export function ResultsScreen({
  request,
  onChat,
  onRetry,
  onRegenerate,
}: {
  request: NameRequest;
  onChat: (question?: string) => void;
  /** "조건 수정" — 입력 화면으로 복귀 */
  onRetry: () => void;
  /** "다시 추천" — 같은 조건 + 현재 결과 이름 제외(excludeNames)로 재생성 */
  onRegenerate: (excludeNames: string[]) => void;
}) {
  const [streaming, setStreaming] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [followUp, setFollowUp] = useState("");
  const [selectedResult, setSelectedResult] = useState<NameResult | null>(null);

  const parsed = useMemo(() => nameRequestToParsedQuery(request), [request]);
  const displayText = useMemo(() => formatNameRequest(request), [request]);
  const lastNameChar = useMemo(() => extractLastNameCharMock(request), [request]);

  // TODO(API): 서버가 성씨 반영 결과를 주면 훅 내부의 치환 로직 제거 (POST /naming-api/names/generate)
  const { data: results = [] } = useNameResults(request);

  const submitFollowUp = () => onChat(followUp.trim() || undefined);

  useEffect(() => {
    const t = setTimeout(() => setStreaming(false), STREAMING_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (streaming) return;
    const iv = setInterval(() => {
      setVisibleCount((v) => {
        if (v >= results.length) {
          clearInterval(iv);
          return v;
        }
        return v + 1;
      });
    }, CARD_REVEAL_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [streaming, results.length]);

  const toggleSave = (id: number) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allRevealed = !streaming && visibleCount >= results.length;

  return (
    <div className="pt-16 min-h-screen bg-hanji/40 flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-8 py-10">
        {/* 입력한 조건 — 인식된 조건 칩과 함께 재확인 */}
        <div className="mb-8 p-5 bg-white border border-border-warm rounded-2xl shadow-[0_8px_24px_rgba(46,30,8,0.03)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-caption tracking-wider uppercase mb-1.5">
                입력한 조건
              </p>
              <p className="text-sm sm:text-base text-foreground break-keep leading-relaxed">
                “{displayText}”
              </p>
            </div>
            <GhostButton
              onClick={onRetry}
              className="px-3.5 py-2 text-xs flex-shrink-0 rounded-lg hidden sm:inline-block"
            >
              조건 수정
            </GhostButton>
          </div>
          {parsed.count > 0 && (
            <div className="mt-3 pt-3 border-t border-hanji">
              <ParsedChipRow parsed={parsed} label="인식된 조건" />
            </div>
          )}
        </div>

        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                추천 이름
              </h2>
              {!streaming && (
                <span className="text-sm font-semibold text-gold-text tabular-nums">
                  {results.length}
                </span>
              )}
            </div>
            {streaming ? (
              <div className="flex items-center gap-1.5 mt-1" aria-live="polite">
                <span className="text-xs text-muted-foreground">생성 중</span>
                <span
                  className="inline-block w-0.5 h-3.5 bg-primary"
                  style={{ animation: "mg-caret 0.9s step-end infinite" }}
                />
              </div>
            ) : (
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-caption mt-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-pine bg-pine/8 px-2 py-0.5 rounded border border-pine/25"
                  style={{ animation: "mg-fadein 0.3s ease-out both" }}
                >
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  4대 기준 검증 완료
                </span>
                대법원 인명 한자 · 81수리 · 자원오행 · KCI 문헌
              </p>
            )}
          </div>
          {!streaming && (
            <div className="flex gap-2">
              <GhostButton
                onClick={() => onRegenerate(results.map((r) => r.hangul))}
                className="px-4 py-2 text-xs text-label rounded-lg"
              >
                다시 추천
              </GhostButton>
              <PrimaryButton onClick={() => onChat()} className="px-4 py-2 text-xs">
                추가 질문하기
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* 시안 안내: mock 모드에서만 — 미지원 성씨는 예시(尹) 기준임을 명시 + 수리 표기 주의 */}
        {USE_MOCK_NAMES && !streaming && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {lastNameChar && !isKnownLastNameMock(lastNameChar) && (
              <span className="text-xs text-gold-text bg-hanji border border-border-warm rounded px-2 py-0.5">
                시안 단계 — 예시 결과는 尹씨 기준입니다
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              수리 표기는 시안 기준 예시입니다.
            </span>
          </div>
        )}

        {/* Skeleton cards while generating */}
        {streaming && (
          <div className="flex flex-col gap-4 mb-10" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Name cards — LLM 추천 개수에 맞춰 한 줄에 하나씩, 추천 순번과 함께 */}
        <div className="flex flex-col gap-4 mb-10">
          {results.slice(0, visibleCount).map((result, i) => (
            <NameCard
              key={result.id}
              result={result}
              variant="detail"
              rank={i + 1}
              saved={saved.has(result.id)}
              onToggleSave={toggleSave}
              onOpenDetail={setSelectedResult}
            />
          ))}
        </div>

        {/* Follow-up entry */}
        {allRevealed && (
          <div
            className="bg-white border border-border-warm rounded-2xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(46,30,8,0.03)] mb-3"
            style={{ animation: "mg-fadein 0.35s ease forwards" }}
          >
            <p className="text-[10px] font-bold text-caption uppercase tracking-wider mb-1">
              추가 질문
            </p>
            <p className="text-xs text-ink break-keep mb-3">
              추천 결과가 궁금하다면 근거와 함께 자세히 설명해 드립니다.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="예: 도현이라는 이름에서 水 기운이 충분한가요?"
                className="flex-1 px-3.5 py-2.5 text-sm border border-border-warm bg-hanji/40 focus:bg-white rounded-xl focus:outline-none focus:ring-4 focus:ring-gold-border/10 focus:border-gold-border transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitFollowUp();
                }}
              />
              <PrimaryButton onClick={submitFollowUp} className="px-5 py-2 text-xs">
                전송
              </PrimaryButton>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-hint break-keep">
          추천 결과는 참고용 정보이며, 각 카드를 누르면 81수리 4격과 출처 근거를 확인할 수 있습니다.
        </p>
      </div>

      <Footer />

      {selectedResult && (
        <NameDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  );
}
