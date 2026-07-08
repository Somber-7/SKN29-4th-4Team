// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminInquiryReplyInput } from "@/api/admin";

// ─── 관리자 문의 답변 useMutation (관리자페이지 개발 계획서 §16.2) ──────────────

export function useReplyAdminInquiry(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminInquiryReplyInput) => adminApi.replyInquiry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries", id] });
    },
  });
}
