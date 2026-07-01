# Todo 6 Final Gate Review

AdversarialVerify verdict: needs-fix
recommendation: REJECT

## originalIntent

Todo 6 was meant to complete the generated-demo QA harness lifecycle after the scaffold templates existed. From the user's latest brief, the expected fix was:

- Split `qa-generated-demo.mjs` into focused `qa-lib` helpers.
- Keep the entrypoint small enough to review.
- Preserve backend-only lifecycle setup, real HTTP curl checks, manifest writing, and cleanup.
- Scrub `OPENAI_API_KEY` in mock mode and prove no OpenAI/Agents SDK imports or calls are attempted.
- Expand provider-boundary scanning to catch Python Agents SDK imports and JS OpenAI imports/calls.

## desiredOutcome

The user should receive a Todo 6 harness that can be trusted locally: dry-run does not start servers, backend-only mock mode works even with contaminated provider env, real HTTP artifacts exist, cleanup leaves no generated-demo processes or ports, malformed CLI input fails clearly, and the split code has no unresolved AI-slop maintenance burden.

## userOutcomeReview

Functional verification supports the latest claim: dry-run and backend-only mock-env runs pass, provider credentials are scrubbed, OpenAI import/call fields are false, HTTP artifacts are real `curl -i` responses, and cleanup receipts are clean.

I cannot approve the gate because the split introduced or retained an unused exported helper: `agentic-system-builder/scripts/qa-lib/fs-utils.mjs:17` exports `ensureDir`, and `rg -n '\bensureDir\b' .` finds no call sites. Under the loaded `remove-ai-slops` and `programming` criteria, this is unresolved dead helper slop. It is small, but the final gate instructions require rejection on unresolved slop rather than approving with a cleanup note.

## blockers

1. Unused exported helper remains in production harness code.
   - Path: `agentic-system-builder/scripts/qa-lib/fs-utils.mjs:17`
   - Evidence: `rg -n '\bensureDir\b' .` returns only the export line.
   - Why it blocks: `remove-ai-slops` dead-code criteria reject unused helpers, and `programming` rejects one-off / speculative helpers that create maintenance burden.
   - Required fix: delete `ensureDir` or add a real current use. Deleting is the likely correct fix.

## checkedArtifactPaths

- Plan: `.omo/plans/any-agent-system-builder.md`
- Notepad: `.omo/start-work/any-agent-system-builder-notepad.md`
- Prior code review: `.omo/evidence/any-agent-system-builder/task-6-code-review.md`
- Source entrypoint: `agentic-system-builder/scripts/qa-generated-demo.mjs`
- Helper modules: `agentic-system-builder/scripts/qa-lib/*.mjs`
- Generated backend sampled: `generated/library-reservation-demo/backend/main.py`, `generated/library-reservation-demo/backend/agents.py`
- Dry run: `.omo/evidence/any-agent-system-builder/verify-task-6-final-dry-run.txt`
- Dry-run manifest copy: `.omo/evidence/any-agent-system-builder/verify-task-6-final-dry-run-manifest.json`
- Mock-env run: `.omo/evidence/any-agent-system-builder/verify-task-6-final-mock-env.txt`
- Mock-env manifest copy: `.omo/evidence/any-agent-system-builder/verify-task-6-final-mock-env-manifest.json`
- Provider-boundary negative: `.omo/evidence/any-agent-system-builder/verify-task-6-final-provider-boundary.txt`
- Malformed input: `.omo/evidence/any-agent-system-builder/verify-task-6-final-malformed.txt`
- Cleanup: `.omo/evidence/any-agent-system-builder/verify-task-6-final-cleanup.txt`
- HTTP artifact inspection: `.omo/evidence/any-agent-system-builder/verify-task-6-final-http-artifacts.txt`
- LOC / organization: `.omo/evidence/any-agent-system-builder/verify-task-6-final-loc.txt`

## verificationSummary

- Dry-run command:
  `env -u OPENAI_API_KEY AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --scenario library --evidence .omo/evidence/any-agent-system-builder --dry-run`
  - Exit: `0`
  - Manifest: `status=dry-run`, `backendPid=null`, `frontendPid=null`
  - Selected dry-run ports: no listeners
  - Corrected exact generated-demo path/port process scan: no matches

