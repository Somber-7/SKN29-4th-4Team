import logoImg from "@/assets/logo-transparent.webp";
import { ImageWithFallback } from "@/app/components/common/ImageWithFallback";
import type { Screen } from "@/app/types";

interface NavItem {
  label: string;
  screen: Screen;
  /** 이 화면들 중 하나가 활성일 때도 하이라이트 (예: 고객센터 = faq + contact) */
  match?: Screen[];
  className?: string;
}

export function GNB({
  activeScreen,
  onNavigate,
  isLoggedIn = false,
  isAdmin = false,
  onLogout,
}: {
  activeScreen: Screen;
  onNavigate: (s: Screen) => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onLogout?: () => void;
}) {
  const items: NavItem[] = [
    { label: "서비스 소개", screen: "intro" },
    { label: "이름 트렌드", screen: "insights", className: "hidden sm:inline-block" },
    // 모바일에서는 GNB 대신 푸터 링크로 접근 (터치 타깃·여백 확보)
    { label: "문의·FAQ", screen: "faq", match: ["faq", "contact"], className: "hidden md:inline-block" },
    // 마이페이지는 로그인한 사용자에게만 노출 (작명 기록은 마이페이지 안에서 접근)
    ...(isLoggedIn
      ? [{ label: "마이페이지", screen: "mypage" as Screen, match: ["mypage", "history"] as Screen[] }]
      : [{ label: "로그인", screen: "login" as Screen }]),
    // 관리자에게만 노출
    ...(isAdmin
      ? [{
          label: "관리자",
          screen: "adminDashboard" as Screen,
          match: ["adminDashboard", "adminContent", "adminUsers", "adminSettings"] as Screen[],
        }]
      : []),
  ];

  const isActive = (item: NavItem) =>
    item.match ? item.match.includes(activeScreen) : activeScreen === item.screen;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/96 backdrop-blur-sm border-b border-border flex items-center pl-6 pr-8">
      <button
        onClick={() => onNavigate("landing")}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="명가작명소 홈"
      >
        <ImageWithFallback
          src={logoImg}
          alt="명가작명소 로고"
          className="h-10 w-auto object-contain"
        />
      </button>

      <nav className="ml-auto flex items-center gap-4 sm:gap-6">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className={`text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              isActive(item)
                ? "text-primary font-medium"
                : "text-label hover:text-foreground"
            } ${item.className ?? ""}`}
          >
            {item.label}
          </button>
        ))}

        {isLoggedIn && (
          <button
            onClick={onLogout}
            className="text-sm text-label hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            로그아웃
          </button>
        )}

        {isLoggedIn ? (
          <button
            onClick={() => onNavigate("gate")}
            className="px-4 py-2 text-sm font-medium bg-foreground text-background hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200"
          >
            시작하기
          </button>
        ) : (
          <button
            onClick={() => onNavigate("signup")}
            className={`px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200 ${
              activeScreen === "signup"
                ? "bg-primary text-background"
                : "bg-foreground text-background hover:bg-primary"
            }`}
          >
            회원가입
          </button>
        )}
      </nav>
    </header>
  );
}
