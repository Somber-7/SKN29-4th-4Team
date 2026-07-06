import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { InputIntroPanel } from "@/app/components/forms/InputIntroPanel";
import { NaturalInputForm } from "@/app/components/forms/NaturalInputForm";
import { StructuredInputForm } from "@/app/components/forms/StructuredInputForm";
import { Footer } from "@/app/components/layout/Footer";
import type { NameRequest } from "@/app/types";

type InputMode = "natural" | "structured";

// ─── 화면 ─────────────────────────────────────────────────────────────────────
// 폼 상태(자연어 텍스트 / 상세조건 필드)는 각 폼 컴포넌트 내부로 캡슐화되어 있다.
// 이 화면은 탭 전환 레이아웃과 두 패널의 그리드 겹침(높이 고정) 배치만 담당한다.
// 탭 자체는 @radix-ui/react-tabs로 구현 — 좌우 화살표 전환·roving tabindex는
// Radix가 기본 제공하므로 기존의 수제 keydown 핸들러는 더 이상 필요 없다.

export function InputScreen({ onSubmit }: { onSubmit: (request: NameRequest) => void }) {
  const [mode, setMode] = useState<InputMode>("natural");

  return (
    <div className="pt-16 min-h-screen bg-hanji/40 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative background visual elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-border/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* This wrapper forces GNB + Content to occupy exactly 100vh on desktop, pushing footer exactly below the fold */}
      <div className="w-full flex-grow lg:h-[calc(100vh-4rem)] flex flex-col justify-center py-4 sm:py-6">
        <div className="max-w-6xl mx-auto w-full px-6 sm:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <InputIntroPanel />

            {/* Right Column: Unified Capsule Card Container (Occupies 7 columns on desktop) */}
            <div className="lg:col-span-7">
              <div className="bg-white/95 backdrop-blur-md border border-border-warm rounded-3xl p-5 sm:p-7 shadow-[0_20px_45px_rgba(46,30,8,0.04)] relative">
                <Tabs value={mode} onValueChange={(v) => setMode(v as InputMode)}>
                  {/* Mode tabs (Capsule Pills) */}
                  <TabsList
                    className="flex p-1 bg-hanji border border-border rounded-xl mb-5 w-fit"
                    aria-label="이름 조건 입력 방식"
                  >
                    <TabsTrigger
                      value="natural"
                      className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-border-warm data-[state=active]:shadow-[0_2px_8px_rgba(46,30,8,0.03)] data-[state=inactive]:text-caption data-[state=inactive]:hover:text-foreground"
                    >
                      자연어로 설명
                    </TabsTrigger>
                    <TabsTrigger
                      value="structured"
                      className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-border-warm data-[state=active]:shadow-[0_2px_8px_rgba(46,30,8,0.03)] data-[state=inactive]:text-caption data-[state=inactive]:hover:text-foreground"
                    >
                      상세 조건으로 입력
                    </TabsTrigger>
                  </TabsList>

                  {/* Both panels are mounted in the same grid cell so the card's height
                      always matches the taller of the two — switching tabs never resizes the box.
                      forceMount keeps both TabsContent in the DOM; NaturalInputForm/StructuredInputForm
                      already hide themselves visually via their own `active` prop. */}
                  <div className="grid">
                    <TabsContent
                      value="natural"
                      forceMount
                      className="col-start-1 row-start-1"
                      {...(mode !== "natural" ? { inert: "" } : {})}
                    >
                      <NaturalInputForm active={mode === "natural"} onSubmit={onSubmit} />
                    </TabsContent>

                    <TabsContent
                      value="structured"
                      forceMount
                      className="col-start-1 row-start-1"
                      {...(mode !== "structured" ? { inert: "" } : {})}
                    >
                      <StructuredInputForm active={mode === "structured"} onSubmit={onSubmit} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
