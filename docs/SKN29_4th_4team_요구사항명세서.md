# SKN29 4차 프로젝트 요구사항 명세서

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 명가작명소 - LLM 연동 AI 작명 서비스 웹 애플리케이션 |
| 문서명 | 요구사항 명세서 |
| 작성일 | 2026-07-08 |
| 문서 버전 | v1.1 |

## 2. 작성 기준

본 문서는 소프트웨어 개발 요구사항 명세서의 기본 구성에 맞춰 시스템 개요, 사용자와 권한, 기능 요구사항, 비기능 요구사항, 데이터 요구사항, 화면 요구사항, 인터페이스 요구사항, 테스트 요구사항, 요구사항 추적표를 정리한다.

| 기준 | 설명 |
|---|---|
| 명확성 | 구현자가 기능 범위, 입력값, 처리 조건, 출력 결과를 이해할 수 있도록 작성한다. |
| 검증 가능성 | 화면 확인, API 호출, 자동 테스트, 배포 확인으로 요구사항 충족 여부를 판단할 수 있어야 한다. |
| 추적성 | 요구사항 ID를 화면, API, 데이터, 테스트 케이스와 연결한다. |
| 일관성 | 프로젝트 계획서, 화면설계서, 시스템 구성도, 구현 코드의 구조와 충돌하지 않도록 작성한다. |
| 확장성 | 관리자 기능, LLM 파이프라인, 데이터 모델이 향후 기능 확장을 수용할 수 있도록 정의한다. |

### 2.1 작성 원칙

| 관점 | 본 명세서 반영 방식 |
|---|---|
| 기능 요구사항 | 사용자 기능, 작명 기능, 이력 기능, 관리자 기능을 `FR-*` 요구사항으로 분리한다. |
| 비기능 요구사항 | 보안, 성능, 반응형 UI, API 안정성, 배포, 유지보수성을 `NFR-*` 요구사항으로 정의한다. |
| 데이터 요구사항 | 사용자, 작명 요청, 작명 결과, 관리자, 콘텐츠, 통계 데이터를 `DATA-*` 항목으로 연결한다. |
| 화면 요구사항 | 사용자 화면과 관리자 화면을 `UI-*` 항목으로 정의하고 관련 기능 요구사항과 연결한다. |
| 인터페이스 요구사항 | Django API, FastAPI 작명 API, 관리자 API, Nginx 라우팅을 `IF-*` 항목으로 정리한다. |
| 테스트 요구사항 | 주요 사용자 시나리오와 예외 상황을 `TC-*` 테스트 항목으로 추적한다. |

## 3. 시스템 개요

명가작명소는 사용자가 작명 조건을 입력하면 React 프론트엔드, Django 기반 사용자/관리자 API, FastAPI 기반 LLM 작명 파이프라인, 관계형 데이터베이스와 검색/그래프 데이터를 연동하여 이름 추천 결과를 제공하는 웹 애플리케이션이다.

| 구성 요소 | 역할 | 대표 구현 위치 |
|---|---|---|
| React/Vite 사용자 앱 | 랜딩, 로그인, 회원가입, 작명 입력, 결과, 이력, 마이페이지, 고객지원 화면 제공 | `frontend/src/app/` |
| React/Vite 관리자 앱 | 관리자 로그인, 대시보드, 회원, 공지, 문의, FAQ, 계정, 통계, 설정 화면 제공 | `frontend/admin.html`, `frontend/src/app/AdminApp.tsx` |
| Django | 세션 인증, 회원가입, 마이페이지, 작명 이력, 고객지원 API 제공 | `webapp/naming/views.py` |
| Django Ninja | 관리자 전용 API, RBAC, 운영 데이터 관리 제공 | `webapp/naming/api.py`, `webapp/naming/auth.py` |
| FastAPI | LLM 작명 생성, 자유 질의, 오행 그래프 데이터 API 제공 | `fastapi_app/main.py` |
| LangGraph/MCP | RAG, 그래프 조회, 작명 검증 도구를 연결하는 작명 파이프라인 구성 | `src/graph/`, `src/mcp/` |
| 통계 집계 배치 | 관리자 대시보드와 통계 화면의 일별 운영 지표 집계 | `webapp/naming/management/commands/aggregate_daily_stats.py`, `docker-compose.local.yml` |
| PostgreSQL | 사용자, 작명 이력, 작명 결과, 관리자, 공지, FAQ, 문의, 통계 데이터 저장 | `webapp/naming/models.py` |
| ChromaDB | 내부 문서 기반 벡터 검색 데이터 저장 | `data/chroma/` |
| Neo4j | 한자, 오행, 그래프 기반 관계 데이터 조회 | `src/graph/` |
| Nginx/Docker | 사용자 앱, 관리자 앱, Django API, FastAPI API 라우팅 및 실행 환경 제공 | `deploy/nginx/`, `docker-compose.local.yml` |

## 4. 사용자 및 권한

| 사용자 유형 | 설명 | 주요 기능 |
|---|---|---|
| 비로그인 사용자 | 서비스를 탐색하고 가입 전 정보를 확인하는 사용자 | 서비스 소개, 이름 트렌드, 공지, FAQ, 문의, 로그인, 회원가입 |
| 로그인 사용자 | 작명 기능과 개인 이력 기능을 사용하는 사용자 | 조건 입력, 작명 생성, 결과 확인, 이력 조회, 마이페이지, 문의 내역 |
| 관리자 ANALYST | 읽기 중심의 운영 현황을 확인하는 관리자 | 대시보드, 통계, 회원 조회 |
| 관리자 ADMIN | 서비스 운영 데이터를 관리하는 관리자 | 회원 관리, 공지 관리, 문의 답변, FAQ 관리, 점검 설정 |
| 관리자 SUPERADMIN | 최고 권한을 가진 관리자 | 관리자 계정 관리, 권한 변경, 감사 로그 조회 |

