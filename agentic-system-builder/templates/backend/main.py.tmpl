import asyncio
import json
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents import run_mock_agent_turn
from demo_data import BRAND_NAME, DOMAIN_KEY, initial_state
from events import EventStreamHub, make_event
from memory import ConversationMemory
from models import ChatMessageModel, ChatRequest, ChatResponse, ConversationStateModel, EventModel, HealthResponse, StateResponse

app = FastAPI(title=BRAND_NAME)
runtime_mode = os.environ.get("AGENT_RUNTIME", "mock")
memory = ConversationMemory()
events = EventStreamHub()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        runtime=runtime_mode,
        domain_key=DOMAIN_KEY,
        active_stream_listeners=events.listener_count(),
    )


@app.get("/state/bootstrap", response_model=StateResponse)
def state_bootstrap() -> StateResponse:
    return public_state(initial_state())


@app.get("/state", response_model=StateResponse)
def state(thread_id: str = "demo") -> StateResponse:
    conversation = memory.get_conversation(thread_id)
    return public_state(conversation)


@app.get("/state/stream")
async def state_stream(request: Request, thread_id: str = "demo") -> StreamingResponse:
    queue = events.register(thread_id)

    async def event_generator():
        snapshot = public_state(memory.get_conversation(thread_id))
        yield format_sse("state.snapshot", snapshot)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                    yield format_sse("state.delta", event)
                except asyncio.TimeoutError:
                    yield format_sse("state.delta", make_event("heartbeat", "stream alive"))
        finally:
            events.unregister(thread_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.thread_id.strip() or not payload.message.strip():
        raise HTTPException(status_code=422, detail="thread_id and message are required")
    if runtime_mode != "mock":
        raise HTTPException(status_code=501, detail="Set AGENT_RUNTIME=mock or add the documented openai runtime extension.")
    conversation = memory.get_conversation(payload.thread_id)
    result = run_mock_agent_turn(payload.message, conversation)
    conversation.messages.append(ChatMessageModel(role="user", content=payload.message))
    conversation.messages.append(ChatMessageModel(role="assistant", content=result.assistant_message))
    for event in result.events:
        memory.append_event(payload.thread_id, event)
        await events.publish(payload.thread_id, event)
    return result


def public_state(conversation: ConversationStateModel) -> StateResponse:
    return StateResponse(
        domain_key=DOMAIN_KEY,
        brand_name=BRAND_NAME,
        public_context=conversation.public_context,
        resources=conversation.resources,
        agents=conversation.agents,
        handoffs=conversation.handoffs,
        guardrails=conversation.guardrails,
        messages=conversation.messages,
        events=conversation.events,
    )


def format_sse(event_name: str, payload: StateResponse | EventModel) -> str:
    data = payload.model_dump(mode="json")
    return f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
