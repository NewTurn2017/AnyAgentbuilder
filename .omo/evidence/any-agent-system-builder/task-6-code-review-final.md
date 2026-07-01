# Todo 6 Code Review Final

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-6-code-review-final.md

## Blockers

1. Harden the mock provider-boundary scanner against all pinned Python Agents SDK symbols, not only the exact previous-negative import list. The current scanner still allows `from agents import SQLiteSession, RunContextWrapper, input_guardrail, GuardrailFunctionOutput` when a generated local `agents.py` exists, then can record `openaiImportAttempted=false` / `openaiCalls=false`. This is a false no-import result for SDK code that the plan explicitly says mock mode must not import.
2. Move the browser dependency preflight before frontend install/start, or add explicit artifact cleanup for browser-dependency failure. With Playwright missing in this workspace, the current `--browser-only` order runs `npm install` and starts the generated frontend before `runBrowserQa()` tries to import Playwright. `cleanupProcesses()` only stops PIDs and checks ports; it does not remove `frontend/node_modules` or `frontend/package-lock.json`.

## CRITICAL

None.

## HIGH

- `agentic-system-builder/scripts/qa-lib/provider-security.mjs:6` defines `PYTHON_AGENTS_SYMBOLS` as only `Agent`, `Runner`, `function_tool`, and `handoff`. `scanPythonLine()` then treats `from agents import ...` as blocked only when one of those four names appears, or when no local `agents.py` exists (`provider-security.mjs:75`, `provider-security.mjs:79`). The generated backend has a local `agents.py`, so pinned SDK symbols from `agentic-system-builder/REFERENCE.md:163` through `agentic-system-builder/REFERENCE.md:170` can pass unreported. My temporary probe created a local `agents.py` plus `main.py` containing `from agents import SQLiteSession, RunContextWrapper, input_guardrail, GuardrailFunctionOutput`; `scanMockProviderBoundary()` returned `"findings": []` and `"allowed": true`. This violates the plan's mock-mode boundary at `.omo/plans/any-agent-system-builder.md:54`, `.omo/plans/any-agent-system-builder.md:150`, and `.omo/plans/any-agent-system-builder.md:182`, and it keeps the previous provider-boundary blocker only partially fixed.
- `agentic-system-builder/scripts/qa-generated-demo.mjs:102` through `agentic-system-builder/scripts/qa-generated-demo.mjs:108` installs frontend dependencies, starts the frontend, and only then calls `runBrowserQa()`. `runBrowserQa()` imports Playwright at `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:6` through `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:10`, so a missing optional Playwright dependency is discovered after generated frontend install work has already happened. `cleanupProcesses()` at `agentic-system-builder/scripts/qa-lib/processes.mjs:155` through `agentic-system-builder/scripts/qa-lib/processes.mjs:187` proves PIDs and ports only. Current `generated/library-reservation-demo/frontend` has no `node_modules` or `package-lock.json`, but source order still violates the requested browser-only failure boundary.

## MEDIUM

- `agentic-system-builder/scripts/qa-lib/processes.mjs:91` appends process logs to fixed artifact paths. The current `task-6-backend-process.txt` contains historical backend runs from multiple ports before the latest `60264` run. The manifest and cleanup receipts are current enough to review, but fixed append logs are noisy and can mislead later reviewers.
- Git diff/status could not be verified because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. I reviewed the current files and evidence paths directly instead.

## LOW

- The evidence intentionally records `OPENAI_API_KEY=sk-review-blocker` in `task-6-mock-env.txt` and `task-6-summary.txt`. It is a fake key used to prove scrubbing, not a real secret, but it is secret-shaped and may trip simple scanners.

## Skill Perspective Check

Ran.

- Loaded `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`.
- Also consulted `programming/references/typescript/README.md` for the JS/TS-adjacent harness surface and `programming/references/python/README.md` for the generated backend surface.
- `remove-ai-slops` perspective: the oversized harness blocker is resolved. The entrypoint is 129 pure LOC / 143 physical lines, and the largest helper is 176 pure LOC / 188 physical lines, so there is no current 250 pure LOC violation. The remaining issue is overfit negative coverage: the provider-boundary regression proves only the exact four-symbol import that was previously called out, while other pinned SDK symbols still pass.
- `programming` perspective: the split is generally maintainable and not one relocated blob. The browser dependency ordering is still a boundary/cleanup issue, and the provider scanner still makes an overconfident claim from incomplete parsing. No deletion-only tests, tautological tests, prompt-string tests, or implementation-constant-only tests were accepted as sufficient.

## Evidence Reviewed

- Plan: `.omo/plans/any-agent-system-builder.md` Todo 6 and related mock-mode requirements.
- Source: `agentic-system-builder/scripts/qa-generated-demo.mjs` and `agentic-system-builder/scripts/qa-lib/*.mjs`.
- Generated surface: `generated/library-reservation-demo/backend` and `generated/library-reservation-demo/frontend`.
- Evidence: `.omo/evidence/any-agent-system-builder/task-6-*.txt`, `.omo/evidence/any-agent-system-builder/run-manifest.json`, and prior task-6 verification artifacts where relevant.

## Verification Notes