관리자 인증은 일반 사용자 세션과 분리된 관리자 전용 세션을 사용하며, 최종 권한 판정은 서버의 관리자 API에서 수행한다.

## 5. 요구사항 상태 정의

| 상태 | 의미 |
|---|---|
| 정의됨 | 요구사항으로 명확히 정의되었으며 구현 또는 검증이 진행될 수 있음 |
| 구현 확인 | 코드 또는 화면 구조에서 구현 근거가 확인됨 |
| 설계 확인 | 설계 또는 타입/화면 구조는 있으나 추가 구현이나 시연 확인이 필요함 |
| 검증 확인 | 실행 결과, 자동 테스트, 브라우저 확인 등으로 요구사항 충족 근거가 확인됨 |
| 부분 검증 | 일부 조건은 확인했으나 전체 시나리오 또는 예외 범위까지는 추가 검증이 필요함 |
| 검증 필요 | 구현 근거는 있으나 실제 실행, 브라우저 확인, API 호출 등으로 추가 검증이 필요함 |
| 향후 검토 | 현재 범위 이후 확장 기능으로 관리하는 항목 |

## 6. 기능 요구사항

| 요구사항 ID | 대분류 | 중분류 | 요구사항 내용 | 중요도 | 관련 화면 | 관련 모듈/API | 상태 |
|---|---|---|---|---|---|---|---|
| FR-AUTH-001 | 인증 | CSRF | 시스템은 세션 인증을 위해 CSRF 쿠키를 발급해야 한다. | High | Login, Signup | `GET /api/auth/csrf` | 구현 확인 |
| FR-AUTH-002 | 인증 | 로그인 | 사용자는 아이디와 비밀번호로 로그인할 수 있어야 한다. | High | LoginScreen | `POST /api/auth/login` | 구현 확인 |
| FR-AUTH-003 | 인증 | 계정 상태 검증 | 시스템은 정지, 승인 대기, 승인 거절 계정의 로그인을 제한해야 한다. | High | LoginScreen | `UserProfile.status`, `approval_status` | 구현 확인 |
| FR-AUTH-004 | 인증 | 로그아웃 | 로그인 사용자는 세션을 종료할 수 있어야 한다. | High | GNB, MyPage | `POST /api/auth/logout` | 구현 확인 |
| FR-AUTH-005 | 인증 | 회원가입 | 사용자는 이름, 아이디, 이메일, 비밀번호, 약관 동의 정보를 입력해 가입할 수 있어야 한다. | High | SignupScreen | `POST /api/auth/signup`, `UserProfile` | 구현 확인 |
| FR-AUTH-006 | 인증 | 이메일 중복 방지 | 시스템은 대소문자를 구분하지 않고 이메일 중복 가입을 방지해야 한다. | High | SignupScreen | `POST /api/auth/check-email`, email unique index | 구현 확인 |
| FR-AUTH-007 | 인증 | 계정 찾기 | 사용자는 가입 정보를 기준으로 아이디를 찾거나 비밀번호 재설정을 요청할 수 있어야 한다. | Medium | LoginScreen | `find-username`, `forgot-password` | 구현 확인 |
| FR-RBAC-001 | 권한 | 사용자 접근 제어 | 로그인 사용자 전용 화면은 비로그인 접근 시 로그인 화면으로 이동해야 한다. | High | Input, Results, History, MyPage | `RequireAuth`, `api_login_required` | 구현 확인 |
| FR-RBAC-002 | 권한 | 관리자 접근 제어 | 관리자 화면과 관리자 API는 관리자 권한을 가진 사용자만 접근할 수 있어야 한다. | High | AdminApp | `AdminAuthProvider`, `require_role` | 구현 확인 |
| FR-RBAC-003 | 권한 | 역할 기반 권한 | 관리자 기능은 ANALYST, ADMIN, SUPERADMIN 역할에 따라 접근 범위가 구분되어야 한다. | High | 관리자 전체 | `AdminProfile.Role`, permission map | 구현 확인 |
| FR-LLM-001 | 작명 | 입력 방식 | 사용자는 자연어 입력 또는 상세 조건 입력 방식으로 작명 요청을 생성할 수 있어야 한다. | High | InputScreen | `NameRequest` | 구현 확인 |
| FR-LLM-002 | 작명 | 이름 유형 | 사용자는 한자 이름과 순우리말 이름 중 작명 유형을 선택할 수 있어야 한다. | High | InputScreen | `nameType: hanja/korean` | 구현 확인 |
| FR-LLM-003 | 작명 | 작명 생성 | 시스템은 입력 조건을 FastAPI 작명 API로 전달하고 추천 이름 목록을 반환해야 한다. | High | Processing, Results | `POST /naming-api/names/generate` | 구현 확인 |
| FR-LLM-004 | 작명 | 결과 표시 | 시스템은 추천 이름의 한글, 한자, 의미, 오행, 해설 정보를 사용자에게 표시해야 한다. | High | ResultsScreen | `NameResult`, `NameCard` | 구현 확인 |
| FR-LLM-005 | 작명 | 진행 상태 | 작명 생성 중에는 진행 화면과 단계별 상태를 제공해야 한다. | Medium | ProcessingScreen | loading state | 구현 확인 |
| FR-LLM-006 | 작명 | 예외 처리 | 빈 입력, API 실패, 타임아웃, 생성 실패 상황은 사용자에게 이해 가능한 메시지로 안내해야 한다. | High | Input, Processing, Results | API error handler | 부분 검증 |
| FR-LLM-007 | 작명 | 자유 질의 | 사용자는 작명 결과와 관련된 추가 질문을 할 수 있어야 한다. | Medium | Chat/Results | `POST /naming-api/ask` | 구현 확인 |
| FR-HIST-001 | 이력 | 작명 이력 저장 | 로그인 사용자의 작명 요청과 추천 결과는 이력으로 저장되어야 한다. | High | ResultsScreen | `NamingHistory`, `NamingResult` | 구현 확인 |
| FR-HIST-002 | 이력 | 이력 조회 | 로그인 사용자는 본인의 작명 이력 목록과 상세 결과를 조회할 수 있어야 한다. | High | History, MyPage | `GET /api/me/history` | 구현 확인 |
| FR-MY-001 | 마이페이지 | 내 정보 조회 | 로그인 사용자는 본인 정보, 활동 요약, 최근 이력을 확인할 수 있어야 한다. | Medium | MyPageScreen | `GET /api/me` | 구현 확인 |
| FR-MY-002 | 마이페이지 | 계정 관리 | 로그인 사용자는 비밀번호 변경, 문의 내역 조회, 회원 탈퇴 기능을 사용할 수 있어야 한다. | Medium | MyPageScreen | `/api/me/*` | 구현 확인 |
| FR-SUP-001 | 고객지원 | 공지/FAQ | 사용자는 공지사항과 FAQ를 조회할 수 있어야 한다. | Medium | Notices, FAQ | `/api/support/notices`, `/api/support/faqs` | 구현 확인 |
| FR-SUP-002 | 고객지원 | 문의 접수 | 사용자는 고객 문의를 등록하고 로그인 사용자는 문의 내역을 확인할 수 있어야 한다. | Medium | Contact, MyPage | `/api/support/contact`, `/api/me/inquiries` | 구현 확인 |
| FR-GRAPH-001 | 인사이트 | 이름 트렌드 | 사용자는 이름 트렌드와 오행 그래프 정보를 확인할 수 있어야 한다. | Medium | InsightsScreen | `/api/insights`, `/naming-api/graph/ohaeng` | 구현 확인 |
| FR-ADMIN-001 | 관리자 | 관리자 로그인 | 관리자는 관리자 전용 화면에서 로그인할 수 있어야 한다. | High | AdminLoginScreen | `POST /api/admin/login` | 구현 확인 |
| FR-ADMIN-002 | 관리자 | 대시보드 | 관리자는 사용자, 작명 요청, 문의, 시스템 상태를 요약한 대시보드를 확인할 수 있어야 한다. | High | AdminDashboard | `/api/admin/dashboard`, `/system/health` | 구현 확인 |
| FR-ADMIN-003 | 관리자 | 회원 관리 | 관리자는 회원 목록, 상세 정보, 상태, 승인 여부, 활동 이력을 관리할 수 있어야 한다. | High | AdminUsers | `/api/admin/users/*` | 구현 확인 |
| FR-ADMIN-004 | 관리자 | 공지 관리 | 관리자는 공지사항을 등록, 수정, 삭제, 게시 상태 변경할 수 있어야 한다. | Medium | AdminNotices | `/api/admin/notices/*` | 구현 확인 |
| FR-ADMIN-005 | 관리자 | 문의 관리 | 관리자는 사용자 문의를 조회하고 답변 상태를 관리할 수 있어야 한다. | Medium | AdminInquiries | `/api/admin/inquiries/*` | 구현 확인 |
| FR-ADMIN-006 | 관리자 | FAQ 관리 | 관리자는 FAQ와 FAQ 카테고리를 관리할 수 있어야 한다. | Medium | AdminFAQ | `/api/admin/faqs/*`, `/faq-categories/*` | 구현 확인 |
| FR-ADMIN-007 | 관리자 | 관리자 계정 관리 | SUPERADMIN은 관리자 계정을 생성, 수정, 잠금 해제, 삭제할 수 있어야 한다. | High | AdminAccounts | `/api/admin/accounts/*` | 구현 확인 |
| FR-ADMIN-008 | 관리자 | 통계 관리 | 관리자는 가입, 로그인, 작명 요청, 문의 통계를 조회할 수 있어야 한다. | Medium | AdminStats | `/api/admin/stats` | 구현 확인 |
| FR-ADMIN-009 | 관리자 | 운영 설정 | 관리자는 점검 모드 등 운영 설정을 조회하고 변경할 수 있어야 한다. | Medium | AdminSettings | `/api/admin/settings/maintenance` | 구현 확인 |
| FR-ADMIN-010 | 관리자 | 감사 로그 | SUPERADMIN은 주요 관리자 작업 이력을 조회할 수 있어야 한다. | Medium | AdminAuditLog | `/api/admin/audit-logs` | 검증 확인 |
| FR-ADMIN-011 | 관리자 | 운영 콘텐츠 확장 | 게시물, 사이트 문구, 문의 템플릿, 상세 API 사용량 관리는 향후 운영 확장 기능으로 관리한다. | Low | AdminContent | 관리자 API 확장 | 향후 검토 |

