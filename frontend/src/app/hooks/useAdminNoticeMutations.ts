// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminNoticeCreateInput, type AdminNoticeUpdateInput } from "@/api/admin";

// ─── 관리자 공지 useMutation (관리자페이지 개발 계획서 §16.2) ───────────────────

export function useCreateAdminNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminNoticeCreateInput) => adminApi.createNotice(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "notices"] }),
  });
}

export function useUpdateAdminNotice(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminNoticeUpdateInput) => adminApi.updateNotice(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notices"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "notices", id] });
    },
  });
}

export function useDeleteAdminNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteNotice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "notices"] }),
  });
}
