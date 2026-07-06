import type { SourceType } from "@/app/types";

const SOURCE_STYLES: Record<SourceType, string> = {
  hanja: "bg-hanji text-primary border-border-warm",
  suri: "bg-hanji text-gold-text border-gold-border/30",
  beopryeong: "bg-pine/8 text-pine border-pine/25",
  nonmun: "bg-seal/8 text-seal border-seal/25",
};

export function SourceChip({ type, label }: { type: SourceType; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border ${SOURCE_STYLES[type]}`}
    >
      {label}
    </span>
  );
}
