/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Django 등 REST API 베이스 URL. 미설정 시 client.ts가 "/api"로 대체 */
  readonly VITE_API_BASE_URL?: string;
  /** FastAPI(+Neo4j) 작명/채팅 API 베이스 URL. 미설정 시 client.ts가 "/naming-api"로 대체 */
  readonly VITE_NAMING_API_BASE_URL?: string;
  /** "false"가 아니면 mock 어댑터 사용 (기본값: mock) */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
