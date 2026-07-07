import { useState } from "react";
import type { Screen } from "@/app/types";
import { SAMPLE_PREVIEW_RESULTS } from "@/api/mock/names.mock";
import { NameCard } from "@/app/components/common/NameCard";
import { PrimaryButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

export function LandingScreen({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const previewResults = SAMPLE_PREVIEW_RESULTS;
  return (
    <div className="mt-16 h-[calc(100dvh-4rem)] overflow-y-scroll snap-y snap-proximity bg-background">
      {/* Hero — fills exactly the first viewport below GNB */}
      <section className="relative overflow-hidden snap-start snap-always flex flex-col items-center justify-center px-8 h-full">
        {/* Watermark hanja 名 — echoes the 條/法/據 motif of the value blocks */}
        <span
          className="font-hanja pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[300px] sm:text-[520px] leading-none text-primary opacity-[0.03]"
          aria-hidden="true"
        >
          名
        </span>

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative z-10 text-center lg:text-left">
          {/* Left Column (Main Copy & CTA) */}
          <div className="flex flex-col items-center lg:items-start">
            <p
              className="text-[11px] tracking-[0.35em] text-primary uppercase mb-6"
              style={{ animation: "mg-hero-in 0.7s ease both" }}
            >
              Myeongga Naming Studio
            </p>
            <h1
              className="font-headline text-4xl sm:text-5xl font-bold text-foreground leading-[1.28] tracking-tight mb-6 break-keep"
              style={{ animation: "mg-hero-in 0.7s ease 0.2s both" }}
            >
              법령부터 오행까지
              <br />
              확실한 근거로 이름을 짓다
            </h1>
            <p
              className="text-sm text-muted-foreground leading-relaxed break-keep max-w-md mb-10"
              style={{ animation: "mg-hero-in 0.7s ease 0.3s both" }}
            >
              대법원 인명용 한자와 81수리, 학술 문헌까지 —
              <br />
              모든 추천에 출처를 함께 제시합니다.
            </p>
            <PrimaryButton
              onClick={() => onNavigate("gate")}
              className="px-9 py-3.5 relative z-10"
              style={{ animation: "mg-hero-in 0.7s ease 0.4s both" }}
            >
              시작하기
            </PrimaryButton>
          </div>

          {/* Right Column (Premium Mockup Staggered Cards Stack) */}
          <div 
            className="hidden lg:flex items-center justify-center relative w-full h-[480px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsHovered((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            {/* Soft background glow */}
            <div className="absolute w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
            
            {/* Card 3 (Back) - 민준우 */}
            <div 
              className="absolute z-10"
              style={{
                transform: isHovered 
                  ? "translate(180px, 12px) rotate(6deg)" 
                  : "translate(24px, 24px) rotate(6deg)",
                transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div 
                className={`w-[320px] border border-border-warm/60 rounded-2xl p-5 shadow-[0_12px_28px_rgba(46,30,8,0.06)] transition-all duration-500 ${
                  isHovered ? "bg-white/90" : "bg-white/70"
                }`}
                style={{ animation: "mg-float 6.5s ease-in-out infinite alternate" }}
              >
                {/* Card Header */}
                <div className="border-b border-hanji pb-2 mb-3 text-left">
                  <span className="text-[8px] font-bold tracking-[0.2em] text-gold-text uppercase">Myeongga Report</span>
                  <h4 className="text-[10px] font-semibold text-foreground mt-0.5">명가작명소 추천 인증서</h4>
                </div>
                
                {/* The Name Block */}
                <div className="text-center my-4">
                  <div className="inline-flex items-baseline gap-2 mb-1">
                    <span className="font-hanja text-2xl font-semibold tracking-wide text-foreground" lang="ko-Hani">閔 俊 宇</span>
                    <span className="text-xs text-caption">(민준우)</span>
                  </div>
                  <p className="text-[9px] text-ink leading-relaxed">뛰어난 재능으로 세상을 널리 밝히는 이름</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  <span className="text-[8px] font-bold text-pine bg-pine/8 px-1.5 py-0.5 rounded border border-pine/25">대법원 PASS</span>
                  <span className="text-[8px] font-bold text-gold-text bg-hanji px-1.5 py-0.5 rounded border border-gold-border/30">81수리 대길</span>
                  <span className="text-[8px] font-bold text-gold-text bg-hanji px-1.5 py-0.5 rounded border border-gold-border/30">목(木)성 풍부</span>
                </div>
              </div>
            </div>

            {/* Card 2 (Middle) - 이서아 */}
            <div 
              className="absolute z-20"
              style={{
                transform: isHovered 
                  ? "translate(-180px, -12px) rotate(-6deg)" 
                  : "translate(-24px, -16px) rotate(-6deg)",
                transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div 
                className={`w-[320px] border border-border-warm/85 rounded-2xl p-5 shadow-[0_18px_36px_rgba(46,30,8,0.08)] transition-all duration-500 ${
                  isHovered ? "bg-white/95" : "bg-white/80"
                }`}
                style={{ animation: "mg-float 5.5s ease-in-out infinite alternate-reverse" }}
              >
                {/* Card Header */}
                <div className="border-b border-hanji pb-2 mb-3 text-left">
                  <span className="text-[8px] font-bold tracking-[0.2em] text-gold-text uppercase">Myeongga Report</span>
                  <h4 className="text-[10px] font-semibold text-foreground mt-0.5">명가작명소 추천 인증서</h4>
                </div>
                
                {/* The Name Block */}
                <div className="text-center my-4">
                  <div className="inline-flex items-baseline gap-2 mb-1">
                    <span className="font-hanja text-2xl font-semibold tracking-wide text-foreground" lang="ko-Hani">李 瑞 雅</span>
                    <span className="text-xs text-caption">(이서아)</span>
                  </div>
                  <p className="text-[9px] text-ink leading-relaxed">상서롭고 우아한 덕을 겸비한 이름</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  <span className="text-[8px] font-bold text-pine bg-pine/8 px-1.5 py-0.5 rounded border border-pine/25">대법원 PASS</span>
                  <span className="text-[8px] font-bold text-gold-text bg-hanji px-1.5 py-0.5 rounded border border-gold-border/30">81수리 대길</span>
                  <span className="text-[8px] font-bold text-gold-text bg-hanji px-1.5 py-0.5 rounded border border-gold-border/30">금(金)성 조화</span>
                </div>
              </div>
            </div>

            {/* Card 1 (Top/Front) - 김지우 */}
            <div 
              className="absolute z-30"
              style={{
                transform: isHovered ? "scale(1.03) translate(0px, -4px)" : "scale(1)",
                transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div 
                className={`w-[340px] bg-white border border-gold-border/40 rounded-2xl p-6 transition-all duration-500 ${
                  isHovered ? "shadow-[0_32px_64px_rgba(46,30,8,0.18)]" : "shadow-[0_24px_50px_rgba(46,30,8,0.12)]"
                }`}
                style={{ animation: "mg-float 6s ease-in-out infinite" }}
              >
                {/* Card Header */}
                <div className="border-b border-hanji pb-5 mb-4 text-left">
                  <span className="text-[9px] font-bold tracking-[0.2em] text-gold-text uppercase">Myeongga Report</span>
                  <h4 className="text-xs font-semibold text-foreground mt-0.5">명가작명소 추천 인증서</h4>
                </div>

                {/* Traditional Red Stamp Watermark */}
                <div className="absolute top-3 right-3 w-14 h-14 rounded-full border-2 border-red-500/25 flex items-center justify-center text-[10px] font-bold text-red-500/35 select-none pointer-events-none">
                  명가검증
                </div>
                
                {/* The Name Block */}
                <div className="text-center my-6">
                  <div className="inline-flex items-baseline gap-2.5 mb-1.5">
                    <span className="font-hanja text-4xl font-semibold tracking-wide text-foreground" lang="ko-Hani">金 志 宇</span>
                    <span className="text-sm text-caption font-medium">(김지우)</span>
                  </div>
                  <p className="text-[11px] text-ink leading-relaxed break-keep">뜻을 크게 품어 우주처럼 넓은 기상을 펼치는 이름</p>
                </div>

                {/* Validation Tiers */}
                <div className="space-y-2.5 text-left">
                  {/* Tier 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-hanji/60 border border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pine/80" />
                      <span className="text-[11px] font-medium text-foreground">대법원 인명용 한자</span>
                    </div>
                    <span className="text-[9px] font-bold text-pine bg-pine/8 px-1.5 py-0.5 rounded border border-pine/25">PASS</span>
                  </div>

                  {/* Tier 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-hanji/60 border border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-border" />
                      <span className="text-[11px] font-medium text-foreground">81수리 4격 (원·형·이·정)</span>
                    </div>
                    <span className="text-[9px] font-bold text-gold-text bg-hanji px-1.5 py-0.5 rounded border border-gold-border/30">전격 대길 (吉)</span>
                  </div>

                  {/* Tier 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-hanji/60 border border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-text" />
                      <span className="text-[11px] font-medium text-foreground">음양조화 및 자원오행</span>
                    </div>
                    <span className="text-[9px] text-gold-text font-bold">목(木) 화(火) 수(水) 조화</span>
                  </div>
                </div>
                
                {/* Signature Footer */}
                <div className="mt-5 pt-3.5 border-t border-hanji flex justify-between items-center text-[9px] text-caption">
                  <span>검증 엔진 v2.5</span>
                  <span className="font-mono font-medium text-gold-text">MYEONGGA CERTIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ animation: "mg-hero-in 0.7s ease 0.9s both" }}
          aria-hidden="true"
        >
          <span className="text-[10px] tracking-[0.3em] text-hint uppercase">Scroll</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-hint"
            style={{ animation: "mg-scroll-hint 1.8s ease-in-out infinite" }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* 3 Value Blocks */}
      <section className="snap-start px-8 py-16 bg-background">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 border border-border rounded-2xl bg-hanji/30 overflow-hidden shadow-[0_8px_30px_rgba(46,30,8,0.02)]">
          {[
            {
              title: "조건 기반 추천",
              sub: "Condition-Based",
              desc: "오행·획수·뜻·발음 등 조건을 자유롭게 설명하면 해당 조건을 충족하는 이름을 추천합니다.",
              stat: "81수리 체계 완전 대조",
              hanja: "條",
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                  <circle cx="13" cy="14" r="2" fill="currentColor" stroke="none" />
                </svg>
              ),
            },
            {
              title: "법령 적법성 검증",
              sub: "Legal Validation",
              desc: "대법원 인명용 한자 목록 및 관련 법령에 따라 이름의 적법성을 자동으로 검증합니다.",
              stat: "8,142자 인명용 한자 기준",
              hanja: "法",
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2.5 3.5 5v5c0 4 2.8 6.5 6.5 8 3.7-1.5 6.5-4 6.5-8V5L10 2.5Z" />
                  <path d="M7 10l2 2 4-4" />
                </svg>
              ),
            },
            {
              title: "출처 근거 제시",
              sub: "Source Citation",
              desc: "학술 논문·법령·자원오행 문헌 등 신뢰할 수 있는 출처를 모든 추천에 함께 제시합니다.",
              stat: "KCI 학술 논문 인용",
              hanja: "據",
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3.5h9l3 3v10h-12z" />
                  <path d="M13 3.5V7h3" />
                  <line x1="6.5" y1="10" x2="13.5" y2="10" />
                  <line x1="6.5" y1="12.5" x2="13.5" y2="12.5" />
                </svg>
              ),
            },
          ].map((block, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden flex flex-col justify-center px-10 py-9 transition-colors duration-300 hover:bg-white ${i < 2 ? "sm:border-r border-border" : ""} ${i > 0 ? "border-t sm:border-t-0 border-border" : ""}`}
            >
              {/* Watermark hanja — grows more visible on hover */}
              <span
                className="font-hanja pointer-events-none select-none absolute -bottom-10 -right-4 text-[190px] leading-none font-normal text-primary opacity-[0.06] group-hover:opacity-[0.14] transition-opacity duration-500"
                aria-hidden="true"
              >
                {block.hanja}
              </span>

              <div className="relative z-10 w-10 h-10 mb-4 rounded-full border border-border flex items-center justify-center text-primary transition-colors duration-300 group-hover:bg-primary group-hover:border-primary group-hover:text-background">
                {block.icon}
              </div>
              <p className="relative z-10 text-[10px] tracking-[0.28em] text-caption uppercase mb-2">
                {block.sub}
              </p>
              <h3 className="relative z-10 text-2xl font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-primary">{block.title}</h3>
              <p className="relative z-10 text-sm text-ink leading-relaxed break-keep mb-4">{block.desc}</p>
              <p className="relative z-10 text-xs font-medium text-primary pt-3 border-t border-muted transition-colors duration-300 group-hover:border-border-warm">
                {block.stat}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Result Preview */}
      <section className="snap-start px-8 py-16 bg-background">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-3 text-center">
            Sample Result
          </p>
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center break-keep">
            이렇게 근거와 함께 이름을 추천해 드립니다
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-12 break-keep">
            실제 추천 결과의 일부입니다. 모든 이름에는 출처와 근거가 함께 제공됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-2xl bg-hanji/30 overflow-hidden shadow-[0_8px_30px_rgba(46,30,8,0.02)]">
            {previewResults.map((result, i) => (
              <div 
                key={result.id} 
                className={`p-6 flex items-center justify-center bg-white/40 hover:bg-white transition-all duration-300 ${
                  i < 2 ? "sm:border-r border-border" : ""
                } ${i > 0 ? "border-t sm:border-t-0 border-border" : ""}`}
              >
                <NameCard result={result} variant="preview" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <PrimaryButton onClick={() => onNavigate("gate")} className="px-9 py-3.5">
              내 이름도 추천받기 →
            </PrimaryButton>
          </div>
        </div>
      </section>

      <div className="snap-end">
         <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}
