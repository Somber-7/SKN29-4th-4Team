"""fastapi_app/main.py — 작명 QA FastAPI 서버. naming_graph.py를 읽기 전용으로 import."""
import asyncio
import functools
import os
import re
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

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import rag_server
from naming_graph import build_graph, _resolve_surname, _SURNAME_OHAENG, _KOREAN_NAME_KW

app = FastAPI(title="작명 QA API")
_graph = None


class NeedMoreInfoError(Exception):
    """파이프라인이 이름 대신 반문(clarify)을 반환한 경우 — 422로 안내를 전달한다."""

    def __init__(self, guidance: str):
        super().__init__(guidance)
        self.guidance = guidance


# ─────────────────────────────────────────────
# /ask (자유 텍스트 QA) — 기존 그대로 유지
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
결과 개수와 순서는 '완성된 추천 결과'의 "## [이름 N]" 헤더 개수·순서와 정확히 일치해야 합니다.
헤더에 없는 이름(한자든 순우리말이든)을 새로 지어내 추가하는 것은 절대 금지입니다.

각 이름마다 다음을 채우세요:
- lastName: 성씨 한자 1글자의 char/reading(독음)/meaning(뜻)/strokes(획수)/element(오행)
- hanja: 이름(성씨 제외) 한자. 순우리말 이름(한자가 없는 이름)이면 빈 문자열("")로 둘 것 — 한글 음절을 이 필드에 넣지 마세요.
- hangul: 이름의 한글
- ruby: 이름 각 글자의 char/reading/meaning/strokes/element 배열. 순우리말 이름이면 빈 배열([])로 둘 것 —
  한자가 없는데 음절을 char로, 임의 숫자를 strokes로 채워 넣지 마세요.
- sukgyeok: 한자 이름은 수리(획수) 판단 한 줄 요약, 순우리말 이름은 뜻풀이 문장 — '완성된 추천 결과'에 있는 문장을 그대로 사용
- sukgyeokDetail: 원격/형격/이격/정격 4격의 name/value(획수 합)/fortune(길흉) 배열 — '완성된 추천 결과'에 표기된 숫자를 그대로 사용, 없으면(순우리말 포함) 빈 배열
- sources: 아래 '참고 자료'에서 이 이름과 관련된 출처 유형(hanja/suri/beopryeong/nonmun)과 라벨을 찾아 채움, 못 찾으면 빈 배열