## 7. 비기능 요구사항

| 요구사항 ID | 분류 | 요구사항 내용 | 검증 방법 | 상태 |
|---|---|---|---|---|
| NFR-SEC-001 | 보안 | 사용자 인증은 세션과 CSRF 보호를 기반으로 동작해야 한다. | 로그인/로그아웃/API 호출 검증 | 구현 확인 |
| NFR-SEC-002 | 보안 | 관리자 API는 서버 측 역할 권한 검증을 통과한 요청만 처리해야 한다. | 권한별 401/403 테스트 | 구현 확인 |
| NFR-SEC-003 | 보안 | 일반 사용자 세션과 관리자 세션은 분리되어야 한다. | 쿠키 및 API 접근 검증 | 구현 확인 |
| NFR-SEC-004 | 개인정보 | 약관, 개인정보 동의, 접속 이력 등 개인정보 처리 이력은 추적 가능해야 한다. | DB 모델 및 가입 흐름 검증 | 구현 확인 |
| NFR-API-001 | 안정성 | Django API와 FastAPI API는 일관된 JSON 응답 형식을 제공해야 한다. | API smoke test | 검증 확인 |
| NFR-API-002 | 안정성 | 서버 오류, 입력 오류, 외부 LLM 실패는 사용자 화면에서 처리 가능한 오류로 반환되어야 한다. | 실패 케이스 테스트 | 부분 검증 |
| NFR-UI-001 | 사용성 | 주요 사용자 화면과 관리자 화면은 모바일, 태블릿, 데스크톱에서 레이아웃이 유지되어야 한다. | 브라우저 반응형 확인 | 부분 검증 |
| NFR-UI-002 | 접근성 | 주요 입력, 버튼, 링크는 키보드 접근과 의미 있는 HTML 구조를 고려해야 한다. | 코드 리뷰, 화면 확인 | 부분 검증 |
| NFR-PERF-001 | 성능 | 작명 생성 중 사용자는 대기 상태를 인지할 수 있어야 하며 장시간 응답 지연에 대비해야 한다. | 로딩/타임아웃 테스트 | 구현 확인 |
| NFR-DEP-001 | 배포 | Docker Compose 기반으로 주요 서비스를 재현 가능하게 실행할 수 있어야 한다. | compose 실행 확인 | 구현 확인 |
| NFR-DEP-002 | 배포 | Nginx는 사용자 앱, 관리자 앱, Django API, FastAPI API를 경로별로 라우팅해야 한다. | 라우팅 확인 | 구현 확인 |
| NFR-MAINT-001 | 유지보수 | 프론트엔드 화면, API 클라이언트, 백엔드 API는 기능 영역별로 분리되어야 한다. | 코드 구조 리뷰 | 구현 확인 |
| NFR-TRACE-001 | 추적성 | 요구사항 ID는 화면, API, 데이터, 테스트 항목과 연결되어야 한다. | 추적표 확인 | 구현 확인 |

