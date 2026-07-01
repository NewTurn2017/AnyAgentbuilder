recommendation: REJECT
AdversarialVerify: needs-fix
confidence: high

## originalIntent
Todo 5 asks for a real scaffold generator, not a library-only demo copy. The script must accept built-in domains `airline|library|pcbang|generic` or a JSON spec path, generate a full backend/frontend app under the requested output path, include a README with exact run commands, and clean failed partial outputs unless `--keep-failed` is used.

## desiredOutcome
`node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain library --out generated/library-reservation-demo --force` should create the generated library app with required backend/frontend files, exact README commands, the required library public fields, and no internal fields in UI/public JSON surfaces. A second built-in domain should produce domain-specific output without stale library markers. Malformed inputs should fail clearly and leave no temp output. No servers or temp dirs should remain after verification.

## userOutcomeReview
The happy-path library scaffold works, but the shipped artifact does not satisfy the broader Todo 5 outcome. The PC bang domain scaffold still contains a library-only marker and the generated-app validator is hardcoded around library field markers, so it cannot honestly validate non-library scaffold output. The generated frontend dependencies are also unpinned despite the plan's runtime constraints. These are user-visible maintenance and trust issues for a reusable scaffold skill.

## blockers
1. Second-domain scaffold is contaminated with stale library residue.
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-domain-smoke.txt`
   - `--domain pcbang` exits 0 and includes PC bang markers, but `rg` finds `generated/verify-task-5-pcbang-smoke/backend/demo_data.py:87:LIBRARY_RESERVATION_PATRON_MARKER = "library reservation patron"`.
   - Source: `agentic-system-builder/scripts/scaffold-agent-system.mjs:428`.
   - This violates Todo 5's "Do not hardcode only the library demo" requirement.

2. The generated-app validator is overfit to the library demo.
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-domain-smoke.txt`
   - Validator run on the freshly scaffolded PC bang app fails with `generated backend missing public context field markers: patron_display_name, resource_label, loan_titles`.
   - Source: `agentic-system-builder/scripts/validate-domain-spec.mjs:88-90`, `agentic-system-builder/scripts/validate-domain-spec.mjs:135-152`, and `agentic-system-builder/scripts/validate-domain-spec.mjs:801-809`.
   - This is an overfit/static-check slop issue: a reusable scaffold validator is hardcoded to library-specific terms.

3. Generated frontend dependencies are not pinned.
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-content-audit.txt`
   - `@vitejs/plugin-react`, `vite`, `react`, and `react-dom` are all `"latest"`.
   - Source: `agentic-system-builder/scripts/scaffold-agent-system.mjs:705-708` and `generated/library-reservation-demo/frontend/package.json:12-15`.
   - This violates the plan's runtime constraint that generated frontend dependencies be pinned.

4. Direct `remove-ai-slops` / `programming` pass found unresolved slop.
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-content-audit.txt` and `.omo/evidence/any-agent-system-builder/verify-task-5-syntax-and-size.txt`
   - `generated/library-reservation-demo/backend/demo_data.py:91` contains the unused validator-only marker string.
   - `agentic-system-builder/scripts/scaffold-agent-system.mjs` measures `pure_loc=997` with no `SIZE_OK` rationale near the top. The programming/remove-ai-slops criteria treat >250 pure LOC source files as a defect unless split by responsibility or explicitly justified.

5. Required code-review coverage artifact is absent.
   - Evidence: `find .omo/evidence/any-agent-system-builder -maxdepth 1 -type f -name '*task-5*review*' -o -name 'task-5-code-review.md'` returned no files.
   - Final-gate policy requires a code review report explicitly covering the same `remove-ai-slops` and `programming` overfit/slop criteria. Direct verification does not replace that missing report.

