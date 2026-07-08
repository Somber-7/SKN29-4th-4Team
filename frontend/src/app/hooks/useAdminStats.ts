// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AdminAuditLogsQuery, type AdminStatsQuery } from "@/api/admin";

export function useAdminStats(query: AdminStatsQuery = {}) {
  return useQuery({
    queryKey: ["admin", "stats", query],
    queryFn: () => adminApi.getStats(query),
    staleTime: 30 * 1000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminApi.getHealth(),
    staleTime: 30 * 1000,
  });
}

export function useAdminAuditLogs(query: AdminAuditLogsQuery) {
  return useQuery({
    queryKey: ["admin", "audit-logs", query],
    queryFn: () => adminApi.listAuditLogs(query),
    placeholderData: (previous) => previous,
    staleTime: 15 * 1000,
  });
}
