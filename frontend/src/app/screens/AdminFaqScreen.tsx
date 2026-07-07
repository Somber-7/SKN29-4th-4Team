import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, MoreHorizontal, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminFaqRow } from "@/app/types";
import { useAdminFaqCategories, useAdminFaqs } from "@/app/hooks/useAdminFaqs";
import {
  useCreateAdminFaq,
  useCreateAdminFaqCategory,
  useDeleteAdminFaq,
  useDeleteAdminFaqCategory,
  useUpdateAdminFaq,
} from "@/app/hooks/useAdminFaqMutations";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import {
  adminFaqCategoryFormSchema,
  adminFaqFormSchema,
  type AdminFaqCategoryFormValues,
  type AdminFaqFormValues,
} from "@/app/schemas/adminFaq";
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

const PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AdminFaqScreen() {
  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("faqs.write");

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFaqRow | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => setPage(1), [debounced, categoryId]);

  const { data, isFetching } = useAdminFaqs({
    categoryId,
    q: debounced || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: categories } = useAdminFaqCategories();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createFaq = useCreateAdminFaq();
  const updateFaq = useUpdateAdminFaq(editingId ?? -1);
  const deleteFaq = useDeleteAdminFaq();

  const form = useForm<AdminFaqFormValues>({ resolver: zodResolver(adminFaqFormSchema) });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ question: "", answer: "", categoryId: categories?.[0]?.id, isActive: true, order: 0 });
    setFormOpen(true);
  };

  const openEdit = async (row: AdminFaqRow) => {
    setEditingId(row.id);
    form.reset({ question: row.question, categoryId: row.categoryId, answer: "", isActive: row.isActive, order: row.order });
    setFormOpen(true);
    // 답변 본문은 다이얼로그가 열린 뒤 비동기로 채운다 — 목록엔 answer가 없다.
    try {
      const detail = await adminApi.getFaq(row.id);
      form.reset({
        question: detail.question,
        answer: detail.answer,
        categoryId: detail.categoryId,
        isActive: detail.isActive,
        order: detail.order,
      });
    } catch {
      toast.error("FAQ 답변을 불러오지 못했습니다.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editingId) {
        await updateFaq.mutateAsync(values);
        toast.success("FAQ가 수정되었습니다.");
      } else {
        await createFaq.mutateAsync(values);
        toast.success("FAQ가 등록되었습니다.");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "저장에 실패했습니다."));
    }
  });

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaq.mutateAsync(deleteTarget.id);
      toast.success("FAQ가 삭제되었습니다.");
    } catch (err) {
      toast.error(errorMessage(err, "삭제에 실패했습니다."));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout
      title="FAQ 관리"
      description="자주 묻는 질문을 등록하고 노출 여부를 관리합니다."
      actions={
        canWrite ? (
          <div className="flex items-center gap-2">
            <GhostButton
              onClick={() => setCategoryDialogOpen(true)}
              className="px-4 py-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <Settings2 size={14} aria-hidden="true" />
              카테고리 관리
            </GhostButton>
            <PrimaryButton onClick={openCreate} className="px-4 py-2.5 text-xs inline-flex items-center gap-1.5">
              <Plus size={14} aria-hidden="true" />
              FAQ 작성
            </PrimaryButton>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setCategoryId(undefined)}
          aria-pressed={categoryId === undefined}
          className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
            categoryId === undefined
              ? "bg-foreground text-background border-foreground"
              : "bg-white text-label border-border hover:border-primary hover:text-primary"
          }`}
        >
          전체
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            aria-pressed={categoryId === c.id}
            className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              categoryId === c.id
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-label border-border hover:border-primary hover:text-primary"
            }`}
          >
            {c.name}
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="질문·답변 검색"
            aria-label="FAQ 검색"
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-border placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs text-hint" aria-live="polite">{total}건</span>
      </div>

      <section
        className="bg-white border border-border transition-opacity"
        style={{ animation: "mg-fadein 0.3s ease-out both", opacity: isFetching ? 0.6 : 1 }}
      >
        {rows.length === 0 ? (
          <EmptyState
            title="조건에 맞는 FAQ가 없습니다"
            description="검색어나 카테고리 필터를 바꿔 보세요."
            action={
              <GhostButton onClick={() => { setKeyword(""); setCategoryId(undefined); }} className="px-5 py-2.5 text-xs">
                필터 초기화
              </GhostButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th scope="col" className="px-5 py-3 text-[13px] font-medium text-caption w-full">질문</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">카테고리</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">수정일</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">노출</th>
                  <th scope="col" className="px-4 py-3 w-12 text-center"><span className="sr-only">작업</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <FaqRow
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
            <DialogTitle>{editingId ? "FAQ 수정" : "FAQ 작성"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label htmlFor="faq-question" className="block text-xs font-medium text-label mb-1.5">질문</label>
              <input
                id="faq-question"
                {...form.register("question")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.question && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.question.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="faq-category" className="block text-xs font-medium text-label mb-1.5">카테고리</label>
                <select
                  id="faq-category"
                  {...form.register("categoryId")}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="faq-order" className="block text-xs font-medium text-label mb-1.5">노출 순서</label>
                <input
                  id="faq-order"
                  type="number"
                  min={0}
                  {...form.register("order")}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-label -mt-1">
              <input type="checkbox" {...form.register("isActive")} className="h-4 w-4" />
              노출
            </label>
            <div>
              <label htmlFor="faq-answer" className="block text-xs font-medium text-label mb-1.5">답변</label>
              <textarea
                id="faq-answer"
                rows={6}
                {...form.register("answer")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.answer && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.answer.message}</p>
              )}
            </div>
            <DialogFooter>
              <GhostButton type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-xs">취소</GhostButton>
              <PrimaryButton type="submit" disabled={createFaq.isPending || updateFaq.isPending} className="px-4 py-2 text-xs">
                {createFaq.isPending || updateFaq.isPending ? "저장 중…" : "저장"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>FAQ를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.question}" 항목이 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FaqCategoryManageDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />

      <FaqPreviewDialog
        faqId={previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      />
    </AdminLayout>
  );
}

function FaqRow({
  row,
  canWrite,
  onEdit,
  onPreview,
  onDelete,
}: {
  row: AdminFaqRow;
  canWrite: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const updateFaq = useUpdateAdminFaq(row.id);

  const toggleActive = async () => {
    try {
      await updateFaq.mutateAsync({ isActive: !row.isActive });
      toast.success(row.isActive ? "노출이 해제되었습니다." : "노출로 전환되었습니다.");
    } catch (err) {
      toast.error(errorMessage(err, "노출 상태 변경에 실패했습니다."));
    }
  };

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150">
      <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">
        <button onClick={onPreview} className="hover:underline text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-primary">
          {row.question}
        </button>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap text-center">{row.categoryName}</td>
      <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap tabular-nums text-center">
        {new Date(row.updatedAt).toLocaleDateString("ko-KR")}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-center">
        <span
          className={`inline-flex px-2 py-0.5 text-[11px] font-medium border ${
            row.isActive ? "bg-pine/8 text-pine border-pine/25" : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.isActive ? "노출" : "비노출"}
        </span>
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 flex items-center justify-center text-faint hover:text-foreground border border-transparent hover:border-border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={`${row.question} 작업 메뉴`}
            >
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border min-w-[130px]">
            <DropdownMenuItem onClick={onPreview} className="text-xs cursor-pointer rounded-none">미리보기</DropdownMenuItem>
            {canWrite && (
              <>
                <DropdownMenuItem onClick={onEdit} className="text-xs cursor-pointer rounded-none">수정</DropdownMenuItem>
                <DropdownMenuItem onClick={toggleActive} className="text-xs cursor-pointer rounded-none">
                  {row.isActive ? "비노출로 전환" : "노출로 전환"}
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

function FaqPreviewDialog({
  faqId,
  onOpenChange,
}: {
  faqId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (faqId === null) {
      setDetail(null);
      return;
    }
    adminApi.getFaq(faqId).then(setDetail).catch(() => {
      toast.error("FAQ를 불러오지 못했습니다.");
    });
  }, [faqId]);

  return (
    <Dialog open={faqId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 font-medium border border-primary/20">사용자 화면 미리보기</span>
            <span className="text-[10px] bg-secondary text-ink px-2 py-0.5 font-medium border border-border">{detail?.categoryName}</span>
          </div>
          <DialogTitle className="text-base font-semibold text-foreground text-left flex items-start gap-2">
            <span className="text-primary font-bold">Q.</span>
            <span>{detail?.question}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="border-t border-border mt-3 pt-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto font-sans flex items-start gap-2">
          <span className="text-pine font-bold">A.</span>
          <span>{detail?.answer}</span>
        </div>
        <DialogFooter className="border-t border-border pt-3">
          <GhostButton onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs">닫기</GhostButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FaqCategoryManageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: categories } = useAdminFaqCategories();
  const createCategory = useCreateAdminFaqCategory();
  const deleteCategory = useDeleteAdminFaqCategory();
  const form = useForm<AdminFaqCategoryFormValues>({
    resolver: zodResolver(adminFaqCategoryFormSchema),
    defaultValues: { name: "", order: 0 },
  });

  const onAdd = form.handleSubmit(async (values) => {
    try {
      await createCategory.mutateAsync(values);
      form.reset({ name: "", order: 0 });
    } catch (err) {
      toast.error(errorMessage(err, "카테고리 추가에 실패했습니다."));
    }
  });

  const onRemove = async (id: number) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (err) {
      toast.error(errorMessage(err, "이 카테고리를 사용하는 FAQ가 있어 삭제할 수 없습니다."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border max-h-60 overflow-y-auto">
          {categories?.map((c) => (
            <li key={c.id} className="py-2 flex items-center justify-between text-sm">
              <span>{c.name} <span className="text-xs text-caption">(순서 {c.order})</span></span>
              <GhostButton tone="destructive" onClick={() => onRemove(c.id)} className="px-2 py-1 text-xs">삭제</GhostButton>
            </li>
          ))}
        </ul>
        <form onSubmit={onAdd} className="flex items-end gap-2 pt-2 border-t border-border">
          <div className="flex-1">
            <label htmlFor="faq-cat-name" className="block text-xs font-medium text-label mb-1.5">새 카테고리</label>
            <input
              id="faq-cat-name"
              {...form.register("name")}
              className="w-full px-3 py-2 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <PrimaryButton type="submit" disabled={createCategory.isPending} className="px-4 py-2 text-xs">추가</PrimaryButton>
        </form>
        {form.formState.errors.name && (
          <p className="text-xs text-destructive -mt-2">{form.formState.errors.name.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

