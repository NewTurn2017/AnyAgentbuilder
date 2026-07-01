---
name: agentic-system-builder
description: It guides agents to derive operational multi-agent chat systems from a real service workflow, including shared context, specialist agents, handoffs, guardrails, tools, widgets, and proof plans. Use when building agentic chat systems, reservation or lending or booking workflows, multi-agent service systems, or domain-specific operational assistants.
---

# Agentic System Builder

Use this skill to turn a conversational service workflow into a concrete agent system design and starter implementation plan. Keep `SKILL.md` as the fast path; load [REFERENCE.md](REFERENCE.md) for the methodology and [EXAMPLES.md](EXAMPLES.md) for domain packs.

## Quick Workflow

1. Frame the user goal as an operational service, not a generic assistant. Identify the customer request, staff responsibility, real resources, state changes, and failure modes.
2. Interview conversationally for missing domain facts. Ask only for facts that affect routing, policy, availability, guardrails, public context, or the UI surface.
3. Draft a compact domain spec with these objects: `Actor`, `Resource`, `Reservation`, `Availability`, `Policy`, `Action`, `Tool`, `Agent`, `Handoff`, `Guardrail`, `PublicContext`, `Widget`, and `Event`.
4. Split the workflow into one triage agent and focused specialist agents. Triage classifies intent and hands off; specialists own tools, policies, and user-facing responses.
5. Define public context before internal context. Only fields in `PublicContext` may appear in chat responses, widgets, browser UI, or public JSON.
6. Map each state change to a tool call, event, visible widget update, and QA assertion.
7. Produce an implementation plan with mock adapters first, then optional real integrations behind explicit runtime flags.

## Conversation Pattern

Start with a narrow prompt:

```text
어떤 운영 흐름을 에이전트 시스템으로 만들까요? 예: 좌석 예약, 스터디룸 예약, 대출/반납, 진료 예약.
```

Then derive the system in this order:

- `Domain`: service boundary, users, staff roles, resources, and outcomes.
- `State`: reservation or request lifecycle, availability rules, policies, and blocked states.
- `Agents`: triage agent, specialist agents, handoff reasons, and escalation paths.
- `Tools`: read tools, write tools, mock adapters, validation errors, and audit events.
- `Surface`: chat messages, context summary, domain widget, activity timeline, and guardrail banner.
- `Proof`: happy path, policy denial, unrelated intent, malformed input, privacy checks, and cleanup.

## Progressive Disclosure

Open [REFERENCE.md](REFERENCE.md) when you need the full analysis method, backend contract, guardrail matrix, UI mapping, scaffold expectations, or QA recipe.

Open [EXAMPLES.md](EXAMPLES.md) when you need a domain pack for airline service booking, library room and book reservations, PC bang seat booking, or generic appointment and resource reservation.

Do not copy long domain tables into the active prompt. Pull only the domain pack or methodology section needed for the user's workflow.

## Output Shape

Return or generate these artifacts for each system:

- Domain spec with public and internal context separated.
- Agent roster with responsibilities, tools, and handoff rules.
- Backend endpoint contract for health, bootstrap, state, stream, and chat.
- Chat-first UI plan with Korean user-facing copy when the product surface is Korean.
- QA plan that proves routing, guardrails, visible state, privacy, and process cleanup.

## Guardrails

- Do not treat `thread_id` as authentication; it is only a mock conversation key unless real auth is added.
- Do not expose internal fields through UI, chat, widgets, logs intended for users, or public JSON.
- Do not require production provider APIs for local proof; use mock adapters unless the user asks for live integration.
- Do not create a marketing landing page as the main screen for an operational assistant.
- Do not claim real SDK or provider verification unless it ran with explicit credentials and recorded evidence.
