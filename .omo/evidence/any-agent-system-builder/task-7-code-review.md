# Todo 7 Code Review - Backend Starter Contract

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: .omo/evidence/any-agent-system-builder/task-7-code-review.md
blockers: []

## Review Boundary

- Scope reviewed: generated backend files, backend templates, `qa-generated-demo.mjs`, relevant `qa-lib` helpers, task-7 evidence, and `run-manifest.json`.
- The workspace at `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. `git status --short --branch` and `git diff --stat` failed with `fatal: not a git repository`, so this review could not verify a full git diff. I reviewed the current files and evidence artifacts directly.
- I did not start new backend/frontend processes during this review because the task allowed writing only this report artifact. I used read-only source/evidence probes plus `lsof`/`ps` cleanup checks.

## Skill-Perspective Check

- Ran: `omo:remove-ai-slops` skill read from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Ran: `omo:programming` skill read from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`, plus relevant Python and TypeScript references for FastAPI/data/error/async and TypeScript data/error handling.
- remove-ai-slops result: no deletion-only tests, tautological removal tests, or unnecessary parsing/normalization blocker found in the task-7 backend contract. One under-specified harness assertion is called out below.
- programming result: the diff violates the strict programming perspective in non-blocking ways: the generated Python backend/templates use `asyncio`, raw `dict`/`Any` API shapes, and mutable dataclasses. These are maintainability risks for a starter template, but they do not break the Todo 7 observable contract.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

1. `agentic-system-builder/scripts/qa-lib/http-checks.mjs:55` under-asserts the guardrail contract.
   The harness checks guardrail responses only for HTTP 200 and substring presence of `blocked` and `guardrail` at `http-checks.mjs:55-62`. Todo 7 asks for the specific shape `{ status: "blocked", guardrail: { name, reason } }`. The current backend and evidence do satisfy that shape (`generated/library-reservation-demo/backend/agents.py:57-65`, `.omo/evidence/any-agent-system-builder/task-7-guardrail.txt:10`), so this is not a current product blocker. It is a test relevance gap that could let a future malformed guardrail object pass QA.

### LOW

1. Strict typing/style debt in generated Python starter code.
   `generated/library-reservation-demo/backend/main.py:1` and `events.py:1` use `asyncio`, while the loaded programming guidance prefers AnyIO for async Python. Public/internal state also flows through raw `dict[str, Any]` signatures (`main.py:36`, `main.py:79`, `main.py:94`, `events.py:5`, `agents.py:23`, `agents.py:55`). This keeps the starter lightweight but weakens type-level protection around public-vs-internal JSON. Current evidence shows no internal marker leaks.

2. Full diff and scope-control proof are unavailable in this checkout.
   Because the workspace is not a Git repository, I could not independently verify the exact worker `019f1df7` diff. Evidence includes changed-file summaries and artifact paths, and source/template inspection matched those claims, but this remains a review-boundary limitation.

## Contract Verification

- Endpoint declarations exist in both generated and template backend files: `/health`, `/state/bootstrap`, `/state`, `/state/stream`, and `/chat` at `generated/library-reservation-demo/backend/main.py:35`, `main.py:45`, `main.py:50`, `main.py:56`, `main.py:78`; the template mirrors the generated file byte-for-byte for `main.py.tmpl`.
- Mock mode avoids OpenAI imports/calls in the generated backend. Provider scan evidence reports `allowed=true`, `findings=[]`, and scanned the generated backend runtime files in `.omo/evidence/any-agent-system-builder/task-7-provider-boundary.txt:1-14`; manifest records `openaiImportAttempted=false` and `openaiCalls=false` in `.omo/evidence/any-agent-system-builder/run-manifest.json:201-202`.
- Happy `/chat` response includes `assistant_message`, `active_agent`, `public_context`, and `events` in `.omo/evidence/any-agent-system-builder/task-7-chat.txt:10`.
- Guardrail response currently includes `status:"blocked"` and nested `guardrail.name`/`guardrail.reason` in `.omo/evidence/any-agent-system-builder/task-7-guardrail.txt:10`.
- Malformed JSON and bad request shape return HTTP 422 in `.omo/evidence/any-agent-system-builder/task-7-422.txt:4-10` and `.omo/evidence/any-agent-system-builder/task-7-422.txt:18-24`.
- Unknown thread returns HTTP 200 with a new mock state and empty `messages`/`events` in `.omo/evidence/any-agent-system-builder/task-7-unknown-thread.txt:10`.
- SSE emits `state.snapshot` and `state.delta`, then post-disconnect `/health` reports `active_stream_listeners:0` in `.omo/evidence/any-agent-system-builder/task-7-sse.txt:10-23` and `.omo/evidence/any-agent-system-builder/task-7-sse.txt:29-38`.
- Public context field set is exact in parsed evidence: `patron_display_name`, `reservation_id`, `resource_label`, `time_window`, `reservation_status`, `loan_titles`, `policy_summary`. Static/evidence scans found no runtime response occurrences of `member_id`, `internal_notes`, `policy_overrides`, `raw_hold_queue`, `staff_token`, or `inventory_cost`.

