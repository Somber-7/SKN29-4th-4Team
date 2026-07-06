// TODO(API): 서버 NLU 결과로 대체 — 현재는 규칙 기반 미리보기
// ─── 자연어 작명 조건 실시간 파서 (프론트 데모용 규칙 기반) ─────────────────
// 사용자가 입력창에 타이핑하는 즉시 성씨·오행·획수·의미·성별·글자수를
// 규칙(정규식+사전) 기반으로 추출해 UI에 미리보기로 점등시킨다.
// 결과 조회(useNameResults)는 이 파서를 거치지 않으며, parseNameQuery는
// InputScreen의 자연어 입력 미리보기 칩 용도로만 쓰인다.
// TODO: API 연동 — 정식 버전에서는 서버 NLU 결과로 대체

export interface ParsedQuery {
  /** 성씨 한 글자 (예: "김") */
  lastName: string | null;
  /** 감지된 오행 한자 목록 (예: ["水", "木"]) */
  elements: string[];
  /** 획수 조건 문자열 (예: "20~25획", "12획") */
  strokeRange: string | null;
  /** 의미 키워드 (예: ["총명", "건강"]) */
  meanings: string[];
  /** 성별 */
  gender: "남자" | "여자" | null;
  /** 글자 수 (예: "두 글자") */
  nameLength: string | null;
  /** 인식된 조건 카테고리 수 (0~6) */
  count: number;
}

const EMPTY_PARSED: ParsedQuery = {
  lastName: null,
  elements: [],
  strokeRange: null,
  meanings: [],
  gender: null,
  nameLength: null,
  count: 0,
};

/** 오행 표기 사전 — 한자 / 한글 음 / 순우리말 */
const ELEMENT_DEFS: { hanja: string; ko: string; word: string }[] = [
  { hanja: "木", ko: "목", word: "나무" },
  { hanja: "火", ko: "화", word: "불" },
  { hanja: "土", ko: "토", word: "흙" },
  { hanja: "金", ko: "금", word: "쇠" },
  { hanja: "水", ko: "수", word: "물" },
];

/** 자주 쓰이는 의미 키워드 사전 (부분 일치) */
const MEANING_KEYWORDS = [
  "총명",
  "지혜",
  "슬기",
  "건강",
  "학문",
  "공부",
  "용기",
  "성실",
  "정직",
  "리더",
  "밝은",
  "밝게",
  "빛",
  "따뜻",
  "평안",
  "행복",
  "강건",
  "씩씩",
  "재물",
  "장수",
  "효심",
  "인품",
  "우아",
  "고운",
  "넓은 기상",
  "큰 뜻",
];

/** 대표 한국 성씨 (오탐 방지용 화이트리스트) */
const COMMON_SURNAMES =
  "김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제탁국어은편용예경봉사부가복태목형피두감호제갈남궁선우독고황보";

