import React, { type ButtonHTMLAttributes } from "react";
import { cn } from "@/app/components/ui/utils";

/**
 * 화면 전반에서 반복되던 "검은 배경 + 브라운 호버" CTA 버튼.
 * 색상/호버/포커스 스타일은 여기 고정하고, 크기(padding)나 위치(relative 등)는
 * 호출부에서 className으로 전달한다.
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "bg-foreground text-background text-sm font-medium hover:bg-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-35 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

/**
 * 테두리만 있는 보조 액션 버튼. tone="destructive"면 호버 시 위험 동작 색으로 강조.
 */
export const GhostButton = React.forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "destructive" }>(
  ({ className, tone = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "border border-border text-muted-foreground transition-colors focus:outline-none focus-visible:ring-1",
          tone === "destructive"
            ? "hover:border-destructive hover:text-destructive focus-visible:ring-destructive"
            : "hover:border-primary hover:text-primary focus-visible:ring-primary",
          className,
        )}
        {...props}
      />
    );
  }
);
GhostButton.displayName = "GhostButton";
