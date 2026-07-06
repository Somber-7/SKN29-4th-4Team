import type { Screen } from "@/app/types";
import logoImg from "@/assets/logo-transparent.webp";
import { ImageWithFallback } from "@/app/components/common/ImageWithFallback";

interface FooterProps {
  onNavigate?: (s: Screen) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  // Hash navigation fallback to work globally on all screens
  const link = (label: string, screen: Screen) => (
    <button
      onClick={() => {
        if (onNavigate) {
          onNavigate(screen);
        } else {
          window.location.hash = `/${screen}`;
        }
      }}
      className="hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white cursor-pointer"
    >
      {label}
    </button>
  );

  return (
    <footer className="bg-[#111111] text-white w-full z-10">
      {/* Main info row */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
        {/* Logo */}
        <div className="flex-shrink-0 w-40">
          <ImageWithFallback
            src={logoImg}
            alt="명가작명소 로고"
            className="h-20 w-auto object-contain invert"
          />
        </div>

        {/* Company info */}
        <div className="flex-1 text-[13px] text-[#AAAAAA] space-y-1.5 text-left">
          <div className="flex flex-wrap gap-x-8 gap-y-1">
            <span>
              <span className="text-[#999] mr-2">Company</span>
              <span className="text-[#EDEDED]">SK Networks Family AI Camp</span>
            </span>
            <span>
              <span className="text-[#999] mr-2">Email</span>
              <span className="text-[#EDEDED]">SKN29@team4.co.kr</span>
            </span>
          </div>
          <div>
            <span className="text-[#999] mr-2">Address</span>
            <span className="text-[#EDEDED]">서울 금천구 가산디지털1로 25 18층 플레이데이터</span>
          </div>
        </div>

        {/* SNS icons */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            aria-label="카카오톡"
            className="w-9 h-9 rounded-full border border-[#444] flex items-center justify-center text-[#AAAAAA] hover:text-white hover:border-[#888] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.813 2 11.5c0 3.003 1.863 5.642 4.688 7.188l-.94 3.437a.25.25 0 0 0 .375.28L10.094 20A11.77 11.77 0 0 0 12 20.1c5.523 0 10-3.813 10-8.5C22 6.813 17.523 3 12 3Z" />
            </svg>
          </button>
          <a
            href="https://www.instagram.com/p/DaSMUo9kevr/?img_index=1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="인스타그램"
            className="w-9 h-9 rounded-full border border-[#444] flex items-center justify-center text-[#AAAAAA] hover:text-white hover:border-[#888] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://github.com/Somber-7/SKN29-4th-4Team"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="w-9 h-9 rounded-full border border-[#444] flex items-center justify-center text-[#AAAAAA] hover:text-white hover:border-[#888] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <a
            href="https://networks-aicamp.io/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SK Networks AI Camp"
            className="w-9 h-9 rounded-full border border-[#444] flex items-center justify-center text-[#AAAAAA] hover:text-white hover:border-[#888] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white font-black text-xs font-sans tracking-tighter"
          >
            SK
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#2A2A2A]" />

      {/* Bottom links */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex flex-col md:flex-row items-center gap-y-3 gap-x-6 text-[12px] text-[#888]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {link("자주 묻는 질문", "faq")}
          <span>·</span>
          {link("문의하기", "contact")}
          <span>·</span>
          {link("개인정보처리방침", "privacy")}
          <span>·</span>
          {link("이용약관", "terms")}
        </div>
        <span className="md:ml-auto text-[11px] text-[#666] text-center md:text-right">
          본 서비스의 추천 결과는 참고용 정보이며 법적 효력이 없습니다 · © 2026 명가작명소
        </span>
      </div>
    </footer>
  );
}
