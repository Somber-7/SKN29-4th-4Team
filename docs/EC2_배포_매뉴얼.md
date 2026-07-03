# 4차 프로젝트 — EC2 환경 구성 매뉴얼

> 저장소: https://github.com/Somber-7/SKN29-4th-4Team  
> 대상: c7i-flex.large (4GB) / Ubuntu / Xshell 접속 완료 상태  
> 순서: A(EC2+AWS 리소스 준비) → B(코드 작성, 로컬) → C(EC2 배포) → D(마무리) → E(최종 연결 테스트)  
> naming_graph.py 실제 `NamingState` 스키마(`query, context, next_action, answer, iterations, used_tools, collections, name_length, surname_hanja`)와 `pipelines/naming_pipeline.py`의 실제 호출 방식을 그대로 반영함.  
> **현재 단계 목표: 프론트엔드는 팀원이 별도 제작 중 — 지금은 "기능 동작"이 아니라 "배포 구조가 뚫려있는지(접속 가능 여부)"만 확인하면 된다.** 실제 기능 연결은 프론트 완성 후 진행.

---

## Part A — EC2 환경 준비

```bash
# A-1. 확인
free -h
lsb_release -a

# A-2. 업데이트
sudo apt update && sudo apt upgrade -y

# A-3. Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker
docker compose version
docker run hello-world
```

### A-4. RDS 생성 (AWS 콘솔)

1. RDS 콘솔 → **데이터베이스 생성**
2. 생성 방식: **표준 생성(Standard create)** — "손쉬운 생성" 아님 (퍼블릭 액세스·초기 DB 이름 설정이 손쉬운 생성엔 없음)
3. 엔진 유형: **PostgreSQL** (Aurora 아님), 버전은 기본값
4. 템플릿: **프리 티어**
5. 설정(Settings):
   - DB 인스턴스 식별자: `naming-qa-db`
   - **자격 증명 설정** 펼치기 → 마스터 사용자 이름: `namingadmin` (또는 `postgres`) — **`admin`은 예약어라 사용 불가**
   - "자동 생성 암호" 체크 해제 → 마스터 암호 직접 입력 + 확인란 동일 입력
6. 인스턴스 구성: `db.t3.micro` (프리 티어 기본값)
7. 스토리지: 기본값 유지
8. 연결(Connectivity):
   - "EC2 컴퓨팅 리소스에 연결" 옵션이 보이면 선택 → VPC/보안 그룹을 EC2 기준으로 자동 매칭 (보안 그룹 이름은 `rds-ec2-1` 형태로 자동 생성됨)
   - 수동으로 할 경우: VPC는 EC2와 동일 선택 → **퍼블릭 액세스: 아니요** → VPC 보안 그룹 **새로 생성** → `naming-qa-rds-sg`
9. **추가 구성(Additional configuration) 반드시 펼치기 → 초기 데이터베이스 이름에 `namingdb` 입력 (필수 — 비워두면 나중에 migrate가 접속할 DB가 없어서 실패)**
   - 주의: DB 이름에 하이픈(`-`) 사용 금지
   - 백업 보존 기간: 0일로 낮춰도 무방 (1주일 프로젝트, 비용 절감)
10. **데이터베이스 생성** 클릭 → 수 분 대기

생성 완료 후:

```bash
# 8번에서 "EC2 컴퓨팅 리소스에 연결"을 썼다면 인바운드 규칙이 이미 자동 설정됨 — 아래는 수동으로 진행한 경우만
# EC2 보안 그룹(naming-qa-rds-sg)에 인바운드 규칙 추가
# 유형: PostgreSQL, 포트: 5432, 소스: EC2 인스턴스의 보안 그룹

# 연결 테스트 (EC2에서)
sudo apt install -y postgresql-client
psql -h <RDS 엔드포인트> -U namingadmin -d namingdb
```

엔드포인트는 RDS 인스턴스 상세 페이지의 "엔드포인트 및 포트"에서 확인 → Part C의 `.env`(`DB_HOST`)에 입력.

