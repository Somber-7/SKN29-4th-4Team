// ─── 이름 트렌드(인사이트) 도메인 API (Django 예정) ────────────────────────────
// TODO(API): GET /api/insights 로 대체 — 통계청 출생신고 통계·대법원 전산 데이터 집계

import { apiClient, mockDelay } from "./client";
import {
  INSIGHT_ARTICLES,
  INSIGHT_CARDS,
  INSIGHT_CATEGORY_LABELS,
  TOTAL_TREND_COMBINED,
  TREND_META,
  TREND_NAMES_BOY,
  TREND_NAMES_GIRL,
  type InsightArticle,
  type InsightCategory,
} from "./mock/insights.mock";

export type { InsightArticle, InsightCategory };

export interface TrendNameItem {
  rank: number;
  name: string;
  hanja: string;
  count: number;
  delta: number;
}

export interface InsightsBundle {
  trendsByYear: Record<number, TrendNameItem[]>;
  availableYears: number[];
  totalTrendCombined: { year: string; count: number }[];
  trendMeta: { sample: string; period: string; updatedAt: string };
  insightCards: { title: string; desc: string; stat: string; hanja: string }[];
  categoryLabels: Record<InsightCategory, string>;
  articles: InsightArticle[];
}

export interface InsightsApi {
  getBundle(): Promise<InsightsBundle>;
}

const realAdapter: InsightsApi = {
  getBundle: () => apiClient.get<InsightsBundle>("/insights"),
};

export const insightsApi: InsightsApi = realAdapter;
