import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";
import type { HistoryEntry, Screen } from "@/app/types";
import { useHistory } from "@/app/hooks/useHistory";
import { PageHeader } from "@/app/components/common/PageHeader";
import { EmptyState } from "@/app/components/common/EmptyState";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

type Filter = "전체" | "완료" | "진행 중";
const FILTERS: Filter[] = ["전체", "완료", "진행 중"];

/** 실제 목록 카드와 동일한 구조/높이의 스켈레톤 — 로딩 → 콘텐츠 전환 시 레이아웃 시프트 없음 */
function EntrySkeleton() {
  return (
    <div className="bg-white border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="sm:w-40 flex-shrink-0 space-y-2">
        <Skeleton className="h-8 w-28 rounded-none" />
        <Skeleton className="h-4 w-20 rounded-none" />
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-4 w-full max-w-md rounded-none" />
        <Skeleton className="h-3 w-40 rounded-none" />
      </div>
      <Skeleton className="h-9 w-full sm:w-28 rounded-none flex-shrink-0" />
    </div>
  );
}

export function HistoryScreen({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("전체");
  const { data: historyEntries = [] } = useHistory();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);

  const deleteHistory = useMutation({
    mutationFn: (id: number) => authApi.deleteHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "history"] });
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHistory.mutateAsync(deleteTarget.id);
      toast.success("작명 기록이 삭제되었습니다.");
    } catch (err) {
      toast.error(errorMessage(err, "삭제에 실패했습니다."));
    } finally {
      setDeleteTarget(null);
    }
  };

  // TODO: API 연동 — 현재는 로딩 시뮬레이션 후 더미 데이터 표시
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const entries = useMemo(
    () =>
      filter === "전체"
        ? historyEntries
        : historyEntries.filter((e) => e.status === filter),
    [historyEntries, filter],
  );

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow="History"
          title="작명 기록"
          description="지금까지 요청한 작명과 저장한 이름을 다시 볼 수 있습니다."
          watermark="錄"
        />

        {/* 필터 + 새 작명 CTA */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                filter === f
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-label border-border hover:border-primary hover:text-primary"
              }`}
            >
              {f}
            </button>
          ))}
          <PrimaryButton
            onClick={() => onNavigate("input")}
            className="ml-auto px-4 py-2 text-xs"
          >
            새 작명 시작
          </PrimaryButton>
        </div>

        {/* 로딩 스켈레톤 → 목록 / 빈 상태 */}
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="작명 기록을 불러오는 중">
            {[0, 1, 2].map((i) => (
              <EntrySkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-border">
            <EmptyState
              title={filter === "전체" ? "아직 작명 기록이 없습니다" : `${filter} 상태의 기록이 없습니다`}
              description={
                filter === "전체"
                  ? "첫 작명을 시작해 보세요. 조건을 한 문장으로 적으면 근거 있는 이름을 추천해 드립니다."
                  : "다른 필터를 선택하거나 새 작명을 시작해 보세요."
              }
              action={
                <PrimaryButton onClick={() => onNavigate("input")} className="px-6 py-3">
                  첫 작명 시작하기
                </PrimaryButton>
              }
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry: HistoryEntry, i) => (
              // Reveal이 div를 렌더하므로 li 내부에 두어야 유효한 ul > li 구조가 유지된다
              <li key={entry.id}>
                <Reveal
                  delay={i * 70}
                  className="bg-white border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 hover:border-switch-background hover:shadow-[0_4px_24px_rgba(107,78,46,0.08)]"
                >
                  {/* 대표 이름 미리보기 */}
                  <div className="sm:w-40 flex-shrink-0">
                    <div
                      className="font-hanja text-2xl font-light text-foreground mb-0.5"
                      lang="ko-Hani"
                    >
                      {entry.topName.hanja}
                    </div>
                    <div className="text-sm font-semibold text-secondary-foreground tracking-wide">
                      {entry.topName.hangul}{" "}
                      <span className="text-[11px] font-normal text-caption">외 {entry.resultCount - 1}건</span>
                    </div>
                  </div>

                  {/* 요청 내용 */}
                  <div className="flex-1 min-w-0 sm:border-l sm:border-muted sm:pl-5">
                    <p className="text-sm text-foreground break-keep leading-relaxed mb-1.5">
                      “{entry.query}”
                    </p>
                    <p className="text-[11px] text-caption">
                      {entry.date} · 추천 {entry.resultCount}개 · 저장 {entry.savedCount}개 ·{" "}
                      <span
                        className={
                          entry.status === "완료" ? "text-pine" : "text-accent"
                        }
                      >
                        {entry.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                    <GhostButton
                      onClick={() => navigate(`/history/${entry.id}`)}
                      className="px-4 py-2.5 text-xs flex-1 sm:flex-none"
                    >
                      결과 다시 보기
                    </GhostButton>
                    <GhostButton
                      tone="destructive"
                      onClick={() => setDeleteTarget(entry)}
                      className="px-4 py-2.5 text-xs flex-shrink-0"
                    >
                      삭제
                    </GhostButton>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작명 기록을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.query}" 기록이 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteHistory.isPending}>
              {deleteHistory.isPending ? "삭제 중…" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Footer onNavigate={onNavigate} />
    </div>
  );
}
