import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_ADMIN_DASHBOARD, adminApi } from "@/api/admin";

/** 관리자 대시보드 통계·차트·최근 요청 목록 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard(),
    initialData: USE_MOCK ? MOCK_ADMIN_DASHBOARD : undefined,
    staleTime: 30 * 1000,
  });
}
