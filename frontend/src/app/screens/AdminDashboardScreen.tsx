import { TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AdminStat } from "@/app/types";
import { useAdminDashboard } from "@/app/hooks/useAdminDashboard";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { Reveal } from "@/app/components/common/Reveal";
import { useCountUp } from "@/app/hooks/useCountUp";
import { useAdminActiveUsers } from "@/app/hooks/useAdminApiUsage";


// 하드코딩 hex 대신 theme.css 토큰을 직접 참조 (recharts SVG 속성은 var()를 그대로 해석한다)
const BRAND = "var(--color-primary)";
const BRAND_LIGHT = "var(--color-accent)";
const GRID = "var(--color-border)";
const AXIS_LABEL = "var(--color-caption)";

function StatCard({ stat }: { stat: AdminStat }) {
  const value = useCountUp(stat.value, 750);
  const positive = stat.delta >= 0;
  return (
    <div className="bg-white border border-border p-5 transition-all duration-300 hover:border-switch-background hover:shadow-[0_4px_24px_rgba(107,78,46,0.08)]">
      <p className="text-xs text-caption mb-2">{stat.label}</p>
      <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">
        {value.toLocaleString()}
        {stat.suffix && (
          <span className="text-sm font-normal text-ink ml-1">{stat.suffix}</span>
        )}
      </p>
      <p
        className={`inline-flex items-center gap-1 text-[11px] mt-2 ${
          positive ? "text-pine" : "text-destructive"
        }`}
      >
        {positive ? (
          <TrendingUp size={12} aria-hidden="true" />
        ) : (
          <TrendingDown size={12} aria-hidden="true" />
        )}
        전주 대비 {positive ? "+" : ""}
        {stat.delta}%
      </p>
    </div>
  );
}

export function AdminDashboardScreen() {
  const { data } = useAdminDashboard();
  const { data: activeUsersData } = useAdminActiveUsers();
  const stats = data?.stats ?? [];
  const weeklyRequests = data?.weeklyRequests ?? [];
  const sourceDistribution = data?.sourceDistribution ?? [];
  const recentRequests = data?.recentRequests ?? [];


  return (
    <AdminLayout
      title="대시보드"
      description="오늘의 작명 요청과 서비스 지표를 한눈에 확인합니다."
    >
      {/* 요약 카드 — 카운트업 + 스태거 등장 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 70}>
            <StatCard stat={stat} />
          </Reveal>
        ))}
        <Reveal delay={stats.length * 70}>
          <div className="bg-white border border-border p-5 h-full transition-all duration-300 hover:border-switch-background hover:shadow-[0_4px_24px_rgba(107,78,46,0.08)] flex flex-col justify-between">
            <div>
              <p className="text-xs text-caption mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pine animate-pulse" />
                실시간 로그인 접속자
              </p>
              <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">
                {activeUsersData?.loggedInCount ?? 0}
                <span className="text-sm font-normal text-ink ml-1">명</span>
              </p>
            </div>
            <p className="text-[10px] text-caption mt-2 pt-2 border-t border-border/40">최근 3분 내 활동 유저 수</p>
          </div>
        </Reveal>
      </div>

      {/* 차트 영역 — ResponsiveContainer로 유동 리사이즈 */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <Reveal className="xl:col-span-3">
          <section className="bg-white border border-border p-5 h-full">
            <h2 className="text-sm font-medium text-foreground mb-1">주간 작명 요청 추이</h2>
            <p className="text-[11px] text-caption mb-4">최근 7일 · 요청 건수와 생성된 추천 이름 수</p>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyRequests} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mgArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS_LABEL }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS_LABEL }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      border: `1px solid ${GRID}`,
                      borderRadius: 0,
                      boxShadow: "0 4px 24px rgba(107,78,46,0.08)",
                    }}
                  />
                  <Area type="monotone" dataKey="요청" stroke={BRAND} strokeWidth={2} fill="url(#mgArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>

        <Reveal delay={80} className="xl:col-span-2">
          <section className="bg-white border border-border p-5 h-full">
            <h2 className="text-sm font-medium text-foreground mb-1">근거 출처 인용 분포</h2>
            <p className="text-[11px] text-caption mb-4">이번 주 · 추천 이름에 인용된 출처 유형</p>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceDistribution} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: AXIS_LABEL }} axisLine={{ stroke: GRID }} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: AXIS_LABEL }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: "rgba(107,78,46,0.05)" }}
                    contentStyle={{
                      fontSize: 12,
                      border: `1px solid ${GRID}`,
                      borderRadius: 0,
                      boxShadow: "0 4px 24px rgba(107,78,46,0.08)",
                    }}
                  />
                  <Bar dataKey="count" name="인용 횟수" fill={BRAND_LIGHT} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>
      </div>

      {/* 최근 요청 테이블 — 모바일 가로 스크롤 + 가장자리 그라데이션 힌트 */}
      <Reveal delay={120}>
        <section className="bg-white border border-border">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="text-sm font-medium text-foreground">최근 작명 요청</h2>
              <p className="text-[11px] text-caption mt-0.5">실시간 최근 5건</p>
            </div>
            {/* 
            <button
              onClick={() => navigate("/notices")}
              className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              공지사항 관리 →
            </button>
            */}
          </div>
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-border bg-secondary/50 text-left">
                    <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption whitespace-nowrap">시각</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">요청자</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption w-full">요청 내용</th>
                    <th scope="col" className="px-4 py-2.5 text-xs font-medium text-caption whitespace-nowrap">추천</th>
                    <th scope="col" className="px-5 py-2.5 text-xs font-medium text-caption whitespace-nowrap">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors duration-150"
                    >
                      <td className="px-5 py-3 text-xs text-ink whitespace-nowrap tabular-nums">{r.time}</td>
                      <td className="px-4 py-3 text-xs text-ink whitespace-nowrap">{r.user}</td>
                      <td className="px-4 py-3 text-xs text-foreground break-keep min-w-[220px]">“{r.query}”</td>
                      <td className="px-4 py-3 text-xs text-ink tabular-nums">{r.results}개</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap ${
                            r.status === "완료"
                              ? "bg-pine/8 text-pine border-pine/25"
                              : "bg-hanji text-primary border-border-warm"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 스크롤 가능 힌트 (모바일) */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
              aria-hidden="true"
            />
          </div>
        </section>
      </Reveal>
      </AdminLayout>
  );
}

