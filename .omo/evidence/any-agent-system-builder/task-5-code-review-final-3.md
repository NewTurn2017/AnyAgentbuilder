# Todo 5 Final Code Review 3

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: `.omo/evidence/any-agent-system-builder/task-5-code-review-final-3.md`

## Blockers

- HIGH: `--check-generated` still accepts a generated library app whose public seed defines an extra out-of-contract public key. The validator now rejects extra names in `PUBLIC_FIELD_NAMES`, but it does not compare the generated library `DEMO_PUBLIC_SEED` key set to the exact required public fields. A temp copy with only `"vip_code": "VIP-7"` added to `generated/library-reservation-demo/backend/demo_data.py` passed validation with exit 0. The plan requires the generated library demo schema to define only `patron_display_name`, `reservation_id`, `resource_label`, `time_window`, `reservation_status`, `loan_titles`, and `policy_summary`; `DEMO_PUBLIC_SEED` is part of that generated public schema/data surface. See `generated/library-reservation-demo/backend/demo_data.py:5`, `agentic-system-builder/scripts/validate-domain-spec.mjs:859`, and `agentic-system-builder/scripts/validate-domain-spec.mjs:864`.

## Findings

### CRITICAL

- None.

### HIGH

- `agentic-system-builder/scripts/validate-domain-spec.mjs:859`: library exact-field validation only parses `backend/context.py` metadata lists, then calls `assertDomainFieldContract()` on `PUBLIC_FIELD_NAMES` and `INTERNAL_FIELD_NAMES` at `agentic-system-builder/scripts/validate-domain-spec.mjs:862` and `agentic-system-builder/scripts/validate-domain-spec.mjs:864`. It never parses or compares `DEMO_PUBLIC_SEED` from `generated/library-reservation-demo/backend/demo_data.py:5`. Probe result:
  - `CASE=library-extra-public-list` exited 1 with `ERROR: generated library backend has unexpected extra public context fields: vip_code`.
  - `CASE=library-missing-public-list` exited 1 with `ERROR: generated library backend missing required public context fields: loan_titles`.
  - `CASE=library-extra-public-seed-only` exited 0 with `OK: generated library app skeleton valid`.
  This leaves the exact public-fields-only contract partially enforced and gives false confidence for a generated app that still contains an extra public key.

### MEDIUM

- No additional medium findings.

### LOW

- No Git diff could be inspected because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository from this workspace root. Review was based on current source files and evidence artifacts, not a repository diff.
- `agentic-system-builder/scripts/validate-domain-spec.mjs` is 872 pure LOC. It has a line-5 `SIZE_OK` comment explaining the portable single-file validator choice, so I am not blocking Todo 5 on size, but this remains a maintenance risk if future changes continue accumulating in this file.

## Skill-Perspective Check

- Loaded and consulted `omo:remove-ai-slops` and `omo:programming` before judging test relevance and maintainability.
- `remove-ai-slops` perspective: the new evidence covers the fixed metadata-list regression, but the passing seed-only mutation is an overfit gap. It is not a deletion-only or tautological test issue; it is missing negative coverage for a second generated public-field source.
- `programming` perspective: the validator performs boundary validation, which is appropriate for this script. The issue is not needless production parsing; it is under-validation at the generated-app contract boundary. No new untyped escape hatch was introduced in reviewed code.

## Verified Closed / Still OK

- Exact metadata list checks: extra library `PUBLIC_FIELD_NAMES` failed and missing `loan_titles` failed.
- Non-library generated apps still validate with their own fields: `airline`, `pcbang`, and `generic` temp scaffolds all passed `--check-generated`.
- Todo 4 false-pass hardening remains intact in reproduced probes: placeholder, tokenstuff, and wrong-method temp fixtures all failed validation.
- Pinned dependencies are intact in generated/template files: `fastapi==0.115.6`, `uvicorn==0.34.0`, `@vitejs/plugin-react: 4.3.4`, `vite: 5.4.11`, `react: 18.3.1`, `react-dom: 18.3.1`.
- No stale `LIBRARY_RESERVATION_PATRON_MARKER` or `library reservation patron` residue was found.
- No mock-mode OpenAI import/call path was found. Searches found only docs/guard text and `AGENT_RUNTIME` handling; generated backend imports no OpenAI package.
- No servers were started.

## Commands Run

