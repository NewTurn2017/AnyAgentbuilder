# Todo 6 Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-6-code-review.md

## Blockers

1. Split the Todo 6 harness before approval. `agentic-system-builder/scripts/qa-generated-demo.mjs` is 648 pure LOC / 705 physical lines and currently owns CLI parsing, command planning, provider scrubbing, validation/scaffolding, local installs, process management, curl assertions, browser QA, and cleanup in one file. This violates the loaded `remove-ai-slops` and `programming` perspectives' 250 pure LOC ceiling and makes the lifecycle cleanup surface too risky to review as a unit.
2. Harden the mock OpenAI boundary scan before relying on the manifest's `openaiImportAttempted=false` / `openaiCalls=false` claims. `assertMockProviderSafe()` only scans for `from openai`, `import openai`, `OpenAI(`, and `AsyncOpenAI(`, but the OpenAI Agents SDK import shape the plan calls out is commonly `from agents import Agent, Runner, function_tool, handoff`. The current generated backend happens not to import those, but the harness would not directly catch that forbidden SDK boundary.

## CRITICAL

None.

## HIGH

- `agentic-system-builder/scripts/qa-generated-demo.mjs:1` exceeds the code-size ceiling by a wide margin: `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/' ... | wc -l` returned `648`. Responsibility clusters are visible at `buildPlannedCommands()` (`qa-generated-demo.mjs:102`), `runSetup()` (`qa-generated-demo.mjs:342`), `runCurlChecks()` (`qa-generated-demo.mjs:438`), `runBrowserQa()` (`qa-generated-demo.mjs:475`), and `cleanupProcesses()` (`qa-generated-demo.mjs:547`). This is not a cosmetic issue for this task: process lifecycle correctness is the acceptance surface, and the current file is too large to audit confidently.
- `agentic-system-builder/scripts/qa-generated-demo.mjs:355` does not fully enforce the documented "no openai-agents import in mock mode" boundary. The scanner misses Agents SDK identifiers/imports and then records definitive manifest fields at `qa-generated-demo.mjs:620` and `qa-generated-demo.mjs:621`. This creates false confidence in a core Todo 6 requirement.

## MEDIUM

- `agentic-system-builder/scripts/qa-generated-demo.mjs:81` reserves free ports by probing and closing sockets, then starts servers later at `qa-generated-demo.mjs:660` and `qa-generated-demo.mjs:672` without uniqueness checks or bind-retry handling. This is a normal race for dynamic-port harnesses. It should retry on bind/startup failure and ensure backend/frontend ports are distinct.
- `agentic-system-builder/scripts/qa-generated-demo.mjs:388` appends process logs to fixed artifact names. The current `task-6-backend-process.txt` contains multiple historical backend runs, so the artifact is noisier than the manifest/cleanup receipts. Use per-run logs or overwrite the fixed process log at the start of each run.

## LOW

- `agentic-system-builder/scripts/qa-generated-demo.mjs:475` detects missing Playwright only after backend/frontend setup reaches browser QA. The error is clear when reached, but a browser-only preflight would fail faster and avoid unnecessary local install/start work.
- The generated Python backend has programming-perspective strictness issues (`asyncio`, raw `dict[str, Any]`, mutable dataclasses), but I did not make those Todo 6 blockers because Todo 7 owns the backend contract and the current review focus is the QA harness lifecycle.

## Skill Perspective Check

Ran.

- Loaded `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`, plus the TypeScript/JavaScript-adjacent README, Python README, and code-smells reference.
- Violations found: oversized harness module and an overconfident provider-boundary scan. The task-6 evidence probes are generally behavior-level and not deletion-only, tautological, or implementation-constant-only; the static provider scan is the weak proof.

## Evidence Reviewed

- Plan: `.omo/plans/any-agent-system-builder.md` Todo 6.
- Implementation: `agentic-system-builder/scripts/qa-generated-demo.mjs`.
- Package wrapper: `package.json`.
- Generated backend: `generated/library-reservation-demo/backend/main.py`, `agents.py`, `context.py`, `tools.py`, `demo_data.py`, `memory.py`, `events.py`, `requirements.txt`.
- Evidence: `.omo/evidence/any-agent-system-builder/task-6-*.txt` and `.omo/evidence/any-agent-system-builder/run-manifest.json`.

## Verification Notes

- Git diff/status could not be verified because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository.
- `node --check agentic-system-builder/scripts/qa-generated-demo.mjs` exited 0.
- Latest `run-manifest.json` records backend mode, `backendPort=54481`, `backendPid=47613`, `status=passed`, and `cleanup.ok=true`.
- `task-6-health.txt`, `task-6-chat.txt`, `task-6-guardrail.txt`, `task-6-422.txt`, and `task-6-sse.txt` contain real curl artifacts. The SSE curl exits 28 due `--max-time 5`, which is expected for a streaming endpoint and still includes `event: state.snapshot`.
- `task-6-cleanup-pids.txt` records backend PID 47613 not alive and no frontend PID.
- `task-6-cleanup-ports.txt` records no listeners on ports 54481 and 54482.
- Reviewer read-only probes confirmed no remaining listeners for the historical ports I saw in process logs: `lsof -nP -iTCP:51933 -iTCP:52163 -iTCP:54481 -sTCP:LISTEN` returned no listeners, and `ps -p 39592,40445,47613 -o pid,ppid,stat,command` returned no process rows.
- Static scans of the task-6 curl/SSE artifacts and manifest found no internal field marker leaks (`member_id`, `internal_notes`, `policy_overrides`, `raw_hold_queue`, `staff_token`, `inventory_cost`).
- Static scans found no OpenAI SDK import/call markers in generated runtime files, but the harness scanner itself is too narrow as noted above.
- `node -e "import('playwright')..."` reported `ERR_MODULE_NOT_FOUND`, so browser QA is currently dependency-gated as expected for Todo 8.

## Cleanup

I did not start any server or harness process during this review. No reviewer cleanup was required. I only ran read-only probes (`sed`, `nl`, `find`, `rg`, `awk`, `node --check`, `ps`, `lsof`, and a Node dynamic-import check for Playwright).
