"""fastapi_app/main.py — 작명 QA FastAPI 서버. naming_graph.py를 읽기 전용으로 import."""
import asyncio
import os
import sys
import types
from typing import Literal, Optional


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

from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from naming_graph import build_graph
import requests
import time

app = FastAPI(title="작명 QA API")
_graph = None


def log_usage_to_django(
    endpoint: str,
    success: bool,
    statusCode: int,
    latencyMs: int,
    errorType: str = "",
    modelName: str = "",
    promptTokens: int = 0,
    completionTokens: int = 0,
    estimatedCost: float = 0.0
):
    try:
        secret = os.environ.get("DJANGO_SECRET_KEY", "")
        url = "http://django:8000/api/support/log-api-usage"
        payload = {
            "endpoint": endpoint,
            "success": success,
            "statusCode": statusCode,
            "latencyMs": latencyMs,
            "errorType": errorType,
            "modelName": modelName,
            "promptTokens": promptTokens,
            "completionTokens": completionTokens,
            "estimatedCost": estimatedCost
        }
        headers = {"X-Internal-Secret": secret}
        requests.post(url, json=payload, headers=headers, timeout=5)
    except Exception as e:
        print(f"Failed to log API usage: {e}", file=sys.stderr)


# ─────────────────────────────────────────────
# /ask (자유 텍스트 QA)
# ─────────────────────────────────────────────

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
async def ask(req: AskRequest, background_tasks: BackgroundTasks):
    start_time = time.time()
    try:
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
        latency_ms = int((time.time() - start_time) * 1000)
        
        prompt_tokens = 300
        completion_tokens = 200
        estimated_cost = (prompt_tokens * 0.15 + completion_tokens * 0.60) / 1000000
        
        background_tasks.add_task(
            log_usage_to_django,
            endpoint="/ask",
            success=True,
            statusCode=200,
            latencyMs=latency_ms,
            modelName="gpt-4o-mini",
            promptTokens=prompt_tokens,
            completionTokens=completion_tokens,
            estimatedCost=estimated_cost
        )
        return AskResponse(answer=result.get("answer", "").strip(), context=result.get("context", ""))
    except Exception as exc:
        latency_ms = int((time.time() - start_time) * 1000)
        background_tasks.add_task(
            log_usage_to_django,
            endpoint="/ask",
            success=False,
            statusCode=500,
            latencyMs=latency_ms,
            errorType=type(exc).__name__,
            modelName="gpt-4o-mini"
        )
        raise exc


@app.get("/graph/ohaeng")
async def ohaeng_graph():
    nodes = [{"id": n} for n in ["목", "화", "토", "금", "수"]]
    generative = [("목", "화"), ("화", "토"), ("토", "금"), ("금", "수"), ("수", "목")]
    destructive = [("목", "토"), ("토", "수"), ("수", "화"), ("화", "금"), ("금", "목")]
    links = [{"source": a, "target": b, "type": "상생"} for a, b in generative] + \
            [{"source": a, "target": b, "type": "상극"} for a, b in destructive]
    return {"nodes": nodes, "links": links}


# ─────────────────────────────────────────────
# /names/generate — 프론트 frontend/src/app/types.ts와 계약 일치 (camelCase)
# ─────────────────────────────────────────────

class CharBreakdown(BaseModel):
    char: str
    reading: str
    meaning: str
    strokes: int
    element: str


class SukgyeokDetail(BaseModel):
    name: str
    value: int
    fortune: str


class SourceRef(BaseModel):
    type: Literal["hanja", "suri", "beopryeong", "nonmun"]
    label: str


class NameResult(BaseModel):
    id: int
    lastName: CharBreakdown
    hanja: str
    hangul: str
    ruby: list[CharBreakdown]
    sukgyeok: str
    sukgyeokDetail: list[SukgyeokDetail]
    sources: list[SourceRef]


class NameResultList(BaseModel):
    results: list[NameResult]


_STRUCTURE_PROMPT = """당신은 아래 '완성된 추천 결과'를 정해진 JSON 스키마로 그대로 옮겨 담는 역할입니다.
'완성된 추천 결과'는 이미 검증·후처리(수리 재계산, 부적절 한자 교체, 중복 제거 등)를 마친 최종본입니다.
새로운 이름·한자·수리·오행 정보를 만들어내지 마세요 — 스키마 변환일 뿐, 내용을 다시 창작하는 단계가 아닙니다.

각 이름마다 다음을 채우세요:
- lastName: 성씨 한자 1글자의 char/reading(독음)/meaning(뜻)/strokes(획수)/element(오행)
- hanja: 이름(성씨 제외) 한자, hangul: 이름의 한글
- ruby: 이름 각 글자의 char/reading/meaning/strokes/element 배열
- sukgyeok: 수리(획수) 판단 한 줄 요약 — '완성된 추천 결과'의 수리 문장을 그대로 사용
- sukgyeokDetail: 원격/형격/이격/정격 4격의 name/value(획수 합)/fortune(길흉) 배열 — '완성된 추천 결과'에 표기된 숫자를 그대로 사용, 없으면 빈 배열
- sources: 아래 '참고 자료'에서 이 이름과 관련된 출처 유형(hanja/suri/beopryeong/nonmun)과 라벨을 찾아 채움, 못 찾으면 빈 배열

'완성된 추천 결과'에 나온 이름만 그대로 스키마로 변환하세요 — 이름을 추가하거나 빼지 마세요. id는 1부터 순번을 매깁니다."""


