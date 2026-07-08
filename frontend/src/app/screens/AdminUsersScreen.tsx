// @ts-nocheck
import { useEffect, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AdminUserRow, AdminUserStatus } from "@/app/types";
import { useAdminUsers } from "@/app/hooks/useAdminUsers";
import { useUpdateAdminUserStatus } from "@/app/hooks/useAdminUserMutations";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton } from "@/app/components/common/Button";
import { ApiError } from "@/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type StatusFilter = "전체" | AdminUserStatus;
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "전체", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};
const STATUS_STYLES: Record<AdminUserStatus, string> = {
  ACTIVE: "bg-pine/8 text-pine border-pine/25",
  SUSPENDED: "bg-seal/8 text-seal border-seal/25",
  WITHDRAWN: "bg-muted text-muted-foreground border-border",
};



const PAGE_SIZE = 20;

export function AdminUsersScreen() {
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();
  const canWrite = hasPermission("users.write");

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<StatusFilter>("전체");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status]);

  const { data, isFetching } = useAdminUsers({
    status: status === "전체" ? undefined : status,
    q: debounced || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout
      title="사용자 관리"
      description="가입 회원의 이용 현황과 계정 상태를 관리합니다."

    >
      {/* 상태 필터 + 검색 */}
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
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="이름·이메일 검색"
            aria-label="회원 검색"
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-border placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs text-hint" aria-live="polite">
          {total}명
        </span>
      </div>

      <section
        className="bg-white border border-border transition-opacity"
        style={{ animation: "mg-fadein 0.3s ease-out both", opacity: isFetching ? 0.6 : 1 }}
      >
        {rows.length === 0 ? (
          <EmptyState
            title="조건에 맞는 회원이 없습니다"
            description="검색어나 상태 필터를 바꿔 보세요."
            action={
              <GhostButton
                onClick={() => {
                  setKeyword("");
                  setStatus("전체");
                }}
                className="px-5 py-2.5 text-xs"
              >
                필터 초기화
              </GhostButton>
            }
          />
        ) : (
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left">
                    <th scope="col" className="px-5 py-3 text-[13px] font-medium text-caption">이름</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption w-full">이메일</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">가입일</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">작명 요청</th>
                    <th scope="col" className="px-4 py-3 text-[13px] font-medium text-caption whitespace-nowrap text-center">상태</th>
                    <th scope="col" className="px-4 py-3 w-12 text-center">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <UserRow key={r.id} row={r} canWrite={canWrite} onOpenDetail={() => navigate(`/users/${r.id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
              aria-hidden="true"
            />
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-caption">
          <GhostButton
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5"
          >
            이전
          </GhostButton>
          <span>
            {page} / {totalPages}
          </span>
          <GhostButton
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5"
          >
            다음
          </GhostButton>
        </div>
      )}
    </AdminLayout>
  );
}

function UserRow({
  row,
  canWrite,
  onOpenDetail,
}: {
  row: AdminUserRow;
  canWrite: boolean;
  onOpenDetail: () => void;
}) {
  const updateStatus = useUpdateAdminUserStatus(row.id);

  const changeStatus = async (next: AdminUserStatus) => {
    try {
      await updateStatus.mutateAsync(next);
      toast.success(`회원 상태가 '${STATUS_LABEL[next]}'(으)로 변경되었습니다.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "상태 변경에 실패했습니다.";
      toast.error(message);
    }
  };

  return (
    <tr 
      className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
      onClick={onOpenDetail}
    >
      <td className="px-5 py-3.5 text-[13px] font-medium text-foreground whitespace-nowrap">
        <span className="hover:underline">{row.name}</span>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap">{row.email}</td>
      <td className="px-4 py-3.5 text-[13px] text-ink whitespace-nowrap tabular-nums text-center">
        {new Date(row.joinedAt).toLocaleDateString("ko-KR")}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-ink tabular-nums text-center">{row.requests}건</td>
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium border ${STATUS_STYLES[row.status]}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 flex items-center justify-center text-faint hover:text-foreground border border-transparent hover:border-border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                aria-label={`${row.name} 계정 작업 메뉴`}
              >
                <MoreHorizontal size={15} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none border-border min-w-[130px]">
              {(["ACTIVE", "SUSPENDED"] as AdminUserStatus[])
                .filter((s) => s !== row.status)
                .map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`text-xs cursor-pointer rounded-none ${
                      s === "SUSPENDED" ? "text-destructive focus:text-destructive" : ""
                    }`}
                  >
                    {s === "ACTIVE" ? "활성으로 전환" : "이용 정지"}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem onClick={onOpenDetail} className="text-xs cursor-pointer rounded-none">
                상세 보기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
