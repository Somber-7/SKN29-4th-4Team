import { useEffect, useMemo, useState } from "react";
import { parseNameQuery } from "@/app/utils/nameQueryParser";
import { ParsedChipRow } from "@/app/components/common/ParsedChips";
import { PrimaryButton } from "@/app/components/common/Button";
import type { NameRequest } from "@/app/types";

const PROMPT_CHIPS = [
  "김씨 성, 水 기운 두 글자 남자 이름",
  "이씨 성, 土·木 오행, 학문에 좋은 이름",
  "박씨 성, 획수 합 20~25, 여자 이름",
];

/** 자연어로 조건을 설명하는 입력 폼 — 상태를 내부로 캡슐화하고 NameRequest만 상위로 전달한다 */
export function NaturalInputForm({
  active,
  onSubmit,
}: {
  /** 현재 탭이 활성 상태인지 — 비활성화될 때 에러 표시를 초기화한다 (기존 switchMode 동작과 동일) */
  active: boolean;
  onSubmit: (request: NameRequest) => void;
}) {
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState("");

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
    setQueryError("");
    onSubmit({ type: "natural", query: query.trim() });
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
          placeholder="예: 김씨 성에 물(水) 기운, 획수 좋은 두 글자 남자 이름 추천해줘"
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
          {PROMPT_CHIPS.map((chip, i) => (
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