/** 자연어 문장에서 작명 조건을 추출한다 */
export function parseNameQuery(raw: string): ParsedQuery {
  const src = raw.trim();
  if (!src) return EMPTY_PARSED;

  // ── 성씨: "김씨", "김 씨 성", "성은 김", "성씨는 김" ──
  let lastName: string | null = null;
  const surnameBySsi = src.match(/([가-힣])\s*씨/);
  if (surnameBySsi && COMMON_SURNAMES.includes(surnameBySsi[1])) {
    lastName = surnameBySsi[1];
  }
  if (!lastName) {
    const surnameByLabel = src.match(/성(?:씨)?[은는이가]?\s*([가-힣])(?=[\s,.·]|$)/);
    if (surnameByLabel && COMMON_SURNAMES.includes(surnameByLabel[1])) {
      lastName = surnameByLabel[1];
    }
  }

  // ── 오행: 한자 직접 표기 / "물 기운" / "목·화" / "수(水)" ──
  const elements: string[] = [];
  for (const def of ELEMENT_DEFS) {
    const detected =
      src.includes(def.hanja) ||
      // 순우리말 + 기운/오행 (예: "물 기운", "불 오행")
      new RegExp(`${def.word}\\s*(기운|오행)`).test(src) ||
      // 한글 음이 나열(·,/)되거나 오행/기운/행 앞에 오는 경우 (예: "토·목 오행", "수 기운")
      new RegExp(`(^|[^가-힣])${def.ko}(\\s*[·,/]|\\s*(오행|기운|행(?![가-힣])))`).test(src);
    if (detected) elements.push(def.hanja);
  }

  // ── 획수: "획수 20~25", "20~25획", "12획" ──
  let strokeRange: string | null = null;
  const rangeAfterLabel = src.match(/획수(?:\s*합)?[^0-9]{0,4}(\d{1,2})\s*[~∼\-–]\s*(\d{1,2})/);
  const rangeBeforeUnit = src.match(/(\d{1,2})\s*[~∼\-–]\s*(\d{1,2})\s*획/);
  const singleStroke = src.match(/(\d{1,2})\s*획(?!수)/);
  if (rangeAfterLabel) strokeRange = `${rangeAfterLabel[1]}~${rangeAfterLabel[2]}획`;
  else if (rangeBeforeUnit) strokeRange = `${rangeBeforeUnit[1]}~${rangeBeforeUnit[2]}획`;
  else if (singleStroke) strokeRange = `${singleStroke[1]}획`;

  // ── 의미 키워드 ──
  const meanings = MEANING_KEYWORDS.filter((k) => src.includes(k)).slice(0, 4);

  // ── 성별 ──
  let gender: ParsedQuery["gender"] = null;
  if (/남자|사내|아들|남아/.test(src)) gender = "남자";
  else if (/여자|딸|여아/.test(src)) gender = "여자";

  // ── 글자 수 ──
  const lengthMatch = src.match(/(한|두|세)\s*글자/);
  const nameLength = lengthMatch ? `${lengthMatch[1]} 글자` : null;

  const count =
    (lastName ? 1 : 0) +
    (elements.length > 0 ? 1 : 0) +
    (strokeRange ? 1 : 0) +
    (meanings.length > 0 ? 1 : 0) +
    (gender ? 1 : 0) +
    (nameLength ? 1 : 0);

  return { lastName, elements, strokeRange, meanings, gender, nameLength, count };
}

/** 오행 한자 → "水(수)" 형태 라벨 */
export function elementLabel(hanja: string): string {
  const def = ELEMENT_DEFS.find((d) => d.hanja === hanja);
  return def ? `${def.hanja}(${def.ko})` : hanja;
}

/**
 * NameRequest → ParsedChipRow 표시용 ParsedQuery 변환.
 * 자연어 모드는 parseNameQuery로, 상세조건 모드는 이미 구조화된 값을 그대로 옮겨
 * 담을 뿐 문장 재조립·재파싱을 거치지 않는다 (표시 전용 유틸).
 */
export function nameRequestToParsedQuery(request: {
  type: "natural" | "structured";
  query?: string;
  lastName?: string;
  gender?: "남자" | "여자";
  elements?: string[];
  strokeRange?: string;
  meaning?: string;
}): ParsedQuery {
  if (request.type === "natural") return parseNameQuery(request.query ?? "");

  const lastName = request.lastName?.trim().charAt(0) || null;
  const elements = request.elements ?? [];
  const meanings = request.meaning ? [request.meaning] : [];
  const strokeRange = request.strokeRange || null;
  const gender = request.gender ?? null;

  const count =
    (lastName ? 1 : 0) +
    (elements.length > 0 ? 1 : 0) +
    (strokeRange ? 1 : 0) +
    (meanings.length > 0 ? 1 : 0) +
    (gender ? 1 : 0);

  return { lastName, elements, strokeRange, meanings, gender, nameLength: null, count };
}