- Mock-env backend-only command:
  `OPENAI_API_KEY=fake AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --backend-only --evidence .omo/evidence/any-agent-system-builder`
  - Exit: `0`
  - Manifest: `status=passed`, `mode=backend`, `runtime=mock`
  - Provider fields: `providerCredentialsScrubbed=["OPENAI_API_KEY"]`, `openaiImportAttempted=false`, `openaiCalls=false`
  - Provider scan root: `generated/library-reservation-demo/backend`
  - Scanned backend runtime files: `agents.py`, `context.py`, `demo_data.py`, `events.py`, `main.py`, `memory.py`, `tools.py`

- Provider-boundary negative:
  - Synthetic backend under `.omo/evidence/any-agent-system-builder/provider-boundary-negative/backend`
  - Exact Python probe: `from agents import Agent, Runner, function_tool, handoff`
  - Findings included `python-agents-sdk-import`, `js-openai-import`, and `js-openai-call`
  - `assertMockProviderSafe` blocked with `failed-provider-boundary`

- Malformed input:
  - Unknown flag exited `1` with `unknown flag or argument: --definitely-unknown`
  - Bad scenario exited `1` with `unsupported --scenario value: badscenario; only library is wired for generated-demo QA`

- Cleanup:
  - Recorded backend PID `71152` is gone; frontend PID was `null`
  - Recorded ports `63635` and `63636` have no listeners
  - Exact generated-demo command/path/port scan found no matching processes
  - Generic dev servers observed were outside this workspace (`/Users/genie/test/project`, `/Users/genie/dev/active/erpsystem`)
  - No generated frontend `node_modules`, `package-lock.json`, or `npm-shrinkwrap.json`

- HTTP artifact realism:
  - `task-6-health.txt`: `HTTP/1.1 200 OK`, JSON `{"status":"ok","runtime":"mock","domain_key":"library"}`
  - `task-6-chat.txt`: `HTTP/1.1 200 OK`, includes `assistant_message`, `active_agent`, `public_context`, and `events`
  - `task-6-guardrail.txt`: `HTTP/1.1 200 OK`, includes `status":"blocked"` and `relevance_guardrail`
  - `task-6-422.txt`: `HTTP/1.1 422 Unprocessable Content`, includes JSON decode detail
  - `task-6-sse.txt`: `HTTP/1.1 200 OK`, includes `event: state.snapshot` and `event: state.delta`
  - Internal marker scan over HTTP artifacts found no exact internal field names

- LOC / file organization:
  - `qa-generated-demo.mjs`: `129` pure LOC
  - Largest helper: `processes.mjs`, `175` pure LOC
  - `provider-security.mjs`: `130` pure LOC
  - No harness source file exceeds the 250 pure LOC ceiling
  - Helper split is mostly focused by responsibility, except for the unused `ensureDir` export

## skillCriteriaReview

- Consulted `omo:remove-ai-slops` and applied its overfit/slop pass directly.
- Consulted `omo:programming` and applied size, dead-code, one-off helper, and maintainability criteria directly.
- Prior `.omo/evidence/any-agent-system-builder/task-6-code-review.md` explicitly shows a skill-perspective check for both skills and overfit/slop coverage, but it is stale: it reviewed the pre-split 648-LOC harness and requested changes. I did not treat that report as proof of current correctness.
- Direct pass result: previous blockers are functionally resolved, but the unused `ensureDir` helper is unresolved dead code.

## exactEvidenceGaps

- This workspace is not a Git repository, so I could not inspect a Git diff or branch status.
- No fresh post-split code-review report was present; only the stale blocking review was available.
- No separate manual QA matrix artifact was present. For Todo 6, the requested surface was CLI/backend lifecycle verification, and the exact dry-run/mock-env/backend HTTP checks were rerun directly.
- The dry-run artifact includes an initial broad process scan that listed unrelated dev servers; a corrected exact generated-demo path/port scan is appended in the same artifact and shows no generated-demo server processes.

## confidence

High for the functional provider-boundary/lifecycle outcome. High for the rejection: the unused `ensureDir` helper is directly confirmed by a whole-workspace `rg` search and is a strict slop blocker under the gate criteria.
