// @ts-nocheck
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type AdminUserApprovalInput,
  type AdminUserCreateInput,
  type AdminUserUpdateInput,
} from "@/api/admin";
import type { AdminUserStatus } from "@/app/types";

// ─── 관리자 회원 CRUD useMutation (관리자페이지 개발 계획서 §16.2) ──────────────
// 목록/상세 쿼리를 함께 무효화해 화면이 즉시 최신 상태를 반영하도록 한다.

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserCreateInput) => adminApi.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateAdminUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserUpdateInput) => adminApi.updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
    },
  });
}

export function useUpdateAdminUserStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: AdminUserStatus) => adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
    },
  });
}

export function useUpdateAdminUserApproval(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUserApprovalInput) => adminApi.updateUserApproval(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
