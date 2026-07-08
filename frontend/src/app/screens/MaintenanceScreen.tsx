import { GhostButton } from "@/app/components/common/Button";

interface MaintenanceScreenProps {
  reason?: string;
}

export function MaintenanceScreen({ reason }: MaintenanceScreenProps) {
  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md w-full" style={{ animation: "mg-hero-in 0.5s ease-out both" }}>
          
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
              {/* 이름 명 — 名 */}
              <text
                x="56"
                y="72"
                textAnchor="middle"
                fontSize="44"
                fill="var(--color-seal)"
                opacity="0.85"
                className="font-hanja"
              >
                名
              </text>
            </svg>
          </div>

          <p
            className="font-hanja font-light text-primary leading-none mb-4 tracking-tight select-none"
            style={{ fontSize: "clamp(3rem, 2rem + 4vw, 4rem)" }}
            aria-hidden="true"
          >
            點檢
          </p>

          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-3 tracking-tight">
            서비스 점검 중입니다
          </h1>
          
          <p className="text-sm text-ink leading-relaxed break-keep mb-8">
            보다 나은 서비스 제공을 위해 현재 시스템을 점검하고 있습니다.
            <br />
            이용에 불편을 드려 대단히 죄송합니다.
          </p>
          
          {reason && (
            <div className="w-full bg-hanji border border-border-warm p-5 text-left mb-8 shadow-sm">
              <h2 className="text-xs font-semibold text-label mb-2 flex items-center gap-1.5">
                <span className="inline-block w-1 h-3 bg-seal opacity-70"></span>
                점검 안내
              </h2>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reason}</p>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <GhostButton 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 text-sm"
            >
              새로고침
            </GhostButton>
          </div>
          
        </div>
      </main>
    </div>
  );
}