## Commands Run

- `sed -n ... remove-ai-slops/SKILL.md`
- `sed -n ... programming/SKILL.md`
- `sed -n ... programming/references/python/{README.md,fastapi-stack.md,data-modeling.md,error-handling.md,async-anyio.md}`
- `sed -n ... programming/references/typescript/{README.md,data-modeling.md,error-handling.md}`
- `sed -n '1,240p' .omo/plans/any-agent-system-builder.md`
- `git status --short --branch` (failed: not a git repository)
- `git diff --stat` (failed: not a git repository)
- `find`/`wc -l`/`nl -ba` over generated backend, backend templates, QA harness helpers, evidence, and manifest
- `rg` static scans for endpoints, OpenAI/provider imports, public/internal field markers, SSE events, and strict-style risk
- `diff -u agentic-system-builder/templates/backend/main.py.tmpl generated/library-reservation-demo/backend/main.py`
- `diff -u agentic-system-builder/templates/backend/events.py.tmpl generated/library-reservation-demo/backend/events.py`
- `node --input-type=module -e ...` parsed task-7 response artifacts to verify JSON keys
- `lsof -nP -iTCP:61206 -sTCP:LISTEN`
- `lsof -nP -iTCP:61207 -sTCP:LISTEN`
- `ps -p 15285 -o pid=,stat=,command=`

## Evidence Paths

- `.omo/evidence/any-agent-system-builder/run-manifest.json`
- `.omo/evidence/any-agent-system-builder/task-7-health.txt`
- `.omo/evidence/any-agent-system-builder/task-7-chat.txt`
- `.omo/evidence/any-agent-system-builder/task-7-guardrail.txt`
- `.omo/evidence/any-agent-system-builder/task-7-422.txt`
- `.omo/evidence/any-agent-system-builder/task-7-unknown-thread.txt`
- `.omo/evidence/any-agent-system-builder/task-7-sse.txt`
- `.omo/evidence/any-agent-system-builder/task-7-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-7-provider-boundary.txt`
- `.omo/evidence/any-agent-system-builder/task-7-py-compile.txt`
- `.omo/evidence/any-agent-system-builder/task-7-js-check.txt`
- `.omo/evidence/any-agent-system-builder/task-7-cleanup-pids.txt`
- `.omo/evidence/any-agent-system-builder/task-7-cleanup-ports.txt`

## Cleanup

- I started no new server processes during review.
- Existing task-7 cleanup evidence shows `backend pid=15285 alive=false`, `frontend pid=null alive=false`, and both manifest ports have `listener=no`.
- Independent read-only checks during review confirmed no listeners on manifest ports `61206` and `61207`, and no process with PID `15285`.

## Residual Risks

- Real OpenAI Agents SDK mode was intentionally not verified; Todo 7 acceptance is mock-only.
- Harness guardrail assertions should parse JSON and require `status === "blocked"`, `guardrail.name`, and `guardrail.reason` before relying on it as future regression coverage.
- A future hardening pass should replace raw `dict[str, Any]` response/state shapes with Pydantic response models or typed dataclasses/TypedDicts, and consider AnyIO for SSE queues/timeouts.
