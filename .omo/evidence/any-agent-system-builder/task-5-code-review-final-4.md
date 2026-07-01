# Todo 5 Final Code Review 4

codeQualityStatus: CLEAR
recommendation: APPROVE
reportPath: `.omo/evidence/any-agent-system-builder/task-5-code-review-final-4.md`
blockers: none

## Scope

Goal reviewed: final Todo 5 review after the `DEMO_PUBLIC_SEED` exact-field fix.

Primary files inspected:
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `generated/library-reservation-demo/backend/context.py`
- `generated/library-reservation-demo/backend/demo_data.py`
- `generated/library-reservation-demo/backend/main.py`
- `generated/library-reservation-demo/backend/agents.py`
- `generated/library-reservation-demo/frontend/src/App.jsx`
- `generated/library-reservation-demo/frontend/package.json`
- `generated/library-reservation-demo/backend/requirements.txt`

Evidence inspected:
- `.omo/plans/any-agent-system-builder.md`
- `.omo/evidence/any-agent-system-builder/task-5-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-library-extra-seed-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-5-library-missing-seed-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-5-library-extra-public-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-5-nonlibrary-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-validator-regression.txt`
- `.omo/evidence/any-agent-system-builder/task-5-validator-node-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/task-5-summary.txt`

Limitations:
- `git status` failed with `fatal: not a git repository`; there is no Git repository at or above `/Users/genie/dev/tools/skills/AnyAgentbuilder`, so I reviewed current files and evidence rather than a Git diff.
- No notepad path was provided in the review input.
- Per instruction, I did not start backend/frontend servers.

## Skill-Perspective Check

Ran before maintainability/test judgment:
- Loaded `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`.
- Also consulted `programming/references/python/README.md`, `programming/references/typescript/README.md`, and `programming/references/code-smells.md`.

Result:
- The seed fix does not violate the remove-ai-slops perspective. The negative checks are behavioral CLI probes, not deletion-only tests, requested-removal-only tests, tautologies, or implementation-constant mirrors.
- The seed fix does not violate the programming perspective. The validator parsing is scoped to the required boundary: top-level generated Python metadata/seed extraction.
- `agentic-system-builder/scripts/validate-domain-spec.mjs` is 993 pure LOC, but it has an explicit `SIZE_OK` portability justification at line 5. This is acceptable for this review, with residual risk noted below.
- `agentic-system-builder/scripts/scaffold-agent-system.mjs` is 228 pure LOC, below the 250 pure LOC ceiling.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

None requiring changes before approval.

## Review Notes

Library exact public contract is covered in metadata and actual public seed:
- Expected library public fields are defined in `agentic-system-builder/scripts/validate-domain-spec.mjs:135`.
- Expected internal fields are defined in `agentic-system-builder/scripts/validate-domain-spec.mjs:145`.
- `parsePythonDictAssignmentKeys` parses top-level keys from `DEMO_PUBLIC_SEED` at `agentic-system-builder/scripts/validate-domain-spec.mjs:678`.
- `assertExactFields` rejects missing and extra fields at `agentic-system-builder/scripts/validate-domain-spec.mjs:782`.
- Library `PUBLIC_FIELD_NAMES` exactness is enforced at `agentic-system-builder/scripts/validate-domain-spec.mjs:795`.
- Library `DEMO_PUBLIC_SEED` exactness is enforced at `agentic-system-builder/scripts/validate-domain-spec.mjs:821`.
- `checkGenerated` applies both checks at `agentic-system-builder/scripts/validate-domain-spec.mjs:985`.
- Current generated metadata matches the expected public/internal lists in `generated/library-reservation-demo/backend/context.py:4`.
- Current generated seed has exactly the seven public keys in `generated/library-reservation-demo/backend/demo_data.py:5`.

Non-library validation still works:
- Direct `pcbang` scaffold + `--check-generated` probe passed without requiring library field names.