### A-5. S3 버킷 생성 (AWS 콘솔)

1. S3 콘솔 → **버킷 만들기**
2. 버킷 이름: 전역 고유 (예: `naming-qa-static-<이니셜>`), 리전: `ap-northeast-2`
3. 객체 소유권: **ACL 비활성화됨(권장)** — 기본값 유지 (최신 S3는 ACL 대신 버킷 정책으로 권한 관리)
4. **이 버킷의 퍼블릭 액세스 차단 설정 → "모든 퍼블릭 액세스 차단" 체크 해제** (정적 파일 공개 서빙 위해 필요, 경고 문구 확인 후 진행)
5. **버킷 만들기** 클릭
6. 생성된 버킷 클릭 → **권한** 탭 → **버킷 정책** 편집 → 아래 입력 (버킷명 교체):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadForStatic",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::<버킷명>/*"
  }]
}
```

### A-6. IAM 사용자 생성 (Django S3 접근용, AWS 콘솔)

1. IAM 콘솔 → **사용자** → **사용자 생성**
2. 사용자 이름: `naming-qa-s3-user`
3. **"AWS Management Console 액세스 제공"은 체크 해제** (프로그래밍 방식 전용, 콘솔 로그인 불필요)
4. 권한 설정: **"직접 정책 연결"** 선택 → `AmazonS3FullAccess` 검색 후 선택
5. **사용자 생성** 완료
6. 생성된 사용자 클릭 → **보안 자격 증명** 탭 → **액세스 키 만들기**
7. 사용 사례: **"로컬 코드"** 선택 → 생성
8. **액세스 키 ID / 비밀 액세스 키를 즉시 복사** (이 화면을 벗어나면 비밀 키는 다시 볼 수 없음) → Part C의 `.env`(`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`)에 입력

---

## Part B — 코드 작성 (팀원 로컬, `SKN29-4th-4Team`에 push)

```bash
git clone https://github.com/Somber-7/SKN29-4th-4Team.git
cd SKN29-4th-4Team
mkdir -p webapp deploy/nginx fastapi_app .github/workflows
```

### B-1. 3차 프로젝트 코드/데이터 복사 (별도 저장소이므로 코드 복사 방식)

`SKN29-3rd-4Team` 클론본이 로컬에 있다는 전제:

```bash
cp -r ../SKN29-3rd-4Team/src ./src
cp -r ../SKN29-3rd-4Team/data ./data
```

`src/mcp/*.py`(rag_server, db_server, law_server, graph_server), `src/graph/naming_graph.py`가 참조하는 `data/chroma`, `data/raw/reference/81suri.json`, `data/raw/reference/yinyang.json`, `data/processed/surname_ohaeng.json`이 전부 포함되어야 한다.

### B-2. Django 프로젝트 (`webapp/`)

```bash
cd webapp
python3 -m venv venv_local && source venv_local/bin/activate
pip install django gunicorn psycopg2-binary python-dotenv boto3 django-storages httpx
django-admin startproject config .
pip freeze > requirements.txt
```

> **스켈레톤 범위**: 지금은 연결 확인용 뼈대만 만든다. 회원가입/작명 폼/이력 조회 등 실제 기능(모델·뷰·템플릿)은 프론트엔드가 준비된 뒤 `naming` 앱을 만들어 채운다 (`python manage.py startapp naming`).

`webapp/config/settings.py` 수정 (핵심 부분만):

```python
import os

ALLOWED_HOSTS = ['*']

# 'naming' 앱은 프론트 연동 시 추가 (INSTALLED_APPS에 등록)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': '5432',
        # 로컬 Postgres 컨테이너는 SSL 미설정이라 필수 아님 — RDS(운영)에서만 요구
        'OPTIONS': {'sslmode': 'require'} if os.environ.get('DB_SSL_REQUIRE') == 'true' else {},
    }
}

STATIC_URL = '/static/'
STATIC_ROOT = '/app/static'

# 로컬 테스트 시 S3 자격증명 없이도 동작하도록 조건 분기 (운영만 S3 사용)
if os.environ.get('USE_S3') == 'true':
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_STORAGE_BUCKET_NAME = os.environ['AWS_STORAGE_BUCKET_NAME']
    AWS_S3_REGION_NAME = 'ap-northeast-2'
    AWS_DEFAULT_ACL = None          # 버킷이 ACL 비활성화 상태 — 버킷 정책으로 공개 읽기 처리
    AWS_QUERYSTRING_AUTH = False    # 서명 쿼리스트링 없는 깔끔한 공개 URL 사용
```

> `DB_SSL_REQUIRE=true`, `USE_S3=true`는 **운영(EC2) `.env`에만** 넣는다. 팀원 로컬 `.env.local`에는 이 두 값을 아예 넣지 않으면(또는 `false`) 로컬 Postgres·로컬 파일 스토리지로 동작한다.

`webapp/config/urls.py` — 연결 확인용 최소 라우팅 (기능 뷰는 프론트 연동 시 `naming` 앱으로 추가):

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path

def health(request):
    return JsonResponse({"status": "ok", "service": "django"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health),
]
```

`webapp/Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

### B-3. FastAPI 앱 (`fastapi_app/main.py`)

`naming_graph.py`의 실제 `NamingState` 스키마와 `naming_pipeline.py`의 실제 호출 방식을 그대로 사용:

```python
"""fastapi_app/main.py — 작명 QA FastAPI 서버. naming_graph.py를 읽기 전용으로 import."""
import os
import sys
import types

def _stub_fastmcp():
    if "fastmcp" in sys.modules:
        return
    mod = types.ModuleType("fastmcp")

    class FastMCP:
        def __init__(self, *a, **kw):
            pass

        def tool(self, f=None, **kw):
            return f if f is not None else (lambda fn: fn)

        def run(self):
            pass

    mod.FastMCP = FastMCP
    sys.modules["fastmcp"] = mod

_stub_fastmcp()
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "mcp"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "graph"))

from fastapi import FastAPI
from pydantic import BaseModel
from naming_graph import build_graph

app = FastAPI(title="작명 QA API")
_graph = None


class AskRequest(BaseModel):
    query: str


class AskResponse(BaseModel):
    answer: str
    context: str = ""


@app.on_event("startup")
async def startup():
    global _graph
    _graph = build_graph()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    state = {
        "query": req.query,
        "context": "",
        "next_action": "generate",
        "answer": "",
        "iterations": 0,
        "used_tools": [],
        "collections": [],
        "name_length": 2,
        "surname_hanja": "",
    }
    result = await _graph.ainvoke(state)
    return AskResponse(answer=result.get("answer", "").strip(), context=result.get("context", ""))


@app.get("/graph/ohaeng")
async def ohaeng_graph():
    nodes = [{"id": n} for n in ["목", "화", "토", "금", "수"]]
    generative = [("목", "화"), ("화", "토"), ("토", "금"), ("금", "수"), ("수", "목")]
    destructive = [("목", "토"), ("토", "수"), ("수", "화"), ("화", "금"), ("금", "목")]
    links = [{"source": a, "target": b, "type": "상생"} for a, b in generative] + \
            [{"source": a, "target": b, "type": "상극"} for a, b in destructive]
    return {"nodes": nodes, "links": links}
```

`requirements-fastapi.txt` (저장소 루트, 3차 프로젝트 `requirements.txt`와 버전 일치):

```
fastapi
uvicorn[standard]
langchain==1.3.6
langgraph==1.2.4
langchain-openai==1.3.0
langchain-community==0.4.2
langchain-text-splitters==1.1.2
chromadb==1.5.9
neo4j==6.2.0
sentence-transformers==5.5.1
pandas==3.0.3
openpyxl==3.1.5
xlrd==2.0.1
python-dotenv==1.2.2
requests
pypdf==6.13.1
pdfplumber==0.11.9
```

`deploy/Dockerfile.fastapi`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements-fastapi.txt .
RUN pip install --no-cache-dir -r requirements-fastapi.txt
COPY fastapi_app/ ./fastapi_app/
COPY src/ ./src/
COPY data/ ./data/
CMD ["uvicorn", "fastapi_app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

검증: `docker build -f deploy/Dockerfile.fastapi .`

### B-4. Nginx 설정

`deploy/nginx/Dockerfile`:

```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

`deploy/nginx/nginx.conf`:

```nginx
server {
    listen 80;

    location /static/ {
        alias /static/;
    }

    location /api/ {
        proxy_pass http://fastapi:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://django:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### B-5. `docker-compose.4th.yml` (저장소 루트)

```yaml
services:
  nginx:
    build: ./deploy/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - django
      - fastapi
    volumes:
      - static_volume:/static

  django:
    build:
      context: ./webapp
    env_file: .env
    volumes:
      - static_volume:/app/static
    expose:
      - "8000"

  fastapi:
    build:
      context: .
      dockerfile: deploy/Dockerfile.fastapi
    env_file: .env
    volumes:
      - ./data:/app/data
    expose:
      - "8001"

  neo4j:
    image: neo4j:5
    environment:
      - NEO4J_AUTH=${NEO4J_USER}/${NEO4J_PASSWORD}
    volumes:
      - neo4j_data:/data
    expose:
      - "7474"
      - "7687"

volumes:
  static_volume:
  neo4j_data:
```

### B-6. GitHub Actions (`.github/workflows/deploy-4th.yml`)

```yaml
name: Deploy 4th Project to EC2

on:
  push:
    branches: [main]
    paths:
      - 'webapp/**'
      - 'fastapi_app/**'
      - 'deploy/**'
      - 'docker-compose.4th.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/SKN29-4th-4Team
            git pull origin main
            docker compose -f docker-compose.4th.yml up --build -d
```

### B-7. 커밋

```bash
cd ../..   # 저장소 루트로
echo ".env" >> .gitignore
echo "venv_local/" >> .gitignore

git add webapp fastapi_app deploy requirements-fastapi.txt docker-compose.4th.yml .github .gitignore src data
git commit -m "4차 프로젝트 초기 구성"
git push origin main
```

---

## Part C — EC2 배포 (Part B가 `main`에 병합된 이후)

```bash
git clone https://github.com/Somber-7/SKN29-4th-4Team.git
cd SKN29-4th-4Team
ls webapp fastapi_app deploy docker-compose.4th.yml data

cp .env.example .env
nano .env   # <> 부분을 실제 값으로 채우기 (RDS 엔드포인트, 비밀번호, API 키, IAM 액세스 키 등)

docker compose -f docker-compose.4th.yml up --build -d
docker compose -f docker-compose.4th.yml ps

docker compose -f docker-compose.4th.yml exec django python manage.py migrate
docker compose -f docker-compose.4th.yml exec django python manage.py collectstatic --noinput

# Neo4j는 컨테이너를 새로 띄운 것이라 최초엔 빈 DB — 3차 프로젝트의 인덱싱 스크립트로 데이터 적재
# (fastapi 컨테이너에 이미 neo4j 패키지 + src/graph + NEO4J_URI 등 env가 있으므로 그대로 실행)
docker compose -f docker-compose.4th.yml exec fastapi python src/graph/index_hanja_neo4j.py --check-connection
docker compose -f docker-compose.4th.yml exec fastapi python src/graph/index_hanja_neo4j.py --execute

curl http://127.0.0.1/
curl http://127.0.0.1/api/health
curl -X POST http://127.0.0.1/api/ask -H "Content-Type: application/json" -d '{"query":"김씨 성에 木오행인 한자 이름 추천해줘"}'
```

GitHub Secrets 등록 (저장소 Settings → Secrets and variables → Actions):

```
EC2_HOST     = <EC2 퍼블릭 IP>
EC2_SSH_KEY  = <.pem 키 파일 전체 내용>
```

```bash
# 자동 배포 확인 (main 병합 후 EC2에서)
docker compose -f docker-compose.4th.yml ps
```

---

## Part D — 마무리

```bash
# HTTPS (도메인 있는 경우, 선택)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d <도메인>
```

**보안 그룹 최종 상태**

| 포트 | 소스 |
|------|------|
| 22 | 0.0.0.0/0 (GitHub Actions가 SSH로 배포하므로 개방 — IP가 고정되지 않아 특정 IP 제한 불가) |
| 80 | 0.0.0.0/0 |
| 443 | 0.0.0.0/0 |

> 22번을 전체 개방한 이유: GitHub Actions 호스팅 러너의 IP가 실행마다 바뀌어 "내 IP"로 제한하면 자동 배포 SSH 연결이 막힘(`dial tcp ***:22: i/o timeout` 발생 이력 있음). 더 안전한 대안(EC2를 셀프 호스팅 러너로 등록해 SSH 자체를 없애는 방법)도 있으나, 설정 복잡도 대비 시간 제약상 전체 개방으로 결정.

```bash
# 트러블슈팅 명령어
docker compose -f docker-compose.4th.yml logs django fastapi
docker compose -f docker-compose.4th.yml logs neo4j
docker compose -f docker-compose.4th.yml config
docker compose -f docker-compose.4th.yml exec django python manage.py collectstatic --noinput
docker compose -f docker-compose.4th.yml restart nginx
```

```bash
# 프로젝트 종료 시 (EC2 콘솔에서 Terminate, Stop 아님)
aws rds delete-db-instance --db-instance-identifier naming-qa-db --skip-final-snapshot
aws s3 rb s3://<버킷명> --force
```

---

## Part E — 최종 연결 테스트 (기능 테스트 아님, 접속 가능 여부만 확인)

Part C의 `curl http://127.0.0.1/`은 EC2 내부에서 실행한 것이라 **보안 그룹·외부 라우팅이 실제로 뚫려 있는지는 증명하지 못한다.** 아래는 팀원 각자의 로컬 PC(EC2 밖)에서 실행한다.

```bash
# 로컬 PC(EC2 아님)에서 실행
EC2_IP=<EC2 퍼블릭 IP>

curl -I http://$EC2_IP/            # Nginx → Django 응답 헤더 확인 (200/302 등 아무 응답이면 OK)
curl -I http://$EC2_IP/api/health  # Nginx → FastAPI 응답 확인 ({"status":"ok"} 기대)
curl -I http://$EC2_IP/admin/      # Django Admin 페이지 접근 가능 여부
```

브라우저에서 `http://<EC2 퍼블릭 IP>/` 접속 — 지금은 임시 페이지/기본 화면만 떠도 무방, **완전히 로딩되고 500/타임아웃이 아니면 통과**.

```bash
# GitHub Actions 자동 배포 확인 — main에 사소한 변경(README 등)을 push한 뒤
# GitHub 저장소 → Actions 탭에서 워크플로우 성공(초록 체크) 확인
```

**Part E 체크리스트 (접속 확인용, 기능 검증 아님)**

- [ ] 외부(로컬 PC)에서 `http://<EC2 IP>/` 응답 옴 (Django 연결 확인)
- [ ] 외부에서 `http://<EC2 IP>/api/health` 응답 옴 (FastAPI 연결 확인)
- [ ] `docker compose -f docker-compose.4th.yml ps` 전체 컨테이너 `Up`
- [ ] RDS `migrate` 성공 (DB 연결 확인, 실제 데이터 검증 아님)
- [ ] GitHub Actions 워크플로우 성공 (자동 배포 파이프라인 연결 확인)

> 실제 기능(작명 요청 → 결과 표시, 오행 시각화 등)은 프론트엔드 완성 후 백엔드와 연결하는 단계에서 별도로 테스트한다.
