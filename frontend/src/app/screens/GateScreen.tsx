import { useEffect, useState } from "react";
import gateSceneImg from "@/assets/gate-scene.webp";
import woodTextureImg from "@/assets/wood-texture.webp";
import paperTextureImg from "@/assets/paper-texture.webp";

/** 문 진입 애니메이션이 화면에 나타나기까지의 지연 */
const VISIBLE_DELAY_MS = 80;
/** 문 열림 애니메이션 재생 시간 */
const GATE_OPEN_DURATION_MS = 2800;
/** 문이 완전히 열린 뒤 서재 장면을 보여주는 시간 */
const SCENE_HOLD_MS = 100;
/** 장면 페이드아웃 시간 — 종료 후 다음 화면으로 이동 */
const FADE_OUT_MS = 500;

function DoorPanel({ side }: { side: "left" | "right" }) {
  const woodPatternId = `wood-pat-${side}`;
  const paperPatternId = `paper-pat-${side}`;
  const glowId = `glow-${side}`;
  const shadowId = `slat-shadow-${side}`;
  const slatGradId = `slat-grad-${side}`;
  const frame = "#8B6239";
  const lattice = "#3A2515";
  const handleX = side === "left" ? 430 : 70;
  // 문고리는 화면(뷰박스) 세로 중앙에 오도록 배치
  const handleY = 500;

  // Lattice zone bounds
  const lx = 34, ly = 34, lw = 432, lh = 700;

  // Dense vertical slats (bitsal comb-lattice) + sparse horizontal cross rails
  const vLines: number[] = [];
  for (let x = lx + 14; x < lx + lw; x += 16) vLines.push(x);
  const hLines = [ly, ly + lh * 0.24, ly + lh * 0.5, ly + lh * 0.76, ly + lh];

  return (
    <svg
      viewBox="0 0 500 1000"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id={woodPatternId} x="0" y="0" width="300" height="900" patternUnits="userSpaceOnUse">
          <image href={woodTextureImg} x="0" y="0" width="300" height="900" preserveAspectRatio="none" />
        </pattern>
        <pattern id={paperPatternId} x="0" y="0" width="320" height="560" patternUnits="userSpaceOnUse">
          <image href={paperTextureImg} x="0" y="0" width="320" height="560" preserveAspectRatio="none" />
        </pattern>
        {/* Warm light glow, brighter at center, layered over the paper texture */}
        <radialGradient id={glowId} cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#FFF6DE" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FFF6DE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFF6DE" stopOpacity="0" />
        </radialGradient>
        {/* Round dowel shading for each slat: light-mid-dark across its width */}
        <linearGradient id={slatGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B4423" />
          <stop offset="45%" stopColor="#8A5C34" />
          <stop offset="60%" stopColor="#5C3B1F" />
          <stop offset="100%" stopColor="#3A2515" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#2A1A0C" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Door frame (photographic wood grain) */}
      <rect x="0" y="0" width="500" height="1000" fill={`url(#${woodPatternId})`} />
      <rect x="0" y="0" width="500" height="1000" fill="#2A1A0C" opacity="0.08" />

      {/* Outer frame edge */}
      <rect x="6" y="6" width="488" height="988" fill="none" stroke="#2A1A0C" strokeWidth="4" opacity="0.55" />

      {/* Hanji paper behind the lattice, with warm light filtering through */}
      <rect x={lx} y={ly} width={lw} height={lh} fill={`url(#${paperPatternId})`} />
      <rect x={lx} y={ly} width={lw} height={lh} fill={`url(#${glowId})`} />

      {/* Bitsal comb-lattice: dense rounded verticals (casting soft shadows) + sparse horizontal rails */}
      <g filter={`url(#${shadowId})`}>
        {vLines.map((x, i) => (
          <rect key={`v${i}`} x={x - 2.2} y={ly} width="4.4" height={lh} rx="1.6" fill={`url(#${slatGradId})`} />
        ))}
        {hLines.map((y, i) => (
          <rect key={`h${i}`} x={lx} y={y - 3.5} width={lw} height="7" rx="1.8" fill={frame} />
        ))}
      </g>

      {/* Lattice frame border */}
      <rect x={lx} y={ly} width={lw} height={lh} fill="none" stroke={frame} strokeWidth="11" />
      <rect x={lx} y={ly} width={lw} height={lh} fill="none" stroke="#2A1A0C" strokeWidth="1.5" opacity="0.4" />

      {/* Decorative hinge caps, top corners */}
      <circle cx={lx + 14} cy={ly + 8} r="9" fill="#241708" opacity="0.85" />
      <circle cx={lx + lw - 14} cy={ly + 8} r="9" fill="#241708" opacity="0.85" />

      {/* Lower solid wood kick panel */}
      <rect x={lx} y={ly + lh + 12} width={lw} height="222" fill={`url(#${woodPatternId})`} />
      <rect x={lx} y={ly + lh + 12} width={lw} height="222" fill="none" stroke={frame} strokeWidth="9" />
      <rect x={lx + 18} y={ly + lh + 30} width={lw - 36} height="186" fill="none" stroke={lattice} strokeWidth="2" opacity="0.4" />

      {/* Door pull ring hardware, at page mid-height where the two doors meet */}
      <rect x={handleX - 16} y={handleY - 22} width="32" height="44" rx="4" fill="#241708" opacity="0.9" />
      <circle cx={handleX} cy={handleY} r="13" fill="none" stroke="#C8A860" strokeWidth="4" />
    </svg>
  );
}

export function GateScreen({ onComplete }: { onComplete: () => void }) {
  const [opening, setOpening] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  // 동작 줄이기 사용자는 애니메이션 대기 없이 즉시 통과
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_MS = prefersReduced ? 150 : GATE_OPEN_DURATION_MS;
  const HOLD_MS = prefersReduced ? 0 : SCENE_HOLD_MS;
  const FADE_MS = prefersReduced ? 100 : FADE_OUT_MS;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), VISIBLE_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // 진행 중 타이머 정리 (열림 도중 언마운트 대비)
  useEffect(() => {
    if (!opening) return;
    // 문 열림 → 장면 감상 → 페이드아웃 → 다음 화면
    const fadeTimer = setTimeout(() => setFading(true), OPEN_MS + HOLD_MS);
    const doneTimer = setTimeout(onComplete, OPEN_MS + HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [opening, onComplete, OPEN_MS, HOLD_MS, FADE_MS]);

  const handleOpen = () => setOpening(true);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-background"
      style={{ perspective: "1800px" }}
    >
      {/* Scene revealed behind the doors as they open, with a gentle forward zoom */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${gateSceneImg})`,
          backgroundColor: "#6B4423",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          transform: opening ? "scale(1.08)" : "scale(1)",
          transition: "transform 3.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Left door — swings open on its hinge, away from the viewer, like being pushed */}
      <div
        className="absolute top-0 left-0 w-1/2 h-full"
        style={{
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transform: opening ? "rotateY(-112deg)" : "rotateY(0deg)",
          transition: "transform 2.8s cubic-bezier(0.32, 0, 0.2, 1)",
          willChange: "transform",
          boxShadow: opening ? "24px 0 48px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <DoorPanel side="left" />
      </div>

      {/* Right door */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{
          transformOrigin: "right center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          transform: opening ? "rotateY(112deg)" : "rotateY(0deg)",
          transition: "transform 2.8s cubic-bezier(0.32, 0, 0.2, 1)",
          willChange: "transform",
          boxShadow: opening ? "-24px 0 48px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <DoorPanel side="right" />
      </div>

      {/* Center seam line */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-[#2E1E08] z-[5]"
        style={{ opacity: opening ? 0 : 1, transition: "opacity 0.2s ease" }}
      />

      {/* 우상단 스킵 버튼 — 문이 열리는 동안에도 노출 */}
      <button
        onClick={onComplete}
        className="absolute top-5 right-6 z-20 text-xs tracking-[0.2em] uppercase text-[#FAF5E8]/70 hover:text-[#FAF5E8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF5E8] px-3 py-2"
      >
        건너뛰기 →
      </button>

      {/* Button overlay */}
      <div
        className="absolute inset-0 z-10 flex items-end justify-center pb-[18vh]"
        style={{
          opacity: opening ? 0 : visible ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: opening ? "none" : "auto",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-px h-10 bg-[#B09060]" />
          <button
            onClick={handleOpen}
            aria-expanded={opening}
            aria-label="명가작명소 입장하기"
            className="group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF5E8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A2515]"
          >
            {/* 한지 현판: 어두운 문 위에서도 문구가 또렷하게 읽히도록 */}
            <span className="flex flex-col items-center gap-1.5 px-7 py-3.5 bg-[#FAF5E8]/95 border border-[#B09060] shadow-[0_4px_18px_rgba(26,14,4,0.45)] group-hover:bg-[#FAF5E8] transition-colors">
              <span className="text-[15px] font-semibold text-[#2E1E08] tracking-[0.08em] break-keep group-hover:text-primary transition-colors">
                원하는 이름을 지어보세요
              </span>
              <span className="text-[10px] text-[#8A7050] tracking-[0.24em] uppercase">
                Click to open
              </span>
            </span>
            <div className="w-9 h-9 bg-[#FAF5E8]/90 border border-[#B09060] rounded-full flex items-center justify-center group-hover:border-primary group-hover:bg-[#FAF5E8] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 transition-all">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-[#2E1E08] group-hover:text-primary transition-colors"
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* 페이드아웃 오버레이 — 장면 감상 후 배경색으로 부드럽게 덮으며 다음 화면으로 전환 */}
      <div
        className="absolute inset-0 z-30 bg-background pointer-events-none"
        style={{
          opacity: fading ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
 