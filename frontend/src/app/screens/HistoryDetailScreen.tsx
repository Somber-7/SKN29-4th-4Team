import { useState } from "react";
import { useHistoryDetail } from "@/app/hooks/useHistoryDetail";
import { nameRequestToParsedQuery } from "@/app/utils/nameQueryParser";
import { formatNameRequest } from "@/app/utils/formatNameRequest";
import { ParsedChipRow } from "@/app/components/common/ParsedChips";
import { NameCard } from "@/app/components/common/NameCard";
import { NameDetailModal } from "@/app/components/common/NameDetailModal";
import { PageHeader } from "@/app/components/common/PageHeader";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Footer } from "@/app/components/layout/Footer";
import type { NameResult, Screen } from "@/app/types";

/** 작명 기록 상세 — HistoryScreen "결과 다시 보기" 전용. ResultsScreen과 달리 새로
 * 생성하지 않고(useNameResults 미사용) 저장된 결과를 그대로 보여준다. */
export function HistoryDetailScreen({
  id,
  onNavigate,
}: {
  id: number;
  onNavigate: (s: Screen) => void;
}) {
  const [selectedResult, setSelectedResult] = useState<NameResult | null>(null);
  const { data, isLoading, isError } = useHistoryDetail(id);

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-hanji/40 flex flex-col">
        <div className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-8 py-10 space-y-4" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-2xl" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pt-16 min-h-screen bg-hanji/40 flex flex-col">
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 sm:px-8 py-14">
          <EmptyState
            title="작명 기록을 찾을 수 없습니다"
            description="삭제되었거나 존재하지 않는 기록입니다."
            action={
              <PrimaryButton onClick={() => onNavigate("history")} className="px-6 py-3">
                작명 기록으로
              </PrimaryButton>
            }
          />
        </div>
      </div>
    );
  }

  const { request, results } = data;
  const parsed = nameRequestToParsedQuery(request);
  const displayText = formatNameRequest(request);

  return (
    <div className="pt-16 min-h-screen bg-hanji/40 flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-8 py-10">
        <PageHeader eyebrow="History" title="작명 기록 상세" watermark="錄" align="left" />

        {/* 입력했던 조건 — 그때 그대로, 재생성 아님 */}
        <div className="mb-8 p-5 bg-white border border-border-warm rounded-2xl shadow-[0_8px_24px_rgba(46,30,8,0.03)]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-caption tracking-wider uppercase mb-1.5">
              {data.date} · 입력한 조건
            </p>
            <p className="text-sm sm:text-base text-foreground break-keep leading-relaxed">
              “{displayText}”
            </p>
          </div>
          {parsed.count > 0 && (
            <div className="mt-3 pt-3 border-t border-hanji">
              <ParsedChipRow parsed={parsed} label="인식된 조건" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              추천 이름
            </h2>
            <span className="text-sm font-semibold text-gold-text tabular-nums">{results.length}</span>
          </div>
          <GhostButton onClick={() => onNavigate("history")} className="px-4 py-2 text-xs text-label rounded-lg">
            작명 기록으로
          </GhostButton>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          {results.map((result, i) => (
            <NameCard key={result.id} result={result} variant="detail" rank={i + 1} onOpenDetail={setSelectedResult} />
          ))}
        </div>

        <p className="text-center text-[11px] text-hint break-keep">
          추천 결과는 참고용 정보이며, 각 카드를 누르면 81수리 4격과 출처 근거를 확인할 수 있습니다.
        </p>
      </div>

      <Footer onNavigate={onNavigate} />

      {selectedResult && (
        <NameDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  );
}