'완성된 추천 결과'에 나온 이름만 그대로 스키마로 변환하세요 — 이름을 추가하거나 빼지 마세요. id는 1부터 순번을 매깁니다."""


# 동음이의 성씨의 대표 한자(인구 최다 본관 기준, 2015 통계청 성씨 통계).
# 구조화 요청은 한글 성씨만 오므로, 한자를 명시해 파이프라인의 clarify(동음이의 반문)를 차단한다.
# 결과 카드의 lastName.char로 선택된 한자가 그대로 노출된다.
_DEFAULT_SURNAME_HANJA = {
    "김": "金", "이": "李", "박": "朴", "최": "崔", "정": "鄭", "강": "姜",
    "조": "趙", "윤": "尹", "장": "張", "임": "林", "한": "韓", "오": "吳",
    "서": "徐", "신": "申", "권": "權", "황": "黃", "안": "安", "송": "宋",
    "전": "全", "홍": "洪", "유": "柳", "고": "高", "문": "文", "양": "梁",
    "손": "孫", "배": "裵", "백": "白", "허": "許", "남": "南", "심": "沈",
    "노": "盧", "하": "河", "곽": "郭", "성": "成", "차": "車", "주": "朱",
    "우": "禹", "구": "具", "민": "閔", "진": "陳", "지": "池", "엄": "嚴",
    "채": "蔡", "원": "元", "천": "千", "방": "方", "공": "孔", "현": "玄",
    "함": "咸", "변": "卞", "염": "廉", "여": "呂", "추": "秋", "도": "都",
    "소": "蘇", "석": "石", "선": "宣", "설": "薛", "마": "馬", "길": "吉",
}


def _inject_default_surname_hanja(query: str) -> str:
    """자연어 쿼리의 '○씨'에 한자 병기가 없으면 대표 한자를 주입해
    동음이의 성씨 clarify(반문)를 차단한다. 예: '이씨 딸' → '이씨(李) 딸'
    사용자가 이미 한자를 쓴 경우(오행·吉凶 표기 제외)는 임의 대체하지 않는다."""
    non_element_hanja = re.sub(r'[木火土金水吉凶]', '', query)
    if re.search(r'[一-鿿]', non_element_hanja):
        return query
    m = re.search(r'([가-힣]{1,2})씨', query)
    if not m:
        return query
    hanja = _DEFAULT_SURNAME_HANJA.get(m.group(1))
    if not hanja:
        return query
    return query[:m.end()] + f"({hanja})" + query[m.end():]


def _inject_korean_name_type_hint(query: str, name_type: str) -> str:
    """nameType이 'korean'인데도 쿼리에 순우리말 관련 단어가 전혀 없으면 힌트를 덧붙인다.
    naming_graph의 이름 유형 미지정 시 기본값은 한자 이름이므로, 프론트에서 순우리말
    탭을 선택했다면 사용자가 굳이 "순우리말"이라 쓰지 않아도 그쪽으로 확실히 가야 한다."""
    if name_type != "korean" or any(kw in query for kw in _KOREAN_NAME_KW):
        return query
    return f"{query} (순우리말 이름으로 추천해줘)"


def _build_structured_query(req: dict) -> str:
    name_type = req.get("nameType", "hanja")

    if req.get("type") == "natural":
        query = _inject_default_surname_hanja(req.get("query", ""))
        return _inject_korean_name_type_hint(query, name_type)

    last = req.get("lastName", "")
    default_hanja = _DEFAULT_SURNAME_HANJA.get(last)
    parts = [f"{last}씨({default_hanja}) 성" if default_hanja else f"{last}씨 성"]
    if req.get("gender"):
        parts.append(f"{req['gender']} 아이")
    if name_type == "korean":
        # 순우리말은 오행·획수 개념을 쓰지 않는다 (naming_graph의 순우리말 전용 프롬프트가
        # 오행·획수·한자 언급을 금지) — 프론트도 이 필드들을 안 보내지만 방어적으로 한 번 더 배제.
        parts.append("순우리말")
    elif req.get("elements"):
        # "木오행"처럼 붙여 써야 파이프라인 오행 파서가 인식한다.
        # 파서는 첫 매칭만 사용하므로 다중 선택 시 첫 항목이 우선 반영된다.
        parts.append(" ".join(f"{el}오행" for el in req["elements"]))
    if name_type != "korean" and req.get("strokeRange"):
        parts.append(f"획수 {req['strokeRange']}")
    if req.get("meaning"):
        parts.append(f"{req['meaning']} 의미")
    parts.append("이름 추천해줘")
    return " ".join(parts)


@functools.lru_cache(maxsize=1)
def _hanja_meta_map() -> dict:
    """인명용 한자 캐시를 한자→메타데이터 딕셔너리로 변환합니다 (결과 교차보정용)."""
    return {
        meta.get("hanja"): meta
        for _, meta in rag_server._load_person_name_hanja()
        if meta and meta.get("hanja")
    }


def _correct_results_from_db(results: list[NameResult], query: str) -> list[NameResult]:
    """구조화 LLM이 채운 글자 정보(획수·오행·독음·뜻)를 DB 실제값으로 교정합니다.
    마크다운 답변에 없는 성씨 획수/오행/뜻은 LLM이 지어낼 수밖에 없으므로 여기서 바로잡는다."""
    meta_map = _hanja_meta_map()

    surname_kr, surname_info = _resolve_surname(query)
    if surname_kr and not surname_info:
        # 동음이의 없는 성씨는 사전으로 자동 해결 (llm_router_node와 동일 규칙)
        entries = [(k, v) for k, v in _SURNAME_OHAENG.items() if v.get("hangul") == surname_kr]
        if len(entries) == 1:
            k, v = entries[0]
            surname_info = {"hanja": k, "resource_ohaeng": v.get("resource_ohaeng", "")}

    s_hanja = (surname_info or {}).get("hanja", "")
    s_strokes = rag_server.get_hanja_strokes(s_hanja) if s_hanja else 0
    if s_hanja and not s_strokes:
        s_strokes = int(_SURNAME_OHAENG.get(s_hanja, {}).get("strokes", 0) or 0)
    s_element = (surname_info or {}).get("resource_ohaeng", "")
    s_meaning = (meta_map.get(s_hanja) or {}).get("sound_meaning", "")

    for r in results:
        if s_hanja:
            r.lastName.char = s_hanja
            if surname_kr:
                r.lastName.reading = surname_kr
            if s_strokes:
                r.lastName.strokes = s_strokes
            if s_element:
                r.lastName.element = s_element
            if s_meaning:
                r.lastName.meaning = s_meaning
        for cb in r.ruby:
            meta = meta_map.get(cb.char)
            if not meta:
                continue
            if meta.get("hangul"):
                cb.reading = meta["hangul"]
            if meta.get("strokes"):
                cb.strokes = int(meta["strokes"])
            if meta.get("resource_ohaeng"):
                cb.element = meta["resource_ohaeng"]
            if meta.get("sound_meaning"):
                cb.meaning = meta["sound_meaning"]
        if r.ruby and all(cb.reading for cb in r.ruby):
            r.hangul = "".join(cb.reading for cb in r.ruby)
        elif not r.ruby and surname_kr and r.hangul.startswith(surname_kr) and len(r.hangul) > len(surname_kr):
            # 순우리말 결과(ruby 없음)는 위 재조립이 적용되지 않는다 — 구조화 LLM이 hangul
            # 필드에 성씨 발음을 중복 삽입하는 경우가 있어(예: "임소하" -> "임임소하") 잘라낸다.
            r.hangul = r.hangul[len(surname_kr):]
    return results


async def _generate_structured(query: str, exclude_names: list[str] | None = None) -> list[NameResult]:
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
        "exclude_names": exclude_names or [],
        "structured_results": [],
    }
    result = await _graph.ainvoke(state)
    answer = result.get("answer", "")
    context = result.get("context", "")

    # constraint-first 경로가 구조화 결과를 직접 채운 경우 — 값이 전부 DB 실측이므로
    # 2차 변환 LLM과 교차보정 없이 그대로 사용한다.
    direct = result.get("structured_results") or []
    if direct:
        return [NameResult(**item) for item in direct]

    if not answer:
        raise ValueError("empty answer")

    # 파이프라인이 이름 대신 반문(clarify)을 반환한 경우 — 구조화 LLM에 넘기면
    # 빈 배열이나 지어낸 이름이 나오므로, 반문 내용을 그대로 클라이언트에 전달한다.
    if "## [이름" not in answer:
        raise NeedMoreInfoError(answer)

    # (fallback 경로) 형식 변환 전용이므로 temperature 0
    structuring_llm = ChatOpenAI(model="gpt-5.4-mini", temperature=0).with_structured_output(NameResultList)
    structured: NameResultList = await structuring_llm.ainvoke([
        SystemMessage(content=_STRUCTURE_PROMPT),
        HumanMessage(content=f"사용자 요청: {query}\n\n완성된 추천 결과:\n{answer}\n\n참고 자료(출처 라벨용):\n{context}"),
    ])
    return _correct_results_from_db(structured.results, query)


@app.post("/names/generate")
async def generate_names(req: dict):
    query = _build_structured_query(req)
    if not query.strip():
        return JSONResponse(status_code=400, content={"message": "요청 내용이 비어 있습니다.", "detail": None})

    # 재생성 시 이미 추천한 이름 제외 (프론트가 기존 결과의 hangul 목록을 넘김)
    raw_exclude = req.get("excludeNames")
    exclude_names = [str(n) for n in raw_exclude if n] if isinstance(raw_exclude, list) else []

    try:
        results = await asyncio.wait_for(_generate_structured(query, exclude_names), timeout=90)
    except asyncio.TimeoutError:
        return JSONResponse(status_code=504, content={"message": "작명 생성 시간이 초과되었습니다.", "detail": None})
    except NeedMoreInfoError as exc:
        return JSONResponse(
            status_code=422,
            content={"message": "이름을 생성하려면 추가 정보가 필요합니다.", "detail": exc.guidance},
        )
    except Exception as exc:
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