## 8. 제약사항

| 제약 ID | 분류 | 제약 내용 |
|---|---|---|
| CST-TECH-001 | 기술 스택 | 프론트엔드는 React, Vite, TypeScript 기반으로 구현한다. |
| CST-TECH-002 | 기술 스택 | 사용자 인증과 운영 관리 API는 Django와 Django Ninja 기반으로 구현한다. |
| CST-TECH-003 | 기술 스택 | 작명 생성과 외부 LLM 연동은 FastAPI 기반 서비스로 분리한다. |
| CST-DATA-001 | 데이터 | 영속 데이터는 PostgreSQL을 기준으로 관리하고, 검색/그래프 데이터는 ChromaDB와 Neo4j를 활용한다. |
| CST-SEC-001 | 보안 | 프론트엔드는 직접 데이터베이스에 접근하지 않고 백엔드 API를 통해서만 데이터를 처리한다. |
| CST-DEP-001 | 배포 | 사용자 앱, 관리자 앱, Django API, FastAPI API는 Nginx 라우팅 규칙과 충돌하지 않아야 한다. |
| CST-DOC-001 | 문서 | 요구사항, 화면설계, 시스템 구성, 테스트 결과는 동일한 ID 체계를 유지해야 한다. |

## 9. 데이터 요구사항

