import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_NAMES } from "@/api/client";
import { MOCK_SAMPLE_PREVIEW_RESULTS, namesApi } from "@/api/names";

/** 랜딩 화면의 샘플 결과 미리보기 카드 */
export function useSamplePreviewNames() {
  return useQuery({
    queryKey: ["names", "samplePreview"],
    queryFn: () => namesApi.getSamplePreview(),
    initialData: USE_MOCK_NAMES ? MOCK_SAMPLE_PREVIEW_RESULTS : undefined,
    staleTime: Infinity,
  });
}
