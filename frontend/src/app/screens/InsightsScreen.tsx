import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, TrendingUp, TrendingDown, Minus, Search, Clock3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Screen } from "@/app/types";
import type { InsightArticle, InsightCategory } from "@/api/insights";
import { useInsights } from "@/app/hooks/useInsights";
import { PageHeader } from "@/app/components/common/PageHeader";
import { EmptyState } from "@/app/components/common/EmptyState";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton, GhostButton } from "@/app/components/common/Button";
import { Footer } from "@/app/components/layout/Footer";

// 하드코딩 hex 대신 theme.css 토큰을 직접 참조 (recharts SVG 속성은 var()를 그대로 해석한다)
const GRID = "var(--color-border)";
const AXIS_LABEL = "var(--color-caption)";
const LINE_COLOR = "var(--color-primary)";

type Gender = "boy" | "girl";
type ArticleFilter = "all" | InsightCategory;
type SortOrder = "latest" | "popular";

/** 카테고리별 상징 한자 (카드 워터마크) */
const CATEGORY_HANJA: Record<InsightCategory, string> = {
  trend: "勢",
  hanja: "字",
  guide: "導",
};

const CATEGORY_BADGE_STYLES: Record<InsightCategory, string> = {
  trend: "text-gold-text bg-hanji border-gold-border/30",
  hanja: "text-gold-text bg-hanji border-gold-border/30",
  guide: "text-pine bg-pine/8 border-pine/25",
};

/** 이 날짜 이후 글에 NEW 배지 (시안 기준일: 2026.07.03 기준 최근 한 달) */
const NEW_SINCE = "2026.06.03";
/** 조회수가 이 값을 넘으면 인기 배지 */
const POPULAR_VIEWS = 4000;

/** 본문 글자 수 기반 예상 읽기 시간 (분) */
function readingMinutes(article: InsightArticle): number {
  const chars = article.paragraphs.join("").length;
  return Math.max(1, Math.round(chars / 350));
}

function CategoryBadge({
  category,
  categoryLabels,
}: {
  category: InsightCategory;
  categoryLabels: Record<InsightCategory, string>;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border ${CATEGORY_BADGE_STYLES[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}

function ArticleBadges({ article }: { article: InsightArticle }) {
  return (
    <>
      {article.date >= NEW_SINCE && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary text-white">
          NEW
        </span>
      )}
      {article.views >= POPULAR_VIEWS && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded border border-red-300/60 text-red-500/80 bg-red-50">
          인기
        </span>
      )}
    </>
  );
}

function ArticleMeta({ article }: { article: InsightArticle }) {
  return (
    <p className="flex items-center gap-3 text-[11px] text-hint">
      <span className="tabular-nums">{article.date}</span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Eye size={11} aria-hidden="true" />
        {article.views.toLocaleString()}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock3 size={11} aria-hidden="true" />
        {readingMinutes(article)}분
      </span>
    </p>
  );
}

/** 전년 대비 순위 변동 표시 */
function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-pine">
        <TrendingUp size={10} aria-hidden="true" />
        {delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive/70">
        <TrendingDown size={10} aria-hidden="true" />
        {Math.abs(delta)}
      </span>
    );
  return (
    <span className="inline-flex items-center text-[10px] font-bold text-faint">
      <Minus size={10} aria-hidden="true" />
    </span>
  );
}

// ─── 아티클 전문 모달 뷰어 ────────────────────────────────────────────────────