| 데이터 ID | 데이터명 | 설명 | 관련 요구사항 |
|---|---|---|---|
| DATA-USER | 사용자 | Django 기본 사용자 계정, 아이디, 이메일, 비밀번호 인증 정보 | FR-AUTH, FR-MY |
| DATA-PROFILE | 사용자 프로필 | 사용자 상태, 승인 상태, 약관 동의, 개인정보 동의, 접속 추적 정보 | FR-AUTH-003, FR-AUTH-005 |
| DATA-LOGIN | 로그인 이력 | 사용자 로그인 일시, IP, User-Agent, 관리자 여부 | FR-AUTH, FR-ADMIN |
| DATA-ADMIN | 관리자 프로필 | 관리자 역할, 표시명, 권한 상태, 잠금 상태 | FR-RBAC, FR-ADMIN |
| DATA-AUDIT | 감사 로그 | 관리자 작업자, 대상, 액션, 상세 내용, 생성 시각 | FR-ADMIN-010 |
| DATA-SETTING | 운영 설정 | 점검 모드, 가입 승인 정책 등 서비스 운영 설정 | FR-ADMIN-009 |
| DATA-NAMING-HISTORY | 작명 이력 | 작명 요청 유형, 조건, 상태, 생성 시각 | FR-HIST |
| DATA-NAMING-RESULT | 작명 결과 | 추천 이름별 한글, 한자, 풀이, 상세 분석 데이터 | FR-LLM, FR-HIST |
| DATA-NOTICE | 공지사항 | 제목, 본문, 게시 상태, 고정 여부, 게시 기간 | FR-SUP, FR-ADMIN |
| DATA-FAQ | FAQ | 질문, 답변, 카테고리, 표시 순서, 활성 상태 | FR-SUP, FR-ADMIN |
| DATA-INQUIRY | 문의 | 문의자, 연락처, 제목, 본문, 답변, 처리 상태 | FR-SUP, FR-ADMIN |
| DATA-METRIC | 일별 통계 | 가입, 로그인, 작명 요청, 문의, 소스 분포 통계 | FR-ADMIN-008 |
| DATA-TREND | 이름 트렌드 | 연도, 성별, 순위, 이름, 트렌드 기사 데이터 | FR-GRAPH |
| DATA-RAG | 검색 데이터 | 작명 근거 생성을 위한 내부 문서 벡터 데이터 | FR-LLM |
| DATA-GRAPH | 그래프 데이터 | 한자, 오행, 관계 기반 작명 보조 데이터 | FR-GRAPH |

## 10. 화면 요구사항

| 화면 ID | 화면명 | 주요 기능 | 관련 요구사항 | 상태 |
|---|---|---|---|---|
| UI-001 | Home/Landing | 서비스 진입, 주요 기능 안내 | FR-SUP | 구현 확인 |
| UI-002 | ServiceIntroScreen | 서비스 소개 | FR-SUP | 구현 확인 |
| UI-003 | LoginScreen | 로그인, 아이디 찾기, 비밀번호 재설정 진입 | FR-AUTH-002, FR-AUTH-007 | 구현 확인 |
| UI-004 | SignupScreen | 회원가입, 약관 동의, 이메일 검증 | FR-AUTH-005, FR-AUTH-006 | 구현 확인 |
| UI-005 | InputScreen | 자연어/상세 조건 입력, 한자/순우리말 선택 | FR-LLM-001, FR-LLM-002 | 구현 확인 |
| UI-006 | ProcessingScreen | 작명 진행 상태 표시 | FR-LLM-005 | 구현 확인 |
| UI-007 | ResultsScreen | 추천 이름 목록과 상세 해설 표시 | FR-LLM-004 | 구현 확인 |
| UI-008 | HistoryScreen | 작명 이력 목록 조회 | FR-HIST-002 | 구현 확인 |
| UI-009 | MyPageScreen | 내 정보, 이력, 문의, 계정 관리 | FR-MY | 구현 확인 |
| UI-010 | InsightsScreen | 이름 트렌드와 그래프 정보 표시 | FR-GRAPH | 구현 확인 |
| UI-011 | NoticesScreen | 공지사항 목록/상세 | FR-SUP-001 | 구현 확인 |
| UI-012 | FAQScreen | FAQ 목록/검색 | FR-SUP-001 | 구현 확인 |
| UI-013 | ContactScreen | 고객 문의 등록 | FR-SUP-002 | 구현 확인 |
| UI-014 | PolicyTermsScreen | 이용약관 표시 | FR-AUTH-005 | 구현 확인 |
| UI-015 | PolicyPrivacyScreen | 개인정보처리방침 표시 | FR-AUTH-005 | 구현 확인 |
| UI-016 | NotFoundScreen | 잘못된 경로 안내 | NFR-UI | 구현 확인 |
| UI-017 | AdminLoginScreen | 관리자 로그인 | FR-ADMIN-001 | 구현 확인 |
| UI-018 | AdminDashboardScreen | 운영 지표, 시스템 상태 확인 | FR-ADMIN-002 | 구현 확인 |
| UI-019 | AdminUsersScreen | 회원 목록, 상세, 상태 관리 | FR-ADMIN-003 | 구현 확인 |
| UI-020 | AdminNoticesScreen | 공지사항 관리 | FR-ADMIN-004 | 구현 확인 |
| UI-021 | AdminInquiriesScreen | 문의 조회와 답변 관리 | FR-ADMIN-005 | 구현 확인 |
| UI-022 | AdminFAQScreen | FAQ 및 카테고리 관리 | FR-ADMIN-006 | 구현 확인 |
| UI-023 | AdminAccountsScreen | 관리자 계정과 권한 관리 | FR-ADMIN-007 | 구현 확인 |
| UI-024 | AdminStatsScreen | 운영 통계 조회 | FR-ADMIN-008 | 구현 확인 |
| UI-025 | AdminSettingsScreen | 점검 모드 등 운영 설정 관리 | FR-ADMIN-009 | 구현 확인 |
| UI-026 | AdminAuditLogScreen | 관리자 감사 로그 조회 | FR-ADMIN-010 | 설계 확인 |
| UI-027 | AdminContentScreen | 운영 콘텐츠 확장 안내 | FR-ADMIN-011 | 향후 검토 |

## 11. 인터페이스 요구사항

