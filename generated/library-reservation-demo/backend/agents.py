from events import make_event
from models import ChatResponse, ConversationStateModel, GuardrailCheckModel, GuardrailModel
from tools import availability_tool, policy_tool, reservation_tool

AGENT_ROSTER = [
  "triage_agent",
  "room_reservation_agent",
  "lending_agent",
  "policy_agent",
  "escalation_agent",
]
HANDOFF_GRAPH = [
  "triage_agent -> room_reservation_agent",
  "room_reservation_agent -> policy_agent",
]
GUARDRAIL_NAMES = [
  "relevance_guardrail",
  "privacy_guardrail",
  "policy_guardrail",
]
POLICY_SUMMARY = "회원 표시명과 예약 상태만 공개하고 내부 회원 번호와 대기열은 노출하지 않습니다."


def guardrail_check(message: str) -> GuardrailCheckModel:
    lowered = message.lower()
    blocked_terms = ["prompt", "system", "internal", "token", "관리자", "프롬프트", "내부", "비밀번호"]
    if any(term in lowered for term in blocked_terms):
        return GuardrailCheckModel(
            status="blocked",
            guardrail=GuardrailModel(name="privacy_guardrail", reason="공개 가능한 예약 정보만 안내할 수 있습니다."),
        )
    unrelated_terms = ["주식", "코인", "투자", "날씨"]
    if any(term in lowered for term in unrelated_terms):
        return GuardrailCheckModel(
            status="blocked",
            guardrail=GuardrailModel(name="relevance_guardrail", reason="이 데스크는 도서관 공간 예약 업무만 처리합니다."),
        )
    return GuardrailCheckModel(status="allowed", guardrail=None)


def route_agent(message: str) -> str:
    lowered = message.lower()
    for agent in AGENT_ROSTER:
        key = agent.replace("_agent", "").replace("_", " ")
        if key in lowered:
            return agent
    return "room_reservation_agent"


def run_mock_agent_turn(message: str, state: ConversationStateModel) -> ChatResponse:
    guardrail = guardrail_check(message)
    if guardrail.status == "blocked" and guardrail.guardrail is not None:
        event = make_event("guardrail.blocked", guardrail.guardrail.reason, guardrail.guardrail.model_dump())
        return ChatResponse(
            assistant_message=guardrail.guardrail.reason,
            active_agent="triage_agent",
            public_context=state.public_context,
            events=[event],
            status="blocked",
            guardrail=guardrail.guardrail,
        )

    active_agent = route_agent(message)
    available = availability_tool(state.resources)
    current_status = getattr(state.public_context, "reservation_status", "held")
    state.public_context = reservation_tool(state.public_context, current_status)
    policy = policy_tool(POLICY_SUMMARY)
    events = [
        make_event("handoff.started", f"triage_agent -> {active_agent}", {"active_agent": active_agent}),
        make_event("tool.called", "availability_tool", {"count": len(available)}),
        make_event("state.delta", "public context refreshed", {"policy_summary": str(policy["policy_summary"])}),
    ]
    return ChatResponse(
        assistant_message="예약 가능한 공간을 확인했어요. 2층 스터디룸 A를 오늘 오후 시간대로 임시 확보했습니다.",
        active_agent=active_agent,
        public_context=state.public_context,
        events=events,
        status="ok",
        guardrail=None,
    )