```sh
sed -n '1,240p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '241,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
sed -n '261,620p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
find .. -name AGENTS.md -print
git status --short --branch
git diff --stat
sed -n '1,220p' .omo/plans/any-agent-system-builder.md
find generated/library-reservation-demo -maxdepth 4 -type f | sort
find agentic-system-builder -maxdepth 4 -type f | sort
rg -n "vip_code|PUBLIC_FIELD_NAMES|INTERNAL_FIELD_NAMES|public_context|internal_context|LIBRARY_RESERVATION_PATRON_MARKER|openai|AGENT_RUNTIME|placeholder|tokenstuff|route-tokenstuff|wrong-method" agentic-system-builder generated/library-reservation-demo package.json .omo/evidence/any-agent-system-builder/task-5-*.txt
nl -ba agentic-system-builder/scripts/validate-domain-spec.mjs
nl -ba agentic-system-builder/scripts/scaffold-agent-system.mjs
nl -ba generated/library-reservation-demo/backend/context.py
nl -ba generated/library-reservation-demo/backend/demo_data.py
nl -ba generated/library-reservation-demo/backend/main.py
nl -ba generated/library-reservation-demo/frontend/src/App.jsx
nl -ba agentic-system-builder/templates/domains.json
nl -ba agentic-system-builder/templates/backend/context.py.tmpl
nl -ba agentic-system-builder/templates/backend/demo_data.py.tmpl
nl -ba agentic-system-builder/templates/frontend/src/App.jsx.tmpl
nl -ba .omo/evidence/any-agent-system-builder/task-5-library-extra-public-negative.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-nonlibrary-generated-check.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-validator-regression.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-generated-check.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-validator-node-check.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-summary.txt
nl -ba .omo/evidence/any-agent-system-builder/task-5-cleanup.txt
node --check agentic-system-builder/scripts/validate-domain-spec.mjs
node --check agentic-system-builder/scripts/scaffold-agent-system.mjs
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder
npm run validate:examples
rg -n "generated library demo schema|public fields only|public_context|DEMO_PUBLIC_SEED|PUBLIC_FIELD_NAMES|vip_code|schema must define" .omo/plans/any-agent-system-builder.md agentic-system-builder/REFERENCE.md agentic-system-builder/EXAMPLES.md agentic-system-builder/templates/domains.json agentic-system-builder/templates/backend/demo_data.py.tmpl agentic-system-builder/templates/backend/context.py.tmpl
rg -n "from openai|import openai|OpenAI|openai-agents|OPENAI_API_KEY|AGENT_RUNTIME" agentic-system-builder generated/library-reservation-demo
find /tmp -maxdepth 1 -type d \( -name 'aab-task5-extra-public.*' -o -name 'aab-task5-nonlibrary.*' -o -name 'aab-task5-regression.*' \) -print
find . -name '__pycache__' -o -name 'node_modules' -o -name '.next' -o -name 'dist'
for f in agentic-system-builder/scripts/validate-domain-spec.mjs agentic-system-builder/scripts/scaffold-agent-system.mjs agentic-system-builder/scripts/qa-generated-demo.mjs generated/library-reservation-demo/backend/agents.py generated/library-reservation-demo/backend/context.py generated/library-reservation-demo/backend/demo_data.py generated/library-reservation-demo/backend/events.py generated/library-reservation-demo/backend/main.py generated/library-reservation-demo/backend/memory.py generated/library-reservation-demo/backend/tools.py generated/library-reservation-demo/frontend/src/App.jsx; do awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/ { count++ } END { print FILENAME ":" count }' "$f"; done
```

Temp fixture probe command:

```sh
tmp=$(mktemp -d /tmp/aab-final-review-3.XXXXXX)
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT
cp -R generated/library-reservation-demo "$tmp/library-extra-list"
perl -0pi -e 's/  "policy_summary",\n/  "policy_summary",\n  "vip_code",\n/' "$tmp/library-extra-list/backend/context.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/library-extra-list"
cp -R generated/library-reservation-demo "$tmp/library-missing-list"
perl -0pi -e 's/  "loan_titles",\n//' "$tmp/library-missing-list/backend/context.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/library-missing-list"
cp -R generated/library-reservation-demo "$tmp/library-extra-seed"
perl -0pi -e 's/(  "policy_summary": "[^"]+",\n)/$1  "vip_code": "VIP-7",\n/' "$tmp/library-extra-seed/backend/demo_data.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/library-extra-seed"
for domain in airline pcbang generic; do
  node agentic-system-builder/scripts/scaffold-agent-system.mjs --domain "$domain" --out "$tmp/$domain" --force
  node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/$domain"
done
```

Todo 4 reproduction command:

```sh
tmp=$(mktemp -d /tmp/aab-final-review-3-t4.XXXXXX)
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT
cp -R generated/library-reservation-demo "$tmp/placeholder"
printf 'placeholder only\n' > "$tmp/placeholder/backend/main.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/placeholder"
cp -R generated/library-reservation-demo "$tmp/wrong-method"
perl -0pi -e 's/@app\.post\("\/chat"\)/@app.get("\/chat")/' "$tmp/wrong-method/backend/main.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/wrong-method"
cp -R generated/library-reservation-demo "$tmp/tokenstuff"
printf 'def reservation_tool():\n    return "tool availability reservation"\n' > "$tmp/tokenstuff/backend/tools.py"
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp/tokenstuff"
```

Cleanup verification:

```sh
find /tmp -maxdepth 1 -type d \( -name 'aab-final-review-3.*' -o -name 'aab-final-review-3-t4.*' \) -print
```

Cleanup verification output was empty.

## Evidence Inspected

- `.omo/plans/any-agent-system-builder.md`
- `.omo/evidence/any-agent-system-builder/task-5-library-extra-public-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-5-nonlibrary-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-validator-regression.txt`
- `.omo/evidence/any-agent-system-builder/task-5-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-validator-node-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-summary.txt`
- `.omo/evidence/any-agent-system-builder/task-5-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/task-5-scaffold.txt`
- `.omo/evidence/any-agent-system-builder/task-5-pinned-deps.txt`
- `.omo/evidence/any-agent-system-builder/task-5-json-string-literals.txt`
- `.omo/evidence/any-agent-system-builder/task-5-marker-scan.txt`
- `.omo/evidence/any-agent-system-builder/task-5-frontend-internal-scan.txt`

## Final Status

BLOCK. Request changes before approval. Fix the validator to enforce the exact library public field set across all generated public-field sources, at minimum `PUBLIC_FIELD_NAMES` and `DEMO_PUBLIC_SEED`, then add/re-run a negative fixture where only `DEMO_PUBLIC_SEED` contains `vip_code`.
