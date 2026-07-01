from context import build_internal_context, build_public_context
from models import ConversationStateModel, JsonObject

DOMAIN_KEY = "library"
BRAND_NAME = "도서관 예약 도우미"
DEMO_PUBLIC_SEED = {
  "patron_display_name": "김서연",
  "reservation_id": "LIB-RSV-1042",
  "resource_label": "2층 스터디룸 A",
  "time_window": "14:00-16:00",
  "reservation_status": "held",
  "loan_titles": [
    "도시와 사람",
    "자료 구조 입문",
  ],
  "policy_summary": "스터디룸은 1회 2시간, 하루 1회까지 예약할 수 있습니다.",
}
DEMO_INTERNAL_SEED = {
  "member_id": "M-88421",
  "internal_notes": "연체 이력 없음",
  "policy_overrides": [],
  "raw_hold_queue": [
    "M-88421",
  ],
  "staff_token": "staff-demo-token",
  "inventory_cost": 820000,
}
DEMO_RESOURCES = [
  {
    "label": "2층 스터디룸 A",
    "status": "available",
    "detail": "4명, 화이트보드",
  },
  {
    "label": "3층 미디어룸",
    "status": "available",
    "detail": "6명, 모니터",
  },
  {
    "label": "1층 열람실 부스",
    "status": "waitlisted",
    "detail": "대기 1명",
  },
]
DEMO_AGENTS = [
  "triage_agent",
  "room_reservation_agent",
  "lending_agent",
  "policy_agent",
  "escalation_agent",
]
DEMO_HANDOFFS = [
  "triage_agent -> room_reservation_agent",
  "room_reservation_agent -> policy_agent",
]
DEMO_GUARDRAILS = [
  "relevance_guardrail",
  "privacy_guardrail",
  "policy_guardrail",
]

RESOURCE_KIND = "도서관 공간"
DEMO_RESOURCE_MODELS: list[JsonObject] = [dict(resource) for resource in DEMO_RESOURCES]


DEMO_STATE = ConversationStateModel(
    domain_key=DOMAIN_KEY,
    brand_name=BRAND_NAME,
    public_context=build_public_context(DEMO_PUBLIC_SEED),
    internal_context=build_internal_context(DEMO_INTERNAL_SEED),
    resources=DEMO_RESOURCE_MODELS,
    agents=list(DEMO_AGENTS),
    handoffs=list(DEMO_HANDOFFS),
    guardrails=list(DEMO_GUARDRAILS),
)


def initial_state() -> ConversationStateModel:
    return DEMO_STATE.model_copy(deep=True)
