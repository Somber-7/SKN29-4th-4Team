// ─── API 클라이언트 (fetch 래퍼) ───────────────────────────────────────────────
// 백엔드는 아직 연결되지 않는다. 이 파일은 "연동 스위치만 켜면 되는" 골격만 제공한다.
// - Django(세션 인증·마이페이지·인사이트·관리자)는 API_BASE("/api")
// - FastAPI+Neo4j(작명 생성·채팅)는 NAMING_API_BASE("/naming-api")
// 개발 서버에서는 vite.config.ts의 server.proxy가 각각 8000/8001로 전달한다.

/** true(기본값)면 mock 어댑터, "false"면 실 API 어댑터를 사용한다 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const NAMING_API_BASE = import.meta.env.VITE_NAMING_API_BASE_URL ?? "/naming-api";

export interface ApiErrorPayload {
  status: number;
  message: string;
  detail?: unknown;
}

/** status 코드를 포함하는 커스텀 에러 — 화면에서 401/403/404 등을 구분해 처리할 수 있도록 한다 */
export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor({ status, message, detail }: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** 401 응답 수신 시 호출되는 콜백 자리 — AuthProvider가 로그인 리다이렉트 등을 등록한다 (TODO(API) 연동 시 사용) */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

function createClient(baseUrl: string) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...rest,
        // Django 세션 쿠키(또는 향후 JWT) 인증을 위해 항상 쿠키 포함 — 단일 도메인(nginx) 구성이면 CORS 이슈 없음
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      throw new ApiError({
        status: 0,
        message: "네트워크 요청에 실패했습니다.",
        detail: cause,
      });
    }

    if (res.status === 401) {
      unauthorizedHandler?.();
    }

    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = undefined;
      }
      throw new ApiError({
        status: res.status,
        message: `API 요청 실패: ${res.status} ${res.statusText}`,
        detail,
      });
    }

    if (res.status === 204) return undefined as T;

    try {
      return (await res.json()) as T;
    } catch {
      return undefined as T;
    }
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

/** Django REST API (인증·마이페이지·인사이트·관리자) */
export const apiClient = createClient(API_BASE);

/** FastAPI + Neo4j (작명 생성·채팅) */
export const namingApiClient = createClient(NAMING_API_BASE);

/** mock 어댑터 공용 지연 헬퍼 — 실제 setTimeout 연출을 흉내낸다 */
export function mockDelay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
