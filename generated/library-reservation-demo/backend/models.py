from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


JsonPrimitive = str | int | float | bool | None
JsonObject = dict[str, JsonPrimitive | list[JsonPrimitive]]
JsonValue = JsonPrimitive | list[JsonPrimitive] | JsonObject


class PublicContextModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patron_display_name: str
    reservation_id: str
    resource_label: str
    time_window: str
    reservation_status: str
    loan_titles: list[str]
    policy_summary: str


class InternalContextModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    member_id: str
    internal_notes: str
    policy_overrides: list[JsonValue]
    raw_hold_queue: list[str]
    staff_token: str
    inventory_cost: int


class EventModel(BaseModel):
    type: str
    detail: str
    public_payload: JsonObject = Field(default_factory=dict)


class ChatMessageModel(BaseModel):
    role: str
    content: str


class GuardrailModel(BaseModel):
    name: str
    reason: str


class GuardrailCheckModel(BaseModel):
    status: str
    guardrail: GuardrailModel | None


class ConversationStateModel(BaseModel):
    domain_key: str
    brand_name: str
    public_context: PublicContextModel
    internal_context: InternalContextModel | None = None
    resources: list[JsonObject] = Field(default_factory=list)
    agents: list[str] = Field(default_factory=list)
    handoffs: list[str] = Field(default_factory=list)
    guardrails: list[str] = Field(default_factory=list)
    messages: list[ChatMessageModel] = Field(default_factory=list)
    events: list[EventModel] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    runtime: str
    domain_key: str
    active_stream_listeners: int


class StateResponse(BaseModel):
    domain_key: str
    brand_name: str
    public_context: PublicContextModel
    resources: list[JsonObject]
    agents: list[str]
    handoffs: list[str]
    guardrails: list[str]
    messages: list[ChatMessageModel]
    events: list[EventModel]


class ChatRequest(BaseModel):
    thread_id: str
    message: str


class ChatResponse(BaseModel):
    assistant_message: str
    active_agent: str
    public_context: PublicContextModel
    events: list[EventModel]
    status: str
    guardrail: GuardrailModel | None
