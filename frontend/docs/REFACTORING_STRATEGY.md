# 백엔드 연동 대비 리팩토링 전략서

> 작성일: 2026-07-05 · 대상: 명가작명소 프론트엔드 (demo3)
> 목표 인프라: docker-compose (nginx + Django:8000 + FastAPI:8001 + Neo4j)
> 본 문서는 전략만 다루며, 코드 수정은 포함하지 않는다.

---

## 1. 현황 진단 (코드 실측 기준)

| 항목 | 실측 결과 |
|---|---|
| 총 규모 | src/app 약 7,300줄, 화면 19개 |
| API 레이어 | **전무** — `fetch`/`axios`/`import.meta.env` 사용처 0건 |
| 목데이터 | `src/app/data/*` 5개 파일을 **화면 9곳이 직접 import** |
| 가짜 지연 | Processing·Results·Chat 화면이 `setTimeout`으로 응답 연출 |
| 인증 | `sessionStorage("mgUser")` 기반 가짜 세션, RBAC은 클라이언트 useEffect |
| 라우팅 | react-router 없음 — App.tsx가 hash + useState로 수제 라우팅 |
| 전역 상태 | 없음 — `query`/`user`/`chatQuestion`이 App.tsx 로컬 state |
| 폼 계약 | `InputScreen.onSubmit(query: string)` — 상세 조건 폼조차 **문자열 하나로 직렬화** |
| 환경 분리 | .env / VITE_ 변수 없음, dist/가 저장소에 커밋됨 |

리뷰에서 지적한 4대 안티패턴(갓 컴포넌트·인라인 스타일·수제 탭·코드 스플리팅 부재)은 모두 사실로 확인됨. 단, **연동 관점에서는 아래 §2가 더 시급하다.**

---

## 2. 백엔드 연동 시 실제로 발목 잡는 문제 (우선순위순)

### P0-1. "문자열 쿼리" 데이터 계약 — 최악의 병목
`InputScreen`의 상세 조건 폼은 성씨·성별·오행·획수를 입력받고도
`"김씨 성, 남자 이름, 水 오행 ... 이름 추천"` 같은 **한국어 문장으로 재조립**해서 넘긴다.
ResultsScreen은 그 문자열을 `parseNameQuery()`로 **다시 파싱**한다.

- FastAPI는 구조화된 JSON(`{lastName, gender, elements, strokeRange, meaning}`)을 원한다.
- 자연어 파싱은 백엔드(FastAPI + Neo4j)의 역할이지, 프론트 정규식의 역할이 아니다.
- **전략**: `NameRequest` DTO 타입을 정의하고 `onSubmit(request: NameRequest)`로 계약 변경.
  자연어 모드는 `{ type: "natural", query }`, 상세 모드는 `{ type: "structured", ... }`
  discriminated union으로. `nameQueryParser`는 "입력 미리보기 칩" 용도로만 격하.

### P0-2. API 레이어 부재 + 목데이터 직접 import
화면 9곳이 `data/*`를 직접 import하므로, 연동 시 **화면 9개를 전부 열어 고쳐야** 한다.

- **전략**: `src/api/` 레이어 신설. 화면은 `useNameResults()` 같은 훅만 호출하고,
  훅 뒤에서 `mock 어댑터 ↔ 실 API 어댑터`를 환경변수로 스위칭.
  이렇게 하면 백엔드가 준비 안 된 엔드포인트는 목으로 유지한 채 **화면별 점진 전환** 가능.

### P0-3. 가짜 인증/RBAC
Django 세션(or JWT) 기반 실인증으로 교체 대상. 현재 구조의 문제:

- `sessionStorage` 직접 접근이 App.tsx에 하드코딩 → `AuthContext`(또는 Zustand) 뒤로 은닉 필요.
- 관리자 판별이 클라이언트 useEffect뿐 → 서버 RBAC 응답(401/403) 처리 로직이 들어갈 자리가 없음.
- **전략**: `auth` 모듈로 분리하고, API 클라이언트에 401 인터셉트 → login 리다이렉트 공통 처리.

### P1-4. setTimeout 연출 → 실 비동기 상태로
Processing/Chat의 가짜 지연은 실 API의 `loading/error/retry` 상태 기계로 교체해야 한다.
현재는 에러 상태 UI가 아예 없다 (목데이터는 실패하지 않으므로).
- **전략**: TanStack Query 도입 권장 — 로딩·에러·캐시·재시도를 표준화. Chat은 SSE/스트리밍 대비.

### P1-5. 수제 hash 라우팅
19개 화면 조건부 렌더 + hash 동기화 useEffect 2개는 이미 한계.
연동 후 `results/:id` 같은 파라미터 라우트, 서버 리다이렉트가 필요해진다.
- **전략**: react-router 도입. nginx에서 SPA fallback(`try_files ... /index.html`) 설정과 세트.

---

## 3. 단계별 실행 계획

