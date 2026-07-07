// @ts-nocheck
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";
import { useAdminAuditLogs } from "@/app/hooks/useAdminStats";

const ACTIONS = ["", "VIEW_PII", "ROLE_CHANGE", "USER_UPDATE", "USER_DELETE", "APPROVE", "CONTENT", "LOGIN", "OTHER"];

export function AdminAuditLogScreen() {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({ action, actor, targetType, page, pageSize: 20 }),
    [action, actor, targetType, page],
  );
  const { data, isFetching } = useAdminAuditLogs(query);
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="감사 로그" description="관리자 행위와 PII 조회 이력을 추적합니다.">
      <section className="bg-white border border-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-label mb-1.5">행위</span>
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {ACTIONS.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "전체"}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="block text-xs font-medium text-label mb-1.5">관리자 ID</span>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-caption" aria-hidden="true" />
              <input
                value={actor}
                onChange={(event) => {
                  setActor(event.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="actor username"
              />
            </div>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-label mb-1.5">대상</span>
            <input
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="User, Post..."
            />
          </label>
        </div>
      </section>

      <section className="bg-white border border-border">
        {rows.length === 0 ? (
          <EmptyState title="감사 로그가 없습니다" description="조건을 바꾸거나 새로운 관리자 행위 후 다시 확인하세요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">시각</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">관리자</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">행위</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">대상</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">IP</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-caption">상세</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 text-xs text-ink whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{row.actorUsername || "-"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-primary">{row.action}</td>
                    <td className="px-4 py-3 text-xs text-ink">
                      {row.targetType || "-"} {row.targetId && `#${row.targetId}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink">{row.ip ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-ink max-w-sm truncate">
                      {JSON.stringify(row.detail ?? {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-caption">
            {isFetching ? "불러오는 중" : `총 ${total.toLocaleString()}건`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-border disabled:opacity-40"
            >
              이전
            </button>
            <span className="text-xs text-caption tabular-nums">
              {page} / {maxPage}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(maxPage, prev + 1))}
              disabled={page >= maxPage}
              className="px-3 py-1.5 text-xs border border-border disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
