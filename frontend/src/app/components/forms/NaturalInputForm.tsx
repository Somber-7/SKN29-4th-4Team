import { useEffect, useMemo, useState } from "react";
import { parseNameQuery } from "@/app/utils/nameQueryParser";
import { ParsedChipRow } from "@/app/components/common/ParsedChips";
import { PrimaryButton } from "@/app/components/common/Button";
import type { NameRequest, NameType } from "@/app/types";

// 칩은 제출 전 검증(성씨·성별 필수)을 통과하는 완성형 예시여야 한다
const HANJA_PROMPT_CHIPS = [
  "김씨 성, 水 기운 두 글자 남자 이름",
  "이씨 성, 土·木 오행, 학문에 좋은 아들 이름",
  "박씨 성, 획수 합 20~25, 여자 이름",
];

const KOREAN_PROMPT_CHIPS = [
  "임씨 성, 맑고 씩씩한 느낌의 순우리말 여자 이름",
  "최씨 성, 봄처럼 따뜻한 느낌의 순우리말 아들 이름",
  "한씨 성, 한 글자 순우리말 딸 이름",
];

const PLACEHOLDER_BY_TYPE: Record<NameType, string> = {
  hanja: "예: 김씨 성에 물(水) 기운, 획수 좋은 두 글자 남자 이름 추천해줘",
  korean: "예: 임씨 성에 맑고 씩씩한 느낌의 순우리말 두 글자 여자 이름 추천해줘",
};

/** 자연어로 조건을 설명하는 입력 폼 — 상태를 내부로 캡슐화하고 NameRequest만 상위로 전달한다 */
export function NaturalInputForm({
  active,
  nameType,
  onSubmit,
}: {
  /** 현재 탭이 활성 상태인지 — 비활성화될 때 에러 표시를 초기화한다 (기존 switchMode 동작과 동일) */
  active: boolean;
  /** 상위(InputScreen)의 이름 유형 탭 선택 — 예시 문구와 요청 페이로드에 반영한다 */
  nameType: NameType;
  onSubmit: (request: NameRequest) => void;
}) {
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState("");
  const promptChips = nameType === "korean" ? KOREAN_PROMPT_CHIPS : HANJA_PROMPT_CHIPS;

  // 자연어 입력 즉시 조건 파싱 — 입력창 아래 칩에 실시간 반영 (미리보기 전용, 결과 조회에는 사용하지 않음)
  const parsed = useMemo(() => parseNameQuery(query), [query]);

  // 탭 전환 시 에러 표시 초기화 (기존 switchMode의 setQueryError("") 동작과 동일)
  useEffect(() => {
    setQueryError("");
  }, [active]);

  const handleSubmit = () => {
    if (!query.trim()) {
      setQueryError("어떤 이름을 원하시는지 설명해 주세요.");
      return;
    }
    // 서버가 반문(clarify) 없이 바로 결과를 내도록 필수 조건을 제출 전에 확인한다.
    // parsed는 입력 즉시 갱신되는 미리보기 칩과 동일한 파싱 결과다.
    if (!parsed.lastName) {
      setQueryError("성씨를 포함해 주세요. 예: 김씨 딸에게 어울리는 밝은 이름");
      return;
    }
    if (!parsed.gender) {
      setQueryError("성별(아들/딸)을 포함해 주세요. 예: 김씨 딸에게 어울리는 밝은 이름");
      return;
    }
    setQueryError("");
    onSubmit({ type: "natural", nameType, query: query.trim() });
  };

  return (
    <div
      className={`col-start-1 row-start-1 transition-opacity duration-150 ${
        active ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`border bg-hanji/40 focus-within:bg-white rounded-2xl transition-all duration-300 ${
          queryError
            ? "border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : "border-border-warm focus-within:border-gold-border focus-within:ring-4 focus-within:ring-gold-border/10"
        }`}
      >
        <textarea
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (queryError) setQueryError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={PLACEHOLDER_BY_TYPE[nameType]}
          rows={4}
          maxLength={300}
          aria-invalid={!!queryError}
          className="w-full px-4 py-3 text-sm sm:text-base text-foreground placeholder-faint bg-transparent resize-none focus:outline-none break-keep leading-relaxed"
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-warm/60 bg-hanji/30">
          <span className="text-[11px] text-caption font-medium">
            Enter 제출 · Shift+Enter 줄바꿈
          </span>
          <span className="text-[11px] text-caption font-medium">{query.length}/300</span>
        </div>
      </div>
      {queryError && (
        <p role="alert" className="text-xs text-destructive mt-1.5 pl-1">
          {queryError}
        </p>
      )}

      {/* 실시간 인식 조건 칩 — 타이핑 즉시 점등 */}
      <div className="mt-4 px-1">
        <ParsedChipRow parsed={parsed} />
      </div>

      {/* Bottom Row: Prompt chips & Submit button placed side-by-side to save vertical height */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-border-warm/40">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {promptChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(chip);
                setQueryError("");
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-ink hover:text-gold-text bg-hanji/60 hover:bg-hanji border border-border-warm hover:border-gold-border rounded-full transition-all duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
            >
              • {chip}
            </button>
          ))}
        </div>
        <PrimaryButton onClick={handleSubmit} className="px-7 py-3 text-sm shadow-[0_8px_18px_rgba(46,30,8,0.15)] hover:shadow-[0_12px_24px_rgba(176,144,96,0.25)] shrink-0 self-end sm:self-auto">
          이름 추천 받기 →
        </PrimaryButton>
      </div>
    </div>
  );
}
