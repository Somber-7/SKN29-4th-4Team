import type { ReactNode } from "react";

/**
 * 공통 빈 상태(empty state) 패턴 — 라인 일러스트 + 한 줄 카피 + CTA.
 * 검색 결과 없음, 기록 없음, 관리자 목록 비어 있음 등에 동일하게 사용해
 * "회색 박스 방치" 없이 모든 상태가 디자인된 상태를 갖게 한다.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {/* 붓과 종이 라인 일러스트 (브랜드 톤) */}
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="text-hint mb-5"
        aria-hidden="true"
      >
        {/* 한지 */}
        <rect x="14" y="20" width="34" height="40" />
        <path d="M20 30h22M20 38h22M20 46h14" strokeLinecap="round" className="text-faint" />
        {/* 붓 */}
        <path d="M52 14l8 8-16 16-9 1 1-9 16-16z" className="text-caption" />
        <path d="M45 37l-1 1" strokeLinecap="round" />
      </svg>
      <div
        className="font-hanja text-2xl text-faint mb-3 select-none"
        aria-hidden="true"
      >
        空
      </div>
      <h3 className="text-base font-medium text-foreground mb-1.5 break-keep">{title}</h3>
      {description && (
        <p className="text-sm text-ink break-keep max-w-sm leading-relaxed mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
