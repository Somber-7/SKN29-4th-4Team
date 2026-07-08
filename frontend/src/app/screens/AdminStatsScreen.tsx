// @ts-nocheck
import { Activity, Database, Server } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { Reveal } from "@/app/components/common/Reveal";
import { useAdminHealth, useAdminStats } from "@/app/hooks/useAdminStats";

const GRID = "var(--color-border)";
const BRAND = "var(--color-primary)";
const ACCENT = "var(--color-accent)";

function SummaryCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="bg-white border border-border p-4">
      <p className="text-xs text-caption mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-normal text-ink">{suffix}</span>
      </p>
    </div>
  );
}

export function AdminStatsScreen() {
  const { data } = useAdminStats({ period: "daily" });
  const { data: health } = useAdminHealth();
  const points = data?.points ?? [];
  const summary = data?.summary;
  const sourceDistribution = data?.sourceDistribution ?? [];

  return (
    <AdminLayout title="통계·헬스" description="운영 지표와 시스템 상태를 확인합니다.">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <SummaryCard label="가입" value={summary?.signups ?? 0} suffix="명" />
        <SummaryCard label="로그인" value={summary?.logins ?? 0} suffix="회" />
        <SummaryCard label="작명 요청" value={summary?.namingRequests ?? 0} suffix="건" />
        <SummaryCard label="문의 접수" value={summary?.inquiries ?? 0} suffix="건" />
        <SummaryCard label="답변 대기" value={summary?.pendingInquiries ?? 0} suffix="건" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <Reveal className="xl:col-span-3">
          <section className="bg-white border border-border p-5">
            <h2 className="text-sm font-medium text-foreground mb-1">일별 운영 지표</h2>
            <p className="text-[11px] text-caption mb-4">최근 집계된 DailyMetric 기준</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="namingRequests" name="작명 요청" stroke={BRAND} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="signups" name="가입" stroke={ACCENT} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="inquiries" name="문의" stroke="var(--color-pine)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>

        <Reveal delay={80} className="xl:col-span-2">
          <section className="bg-white border border-border p-5">
            <h2 className="text-sm font-medium text-foreground mb-1">출처 분포</h2>
            <p className="text-[11px] text-caption mb-4">추천 결과에 포함된 근거 유형</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceDistribution} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Bar dataKey="count" name="인용" fill={ACCENT} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <section className="bg-white border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-primary" aria-hidden="true" />
            <h2 className="text-sm font-medium text-foreground">시스템 헬스</h2>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {(health?.services ?? []).map((service) => (
              <div key={service.name} className="border border-border px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  {service.name === "PostgreSQL" ? <Database size={14} /> : <Activity size={14} />}
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                </div>
                <p className={`text-xs ${service.status === "error" ? "text-destructive" : "text-caption"}`}>
                  {service.status} · {service.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </AdminLayout>
  );
}