**Phase 0 — 계약 정의 (코드 변경 없음, 백엔드 팀과 합의)**
API 명세 초안 합의: 엔드포인트·DTO·인증 방식. §4 초안 참고.
완료 기준: OpenAPI 스키마(FastAPI 자동 생성) 기준 타입 확정.

**Phase 1 — API 레이어 + 환경 분리 (연동의 전제조건)**
`src/api/client.ts`(fetch 래퍼, `VITE_API_BASE_URL` 또는 상대경로 `/api`),
`src/api/names.ts`·`auth.ts`·`admin.ts`, 목 어댑터로 `data/*` 이전.
화면들의 `data/*` 직접 import 제거. `.env.example` 추가, dist/ gitignore.
완료 기준: `grep "from.*data/" src/app/screens` 결과 0건.

**Phase 2 — 상태·컴포넌트 구조 (리뷰 지적 1번 대응)**
App.tsx → 라우터 + `AuthProvider`로 분해.
InputScreen → `NaturalInputForm` / `StructuredInputForm` 분리, `onSubmit(NameRequest)` 계약 적용.
완료 기준: InputScreen 150줄 이하, 폼 상태가 각 폼 내부로 캡슐화.

**Phase 3 — 라우팅 + 코드 스플리팅 (리뷰 지적 4번 대응)**
react-router 전환, `React.lazy`로 최소 3분할: 공개 화면 / 작명 플로우 / 관리자.
완료 기준: 초기 청크에서 admin·recharts(697줄 InsightsScreen이 사용) 제외 확인.

**Phase 4 — 스타일·UI 정리 (리뷰 지적 2·3번 대응, 연동과 병행 가능)**
인라인 `style={{ animation: ... }}` → `@theme` 유틸리티 클래스,
theme.css 이중 매핑 정리, 수제 탭 → `@radix-ui/react-tabs`.
연동 블로커가 아니므로 우선순위 최하. 단 Phase 2에서 InputScreen을 쪼갤 때 탭 교체를 같이 하면 재작업이 없다.

**Phase 5 — Docker 편입**
멀티스테이지 Dockerfile(node build → nginx copy) 또는 기존 nginx 이미지에 dist 포함.
compose에 frontend 빌드 반영, nginx 라우팅: `/` → 정적, `/api/` → django, `/naming-api/`(가칭) → fastapi, SPA fallback.
개발 환경은 `vite.config.ts`에 `server.proxy` 추가(CORS 회피, 상대경로 유지).
완료 기준: `docker compose up` 후 단일 도메인에서 전 플로우 동작.

의존 순서: 0 → 1 → 2 → 3 → 5. Phase 4는 2와 병행.

---

## 4. API 계약 초안 (백엔드 협의용)

| 화면 | 엔드포인트(안) | 담당 | 비고 |
|---|---|---|---|
| Input→Results | `POST /naming-api/names/generate` | FastAPI+Neo4j | body: NameRequest union |
| Chat | `POST /naming-api/chat` | FastAPI | SSE 스트리밍 고려 |
| Login/Signup | `POST /api/auth/login` 등 | Django | 세션 쿠키 시 CSRF 토큰 처리 필수 |
| History/MyPage | `GET /api/me/history` 등 | Django | |
| Insights | `GET /api/insights` | Django | 현재 insights.ts 172줄 목데이터 |
| Admin 4종 | `GET/PUT /api/admin/*` | Django | 서버 RBAC, 403 처리 |
| FAQ/Policy | 정적 유지 가능 | — | 연동 불필요, 후순위 |

- Django 세션 인증 선택 시: 프론트는 `credentials: "include"` + CSRF 헤더 유틸이 client.ts에 필요.
- nginx 뒤 단일 도메인 상대경로 방식이면 프로덕션 CORS 설정 자체가 불필요 — 권장.

## 5. 목표 폴더 구조

```
src/
├── api/            # client.ts + 도메인별 API + 목 어댑터 (신설)
├── app/
│   ├── providers/  # AuthProvider, QueryClientProvider (신설)
│   ├── router.tsx  # lazy 라우트 정의 (App.tsx 대체)
│   ├── components/ # forms/NaturalInputForm.tsx 등 추가
│   ├── screens/    # 화면은 훅 호출 + 렌더만
│   ├── hooks/      # useNameResults, useAuth 등
│   └── types.ts    # DTO는 OpenAPI 생성 타입으로 대체 검토
```

## 6. 리스크

- **FIX_GUIDE v2와의 충돌**: 기존 지시서는 "임의 리팩터링 금지"를 명시 — 본 전략 착수 전 FIX_GUIDE 잔여 태스크 완료 여부를 먼저 정리할 것.
- **문자열 쿼리 계약(P0-1)을 미루면** Phase 1~2 작업을 연동 시점에 재수정하게 됨. 가장 먼저 합의할 것.
- recharts·admin 화면이 번들의 큰 비중 — Phase 3 전까지 데모 초기 로딩 이슈는 상존.
- Neo4j 스키마/FastAPI 응답 형태가 현 `NameResult` 타입과 다를 가능성 높음 → Phase 0에서 타입을 서버 주도로 확정.
