import { useEffect, useMemo, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { AdminUserRow, Screen } from "@/app/types";
import { useAdminUsers } from "@/app/hooks/useAdminUsers";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { GhostButton } from "@/app/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type StatusFilter = "전체" | AdminUserRow["status"];
const STATUS_FILTERS: StatusFilter[] = ["전체", "활성", "휴면", "정지"];

const STATUS_STYLES: Record<AdminUserRow["status"], string> = {
  활성: "bg-pine/8 text-pine border-pine/25",
  휴면: "bg-muted text-muted-foreground border-border",
  정지: "bg-seal/8 text-seal border-seal/25",
};

export function AdminUsersScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { data: initialUsers } = useAdminUsers();
  const [rows, setRows] = useState<AdminUserRow[]>(initialUsers ?? []);
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<StatusFilter>("전체");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => clearTimeout(t);
  }, [keyword]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (status !== "전체" && r.status !== status) return false;
        if (!debounced) return true;
        return r.name.includes(debounced) || r.email.includes(debounced);
      }),
    [rows, debounced, status],
  );

  const changeStatus = (id: number, next: AdminUserRow["status"]) => {
    // TODO: API 연동
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    toast.success(`회원 상태가 '${next}'(으)로 변경되었습니다.`);
  };

  return (
    <AdminLayout
      active="adminUsers"
      title="사용자 관리"
      description="가입 회원의 이용 현황과 계정 상태를 관리합니다."
      onNavigate={onNavigate}
    >
      {/* 상태 필터 + 검색 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            aria-pressed={status === f}
            className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              status === f
                ? "bg-foreground text-background border-foreground"
                : "bg-white text-label border-border hover:border-primary hover:text-primary"
            }`}
          >
            {f}
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
          {filtered.length}명
        </span>
      </div>

      <section className="bg-white border border-border" style={{ animation: "mg-fadein 0.3s ease-out both" }}>
        {filtered.length === 0 ? (
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
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left">
                    <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption">이름</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption w-full">이메일</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">가입일</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">작명 요청</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">저장 이름</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption">상태</th>
                    <th scope="col" className="px-4 py-2.5 w-12">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150"
                    >
                      <td className="px-5 py-3 text-xs font-medium text-foreground whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-xs text-ink whitespace-nowrap">{r.email}</td>
                      <td className="px-4 py-3 text-xs text-ink whitespace-nowrap tabular-nums">{r.joinedAt}</td>
                      <td className="px-4 py-3 text-xs text-ink tabular-nums">{r.requests}건</td>
                      <td className="px-4 py-3 text-xs text-ink tabular-nums">{r.saved}개</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium border ${STATUS_STYLES[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-8 h-8 flex items-center justify-center text-faint hover:text-foreground border border-transparent hover:border-border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                              aria-label={`${r.name} 계정 작업 메뉴`}
                            >
                              <MoreHorizontal size={15} aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none border-border min-w-[130px]">
                            {(["활성", "휴면", "정지"] as AdminUserRow["status"][])
                              .filter((s) => s !== r.status)
                              .map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => changeStatus(r.id, s)}
                                  className={`text-xs cursor-pointer rounded-none ${
                                    s === "정지" ? "text-destructive focus:text-destructive" : ""
                                  }`}
                                >
                                  {s === "활성" ? "활성으로 전환" : s === "휴면" ? "휴면 처리" : "이용 정지"}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
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
    </AdminLayout>
  );
}