Previous blockers remain closed:
- Stale marker / `vip_code`: `rg` found no `LIBRARY_RESERVATION_PATRON_MARKER`, stale marker text, or `vip_code` in `agentic-system-builder` or `generated/library-reservation-demo`.
- Pinned deps: generated frontend deps are exact versions in `generated/library-reservation-demo/frontend/package.json`; backend deps are exact pins in `generated/library-reservation-demo/backend/requirements.txt`.
- JSON/Python literal preservation: scaffold uses `JSON.stringify` in `jsonLiteral` and recursive `pythonLiteral` rendering in `agentic-system-builder/scripts/scaffold-agent-system.mjs:168`.
- Scaffold maintainability: scaffold remains compact and has cleanup-on-failure handling at `agentic-system-builder/scripts/scaffold-agent-system.mjs:223`.
- Todo 4 false-pass regressions: inspected `.omo/evidence/any-agent-system-builder/task-5-validator-regression.txt`; current validator also contains placeholder, executable-marker, route, frontend, and dependency assertions.
- Mock path provider calls: `rg` found no direct OpenAI import or `openai-agents` dependency in generated backend/frontend or templates. Generated backend gates non-mock runtime with HTTP 501 at `generated/library-reservation-demo/backend/main.py:77`.
- Frontend public-only rendering: current frontend labels/rendering cover public fields at `generated/library-reservation-demo/frontend/src/App.jsx:4` and `generated/library-reservation-demo/frontend/src/App.jsx:117`; `rg` found no internal-field markers in `generated/library-reservation-demo/frontend`.

## Commands Run

Read-only / inspection:
- `pwd`
- `git status --short --branch` (failed: not a Git repository)
- `find .. -name AGENTS.md -print`
- `sed -n '1,240p' .omo/plans/any-agent-system-builder.md`
- `sed -n ... agentic-system-builder/scripts/validate-domain-spec.mjs`
- `sed -n ... generated/library-reservation-demo/backend/demo_data.py`
- `sed -n ... generated/library-reservation-demo/backend/context.py`
- `sed -n ... generated/library-reservation-demo/frontend/src/App.jsx`
- `sed -n ... .omo/evidence/any-agent-system-builder/task-5-*.txt`
- `rg -n "DEMO_PUBLIC_SEED|loan_titles|vip_code|metadata|public" generated/library-reservation-demo agentic-system-builder/scripts/validate-domain-spec.mjs`

Validation / probes:
- `node --check agentic-system-builder/scripts/validate-domain-spec.mjs`
- `node --check agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `node --check agentic-system-builder/scripts/qa-generated-demo.mjs`
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo`
- `npm run validate:skill`
- `npm run validate:examples`
- `node --input-type=module <<'NODE' ... NODE` custom temp probe:
  - extra `vip_code` in library `DEMO_PUBLIC_SEED` failed with expected extra-field error.
  - missing `loan_titles` in library `DEMO_PUBLIC_SEED` failed with expected missing-field error.
  - extra `vip_code` in library `PUBLIC_FIELD_NAMES` failed with expected extra-field error.
- `node --input-type=module <<'NODE' ... NODE` custom temp probe:
  - scaffolded `pcbang` to temp dir.
  - validated `pcbang` generated app with `--check-generated`.
  - removed temp dir.

Hygiene:
- `find /tmp -maxdepth 1 -type d -name 'aab-task5-*' -print` returned no entries.
- `find ${TMPDIR:-/tmp} -maxdepth 1 -type d -name 'aab-review-*' -print` returned no entries.
- `ps -axo pid,command | rg '([g]enerated/library-reservation-demo|[u]vicorn main:app|[v]ite --host 127\\.0\\.0\\.1|[q]a-generated-demo)'` returned no matches.
- `rg -n '\\b(from\\s+openai\\b|import\\s+openai\\b|openai-agents)' generated/library-reservation-demo/backend generated/library-reservation-demo/frontend agentic-system-builder/templates/backend agentic-system-builder/templates/frontend` returned no matches.
- `rg -n 'LIBRARY_RESERVATION_PATRON_MARKER|library reservation patron|vip_code' agentic-system-builder generated/library-reservation-demo` returned no matches.
- `rg -n 'member_id|internal_notes|policy_overrides|raw_hold_queue|staff_token|inventory_cost' generated/library-reservation-demo/frontend` returned no matches.

## Residual Risks

- This review did not run live backend/frontend QA because the instruction explicitly said not to start servers.
- The generated-app validator remains a static parser, not a Python AST interpreter. The direct probes cover the generated file shape and the requested exact-field blocker.
- The validator is intentionally large and portable. Its `SIZE_OK` exception is documented, but future broadening should split by validation concern if it stops being single-purpose.

## Cleanup

- I created temporary fixtures only under the OS temp directory for direct probes.
- Both custom temp probe scripts removed their temp directories in `finally` blocks.
- Final temp-dir scans found no `aab-task5-*` or `aab-review-*` leftovers.
- No servers were started; process scan found no matching generated-demo server or QA processes.

Final status: APPROVE.