function ArticleModal({
  article,
  articles,
  categoryLabels,
  onClose,
  onOpenArticle,
  onNavigate,
}: {
  article: InsightArticle;
  /** 관련 글 계산용 전체 아티클 목록 */
  articles: InsightArticle[];
  categoryLabels: Record<InsightCategory, string>;
  onClose: () => void;
  /** 관련 글로 이동 (모달 내용 교체) */
  onOpenArticle: (a: InsightArticle) => void;
  onNavigate: (s: Screen) => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const related = articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 2);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={article.title}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-border-warm rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(26,14,4,0.25)] relative"
        style={{ animation: "mg-fadein 0.25s ease forwards" }}
      >
        {/* 카테고리 한자 워터마크 */}
        <span
          className="font-hanja pointer-events-none select-none absolute -top-6 right-6 text-[130px] leading-none text-primary opacity-[0.04]"
          aria-hidden="true"
        >
          {CATEGORY_HANJA[article.category]}
        </span>

        {/* Header */}
        <div className="relative px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b border-hanji">
          <button
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-foreground hover:bg-hanji transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 mb-3">
            <CategoryBadge category={article.category} categoryLabels={categoryLabels} />
            <ArticleBadges article={article} />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight break-keep leading-snug mb-3 pr-10">
            {article.title}
          </h2>
          <ArticleMeta article={article} />
        </div>

        {/* Body */}
        <div className="px-6 sm:px-10 py-7">
          {article.paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] text-ink leading-[1.9] break-keep mb-5">
              {p}
            </p>
          ))}

          {/* 관련 글 */}
          {related.length > 0 && (
            <div className="mt-8 pt-6 border-t border-hanji">
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-3">
                함께 보면 좋은 글
              </p>
              <div className="space-y-2">
                {related.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenArticle(a)}
                    className="w-full flex items-center gap-3 text-left border border-border-warm/70 rounded-xl px-4 py-3 bg-hanji/40 hover:border-gold-border hover:bg-hanji/60 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <span className="text-sm text-foreground font-medium break-keep flex-1">
                      {a.title}
                    </span>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-faint flex-shrink-0" aria-hidden="true">
                      <path d="M1 1l5 5-5 5" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-10 py-5 border-t border-hanji flex items-center justify-between gap-3">
          <p className="text-[11px] text-hint break-keep">
            본 콘텐츠는 시안 단계의 예시 데이터입니다.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <GhostButton onClick={onClose} className="px-5 py-2.5 text-xs rounded-lg">
              닫기
            </GhostButton>
            <PrimaryButton onClick={() => onNavigate("gate")} className="px-5 py-2.5 text-xs">
              이름 추천 받기 →
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── 화면 ─────────────────────────────────────────────────────────────────────

export function InsightsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { data: insights } = useInsights();
  const trendNamesBoy = insights?.trendNamesBoy ?? [];
  const trendNamesGirl = insights?.trendNamesGirl ?? [];
  const totalTrendCombined = insights?.totalTrendCombined ?? [];
  const trendMeta = insights?.trendMeta;
  const insightCards = insights?.insightCards ?? [];
  const categoryLabels = insights?.categoryLabels ?? ({} as Record<InsightCategory, string>);
  const allArticles = insights?.articles ?? [];

  const ARTICLE_FILTERS: { value: ArticleFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "trend", label: categoryLabels.trend ?? "" },
    { value: "hanja", label: categoryLabels.hanja ?? "" },
    { value: "guide", label: categoryLabels.guide ?? "" },
  ];

  const [gender, setGender] = useState<Gender>("boy");
  const genderTabRefs = useRef<Record<Gender, HTMLButtonElement | null>>({ boy: null, girl: null });
  const [filter, setFilter] = useState<ArticleFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortOrder>("latest");
  const [openArticle, setOpenArticle] = useState<InsightArticle | null>(null);
  const trendNames = gender === "boy" ? trendNamesBoy : trendNamesGirl;

  // 검색 디바운스 — 타이핑이 멈춘 뒤 250ms 후 반영
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => clearTimeout(t);
  }, [keyword]);

  const articles = useMemo(() => {
    let rows = allArticles.filter((a) => {
      if (filter !== "all" && a.category !== filter) return false;
      if (!debounced) return true;
      return (
        a.title.includes(debounced) || a.paragraphs.some((p) => p.includes(debounced))
      );
    });
    rows = [...rows].sort((a, b) =>
      sort === "popular" ? b.views - a.views : b.date.localeCompare(a.date),
    );
    return rows;
  }, [allArticles, filter, debounced, sort]);

  // 기본 보기(전체·검색 없음·최신순)에서는 최신 글을 크게 피처링
  const isDefaultView = filter === "all" && !debounced && sort === "latest";
  const featured = isDefaultView ? articles[0] : null;
  const gridArticles = featured ? articles.slice(1) : articles;

  return (
    <div className="pt-16 min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <PageHeader
          eyebrow="Insights"
          title="이름 트렌드"
          description="이름 트렌드부터 인명용 한자 상식까지 — 근거 있는 작명을 위한 데이터와 지식을 전합니다."
          watermark="識"
        />

        {/* ── 섹션 1 · 인기 이름 트렌드 대시보드 ── */}
        <Reveal>
          <section className="bg-white border border-border-warm rounded-2xl p-6 sm:p-7 mb-6 shadow-[0_8px_24px_rgba(46,30,8,0.03)]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  인기 이름 트렌드
                </h2>
                <p className="text-xs text-caption mt-1">
                  최근 5년 순위 변동과 2026 상반기 TOP 8 · 데이터는 시안 단계의 예시입니다
                </p>
              </div>
              {/* 남아/여아 탭 */}
              <div
                className="flex p-1 bg-hanji border border-border rounded-xl"
                role="tablist"
                aria-label="성별 선택"
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const next: Gender = gender === "boy" ? "girl" : "boy";
                    setGender(next);
                    genderTabRefs.current[next]?.focus();
                  }
                }}
              >
                {(
                  [
                    { value: "boy", label: "남아" },
                    { value: "girl", label: "여아" },
                  ] as { value: Gender; label: string }[]
                ).map((g) => (
                  <button
                    key={g.value}
                    ref={(el) => { genderTabRefs.current[g.value] = el; }}
                    role="tab"
                    aria-selected={gender === g.value}
                    tabIndex={gender === g.value ? 0 : -1}
                    onClick={() => setGender(g.value)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer ${
                      gender === g.value
                        ? "bg-white text-primary border border-border-warm shadow-[0_2px_8px_rgba(46,30,8,0.03)]"
                        : "text-caption hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 데이터 메타 스트립 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 mb-6 rounded-xl bg-hanji/70 border border-border/50 text-[11px] text-caption">
              <span>
                표본 <span className="font-semibold text-ink tabular-nums">{trendMeta?.sample}</span>
              </span>
              <span>
                분석 기간 <span className="font-semibold text-ink">{trendMeta?.period}</span>
              </span>
              <span>
                업데이트 <span className="font-semibold text-ink tabular-nums">{trendMeta?.updatedAt}</span>
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
              {/* 연도별 순위/등록건수 추이 */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-xs font-bold text-primary tracking-wide uppercase">
                    연도별 전체 출생신고 건수 추이 (남녀 합산)
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={totalTrendCombined} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11, fill: AXIS_LABEL }}
                        axisLine={{ stroke: GRID }}
                        tickLine={false}
                        padding={{ left: 16, right: 16 }}
                      />
                      <YAxis
                        domain={[24000, 28000]}
                        ticks={[24000, 25000, 26000, 27000, 28000]}
                        tickFormatter={(v: number) => `${v.toLocaleString()}건`}
                        tick={{ fontSize: 11, fill: AXIS_LABEL }}
                        axisLine={false}
                        tickLine={false}
                        width={76}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value ?? 0).toLocaleString()}건`, "전체 출생신고"]}
                        labelFormatter={(label) => `${label}년`}
                        contentStyle={{
                          fontSize: 12,
                          border: `1px solid ${GRID}`,
                          borderRadius: 8,
                          boxShadow: "0 4px 24px rgba(107,78,46,0.08)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={LINE_COLOR}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 0, fill: LINE_COLOR }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-hint mt-2 break-keep">
                  전체 출생신고 건수(남녀 합산)는 2022년 27,200건에서 2026년 24,800건으로 해마다 지속적인 감소세를 나타내고 있습니다.
                </p>
              </div>

              {/* 2026 상반기 TOP 8 — 인라인 바 리스트 */}
              <div>
                <h3 className="text-xs font-bold text-primary tracking-wide uppercase mb-3">
                  2026 상반기 TOP 8
                </h3>
                <ol className="space-y-1">
                  {trendNames.map((n) => {
                    const ratio = (n.count / trendNames[0].count) * 100;
                    const isTop = n.rank === 1;
                    return (
                      <li
                        key={n.rank}
                        className={`relative overflow-hidden flex items-center gap-2.5 px-3 py-[7px] rounded-xl border transition-colors ${
                          isTop
                            ? "bg-hanji/80 border-gold-border/40"
                            : "bg-hanji/50 border-border/40 hover:border-border"
                        }`}
                      >
                        {/* 인라인 비율 바 */}
                        <span
                          className={`absolute inset-y-0 left-0 pointer-events-none ${
                            isTop ? "bg-gold-border/15" : "bg-gold-border/[0.06]"
                          }`}
                          style={{ width: `${ratio}%` }}
                          aria-hidden="true"
                        />
                        <span
                          className={`relative text-[13px] font-bold font-mono w-5 tabular-nums ${
                            isTop ? "text-seal" : "text-gold-text"
                          }`}
                        >
                          {n.rank}
                        </span>
                        <span className="relative text-sm font-semibold text-foreground">{n.name}</span>
                        <span
                          className="font-hanja relative text-xs text-caption"
                          lang="ko-Hani"
                        >
                          {n.hanja}
                        </span>
                        <span className="relative ml-auto text-[11px] text-ink tabular-nums">
                          {n.count.toLocaleString()}명
                        </span>
                        <span className="relative w-7 text-right">
                          <DeltaBadge delta={n.delta} />
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="text-[10px] text-hint mt-2 text-right">전년 대비 순위 변동</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── 섹션 2 · 한눈에 보는 트렌드 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {insightCards.map((card, i) => (
            <Reveal key={card.title} delay={i * 70}>
              <div className="group relative overflow-hidden bg-white border border-border-warm rounded-2xl p-5 h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(46,30,8,0.08)]">
                <span
                  className="font-hanja pointer-events-none select-none absolute -bottom-6 -right-2 text-[90px] leading-none text-primary opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500"
                  aria-hidden="true"
                >
                  {card.hanja}
                </span>
                <h3 className="relative z-10 text-sm font-semibold text-foreground mb-1.5">
                  {card.title}
                </h3>
                <p className="relative z-10 text-xs text-ink break-keep leading-relaxed mb-3">
                  {card.desc}
                </p>
                <p className="relative z-10 text-xs font-bold text-gold-text">{card.stat}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── 섹션 3 · 정보 게시판 ── */}
        <div className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] tracking-[0.28em] text-primary uppercase mb-2">Articles</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                알아두면 좋은 작명 지식
              </h2>
            </div>
            {/* 검색 */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="제목·본문 검색"
                aria-label="아티클 검색"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-border rounded-xl placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* 카테고리 필터 + 정렬 */}
          <div className="flex flex-wrap items-center gap-2">
            {ARTICLE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  filter === f.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-label border-border hover:border-primary hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1" role="group" aria-label="정렬 순서">
              {(
                [
                  { value: "latest", label: "최신순" },
                  { value: "popular", label: "인기순" },
                ] as { value: SortOrder; label: string }[]
              ).map((s, i) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  aria-pressed={sort === s.value}
                  className={`text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                    sort === s.value ? "text-primary font-semibold" : "text-caption hover:text-foreground"
                  } ${i > 0 ? "border-l border-border pl-2 ml-1" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl mb-10">
            <EmptyState
              title="검색 결과가 없습니다"
              description={`"${debounced}"에 해당하는 글을 찾지 못했습니다. 검색어를 바꾸거나 다른 카테고리를 선택해 보세요.`}
              action={
                <GhostButton
                  onClick={() => {
                    setKeyword("");
                    setFilter("all");
                  }}
                  className="px-5 py-2.5 text-xs"
                >
                  검색 초기화
                </GhostButton>
              }
            />
          </div>
        ) : (
          <>
            {/* 피처 카드 — 최신 글 크게 */}
            {featured && (
              <Reveal>
                <button
                  onClick={() => setOpenArticle(featured)}
                  className="group relative overflow-hidden w-full text-left bg-foreground rounded-2xl p-6 sm:p-8 mb-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(46,30,8,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span
                    className="font-hanja pointer-events-none select-none absolute -bottom-10 -right-2 text-[180px] leading-none text-gold-text opacity-[0.12] group-hover:opacity-[0.18] transition-opacity duration-500"
                    aria-hidden="true"
                  >
                    {CATEGORY_HANJA[featured.category]}
                  </span>
                  <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border border-gold-border/50 text-gold-border bg-gold-border/15">
                        {categoryLabels[featured.category]}
                      </span>
                      <ArticleBadges article={featured} />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-semibold text-white tracking-tight break-keep leading-snug mb-3 group-hover:text-gold-border transition-colors">
                      {featured.title}
                    </h3>
                    <p className="text-sm text-white/60 break-keep leading-relaxed line-clamp-2 mb-4">
                      {featured.paragraphs[0]}
                    </p>
                    <p className="flex items-center gap-3 text-[11px] text-white/40">
                      <span className="tabular-nums">{featured.date}</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Eye size={11} aria-hidden="true" />
                        {featured.views.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={11} aria-hidden="true" />
                        {readingMinutes(featured)}분
                      </span>
                      <span className="ml-auto text-gold-border font-medium hidden sm:inline">
                        전문 읽기 →
                      </span>
                    </p>
                  </div>
                </button>
              </Reveal>
            )}

            {/* 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {gridArticles.map((article, i) => (
                <Reveal key={article.id} delay={Math.min(i, 6) * 60}>
                  <button
                    onClick={() => setOpenArticle(article)}
                    className="group relative overflow-hidden w-full h-full text-left bg-white border border-border-warm rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-border/50 hover:shadow-[0_16px_36px_rgba(46,30,8,0.08)] focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <span
                      className="font-hanja pointer-events-none select-none absolute -bottom-8 -right-2 text-[110px] leading-none text-primary opacity-[0.04] group-hover:opacity-[0.09] transition-opacity duration-500"
                      aria-hidden="true"
                    >
                      {CATEGORY_HANJA[article.category]}
                    </span>
                    <div className="relative z-10 flex items-center gap-1.5 mb-3">
                      <CategoryBadge category={article.category} categoryLabels={categoryLabels} />
                      <ArticleBadges article={article} />
                    </div>
                    <h3 className="relative z-10 text-[15px] font-semibold text-foreground break-keep leading-snug mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="relative z-10 text-xs text-ink break-keep leading-relaxed line-clamp-2 mb-4 flex-1">
                      {article.paragraphs[0]}
                    </p>
                    <div className="relative z-10 pt-3 border-t border-hanji">
                      <ArticleMeta article={article} />
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </>
        )}

        {/* 하단 CTA */}
        <Reveal delay={80}>
          <div className="bg-secondary border border-border-warm rounded-2xl px-6 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground mb-1 break-keep">
                트렌드를 확인하셨다면, 이제 우리 아이 이름 차례입니다
              </h2>
              <p className="text-sm text-ink break-keep">
                지금 바로 우리 아이에게 어울리는, 근거 있는 이름을 추천받아 보세요.
              </p>
            </div>
            <PrimaryButton
              onClick={() => onNavigate("gate")}
              className="px-6 py-3 text-sm shrink-0 self-start sm:self-auto"
            >
              이름 추천 받기 →
            </PrimaryButton>
          </div>
        </Reveal>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* 아티클 전문 모달 — openArticle 상태는 카드/피처드 클릭(setOpenArticle)으로 열린다 */}
      {openArticle && (
        <ArticleModal
          article={openArticle}
          articles={allArticles}
          categoryLabels={categoryLabels}
          onClose={() => setOpenArticle(null)}
          onOpenArticle={setOpenArticle}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
