---
slug: any-agent-system-builder
status: reviewed
intent: unclear
pending-action: deliver reviewed plan summary; execution starts only on explicit start-work request
approach: Plan a reusable "agentic chat system builder" skill and starter architecture that turns a user-described operational workflow into a clean multi-agent chat UI + backend skeleton using shared context, specialist agents, handoffs, guardrails, observable state streaming, and domain packs.
---

# Draft: any-agent-system-builder

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 | Skill package that teaches agents how to analyze a domain and generate a concrete builder plan | active | /Users/genie/.agents/skills/write-a-skill/SKILL.md:16 |
| C2 | Domain modeling method that maps reservation/lending/seat workflows into actors, resources, states, policies, and tools | active | /Users/genie/Downloads/openai-cs-agents-demo-guide.md:64 |
| C3 | Backend architecture skeleton using Agents SDK Agent, Runner, function tools, handoffs, guardrails, sessions/context, and tracing | active | /Users/genie/Downloads/openai-cs-agents-demo-guide.md:14 |
| C4 | Chat UI and observability surface with customer chat, workflow state panel, agent activity timeline, and domain widgets | active | /Users/genie/Downloads/openai-cs-agents-demo-guide.md:16 |
| C5 | Example domain packs for airline seats, library loan/reservation, PC bang seat booking, and a generic appointment/asset reservation flow | active | /Users/genie/Downloads/openai-cs-agents-demo-guide.md:75 |
| C6 | Verification harness that proves the generated skill/app through deterministic schema checks, API calls, and browser-visible chat flows | active | /Users/genie/.agents/skills/write-a-skill/SKILL.md:108 |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
| Product shape | Build a reusable skill plus a reference starter app plan, not a one-off airline clone | The user's request emphasizes a methodology and a skill useful to many people | Yes |
| Primary runtime | Use Python FastAPI + OpenAI Agents SDK for backend orchestration and Next.js/React for Chat UI | The provided example uses FastAPI, ChatKit/Next.js, REST, and SSE; official docs position Agents SDK for managed tools/handoffs/guardrails/sessions | Yes |
| Agent topology | Always start generated systems with Triage + specialist agents + policy/FAQ agent + optional human/escalation agent | The demo's clean boundary comes from triage only routing and specialists owning work | Yes |
| State model | Force domain builders to define shared typed context before agent prompts | The demo analysis says complexity belongs in context design, not agent declarations | Yes |
| Safety model | Include relevance, jailbreak/prompt-injection, tool authorization, and destructive-action confirmation guardrails by default | Reservation and lending systems can mutate real availability or user entitlements | Yes |
| Persistence | Use in-memory mock data only for tutorial demo; plan production adapters for SQL/Redis/domain APIs behind typed repositories | The demo notes MemoryStore is restart-volatile and production needs durable storage | Yes |
| UI language | Default generated product-facing examples to Korean labels/copy, with English code identifiers | User is Korean and requested in Korean; local preference says Korean is default for user-owned products | Yes |
| Verification | Do not rely on static file existence; require curl API proof and browser chat proof for generated example flows | Agentic chat behavior must be observed through its surface, not inferred | Yes |

## Findings (cited - path:lines)
- The provided airline analysis identifies three load-bearing patterns: shared Pydantic context, handoff between agents, and guardrail mini-agents; it also calls out SSE + queue listeners for live observation. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:6`
- The demo shape is FastAPI backend plus Next.js/ChatKit UI over REST and SSE endpoints, with state snapshots, bootstrap, state stream, and health endpoints. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:14`
- The reference folder decomposition separates agent roster, tools, context/public context, demo data, server orchestration, memory store, and UI types/pages. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:42`
- The agent roster shows a reusable pattern: triage agent for routing plus bounded specialists with atomic tool ownership. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:64`
- Tool design should stay atomic: tools are the "what can be done" units, agents are the "who can do it and when" layer. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:75`
- The clean handoff behavior comes from triage not directly answering and specialists handing off when outside scope. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:94`
- A single chat turn should visibly exercise input guardrails, handoff, tool call, state update, streaming response, and UI observation. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:123`
- Public/internal context separation is a first-class design boundary; internal fields must not be blindly sent to UI. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:163`
- Guardrails are modeled as mini-agents returning `GuardrailFunctionOutput` and tripping before the main workflow proceeds. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:181`
- Handoff hooks can hydrate context before the specialist proceeds, preventing repeated user questions. `/Users/genie/Downloads/openai-cs-agents-demo-guide.md:252`
- The write-a-skill template requires concise `SKILL.md`, optional references/examples/scripts, strong trigger description, and review checklist. `/Users/genie/.agents/skills/write-a-skill/SKILL.md:16`
- Official OpenAI docs search result: Agents SDK is appropriate when an app needs code-first orchestration for agents, tools, handoffs, guardrails, tracing, or sandbox execution. `https://developers.openai.com/api/docs/libraries#use-the-agents-sdk`
- Official OpenAI docs search result: Agents SDK starting points include agent definitions, running agents, orchestration/handoffs, guardrails/human review, tools, observability, and evaluations. `https://developers.openai.com/api/docs/guides/agents#choose-your-starting-point`
- Official and SDK reference material used during planning identify `Agent`, `Runner`, sessions, `@function_tool`, `handoff()`, `RunContextWrapper`, `input_guardrail`, and `GuardrailFunctionOutput` as relevant concepts to pin into the skill reference before implementation. `https://openai.github.io/openai-agents-python/agents/`
- Workspace grounding found no existing product files in `/Users/genie/dev/tools/skills/AnyAgentbuilder` at planning time; executor must re-check before implementation because the workspace may change. `.omo/drafts/any-agent-system-builder.md`

