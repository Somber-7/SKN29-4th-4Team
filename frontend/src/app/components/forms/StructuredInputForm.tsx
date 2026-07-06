import { useEffect, useState } from "react";
import { PrimaryButton } from "@/app/components/common/Button";
import type { NameRequest } from "@/app/types";

/** 오행 토글 버튼 — 표시 라벨은 기존 InputScreen과 동일한 "한글(한자)" 순서 */
const ELEMENT_OPTIONS: { hanja: string; label: string }[] = [
  { hanja: "木", label: "목(木)" },
  { hanja: "火", label: "화(火)" },
  { hanja: "土", label: "토(土)" },
  { hanja: "金", label: "금(金)" },
  { hanja: "水", label: "수(水)" },
];

/** 상세 조건(성씨·성별·오행·획수·뜻)을 항목별로 입력하는 폼 — 상태를 내부로 캡슐화하고 NameRequest만 상위로 전달한다 */
export function StructuredInputForm({
  active,
  onSubmit,
}: {
  /** 현재 탭이 활성 상태인지 — 비활성화될 때 에러 표시를 초기화한다 (기존 switchMode 동작과 동일) */
  active: boolean;
  onSubmit: (request: NameRequest) => void;
}) {
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"" | "남자" | "여자">("");
  const [elements, setElements] = useState<string[]>([]);
  const [strokeRange, setStrokeRange] = useState("");
  const [meaning, setMeaning] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  // 탭 전환 시 에러 표시 초기화 (기존 switchMode의 setLastNameError("") 동작과 동일)
  useEffect(() => {
    setLastNameError("");
  }, [active]);

  const toggleElement = (hanja: string) =>
    setElements((prev) => (prev.includes(hanja) ? prev.filter((e) => e !== hanja) : [...prev, hanja]));

  const toggleGender = (g: "남자" | "여자") => setGender((prev) => (prev === g ? "" : g));

  const handleSubmit = () => {
    if (!lastName.trim()) {
      setLastNameError("성씨를 입력해 주세요.");
      return;
    }
    setLastNameError("");
    onSubmit({
      type: "structured",
      lastName: lastName.trim(),
      gender: gender || undefined,
      elements: elements.length > 0 ? elements : undefined,
      strokeRange: strokeRange || undefined,
      meaning: meaning || undefined,
    });
  };

  return (
    <div
      className={`col-start-1 row-start-1 flex flex-col h-full space-y-4 text-left transition-opacity duration-150 ${
        active ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      }`}
    >
      {/* Last name + gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            성씨{" "}
            <span className="text-destructive font-bold" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setLastNameError("");
            }}
            placeholder="예: 김, 이, 박"
            aria-required="true"
            aria-invalid={!!lastNameError}
            className={`w-full px-3.5 py-2.5 text-sm border bg-white rounded-xl focus:outline-none transition-all ${
              lastNameError
                ? "border-destructive focus:ring-2 focus:ring-destructive/20"
                : "border-border-warm focus:ring-4 focus:ring-gold-border/10 focus:border-gold-border"
            }`}
          />
          {lastNameError && (
            <p role="alert" className="text-xs text-destructive mt-1 pl-1">
              {lastNameError}
            </p>
          )}
        </div>

        {/* Gender single-select */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">성별</label>
          <div className="flex flex-wrap gap-2">
            {(["남자", "여자"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGender(g)}
                aria-pressed={gender === g}
                className={`flex-1 px-3.5 py-2.5 text-xs font-semibold border rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
                  gender === g
                    ? "bg-primary text-white border-primary shadow-sm hover:opacity-95"
                    : "border-border-warm text-ink bg-white hover:border-gold-border hover:text-gold-text"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Five elements multi-select */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">오행 선호</label>
        <div className="flex flex-wrap gap-2">
          {ELEMENT_OPTIONS.map((el) => (
            <button
              key={el.hanja}
              onClick={() => toggleElement(el.hanja)}
              aria-pressed={elements.includes(el.hanja)}
              className={`font-hanja px-3.5 py-2 text-xs font-semibold border rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
                elements.includes(el.hanja)
                  ? "bg-primary text-white border-primary shadow-sm hover:opacity-95"
                  : "border-border-warm text-ink bg-white hover:border-gold-border hover:text-gold-text"
              }`}
            >
              {el.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke range + meaning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">획수 범위</label>
          <input
            type="text"
            value={strokeRange}
            onChange={(e) => setStrokeRange(e.target.value)}
            placeholder="예: 20~25"
            className="w-full px-3.5 py-2 text-sm border border-border-warm bg-white rounded-xl focus:outline-none focus:ring-4 focus:ring-gold-border/10 focus:border-gold-border transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">뜻/의미 키워드</label>
          <input
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="예: 지혜, 빛, 강건함"
            className="w-full px-3.5 py-2 text-sm border border-border-warm bg-white rounded-xl focus:outline-none focus:ring-4 focus:ring-gold-border/10 focus:border-gold-border transition-all"
          />
        </div>
      </div>

      {/* Bottom Row: Submit button inside card to save vertical height — pinned to the
          bottom via mt-auto so it lines up with the natural-language panel's button
          even when the structured fields don't fill the full (height-matched) card. */}
      <div className="flex justify-end mt-auto pt-4 border-t border-border-warm/40">
        <PrimaryButton onClick={handleSubmit} className="px-7 py-3 text-sm shadow-[0_8px_18px_rgba(46,30,8,0.15)] hover:shadow-[0_12px_24px_rgba(176,144,96,0.25)]">
          이름 추천 받기 →
        </PrimaryButton>
      </div>
    </div>
  );
}