| 인터페이스 ID | 구분 | 설명 | 입력 | 출력 | 오류 처리 | 상태 |
|---|---|---|---|---|---|---|
| IF-AUTH-001 | Django API | CSRF 발급 | 없음 | CSRF 쿠키 | 세션 오류 | 구현 확인 |
| IF-AUTH-002 | Django API | 로그인 | username, password | 사용자 정보, 세션 | 400/401/423 | 구현 확인 |
| IF-AUTH-003 | Django API | 회원가입 | name, username, email, password, agreements | 201 응답 | 400 validation | 구현 확인 |
| IF-AUTH-004 | Django API | 이메일 중복 확인 | email | 사용 가능 여부 | 400 validation | 구현 확인 |
| IF-ME-001 | Django API | 내 정보 조회 | 세션 | 사용자 프로필 | 401 | 구현 확인 |
| IF-ME-002 | Django API | 작명 이력 조회/저장 | 세션, 요청/결과 | 이력 목록 또는 201 | 401/400 | 구현 확인 |
| IF-SUP-001 | Django API | 공지/FAQ 조회 | 검색 조건 | 목록/상세 | 미존재 항목 오류 | 구현 확인 |
| IF-SUP-002 | Django API | 문의 등록/조회 | 문의 내용, 세션 | 201 또는 목록 | 400/401 | 구현 확인 |
| IF-LLM-001 | FastAPI API | 작명 생성 | NameRequest | NameResult[] | 400/502/504 | 구현 확인 |
| IF-LLM-002 | FastAPI API | 자유 질의 | query | answer | 400/502 | 구현 확인 |
| IF-LLM-003 | FastAPI API | 오행 그래프 | query/filter | nodes, links | 400/500 | 구현 확인 |
| IF-ADMIN-001 | Admin API | 관리자 인증 | username, password | 관리자 정보, 권한 | 401/423 | 구현 확인 |
| IF-ADMIN-002 | Admin API | 회원 관리 | 검색, 상태, 수정 payload | 회원 목록/상세 | 인증/권한/미존재 오류 | 구현 확인 |
| IF-ADMIN-003 | Admin API | 공지/FAQ/문의 관리 | 콘텐츠 payload | 목록/상세/수정 결과 | 인증/권한/미존재 오류 | 구현 확인 |
| IF-ADMIN-004 | Admin API | 관리자 계정 관리 | 계정 payload | 계정 목록/상세 | 인증/권한/미존재 오류 | 구현 확인 |
| IF-ADMIN-005 | Admin API | 통계/대시보드 | 기간 조건 | 지표, 차트 데이터 | 401/403 | 구현 확인 |
| IF-ADMIN-006 | Admin API | 설정 관리 | 점검 모드 payload | 설정 상태 | 401/403/400 | 구현 확인 |
| IF-ADMIN-007 | Admin API | 감사 로그 | 검색 조건 | 감사 로그 목록 | 401/403 | 검증 확인 |
| IF-NGINX-001 | Nginx | 사용자 앱 라우팅 | `/` 하위 경로 | 사용자 SPA | 잘못된 경로 안내 | 구현 확인 |
| IF-NGINX-002 | Nginx | 관리자 앱 라우팅 | `/manage/` 하위 경로 | 관리자 SPA | 잘못된 경로 안내 | 구현 확인 |
| IF-NGINX-003 | Nginx | API 프록시 | `/api/`, `/naming-api/` | Django/FastAPI 응답 | upstream error | 구현 확인 |

## 12. 사용자 시나리오

### 12.1 회원가입 및 로그인

| 단계 | 사용자 행동 | 시스템 처리 | 관련 요구사항 |
|---|---|---|---|
| 1 | 사용자가 회원가입 화면을 연다. | 회원가입 폼과 약관 동의 항목을 표시한다. | FR-AUTH-005 |
| 2 | 사용자가 가입 정보를 입력한다. | 아이디, 이메일, 비밀번호, 약관 동의를 검증한다. | FR-AUTH-005, FR-AUTH-006 |
| 3 | 사용자가 로그인을 시도한다. | 계정 상태와 승인 상태를 확인하고 세션을 발급한다. | FR-AUTH-002, FR-AUTH-003 |
| 4 | 사용자가 로그아웃한다. | 세션을 종료하고 공개 화면으로 이동한다. | FR-AUTH-004 |

### 12.2 LLM 작명 생성

| 단계 | 사용자 행동 | 시스템 처리 | 관련 요구사항 |
|---|---|---|---|
| 1 | 사용자가 한자 또는 순우리말 이름 유형을 선택한다. | 선택값을 작명 요청 payload에 포함한다. | FR-LLM-002 |
| 2 | 사용자가 자연어 또는 상세 조건을 입력한다. | 입력값을 검증하고 작명 요청을 생성한다. | FR-LLM-001 |
| 3 | 사용자가 작명 생성을 요청한다. | FastAPI 작명 API를 호출하고 진행 화면을 표시한다. | FR-LLM-003, FR-LLM-005 |
| 4 | 작명 결과가 반환된다. | 추천 이름과 상세 해설을 결과 화면에 표시한다. | FR-LLM-004 |
| 5 | 오류가 발생한다. | 오류 메시지와 재시도 가능한 흐름을 제공한다. | FR-LLM-006 |

### 12.3 작명 이력 및 마이페이지

