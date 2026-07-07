import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from "@/app/data/policyContent";
import { GhostButton, PrimaryButton } from "@/app/components/common/Button";

interface PolicyAgreementModalProps {
  kind: "terms" | "privacy";
  /** 이전에 이미 끝까지 읽은 적이 있으면 동의 버튼을 바로 활성화 */
  alreadyRead?: boolean;
  onAgree: () => void;
  onClose: () => void;
}

/** 스크롤을 끝까지 내려야 "동의하고 닫기"가 활성화되는 약관/방침 열람 모달 */
export function PolicyAgreementModal({
  kind,
  alreadyRead = false,
  onAgree,
  onClose,
}: PolicyAgreementModalProps) {
  const isTerms = kind === "terms";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const [reachedEnd, setReachedEnd] = useState(alreadyRead);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 내용이 스크롤이 필요 없을 만큼 짧은 경우(작은 화면 예외 포함)를 대비해 마운트 시 한 번 확인
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) {
      setReachedEnd(true);
    }
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 24) setReachedEnd(true);
  };

  // NameDetailModal과 동일한 이유(상위 라우트 전환 애니메이션의 transform이 fixed의
  // containing block을 바꿔버리는 문제)로 document.body에 포탈로 그려 항상 현재 뷰포트
  // 기준 정중앙에 뜨도록 한다.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isTerms ? "이용약관" : "개인정보처리방침"}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-border w-full max-w-lg max-h-[85vh] flex flex-col shadow-[0_32px_80px_rgba(26,14,4,0.25)]"
        style={{ animation: "mg-fadein 0.25s ease forwards" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase mb-2">
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {isTerms ? "이용약관" : "개인정보처리방침"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center text-faint hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto px-6 sm:px-7 py-5 flex-1">
          {sections.map((s) => (
            <section key={s.id} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-foreground mb-2 break-keep">{s.title}</h3>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="text-xs text-ink leading-[1.85] break-keep mb-2 last:mb-0">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-7 py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-[11px] text-hint break-keep">
            {reachedEnd ? "끝까지 확인하셨습니다." : "끝까지 내려서 읽어야 동의할 수 있어요."}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <GhostButton onClick={onClose} className="px-4 py-2.5 text-xs">
              닫기
            </GhostButton>
            <PrimaryButton
              onClick={onAgree}
              disabled={!reachedEnd}
              className="px-4 py-2.5 text-xs whitespace-nowrap"
            >
              동의하고 닫기
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
