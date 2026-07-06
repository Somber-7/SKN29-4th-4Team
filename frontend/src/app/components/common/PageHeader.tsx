/**
 * 사용자용 페이지 공통 헤더 — 로그인/서비스 소개와 동일한
 * "영문 눈썹 캡션 + 타이틀 + 보조 설명 (+ 한자 워터마크)" 패턴을 반복해
 * 신규 페이지가 기존 화면과 같은 소속감을 갖게 한다.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  watermark,
  align = "center",
}: {
  /** 영문 캡션 (예: "FAQ", "Contact") */
  eyebrow: string;
  title: string;
  description?: string;
  /** 배경 한자 워터마크 (예: "問") */
  watermark?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`relative mb-10 ${align === "center" ? "text-center" : "text-left"}`}>
      {watermark && (
        <span
          className={`font-hanja pointer-events-none select-none absolute -top-10 text-[110px] leading-none text-primary opacity-[0.05] ${
            align === "center" ? "right-0 sm:-right-6" : "-right-2"
          }`}
          aria-hidden="true"
        >
          {watermark}
        </span>
      )}
      <p className="text-[10px] tracking-[0.32em] text-primary uppercase mb-3">{eyebrow}</p>
      {/* clamp() 기반 유동 타이포그래피 — 브레이크포인트 사이에서도 자연스럽게 스케일 */}
      <h1
        className="font-semibold text-foreground tracking-tight mb-2"
        style={{ fontSize: "clamp(1.625rem, 1.2rem + 1.8vw, 2.25rem)", lineHeight: 1.3 }}
      >
        {title}
      </h1>
      {description && (
        <p
          className={`text-sm text-muted-foreground break-keep leading-relaxed ${
            align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
