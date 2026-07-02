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
