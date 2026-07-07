import { useEffect, useRef, useState } from "react";
import type { Screen } from "@/app/types";
import { PageHeader } from "@/app/components/common/PageHeader";
import { Footer } from "@/app/components/layout/Footer";
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from "@/app/data/policyContent";

// ─── 화면 ─────────────────────────────────────────────────────────────────────

export function PolicyScreen({
  kind,
  onNavigate,
}: {
  kind: "terms" | "privacy";
  onNavigate: (s: Screen) => void;
}) {
  const isTerms = kind === "terms";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const [activeId, setActiveId] = useState(sections[0].id);
  const contentRef = useRef<HTMLDivElement>(null);

  // 데스크톱 목차 스크롤스파이 — 현재 읽는 섹션 하이라이트
  useEffect(() => {
    setActiveId(sections[0].id);
    const headings = contentRef.current?.querySelectorAll("section[id]");
    if (!headings || headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow={isTerms ? "Terms of Service" : "Privacy Policy"}
          title={isTerms ? "이용약관" : "개인정보처리방침"}
          description={
            isTerms
              ? "명가작명소 서비스 이용에 적용되는 약관입니다. 시행일: 2026년 7월 7일"
              : "명가작명소가 개인정보를 수집·이용·보호하는 기준입니다. 적용일: 2026년 7월 7일"
          }
          watermark={isTerms ? "約" : "私"}
          align="left"
        />

        {/* 약관 ↔ 방침 전환 */}
        <div className="flex gap-2 mb-10" role="tablist" aria-label="정책 문서 선택">
          {(
            [
              { label: "이용약관", screen: "terms", selected: isTerms },
              { label: "개인정보처리방침", screen: "privacy", selected: !isTerms },
            ] as { label: string; screen: Screen; selected: boolean }[]
          ).map((tab) => (
            <button
              key={tab.label}
              role="tab"
              aria-selected={tab.selected}
              onClick={() => onNavigate(tab.screen)}
              className={`px-4 py-2 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                tab.selected
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-label border-border hover:border-primary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 lg:items-start">
          {/* 목차 — 데스크톱 전용, 현재 섹션 하이라이트 */}
          <nav
            className="hidden lg:block sticky top-24 border-l border-border"
            aria-label="문서 목차"
          >
            <ul className="space-y-0.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    aria-current={activeId === s.id ? "true" : undefined}
                    className={`block w-full text-left pl-4 pr-2 py-1.5 text-xs leading-snug break-keep -ml-px border-l-2 transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                      activeId === s.id
                        ? "border-primary text-primary font-medium"
                        : "border-transparent text-caption hover:text-label"
                    }`}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* 본문 — 가독성을 위한 행길이 제한 */}
          <div ref={contentRef} className="max-w-prose">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 mb-10">
                <h2 className="text-base font-semibold text-foreground mb-3 break-keep">
                  {s.title}
                </h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-ink leading-[1.85] break-keep mb-3">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
