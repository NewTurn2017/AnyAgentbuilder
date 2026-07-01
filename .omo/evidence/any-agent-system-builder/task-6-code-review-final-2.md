# Todo 6 Code Review Final 2

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-6-code-review-final-2.md

## Blockers

1. Remove the remaining dead helper export `ensureDir` from `agentic-system-builder/scripts/qa-lib/fs-utils.mjs:17`. It has zero callers in the entrypoint/helper split, and the previous review focus explicitly called out `ensureDir` or similar unused helper/dead export cleanup.
2. Remove the unused exported helper `appendProcessLog` from `agentic-system-builder/scripts/qa-lib/processes.mjs:9`. It also has zero callers. Keeping dead exported helpers violates the loaded `remove-ai-slops` dead-code criteria and the `programming` perspective's "best code is code never written" / no one-off helper rule.

## CRITICAL

None.

## HIGH

- `agentic-system-builder/scripts/qa-lib/fs-utils.mjs:17` still exports `ensureDir(path)` and imports `mkdir` solely for that helper. `rg -n "ensureDir|mkdir\\(" agentic-system-builder/scripts/qa-generated-demo.mjs agentic-system-builder/scripts/qa-lib` found only the declaration/body. This is a direct miss of the requested "No unused helper/dead export remains (`ensureDir` or similar)" review focus.
- `agentic-system-builder/scripts/qa-lib/processes.mjs:9` exports `appendProcessLog(path, message)` and no code calls it. A simple export/reference sweep reported `appendProcessLog:externalRefs=0`, and `rg` shows no internal use. This is another dead helper in the same QA lifecycle helper split.

## MEDIUM

- Git diff/status could not be verified because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. I reviewed the current scoped files and evidence artifacts directly.
- The fixed append-only process artifacts remain noisy: `.omo/evidence/any-agent-system-builder/task-6-backend-process.txt` contains historical backend runs from multiple ports. The current manifest and cleanup receipts are credible, but future reviewers should rely on the latest `run-manifest.json`, `task-6-cleanup-pids.txt`, and `task-6-cleanup-ports.txt` rather than the accumulated process log alone.

## LOW

None.

## Cleared Previous Blockers

- Provider boundary: current `agentic-system-builder/scripts/qa-lib/provider-security.mjs:6` through `agentic-system-builder/scripts/qa-lib/provider-security.mjs:15` includes all pinned `REFERENCE.md` SDK concepts: `Agent`, `Runner`, `SQLiteSession`, `function_tool`, `handoff`, `RunContextWrapper`, `input_guardrail`, and `GuardrailFunctionOutput`. The extended evidence in `.omo/evidence/any-agent-system-builder/task-6-provider-boundary-extended.txt` proves blocked cases for the previously missed symbols, previous symbols, aliased/parenthesized imports, `import agents as ...`, OpenAI import, and OpenAI constructor call.
- Browser preflight: `agentic-system-builder/scripts/qa-generated-demo.mjs:89` through `agentic-system-builder/scripts/qa-generated-demo.mjs:93` checks Playwright before setup/install/startup for browser/full modes. `.omo/evidence/any-agent-system-builder/task-6-browser-preflight.txt` shows the missing-Playwright browser-only run failed with `backendPid=null`, `frontendPid=null`, `generatedAppChecked=false`, and no generated frontend `node_modules` or `package-lock.json` before or after.
- Entrypoint/helper split: the entrypoint is 134 pure LOC and the largest helpers are 175 pure LOC according to `.omo/evidence/any-agent-system-builder/task-6-loc.txt`; no current 250 pure LOC violation remains.
- Backend-only evidence: latest `run-manifest.json` observed during review recorded `status=passed`, `mode=backend`, `runtime=mock`, `generatedAppChecked=true`, `mockProviderBoundary.allowed=true`, `findings=0`, `openaiImportAttempted=false`, `openaiCalls=false`, and `cleanup.ok=true`.
- HTTP evidence: `.omo/evidence/any-agent-system-builder/task-6-health.txt`, `task-6-chat.txt`, `task-6-guardrail.txt`, `task-6-422.txt`, and `task-6-sse.txt` contain real curl artifacts. The SSE artifact times out due `--max-time 5`, but includes `event: state.snapshot` and heartbeat `state.delta` events.
- Privacy evidence: static scan of `task-6-chat.txt`, `task-6-guardrail.txt`, `task-6-sse.txt`, and `run-manifest.json` found none of `member_id`, `internal_notes`, `policy_overrides`, `raw_hold_queue`, `staff_token`, or `inventory_cost`.
- Cleanup evidence: latest `task-6-cleanup-pids.txt` recorded backend PID `86183` not alive and no frontend PID. Latest `task-6-cleanup-ports.txt` recorded no listeners on backend port `52235` or frontend port `52236`. My live `ps`/`lsof` probes found no task-related `qa-generated-demo`, generated `uvicorn`, or generated Vite listener for the observed task ports.
- Frontend artifact cleanup: `find generated/library-reservation-demo/frontend -maxdepth 2 \( -name node_modules -o -name package-lock.json \) -print` returned no paths.

