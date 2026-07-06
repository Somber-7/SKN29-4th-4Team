/** InputScreen 좌측 컬럼 — 타이틀 + 3단계 안내 (정적 콘텐츠, 폼 상태와 무관) */
export function InputIntroPanel() {
  return (
    <div className="lg:col-span-5 flex flex-col justify-center text-left mb-8 lg:mb-0">
      <span className="inline-block px-3 py-1 text-[10px] tracking-[0.2em] font-bold text-gold-text bg-hanji border border-gold-border/30 rounded-full uppercase mb-4 w-fit">
        Premium Naming Service
      </span>
      <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-4 break-keep">
        어떤 이름을 원하시나요?
      </h2>
      <p className="text-sm text-ink leading-relaxed break-keep mb-8 max-w-md">
        자연어로 지어질 이름의 뉘앙스를 설명하거나, 원하는 상세 오행과 조건을 항목별로 입력해
        주세요. 명가작명소가 명품 한자 후보군을 엄선합니다.
      </p>

      {/* Step-by-step description guide for widescreen layout */}
      <div className="space-y-5 border-l border-border-warm pl-5 hidden lg:block">
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            01. 자연어 조건 입력
          </h4>
          <p className="text-xs text-ink break-keep leading-relaxed">
            "물 기운이 강한 총명한 사내아이 이름" 등 원하는 조건을 문장 형태로 자유롭게 이해합니다.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            02. 상세 조건 정밀 검색
          </h4>
          <p className="text-xs text-ink break-keep leading-relaxed">
            특정 성씨, 선호하는 오행(목/화/토/금/수), 획수 및 뜻을 직접 지정하여 정밀 추출합니다.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            03. 사주/한자 검증
          </h4>
          <p className="text-xs text-ink break-keep leading-relaxed">
            추천된 모든 결과는 대법원 규격 인명 한자와 음양오행 상생 배합 조건을 기반으로 정밀 검증됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
