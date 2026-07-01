# Todo 5 Code Review Final

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-5-code-review-final.md

## Blockers

1. Non-library scaffolds still contain the stale library-only marker from the previous gate.
   - Severity: HIGH
   - Source refs: `agentic-system-builder/templates/backend/demo_data.py.tmpl:42`, `generated/library-reservation-demo/backend/demo_data.py:91`
   - Direct probe: temp scaffolds for `airline`, `pcbang`, and `generic` all exited 0, then `rg` found `LIBRARY_RESERVATION_PATRON_MARKER = "library reservation patron"` in each generated `backend/demo_data.py` (`airline:89`, `pcbang:87`, `generic:83` in the temp outputs).
   - Why this blocks: Todo 5 requires the script to generate built-in domains beyond the library demo and not hardcode only the library demo. A library patron marker in PC bang/generic/airline output is exactly the stale residue called out by the prior gate.

## CRITICAL

None.

## HIGH

- Non-library scaffold residue remains, as listed in Blocker 1.

## MEDIUM

- The generated-app validator remains overfit to library fields, but I am not treating this as an independent Todo 5 blocker under the user's narrowed instruction because the required generated app for `--check-generated` is the library demo.
  - Refs: `agentic-system-builder/scripts/validate-domain-spec.mjs:58`, `agentic-system-builder/scripts/validate-domain-spec.mjs:90`, `agentic-system-builder/scripts/validate-domain-spec.mjs:135`, `agentic-system-builder/scripts/validate-domain-spec.mjs:801`
  - Evidence: `--check-generated` passed for `generated/library-reservation-demo`, but failed on temp `airline`, `pcbang`, and `generic` scaffolds with missing library field markers such as `patron_display_name` and `loan_titles`.
  - Risk: if later tasks advertise `--check-generated` as a reusable generated-app validator, non-library scaffolds cannot use it honestly.

- The Todo 5 smoke evidence is too positive-only for the exact prior residue blocker.
  - Evidence path: `.omo/evidence/any-agent-system-builder/task-5-domain-smoke.txt`
  - It confirms PC bang brand/agent/widget strings and cleanup, but does not assert absence of `LIBRARY_RESERVATION_PATRON_MARKER`; the marker remains in the template and temp PC bang output.

## LOW

- No Git diff is available from this directory; `git status --short --branch` returns `fatal: not a git repository`. I reviewed current files and evidence artifacts directly.
- Generated Python still uses loose `dict[str, Any]` in the mock app templates. This is a programming-skill concern, but it was already documented as an accepted starter/mock risk in `.omo/evidence/any-agent-system-builder/task-5-summary.txt` and is not a Todo 5 blocker.

## Fixed Previous Blockers

- Scaffold script size is fixed: `agentic-system-builder/scripts/scaffold-agent-system.mjs` measures 228 pure LOC.
- Giant inline templates are fixed: project bodies and domain data live under `agentic-system-builder/templates/**`.
- Generated frontend dependencies are pinned in `agentic-system-builder/templates/frontend/package.json.tmpl:12` and `generated/library-reservation-demo/frontend/package.json:12`.
- JSON-to-Python serialization now preserves strings containing `true`, `false`, and `null` while converting actual JSON booleans/null to Python `True`, `False`, and `None`.
- A post-fix code-review artifact now exists here.

## Positive Checks

- `node --check agentic-system-builder/scripts/scaffold-agent-system.mjs` exited 0.
- `npm run validate:skill` exited 0.
- `npm run validate:examples` exited 0 for `airline`, `library`, `pcbang`, and `generic`.
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo` exited 0.
- Dependency range scan found no `latest`, caret, tilde, workspace, file, or GitHub dependency markers in the generated/template frontend packages.
- The custom JSON literal probe generated quoted string values for `"true false null"` / `"false"` and Python literals for actual `true` / `false` / `null`.
- No backend/frontend servers were started during this review.

## Skill-Perspective Check

- Ran the required `remove-ai-slops` consultation by reading `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Ran the required `programming` consultation by reading `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`, plus `references/code-smells.md` and the TypeScript reference README.
- `remove-ai-slops` perspective: violation remains. The stale marker is dead/residue code, and the prior smoke evidence missed the exact negative assertion needed to prevent recurrence.
- `programming` perspective: violation remains in the validator/evidence shape. The non-library generated-validator failure is implementation-mirroring/static overfit to library constants. The scaffold script size itself no longer violates the 250 pure LOC ceiling.
- Test/evidence slop pass: no deletion-only tests were found, but the PC bang smoke is underfit to the previous failure because it verifies requested domain markers without checking stale library markers.

