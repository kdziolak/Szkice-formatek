"""Minimal OpenAI Responses -> Chat Completions adapter for a Kaggle Qwen server.

This is intentionally not a full OpenAI Responses API implementation. It covers the
small request/response surface Codex commonly needs when a local or remote Qwen
server exposes /v1/chat/completions but not /v1/responses.
"""

from __future__ import annotations

import os
import json
import time
import uuid
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse


APP_NAME = "qwen-responses-to-chat-proxy"


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


QWEN_KAGGLE_BASE_URL = env(
    "QWEN_KAGGLE_BASE_URL",
    os.getenv("QWEN_COLAB_BASE_URL", "http://127.0.0.1:8000"),
).rstrip("/")
QWEN_KAGGLE_API_KEY = env("QWEN_KAGGLE_API_KEY", os.getenv("QWEN_COLAB_API_KEY", "not-set"))
QWEN_MODEL_ID = env("QWEN_MODEL_ID", "Qwen/Qwen3.5-9B")
PROXY_API_KEY = env("PROXY_API_KEY", "dev-proxy-key")
PROXY_TIMEOUT_SECONDS = float(env("PROXY_TIMEOUT_SECONDS", "120"))

app = FastAPI(title=APP_NAME, version="0.1.0")


def require_auth(authorization: str | None) -> None:
    expected = f"Bearer {PROXY_API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def normalize_messages(payload: dict[str, Any]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    instructions = payload.get("instructions")
    if isinstance(instructions, str) and instructions.strip():
        messages.append({"role": "system", "content": instructions})

    raw_input = payload.get("input", "")
    if isinstance(raw_input, str):
        messages.append({"role": "user", "content": raw_input})
        return messages

    if isinstance(raw_input, list):
        for item in raw_input:
            if not isinstance(item, dict):
                continue
            role = str(item.get("role", "user"))
            content = item.get("content", "")
            if isinstance(content, str):
                messages.append({"role": role, "content": content})
            elif isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict):
                        text_parts.append(str(part.get("text") or part.get("content") or ""))
                messages.append({"role": role, "content": "\n".join(p for p in text_parts if p)})
        if messages:
            return messages

    raise HTTPException(status_code=400, detail="Unsupported Responses input format")


def chat_payload_from_responses(payload: dict[str, Any]) -> dict[str, Any]:
    chat_payload: dict[str, Any] = {
        "model": payload.get("model") or QWEN_MODEL_ID,
        "messages": normalize_messages(payload),
    }
    if "temperature" in payload:
        chat_payload["temperature"] = payload["temperature"]
    if "max_output_tokens" in payload:
        chat_payload["max_tokens"] = payload["max_output_tokens"]
    return chat_payload


def extract_chat_text(chat_response: dict[str, Any]) -> str:
    choices = chat_response.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    content = message.get("content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(str(part.get("text", "")) for part in content if isinstance(part, dict))
    return str(content)


def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def stream_response(response: dict[str, Any], text: str):
    response_id = response["id"]
    model = response["model"]
    created_at = response["created_at"]
    item_id = f"msg_{uuid.uuid4().hex}"
    output_index = 0
    content_index = 0
    yield sse("response.created", {"type": "response.created", "response": {"id": response_id, "object": "response", "created_at": created_at, "model": model, "status": "in_progress", "output": []}})
    yield sse("response.output_item.added", {"type": "response.output_item.added", "output_index": output_index, "item": {"id": item_id, "type": "message", "status": "in_progress", "role": "assistant", "content": []}})
    yield sse("response.content_part.added", {"type": "response.content_part.added", "item_id": item_id, "output_index": output_index, "content_index": content_index, "part": {"type": "output_text", "text": ""}})
    yield sse("response.output_text.delta", {"type": "response.output_text.delta", "item_id": item_id, "output_index": output_index, "content_index": content_index, "delta": text})
    yield sse("response.output_text.done", {"type": "response.output_text.done", "item_id": item_id, "output_index": output_index, "content_index": content_index, "text": text})
    yield sse("response.content_part.done", {"type": "response.content_part.done", "item_id": item_id, "output_index": output_index, "content_index": content_index, "part": {"type": "output_text", "text": text}})
    yield sse("response.output_item.done", {"type": "response.output_item.done", "output_index": output_index, "item": {"id": item_id, "type": "message", "status": "completed", "role": "assistant", "content": [{"type": "output_text", "text": text}]}})
    yield sse("response.completed", {"type": "response.completed", "response": response})
    yield "data: [DONE]\n\n"


async def forward_json(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {QWEN_KAGGLE_API_KEY}"}
    timeout = httpx.Timeout(PROXY_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.request(method, f"{QWEN_KAGGLE_BASE_URL}{path}", json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Timed out contacting Qwen Kaggle endpoint") from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Could not reach Qwen Kaggle endpoint") from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=f"Qwen endpoint error: {response.text[:1000]}")
    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Qwen endpoint returned non-JSON response") from exc


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "service": APP_NAME, "qwen_base_url": QWEN_KAGGLE_BASE_URL, "model": QWEN_MODEL_ID}


@app.get("/v1/models")
async def models(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_auth(authorization)
    try:
        return await forward_json("GET", "/v1/models")
    except HTTPException:
        return {"object": "list", "data": [{"id": QWEN_MODEL_ID, "object": "model", "owned_by": "qwen-kaggle"}]}


@app.post("/v1/chat/completions")
async def chat_completions(request: Request, authorization: str | None = Header(default=None)) -> JSONResponse:
    require_auth(authorization)
    payload = await request.json()
    payload.setdefault("model", QWEN_MODEL_ID)
    result = await forward_json("POST", "/v1/chat/completions", payload)
    return JSONResponse(result)


@app.post("/v1/responses")
async def responses(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_auth(authorization)
    payload = await request.json()
    wants_stream = bool(payload.pop("stream", False))
    chat_payload = chat_payload_from_responses(payload)
    chat_response = await forward_json("POST", "/v1/chat/completions", chat_payload)
    text = extract_chat_text(chat_response)
    model = chat_payload["model"]
    response = {
        "id": f"resp_{uuid.uuid4().hex}",
        "object": "response",
        "created_at": int(time.time()),
        "model": model,
        "output": [
            {
                "id": f"msg_{uuid.uuid4().hex}",
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": text}],
            }
        ],
        "output_text": text,
    }
    if wants_stream:
        return StreamingResponse(stream_response(response, text), media_type="text/event-stream")
    return response


if __name__ == "__main__":
    import uvicorn

    host = env("PROXY_HOST", "127.0.0.1")
    port = int(env("PROXY_PORT", "8765"))
    uvicorn.run(app, host=host, port=port)
