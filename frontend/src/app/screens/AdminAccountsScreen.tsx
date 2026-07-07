// @ts-nocheck
import { useState, useEffect } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import type { AdminRole } from "@/app/types";
import { useAdminAccounts } from "@/app/hooks/useAdminAccounts";
import { useAdminAccountMutations } from "@/app/hooks/useAdminAccountMutations";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";

import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminAccountCreateSchema } from "@/app/schemas/adminAccount";
import type { z } from "zod";

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPERADMIN: "최고관리자",
  ADMIN: "운영관리자",
  ANALYST: "통계분석가",
};

const PAGE_SIZE = 20;

export function AdminAccountsScreen() {
  const { hasPermission, admin } = useAdminAuth();
  const canManage = hasPermission("accounts.manage");

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const { data, isFetching } = useAdminAccounts({
    q: debounced || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const { createAccount, updateAccount, updateRole, unlockAccount, forcePasswordReset, deleteAccount } = useAdminAccountMutations();

  const rows = data?.items ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editDisplayNameAccount, setEditDisplayNameAccount] = useState<{ id: number; currentName: string } | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof adminAccountCreateSchema>>({
    resolver: zodResolver(adminAccountCreateSchema),
    defaultValues: { role: "ADMIN" },
  });

  function onSubmitCreate(values: z.infer<typeof adminAccountCreateSchema>) {
    if (!canManage) return;
    createAccount.mutate(values, {
      onSuccess: () => {
        setCreateOpen(false);
        reset();
      },
    });
  }

  function handleToggleActive(id: number, current: boolean) {
    if (!canManage) return;
    if (!window.confirm(`계정을 ${current ? "정지" : "활성"} 상태로 변경하시겠습니까?`)) return;
    updateAccount.mutate({ id, input: { isActiveAdmin: !current } });
  }

  function handleUnlock(id: number) {
    if (!canManage) return;
    if (!window.confirm("계정 잠금을 해제하시겠습니까?")) return;
    unlockAccount.mutate(id);
  }

  function handleResetPassword(id: number) {
    if (!canManage) return;
    if (!window.confirm("계정 비밀번호 초기화를 요청하시겠습니까? 다음 로그인 시 변경해야 합니다.")) return;
    forcePasswordReset.mutate(id);
  }

  function handleUpdateRole(id: number, role: AdminRole) {
    if (!canManage) return;
    if (!window.confirm(`역할을 ${ROLE_LABEL[role]}(으)로 변경하시겠습니까?`)) return;
    updateRole.mutate({ id, role });
  }

  function handleUpdateDisplayNameClick(id: number, currentName: string) {
    if (!canManage) return;
    setEditDisplayNameAccount({ id, currentName });
    setEditNameValue(currentName);
  }

  function handleUpdateDisplayNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDisplayNameAccount) return;
    const newName = editNameValue.trim();
    if (!newName || newName === editDisplayNameAccount.currentName) {
      setEditDisplayNameAccount(null);
      return;
    }
    updateAccount.mutate(
      { id: editDisplayNameAccount.id, input: { displayName: newName } },
      { onSuccess: () => setEditDisplayNameAccount(null) }
    );
  }

  function handleDeleteAccount(id: number, username: string) {
    if (!canManage) return;
    if (!window.confirm(`정말 계정 '${username}'을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    deleteAccount.mutate(id);
  }

  return (
    <AdminLayout
      title="계정 관리"
      description="관리자 계정과 권한을 관리합니다."
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="아이디 또는 표시명 검색"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-faint"
            />
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <PrimaryButton className="px-3 py-1.5 whitespace-nowrap">
                  새 계정 생성
                </PrimaryButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 관리자 계정 생성</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">아이디</label>
                    <input
                      {...register("username")}
                      className="w-full p-2 border border-border text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">표시명 (이름)</label>
                    <input
                      {...register("displayName")}
                      className="w-full p-2 border border-border text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">임시 비밀번호</label>
                    <input
                      type="password"
                      {...register("password")}
                      className="w-full p-2 border border-border text-sm focus:border-primary focus:outline-none"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">역할</label>
                    <select
                      {...register("role")}
                      className="w-full p-2 border border-border text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="ADMIN">운영관리자</option>
                      <option value="ANALYST">통계분석가</option>
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <GhostButton type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2">취소</GhostButton>
                    <PrimaryButton type="submit" disabled={isSubmitting} className="px-4 py-2">생성</PrimaryButton>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="bg-white border border-border relative overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left">
                <th scope="col" className="px-5 py-3 text-[13px] font-medium text-caption whitespace-nowrap">아이디</th>
                <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption w-full whitespace-nowrap">표시명</th>
                <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">역할</th>
                <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">상태</th>
                <th scope="col" className="px-4 py-3 w-12 text-center whitespace-nowrap"><span className="sr-only">관리</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-medium text-foreground whitespace-nowrap">{row.username}</td>
                    <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap">{row.displayName}</td>
                    <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap text-center">
                      <span>{ROLE_LABEL[row.role]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border ${
                          row.isActiveAdmin
                            ? "bg-pine/8 text-pine border-pine/25"
                            : "bg-seal/8 text-seal border-seal/25"
                        }`}
                      >
                        {row.isActiveAdmin ? "활성" : "정지"}
                      </span>
                      {row.lockedUntil && (
                        <span className="ml-2 text-[11px] font-medium text-seal">잠김</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <GhostButton className="p-1.5" aria-label="계정 관리 메뉴">
                              <MoreHorizontal size={16} />
                            </GhostButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {admin?.username !== row.username && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateDisplayNameClick(row.id, row.displayName)}>
                                  표시명 수정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(row.id, row.isActiveAdmin)}>
                                  {row.isActiveAdmin ? "계정 정지" : "정지 해제"}
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>역할 변경</DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                      {(["ADMIN", "ANALYST"] as AdminRole[]).map(role => (
                                        <DropdownMenuItem key={role} onClick={() => handleUpdateRole(row.id, role)}>
                                          {ROLE_LABEL[role]}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                              </>
                            )}
                            {row.lockedUntil && (
                              <DropdownMenuItem onClick={() => handleUnlock(row.id)}>
                                잠금 해제
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleResetPassword(row.id)}>
                              비밀번호 초기화
                            </DropdownMenuItem>
                            {admin?.username !== row.username && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteAccount(row.id, row.username)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                계정 삭제
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12">
                    <EmptyState
                      title={isFetching ? "불러오는 중..." : "검색 결과가 없습니다"}
                      description={isFetching ? "" : "검색어를 변경해보세요."}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editDisplayNameAccount} onOpenChange={(open) => !open && setEditDisplayNameAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>표시명 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateDisplayNameSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">새로운 표시명</label>
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="w-full p-2 border border-border text-sm focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setEditDisplayNameAccount(null)} className="px-4 py-2">
                취소
              </GhostButton>
              <PrimaryButton type="submit" disabled={updateAccount.isPending} className="px-4 py-2">
                수정
              </PrimaryButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