## Evidence Inspected

- `.omo/plans/any-agent-system-builder.md`
- `.omo/evidence/any-agent-system-builder/task-5-*.txt`
- `.omo/evidence/any-agent-system-builder/task-5-code-review.md`
- `.omo/evidence/any-agent-system-builder/verify-task-5-gate-review.md`
- `.omo/evidence/any-agent-system-builder/verify-task-5-domain-smoke.txt`
- `package.json`
- `agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `agentic-system-builder/templates/**`
- `generated/library-reservation-demo/**`

## Commands Run

```bash
cat /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
cat /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
cat /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/code-smells.md
cat /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/typescript/README.md
git status --short --branch
find agentic-system-builder -maxdepth 4 -type f | sort
find generated/library-reservation-demo -maxdepth 4 -type f | sort
find .omo/evidence/any-agent-system-builder -type f -name 'task-5-*.txt' -print | sort
awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/' agentic-system-builder/scripts/scaffold-agent-system.mjs | wc -l
nl -ba .omo/plans/any-agent-system-builder.md
nl -ba agentic-system-builder/scripts/scaffold-agent-system.mjs
nl -ba agentic-system-builder/templates/domains.json
nl -ba agentic-system-builder/templates/backend/*.tmpl
nl -ba agentic-system-builder/templates/frontend/**/*.tmpl
nl -ba generated/library-reservation-demo/backend/*.py
nl -ba generated/library-reservation-demo/frontend/src/App.jsx
nl -ba generated/library-reservation-demo/frontend/package.json
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain airline --out /tmp/.../airline
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain pcbang --out /tmp/.../pcbang
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain generic --out /tmp/.../generic
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated /tmp/.../airline
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated /tmp/.../pcbang
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated /tmp/.../generic
node agentic-system-builder/scripts/scaffold-agent-system.mjs --spec /tmp/.../custom.json --out /tmp/.../probe
node --check agentic-system-builder/scripts/scaffold-agent-system.mjs
npm run validate:skill
npm run validate:examples
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo
rg -n "latest|\^[0-9]|~[0-9]|workspace:|file:|github:" agentic-system-builder/templates/frontend/package.json.tmpl generated/library-reservation-demo/frontend/package.json package.json
rg -n "LIBRARY_RESERVATION_PATRON_MARKER|library reservation patron" agentic-system-builder/templates generated/library-reservation-demo
find generated -maxdepth 1 -type d \( -name '*smoke*' -o -name '*bad*' -o -name 'verify-task-5-*' -o -name 'task-5-*' \) -print | sort
ps -axo pid,command | rg 'generated/library-reservation-demo|aab-task5-review|aab-task5-json-review|uvicorn main:app|vite --host 127.0.0.1' || true
```

## Cleanup

- Temp scaffold output `/tmp/aab-task5-review-YeLXry` was removed; follow-up check reported `exists=false`.
- Temp JSON probe output `/tmp/aab-task5-json-review-Hgf5NG` was removed; follow-up check reported `exists=false`.
- Repo-local cleanup check found no `generated/*smoke*`, `generated/*bad*`, `generated/verify-task-5-*`, or `generated/task-5-*` probe directories.
- No servers were started. Process scan showed only the scan command itself, not a long-running generated backend/frontend.

## Final Status

REQUEST_CHANGES. The main maintainability and pinning fixes landed, but the prior PC bang/library residue blocker is still present in the shared template and reproduces for every non-library built-in domain.
