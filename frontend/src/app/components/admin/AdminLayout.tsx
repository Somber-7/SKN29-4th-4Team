// @ts-nocheck
import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  MessageCircleQuestion,
  HelpCircle,
  Users,
  Menu,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-transparent.webp";
import { ImageWithFallback } from "@/app/components/common/ImageWithFallback";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";

export interface AdminNavItem {
  /** AdminApp.tsx 라우트와 1:1 대응하는, /manage 기준 상대 경로 */
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: string;
}

/**
 * 관리자 사이드바 메뉴 — 계획서 §11 확장성 원칙("화면 추가 = 라우트 1줄 + 메뉴 항목 1개").
 * 화면을 추가하려면 여기 항목을 더하고 AdminApp.tsx에 <Route>를 하나 추가하면 된다.
 * Phase 1~3에서 문의·FAQ·공지·통계·계정·감사 항목이 이어서 붙는다.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { path: "dashboard", label: "대시보드", icon: LayoutDashboard },
  // { path: "posts", label: "게시물 관리", icon: BookOpenText },
  { path: "notices", label: "공지사항 관리", icon: Megaphone },
  { path: "inquiries", label: "문의 관리", icon: MessageCircleQuestion },
  { path: "faqs", label: "FAQ 관리", icon: HelpCircle },
  { path: "users", label: "사용자 관리", icon: Users },
  { path: "accounts", label: "계정 관리", icon: ShieldCheck, permission: "accounts.manage" },
  // { path: "audit-logs", label: "감사 로그", icon: ShieldCheck, permission: "audit.view" },
  { path: "settings", label: "설정", icon: Settings, permission: "settings.manage" },
];

function NavList({ onSelect }: { onSelect?: () => void }) {
  const { hasPermission } = useAdminAuth();
  return (
    <ul className="space-y-0.5">
      {ADMIN_NAV.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.path}>
            <NavLink
              to={`/${item.path}`}
              onClick={onSelect}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  isActive
                    ? "border-primary bg-secondary text-primary font-medium"
                    : "border-transparent text-label hover:bg-secondary/60 hover:text-foreground"
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 관리자 공통 레이아웃 — 일반 GNB/푸터와 분리된 영역(별도 번들, /manage/).
 * 데스크톱: 좌측 사이드바 / 태블릿 이하: 헤더 햄버거 → 드로어(Sheet).
 * 브레드크럼 + 페이지 타이틀 + 우측 액션의 일관된 페이지 헤더 패턴 제공.
 * 활성 메뉴 판정과 이동은 react-router NavLink/useNavigate가 직접 처리한다
 * (사용자 번들의 Screen 기반 onNavigate 어댑터는 쓰지 않는다 — 완전히 분리된 라우터).
 */
export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  /** 페이지 헤더 우측 액션 버튼 영역 */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("로그아웃되었습니다.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 관리자 상단 바 */}
      <header className="sticky top-0 z-40 h-14 bg-background/96 backdrop-blur-sm border-b border-border flex items-center gap-3 px-4 sm:px-6">
        {/* 모바일 드로어 트리거 */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center text-label hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="관리자 메뉴 열기"
            >
              <Menu size={19} aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-background">
            <SheetHeader className="px-4 pt-5 pb-2 text-left">
              <SheetTitle className="text-sm font-medium text-foreground">
                관리자 메뉴
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="관리자 메뉴" className="pt-2">
              <NavList onSelect={() => setDrawerOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>

        <ImageWithFallback src={logoImg} alt="명가작명소 로고" className="h-8 w-auto object-contain" />
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase bg-primary text-primary-foreground">
          Admin
        </span>
        
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* 별도 번들(다른 진입점)로 나가는 이동이라 라우터 navigate가 아닌 실제 링크를 쓴다 */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-label hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <ExternalLink size={13} aria-hidden="true" />
            <span className="hidden sm:inline">사이트로 이동</span>
          </a>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-label hover:text-destructive transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
          >
            <LogOut size={13} aria-hidden="true" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* 데스크톱 사이드바 */}
        <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border bg-white">
          <nav aria-label="관리자 메뉴" className="sticky top-14 py-4">
            <NavList />
            <div className="mt-8 px-4">
              <p
                className="font-hanja text-5xl text-primary opacity-[0.06] select-none"
                aria-hidden="true"
              >
                名家
              </p>
            </div>
          </nav>
        </aside>

        {/* 본문 */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* 브레드크럼 */}
          <nav aria-label="현재 위치" className="mb-4">
            <ol className="flex items-center gap-2 text-xs text-caption">
              <li>관리자</li>
              <li aria-hidden="true">/</li>
              <li className="text-label font-medium" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>

          {/* 페이지 헤더: 타이틀 + 설명 + 우측 액션 */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-ink mt-1 break-keep">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
