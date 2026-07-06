import { elementLabel, type ParsedQuery } from "@/app/utils/nameQueryParser";

// ─── 자연어에서 인식된 작명 조건 칩 (입력·결과 화면 공용) ────────────────────

const CHIP_STYLES = {
  lastName: "text-gold-text bg-hanji border-gold-border/30",
  element: "text-gold-text bg-hanji border-gold-border/30",
  strokes: "text-gold-text bg-hanji border-gold-border/30",
  meaning: "text-pine bg-pine/8 border-pine/25",
  etc: "text-ink bg-hanji border-border",
};

export function ParsedChip({
  tone,
  children,
}: {
  tone: keyof typeof CHIP_STYLES;
  children: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${CHIP_STYLES[tone]}`}
      style={{ animation: "mg-fadein 0.25s ease-out both" }}
    >
      {children}
    </span>
  );
}

export function ParsedChipRow({
  parsed,
  label = "인식된 조건",
  emptyText = "입력하시면 성씨·오행·획수·의미를 자동으로 인식합니다",
}: {
  parsed: ParsedQuery;
  /** 앞머리 라벨 (null 전달 시 숨김) */
  label?: string | null;
  emptyText?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]" aria-live="polite">
      {label && (
        <span className="text-[10px] font-bold tracking-wider text-caption uppercase mr-0.5">
          {label}
        </span>
      )}
      {parsed.count === 0 ? (
        <span className="text-[11px] text-faint">{emptyText}</span>
      ) : (
        <>
          {parsed.lastName && <ParsedChip tone="lastName">{`# 성씨: ${parsed.lastName}`}</ParsedChip>}
          {parsed.elements.map((el) => (
            <ParsedChip key={el} tone="element">{`# 오행: ${elementLabel(el)}`}</ParsedChip>
          ))}
          {parsed.strokeRange && <ParsedChip tone="strokes">{`# 획수: ${parsed.strokeRange}`}</ParsedChip>}
          {parsed.meanings.length > 0 && (
            <ParsedChip tone="meaning">{`# 뜻: ${parsed.meanings.join(", ")}`}</ParsedChip>
          )}
          {parsed.gender && <ParsedChip tone="etc">{`# ${parsed.gender} 이름`}</ParsedChip>}
          {parsed.nameLength && <ParsedChip tone="etc">{`# ${parsed.nameLength}`}</ParsedChip>}
        </>
      )}
    </div>
  );
}