| 단계 | 사용자 행동 | 시스템 처리 | 관련 요구사항 |
|---|---|---|---|
| 1 | 로그인 사용자가 작명 결과를 확인한다. | 작명 요청과 결과를 이력 데이터로 저장한다. | FR-HIST-001 |
| 2 | 사용자가 작명 기록 화면을 연다. | 본인의 작명 이력 목록을 조회한다. | FR-HIST-002 |
| 3 | 사용자가 마이페이지를 연다. | 내 정보, 최근 이력, 문의 내역을 표시한다. | FR-MY-001 |
| 4 | 사용자가 계정 관리를 요청한다. | 비밀번호 변경 또는 탈퇴 요청을 처리한다. | FR-MY-002 |

### 12.4 관리자 운영

| 단계 | 관리자 행동 | 시스템 처리 | 관련 요구사항 |
|---|---|---|---|
| 1 | 관리자가 관리자 화면에 접근한다. | 관리자 전용 화면과 로그인 폼을 제공한다. | FR-ADMIN-001 |
| 2 | 관리자가 로그인한다. | 관리자 세션과 역할별 권한 목록을 반환한다. | FR-RBAC-002, FR-RBAC-003 |
| 3 | 관리자가 대시보드를 확인한다. | 운영 지표와 시스템 상태를 표시한다. | FR-ADMIN-002 |
| 4 | 관리자가 회원, 공지, 문의, FAQ를 관리한다. | 권한에 따라 조회, 등록, 수정, 삭제 기능을 제공한다. | FR-ADMIN-003~006 |
| 5 | SUPERADMIN이 계정을 관리한다. | 관리자 계정과 역할 변경을 처리하고 감사 이력을 남긴다. | FR-ADMIN-007, FR-ADMIN-010 |

## 13. 테스트 요구사항

| 테스트 ID | 테스트 대상 | 테스트 내용 | 관련 요구사항 | 상태 |
|---|---|---|---|---|
| TC-AUTH-001 | 회원가입 | 정상 가입, 중복 아이디/이메일, 약관 미동의, 비밀번호 정책 검증 | FR-AUTH-005, FR-AUTH-006 | 구현 확인 |
| TC-AUTH-002 | 로그인 | 정상 로그인, 비밀번호 오류, 정지/승인 대기/거절 계정 로그인 제한 검증 | FR-AUTH-002, FR-AUTH-003 | 구현 확인 |
| TC-AUTH-003 | 세션 | 로그아웃, 비로그인 접근 제어, 내 정보 조회 검증 | FR-AUTH-004, FR-RBAC-001 | 구현 확인 |
| TC-LLM-001 | 작명 생성 | 한자/순우리말 작명 요청과 결과 렌더링 검증 | FR-LLM-001~004 | 부분 검증 |
| TC-LLM-002 | 작명 예외 | 빈 입력, 외부 API 실패, 타임아웃, 재시도 흐름 검증 | FR-LLM-006 | 부분 검증 |
| TC-HIST-001 | 이력 | 작명 이력 저장, 목록 조회, 과거 결과 재확인 검증 | FR-HIST-001~002 | 구현 확인 |
| TC-SUP-001 | 고객지원 | 공지, FAQ, 문의 등록과 문의 내역 조회 검증 | FR-SUP-001~002 | 구현 확인 |
| TC-ADMIN-001 | 관리자 인증 | 관리자 로그인, 권한 조회, 로그아웃 검증 | FR-ADMIN-001, FR-RBAC | 구현 확인 |
| TC-ADMIN-002 | 관리자 운영 | 회원, 공지, 문의, FAQ, 계정, 설정 관리 검증 | FR-ADMIN-003~009 | 구현 확인 |
| TC-ADMIN-003 | 관리자 감사 | 관리자 주요 작업의 감사 로그 기록과 조회 검증 | FR-ADMIN-010 | 검증 확인 |
| TC-UI-001 | 반응형 UI | 사용자/관리자 주요 화면의 모바일, 태블릿, 데스크톱 레이아웃 검증 | NFR-UI-001 | 부분 검증 |
| TC-DEP-001 | 배포 | Docker, Nginx, Django, FastAPI, DB 연결과 주요 경로 응답 검증 | NFR-DEP | 검증 확인 |
| TC-TRACE-001 | 추적성 | 요구사항 ID가 화면, API, 데이터, 테스트 항목과 연결되는지 확인 | NFR-TRACE-001 | 구현 확인 |

## 14. 요구사항 추적표

