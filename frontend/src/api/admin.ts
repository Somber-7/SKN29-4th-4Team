// ─── 관리자 도메인 API (Django 예정) ────────────────────────────────────────────
// TODO(API): GET/PUT /api/admin/* 로 대체 — 서버 RBAC(401/403 처리)가 필요하다.

import { USE_MOCK, apiClient, mockDelay } from "./client";
import type { AdminHanjaRow, AdminSourceRow, AdminStat, AdminUserRow } from "@/app/types";
import {
  ADMIN_HANJA_ROWS,
  ADMIN_SOURCE_ROWS,
  ADMIN_STATS,
  ADMIN_USER_ROWS,
  RECENT_REQUESTS,
  SOURCE_DISTRIBUTION,
  WEEKLY_REQUESTS,
} from "./mock/admin.mock";

export interface AdminDashboardBundle {
  stats: AdminStat[];
  weeklyRequests: typeof WEEKLY_REQUESTS;
  sourceDistribution: typeof SOURCE_DISTRIBUTION;
  recentRequests: typeof RECENT_REQUESTS;
}

export interface AdminContentBundle {
  hanjaRows: AdminHanjaRow[];
  sourceRows: AdminSourceRow[];
}

export interface AdminApi {
  getDashboard(): Promise<AdminDashboardBundle>;
  getContent(): Promise<AdminContentBundle>;
  getUsers(): Promise<AdminUserRow[]>;
}

const MOCK_DASHBOARD: AdminDashboardBundle = {
  stats: ADMIN_STATS,
  weeklyRequests: WEEKLY_REQUESTS,
  sourceDistribution: SOURCE_DISTRIBUTION,
  recentRequests: RECENT_REQUESTS,
};

const MOCK_CONTENT: AdminContentBundle = {
  hanjaRows: ADMIN_HANJA_ROWS,
  sourceRows: ADMIN_SOURCE_ROWS,
};

const mockAdapter: AdminApi = {
  getDashboard: () => mockDelay(MOCK_DASHBOARD, 0),
  getContent: () => mockDelay(MOCK_CONTENT, 0),
  getUsers: () => mockDelay(ADMIN_USER_ROWS, 0),
};

const realAdapter: AdminApi = {
  getDashboard: () => apiClient.get<AdminDashboardBundle>("/admin/dashboard"),
  getContent: () => apiClient.get<AdminContentBundle>("/admin/content"),
  getUsers: () => apiClient.get<AdminUserRow[]>("/admin/users"),
};

export const adminApi: AdminApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 각 admin 훅의 initialData로 재사용 */
export const MOCK_ADMIN_DASHBOARD = MOCK_DASHBOARD;
export const MOCK_ADMIN_CONTENT = MOCK_CONTENT;
export const MOCK_ADMIN_USERS = ADMIN_USER_ROWS;