## Skill Perspective Check

Ran.

- Loaded `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`.
- `remove-ai-slops` perspective violation: dead code remains in exported helpers (`ensureDir`, `appendProcessLog`).
- `programming` perspective violation: the helper split is mostly maintainable, but unused exported helpers are needless abstraction/dead code. I did not find deletion-only tests, tautological tests, prompt-string tests, or implementation-constant-only tests in the reviewed Todo 6 evidence. Provider-boundary and browser-preflight tests are behavior-relevant.

## Evidence Reviewed

- Plan: `.omo/plans/any-agent-system-builder.md`
- Source: `agentic-system-builder/scripts/qa-generated-demo.mjs`
- Source helpers: `agentic-system-builder/scripts/qa-lib/*.mjs`
- Reference pinned symbols: `agentic-system-builder/REFERENCE.md`
- Evidence: `.omo/evidence/any-agent-system-builder/task-6-*.txt`
- Manifest: `.omo/evidence/any-agent-system-builder/run-manifest.json`

## Commands Run

```bash
sed -n '1,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '1,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
find .. -name AGENTS.md -print
git status --short --branch
git diff --stat
sed -n '1,260p' .omo/plans/any-agent-system-builder.md
find .omo/evidence/any-agent-system-builder -maxdepth 1 -type f \( -name 'task-6-*.txt' -o -name 'run-manifest.json' -o -name 'task-6-code-review*.md' \) -print | sort
wc -l agentic-system-builder/scripts/qa-generated-demo.mjs agentic-system-builder/scripts/qa-lib/*.mjs
nl -ba agentic-system-builder/scripts/qa-generated-demo.mjs
nl -ba agentic-system-builder/scripts/qa-lib/*.mjs
nl -ba agentic-system-builder/REFERENCE.md
rg -n "ensureDir|mkdir\(" agentic-system-builder/scripts/qa-generated-demo.mjs agentic-system-builder/scripts/qa-lib
rg -n "Agent|Runner|SQLiteSession|function_tool|handoff|RunContextWrapper|input_guardrail|GuardrailFunctionOutput|openai|OpenAI|AsyncOpenAI|from agents|import agents" agentic-system-builder/REFERENCE.md agentic-system-builder/scripts/qa-lib/provider-security.mjs generated/library-reservation-demo/backend
find generated/library-reservation-demo/frontend -maxdepth 2 \( -name node_modules -o -name package-lock.json \) -print
python3 - <<'PY'
import json, pathlib
m=json.loads(pathlib.Path('.omo/evidence/any-agent-system-builder/run-manifest.json').read_text())
print(m.get('status'), m.get('mode'), m.get('backendPort'), m.get('frontendPort'), m.get('cleanup',{}).get('ok'))
PY
ps -ef | rg '/Users/genie/dev/tools/skills/AnyAgentbuilder|qa-generated-demo|uvicorn main:app|vite --host 127\.0\.0\.1' || true
lsof -nP -iTCP -sTCP:LISTEN | rg '52235|52236|49594|49595|AnyAgentbuilder|uvicorn|vite' || true
node --check agentic-system-builder/scripts/qa-generated-demo.mjs
for f in agentic-system-builder/scripts/qa-lib/*.mjs; do node --check "$f" || exit 1; done
node -e 'import("playwright").then(()=>console.log("playwright-present")).catch(e=>console.log("playwright-missing", e.code || e.message))'
rg -n 'member_id|internal_notes|policy_overrides|raw_hold_queue|staff_token|inventory_cost' .omo/evidence/any-agent-system-builder/task-6-chat.txt .omo/evidence/any-agent-system-builder/task-6-guardrail.txt .omo/evidence/any-agent-system-builder/task-6-sse.txt .omo/evidence/any-agent-system-builder/run-manifest.json || true
```

## Cleanup

I did not run the full harness, did not start servers, and did not create temp fixtures during this final-2 review. No cleanup action was required from my probes. The only file written by this review is `.omo/evidence/any-agent-system-builder/task-6-code-review-final-2.md`.

## Final Status

REQUEST_CHANGES. The extended provider/preflight fixes are credible, but approval remains blocked by the leftover dead exported helpers.