| 요구사항 ID | 관련 화면 | 관련 API/모듈 | 관련 데이터 | 테스트 ID |
|---|---|---|---|---|
| FR-AUTH-001 | Login, Signup | `/api/auth/csrf` | 세션/CSRF 쿠키 | TC-AUTH-003 |
| FR-AUTH-002 | LoginScreen | `/api/auth/login` | User, UserProfile | TC-AUTH-002 |
| FR-AUTH-003 | LoginScreen | `UserProfile.status`, `approval_status` | UserProfile | TC-AUTH-002 |
| FR-AUTH-005 | SignupScreen | `/api/auth/signup` | User, UserProfile | TC-AUTH-001 |
| FR-AUTH-006 | SignupScreen | `/api/auth/check-email` | User.email | TC-AUTH-001 |
| FR-RBAC-001 | User 화면 | `RequireAuth`, `api_login_required` | User session | TC-AUTH-003 |
| FR-RBAC-002 | Admin 화면 | `AdminAuthProvider`, `require_role` | AdminProfile | TC-ADMIN-001 |
| FR-LLM-001 | InputScreen | `NameRequest` | 요청 payload | TC-LLM-001 |
| FR-LLM-002 | InputScreen | `nameType` | 요청 payload | TC-LLM-001 |
| FR-LLM-003 | ProcessingScreen | `/naming-api/names/generate` | NameRequest | TC-LLM-001 |
| FR-LLM-004 | ResultsScreen | `NameResult`, `NameCard` | NamingResult | TC-LLM-001 |
| FR-LLM-006 | Processing, Results | API error handler | 오류 payload | TC-LLM-002 |
| FR-HIST-001 | ResultsScreen | `/api/me/history` | NamingHistory, NamingResult | TC-HIST-001 |
| FR-HIST-002 | History, MyPage | `/api/me/history` | NamingHistory, NamingResult | TC-HIST-001 |
| FR-SUP-001 | Notices, FAQ | `/api/support/notices`, `/api/support/faqs` | Notice, FAQ | TC-SUP-001 |
| FR-SUP-002 | Contact, MyPage | `/api/support/contact`, `/api/me/inquiries` | ContactInquiry | TC-SUP-001 |
| FR-GRAPH-001 | InsightsScreen | `/api/insights`, `/naming-api/graph/ohaeng` | NameTrendStat, TrendArticle, graph data | TC-LLM-001 |
| FR-ADMIN-001 | AdminLogin | `/api/admin/login` | AdminProfile | TC-ADMIN-001 |
| FR-ADMIN-002 | AdminDashboard | `/api/admin/dashboard`, `/system/health` | DailyMetric | TC-ADMIN-002 |
| FR-ADMIN-003 | AdminUsers | `/api/admin/users/*` | User, UserProfile, LoginHistory | TC-ADMIN-002 |
| FR-ADMIN-004 | AdminNotices | `/api/admin/notices/*` | Notice | TC-ADMIN-002 |
| FR-ADMIN-005 | AdminInquiries | `/api/admin/inquiries/*` | ContactInquiry | TC-ADMIN-002 |
| FR-ADMIN-006 | AdminFAQ | `/api/admin/faqs/*` | FAQ | TC-ADMIN-002 |
| FR-ADMIN-007 | AdminAccounts | `/api/admin/accounts/*` | AdminProfile | TC-ADMIN-002 |
| FR-ADMIN-008 | AdminStats | `/api/admin/stats` | DailyMetric | TC-ADMIN-002 |
| FR-ADMIN-009 | AdminSettings | `/api/admin/settings/maintenance` | Setting | TC-ADMIN-002 |
| FR-ADMIN-010 | AdminAuditLog | `/api/admin/audit-logs` | AdminAuditLog | TC-ADMIN-003 |
| NFR-UI-001 | 전체 화면 | responsive layout | N/A | TC-UI-001 |
| NFR-DEP-001 | 배포 환경 | Docker Compose | 컨테이너/볼륨 | TC-DEP-001 |
| NFR-TRACE-001 | 전체 산출물 | 요구사항 ID 체계 | N/A | TC-TRACE-001 |

## 15. 요구사항 품질 검토

본 섹션은 요구사항이 구현과 테스트로 이어질 수 있는 수준으로 정의되었는지 확인하기 위한 품질 검토 기준이다.

| 검토 항목 | 검토 기준 | 관련 요구사항 | 확인 방법 | 상태 |
|---|---|---|---|---|
| 기능 완전성 | 핵심 사용자 기능, 작명 기능, 이력 기능, 관리자 운영 기능이 요구사항으로 정의되어 있는가 | FR-AUTH, FR-LLM, FR-HIST, FR-MY, FR-SUP, FR-ADMIN | 기능 요구사항과 사용자 시나리오 확인 | 충족 |
| 비기능 완전성 | 보안, API 안정성, 반응형 UI, 배포, 유지보수성, 추적성 기준이 정의되어 있는가 | NFR-SEC, NFR-API, NFR-UI, NFR-DEP, NFR-MAINT, NFR-TRACE | 비기능 요구사항 확인 | 충족 |
| 사용자 및 권한 정의 | 비로그인 사용자, 로그인 사용자, 관리자 역할별 접근 범위가 구분되어 있는가 | FR-RBAC, FR-ADMIN | 사용자/권한 정의와 관리자 요구사항 확인 | 충족 |
| 데이터 요구사항 연결 | 주요 기능이 필요한 데이터 모델과 연결되어 있는가 | DATA-USER, DATA-NAMING-HISTORY, DATA-NAMING-RESULT, DATA-ADMIN, DATA-METRIC | 데이터 요구사항과 추적표 확인 | 충족 |
| 화면 요구사항 연결 | 사용자 화면과 관리자 화면이 기능 요구사항과 연결되어 있는가 | UI-001~027 | 화면 요구사항과 요구사항 추적표 확인 | 충족 |
| 인터페이스 명확성 | 사용자 API, 관리자 API, LLM API, 배포 라우팅의 입력과 출력이 구분되어 있는가 | IF-AUTH, IF-ME, IF-LLM, IF-ADMIN, IF-NGINX | 인터페이스 요구사항 확인 | 충족 |
| 테스트 가능성 | 요구사항별 검증 시나리오와 테스트 ID가 정의되어 있는가 | TC-AUTH, TC-LLM, TC-HIST, TC-ADMIN, TC-UI, TC-DEP | 테스트 요구사항과 추적표 확인 | 충족 |
| 추적성 | 요구사항 ID가 화면, API/모듈, 데이터, 테스트 항목으로 연결되어 있는가 | FR-*, NFR-*, TC-* | 요구사항 추적표 확인 | 충족 |
