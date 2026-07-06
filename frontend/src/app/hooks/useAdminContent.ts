import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_ADMIN_CONTENT, adminApi } from "@/api/admin";

/** 관리자 콘텐츠 관리 — 인명용 한자 · 근거 출처 초기 목록 */
export function useAdminContent() {
  return useQuery({
    queryKey: ["admin", "content"],
    queryFn: () => adminApi.getContent(),
    initialData: USE_MOCK ? MOCK_ADMIN_CONTENT : undefined,
    staleTime: 30 * 1000,
  });
}
