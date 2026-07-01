# Todo 4 Code Quality Review Final

Result: FAIL

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: `.omo/evidence/any-agent-system-builder/task-4-code-review-final.md`

## Scope

Reviewed Todo 4, "Harden deterministic validation coverage", from `.omo/plans/any-agent-system-builder.md`.

Reviewed:

- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `agentic-system-builder/SKILL.md`
- `agentic-system-builder/REFERENCE.md`
- `agentic-system-builder/EXAMPLES.md`
- `.omo/evidence/any-agent-system-builder/task-4-validator.txt`
- `.omo/evidence/any-agent-system-builder/task-4-generated-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-4-generated-placeholder-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-4-generated-tokenstuff-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-4-generated-route-tokenstuff-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-4-node-check.txt`
- `.omo/evidence/any-agent-system-builder/task-4-cleanup.txt`

Git diff was unavailable: `git status --short --branch` failed because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. This review is based on the current source snapshot and evidence artifacts.

## Skill Perspective Check

Required perspective check ran.

- Loaded `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`.

Perspective result:

- `remove-ai-slops`: violated. The generated-app validator still has an overfit static contract gap that can produce misleading success for wrong endpoint methods.
- `programming`: violated for contract honesty. The file-size issue itself is no longer an unexcused violation because `agentic-system-builder/scripts/validate-domain-spec.mjs:5` has a `SIZE_OK` rationale, but the 739 pure-LOC script remains a maintainability watch item.

## Findings

### CRITICAL

None.

### HIGH

1. `--check-generated` does not validate required HTTP methods for generated endpoints.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:286`

Todo 4 is supposed to validate the generated app contract, and the plan defines the backend surface as `GET /health`, `GET /state/bootstrap`, `GET /state`, `GET /state/stream`, and `POST /chat`. The current route check only iterates endpoint strings from `ENDPOINT_TERMS` and accepts any FastAPI method for any endpoint:

- `agentic-system-builder/scripts/validate-domain-spec.mjs:50` lists paths without methods.
- `agentic-system-builder/scripts/validate-domain-spec.mjs:291` allows `(get|post|put|patch|delete|api_route)` for every endpoint.
- `agentic-system-builder/scripts/validate-domain-spec.mjs:292` accepts `app.add_api_route(...)` without checking `methods=`.

That means a scaffold with `@app.get("/chat")` or `@app.post("/health")` can still pass deterministic generated-contract validation even though later real QA and clients would hit the wrong method. This is an obvious false-pass class for the generated contract and should be fixed before approval.

Blocker: encode endpoint-method pairs and require `/chat` to be POST while the state and health endpoints are GET. For `app.add_api_route`, require an explicit matching `methods=[...]` argument or reject it for this static validator.

### MEDIUM

1. Frontmatter validation is weaker than the Todo contract.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:537`

The validator checks that `name` and `description` exist and that the description contains `Use when`, but it does not verify the exact required skill name `agentic-system-builder`, third-person description shape, or two-sentence capability/use-when structure from the plan. The current `SKILL.md` is correct, but the validator coverage is incomplete.

2. Methodology-level public/internal validation is marker-based.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:510`

`assertReferenceContextSeparation` concatenates `REFERENCE.md` and `EXAMPLES.md` and checks global marker strings. The example schema validation is stronger, but this specific methodology check can pass with scattered tokens rather than a coherent section-level boundary.

3. `SIZE_OK` closes the prior size blocker, but the file is still large.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:5`

Current measurements: 819 total lines and 739 pure LOC. The top-of-file `SIZE_OK` rationale addresses the previous no-rationale blocker, and the built-in-only portability reason is plausible for a copied skill bundle. Treat further growth as risky unless split by responsibility.

### LOW

1. `task-4-node-check.txt` is empty.

Evidence: `.omo/evidence/any-agent-system-builder/task-4-node-check.txt`

I reran `node --check agentic-system-builder/scripts/validate-domain-spec.mjs` and it exited 0, so this is not a functional blocker. The evidence file itself is low-signal because successful `node --check` prints no output.

2. Todo 4 remains unchecked in the plan.

File: `.omo/plans/any-agent-system-builder.md`

The plan still shows `- [ ] 4. Harden deterministic validation coverage`. That is appropriate while this blocker remains open.

## Closed Earlier Blockers

