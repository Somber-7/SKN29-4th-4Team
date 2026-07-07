export const TREND_NAMES_BOY: any[] = [];
export const TREND_NAMES_GIRL: any[] = [];
export const TOTAL_TREND_COMBINED: any[] = [];
export const TREND_META: any = {};
export const INSIGHT_CARDS: any[] = [];
export const INSIGHT_CATEGORY_LABELS: any = {};
export const INSIGHT_ARTICLES: any[] = [];
export type InsightCategory = string;
export interface InsightArticle {
  id: number;
  category: InsightCategory;
  title: string;
  summary: string;
  paragraphs: string[];
  views: number;
  date: string;
  thumbnailUrl?: string;
  url: string;
  createdAt: string;
}
