// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAdminUserActivity, useAdminUserDetail } from "@/app/hooks/useAdminUsers";
import {
  useDeleteAdminUser,
  useUpdateAdminUser,
  useUpdateAdminUserStatus,
} from "@/app/hooks/useAdminUserMutations";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import {
  adminUserUpdateSchema,
  type AdminUserUpdateFormValues,
} from "@/app/schemas/adminUser";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";
import { EmptyState } from "@/app/components/common/EmptyState";
import { ApiError } from "@/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { AdminUserStatus } from "@/app/types";

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AdminUserDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("users.write");
  const canDelete = hasPermission("users.delete");

  const { data: user, isLoading } = useAdminUserDetail(userId);
  const [activityType, setActivityType] = useState<"login" | "naming">("login");
  const [activityPage, setActivityPage] = useState(1);
  const { data: activity } = useAdminUserActivity(userId, activityType, activityPage);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateUser = useUpdateAdminUser(userId ?? -1);
  const updateStatus = useUpdateAdminUserStatus(userId ?? -1);
  const deleteUser = useDeleteAdminUser();

  const editForm = useForm<AdminUserUpdateFormValues>({
    resolver: zodResolver(adminUserUpdateSchema),
    values: user ? { name: user.name, email: user.email } : undefined,
  });

  if (isLoading) {
    return (
      <AdminLayout title="회원 상세" description="회원 정보를 불러오는 중입니다.">
        <div className="h-40" />
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="회원 상세" description="">
        <EmptyState
          title="회원을 찾을 수 없습니다"
          description="삭제되었거나 존재하지 않는 회원입니다."
          action={
            <GhostButton onClick={() => navigate("/users")} className="px-5 py-2.5 text-xs">
              목록으로
            </GhostButton>
          }
        />
      </AdminLayout>
    );
  }

  const onSaveEdit = editForm.handleSubmit(async (values) => {
    try {
      await updateUser.mutateAsync(values);
      toast.success("회원 정보가 수정되었습니다.");
      setEditOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "수정에 실패했습니다."));
    }
  });

  const toggleStatus = async (next: AdminUserStatus) => {
    try {
      await updateStatus.mutateAsync(next);
      toast.success(`상태가 '${STATUS_LABEL[next]}'(으)로 변경되었습니다.`);
    } catch (err) {
      toast.error(errorMessage(err, "상태 변경에 실패했습니다."));
    }
  };

  const onDelete = async () => {
    if (!userId) return;
    try {
      await deleteUser.mutateAsync(userId);
      toast.success("회원이 완전히 삭제되었습니다.");
      navigate("/users");
    } catch (err) {
      toast.error(errorMessage(err, "삭제에 실패했습니다."));
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <AdminLayout
      title={user.masked ? "회원 상세 (마스킹)" : "회원 상세"}
      description={`가입일 ${new Date(user.joinedAt).toLocaleDateString("ko-KR")}`}
      actions={
        <GhostButton onClick={() => navigate("/users")} className="px-4 py-2.5 text-xs inline-flex items-center gap-1.5">
          <ArrowLeft size={14} aria-hidden="true" />
          목록으로
        </GhostButton>
      }
    >
      <div className="grid gap-4 max-w-3xl">
        <section className="bg-white border border-border p-5 sm:p-6" style={{ animation: "mg-fadein 0.3s ease-out both" }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-sm font-medium text-foreground">기본 정보</h2>
            {canWrite && !user.masked && (
              <GhostButton onClick={() => setEditOpen(true)} className="px-3 py-1.5 text-xs">
                수정
              </GhostButton>
            )}
          </div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-caption mb-1">이름</dt>
              <dd className="text-foreground">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-caption mb-1">이메일</dt>
              <dd className="text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-caption mb-1">상태</dt>
              <dd className="text-foreground">{STATUS_LABEL[user.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-caption mb-1">작명 요청</dt>
              <dd className="text-foreground tabular-nums">{user.requests}건</dd>
            </div>
            <div>
              <dt className="text-xs text-caption mb-1">저장 이름</dt>
              <dd className="text-foreground tabular-nums">{user.saved}개</dd>
            </div>
          </dl>

          {(canWrite || canDelete) && (
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border">
              {canWrite &&
                (["ACTIVE", "SUSPENDED"] as AdminUserStatus[])
                  .filter((s) => s !== user.status)
                  .map((s) => (
                    <GhostButton
                      key={s}
                      tone={s === "SUSPENDED" ? "destructive" : "primary"}
                      onClick={() => toggleStatus(s)}
                      className="px-4 py-2 text-xs"
                    >
                      {s === "ACTIVE" ? "활성으로 전환" : "이용 정지"}
                    </GhostButton>
                  ))}
              {canDelete && !user.isDeleted && (
                <GhostButton tone="destructive" onClick={() => setDeleteOpen(true)} className="px-4 py-2 text-xs ml-auto">
                  회원 삭제
                </GhostButton>
              )}
            </div>
          )}
        </section>

        <section className="bg-white border border-border p-5 sm:p-6" style={{ animation: "mg-fadein 0.3s ease-out both" }}>
          <h2 className="text-sm font-medium text-foreground mb-4">활동 로그</h2>
          <Tabs
            value={activityType}
            onValueChange={(v) => {
              setActivityType(v as "login" | "naming");
              setActivityPage(1);
            }}
          >
            <TabsList className="gap-2 mb-3">
              <TabsTrigger
                value="login"
                className="px-3 py-1.5 text-xs border border-border data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                로그인 이력
              </TabsTrigger>
              <TabsTrigger
                value="naming"
                className="px-3 py-1.5 text-xs border border-border data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                작명 요청 이력
              </TabsTrigger>
            </TabsList>
            <TabsContent value={activityType}>
              {!activity || activity.items.length === 0 ? (
                <p className="text-xs text-caption py-6 text-center">기록이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {activity.items.map((item) => (
                    <li key={item.id} className="py-2.5 flex flex-col gap-1.5 text-xs w-full overflow-hidden">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="text-ink truncate">{item.detail || "-"}</span>
                        <span className="flex items-center gap-2 text-caption whitespace-nowrap">
                          {item.type === "login" && (
                            <span className={item.success ? "text-pine" : "text-seal"}>
                              {item.success ? "성공" : "실패"}
                            </span>
                          )}
                          {new Date(item.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      {item.type === "naming" && item.results && item.results.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {item.results.map((res: any, idx: number) => (
                            <span key={idx} className="bg-sand-light/50 px-2 py-0.5 rounded text-[11px] text-faint border border-border">
                              {res.hangul}({res.hanja})
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {activity && activity.total > activity.pageSize && (
                <div className="flex items-center justify-center gap-3 mt-3 text-xs text-caption">
                  <GhostButton
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    disabled={activityPage <= 1}
                    className="px-3 py-1"
                  >
                    이전
                  </GhostButton>
                  <span>{activityPage} / {Math.max(1, Math.ceil(activity.total / activity.pageSize))}</span>
                  <GhostButton
                    onClick={() => setActivityPage((p) => p + 1)}
                    disabled={activityPage * activity.pageSize >= activity.total}
                    className="px-3 py-1"
                  >
                    다음
                  </GhostButton>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 정보 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSaveEdit} className="grid gap-3">
            <div>
              <label htmlFor="eu-name" className="block text-xs font-medium text-label mb-1.5">이름</label>
              <input
                id="eu-name"
                {...editForm.register("name")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive mt-1">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="eu-email" className="block text-xs font-medium text-label mb-1.5">이메일</label>
              <input
                id="eu-email"
                type="email"
                {...editForm.register("email")}
                className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <DialogFooter>
              <GhostButton type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-xs">
                취소
              </GhostButton>
              <PrimaryButton type="submit" disabled={updateUser.isPending} className="px-4 py-2 text-xs">
                {updateUser.isPending ? "저장 중…" : "저장"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원을 완전히 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              계정과 작명 기록·로그인 이력 등 관련 데이터가 모두 영구 삭제되며 되돌릴 수 없습니다. 동일 이메일로 즉시 재가입은 가능합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
