# Todo 6 Gate Review

AdversarialVerify verdict: `needs-fix`
Recommendation: `REJECT`

## OriginalIntent

The user requested independent adversarial gate verification for Todo 6 in `.omo/plans/any-agent-system-builder.md`, read-only except verification artifacts under `.omo/evidence/any-agent-system-builder/`.

Todo 6 intent is to complete `agentic-system-builder/scripts/qa-generated-demo.mjs` so it can plan/run generated-demo QA lifecycle checks: validators, library scaffold, local backend/frontend startup, manifest/PID/port tracking, curl checks, browser QA path, mock-mode credential safety, and cleanup.

## DesiredOutcome

The desired user-visible outcome is a trustworthy gate result with:

- exact dry-run proof,
- exact mock backend-only proof,
- malformed-input probes,
- process/port cleanup proof,
- HTTP artifact proof with raw responses,
- browser dependency-path proof when applicable,
- anti-slop/programming review coverage, and
- a final verdict of `confirmed`, `false-positive`, `needs-fix`, or `needs-human-review`.

## UserOutcomeReview

The core runtime behavior is mostly proven:

- Dry run exits 0, writes a dry-run manifest, records null backend/frontend PIDs, and has no listeners on planned ports.
- Backend-only mock run exits 0, starts the generated backend, runs real curl checks, records `OPENAI_API_KEY` scrubbing, and records `openaiImportAttempted=false` / `openaiCalls=false`.
- Malformed CLI inputs fail clearly.
- Backend-only and browser-failure runs clean up recorded PIDs and ports.
- HTTP artifacts contain real `HTTP/1.1` status lines and JSON/SSE bodies, not success labels only.

However, Todo 6 is not gate-approved from the user's perspective because there are unresolved quality and evidence blockers: no Todo 6 code-review/slop report exists, the changed script is 648 pure LOC without a `SIZE_OK` justification, Todo 6 remains unchecked in the plan, and the browser-only probe creates local frontend dependency artifacts before failing on missing Playwright.

## Blockers

1. Missing required Todo 6 code-review/slop report.
   - Ledger line 64 assigns `.omo/evidence/any-agent-system-builder/task-6-code-review.md`.
   - `find .omo/evidence/any-agent-system-builder ...` shows no `task-6-code-review.md`.
   - This means report coverage is absent for the required `remove-ai-slops` and `programming` perspectives.

2. Direct slop/programming pass finds unresolved oversized-script slop.
   - `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/' agentic-system-builder/scripts/qa-generated-demo.mjs | wc -l` -> `648`.
   - `omo:programming` and `omo:remove-ai-slops` treat source files above 250 pure LOC as a defect unless explicitly justified.
   - `qa-generated-demo.mjs` mixes argument parsing, command planning, dependency installation, process orchestration, curl assertions, browser QA, manifest writing, signal handling, and cleanup in one file.
   - No `SIZE_OK` justification was found.

3. Todo 6 remains unchecked in the source plan.
   - `.omo/plans/any-agent-system-builder.md:173` still reads `- [ ] 6. Complete generated-demo QA harness process lifecycle`.

4. Browser dependency path is not as cheap/early as it should be.
   - `verify-task-6-browser-dependency-check.txt` proves `playwright=missing`.
   - `verify-task-6-browser-path.txt` exits 1 with the clear missing-Playwright error and cleanup ok.
   - Before failing, the harness runs backend install, frontend install, backend start, and frontend start.
   - It created local dependency artifacts outside the verification directory: `generated/library-reservation-demo/frontend/node_modules` and `generated/library-reservation-demo/frontend/package-lock.json`.
   - This conflicts with the user's read-only lane expectation outside evidence and is avoidable by checking `playwright` before dependency installs/process startup in browser-only mode.

5. Diff and manual QA matrix inputs are missing.
   - This directory is not a git repository, so no authoritative git diff was available.
   - No Todo 6 manual QA matrix artifact was present.
   - I inspected current files and evidence directly, but the missing artifacts prevent approval under the final-gate rules.

## Confirmed Behavior

### Dry Run

Command:

```bash
env -u OPENAI_API_KEY AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --scenario library --evidence .omo/evidence/any-agent-system-builder --dry-run
```

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-dry-run.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-dry-run-manifest.json`

Result:

- Exit 0.
- Manifest summary: `status=dry-run`, `dryRun=true`, `mode=full`, `runtime=mock`, `backendPid=null`, `frontendPid=null`, `openaiImportAttempted=false`, `openaiCalls=false`.
- `lsof` on planned backend/frontend ports produced no listeners.

### Mock Env Backend Only

Command:

```bash
OPENAI_API_KEY=fake AGENT_RUNTIME=mock node agentic-system-builder/scripts/qa-generated-demo.mjs --backend-only --evidence .omo/evidence/any-agent-system-builder
```

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-mock-env.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-mock-env-manifest.json`

Result:

- Exit 0.
- Manifest summary: `status=passed`, `mode=backend`, `runtime=mock`, `providerCredentialsScrubbed=["OPENAI_API_KEY"]`, `openaiImportAttempted=false`, `openaiCalls=false`, `generatedAppChecked=true`, `cleanup.ok=true`.
- Backend OpenAI import scan had no matches.

