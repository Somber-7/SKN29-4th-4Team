// ─── API 클라이언트 (fetch 래퍼) ───────────────────────────────────────────────
// - Django(세션 인증·마이페이지·이력·인사이트·관리자)는 API_BASE("/api")
// - FastAPI+Neo4j(작명 생성·채팅)는 NAMING_API_BASE("/naming-api")
// 로컬/배포 모두 nginx 또는 vite proxy가 각 백엔드로 전달한다.

/** true(기본값)면 mock 어댑터, "false"면 실 API 어댑터를 사용한다 (auth·admin·insights·support용) */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
/** 인증은 기본적으로 Django 세션 API를 사용한다. 필요하면 이 값만 true로 되돌린다. */
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

/**
 * 작명 생성(names) 전용 mock 스위치. 작명 백엔드(/naming-api)는 배포·검증이 끝났으므로
 * 기본값을 "실 연동"으로 둔다 — 다른 도메인(전역 USE_MOCK=mock)과 독립적이다.
 * UI만 오프라인으로 손볼 때는 VITE_USE_MOCK_NAMES=true 로 mock을 강제할 수 있다.
 */
export const USE_MOCK_NAMES = import.meta.env.VITE_USE_MOCK_NAMES === "true";

// "??"는 빈 문자열("")을 유효한 값으로 취급해 넘기므로, .env에 키만 두고 값을
// 비워둔 경우(VITE_API_BASE_URL=) 기본 상대경로로 대체되지 않는다. "||"로
// 빈 문자열도 대체 대상에 포함시켜 .env 주석이 명시한 의도대로 동작하게 한다.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const NAMING_API_BASE = import.meta.env.VITE_NAMING_API_BASE_URL || "/naming-api";

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

/** 401 응답 수신 시 AuthProvider가 세션 상태를 비우기 위한 콜백 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Django가 내려준 csrftoken 쿠키를 읽는다 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(baseUrl: string, method?: string): Promise<string | null> {
  const unsafe = method && !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
  if (!unsafe || baseUrl !== API_BASE) return getCookie("csrftoken");

  const existing = getCookie("csrftoken");
  if (existing) return existing;

  await fetch(`${API_BASE}/auth/csrf`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return getCookie("csrftoken");
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

function createClient(baseUrl: string) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    const controller = new AbortController();
    // 작명 생성(FastAPI+LLM)은 응답이 오래 걸릴 수 있어 여유를 두고, 그 외 일반 API는 짧게 끊는다
    const timeoutMs = baseUrl === NAMING_API_BASE ? 90_000 : 15_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const csrfToken = await ensureCsrfToken(baseUrl, rest.method);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...rest,
        // Django 세션 쿠키(또는 향후 JWT) 인증을 위해 항상 쿠키 포함 — 단일 도메인(nginx) 구성이면 CORS 이슈 없음
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        throw new ApiError({
          status: 0,
          message: "요청 시간이 초과되었습니다.",
          detail: cause,
        });
      }
      throw new ApiError({
        status: 0,
        message: "네트워크 요청에 실패했습니다.",
        detail: cause,
      });
    } finally {
      clearTimeout(timer);
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
      // 백엔드 에러 계약({ message, detail })의 message를 사용자 메시지로 우선 사용
      const serverMessage = (detail as { message?: unknown } | undefined)?.message;
      throw new ApiError({
        status: res.status,
        message:
          typeof serverMessage === "string" && serverMessage
            ? serverMessage
            : `API 요청 실패: ${res.status} ${res.statusText}`,
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
