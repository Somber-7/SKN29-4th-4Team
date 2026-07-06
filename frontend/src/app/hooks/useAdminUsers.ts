import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_ADMIN_USERS, adminApi } from "@/api/admin";

/** 관리자 사용자 관리 초기 목록 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.getUsers(),
    initialData: USE_MOCK ? MOCK_ADMIN_USERS : undefined,
    staleTime: 30 * 1000,
  });
}
