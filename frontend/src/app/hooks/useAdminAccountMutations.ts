import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminApi } from "@/api/admin";

export function useAdminAccountMutations() {
  const queryClient = useQueryClient();

  const createAccount = useMutation({
    mutationFn: adminApi.createAccount,
    onSuccess: () => {
      toast.success("관리자 계정이 생성되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "계정 생성에 실패했습니다.";
      toast.error(msg);
    },
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof adminApi.updateAccount>[1] }) =>
      adminApi.updateAccount(id, input),
    onSuccess: () => {
      toast.success("계정 정보가 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "수정에 실패했습니다.";
      toast.error(msg);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Parameters<typeof adminApi.updateAccountRole>[1] }) =>
      adminApi.updateAccountRole(id, role),
    onSuccess: () => {
      toast.success("계정 역할이 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "역할 변경에 실패했습니다.";
      toast.error(msg);
    },
  });

  const unlockAccount = useMutation({
    mutationFn: adminApi.unlockAccount,
    onSuccess: () => {
      toast.success("계정 잠금이 해제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "잠금 해제에 실패했습니다.";
      toast.error(msg);
    },
  });

  const forcePasswordReset = useMutation({
    mutationFn: adminApi.forcePasswordReset,
    onSuccess: () => {
      toast.success("비밀번호 초기화가 요청되었습니다. 다음 로그인 시 변경해야 합니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "비밀번호 초기화 요청에 실패했습니다.";
      toast.error(msg);
    },
  });

  return {
    createAccount,
    updateAccount,
    updateRole,
    unlockAccount,
    forcePasswordReset,
  };
}

