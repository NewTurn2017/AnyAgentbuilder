# Todo 5 Final Code Review 2

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-5-code-review-final-2.md

## Blockers

### HIGH - Library generated validator is not exact about the public field contract

- File: agentic-system-builder/scripts/validate-domain-spec.mjs:678
- File: agentic-system-builder/scripts/validate-domain-spec.mjs:689
- File: agentic-system-builder/scripts/validate-domain-spec.mjs:891

`--check-generated` now reads `DOMAIN_KEY`, `PUBLIC_FIELD_NAMES`, and `INTERNAL_FIELD_NAMES`, which closes the non-library overfit direction. However, the library-specific branch only checks for missing planned public fields and missing planned internal fields. It never rejects extra public fields for `DOMAIN_KEY = "library"`, even though the plan says the generated library demo schema must define the listed public fields only.

I verified the false pass with a temp-dir probe:

```text
tmp=$(mktemp -d /tmp/aab-review-extra-public.XXXXXX)
cp -R generated/library-reservation-demo "$tmp/library"
perl -0pi -e 's/(PUBLIC_FIELD_NAMES = \[\n)/$1  "vip_code",\n/' "$tmp/library/backend/context.py"
perl -0pi -e 's/(DEMO_PUBLIC_SEED = \{\n)/$1  "vip_code": "VIP-1",\n/' "$tmp/library/backend/demo_data.py"
perl -0pi -e 's/(const fieldLabels = \{\n)/$1  "vip_code": "VIP 코드",\n/' "$tmp/library/frontend/src/App.jsx"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/library"
```

Observed result:

```text
OK: generated library app skeleton valid: /tmp/aab-review-extra-public.gWUTJG/library
cleanup=PASS removed /tmp/aab-review-extra-public.gWUTJG
```

This weakens Todo 4 validator hardening and makes the Todo 5 summary claim that library strictness was retained misleading. The fix should make library public fields exact, not just inclusive, while preserving the generalized non-library path.

## Severity Findings

### CRITICAL

None.

### HIGH

1. Library generated validator allows extra public fields. See blocker above.

### MEDIUM

None.

### LOW

