import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";

export function useAdminActiveUsers() {
  return useQuery({
    queryKey: ["admin", "activeUsers"],
    queryFn: () => adminApi.getActiveUsers(),
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });
}

export function useAdminApiUsageStats(query?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["admin", "apiUsageStats", query],
    queryFn: () => adminApi.getApiUsageStats(query),
    staleTime: 30 * 1000,
  });
}

export function useAdminApiErrorLogs() {
  return useQuery({
    queryKey: ["admin", "apiErrorLogs"],
    queryFn: () => adminApi.getApiErrorLogs(),
    staleTime: 30 * 1000,
  });
}

