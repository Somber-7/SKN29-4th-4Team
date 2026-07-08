// ─── 관리자 도메인 API (Django 예정) ────────────────────────────────────────────
// TODO(API): GET/PUT /api/admin/* 로 대체 — 서버 RBAC(401/403 처리)가 필요하다.

import { USE_MOCK, apiClient, mockDelay } from "./client";
import type {
  AdminAccount,
  AdminActivityLogItem,
  AdminApprovalStatus,
  AdminAuditLogItem,
  AdminFaqCategory,
  AdminFaqDetail,
  AdminFaqRow,
  AdminHealth,
  AdminInquiryDetail,
  AdminInquiryRow,
  AdminInquiryStatus,
  AdminNoticeDetail,
  AdminNoticeRow,
  AdminNoticeStatus,
  AdminPage,
  AdminPostCategory,
  AdminPostDetail,
  AdminPostRow,
  AdminPostStatus,
  AdminRecentRequest,
  AdminRole,
  AdminSourceDistribution,
  AdminStat,
  AdminStatsBundle,
  AdminUserDetail,
  AdminUserRow,
  AdminUserStatus,
  AdminWeeklyRequest,
  SiteTextSetting,
  AdminInquiryTemplate,
  ApiUsageStats,
  ApiErrorLogItem,
} from "@/app/types";
import {
  ADMIN_ACCOUNTS,
  ADMIN_INQUIRIES,
  ADMIN_NOTICES,
  ADMIN_POST_CATEGORIES,
  ADMIN_POSTS,
  ADMIN_STATS,
  ADMIN_USER_ROWS,
  RECENT_REQUESTS,
  SITE_TEXTS,
  SOURCE_DISTRIBUTION,
  WEEKLY_REQUESTS,
} from "./mock/admin.mock";

export interface AdminDashboardBundle {
  stats: AdminStat[];
  weeklyRequests: AdminWeeklyRequest[];
  sourceDistribution: AdminSourceDistribution[];
  recentRequests: AdminRecentRequest[];
}

export interface AdminStatsQuery {
  period?: "daily" | "weekly" | "monthly";
  from?: string;
  to?: string;
}

