// ─── 인증 · 마이페이지 도메인 API (Django 예정) ────────────────────────────────
// TODO(API): POST /api/auth/login, POST /api/auth/signup, GET /me/history, PATCH /me 등으로 대체.
// Django 세션 인증 채택 시 client.ts에 CSRF 토큰 처리가 추가로 필요하다 (§4 참고).

import { ApiError, USE_MOCK, apiClient, mockDelay } from "./client";
import type { AuthUser, HistoryEntry } from "@/app/types";
import { HISTORY_ENTRIES } from "./mock/history.mock";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

/** 데모 계정 정보 — TODO(API): 서버 세션/JWT의 role 클레임으로 대체 */
const ADMIN_EMAIL = "admin@myeongga.co.kr";
const TEST_USER = { email: "user@myeongga.co.kr", password: "user1234", name: "김명가" };
/** MyPageScreen 비밀번호 변경 데모 검증용 (시안 단계) */
export const DEMO_CURRENT_PASSWORD = "user1234";

const INVALID_CREDENTIALS = "이메일 또는 비밀번호를 확인해 주세요.";

export interface AuthApi {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  signup(input: SignupInput): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  /** 작명 기록 (History · MyPage 화면 공용) */
  getHistory(): Promise<HistoryEntry[]>;
  updateProfile(patch: Partial<Pick<AuthUser, "name">>): Promise<AuthUser>;
  changePassword(input: { currentPassword: string; nextPassword: string }): Promise<void>;
  withdraw(): Promise<void>;
}

const mockAdapter: AuthApi = {
  async login({ email, password }) {
    const normalized = email.trim().toLowerCase();
    if (normalized === ADMIN_EMAIL) {
      return mockDelay<AuthUser>({ name: "관리자", email: ADMIN_EMAIL, role: "admin" }, 550);
    }
    if (normalized === TEST_USER.email && password === TEST_USER.password) {
      return mockDelay<AuthUser>({ name: TEST_USER.name, email: TEST_USER.email, role: "user" }, 550);
    }
    await mockDelay(null, 550);
    throw new ApiError({ status: 401, message: INVALID_CREDENTIALS });
  },
  async signup() {
    await mockDelay(undefined, 400);
  },
  async forgotPassword() {
    await mockDelay(undefined, 700);
  },
  async getHistory() {
    return mockDelay(HISTORY_ENTRIES, 0);
  },
  async updateProfile(patch) {
    // TODO(API): PATCH /me 로 대체 — 실제로는 서버가 갱신된 전체 사용자 정보를 반환한다
    await mockDelay(undefined, 600);
    return { name: patch.name ?? "", email: "", role: "user" };
  },
  async changePassword({ currentPassword }) {
    await mockDelay(undefined, 700);
    if (currentPassword !== DEMO_CURRENT_PASSWORD) {
      throw new ApiError({ status: 400, message: "현재 비밀번호가 올바르지 않습니다." });
    }
  },
  async withdraw() {
    await mockDelay(undefined, 400);
  },
};

const realAdapter: AuthApi = {
  login: (credentials) => apiClient.post<AuthUser>("/auth/login", credentials),
  signup: (input) => apiClient.post<void>("/auth/signup", input),
  forgotPassword: (email) => apiClient.post<void>("/auth/forgot-password", { email }),
  getHistory: () => apiClient.get<HistoryEntry[]>("/me/history"),
  updateProfile: (patch) => apiClient.patch<AuthUser>("/me", patch),
  changePassword: (input) => apiClient.post<void>("/me/change-password", input),
  withdraw: () => apiClient.delete<void>("/me"),
};

export const authApi: AuthApi = USE_MOCK ? mockAdapter : realAdapter;

/** mock 모드에서 useHistory 훅의 initialData로 재사용 */
export const MOCK_HISTORY_ENTRIES = HISTORY_ENTRIES;