1. Review limitation: `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository, so I could not verify a Git diff. `git status --short --branch` returned `fatal: not a git repository`. I reviewed the requested files and evidence artifacts directly instead.

## Skill Perspective Check

Ran required skill-perspective check:

- `omo:remove-ai-slops`: loaded `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md` fully. The diff violates this perspective because the validator has a false-confidence test shape: it checks implementation markers and required inclusions but misses the requested exact library contract.
- `omo:programming`: loaded `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`, plus TypeScript/JavaScript-adjacent references `references/typescript/README.md`, `references/typescript/data-modeling.md`, `references/typescript/error-handling.md`, and `references/code-smells.md`. The diff violates this perspective at the generated validation boundary: it parses generated metadata but does not encode the exact domain invariant for the library public contract.

The scaffold script itself is now below the 250 pure-LOC ceiling: `agentic-system-builder/scripts/scaffold-agent-system.mjs` measured 228 pure LOC. The validator is 867 pure LOC and carries `SIZE_OK`; I did not make that a separate blocker because Todo 4 intentionally required a portable single-file built-in validator, but the size remains a maintenance risk.

## Checks That Passed

- Non-library generated scaffolds are no longer blocked by library-only required fields. My temp probe scaffolded and validated `airline` successfully:

```text
node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain airline --out /tmp/aab-review-nonlibrary.4HG3YI/airline --force
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated /tmp/aab-review-nonlibrary.4HG3YI/airline
OK: generated airline app skeleton valid
cleanup=PASS removed /tmp/aab-review-nonlibrary.4HG3YI
```

- Checked-in library demo currently has exactly the planned public fields in `generated/library-reservation-demo/backend/context.py:4` and internal fields in `generated/library-reservation-demo/backend/context.py:13`.
- No stale marker residue found in the requested scan evidence: `.omo/evidence/any-agent-system-builder/task-5-marker-scan.txt`.
- No library internal field markers found in frontend evidence: `.omo/evidence/any-agent-system-builder/task-5-frontend-internal-scan.txt`.
- Generated frontend dependencies are pinned in `generated/library-reservation-demo/frontend/package.json:11`.
- Backend dependencies are pinned in `generated/library-reservation-demo/backend/requirements.txt:1`.
- No direct `openai` imports or OpenAI client calls matched in `agentic-system-builder/scripts`, `agentic-system-builder/templates`, or `generated/library-reservation-demo`.
- Node syntax checks passed for both scripts.

## Commands Run

```text
sed -n ... remove-ai-slops/SKILL.md
sed -n ... programming/SKILL.md
sed -n ... programming/references/typescript/README.md
sed -n ... programming/references/typescript/data-modeling.md
sed -n ... programming/references/typescript/error-handling.md
sed -n ... programming/references/code-smells.md
git status --short --branch
sed -n '1,240p' .omo/plans/any-agent-system-builder.md
find .omo/evidence/any-agent-system-builder -maxdepth 1 -type f -name 'task-5-*.txt' -print | sort
find agentic-system-builder/templates -type f | sort
wc -l agentic-system-builder/scripts/scaffold-agent-system.mjs agentic-system-builder/scripts/validate-domain-spec.mjs
find generated/library-reservation-demo -type f | sort
nl -ba agentic-system-builder/scripts/scaffold-agent-system.mjs
nl -ba agentic-system-builder/scripts/validate-domain-spec.mjs
rg -n "OPENAI|openai|openai-agents|AGENT_RUNTIME|fetch\(|latest|\^|~|LIBRARY_RESERVATION_PATRON_MARKER|library_reservation_patron_marker|library reservation patron|TODO|FIXME|placeholder|return null" agentic-system-builder generated/library-reservation-demo package.json
awk pure LOC measurements for scaffold, validator, templates, generated files
node --check agentic-system-builder/scripts/scaffold-agent-system.mjs
node --check agentic-system-builder/scripts/validate-domain-spec.mjs
awk inspection of .omo/evidence/any-agent-system-builder/task-5-*.txt
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo
npm run validate:examples
temp strictness probe adding vip_code to generated library public fields
temp non-library scaffold/generated-check probe for airline
rg -n direct OpenAI import/client-call patterns
rg -n library internal field markers in generated frontend/public runtime files
find /tmp -maxdepth 1 -type d for review temp cleanup
```

## Evidence Paths Inspected

- .omo/plans/any-agent-system-builder.md
- .omo/evidence/any-agent-system-builder/task-5-bad-json.txt
- .omo/evidence/any-agent-system-builder/task-5-cleanup.txt
- .omo/evidence/any-agent-system-builder/task-5-domain-smoke.txt
- .omo/evidence/any-agent-system-builder/task-5-examples-check.txt
- .omo/evidence/any-agent-system-builder/task-5-file-list.txt
- .omo/evidence/any-agent-system-builder/task-5-files.txt
- .omo/evidence/any-agent-system-builder/task-5-frontend-internal-scan.txt
- .omo/evidence/any-agent-system-builder/task-5-generated-check.txt
- .omo/evidence/any-agent-system-builder/task-5-generated-scan.txt
- .omo/evidence/any-agent-system-builder/task-5-json-string-literals.txt
- .omo/evidence/any-agent-system-builder/task-5-loc.txt
- .omo/evidence/any-agent-system-builder/task-5-marker-scan.txt
- .omo/evidence/any-agent-system-builder/task-5-missing-spec.txt
- .omo/evidence/any-agent-system-builder/task-5-negative.txt
- .omo/evidence/any-agent-system-builder/task-5-node-check.txt
- .omo/evidence/any-agent-system-builder/task-5-nonlibrary-generated-check.txt
- .omo/evidence/any-agent-system-builder/task-5-nonlibrary-residue-scan.txt
- .omo/evidence/any-agent-system-builder/task-5-pinned-deps.txt
- .omo/evidence/any-agent-system-builder/task-5-py-compile.txt
- .omo/evidence/any-agent-system-builder/task-5-pycache-cleanup.txt
- .omo/evidence/any-agent-system-builder/task-5-scaffold-node-check.txt
- .omo/evidence/any-agent-system-builder/task-5-scaffold.txt
- .omo/evidence/any-agent-system-builder/task-5-skill-check.txt
- .omo/evidence/any-agent-system-builder/task-5-summary.txt
- .omo/evidence/any-agent-system-builder/task-5-transient-cleanup.txt
- .omo/evidence/any-agent-system-builder/task-5-unpinned-scan.txt
- .omo/evidence/any-agent-system-builder/task-5-validator-regression.txt

## Cleanup

- Removed accidental probe temp dirs after a shell variable issue: `/tmp/aab-review-extra-public.IEgc0k`, `/tmp/aab-review-nonlibrary.ibOxHc`.
- Removed final strictness probe temp dir: `/tmp/aab-review-extra-public.gWUTJG`.
- Removed final non-library probe temp dir: `/tmp/aab-review-nonlibrary.4HG3YI`.
- Final `/tmp` scan for `aab-review-extra-public.*` and `aab-review-nonlibrary.*` returned no directories.

## Blockers To Fix Before Approval

1. Update `assertDomainFieldContract()` so `domainKey === "library"` rejects any public fields outside `LIBRARY_PUBLIC_FIELDS`, not only missing planned fields.
2. Add a negative evidence probe proving `--check-generated` fails for a library generated app with an extra public field while still passing non-library generated apps that use their own field metadata.