## positiveEvidence
- Exact acceptance scaffold command passed: `.omo/evidence/any-agent-system-builder/verify-task-5-command.txt` records status 0.
- Current generated-app validator passed for the library demo: `.omo/evidence/any-agent-system-builder/verify-task-5-generated-check.txt` records status 0.
- Malformed input probes failed clearly and cleaned temp outputs: `.omo/evidence/any-agent-system-builder/verify-task-5-malformed.txt`.
- Required library files, README commands, public fields, and frontend/public-surface internal-field omissions mostly pass: `.omo/evidence/any-agent-system-builder/verify-task-5-content-audit.txt`.
- Syntax checks pass: `.omo/evidence/any-agent-system-builder/verify-task-5-syntax-and-size.txt`.
- Temp dirs are absent and no generated-demo server process is running: `.omo/evidence/any-agent-system-builder/verify-task-5-cleanup.txt`. The only 5173 listener is unrelated: `/Users/genie/test/project`.

## checkedArtifactPaths
- `.omo/plans/any-agent-system-builder.md`
- `agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `generated/library-reservation-demo/README.md`
- `generated/library-reservation-demo/backend/main.py`
- `generated/library-reservation-demo/backend/agents.py`
- `generated/library-reservation-demo/backend/context.py`
- `generated/library-reservation-demo/backend/demo_data.py`
- `generated/library-reservation-demo/backend/events.py`
- `generated/library-reservation-demo/backend/memory.py`
- `generated/library-reservation-demo/backend/tools.py`
- `generated/library-reservation-demo/backend/requirements.txt`
- `generated/library-reservation-demo/frontend/package.json`
- `generated/library-reservation-demo/frontend/src/App.jsx`
- `.omo/evidence/any-agent-system-builder/task-5-*.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-command.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-malformed.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-domain-smoke.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-domain-smoke-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-content-audit.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-syntax-and-size.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-cleanup.txt`

## exactCommands
```bash
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain library --out generated/library-reservation-demo --force > .omo/evidence/any-agent-system-builder/verify-task-5-command.txt 2>&1
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo > .omo/evidence/any-agent-system-builder/verify-task-5-generated-check.txt 2>&1
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain unknown --out generated/verify-task-5-bad
node agentic-system-builder/scripts/scaffold-agent-system.mjs --spec .omo/evidence/any-agent-system-builder/verify-task-5-bad-spec.json --out generated/verify-task-5-bad-json
node agentic-system-builder/scripts/scaffold-agent-system.mjs --spec .omo/evidence/any-agent-system-builder/verify-task-5-missing-spec.json --out generated/verify-task-5-missing-spec
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain pcbang --out generated/verify-task-5-pcbang-smoke --force
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/verify-task-5-pcbang-smoke
node --check agentic-system-builder/scripts/scaffold-agent-system.mjs
python3 compile(...) over generated/library-reservation-demo/backend/*.py without pycache writes
find generated/library-reservation-demo agentic-system-builder -type d -name '__pycache__' -print
ps -axo pid,command | rg 'generated/library-reservation-demo|verify-task-5-pcbang-smoke|uvicorn main:app'
lsof -nP -iTCP:8000 -iTCP:5173 -sTCP:LISTEN
```

## exactEvidenceGaps
- No git diff is available from this directory; `git status --short --branch` returns `fatal: not a git repository`.
- No Todo 5 code-review report exists with `remove-ai-slops` and `programming` overfit/slop coverage.
- No manual QA matrix was provided for Todo 5. I performed command-line/static adversarial QA only, as requested.
- No notepad path was provided in the verification input.

## cleanup
- Removed/confirmed absent: `generated/verify-task-5-bad`, `generated/verify-task-5-bad-json`, `generated/verify-task-5-missing-spec`, `generated/verify-task-5-pcbang-smoke`, `generated/bad`, `generated/bad-json`, `generated/bad-spec`, `generated/task-5-pcbang-smoke`.
- No `__pycache__` directories were found after verification.
- No generated-demo process was found. A listener on 5173 belongs to `/Users/genie/test/project`, not this repo.

## finalVerdict
needs-fix