export interface AdminAuditLogsQuery {
  action?: string;
  actor?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ─── 관리자 계정 관리 (§10, Phase 4) ───────────────────────────────────────────

export interface AdminAccountsQuery {
  role?: AdminRole;
  active?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminAccountCreateInput {
  username: string;
  displayName: string;
  role: AdminRole;
  password?: string; // create requires password
}

export interface AdminAccountUpdateInput {
  displayName?: string;
  isActiveAdmin?: boolean;
}

export interface SiteTextSettingUpdateInput {
  value: string;
}

// ─── 회원 관리 (§9·§10, Phase 1) ────────────────────────────────────────────────

export interface AdminUsersQuery {
  status?: AdminUserStatus;
  approval?: AdminApprovalStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminUserCreateInput {
  email: string;
  name: string;
  password: string;
}

export interface AdminUserUpdateInput {
  name?: string;
  email?: string;
}

export interface AdminUserApprovalInput {
  approvalStatus: AdminApprovalStatus;
  rejectedReason?: string;
}

// ─── 게시물 관리 (§9·§10, Phase 2) ──────────────────────────────────────────────

export interface AdminPostsQuery {
  status?: AdminPostStatus;
  categoryId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPostCreateInput {
  title: string;
  body: string;
  categoryId: number;
  status?: AdminPostStatus;
}

export interface AdminPostUpdateInput {
  title?: string;
  body?: string;
  categoryId?: number;
}

export interface AdminPostCategoryInput {
  name: string;
  order?: number;
}

// ─── 공지사항 관리 (§9·§10, Phase 2) ────────────────────────────────────────────

export interface AdminNoticesQuery {
  status?: AdminNoticeStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminNoticeCreateInput {
  title: string;
  body: string;
  status?: AdminNoticeStatus;
  isPinned?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export interface AdminNoticeUpdateInput {
  title?: string;
  body?: string;
  status?: AdminNoticeStatus;
  isPinned?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

// ─── 문의 관리 (§9·§10, Phase 2) ────────────────────────────────────────────────
// 접수(생성)는 공개 API(src/api/support.ts submitContact)가 전담한다 — 관리자 API는
// 목록·상세·답변만 다룬다.

export interface AdminInquiriesQuery {
  status?: AdminInquiryStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminInquiryReplyInput {
  status: AdminInquiryStatus;
  adminReply?: string;
}

// ─── FAQ 관리 (§9·§10, Phase 2 — 관리자 CRUD만) ─────────────────────────────────

export interface AdminFaqsQuery {
  categoryId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminFaqCreateInput {
  question: string;
  answer: string;
  categoryId: number;
  isActive?: boolean;
  order?: number;
}

export interface AdminFaqUpdateInput {
  question?: string;
  answer?: string;
  categoryId?: number;
  isActive?: boolean;
  order?: number;
}

export interface AdminFaqCategoryInput {
  name: string;
  order?: number;
}

export interface AdminApi {
  getDashboard(): Promise<AdminDashboardBundle>;
  getStats(query?: AdminStatsQuery): Promise<AdminStatsBundle>;
  getHealth(): Promise<AdminHealth>;
  listAuditLogs(query: AdminAuditLogsQuery): Promise<AdminPage<AdminAuditLogItem>>;
  listUsers(query: AdminUsersQuery): Promise<AdminPage<AdminUserRow>>;
  getUser(id: number): Promise<AdminUserDetail>;
  createUser(input: AdminUserCreateInput): Promise<AdminUserDetail>;
  updateUser(id: number, input: AdminUserUpdateInput): Promise<AdminUserDetail>;
  deleteUser(id: number): Promise<void>;
  updateUserStatus(id: number, status: AdminUserStatus): Promise<AdminUserDetail>;
  updateUserApproval(id: number, input: AdminUserApprovalInput): Promise<AdminUserDetail>;
  getUserActivity(
    id: number,
    type: "login" | "naming",
    page: number,
    pageSize: number,
  ): Promise<AdminPage<AdminActivityLogItem>>;
  listPosts(query: AdminPostsQuery): Promise<AdminPage<AdminPostRow>>;
  getPost(id: number): Promise<AdminPostDetail>;
  createPost(input: AdminPostCreateInput): Promise<AdminPostDetail>;
  updatePost(id: number, input: AdminPostUpdateInput): Promise<AdminPostDetail>;
  deletePost(id: number): Promise<void>;
  updatePostStatus(id: number, status: AdminPostStatus): Promise<AdminPostDetail>;
  listPostCategories(): Promise<AdminPostCategory[]>;
  createPostCategory(input: AdminPostCategoryInput): Promise<AdminPostCategory>;
  updatePostCategory(id: number, input: AdminPostCategoryInput): Promise<AdminPostCategory>;
  deletePostCategory(id: number): Promise<void>;
  listNotices(query: AdminNoticesQuery): Promise<AdminPage<AdminNoticeRow>>;
  getNotice(id: number): Promise<AdminNoticeDetail>;
  createNotice(input: AdminNoticeCreateInput): Promise<AdminNoticeDetail>;
  updateNotice(id: number, input: AdminNoticeUpdateInput): Promise<AdminNoticeDetail>;
  deleteNotice(id: number): Promise<void>;
  listInquiries(query: AdminInquiriesQuery): Promise<AdminPage<AdminInquiryRow>>;
  getInquiry(id: number): Promise<AdminInquiryDetail>;
  replyInquiry(id: number, input: AdminInquiryReplyInput): Promise<AdminInquiryDetail>;
  listFaqs(query: AdminFaqsQuery): Promise<AdminPage<AdminFaqRow>>;
  getFaq(id: number): Promise<AdminFaqDetail>;
  createFaq(input: AdminFaqCreateInput): Promise<AdminFaqDetail>;
  updateFaq(id: number, input: AdminFaqUpdateInput): Promise<AdminFaqDetail>;
  deleteFaq(id: number): Promise<void>;
  listFaqCategories(): Promise<AdminFaqCategory[]>;
  createFaqCategory(input: AdminFaqCategoryInput): Promise<AdminFaqCategory>;
  updateFaqCategory(id: number, input: AdminFaqCategoryInput): Promise<AdminFaqCategory>;
  deleteFaqCategory(id: number): Promise<void>;
  listAccounts(query: AdminAccountsQuery): Promise<AdminPage<AdminAccount>>;
  createAccount(input: AdminAccountCreateInput): Promise<AdminAccount>;
  updateAccount(id: number, input: AdminAccountUpdateInput): Promise<AdminAccount>;
  updateAccountRole(id: number, role: AdminRole): Promise<AdminAccount>;
  unlockAccount(id: number): Promise<AdminAccount>;
  forcePasswordReset(id: number): Promise<AdminAccount>;
  deleteAccount(id: number): Promise<void>;
  listSiteTexts(): Promise<SiteTextSetting[]>;
  updateSiteText(key: string, input: SiteTextSettingUpdateInput): Promise<SiteTextSetting>;
  
  getMaintenanceSetting(): Promise<{ maintenance: boolean; reason: string }>;
  updateMaintenanceSetting(input: { maintenance: boolean; reason: string }): Promise<{ maintenance: boolean; reason: string }>;
  
  // Phase 6
  listInquiryTemplates(): Promise<AdminInquiryTemplate[]>;
  createInquiryTemplate(input: { category?: string; title: string; body: string; isActive?: boolean }): Promise<AdminInquiryTemplate>;
  updateInquiryTemplate(id: number, input: { category?: string; title: string; body: string; isActive?: boolean }): Promise<AdminInquiryTemplate>;
  deleteInquiryTemplate(id: number): Promise<void>;
  useInquiryTemplate(id: number): Promise<AdminInquiryTemplate>;

  // Phase 8 & 9
  getActiveUsers(): Promise<{ count: number; loggedInCount: number }>;
  getApiUsageStats(query?: { from?: string; to?: string }): Promise<ApiUsageStats>;
  getApiErrorLogs(): Promise<ApiErrorLogItem[]>;
}

const MOCK_DASHBOARD: AdminDashboardBundle = {
  stats: ADMIN_STATS,
  weeklyRequests: WEEKLY_REQUESTS,
  sourceDistribution: SOURCE_DISTRIBUTION,
  recentRequests: RECENT_REQUESTS,
};

// mock 모드에서도 실제 API와 동일한 필터/페이지/CRUD 흐름을 재현하기 위한 인메모리 상태.
// (실 API 전환 시 이 블록만 걷어내면 되도록 mockAdapter 안에 캡슐화한다.)
let mockUsers: AdminUserDetail[] = ADMIN_USER_ROWS.map((row) => ({
  ...row,
  rejectedReason: "",
  isDeleted: false,
  masked: false,
}));
let mockNextId = Math.max(...mockUsers.map((u) => u.id)) + 1;

let mockAccounts: AdminAccount[] = [...ADMIN_ACCOUNTS];
let mockAccountNextId = Math.max(...mockAccounts.map((a) => a.id)) + 1;

let mockSiteTexts: SiteTextSetting[] = [...SITE_TEXTS];

let mockInquiryTemplates: AdminInquiryTemplate[] = [
  {
    id: 1,
    category: "작명 질문",
    title: "성명학 원리 답변",
    body: "안녕하세요. 명가작명소입니다. 저희 서비스는 한자 획수, 오행 상생 등을 철저히 고려하여...",
    isActive: true,
    usageCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    category: "환불 문의",
    title: "환불 정책 안내",
    body: "안녕하세요. 환불 규정에 따르면 결제 후 작명 결과 조회가 이루어지기 전...",
    isActive: true,
    usageCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
let mockInquiryTemplateNextId = 3;

const MOCK_API_USAGE_STATS: ApiUsageStats = {
  totalRequests: 250,
  failureRate: 2.4,
  avgLatency: 1250,
  totalCost: 0.15,
  points: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    requests: 30 + i * 5,
    failures: i % 3 === 0 ? 1 : 0,
    failureRate: i % 3 === 0 ? 3.3 : 0.0,
    avgLatency: 1200 + i * 20,
    totalCost: 0.02 + i * 0.005,
    promptTokens: 15000 + i * 1000,
    completionTokens: 9000 + i * 500,
  })),
};

const MOCK_API_ERRORS: ApiErrorLogItem[] = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    endpoint: "/names/generate",
    statusCode: 502,
    errorType: "TimeoutError",
    latencyMs: 90000,
    modelName: "gpt-4o-mini",
  }
];

function maskEmailMock(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length >= 3 ? local.slice(0, 3) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

function maskNameMock(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

function toRow(u: AdminUserDetail): AdminUserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    joinedAt: u.joinedAt,
    status: u.status,
    approvalStatus: u.approvalStatus,
    requests: u.requests,
    saved: u.saved,
  };
}

let mockPosts: AdminPostDetail[] = ADMIN_POSTS.map((p) => ({ ...p }));
let mockPostCategories: AdminPostCategory[] = ADMIN_POST_CATEGORIES.map((c) => ({ ...c }));
let mockPostNextId = Math.max(...mockPosts.map((p) => p.id)) + 1;
let mockCategoryNextId = Math.max(...mockPostCategories.map((c) => c.id)) + 1;

function toPostRow(p: AdminPostDetail): AdminPostRow {
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    authorName: p.authorName,
    updatedAt: p.updatedAt,
  };
}

let mockNotices: AdminNoticeDetail[] = ADMIN_NOTICES.map((n) => ({ ...n }));
let mockNoticeNextId = Math.max(...mockNotices.map((n) => n.id)) + 1;

function toNoticeRow(n: AdminNoticeDetail): AdminNoticeRow {
  return {
    id: n.id,
    title: n.title,
    status: n.status,
    isPinned: n.isPinned,
    startAt: n.startAt,
    endAt: n.endAt,
    updatedAt: n.updatedAt,
  };
}

function sortNotices(rows: AdminNoticeDetail[]): AdminNoticeDetail[] {
  return [...rows].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

let mockInquiries: AdminInquiryDetail[] = ADMIN_INQUIRIES.map((i) => ({ ...i }));

function toInquiryRow(i: AdminInquiryDetail): AdminInquiryRow {
  return {
    id: i.id,
    name: i.name,
    email: i.email,
    topic: i.topic,
    subject: i.subject,
    status: i.status,
    createdAt: i.createdAt,
  };
}



export const MOCK_STATS: AdminStatsBundle = {
  points: WEEKLY_REQUESTS.map((item, index) => ({
    date: `2026-07-${String(index + 1).padStart(2, "0")}`,
    signups: 8 + index,
    logins: 40 + index * 3,
    namingRequests: item.요청,
    inquiries: index % 3,
    answeredInquiries: index % 2,
  })),
  summary: {
    signups: 72,
    logins: 420,
    namingRequests: WEEKLY_REQUESTS.reduce((sum, item) => sum + item.요청, 0),
    inquiries: 12,
    answeredInquiries: 8,
    pendingInquiries: ADMIN_INQUIRIES.filter((item) => item.status !== "answered").length,
  },
  sourceDistribution: SOURCE_DISTRIBUTION,
};

export const MOCK_HEALTH: AdminHealth = {
  status: "ok",
  checkedAt: new Date().toISOString(),
  services: [
    { name: "Django", status: "ok", detail: "application ready" },
    { name: "PostgreSQL", status: "ok", detail: "query ok" },
    { name: "FastAPI", status: "unknown", detail: "external check is not configured" },
    { name: "Neo4j", status: "unknown", detail: "graph driver check is deferred" },
    { name: "Chroma", status: "unknown", detail: "vector store check is deferred" },
  ],
};

export const MOCK_AUDIT_LOGS: AdminAuditLogItem[] = [
  {
    id: 1,
    actorUsername: "superadmin",
    action: "VIEW_PII",
    targetType: "User",
    targetId: "7",
    detail: { reason: "detail_view" },
    ip: "127.0.0.1",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    actorUsername: "admin1",
    action: "CONTENT",
    targetType: "Post",
    targetId: "1",
    detail: { action: "update" },
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

const mockAdapter: AdminApi = {
  getDashboard: () => realAdapter.getDashboard(),
  getStats: (query) => realAdapter.getStats(query),
  getHealth: () => realAdapter.getHealth(),
  listAuditLogs: (query) => realAdapter.listAuditLogs(query),
  listUsers: (query) => {
    let rows = mockUsers.filter((u) => !u.isDeleted);
    if (query.status) rows = rows.filter((u) => u.status === query.status);
    if (query.approval) rows = rows.filter((u) => u.approvalStatus === query.approval);
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter((u) => u.name.includes(query.q!) || u.email.toLowerCase().includes(q));
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    // 목록은 실 API와 동일하게 항상 마스킹된 값만 내려준다(§5.1) — 원본은 상세에서만.
    const pageItems = rows.slice(offset, offset + pageSize).map((u) => {
      const row = toRow(u);
      return { ...row, name: maskNameMock(row.name), email: maskEmailMock(row.email) };
    });
    return mockDelay({ items: pageItems, total: rows.length, page, pageSize }, 150);
  },
  getUser: (id) => {
    // mock 모드는 역할별 분기를 재현하지 않고 항상 전체 PII(masked=false)를 반환한다
    // (§5.2의 ANALYST 마스킹 분기는 실 API에서만 의미가 있다).
    const found = mockUsers.find((u) => u.id === id);
    if (!found) return Promise.reject(new Error("not found"));
    return mockDelay(found, 100);
  },
  createUser: (input) => {
    const created: AdminUserDetail = {
      id: mockNextId++,
      name: input.name,
      email: input.email,
      joinedAt: new Date().toISOString(),
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      requests: 0,
      saved: 0,
      rejectedReason: "",
      isDeleted: false,
      masked: false,
    };
    mockUsers = [created, ...mockUsers];
    return mockDelay(created, 300);
  },
  updateUser: (id, input) => {
    mockUsers = mockUsers.map((u) =>
      u.id === id ? { ...u, name: input.name ?? u.name, email: input.email ?? u.email } : u,
    );
    return mockDelay(mockUsers.find((u) => u.id === id)!, 300);
  },
  deleteUser: (id) => {
    mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, isDeleted: true, status: "WITHDRAWN" } : u));
    return mockDelay(undefined, 300);
  },
  updateUserStatus: (id, status) => {
    mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, status } : u));
    return mockDelay(mockUsers.find((u) => u.id === id)!, 250);
  },
  updateUserApproval: (id, input) => {
    mockUsers = mockUsers.map((u) =>
      u.id === id
        ? { ...u, approvalStatus: input.approvalStatus, rejectedReason: input.rejectedReason ?? "" }
        : u,
    );
    return mockDelay(mockUsers.find((u) => u.id === id)!, 250);
  },
  getUserActivity: (_id, type, page, pageSize) => {
    const items: AdminActivityLogItem[] = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      type,
      createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      detail: type === "login" ? "127.0.0.1" : "김씨 성, 밝고 씩씩한 이름",
      success: type === "login" ? true : null,
    }));
    return mockDelay({ items, total: items.length, page, pageSize }, 150);
  },
  listPosts: (query) => {
    let rows = mockPosts.filter((p) => p.status !== "DELETED");
    if (query.status) rows = rows.filter((p) => p.status === query.status);
    if (query.categoryId) rows = rows.filter((p) => p.categoryId === query.categoryId);
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const items = rows.slice(offset, offset + pageSize).map(toPostRow);
    return mockDelay({ items, total: rows.length, page, pageSize }, 150);
  },
  getPost: (id) => {
    const found = mockPosts.find((p) => p.id === id);
    if (!found) return Promise.reject(new Error("not found"));
    return mockDelay(found, 100);
  },
  createPost: (input) => {
    const category = mockPostCategories.find((c) => c.id === input.categoryId);
    const status = input.status ?? "PRIVATE";
    const created: AdminPostDetail = {
      id: mockPostNextId++,
      title: input.title,
      body: input.body,
      status,
      categoryId: input.categoryId,
      categoryName: category?.name ?? "-",
      authorName: "관리자",
      updatedAt: new Date().toISOString(),
      publishedAt: status === "PUBLISHED" ? new Date().toISOString() : null,
    };
    mockPosts = [created, ...mockPosts];
    return mockDelay(created, 300);
  },
  updatePost: (id, input) => {
    mockPosts = mockPosts.map((p) => {
      if (p.id !== id) return p;
      const category = input.categoryId ? mockPostCategories.find((c) => c.id === input.categoryId) : undefined;
      return {
        ...p,
        title: input.title ?? p.title,
        body: input.body ?? p.body,
        categoryId: input.categoryId ?? p.categoryId,
        categoryName: category?.name ?? p.categoryName,
        updatedAt: new Date().toISOString(),
      };
    });
    return mockDelay(mockPosts.find((p) => p.id === id)!, 300);
  },
  deletePost: (id) => {
    mockPosts = mockPosts.map((p) => (p.id === id ? { ...p, status: "DELETED" as const } : p));
    return mockDelay(undefined, 300);
  },
  updatePostStatus: (id, status) => {
    mockPosts = mockPosts.map((p) =>
      p.id === id
        ? { ...p, status, publishedAt: status === "PUBLISHED" ? new Date().toISOString() : p.publishedAt }
        : p,
    );
    return mockDelay(mockPosts.find((p) => p.id === id)!, 250);
  },
  listPostCategories: () => mockDelay([...mockPostCategories].sort((a, b) => a.order - b.order), 100),
  createPostCategory: (input) => {
    const created: AdminPostCategory = { id: mockCategoryNextId++, name: input.name, order: input.order ?? 0 };
    mockPostCategories = [...mockPostCategories, created];
    return mockDelay(created, 200);
  },
  updatePostCategory: (id, input) => {
    mockPostCategories = mockPostCategories.map((c) =>
      c.id === id ? { ...c, name: input.name, order: input.order ?? c.order } : c,
    );
    return mockDelay(mockPostCategories.find((c) => c.id === id)!, 200);
  },
  deletePostCategory: (id) => {
    mockPostCategories = mockPostCategories.filter((c) => c.id !== id);
    return mockDelay(undefined, 200);
  },
  listNotices: (query) => {
    let rows = sortNotices(mockNotices);
    if (query.status) rows = rows.filter((n) => n.status === query.status);
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const items = rows.slice(offset, offset + pageSize).map(toNoticeRow);
    return mockDelay({ items, total: rows.length, page, pageSize }, 150);
  },
  getNotice: (id) => {
    const found = mockNotices.find((n) => n.id === id);
    if (!found) return Promise.reject(new Error("not found"));
    return mockDelay(found, 100);
  },
  createNotice: (input) => {
    const created: AdminNoticeDetail = {
      id: mockNoticeNextId++,
      title: input.title,
      body: input.body,
      status: input.status ?? "DRAFT",
      isPinned: input.isPinned ?? false,
      startAt: input.startAt ?? null,
      endAt: input.endAt ?? null,
      updatedAt: new Date().toISOString(),
    };
    mockNotices = [created, ...mockNotices];
    return mockDelay(created, 300);
  },
  updateNotice: (id, input) => {
    mockNotices = mockNotices.map((n) => {
      if (n.id !== id) return n;
      return {
        ...n,
        title: input.title ?? n.title,
        body: input.body ?? n.body,
        status: input.status ?? n.status,
        isPinned: input.isPinned ?? n.isPinned,
        startAt: input.startAt !== undefined ? input.startAt : n.startAt,
        endAt: input.endAt !== undefined ? input.endAt : n.endAt,
        updatedAt: new Date().toISOString(),
      };
    });
    return mockDelay(mockNotices.find((n) => n.id === id)!, 300);
  },
  deleteNotice: (id) => {
    // 실 API와 동일하게 물리 삭제를 재현한다(§15.3 예외 — 공지는 소프트 삭제 상태가 없음).
    mockNotices = mockNotices.filter((n) => n.id !== id);
    return mockDelay(undefined, 300);
  },
  listInquiries: (query) => {
    let rows = [...mockInquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (query.status) rows = rows.filter((i) => i.status === query.status);
    if (query.q) {
      const q = query.q.toLowerCase();
      rows = rows.filter(
        (i) =>
          i.subject.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q),
      );
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const items = rows.slice(offset, offset + pageSize).map(toInquiryRow);
    return mockDelay({ items, total: rows.length, page, pageSize }, 150);
  },
  getInquiry: (id) => {
    const found = mockInquiries.find((i) => i.id === id);
    if (!found) return Promise.reject(new Error("not found"));
    return mockDelay(found, 100);
  },
  replyInquiry: (id, input) => {
    mockInquiries = mockInquiries.map((i) => {
      if (i.id !== id) return i;
      return {
        ...i,
        status: input.status,
        adminReply: input.adminReply ?? i.adminReply,
        answeredAt: input.status === "answered" ? new Date().toISOString() : i.answeredAt,
      };
    });
    return mockDelay(mockInquiries.find((i) => i.id === id)!, 300);
  },
  listFaqs: (query) => realAdapter.listFaqs(query),
  getFaq: (id) => realAdapter.getFaq(id),
  createFaq: (input) => realAdapter.createFaq(input),
  updateFaq: (id, input) => realAdapter.updateFaq(id, input),
  deleteFaq: (id) => realAdapter.deleteFaq(id),
  listFaqCategories: () => realAdapter.listFaqCategories(),
  createFaqCategory: (input) => realAdapter.createFaqCategory(input),
  updateFaqCategory: (id, input) => realAdapter.updateFaqCategory(id, input),
  deleteFaqCategory: (id) => realAdapter.deleteFaqCategory(id),


  // Phase 4
  listAccounts: (query) => {
    let filtered = [...mockAccounts];
    if (query.role) filtered = filtered.filter((a) => a.role === query.role);
    if (query.active !== undefined) filtered = filtered.filter((a) => a.isActiveAdmin === query.active);
    if (query.q) {
      const q = query.q.toLowerCase();
      filtered = filtered.filter((a) => a.username.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q));
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);
    return mockDelay({ items, total: filtered.length, page, pageSize }, 200);
  },
  createAccount: (input) => {
    const created: AdminAccount = {
      id: mockAccountNextId++,
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      isActiveAdmin: true,
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAccounts = [created, ...mockAccounts];
    return mockDelay(created, 300);
  },
  updateAccount: (id, input) => {
    mockAccounts = mockAccounts.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        displayName: input.displayName ?? a.displayName,
        isActiveAdmin: input.isActiveAdmin ?? a.isActiveAdmin,
        updatedAt: new Date().toISOString(),
      };
    });
    return mockDelay(mockAccounts.find((a) => a.id === id)!, 300);
  },
  updateAccountRole: (id, role) => {
    mockAccounts = mockAccounts.map(a => a.id === id ? { ...a, role, updatedAt: new Date().toISOString() } : a);
    return mockDelay(mockAccounts.find((a) => a.id === id)!, 300);
  },
  unlockAccount: (id) => {
    mockAccounts = mockAccounts.map(a => a.id === id ? { ...a, failedLoginCount: 0, lockedUntil: null, updatedAt: new Date().toISOString() } : a);
    return mockDelay(mockAccounts.find((a) => a.id === id)!, 300);
  },
  forcePasswordReset: (id) => {
    mockAccounts = mockAccounts.map(a => a.id === id ? { ...a, mustChangePassword: true, updatedAt: new Date().toISOString() } : a);
    return mockDelay(mockAccounts.find((a) => a.id === id)!, 300);
  },
  deleteAccount: (id) => {
    mockAccounts = mockAccounts.filter(a => a.id !== id);
    return mockDelay(undefined, 300);
  },

  // Phase 5
  listSiteTexts: () => mockDelay([...mockSiteTexts], 200),
  updateSiteText: (key, input) => {
    mockSiteTexts = mockSiteTexts.map(s => s.key === key ? { ...s, value: input.value, updatedAt: new Date().toISOString() } : s);
    return mockDelay(mockSiteTexts.find((s) => s.key === key)!, 300);
  },
  
  getMaintenanceSetting: () => mockDelay({ maintenance: false, reason: "" }, 200),
  updateMaintenanceSetting: (input) => mockDelay(input, 300),

  // Phase 6
  listInquiryTemplates: () => mockDelay([...mockInquiryTemplates], 200),
  createInquiryTemplate: (input) => {
    const created: AdminInquiryTemplate = {
      id: mockInquiryTemplateNextId++,
      category: input.category ?? "",
      title: input.title,
      body: input.body,
      isActive: input.isActive ?? true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockInquiryTemplates = [...mockInquiryTemplates, created];
    return mockDelay(created, 300);
  },
  updateInquiryTemplate: (id, input) => {
    mockInquiryTemplates = mockInquiryTemplates.map(t => t.id === id ? {
      ...t,
      category: input.category ?? t.category,
      title: input.title,
      body: input.body,
      isActive: input.isActive ?? t.isActive,
      updatedAt: new Date().toISOString(),
    } : t);
    return mockDelay(mockInquiryTemplates.find(t => t.id === id)!, 300);
  },
  deleteInquiryTemplate: (id) => {
    mockInquiryTemplates = mockInquiryTemplates.filter(t => t.id !== id);
    return mockDelay(undefined, 200);
  },
  useInquiryTemplate: (id) => {
    mockInquiryTemplates = mockInquiryTemplates.map(t => t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t);
    return mockDelay(mockInquiryTemplates.find(t => t.id === id)!, 100);
  },

  // Phase 8 & 9
  getActiveUsers: () => mockDelay({ count: 3, loggedInCount: 1 }, 100),
  getApiUsageStats: () => mockDelay(MOCK_API_USAGE_STATS, 200),
  getApiErrorLogs: () => mockDelay(MOCK_API_ERRORS, 200),
};

