[English](README.md) · [한국어](README.ko.md)

# AnyAgentbuilder

A Claude Code skill that turns a real service workflow — reservation, lending, seat allocation, appointment booking — into a concrete multi-agent chat system: triage + specialist agents, handoffs, guardrails, public context, widgets, and a verifiable starter implementation.

The repo ships three things:

- **`skills/agentic-system-builder/`** — the skill itself (`SKILL.md`, methodology in `REFERENCE.md`, domain packs in `EXAMPLES.md`) plus scaffold/validation scripts and templates.
- **`generated/library-reservation-demo/`** — a working demo generated from the templates: FastAPI mock backend + Korean React chat UI. Runs fully offline, no `OPENAI_API_KEY` needed.
- **`.omo/`** — the work plan and verification evidence (browser screenshots, QA logs) from the build.

## Quick start

Install the skill with the [skills CLI](https://github.com/vercel-labs/skills) — works with Claude Code, Codex, Cursor, and 70+ other agents:

```bash
npx skills add newTurn2017/AnyAgentbuilder
```

Then ask your agent to build an agentic operations system (e.g. "스터디룸 예약 에이전트 시스템 만들어줘") — the skill guides domain-spec design, agent/handoff/guardrail decomposition, and a mock-first implementation plan.

## Run the demo

One command runs the full QA pipeline (validators → scaffold → backend curl checks → browser QA → cleanup). Requires Node 18+ and Python 3.

```bash
git clone https://github.com/newTurn2017/AnyAgentbuilder.git
cd AnyAgentbuilder
env -u OPENAI_API_KEY AGENT_RUNTIME=mock npm run qa:generated-demo
```

Or run the demo manually — see [`generated/library-reservation-demo/README.md`](generated/library-reservation-demo/README.md) for the backend (`uvicorn`, port 8000) and frontend (`vite`) steps.

## Scripts

All scripts use Node built-ins only — no `npm install` needed at the repo root.

| Command | What it does |
|---|---|
| `npm run validate:skill` | Checks the skill package structure (`SKILL.md` frontmatter, one-level references) |
| `npm run validate:examples` | Validates the airline / library / pcbang / generic domain packs in `EXAMPLES.md` |
| `npm run scaffold:library-demo` | Regenerates the library demo from `skills/agentic-system-builder/templates/` |
| `npm run qa:generated-demo` | Full end-to-end QA of the generated demo in mock mode |

## Project structure

```
skills/agentic-system-builder/
  SKILL.md          # skill entry point (fast path)
  REFERENCE.md      # reusable methodology: domain spec → agents → proof plan
  EXAMPLES.md       # domain packs: airline, library, pcbang, generic
  scripts/          # validate-domain-spec, scaffold-agent-system, qa-generated-demo
  templates/        # backend (FastAPI) + frontend (React/Vite) scaffold templates
generated/
  library-reservation-demo/   # generated working demo (mock runtime)
.omo/               # build plan + verification evidence
```

## Status

Mock mode is the default and only proven path: the generated backend never imports or calls OpenAI. Real OpenAI Agents SDK wiring is documented as an opt-in extension behind `AGENT_RUNTIME=openai`, not implemented.

## License

[License — not yet specified]
