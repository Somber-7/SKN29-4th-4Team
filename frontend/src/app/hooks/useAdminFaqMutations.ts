// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type AdminFaqCreateInput,
  type AdminFaqUpdateInput,
} from "@/api/admin";

// ─── 관리자 FAQ/카테고리 useMutation (관리자페이지 개발 계획서 §16.2) ───────────

export function useCreateAdminFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminFaqCreateInput) => adminApi.createFaq(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] }),
  });
}

export function useUpdateAdminFaq(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminFaqUpdateInput) => adminApi.updateFaq(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs", id] });
    },
  });
}

export function useDeleteAdminFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteFaq(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] }),
  });
}

export function useCreateAdminFaqCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; order: number }) => {
      await new Promise(r => setTimeout(r, 300));
      return { id: Date.now(), ...input };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "faqCategories"] }),
  });
}

export function useUpdateAdminFaqCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; order?: number } }) => {
      await new Promise(r => setTimeout(r, 300));
      return { id, ...data };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "faqCategories"] }),
  });
}

export function useDeleteAdminFaqCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await new Promise(r => setTimeout(r, 300));
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "faqCategories"] }),
  });
}
