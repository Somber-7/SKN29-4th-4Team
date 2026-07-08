import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Mail } from "lucide-react";
import { toast } from "sonner";
import type { AdminInquiryStatus } from "@/app/types";
import { useAdminInquiries } from "@/app/hooks/useAdminInquiries";
import { useReplyAdminInquiry } from "@/app/hooks/useAdminInquiryMutations";
import { useAdminInquiryTemplates } from "@/app/hooks/useAdminInquiryTemplates";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { adminInquiryReplyFormSchema, type AdminInquiryReplyFormValues } from "@/app/schemas/adminInquiry";
import { adminApi } from "@/api/admin";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";
import { ApiError } from "@/api/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

type StatusFilter = "전체" | AdminInquiryStatus;
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "전체", label: "전체" },
  { value: "received", label: "접수" },
  { value: "in_progress", label: "처리 중" },
  { value: "answered", label: "답변 완료" },
];

const STATUS_LABEL: Record<AdminInquiryStatus, string> = {
  received: "접수",
  in_progress: "처리 중",
  answered: "답변 완료",
};
const STATUS_STYLES: Record<AdminInquiryStatus, string> = {
  received: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-hanji text-gold-text border-gold-border/30",
  answered: "bg-pine/8 text-pine border-pine/25",
};

const PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AdminInquiriesScreen() {
  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("inquiries.write");

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<StatusFilter>("전체");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => setPage(1), [debounced, status]);

  const { data, isFetching } = useAdminInquiries({
    status: status === "전체" ? undefined : status,
    q: debounced || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="문의 관리" description="사용자가 남긴 문의를 확인하고 답변합니다.">
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
              placeholder="이름·이메일·제목 검색"
              aria-label="문의 검색"
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
            title="조건에 맞는 문의가 없습니다"
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
                  <th scope="col" className="px-5 py-3 text-[13px] font-medium text-caption w-full">제목</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap">문의자</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">유형</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">접수일</th>
                  <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption w-20 whitespace-nowrap text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">
                      <button
                        onClick={() => setDetailId(r.id)}
                        className="hover:underline text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        {r.subject}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap">
                      {r.name} <span className="text-caption">({r.email})</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap text-center">{r.topic || "-"}</td>
                    <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap tabular-nums text-center">
                      {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex min-w-[42px] justify-center whitespace-nowrap px-2 py-0.5 text-[11px] font-medium border ${STATUS_STYLES[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                  </tr>
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

      <InquiryDetailDialog
        inquiryId={detailId}
        canWrite={canWrite}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </AdminLayout>
  );
}

function InquiryDetailDialog({
  inquiryId,
  canWrite,
  onOpenChange,
}: {
  inquiryId: number | null;
  canWrite: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof adminApi.getInquiry>> | null>(null);
  const replyInquiry = useReplyAdminInquiry(inquiryId ?? -1);
  const { data: templates } = useAdminInquiryTemplates();

  const form = useForm<AdminInquiryReplyFormValues>({
    resolver: zodResolver(adminInquiryReplyFormSchema),
    defaultValues: { status: "received", adminReply: "" },
  });

  useEffect(() => {
    if (inquiryId === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    adminApi.getInquiry(inquiryId).then((found) => {
      if (cancelled) return;
      setDetail(found);
      form.reset({ status: found.status, adminReply: found.adminReply });
    }).catch(() => {
      toast.error("문의를 불러오지 못했습니다.");
    });
    return () => {
      cancelled = true;
    };
  }, [inquiryId, form]);

  const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = Number(e.target.value);
    if (!templateId) return;
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      form.setValue("adminReply", template.body);
      form.setValue("status", "answered");
      adminApi.useInquiryTemplate(templateId).catch(() => {});
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await replyInquiry.mutateAsync(values);
      toast.success("답변이 저장되었습니다.");
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "저장에 실패했습니다."));
    }
  });

  return (
    <Dialog open={inquiryId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{detail?.subject ?? "문의 상세"}</DialogTitle>
        </DialogHeader>
        {!detail ? (
          <p className="text-sm text-caption py-6 text-center">불러오는 중…</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="flex items-center gap-2 text-xs text-caption">
              <Mail size={13} aria-hidden="true" />
              <span>{detail.name} ({detail.email})</span>
              {detail.topic && <span className="ml-auto">{detail.topic}</span>}
            </div>
            <div className="bg-secondary/50 border border-border px-3.5 py-3 text-sm text-ink whitespace-pre-wrap">
              {detail.message}
            </div>
            <div>
              <label htmlFor="inquiry-status" className="block text-xs font-medium text-label mb-1.5">상태</label>
              <select
                id="inquiry-status"
                {...form.register("status")}
                disabled={!canWrite}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-60"
              >
                {(Object.keys(STATUS_LABEL) as AdminInquiryStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="inquiry-reply" className="text-xs font-medium text-label">답변 내용</label>
                {canWrite && templates && templates.length > 0 && (
                  <select
                    onChange={handleSelectTemplate}
                    defaultValue=""
                    className="text-[11px] px-2 py-0.5 border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>답변 템플릿 선택</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>[{t.category || "일반"}] {t.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                id="inquiry-reply"
                rows={5}
                disabled={!canWrite}
                {...form.register("adminReply")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-60"
              />
              {form.formState.errors.adminReply && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.adminReply.message}</p>
              )}
            </div>
            {canWrite && (
              <DialogFooter>
                <GhostButton type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs">닫기</GhostButton>
                <PrimaryButton type="submit" disabled={replyInquiry.isPending} className="px-4 py-2 text-xs">
                  {replyInquiry.isPending ? "저장 중…" : "저장"}
                </PrimaryButton>
              </DialogFooter>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