### Malformed Input

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-malformed.txt`

Results:

- `--definitely-unknown` exits 1 with `ERROR: unknown flag or argument: --definitely-unknown`.
- `--scenario airline` exits 1 with `ERROR: unsupported --scenario value: airline; only library is wired for generated-demo QA`.

### Cleanup

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/task-6-cleanup-pids.txt`
- `.omo/evidence/any-agent-system-builder/task-6-cleanup-ports.txt`

Results:

- Backend-only manifest copy: backend PID `47613` dead, frontend PID null, backend port `54481` no listener, frontend port `54482` no listener.
- Browser-failure manifest/latest run-manifest: backend PID `49526` dead, frontend PID `49750` dead, backend port `55199` no listener, frontend port `55200` no listener.

### HTTP Artifacts

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-http-artifacts.txt`
- `.omo/evidence/any-agent-system-builder/task-6-health.txt`
- `.omo/evidence/any-agent-system-builder/task-6-chat.txt`
- `.omo/evidence/any-agent-system-builder/task-6-guardrail.txt`
- `.omo/evidence/any-agent-system-builder/task-6-422.txt`
- `.omo/evidence/any-agent-system-builder/task-6-sse.txt`

Results:

- `/health`: `HTTP/1.1 200 OK`, JSON body `{"status":"ok","runtime":"mock","domain_key":"library"}`.
- Happy `/chat`: `HTTP/1.1 200 OK`, JSON contains `assistant_message`, `active_agent`, `public_context`, `events`.
- Guardrail `/chat`: `HTTP/1.1 200 OK`, JSON contains `status":"blocked"` and `guardrail`.
- Malformed `/chat`: `HTTP/1.1 422 Unprocessable Content`, JSON contains `json_invalid`.
- SSE: `HTTP/1.1 200 OK`, `event: state.snapshot`, repeated `event: state.delta`.
- Internal marker scan over these artifacts found no `member_id`, `internal_notes`, `policy_overrides`, `raw_hold_queue`, `staff_token`, or `inventory_cost`.

### Browser Dependency Path

Evidence:

- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-dependency-check.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-path.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-path-manifest.json`

Results:

- `playwright=missing`.
- Browser-only run exits 1 with clear error: `browser QA requires local optional dependency playwright`.
- Cleanup ok and independently verified.
- Needs fix because the harness reaches this error only after dependency installs and process startup.

## Checked Artifact Paths

- `.omo/plans/any-agent-system-builder.md`
- `.omo/start-work/any-agent-system-builder-notepad.md`
- `.omo/start-work/ledger.jsonl`
- `agentic-system-builder/scripts/qa-generated-demo.mjs`
- `package.json`
- `generated/library-reservation-demo/backend/main.py`
- `.omo/evidence/any-agent-system-builder/task-6-summary.txt`
- `.omo/evidence/any-agent-system-builder/task-6-harness-dry-run.txt`
- `.omo/evidence/any-agent-system-builder/task-6-mock-env.txt`
- `.omo/evidence/any-agent-system-builder/task-6-health.txt`
- `.omo/evidence/any-agent-system-builder/task-6-chat.txt`
- `.omo/evidence/any-agent-system-builder/task-6-guardrail.txt`
- `.omo/evidence/any-agent-system-builder/task-6-422.txt`
- `.omo/evidence/any-agent-system-builder/task-6-sse.txt`
- `.omo/evidence/any-agent-system-builder/task-6-cleanup-pids.txt`
- `.omo/evidence/any-agent-system-builder/task-6-cleanup-ports.txt`
- `.omo/evidence/any-agent-system-builder/run-manifest.json`
- `.omo/evidence/any-agent-system-builder/verify-task-6-dry-run.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-dry-run-manifest.json`
- `.omo/evidence/any-agent-system-builder/verify-task-6-mock-env.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-mock-env-manifest.json`
- `.omo/evidence/any-agent-system-builder/verify-task-6-malformed.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-http-artifacts.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-dependency-check.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-path.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-6-browser-path-manifest.json`

## Exact Evidence Gaps

- Missing `.omo/evidence/any-agent-system-builder/task-6-code-review.md`.
- Missing explicit Todo 6 report coverage for `remove-ai-slops`, including overfit/slop criteria: excessive/useless tests, deletion-only tests, tests that only verify removal, tautological tests, implementation-mirroring tests, and unnecessary production extraction/parsing/normalization.
- Missing explicit Todo 6 `programming` report coverage for pure LOC, oversized file handling, strict boundary/cleanup review, and maintenance burden.
- Missing git diff because the execution root is not a git repository.
- Missing manual QA matrix artifact.
- Source plan still shows Todo 6 unchecked.

## Confidence

Runtime behavior confidence: high for backend-only lifecycle, mock credential scrubbing, malformed input, cleanup, and HTTP response artifacts.

Approval confidence: high that this must remain `needs-fix` / `REJECT` until the missing review artifacts are produced and the 648-LOC harness is justified or split.
