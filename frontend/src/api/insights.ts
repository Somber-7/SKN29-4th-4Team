// ─── 이름 트렌드(인사이트) 도메인 API (Django 예정) ────────────────────────────
// TODO(API): GET /api/insights 로 대체 — 통계청 출생신고 통계·대법원 전산 데이터 집계

import { USE_MOCK, apiClient, mockDelay } from "./client";
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

export interface InsightsBundle {
  trendNamesBoy: typeof TREND_NAMES_BOY;
  trendNamesGirl: typeof TREND_NAMES_GIRL;
  totalTrendCombined: typeof TOTAL_TREND_COMBINED;
  trendMeta: typeof TREND_META;
  insightCards: typeof INSIGHT_CARDS;
  categoryLabels: Record<InsightCategory, string>;
  articles: InsightArticle[];
}

export interface InsightsApi {
  getBundle(): Promise<InsightsBundle>;
}

const MOCK_BUNDLE: InsightsBundle = {
  trendNamesBoy: TREND_NAMES_BOY,
  trendNamesGirl: TREND_NAMES_GIRL,
  totalTrendCombined: TOTAL_TREND_COMBINED,
  trendMeta: TREND_META,
  insightCards: INSIGHT_CARDS,
  categoryLabels: INSIGHT_CATEGORY_LABELS,
  articles: INSIGHT_ARTICLES,
};

const mockAdapter: InsightsApi = {
  getBundle: () => mockDelay(MOCK_BUNDLE, 0),
};

const realAdapter: InsightsApi = {
  getBundle: () => apiClient.get<InsightsBundle>("/insights"),
};

export const insightsApi: InsightsApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 useInsights 훅의 initialData로 재사용 */
export const MOCK_INSIGHTS_BUNDLE = MOCK_BUNDLE;
