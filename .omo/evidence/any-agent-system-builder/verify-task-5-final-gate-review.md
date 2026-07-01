recommendation: REJECT

AdversarialVerify:
  status: needs-fix
  confidence: high
  reviewed_at_utc: 2026-07-01T12:14:39Z
  scope: Todo 5 final gate after claimed blocker fixes

## originalIntent
Todo 5 asks for a reusable scaffold generator for agentic operational systems, not a library-only generated demo. The scaffold must accept built-in domains, JSON specs, output paths, and force overwrite; generate backend/frontend/README for `generated/library-reservation-demo`; clean failed partial outputs; and preserve the plan's public/internal context boundaries.

## desiredOutcome
The user should be able to run `npm run scaffold:library-demo` and receive a valid library demo, while also trusting that `--domain pcbang`, another built-in domain, and a custom JSON spec generate domain-specific apps without stale library residue. Dependencies should be pinned, malformed inputs should fail cleanly, JSON strings should not be rewritten as booleans/null, and no temp dirs or dev servers should remain.

## userOutcomeReview
The happy-path library scaffold now passes, frontend dependencies are pinned, malformed inputs clean up, and JSON literal preservation is fixed. The shipped artifact still does not satisfy the user's reusable-domain outcome because every scaffolded non-library domain still emits `LIBRARY_RESERVATION_PATRON_MARKER`, and the generated-app validator still requires library-specific fields when checking PC bang or generic output.

## blockers
1. Stale library marker still ships in the template and generated output.
   - Source: `agentic-system-builder/templates/backend/demo_data.py.tmpl:42`
   - Generated library output: `generated/library-reservation-demo/backend/demo_data.py:91`
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-final-content-audit.txt` ends with `stale_marker_scan=FAIL marker present in generated/template code`.
   - Domain smoke evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-final-domain-smoke.txt` shows PC bang output line 87 and generic output line 83 contain `LIBRARY_RESERVATION_PATRON_MARKER`.

2. The generated-app validator remains overfit to the library demo.
   - Source: `agentic-system-builder/scripts/validate-domain-spec.mjs:135-152` defines library-only public/internal fields; `agentic-system-builder/scripts/validate-domain-spec.mjs:801-809` requires those fields for every generated app.
   - Evidence: `.omo/evidence/any-agent-system-builder/verify-task-5-final-domain-smoke.txt` shows `--check-generated` fails for PC bang with `generated backend missing public context field markers: patron_display_name, resource_label, loan_titles`, and fails for generic with `patron_display_name, loan_titles`.
   - This is an overfit/static-check slop issue: the reusable validator rejects valid non-library domains because they are not library shaped.

3. Required post-fix review coverage is unsupported.
   - Existing report: `.omo/evidence/any-agent-system-builder/task-5-code-review.md` does include `remove-ai-slops` and `programming` coverage, but it is stale relative to current files. It reports old blockers that are now fixed, such as `scaffold-agent-system.mjs` being 997 pure LOC and frontend dependencies using `latest`.
   - No current post-fix code-review artifact was found that covers the marker residue and validator overfit after the claimed fixes.

## directSlopPass
- `remove-ai-slops` categories applied directly: dead marker code, overfit validation, implementation-mirroring checks, stale test confidence, needless residue, oversized source checks, and dependency pinning.
- `programming` criteria applied directly: source size ceiling, parse-don't-rewrite for JSON/Python literals, typed boundary concerns, and maintenance burden.
- Fixed since prior rejection: frontend/package template dependencies are pinned; Python literal rendering preserves string `true/false/null` while mapping actual booleans/null intentionally; scaffold script is no longer oversized at 228 pure LOC.
- Unresolved: stale generated/template marker and library-overfit generated validator.

## positiveEvidence
- Acceptance scaffold command passed: `.omo/evidence/any-agent-system-builder/verify-task-5-final-command.txt`
- Library generated validator passed: `.omo/evidence/any-agent-system-builder/verify-task-5-final-generated-check.txt`
- Malformed input cleanup passed for unknown domain, bad JSON, and missing JSON spec: `.omo/evidence/any-agent-system-builder/verify-task-5-final-malformed.txt`
- Pinned deps passed for generated and template frontend package data: `.omo/evidence/any-agent-system-builder/verify-task-5-final-pinned-deps.txt`
- JSON literal probe passed: `.omo/evidence/any-agent-system-builder/verify-task-5-final-json-literals.txt`
- Library content audit passed required files, endpoint declarations, README commands, public field set, frontend internal-field scan, and public runtime JSON probe; it failed only the stale marker scan: `.omo/evidence/any-agent-system-builder/verify-task-5-final-content-audit.txt`
- Cleanup passed: `.omo/evidence/any-agent-system-builder/verify-task-5-final-cleanup.txt`

## checkedArtifactPaths
- `.omo/plans/any-agent-system-builder.md`
- `.omo/start-work/any-agent-system-builder-notepad.md`
- `.omo/evidence/any-agent-system-builder/task-5-code-review.md`
- `.omo/evidence/any-agent-system-builder/verify-task-5-gate-review.md`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-command.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-malformed.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-domain-smoke.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-pinned-deps.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-json-literals.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-content-audit.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-5-final-cleanup.txt`
- `agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `agentic-system-builder/templates/domains.json`
- `agentic-system-builder/templates/backend/demo_data.py.tmpl`
- `agentic-system-builder/templates/frontend/package.json.tmpl`
- `generated/library-reservation-demo/README.md`
- `generated/library-reservation-demo/backend/main.py`
- `generated/library-reservation-demo/backend/context.py`
- `generated/library-reservation-demo/backend/demo_data.py`
- `generated/library-reservation-demo/frontend/package.json`
- `generated/library-reservation-demo/frontend/src/App.jsx`

## exactCommands
```bash
npm run scaffold:library-demo > .omo/evidence/any-agent-system-builder/verify-task-5-final-command.txt 2>&1
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo > .omo/evidence/any-agent-system-builder/verify-task-5-final-generated-check.txt 2>&1
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain unknown --out .omo/evidence/any-agent-system-builder/tmp-final-unknown-domain-out
node agentic-system-builder/scripts/scaffold-agent-system.mjs --spec .omo/evidence/any-agent-system-builder/verify-task-5-final-bad-spec.json --out .omo/evidence/any-agent-system-builder/tmp-final-bad-json-out
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain pcbang --out <tmp>/pcbang --force
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain generic --out <tmp>/generic --force
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated <tmp>/pcbang
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated <tmp>/generic
PYTHONDONTWRITEBYTECODE=1 python3 <json-literal-runtime-probe>
PYTHONDONTWRITEBYTECODE=1 python3 <public-surface-runtime-probe>
```

## exactEvidenceGaps
- No Git diff is available from `/Users/genie/dev/tools/skills/AnyAgentbuilder`; `git status --short --branch` returns `fatal: not a git repository`.
- No current post-fix code-review artifact was found; the existing Todo 5 review is stale and unsupported by the current source state.
- No separate executor manual QA matrix artifact was supplied. This gate produced the requested command/static matrix artifacts itself.
- Browser/server manual QA was not run for this Todo 5 final gate; no servers were started by this verification.

## cleanup
- Temp dirs under `.omo/evidence/any-agent-system-builder/tmp-final-*`: count 0.
- Temp/smoke dirs under `generated/`: count 0.
- No generated-demo processes found.
- Existing port 5173 listener is `node /Users/genie/test/project/node_modules/.bin/vite`, unrelated to this workspace.

## finalVerdict
needs-fix