// object 파라미터 타입을 쓰는 이유: AdminUsersQuery 같은 명명된 인터페이스를
// Record<string, ...>에 직접 넘기면 "인덱스 시그니처 누락" 타입 오류가 난다.
// 여기서는 임의의 평범한 객체를 받아 내부에서만 안전하게 순회한다.
function toQueryString(query: object): string {
  const params = new URLSearchParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const realAdapter: AdminApi = {
  getDashboard: () => apiClient.get<AdminDashboardBundle>("/admin/dashboard"),
  getStats: (query = {}) => apiClient.get<AdminStatsBundle>(`/admin/stats${toQueryString(query)}`),
  getHealth: () => apiClient.get<AdminHealth>("/admin/system/health"),
  listAuditLogs: (query) =>
    apiClient.get<AdminPage<AdminAuditLogItem>>(`/admin/audit-logs/${toQueryString(query)}`),
  listUsers: (query) =>
    apiClient.get<AdminPage<AdminUserRow>>(`/admin/users/${toQueryString(query)}`),
  getUser: (id) => apiClient.get<AdminUserDetail>(`/admin/users/${id}`),
  createUser: (input) => apiClient.post<AdminUserDetail>("/admin/users/", input),
  updateUser: (id, input) => apiClient.patch<AdminUserDetail>(`/admin/users/${id}`, input),
  deleteUser: (id) => apiClient.delete<void>(`/admin/users/${id}`),
  updateUserStatus: (id, status) =>
    apiClient.patch<AdminUserDetail>(`/admin/users/${id}/status`, { status }),
  updateUserApproval: (id, input) =>
    apiClient.patch<AdminUserDetail>(`/admin/users/${id}/approval`, input),
  getUserActivity: (id, type, page, pageSize) =>
    apiClient.get<AdminPage<AdminActivityLogItem>>(
      `/admin/users/${id}/activity${toQueryString({ type, page, pageSize })}`,
    ),
  listPosts: (query) =>
    apiClient.get<AdminPage<AdminPostRow>>(`/admin/posts/${toQueryString(query)}`),
  getPost: (id) => apiClient.get<AdminPostDetail>(`/admin/posts/${id}`),
  createPost: (input) => apiClient.post<AdminPostDetail>("/admin/posts/", input),
  updatePost: (id, input) => apiClient.put<AdminPostDetail>(`/admin/posts/${id}`, input),
  deletePost: (id) => apiClient.delete<void>(`/admin/posts/${id}`),
  updatePostStatus: (id, status) =>
    apiClient.patch<AdminPostDetail>(`/admin/posts/${id}/status`, { status }),
  listPostCategories: () => apiClient.get<AdminPostCategory[]>("/admin/post-categories/"),
  createPostCategory: (input) => apiClient.post<AdminPostCategory>("/admin/post-categories/", input),
  updatePostCategory: (id, input) =>
    apiClient.patch<AdminPostCategory>(`/admin/post-categories/${id}`, input),
  deletePostCategory: (id) => apiClient.delete<void>(`/admin/post-categories/${id}`),
  listNotices: (query) =>
    apiClient.get<AdminPage<AdminNoticeRow>>(`/admin/notices/${toQueryString(query)}`),
  getNotice: (id) => apiClient.get<AdminNoticeDetail>(`/admin/notices/${id}`),
  createNotice: (input) => apiClient.post<AdminNoticeDetail>("/admin/notices/", input),
  updateNotice: (id, input) => apiClient.put<AdminNoticeDetail>(`/admin/notices/${id}`, input),
  deleteNotice: (id) => apiClient.delete<void>(`/admin/notices/${id}`),
  listInquiries: (query) =>
    apiClient.get<AdminPage<AdminInquiryRow>>(`/admin/inquiries/${toQueryString(query)}`),
  getInquiry: (id) => apiClient.get<AdminInquiryDetail>(`/admin/inquiries/${id}`),
  replyInquiry: (id, input) => apiClient.patch<AdminInquiryDetail>(`/admin/inquiries/${id}`, input),
  listFaqs: (query) => apiClient.get<AdminPage<AdminFaqRow>>(`/admin/faqs/${toQueryString(query)}`),
  getFaq: (id) => apiClient.get<AdminFaqDetail>(`/admin/faqs/${id}`),
  createFaq: (input) => apiClient.post<AdminFaqDetail>("/admin/faqs/", input),
  updateFaq: (id, input) => apiClient.put<AdminFaqDetail>(`/admin/faqs/${id}`, input),
  deleteFaq: (id) => apiClient.delete<void>(`/admin/faqs/${id}`),
  listFaqCategories: () => apiClient.get<AdminFaqCategory[]>("/admin/faq-categories/"),
  createFaqCategory: (input) => apiClient.post<AdminFaqCategory>("/admin/faq-categories/", input),
  updateFaqCategory: (id, input) => apiClient.patch<AdminFaqCategory>(`/admin/faq-categories/${id}`, input),
  deleteFaqCategory: (id) => apiClient.delete<void>(`/admin/faq-categories/${id}`),

  // Phase 4
  listAccounts: (query) => {
    const qs = toQueryString(query);
    // query가 없으면 /admin/accounts/ 가 되고 있으면 /admin/accounts/?... 가 되도록
    return apiClient.get<AdminPage<AdminAccount>>(`/admin/accounts/${qs}`);
  },
  createAccount: (input) => apiClient.post<AdminAccount>("/admin/accounts/", input),
  updateAccount: (id, input) => apiClient.patch<AdminAccount>(`/admin/accounts/${id}`, input),
  updateAccountRole: (id, role) => apiClient.patch<AdminAccount>(`/admin/accounts/${id}/role`, { role }),
  unlockAccount: (id) => apiClient.post<AdminAccount>(`/admin/accounts/${id}/unlock`),
  forcePasswordReset: (id) => apiClient.post<AdminAccount>(`/admin/accounts/${id}/force-password-reset`),
  deleteAccount: (id) => apiClient.delete<void>(`/admin/accounts/${id}`),

  // Phase 5
  listSiteTexts: () => apiClient.get<SiteTextSetting[]>("/admin/site-texts/"),
  updateSiteText: (key, input) => apiClient.patch<SiteTextSetting>(`/admin/site-texts/${key}/`, input),

  getMaintenanceSetting: () => apiClient.get<{ maintenance: boolean; reason: string }>("/admin/settings/maintenance"),
  updateMaintenanceSetting: (input) => apiClient.patch<{ maintenance: boolean; reason: string }>("/admin/settings/maintenance", input),

  // Phase 6
  listInquiryTemplates: () => apiClient.get<AdminInquiryTemplate[]>("/admin/inquiry-templates/"),
  createInquiryTemplate: (input) => apiClient.post<AdminInquiryTemplate>("/admin/inquiry-templates/", input),
  updateInquiryTemplate: (id, input) => apiClient.patch<AdminInquiryTemplate>(`/admin/inquiry-templates/${id}/`, input),
  deleteInquiryTemplate: (id) => apiClient.delete<void>(`/admin/inquiry-templates/${id}/`),
  useInquiryTemplate: (id) => apiClient.post<AdminInquiryTemplate>(`/admin/inquiry-templates/${id}/use/`),

  // Phase 8 & 9
  getActiveUsers: () => apiClient.get<{ count: number; loggedInCount: number }>("/admin/api-usage/active-users"),
  getApiUsageStats: (query) => apiClient.get<ApiUsageStats>(`/admin/api-usage/summary${toQueryString(query ?? {})}`),
  getApiErrorLogs: () => apiClient.get<ApiErrorLogItem[]>("/admin/api-usage/errors"),
};

export const adminApi: AdminApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 각 admin 훅의 initialData로 재사용 */
export const MOCK_ADMIN_DASHBOARD = MOCK_DASHBOARD;

// ─── 관리자 인증 (Django Ninja `/api/admin/*`, 관리자페이지 개발 계획서 §10) ────
// 일반 사용자 인증(auth.ts)과 완전히 분리 — 서버 세션 쿠키도 admin_sessionid로
// 물리적으로 다르다(§15.1). AdminAuthProvider가 이 API만 사용한다.

export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  role: "SUPERADMIN" | "ADMIN" | "ANALYST";
  permissions: string[];
  mustChangePassword: boolean;
}