- `task-6-loc.txt` and my own `awk` pure-LOC probe agree: entrypoint `pure_loc=129`, helpers are all under 250 pure LOC.
- `task-6-harness-dry-run.txt` is credible: it lists planned validators, scaffold, backend/frontend commands, curl probes, dynamic ports, and cleanup handlers without starting servers.
- `task-6-mock-env.txt` is credible for backend-only mode: it scrubbed `OPENAI_API_KEY`, ran validators/scaffold/generated check, scanned mock provider boundary, installed backend deps locally, ran backend curl checks, and exited with `cleanup: ok`.
- `run-manifest.json` records `status=passed`, `mode=backend`, `runtime=mock`, `backendPort=60264`, `backendPid=62476`, `cleanup.ok=true`, `mockProviderBoundary.allowed=true`, `openaiImportAttempted=false`, and `openaiCalls=false`. Those final provider fields are not fully trustworthy until the HIGH scanner gap is fixed.
- `task-6-health.txt`, `task-6-chat.txt`, `task-6-guardrail.txt`, `task-6-422.txt`, and `task-6-sse.txt` contain real curl artifacts. The SSE curl exits 28 because of `--max-time 5`, but includes `event: state.snapshot` and heartbeat `state.delta` events.
- `task-6-cleanup-pids.txt` records backend PID `62476` not alive and no frontend PID for the latest backend-only run.
- `task-6-cleanup-ports.txt` records no listeners on backend port `60264` or frontend port `60265`.
- Current frontend cleanup state is clean: `find generated/library-reservation-demo/frontend -maxdepth 2 \( -name node_modules -o -name package-lock.json \) -print` returned no paths.
- Playwright is missing: `node -e 'import("playwright")...'` reported `playwright-missing`, so the browser-only missing-dependency path is relevant.
- Current task-related process checks found no `qa-generated-demo`, generated `uvicorn`, generated Vite, or generated npm dev process. `lsof` showed unrelated Node listeners on other ports, but no listener on the recorded task ports.
- Temp provider-boundary probe directories were removed in the same command; a follow-up `find /var/folders/.../T -name 'task-6-provider-probe-*' -o -name 'task-6-agents-negative-*'` returned no paths.
- Secret scan over source, generated app, task-6 evidence, and manifest found no private-key markers or real-looking long `sk-...` tokens. It found only the fake `sk-review-blocker` value noted above.

## Commands Run

```bash
sed -n '1,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '1,620p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/typescript/README.md
sed -n '1,360p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/python/README.md
git status --short --branch
git diff --stat
wc -l agentic-system-builder/scripts/qa-generated-demo.mjs agentic-system-builder/scripts/qa-lib/*.mjs
awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/ { count++ } END { print count }' agentic-system-builder/scripts/qa-generated-demo.mjs
nl -ba agentic-system-builder/scripts/qa-generated-demo.mjs
nl -ba agentic-system-builder/scripts/qa-lib/provider-security.mjs
nl -ba agentic-system-builder/scripts/qa-lib/processes.mjs
nl -ba agentic-system-builder/scripts/qa-lib/lifecycle.mjs
nl -ba agentic-system-builder/scripts/qa-lib/http-checks.mjs
nl -ba agentic-system-builder/scripts/qa-lib/commands.mjs
nl -ba agentic-system-builder/scripts/qa-lib/browser-qa.mjs
nl -ba agentic-system-builder/scripts/qa-lib/args.mjs
sed -n '1,260p' .omo/plans/any-agent-system-builder.md
sed -n '1,260p' .omo/evidence/any-agent-system-builder/run-manifest.json
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-6-*.txt
node -e 'import("playwright").then(()=>console.log("playwright-present")).catch(()=>console.log("playwright-missing"))'
node --input-type=module '<temporary provider-boundary probe; fixture removed in finally>'
find generated/library-reservation-demo/frontend -maxdepth 2 \( -name node_modules -o -name package-lock.json \) -print
ps -axo pid,ppid,stat,command | rg 'qa-generated-demo|generated/library-reservation-demo|uvicorn|vite --host 127\.0\.0\.1|npm run dev -- --port|agentic-system-builder/scripts' || true
lsof -nP -iTCP -sTCP:LISTEN | rg '60264|60265|55199|55200|generated|uvicorn|vite|node' || true
rg -n 'sk-[A-Za-z0-9_-]{12,}|OPENAI_API_KEY=sk-|BEGIN (RSA|OPENSSH|PRIVATE) KEY|AKIA[0-9A-Z]{16}' agentic-system-builder generated/library-reservation-demo .omo/evidence/any-agent-system-builder/task-6-*.txt .omo/evidence/any-agent-system-builder/run-manifest.json
```

## Cleanup

I did not run the full harness or start browser-only QA during this final review. I created one temporary provider-boundary fixture under the OS temp directory and removed it in a `finally` block. Follow-up temp-directory checks returned no remaining `task-6-provider-probe-*` or `task-6-agents-negative-*` directories. No product files were edited.

## Final Status

REQUEST_CHANGES. The harness split is acceptable, backend-only evidence is credible, and current generated frontend install artifacts are clean. Approval is blocked by the remaining provider-boundary false negative and the browser-only missing-Playwright artifact risk.
