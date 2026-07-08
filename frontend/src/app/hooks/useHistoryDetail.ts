import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

/** 작명 기록 상세 — "결과 다시 보기" 전용. 재생성 없이 저장된 결과를 그대로 가져온다. */
export function useHistoryDetail(id: number) {
  return useQuery({
    queryKey: ["me", "history", id],
    queryFn: () => authApi.getHistoryDetail(id),
    staleTime: 60 * 1000,
  });
}