export interface AdminAuthApi {
  login(input: { username: string; password: string }): Promise<AdminUser>;
  logout(): Promise<void>;
  me(): Promise<AdminUser>;
  changePassword(input: { currentPassword: string; nextPassword: string }): Promise<void>;
}

/** 권한 매트릭스(§4.2)와 정렬된 mock 데이터 — 서버 auth.py의 PERMISSION_MATRIX 참고 */
const MOCK_ADMIN_USER: AdminUser = {
  id: 1,
  username: "superadmin",
  displayName: "최고관리자",
  role: "SUPERADMIN",
  permissions: [
    "dashboard.view",
    "stats.view",
    "system.health",
    "users.view",
    "users.activity_log",
    "users.pii_view",
    "users.write",
    "users.status",
    "users.delete",
    "users.approval",
    "users.export",
    "posts.write",
    "inquiries.write",
    "faqs.write",
    "notices.write",
    "accounts.manage",
    "roles.manage",
    "audit.view",
    "settings.manage",
  ],
  mustChangePassword: false,
};

const mockAuthAdapter: AdminAuthApi = {
  login: ({ username }) => mockDelay({ ...MOCK_ADMIN_USER, username }, 550),
  logout: () => mockDelay(undefined, 300),
  me: () => mockDelay(MOCK_ADMIN_USER, 0),
  changePassword: () => mockDelay(undefined, 500),
};

const realAuthAdapter: AdminAuthApi = {
  login: (input) => apiClient.post<AdminUser>("/admin/login", input),
  logout: () => apiClient.post<void>("/admin/logout"),
  me: () => apiClient.get<AdminUser>("/admin/me"),
  changePassword: (input) => apiClient.post<void>("/admin/password", input),
};

export const adminAuthApi: AdminAuthApi = USE_MOCK ? mockAuthAdapter : realAuthAdapter;
