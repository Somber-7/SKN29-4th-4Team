// ─── 작명 생성 도메인 API (FastAPI + Neo4j 예정) ───────────────────────────────
// TODO(API): POST /naming-api/names/generate — 서버가 NameRequest(자연어/상세조건)를 받아
// Neo4j 기반 추천 결과를 반환한다. 지금은 mock 어댑터가 기존 화면 동작을 그대로 재현한다.

import { USE_MOCK_NAMES, mockDelay, namingApiClient } from "./client";
import { parseNameQuery } from "@/app/utils/nameQueryParser";
import type { NameRequest, NameResult } from "@/app/types";
import { LAST_NAMES, NAME_RESULTS, SAMPLE_PREVIEW_RESULTS } from "./mock/names.mock";

export interface NamesApi {
  /** 작명 조건(자연어/상세조건)으로 추천 결과를 생성한다 (Results 화면) */
  generate(request: NameRequest): Promise<NameResult[]>;
  /** 랜딩 화면의 샘플 미리보기 카드 */
  getSamplePreview(): Promise<NameResult[]>;
}

/**
 * mock 모드 전용 — NameRequest에서 성씨 한 글자를 추출한다.
 * 자연어 모드는 parseNameQuery(NLU 대역)로, 상세조건 모드는 입력값 첫 글자를 그대로 사용한다.
 * TODO(API): 실 서버(FastAPI+Neo4j)가 자연어 NLU와 성씨 매칭을 전담하면 이 함수는 제거된다.
 */
export function extractLastNameCharMock(request: NameRequest): string | null {
  if (request.type === "natural") return parseNameQuery(request.query).lastName;
  return request.lastName.trim().charAt(0) || null;
}

/** mock 모드에서 initialData로도 재사용하는 순수 계산 함수 — 성씨 반영 치환 로직 */
export function computeMockNameResults(request: NameRequest): NameResult[] {
  const lastNameChar = extractLastNameCharMock(request);
  const ln = lastNameChar ? LAST_NAMES[lastNameChar as keyof typeof LAST_NAMES] : undefined;
  return ln ? NAME_RESULTS.map((r) => ({ ...r, lastName: ln })) : NAME_RESULTS;
}

const mockAdapter: NamesApi = {
  generate: (request) => mockDelay(computeMockNameResults(request), 0),
  getSamplePreview: () => mockDelay(SAMPLE_PREVIEW_RESULTS, 0),
};

const realAdapter: NamesApi = {
  generate: (request) => namingApiClient.post<NameResult[]>("/names/generate", request),
  getSamplePreview: () => namingApiClient.get<NameResult[]>("/names/sample-preview"),
};

export const namesApi: NamesApi = USE_MOCK_NAMES ? mockAdapter : realAdapter;

/** mock 모드에서 useSamplePreviewNames 훅의 initialData로 재사용 */
export const MOCK_SAMPLE_PREVIEW_RESULTS = SAMPLE_PREVIEW_RESULTS;

/**
 * mock 모드 전용 — 인식된 성씨가 예시 사전에 있는지 여부 (Results 화면의 "시안 단계" 안내용).
 * TODO(API): 실 서버는 모든 성씨를 지원하므로 연동 후 이 안내 자체가 불필요해진다.
 */
export function isKnownLastNameMock(lastName: string | null): boolean {
  return !!lastName && lastName in LAST_NAMES;
}
