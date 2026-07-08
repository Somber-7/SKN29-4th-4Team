import { useQuery } from "@tanstack/react-query";
import { insightsApi } from "@/api/insights";

/** 이름 트렌드(인사이트) 화면 데이터 번들 */
export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => insightsApi.getBundle(),
    staleTime: 5 * 60 * 1000,
  });
}

