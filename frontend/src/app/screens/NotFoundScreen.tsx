import type { Screen } from "@/app/types";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

export function NotFoundScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md" style={{ animation: "mg-hero-in 0.5s ease-out both" }}>
          {/* 도장(印) 모티프 일러스트 — 은은한 float (유일하게 허용된 루프 모션) */}
          <div
            className="mx-auto mb-8 w-24 h-24 sm:w-28 sm:h-28"
            style={{ animation: "mg-float 3.5s ease-in-out infinite" }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 112 112" fill="none" className="w-full h-full">
              {/* 도장 외곽 */}
              <rect
                x="8"
                y="8"
                width="96"
                height="96"
                stroke="var(--color-seal)"
                strokeWidth="3"
                opacity="0.75"
              />
              <rect
                x="16"
                y="16"
                width="80"
                height="80"
                stroke="var(--color-seal)"
                strokeWidth="1.2"
                opacity="0.35"
              />
              {/* 길 잃음 — 迷 */}
              <text
                x="56"
                y="72"
                textAnchor="middle"
                fontSize="44"
                fill="var(--color-seal)"
                opacity="0.85"
                className="font-hanja"
              >
                迷
              </text>
            </svg>
          </div>

          {/* clamp() 유동 타이포그래피 */}
          <p
            className="font-hanja font-light text-primary leading-none mb-4 tracking-tight select-none"
            style={{ fontSize: "clamp(4rem, 2.5rem + 7vw, 7rem)" }}
            aria-hidden="true"
          >
            404
          </p>

          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-ink leading-relaxed break-keep mb-8">
            길을 잃으셨네요. 주소가 바뀌었거나 삭제된 페이지입니다.
            <br />
            좋은 이름을 찾는 길은 홈에서 다시 시작하실 수 있습니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <PrimaryButton onClick={() => onNavigate("landing")} className="px-6 py-3 w-full sm:w-auto">
              홈으로 돌아가기
            </PrimaryButton>
            <GhostButton
              onClick={() => onNavigate("faq")}
              className="px-6 py-3 w-full sm:w-auto text-sm"
            >
              자주 묻는 질문 보기
            </GhostButton>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
