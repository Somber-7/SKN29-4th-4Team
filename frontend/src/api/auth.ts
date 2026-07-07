// ─── 인증 · 마이페이지 도메인 API (Django 세션) ───────────────────────────────

import { ApiError, USE_MOCK_AUTH, apiClient, mockDelay } from "./client";
import type { AuthUser, HistoryEntry, UserInquiryEntry } from "@/app/types";
import { HISTORY_ENTRIES } from "./mock/history.mock";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupInput {
  name: string;
  username: string;
  email: string;
  password: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export interface ProfilePatch {
  email: string;
}

export interface PasswordResetInput {
  name: string;
  username: string;
  email: string;
  nextPassword: string;
}

export interface PasswordResetIdentityInput {
  name: string;
  username: string;
  email: string;
}

const ADMIN_USER = { username: "admin", email: "admin@myeongga.co.kr", password: "admin1234!", name: "관리자" };
const TEST_USER = { username: "user01", email: "user@myeongga.co.kr", password: "user1234!", name: "김명가" };
const INVALID_CREDENTIALS = "아이디 또는 비밀번호를 확인해 주세요.";

export interface AuthApi {
  ensureCsrf(): Promise<void>;
  currentUser(): Promise<AuthUser>;
  login(credentials: LoginCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  signup(input: SignupInput): Promise<void>;
  checkEmail(email: string): Promise<{ available: boolean }>;
  verifyPasswordResetAccount(input: PasswordResetIdentityInput): Promise<void>;
  resetPassword(input: PasswordResetInput): Promise<void>;
  /** 작명 기록 (History · MyPage 화면 공용) */
  getHistory(): Promise<HistoryEntry[]>;
  getInquiries(): Promise<UserInquiryEntry[]>;
  updateProfile(patch: ProfilePatch): Promise<AuthUser>;
  changePassword(input: { currentPassword: string; nextPassword: string }): Promise<void>;
  withdraw(input: { currentPassword: string }): Promise<void>;
}

const mockAdapter: AuthApi = {
  async ensureCsrf() {
    await mockDelay(undefined, 0);
  },
  async currentUser() {
    await mockDelay(undefined, 150);
    throw new ApiError({ status: 401, message: "로그인이 필요합니다." });
  },
  async login({ username, password }) {
    const normalized = username.trim().toLowerCase();
    if (normalized === ADMIN_USER.username && password === ADMIN_USER.password) {
      return mockDelay<AuthUser>(
        { name: ADMIN_USER.name, username: ADMIN_USER.username, email: ADMIN_USER.email, role: "admin" },
        550,
      );
    }
    if (normalized === TEST_USER.username && password === TEST_USER.password) {
      return mockDelay<AuthUser>(
        { name: TEST_USER.name, username: TEST_USER.username, email: TEST_USER.email, role: "user" },
        550,
      );
    }
    await mockDelay(null, 550);
    throw new ApiError({ status: 401, message: INVALID_CREDENTIALS });
  },
  async logout() {
    await mockDelay(undefined, 150);
  },
  async signup() {
    await mockDelay(undefined, 400);
  },
  async checkEmail(email) {
    await mockDelay(undefined, 250);
    return { available: email.trim().toLowerCase() !== TEST_USER.email };
  },
  async verifyPasswordResetAccount() {
    await mockDelay(undefined, 500);
  },
  async resetPassword() {
    await mockDelay(undefined, 700);
  },
  async getHistory() {
    return mockDelay(HISTORY_ENTRIES, 0);
  },
  async getInquiries() {
    return mockDelay([], 0);
  },
  async updateProfile(patch) {
    await mockDelay(undefined, 600);
    return {
      name: TEST_USER.name,
      username: TEST_USER.username,
      email: patch.email,
      role: "user",
      joinedAt: "2026.05.12",
    };
  },
  async changePassword({ currentPassword }) {
    await mockDelay(undefined, 700);
    if (currentPassword !== TEST_USER.password) {
      throw new ApiError({ status: 400, message: "현재 비밀번호가 올바르지 않습니다." });
    }
  },
  async withdraw({ currentPassword }) {
    await mockDelay(undefined, 400);
    if (currentPassword !== TEST_USER.password) {
      throw new ApiError({ status: 400, message: "현재 비밀번호가 올바르지 않습니다." });
    }
  },
};

const realAdapter: AuthApi = {
  ensureCsrf: () => apiClient.get<void>("/auth/csrf"),
  currentUser: () => apiClient.get<AuthUser>("/me"),
  login: (credentials) => apiClient.post<AuthUser>("/auth/login", credentials),
  logout: () => apiClient.post<void>("/auth/logout"),
  signup: (input) => apiClient.post<void>("/auth/signup", input),
  checkEmail: (email) => apiClient.post<{ available: boolean }>("/auth/check-email", { email }),
  verifyPasswordResetAccount: (input) => apiClient.post<void>("/auth/verify-password-reset-account", input),
  resetPassword: (input) => apiClient.post<void>("/auth/forgot-password", input),
  getHistory: () => apiClient.get<HistoryEntry[]>("/me/history"),
  getInquiries: () => apiClient.get<UserInquiryEntry[]>("/me/inquiries"),
  updateProfile: (patch) => apiClient.patch<AuthUser>("/me", patch),
  changePassword: (input) => apiClient.post<void>("/me/change-password", input),
  withdraw: (input) => apiClient.delete<void>("/me", { body: input }),
};

export const authApi: AuthApi = USE_MOCK_AUTH ? mockAdapter : realAdapter;

/** mock 모드에서 useHistory 훅의 initialData로 재사용 */
export const MOCK_HISTORY_ENTRIES = HISTORY_ENTRIES;
