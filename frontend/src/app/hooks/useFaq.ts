import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { MOCK_FAQ_BUNDLE, supportApi } from "@/api/support";

/** 고객센터 FAQ 목록 + 카테고리 라벨 */
export function useFaq() {
  return useQuery({
    queryKey: ["support", "faq"],
    queryFn: () => supportApi.getFaq(),
    initialData: USE_MOCK ? MOCK_FAQ_BUNDLE : undefined,
    staleTime: 60 * 1000,
  });
}
