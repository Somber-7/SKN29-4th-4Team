// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AdminNoticeRow, AdminNoticeStatus } from "@/app/types";
import { useAdminNotices } from "@/app/hooks/useAdminNotices";
import {
  useCreateAdminNotice,
  useDeleteAdminNotice,
  useUpdateAdminNotice,
} from "@/app/hooks/useAdminNoticeMutations";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { adminNoticeFormSchema, type AdminNoticeFormValues } from "@/app/schemas/adminNotice";
import { adminApi } from "@/api/admin";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";
import { ApiError } from "@/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
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

type StatusFilter = "전체" | AdminNoticeStatus;
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "전체", label: "전체" },
  { value: "PUBLISHED", label: "게시" },
  { value: "SCHEDULED", label: "예약" },
  { value: "ENDED", label: "종료" },
];

const STATUS_LABEL: Record<AdminNoticeStatus, string> = {
  DRAFT: "임시",
  SCHEDULED: "예약",
  PUBLISHED: "게시",
  ENDED: "종료",
};
const STATUS_STYLES: Record<AdminNoticeStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SCHEDULED: "bg-hanji text-gold-text border-gold-border/30",
  PUBLISHED: "bg-pine/8 text-pine border-pine/25",
  ENDED: "bg-seal/8 text-seal border-seal/25",
};

const PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AdminNoticesScreen() {
  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("notices.write");

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<StatusFilter>("전체");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNoticeRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => setPage(1), [debounced, status]);

  const { data, isFetching } = useAdminNotices({
    status: status === "전체" ? undefined : status,
    q: debounced || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createNotice = useCreateAdminNotice();
  const updateNotice = useUpdateAdminNotice(editingId ?? -1);
  const deleteNotice = useDeleteAdminNotice();

  const form = useForm<AdminNoticeFormValues>({
    resolver: zodResolver(adminNoticeFormSchema),
    defaultValues: { title: "", body: "", status: "DRAFT", isPinned: false, startAt: "", endAt: "" },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ title: "", body: "", status: "DRAFT", isPinned: false, startAt: "", endAt: "" });
    setFormOpen(true);
  };

  const openEdit = async (row: AdminNoticeRow) => {
    setEditingId(row.id);
    form.reset({
      title: row.title,
      body: "",
      status: row.status,
      isPinned: row.isPinned,
      startAt: row.startAt ?? "",
      endAt: row.endAt ?? "",
    });
    setFormOpen(true);
    // 본문은 다이얼로그가 열린 뒤 비동기로 채운다 — 목록엔 body가 없다.
    try {
      const detail = await adminApi.getNotice(row.id);
      form.reset({
        title: detail.title,
        body: detail.body,
        status: detail.status,
        isPinned: detail.isPinned,
        startAt: detail.startAt ?? "",
        endAt: detail.endAt ?? "",
      });
    } catch {
      toast.error("공지 본문을 불러오지 못했습니다.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      body: values.body,
      status: values.status,
      isPinned: values.isPinned,
      startAt: values.startAt || null,
      endAt: values.endAt || null,
    };
    try {
      if (editingId) {
        await updateNotice.mutateAsync(payload);
        toast.success("공지가 수정되었습니다.");
      } else {
        await createNotice.mutateAsync(payload);
        toast.success("공지가 등록되었습니다.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "저장에 실패했습니다."));
    }
  });

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotice.mutateAsync(deleteTarget.id);
      toast.success("공지가 삭제되었습니다.");
    } catch (err) {
      toast.error(errorMessage(err, "삭제에 실패했습니다."));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout
      title="공지사항 관리"
      description="서비스 공지를 작성하고 게시 상태·고정 여부를 관리합니다."
      actions={
        canWrite ? (
          <PrimaryButton onClick={openCreate} className="px-4 py-2.5 text-xs inline-flex items-center gap-1.5">
            <Plus size={14} aria-hidden="true" />
            공지 작성
          </PrimaryButton>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            aria-pressed={status === f.value}
            className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              status === f.value
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-label border-border hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex items-center gap-3 ml-auto w-full max-w-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="제목·본문 검색"
              aria-label="공지 검색"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-border placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <span className="text-xs text-hint whitespace-nowrap flex-shrink-0" aria-live="polite">총 {total}건</span>
        </div>
      </div>

      <section
        className="bg-white border border-border transition-opacity"
        style={{ animation: "mg-fadein 0.3s ease-out both", opacity: isFetching ? 0.6 : 1 }}
      >
        {rows.length === 0 ? (
          <EmptyState
            title="조건에 맞는 공지가 없습니다"
            description="검색어나 상태 필터를 바꿔 보세요."
            action={
              <GhostButton onClick={() => { setKeyword(""); setStatus("전체"); }} className="px-5 py-2.5 text-xs">
                필터 초기화
              </GhostButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption w-full">제목</th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap text-center">수정일</th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption w-20 whitespace-nowrap text-center">상태</th>
                  <th scope="col" className="px-4 py-2.5 w-12"><span className="sr-only">작업</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <NoticeRow
                    key={r.id}
                    row={r}
                    canWrite={canWrite}
                    onEdit={() => openEdit(r)}
                    onPreview={() => setPreviewId(r.id)}
                    onDelete={() => setDeleteTarget(r)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-caption">
          <GhostButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5">이전</GhostButton>
          <span>{page} / {totalPages}</span>
          <GhostButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5">다음</GhostButton>
        </div>
      )}

      {/* 작성/수정 다이얼로그 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "공지 수정" : "공지 작성"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label htmlFor="notice-title" className="block text-xs font-medium text-label mb-1.5">제목</label>
              <input
                id="notice-title"
                {...form.register("title")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="notice-status" className="block text-xs font-medium text-label mb-1.5">상태</label>
                <select
                  id="notice-status"
                  {...form.register("status")}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {(Object.keys(STATUS_LABEL) as AdminNoticeStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-label">
                  <input type="checkbox" {...form.register("isPinned")} className="h-4 w-4" />
                  상단 고정
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="notice-start" className="block text-xs font-medium text-label mb-1.5">시작일시</label>
                <input
                  id="notice-start"
                  type="datetime-local"
                  {...form.register("startAt")}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="notice-end" className="block text-xs font-medium text-label mb-1.5">종료일시</label>
                <input
                  id="notice-end"
                  type="datetime-local"
                  {...form.register("endAt")}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label htmlFor="notice-body" className="block text-xs font-medium text-label mb-1.5">본문</label>
              <textarea
                id="notice-body"
                rows={6}
                {...form.register("body")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.body && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.body.message}</p>
              )}
            </div>
            <DialogFooter>
              <GhostButton type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-xs">취소</GhostButton>
              <PrimaryButton type="submit" disabled={createNotice.isPending || updateNotice.isPending} className="px-4 py-2 text-xs">
                {createNotice.isPending || updateNotice.isPending ? "저장 중…" : "저장"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" 공지가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NoticePreviewDialog
        noticeId={previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      />
    </AdminLayout>
  );
}

function NoticeRow({
  row,
  canWrite,
  onEdit,
  onPreview,
  onDelete,
}: {
  row: AdminNoticeRow;
  canWrite: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const updateNotice = useUpdateAdminNotice(row.id);

  const togglePin = async () => {
    try {
      await updateNotice.mutateAsync({ isPinned: !row.isPinned });
      toast.success(row.isPinned ? "고정이 해제되었습니다." : "상단에 고정되었습니다.");
    } catch (err) {
      toast.error(errorMessage(err, "고정 상태 변경에 실패했습니다."));
    }
  };

  return (
    <tr 
      onClick={onPreview}
      className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
    >
      <td className="px-5 py-3 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">
          <span className="truncate">{row.title}</span>
          {row.isPinned && (
            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-gold-bg text-gold-text border border-gold-border/30 rounded-sm">고정</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-ink whitespace-nowrap tabular-nums text-center">
        {new Date(row.updatedAt).toLocaleDateString("ko-KR")}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex min-w-[42px] justify-center whitespace-nowrap px-2 py-0.5 text-[11px] font-medium border ${STATUS_STYLES[row.status]}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 flex items-center justify-center text-faint hover:text-foreground border border-transparent hover:border-border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={`${row.title} 작업 메뉴`}
            >
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border min-w-[130px]">
            <DropdownMenuItem onClick={onPreview} className="text-xs cursor-pointer rounded-none">미리보기</DropdownMenuItem>
            {canWrite && (
              <>
                <DropdownMenuItem onClick={onEdit} className="text-xs cursor-pointer rounded-none">수정</DropdownMenuItem>
                <DropdownMenuItem onClick={togglePin} className="text-xs cursor-pointer rounded-none">
                  {row.isPinned ? "고정 해제" : "상단 고정"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-xs cursor-pointer rounded-none text-destructive focus:text-destructive">
                  삭제
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function NoticePreviewDialog({
  noticeId,
  onOpenChange,
}: {
  noticeId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (noticeId === null) {
      setDetail(null);
      return;
    }
    adminApi.getNotice(noticeId).then(setDetail).catch(() => {
      toast.error("공지를 불러오지 못했습니다.");
    });
  }, [noticeId]);

  return (
    <Dialog open={noticeId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border border-border shadow-lg rounded-sm">
        <DialogHeader className="bg-secondary/30 px-6 py-5 border-b border-border flex flex-col gap-3 sm:text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] bg-primary text-white px-2 py-0.5 font-medium rounded-sm shadow-sm">사용자 화면 미리보기</span>
            {detail?.isPinned && <span className="text-[10px] bg-gold-bg text-gold-text px-2 py-0.5 font-medium border border-gold-border/30 rounded-sm">상단 고정</span>}
            {detail?.status && <span className="text-[10px] bg-white text-label px-2 py-0.5 font-medium border border-border rounded-sm">{STATUS_LABEL[detail.status as AdminNoticeStatus]}</span>}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground leading-snug">
            {detail?.title || "불러오는 중..."}
          </DialogTitle>
          <div className="flex items-center gap-2 text-[12px] text-caption mt-1">
            <span>작성일 {detail && new Date(detail.createdAt).toLocaleDateString("ko-KR")}</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span>수정일 {detail && new Date(detail.updatedAt).toLocaleDateString("ko-KR")}</span>
          </div>
        </DialogHeader>
        <div className="px-6 py-8 text-[15px] text-ink whitespace-pre-wrap leading-[1.7] max-h-[50vh] overflow-y-auto font-sans bg-white">
          {detail?.body || "불러오는 중..."}
        </div>
        <DialogFooter className="bg-secondary/10 px-6 py-4 border-t border-border flex justify-end sm:justify-end">
          <PrimaryButton onClick={() => onOpenChange(false)} className="px-5 py-2 text-sm shadow-sm">
            확인
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
