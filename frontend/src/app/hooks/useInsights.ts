import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_INSIGHTS_BUNDLE, insightsApi } from "@/api/insights";

/** 이름 트렌드(인사이트) 화면 데이터 번들 */
export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => insightsApi.getBundle(),
    initialData: USE_MOCK ? MOCK_INSIGHTS_BUNDLE : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