## Decisions (with rationale)
- Treat the request as UNCLEAR/architecture-scale: the target product is an open-ended builder methodology, not a single fixed feature. Use best-practice defaults instead of asking the user to specify every domain.
- The plan should create an `agentic-system-builder` skill directory, not implement a full production SaaS. It should include instructions, reference methodology, examples, and helper scripts that can generate or validate a starter spec.
- The reference starter architecture should be domain-agnostic but concrete: every domain pack maps to `Resource`, `Reservation`, `User`, `Policy`, `Availability`, `Action`, `Event`, and `PublicContext`.
- The skill must teach a repeatable domain analysis workflow: identify actors, reservable assets, state transitions, policies, exceptions, tools, specialist agents, handoff graph, guardrails, UI widgets, and QA scenarios.
- Examples should include: airline seat/service booking, library room/book loan, PC bang seat booking, and generic appointment/resource reservation. These cover seat maps, due dates, inventory, time windows, occupancy, cancellation, penalties, and eligibility.
- The generated chat UI plan should include Korean-facing labels by default: customer chat, agent activity/status panel, context summary, domain widget area, and guardrail/error state. Code identifiers remain English.
- Verification must include both static skill checks and real-surface proof for the generated starter: markdown structure validation, schema generation dry run, backend health/chat curl, SSE/state proof, and browser chat flow screenshot.

## Scope IN
- A decision-complete implementation plan for creating a reusable skill that helps any agent build clean operational agent systems through conversation.
- Skill artifact design: `SKILL.md`, `REFERENCE.md`, `EXAMPLES.md`, and optional `scripts/validate-domain-spec.mjs` / `scripts/scaffold-agent-system.mjs`.
- Backend skeleton plan based on FastAPI + OpenAI Agents SDK concepts: typed context, tools, handoffs, guardrails, sessions/memory, public context filter, state events, SSE, and health/chat endpoints.
- Chat UI skeleton plan based on React/Next.js: chat pane, agent observability pane, context/status panel, domain widget renderer, guardrail display, and example flows.
- Domain methodology and examples for airline, library, PC bang, and generic reservation/lending systems.
- Agent-executable QA and evidence paths for every implementation todo.

## Scope OUT (Must NOT have)
- No production deployment, billing, auth provider, real payment integration, or real external reservation API in the first skill plan.
- No one-off airline-only clone.
- No hidden mutation of real inventory; destructive or irreversible actions must be mock-only or approval-gated.
- No implementation before the user explicitly approves moving from planning to execution.
- No broad web framework invention beyond the starter architecture needed by the skill.

## Open questions
- None requiring the user now. The key choices are reversible and have been defaulted above for veto at approval.

## Approval gate
status: approved
pending action: deliver the reviewed `.omo/plans/any-agent-system-builder.md`; execution starts only on explicit start-work request.
brief: Build a reusable `agentic-system-builder` skill and reference app plan. The skill will teach agents to convert conversational domain discovery into a typed multi-agent chat backend and UI skeleton. It will use the airline example's reusable primitives but generalize them into domain packs for reservation/lending/seat-allocation systems.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

## Review receipts
- Metis initial review: ITERATE; fixed validator ordering, Todo 5/6 ordering, approval/verification wording, dynamic port manifest, public/private assertions, runtime bounds, endpoint error contracts, failed scaffold cleanup, and mock provider boundary.
- Momus final review: OKAY; verified malformed JSON `/chat` proof, references, task ordering, and QA conditions.
- Independent Codex CLI final review: OKAY; output saved to `.omo/evidence/any-agent-system-builder/codex-cli-plan-review-4.txt`.
