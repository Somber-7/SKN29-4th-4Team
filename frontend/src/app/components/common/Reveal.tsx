import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 스크롤 등장 애니메이션 래퍼 (IntersectionObserver, 최초 1회만 트리거).
 * - opacity + translateY(transform)만 사용 — 레이아웃 속성 애니메이션 금지 원칙 준수
 * - delay(ms)로 목록/그리드 스태거(50~80ms 간격) 구현
 * - prefers-reduced-motion 설정 시 즉시 표시
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** 스태거 지연 (ms) */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: `opacity 0.4s ease-out ${delay}ms, transform 0.4s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