def _build_structured_query(req: dict) -> str:
    if req.get("type") == "natural":
        return req.get("query", "")

    parts = [f"{req.get('lastName', '')}씨 성"]
    if req.get("gender"):
        parts.append(f"{req['gender']} 아이")
    if req.get("elements"):
        parts.append(f"{'/'.join(req['elements'])} 오행")
    if req.get("strokeRange"):
        parts.append(f"획수 {req['strokeRange']}")
    if req.get("meaning"):
        parts.append(f"{req['meaning']} 의미")
    parts.append("이름 추천해줘")
    return " ".join(parts)


async def _generate_structured(query: str) -> list[NameResult]:
    state = {
        "query": query,
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
    answer = result.get("answer", "")
    context = result.get("context", "")
    if not answer:
        raise ValueError("empty answer")

    structuring_llm = ChatOpenAI(model="gpt-5.4-mini", temperature=0.3).with_structured_output(NameResultList)
    structured: NameResultList = await structuring_llm.ainvoke([
        SystemMessage(content=_STRUCTURE_PROMPT),
        HumanMessage(content=f"사용자 요청: {query}\n\n완성된 추천 결과:\n{answer}\n\n참고 자료(출처 라벨용):\n{context}"),
    ])
    return structured.results


@app.post("/names/generate")
async def generate_names(req: dict, background_tasks: BackgroundTasks):
    start_time = time.time()
    query = _build_structured_query(req)
    if not query.strip():
        return JSONResponse(status_code=400, content={"message": "요청 내용이 비어 있습니다.", "detail": None})

    try:
        results = await asyncio.wait_for(_generate_structured(query), timeout=90)
        latency_ms = int((time.time() - start_time) * 1000)
        
        prompt_tokens = 500
        completion_tokens = 300
        estimated_cost = (prompt_tokens * 0.15 + completion_tokens * 0.60) / 1000000
        
        background_tasks.add_task(
            log_usage_to_django,
            endpoint="/names/generate",
            success=True,
            statusCode=200,
            latencyMs=latency_ms,
            modelName="gpt-4o-mini",
            promptTokens=prompt_tokens,
            completionTokens=completion_tokens,
            estimatedCost=estimated_cost
        )
    except asyncio.TimeoutError:
        latency_ms = int((time.time() - start_time) * 1000)
        background_tasks.add_task(
            log_usage_to_django,
            endpoint="/names/generate",
            success=False,
            statusCode=504,
            latencyMs=latency_ms,
            errorType="TimeoutError",
            modelName="gpt-4o-mini"
        )
        return JSONResponse(status_code=504, content={"message": "작명 생성 시간이 초과되었습니다.", "detail": None})
    except Exception as exc:
        latency_ms = int((time.time() - start_time) * 1000)
        background_tasks.add_task(
            log_usage_to_django,
            endpoint="/names/generate",
            success=False,
            statusCode=502,
            latencyMs=latency_ms,
            errorType=type(exc).__name__,
            modelName="gpt-4o-mini"
        )
        return JSONResponse(status_code=502, content={"message": "작명 생성에 실패했습니다.", "detail": str(exc)})

    return [r.model_dump() for r in results]


@app.get("/names/sample-preview")
async def sample_preview():
    # 랜딩 화면용 고정 예시 — LLM 호출 없이 즉시 응답 (속도 우선)
    sample = NameResult(
        id=1,
        lastName=CharBreakdown(char="金", reading="김", meaning="성씨 김", strokes=8, element="금"),
        hanja="敏俊",
        hangul="민준",
        ruby=[
            CharBreakdown(char="敏", reading="민", meaning="민첩할", strokes=11, element="수"),
            CharBreakdown(char="俊", reading="준", meaning="준걸", strokes=9, element="화"),
        ],
        sukgyeok="상생이 잘 이루어진 조합입니다.",
        sukgyeokDetail=[],
        sources=[{"type": "hanja", "label": "인명용 한자 예시"}],
    )
    return [sample.model_dump()]
