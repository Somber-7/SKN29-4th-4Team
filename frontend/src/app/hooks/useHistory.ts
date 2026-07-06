import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_HISTORY_ENTRIES, authApi } from "@/api/auth";

/** 작명 기록 — History · MyPage 화면 공용 (동일 query key로 캐시 공유) */
export function useHistory() {
  return useQuery({
    queryKey: ["me", "history"],
    queryFn: () => authApi.getHistory(),
    initialData: USE_MOCK ? MOCK_HISTORY_ENTRIES : undefined,
    staleTime: 60 * 1000,
  });
}
