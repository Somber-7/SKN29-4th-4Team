import type { NameRequest } from "@/app/types";

// ─── NameRequest → 표시용 문자열 (Processing/Results 화면 "입력한 조건" 표시 전용) ──
// 자연어 모드는 사용자가 입력한 문장을 그대로, 상세조건 모드는 이전 InputScreen이
// 하던 "한국어 문장 재조립"과 동일한 형식으로 조합한다. 오직 화면 표시용이며,
// 결과 조회(useNameResults)는 이 문자열을 다시 파싱하지 않고 NameRequest를 그대로 사용한다.

/** 상세조건 오행 한자 → 원래 InputScreen 버튼에 쓰이던 "한글(한자)" 표기 (elementLabel과 순서가 다르므로 별도 유지) */
const STRUCTURED_ELEMENT_LABELS: Record<string, string> = {
  木: "목(木)",
  火: "화(火)",
  土: "토(土)",
  金: "금(金)",
  水: "수(水)",
};

export function formatNameRequest(request: NameRequest): string {
  if (request.type === "natural") return request.query;

  const { lastName, gender, elements, strokeRange, meaning } = request;
  return (
    [
      `${lastName}씨 성`,
      gender ? `${gender} 이름` : "",
      elements && elements.length > 0
        ? `${elements.map((el) => STRUCTURED_ELEMENT_LABELS[el] ?? el).join("·")} 오행`
        : "",
      strokeRange ? `획수 ${strokeRange}` : "",
      meaning ? `뜻: ${meaning}` : "",
    ]
      .filter(Boolean)
      .join(", ") + " 이름 추천"
  );
}
