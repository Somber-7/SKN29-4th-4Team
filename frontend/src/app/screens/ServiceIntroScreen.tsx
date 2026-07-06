import type { ReactNode } from "react";
import bearImg from "@/assets/mascot-bear.webp";
import deerImg from "@/assets/mascot-deer.webp";
import raccoonImg from "@/assets/mascot-raccoon.webp";
import foxImg from "@/assets/mascot-fox.webp";
import gateSceneImg from "@/assets/gate-scene.webp";
import { ImageWithFallback } from "@/app/components/common/ImageWithFallback";
import type { Screen } from "@/app/types";
import { PrimaryButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

interface StepItem {
  step: string;
  en: string;
  title: string;
  summary: string;
  desc: string;
  mascot: ReactNode;
  detail: ReactNode;
  mockup: ReactNode;
}

function DetailTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] text-gold-text font-medium border border-border-warm bg-hanji rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      {children}
    </span>
  );
}

/** gate-scene.webp 속 캐릭터 등장 순서(사슴 → 너구리 → 여우 → 곰)에 맞춘 단계 구성 */
const STEPS: StepItem[] = [
  {
    step: "01",
    en: "Condition Input",
    title: "조건 입력",
    summary: "자연어 한 문장이면 충분합니다.",
    desc: "원하시는 성씨와 선호하는 오행(나무, 불, 물 등), 강조하고 싶은 뜻이나 아이에게 주고 싶은 발음 느낌을 한 문장으로 편하게 설명해 주세요.",
    mascot: (
      <ImageWithFallback
        src={deerImg}
        alt="사슴 캐릭터가 작명소 책상에서 조건을 정리하는 모습"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ),
    detail: (
      <div className="flex flex-row gap-1.5 overflow-x-auto whitespace-nowrap py-0.5 scrollbar-none lg:flex-nowrap">
        <DetailTag>성씨 (필수)</DetailTag>
        <DetailTag>오행 선호</DetailTag>
        <DetailTag>획수 범위</DetailTag>
        <DetailTag>의미 키워드</DetailTag>
        <DetailTag>발음 느낌</DetailTag>
      </div>
    ),
    mockup: (
      <div className="bg-white border border-border-warm rounded-2xl p-5 sm:p-6 shadow-[0_16px_36px_rgba(46,30,8,0.06)] w-full text-left">
        <div className="flex items-center gap-1.5 border-b border-hanji pb-3 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-caption font-mono ml-2">natural_language_input.exe</span>
        </div>
        <p className="text-xs font-bold text-primary mb-2 tracking-wide font-sans uppercase">자연어 입력</p>
        <div className="bg-hanji border border-border rounded-xl p-4 min-h-[90px] font-serif text-sm sm:text-base text-foreground mb-4 leading-relaxed relative flex items-center justify-center text-center">
          <span className="absolute top-2 left-3 text-2xl text-gold-text/20 font-serif">“</span>
          <p className="px-4 break-keep font-medium text-foreground">
            김씨 성에 물(水) 기운을 가진<br />총명하고 건강한 아이 이름 지어주세요.
          </p>
          <span className="absolute bottom-2 right-3 text-2xl text-gold-text/20 font-serif">”</span>
        </div>
        <div className="flex flex-wrap gap-1.5 font-sans">
          <span className="text-[10px] font-bold text-gold-text bg-hanji px-2 py-0.5 rounded border border-gold-border/30"># 성씨: 김</span>
          <span className="text-[10px] font-bold text-gold-text bg-hanji px-2 py-0.5 rounded border border-gold-border/30"># 오행: 수(水)</span>
          <span className="text-[10px] font-bold text-pine bg-pine/8 px-2 py-0.5 rounded border border-pine/25"># 뜻: 총명, 건강</span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    en: "Condition Analysis",
    title: "조건 해석",
    summary: "입력한 문장에서 조건을 자동으로 추출합니다.",
    desc: "작성해 주신 설명글에서 성씨, 오행, 획수 범위, 의미를 파악합니다. 특히 오행은 자원오행과 발음오행으로 세밀하게 구분하여 분석합니다.",
    mascot: (
      <ImageWithFallback
        src={raccoonImg}
        alt="너구리 캐릭터가 조건을 분석하는 모습"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ),
    detail: (
      <div className="flex flex-wrap gap-1.5">
        <DetailTag>자연어 분석</DetailTag>
        <DetailTag>자원오행 / 발음오행 구분</DetailTag>
        <DetailTag>의미어 ➔ 한자 후보 매핑</DetailTag>
      </div>
    ),
    mockup: (
      <div className="bg-white border border-border-warm rounded-2xl p-5 sm:p-6 shadow-[0_16px_36px_rgba(46,30,8,0.06)] w-full text-left">
        <div className="flex items-center gap-1.5 border-b border-hanji pb-3 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-border/40" />
          <span className="text-[10px] text-caption font-mono">condition_extractor.py</span>
        </div>
        <p className="text-xs font-bold text-primary mb-3 tracking-wide font-sans uppercase">조건 추출 및 분석</p>
        <div className="space-y-3 font-sans">
          <div className="flex justify-between items-center p-3 rounded-xl bg-hanji border border-border/30 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">성씨 매칭</span>
            <span className="font-semibold text-gold-text">金 (김)</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-hanji border border-border/30 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">오행 분석</span>
            <span className="font-semibold text-gold-text bg-hanji px-2 py-0.5 rounded border border-gold-border/30">水 (물 기운)</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-hanji border border-border/30 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">의미적 확장</span>
            <span className="font-medium text-ink">志(뜻 지), 宇(우주 우) 등</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    en: "Evidence Matching",
    title: "근거 대조",
    summary: "네 가지 기준으로 후보를 교차 검증합니다.",
    desc: "추출된 후보 한자들을 대법원 법령 한자, 81수리 격식, 자원오행 조합, KCI 학술 논문 등 네 가지 정밀 기준에 대입하여 엄격하게 교차 검증합니다.",
    mascot: (
      <ImageWithFallback
        src={foxImg}
        alt="여우 캐릭터가 문헌과 법령을 대조하는 모습"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ),
    detail: (
      <div className="flex flex-row gap-1.5 overflow-x-auto whitespace-nowrap py-0.5 scrollbar-none lg:flex-nowrap">
        <DetailTag>인명 한자 기준</DetailTag>
        <DetailTag>81수리 4격</DetailTag>
        <DetailTag>자원오행 조화</DetailTag>
        <DetailTag>KCI 학술 대조</DetailTag>
      </div>
    ),
    mockup: (
      <div className="bg-white border border-border-warm rounded-2xl p-5 sm:p-6 shadow-[0_16px_36px_rgba(46,30,8,0.06)] w-full text-left">
        <div className="flex items-center gap-1.5 border-b border-hanji pb-3 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-pine/80" />
          <span className="text-[10px] text-caption font-mono">cross_validator.sh</span>
        </div>
        <p className="text-xs font-bold text-primary mb-3.5 tracking-wide font-sans uppercase">4대 정밀 교차 검증</p>
        <div className="space-y-3 font-sans text-xs sm:text-sm">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-foreground/95 font-semibold">1. 대법원 인명 한자 검증</span>
            <span className="text-xs font-bold text-pine bg-pine/8 px-2.5 py-0.5 rounded border border-pine/25 shadow-sm">PASS</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-foreground/95 font-semibold">2. 81수리 원형이정 확인</span>
            <span className="text-xs font-bold text-pine bg-pine/8 px-2.5 py-0.5 rounded border border-pine/25 shadow-sm">PASS</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-foreground/95 font-semibold">3. 자원오행 수(水) 배정</span>
            <span className="text-xs font-bold text-pine bg-pine/8 px-2.5 py-0.5 rounded border border-pine/25 shadow-sm">PASS</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-foreground/95 font-semibold">4. KCI 학술논문 적합성</span>
            <span className="text-xs font-bold text-pine bg-pine/8 px-2.5 py-0.5 rounded border border-pine/25 shadow-sm">PASS</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "04",
    en: "Recommendation",
    title: "추천과 근거 제시",
    summary: "검증을 통과한 이름만 근거와 함께 추천합니다.",
    desc: "모든 검증을 완벽하게 통과한 최고의 이름만을 엄선합니다. 각 이름의 성명학적 해설과 함께 출생신고 및 학술 레퍼런스 보고서를 최종 전달합니다.",
    mascot: (
      <ImageWithFallback
        src={bearImg}
        alt="곰 캐릭터가 이름 추천서를 건네는 모습"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ),
    detail: (
      <div className="flex flex-wrap gap-1.5">
        <DetailTag>획수·자원오행 해설</DetailTag>
        <DetailTag>추천 인증서 발급</DetailTag>
        <DetailTag>레퍼런스 출처 제공</DetailTag>
      </div>
    ),
    mockup: (
      <div className="bg-white border-2 border-double border-border-warm rounded-2xl p-5 sm:p-6 shadow-[0_16px_36px_rgba(46,30,8,0.06)] w-full text-left relative overflow-hidden">
        <div className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center text-[8px] font-bold text-red-500/30 rotate-12 pointer-events-none select-none">
          명가인증
        </div>
        <div className="border-b border-hanji pb-2.5 mb-4">
          <span className="text-[8px] font-bold tracking-widest text-gold-text uppercase">Myeongga Report</span>
          <h4 className="text-xs font-bold text-foreground mt-0.5 font-sans">명가추천 인증서</h4>
        </div>
        <div className="text-center my-4">
          <span className="font-hanja text-2xl font-bold tracking-wider text-foreground">金 志 宇</span>
          <span className="text-xs text-caption font-semibold ml-2">(김지우)</span>
          <p className="text-xs text-ink mt-2.5 leading-relaxed font-medium">뜻을 크게 품어 우주처럼 넓은 기상을 펼치는 이름</p>
        </div>
        <div className="flex justify-between items-center text-[9px] text-caption mt-4.5 pt-2.5 border-t border-hanji font-sans">
          <span>KCI 논문 문헌 출처 제공</span>
          <span className="text-gold-text font-bold">검증 완료</span>
        </div>
      </div>
    ),
  },
];

export function ServiceIntroScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="mt-16 min-h-[calc(100dvh-4rem)] bg-background">
      {/* Section 1 — 근거 있는 이름 짓기 + 게이트 사진 */}
      <section className="relative overflow-hidden h-fit min-h-[60vh] flex flex-col items-center justify-center gap-8 px-8 py-20 text-center bg-background">
        {/* Watermark hanja 作 — centered behind the main text and clearly visible */}
        <div
          className="font-hanja pointer-events-none select-none absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[260px] sm:text-[340px] leading-none text-gold-text opacity-[0.08] z-0"
          aria-hidden="true"
        >
          作
        </div>
        <div className="relative z-10">
          <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-4">서비스 소개 · About</p>
          <h1 className="text-4xl font-semibold text-foreground tracking-tight mb-5 break-keep">
            근거 있는 이름 짓기
          </h1>
          <p className="text-base text-ink max-w-xl mx-auto leading-relaxed break-keep">
            명가작명소는 감이 아니라 근거로 이름을 짓습니다.
            <br />
            대법원 인명용 한자, 81수리, 학술 문헌까지 확인한 뒤 추천합니다.
          </p>
        </div>

        <div className="relative z-10 w-fit max-w-full mx-auto max-h-[46vh] overflow-hidden flex items-center justify-center">
          <ImageWithFallback
            src={gateSceneImg}
            alt="문이 열리면 보이는 명가작명소의 한옥 서재. 사슴·너구리·여우·곰 캐릭터가 책상 앞에 모여 있다."
            className="max-w-full max-h-[46vh] w-auto h-auto object-contain"
            loading="lazy"
          />
        </div>
      </section>

      {/* Section 2 — 근거를 쌓아가는 4단계 스토리보드 타임라인 */}
      <section className="h-fit border-t border-border px-6 sm:px-12 py-24 bg-hanji/30 relative">
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-28">
            <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-3">How it works</p>
            <h2 className="text-4xl font-semibold text-foreground tracking-tight break-keep">근거를 쌓아가는 4단계</h2>
            <p className="text-sm text-caption mt-3 break-keep">명가작명소가 최적의 이름을 엄선하기 위한 정교한 4단계 검증 프로세스입니다.</p>
          </div>

          {/* Central Timeline Line (Desktop/Large screens only) */}
          <div className="absolute left-1/2 top-[200px] bottom-[200px] w-[1px] bg-border-warm -translate-x-1/2 hidden lg:block z-0" />

          {/* Storyboard Items Container */}
          <div className="space-y-36">
            {STEPS.map((s, idx) => {
              const isEven = idx % 2 === 1;
              return (
                <div 
                  key={s.step} 
                  className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.8fr_1.1fr] gap-8 lg:gap-16 items-center"
                >
                  {/* Left Column (Row Col 1) */}
                  <div className={`flex flex-col justify-center text-left w-full max-w-[500px] mx-auto ${isEven ? "lg:order-3" : "lg:order-1"}`}>
                    <div className="flex items-baseline gap-2.5 mb-4">
                      <span className="text-4xl sm:text-5xl font-bold font-mono text-gold-text tracking-tight">{s.step}</span>
                      <span className="text-[10px] tracking-[0.25em] text-gold-text uppercase font-bold">{s.en}</span>
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight break-keep">
                      {s.title}
                    </h3>
                    <p className="text-sm sm:text-base text-ink leading-relaxed break-keep mb-6 font-medium">
                      {s.desc}
                    </p>
                    <div className="border-t border-hanji pt-4">
                      {s.detail}
                    </div>
                  </div>

                  {/* Center Column (Row Col 2): Mascot card (Centered) */}
                  <div className="flex items-center justify-center w-full mx-auto lg:order-2">
                    <div className="w-[180px] sm:w-[240px] md:w-[260px] aspect-square overflow-hidden border border-border-warm rounded-2xl bg-white shadow-[0_12px_28px_rgba(46,30,8,0.04)] hover:shadow-[0_20px_40px_rgba(46,30,8,0.08)] transition-all duration-500 hover:-translate-y-1 shrink-0">
                      <div className="w-full h-full transform hover:scale-105 transition-transform duration-700 ease-out">
                        {s.mascot}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Row Col 3): Mockup UI card (Separated with gap) */}
                  <div className={`flex items-center justify-center w-full mx-auto ${isEven ? "lg:order-1" : "lg:order-3"}`}>
                    <div className="w-full max-w-[320px] sm:max-w-[340px] transition-all duration-500 hover:scale-[1.02] hover:shadow-lg relative">
                      <div className="absolute inset-0 bg-gold-border/5 rounded-2xl blur-2xl -z-10" />
                      {s.mockup}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA / Ending Section */}
      <section className="py-32 border-t border-border flex flex-col items-center justify-center px-8 text-center bg-hanji/30">
        <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-3">Ready to start</p>
        <h2 className="text-3xl font-semibold text-foreground tracking-tight break-keep mb-6">나만을 위한 특별한 이름</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md break-keep">
          사주 명리 조건부터 대법원 한자 검증까지, 지금 명가작명소에서 근거 있는 작명을 체험해 보세요.
        </p>
        <PrimaryButton onClick={() => onNavigate("gate")} className="px-10 py-4 text-base shadow-[0_12px_24px_rgba(176,144,96,0.25)]">
          지금 이름 짓기 시작하기 →
        </PrimaryButton>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