- Placeholder generated app rejection is fixed. Existing evidence `.omo/evidence/any-agent-system-builder/task-4-generated-placeholder-negative.txt` shows `ERROR: generated backend main.py has only placeholder content`, and my rerun against the existing fixture exited 1.
- Inert token-stuffed generated app rejection is fixed for the supplied fixture. Existing evidence `.omo/evidence/any-agent-system-builder/task-4-generated-tokenstuff-negative.txt` shows frontend `return null` rejection, `.omo/evidence/any-agent-system-builder/task-4-generated-route-tokenstuff-negative.txt` shows literal-only backend-module rejection, and my rerun against `generated-tokenstuff-pass` exited 1 with `ERROR: generated backend/tools.py must contain executable data/logic beyond literal marker strings`.
- Validator size rationale is present at `agentic-system-builder/scripts/validate-domain-spec.mjs:5`.

## Verification Commands

Read-only commands run:

```sh
sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '261,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md
sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
sed -n '261,620p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md
git status --short --branch
find .. -name AGENTS.md -print
sed -n '1,240p' .omo/plans/any-agent-system-builder.md
wc -l agentic-system-builder/scripts/validate-domain-spec.mjs
awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/' agentic-system-builder/scripts/validate-domain-spec.mjs | wc -l
sed -n '1,260p' agentic-system-builder/scripts/validate-domain-spec.mjs
sed -n '261,560p' agentic-system-builder/scripts/validate-domain-spec.mjs
sed -n '561,900p' agentic-system-builder/scripts/validate-domain-spec.mjs
find .omo/evidence/any-agent-system-builder -maxdepth 1 -type f | sort
find agentic-system-builder -maxdepth 2 -type f | sort
find generated/library-reservation-demo -maxdepth 3 -type f | sort
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-validator.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-generated-negative.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-generated-placeholder-negative.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-generated-tokenstuff-negative.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-generated-route-tokenstuff-negative.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-node-check.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-cleanup.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-negative.txt
sed -n '1,260p' .omo/evidence/any-agent-system-builder/task-4-adversarial-probes.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-generated-static-frontend-negative.txt
sed -n '1,220p' .omo/evidence/any-agent-system-builder/task-4-negative-statuses.txt
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); console.log(JSON.stringify(p.scripts,null,2))"
nl -ba agentic-system-builder/scripts/validate-domain-spec.mjs | sed -n '1,220p'
nl -ba agentic-system-builder/scripts/validate-domain-spec.mjs | sed -n '221,520p'
nl -ba agentic-system-builder/scripts/validate-domain-spec.mjs | sed -n '521,840p'
nl -ba agentic-system-builder/SKILL.md | sed -n '1,140p'
nl -ba agentic-system-builder/REFERENCE.md | sed -n '1,260p'
nl -ba agentic-system-builder/EXAMPLES.md | sed -n '1,260p'
nl -ba agentic-system-builder/EXAMPLES.md | sed -n '261,380p'
find .omo/evidence/any-agent-system-builder -maxdepth 4 -type d | sort
find .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST -maxdepth 5 -type f | sort
find .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST -maxdepth 5 -type d | sort
sed -n '1,260p' .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST-gate-review.md
sed -n '1,260p' .omo/evidence/any-agent-system-builder/task-4-code-review.md
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder
npm run validate:examples
node --check agentic-system-builder/scripts/validate-domain-spec.mjs
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-placeholder-regression
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-tokenstuff-pass
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo
nl -ba .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-tokenstuff-pass/backend/tools.py | sed -n '1,180p'
nl -ba .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-tokenstuff-pass/backend/main.py | sed -n '1,220p'
nl -ba .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-tokenstuff-pass/frontend/src/App.jsx | sed -n '1,220p'
find .omo/evidence/any-agent-system-builder/verify-task-4-20260701T195133KST/fixtures -maxdepth 3 -type f | sort
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-20260701T195133KST/fixtures/generated-leak
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-20260701T195133KST/fixtures/generated-placeholder-pass
```

No servers were started. No temporary probe files or product files were created. Cleanup was not needed.

## Blockers

- `agentic-system-builder/scripts/validate-domain-spec.mjs` must enforce endpoint-method pairs in `--check-generated`, especially `POST /chat`, before Todo 4 should be approved.

