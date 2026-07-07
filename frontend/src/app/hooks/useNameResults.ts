import { useQuery } from "@tanstack/react-query";
import { USE_MOCK_NAMES } from "@/api/client";
import { computeMockNameResults, namesApi } from "@/api/names";
import type { NameRequest } from "@/app/types";

/**
 * 입력한 작명 조건(자연어/상세조건)으로 추천 결과를 조회한다.
 * ProcessingScreen과 ResultsScreen이 같은 queryKey로 호출해 fetch를 공유한다
 * (ProcessingScreen이 먼저 마운트되어 실 응답을 받아두면 ResultsScreen은 캐시를 즉시 사용).
 * enabled=false면 요청을 보내지 않는다 (request가 아직 없을 때 방어용).
 */
export function useNameResults(request: NameRequest, enabled = true) {
  return useQuery({
    queryKey: ["names", "generate", request],
    queryFn: () => namesApi.generate(request),
    enabled,
    // mock 모드에서는 화면 자체의 스트리밍 연출(STREAMING_DURATION_MS)이 있으므로
    // 데이터 자체는 동기적으로 즉시 준비되어야 기존 동작과 동일하다.
    initialData: USE_MOCK_NAMES ? () => computeMockNameResults(request) : undefined,
    staleTime: Infinity,
  });
}
