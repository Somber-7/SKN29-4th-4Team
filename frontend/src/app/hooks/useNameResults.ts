import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/api/client";
import { computeMockNameResults, namesApi } from "@/api/names";
import type { NameRequest } from "@/app/types";

/** 입력한 작명 조건(자연어/상세조건)으로 추천 결과를 조회한다 (Results 화면) */
export function useNameResults(request: NameRequest) {
  return useQuery({
    queryKey: ["names", "generate", request],
    queryFn: () => namesApi.generate(request),
    // mock 모드에서는 화면 자체의 스트리밍 연출(STREAMING_DURATION_MS)이 있으므로
    // 데이터 자체는 동기적으로 즉시 준비되어야 기존 동작과 동일하다.
    initialData: USE_MOCK ? () => computeMockNameResults(request) : undefined,
    staleTime: Infinity,
  });
}
