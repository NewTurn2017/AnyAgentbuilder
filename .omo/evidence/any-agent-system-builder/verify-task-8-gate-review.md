# Todo 8 Gate Review

recommendation: REJECT
AdversarialVerify verdict: needs-fix
confidence: high for runtime/UI behavior, high for evidence gap

## originalIntent
Todo 8 asks for the generated frontend to be a usable first-screen chat UI, not a landing page. It must show Korean labels, agent activity/status timeline, public context summary, a library room/book widget, backend connectivity, and guardrail failure rendering. It must prove hidden internal fields are absent from public surfaces.

## desiredOutcome
The user should receive current evidence that `env -u OPENAI_API_KEY AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --browser-only --evidence .omo/evidence/any-agent-system-builder` opens the generated frontend, sends the Korean reservation request, renders the assistant response, updates observability panels, shows public-only context and domain widgets, renders a guardrail banner for a prompt-injection request, and leaves no backend/frontend/browser processes or port listeners behind.

## userOutcomeReview
Runtime behavior is confirmed. The acceptance command was rerun and exited 0 in `.omo/evidence/any-agent-system-builder/verify-task-8-browser.txt`. Screenshots are nonblank and show the expected chat-first Korean UI, agent timeline, public context, room/book widget, and guardrail banner. Static generated validation and frontend build both pass in `.omo/evidence/any-agent-system-builder/verify-task-8-static.txt`. Cleanup receipts and direct `ps`/`lsof` checks show the recorded backend/frontend PIDs dead and ports closed.

The gate still cannot approve the full evidence package because the task-8 code-review report with explicit `remove-ai-slops` and `programming` coverage is missing. I performed the direct slop/programming pass myself and did not find a Todo 8 UI/harness blocker, but the required report coverage artifact is absent and unsupported.

## checkedArtifactPaths
- `.omo/plans/any-agent-system-builder.md`
- `.omo/start-work/any-agent-system-builder-notepad.md`
- `.omo/evidence/any-agent-system-builder/task-8-summary.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-browser.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-static.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-screenshot-audit.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-privacy.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-8-flake-audit.txt`
- `.omo/evidence/any-agent-system-builder/browser-library-demo.png`
- `.omo/evidence/any-agent-system-builder/browser-guardrail-demo.png`
- `.omo/evidence/any-agent-system-builder/run-manifest.json`
- `.omo/evidence/any-agent-system-builder/task-8-privacy.txt`
- `.omo/evidence/any-agent-system-builder/task-8-cleanup-pids.txt`
- `.omo/evidence/any-agent-system-builder/task-8-cleanup-ports.txt`
- `agentic-system-builder/templates/frontend/src/App.jsx.tmpl`
- `agentic-system-builder/templates/frontend/src/styles.css`
- `agentic-system-builder/scripts/qa-lib/browser-qa.mjs`
- `agentic-system-builder/scripts/qa-generated-demo.mjs`
- `generated/library-reservation-demo/frontend/src/App.jsx`
- `generated/library-reservation-demo/backend/context.py`
- `generated/library-reservation-demo/backend/demo_data.py`
- `generated/library-reservation-demo/backend/main.py`
- `generated/library-reservation-demo/backend/agents.py`

## commands
- `env -u OPENAI_API_KEY AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --browser-only --evidence .omo/evidence/any-agent-system-builder` -> exit 0
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo` -> exit 0
- `npm run build --prefix generated/library-reservation-demo/frontend` -> exit 0
- `rg -n "member_id|internal_notes|policy_overrides|raw_hold_queue|staff_token|inventory_cost" generated/library-reservation-demo/frontend agentic-system-builder/templates/frontend generated/library-reservation-demo/frontend/dist .omo/evidence/any-agent-system-builder/browser-*.png .omo/evidence/any-agent-system-builder/task-8-privacy.txt 2>/dev/null || true` -> only the privacy receipt lists forbidden names as absent markers
- `lsof -nP -iTCP:58637 -sTCP:LISTEN 2>&1 || true` -> no output
- `lsof -nP -iTCP:58638 -sTCP:LISTEN 2>&1 || true` -> no output
- `ps -p 87047 -o pid=,stat=,command= 2>&1 || true` -> no output
- `ps -p 87315 -o pid=,stat=,command= 2>&1 || true` -> no output

## blockers
1. Missing task-8 code-review artifact with required skill-perspective coverage.
   Evidence: `find .omo/evidence/any-agent-system-builder -maxdepth 1 -type f | sort | rg 'task-8|code-review|manual|qa|review|notepad|matrix'` found task-8 runtime/build/privacy/cleanup files but no `task-8-code-review*.md`. `rg -n "remove-ai-slops|slop|overfit|programming|skill-perspective|Todo 8|Task 8|frontend" .omo/evidence/any-agent-system-builder/*.md .omo/evidence/any-agent-system-builder/*.txt` found prior-task review coverage and task-8 execution files, but no task-8 review report explicitly covering remove-ai-slops/programming overfit criteria.

2. Missing diff artifact / Git diff source.
   Evidence: `git status --short --branch` from `/Users/genie/dev/tools/skills/AnyAgentbuilder` failed with `fatal: not a git repository`. The executor summary says changed-file reporting is path-based. I could inspect current files, but not verify an authoritative diff or unchanged unrelated surfaces from Git.

3. Missing manual QA matrix artifact as a named artifact.
   Evidence: no task-8 manual QA matrix file was found under `.omo/evidence/any-agent-system-builder/`; task-8 summary lists scenarios, and this gate generated targeted verification artifacts, but the expected input artifact is absent.

## directSlopAndProgrammingPass
- Loaded and applied `omo:remove-ai-slops` and `omo:programming`, plus the TypeScript reference index.
- No deletion-only, requested-removal-only, tautological, or implementation-mirroring Todo 8 browser tests found.
- Selectors are stable data-testid selectors scoped to the chat, agent activity, public context, domain widget, and guardrail containers.
- Waits are condition-based. The one `page.waitForTimeout(150)` is a polling interval inside a bounded text assertion loop, not a timeout-only pass mechanism.
- Frontend/template and Todo 8 harness files inspected are under the 250 pure LOC ceiling. `validate-domain-spec.mjs` is oversized but has an explicit `SIZE_OK` portability rationale and is not a new Todo 8 frontend blocker.

## exactEvidenceGaps
- No `.omo/evidence/any-agent-system-builder/task-8-code-review*.md`.
- No code-review report text for Todo 8 explicitly showing `remove-ai-slops`, overfit/slop, and `programming` criterion coverage.
- No Git diff available from the workspace root.
- No separate manual QA matrix artifact found for Todo 8.

## final
needs-fix because runtime/browser/static/privacy/cleanup checks pass, but required review/diff/manual-QA evidence is incomplete.
