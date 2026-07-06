import type { SourceType } from "@/app/types";

const SOURCE_STYLES: Record<SourceType, string> = {
  hanja: "bg-hanji text-primary border-border-warm",
  suri: "bg-hanji text-gold-text border-gold-border/30",
  beopryeong: "bg-pine/8 text-pine border-pine/25",
  nonmun: "bg-seal/8 text-seal border-seal/25",
};

export function SourceChip({ type, label, className = "" }: { type: SourceType; label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-medium border rounded-md transition-colors ${SOURCE_STYLES[type]} ${className}`}
    >
      {label}
    </span>
  );
}
