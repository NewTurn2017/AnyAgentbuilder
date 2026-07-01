# Todo 4 Final Gate Review

recommendation: REJECT
verdict: needs-fix
confidence: high

## originalIntent

Re-verify Todo 4 after the known placeholder false-pass fix. The validator must pass the normal skill/example command, fail malformed and missing-path inputs clearly, reject a placeholder generated app, pass Node syntax checking, avoid server starts, and have no remaining code-review blocker.

## desiredOutcome

The user should be able to mark Todo 4 complete only if the current artifacts prove deterministic validation works and does not create misleading success for invalid generated apps.

## userOutcomeReview

The specific previous placeholder false-pass is fixed: the copied old false-positive fixture now exits 1 with `ERROR: generated backend main.py has only placeholder content`. The required pass command and basic negatives also behave correctly.

Todo 4 is still not confirmable from the user's perspective because a stronger token-stuffed inert generated-app fixture exits 0 with `OK: generated app skeleton valid`. That fixture has route decorators, test ids, and marker strings, but it does not prove a working generated app contract. This keeps the `misleading_success_output` class unresolved. The validator is also 615 pure LOC with no `SIZE_OK` rationale, which remains unresolved programming/remove-ai-slops maintenance slop.

## checkedArtifactPaths

- `package.json`
- `agentic-system-builder/SKILL.md`
- `agentic-system-builder/REFERENCE.md`
- `agentic-system-builder/EXAMPLES.md`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `.omo/plans/any-agent-system-builder.md`
- `.omo/evidence/any-agent-system-builder/task-4-code-review.md`
- `.omo/evidence/any-agent-system-builder/task-4-code-review-final.md`
- `.omo/evidence/any-agent-system-builder/task-4-generated-placeholder-negative.txt`
- `.omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/*`

## evidenceInspected

- `required-pass.txt`: required command exited 0 and printed `OK: skill structure valid` plus `OK: example domains valid`.
- `node-check.txt`: `node --check agentic-system-builder/scripts/validate-domain-spec.mjs` exited 0.
- `missing-skill-dir.txt`: missing skill directory exited 1 with clear `missing skill directory`.
- `missing-generated-app.txt`: missing generated app exited 1 with clear `missing generated app directory`.
- `placeholder-regression.txt`: copied prior false-positive fixture exited 1 with clear placeholder rejection.
- `tokenstuff-inert-generated.txt`: inert token-shaped generated app exited 0, which is the remaining blocker.
- `no-servers-started.txt`: listener diff was empty; no server listener changes observed.
- `context.txt`: workdir is not a Git repo; validator measured 615 pure LOC.
- `task-4-code-review-final.md`: code review approves the placeholder fix but records 615 pure LOC as a watch item; direct gate review treats this and the token-stuffed false success as unresolved slop.

## reproCommands

- Required pass: `sh -c 'node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder && npm run validate:examples'` -> exit 0.
- Syntax: `node --check agentic-system-builder/scripts/validate-domain-spec.mjs` -> exit 0.
- Missing skill dir: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/no-such-skill` -> exit 1.
- Missing generated app: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/no-such-generated` -> exit 1.
- Placeholder regression: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-placeholder-regression` -> exit 1.
- Misleading success probe: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated .omo/evidence/any-agent-system-builder/verify-task-4-final-20260701T200114KST/fixtures/generated-tokenstuff-pass` -> exit 0, blocker.

## blockers

1. `--check-generated` can still accept a nonfunctional token-stuffed generated app. This is a misleading-success and overfit-static-check failure, even though the old comment-only placeholder is now rejected.
2. `agentic-system-builder/scripts/validate-domain-spec.mjs` is 615 pure LOC without a size exception or split. Under the loaded `omo:programming` and `omo:remove-ai-slops` criteria, this is unresolved maintenance slop.
3. Git/diff review is unavailable because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. Current review is source/evidence based only.

## exactEvidenceGaps

- No artifact proves that `--check-generated` rejects inert but token-shaped backend/frontend files that satisfy regex/string marker checks.
- No updated refactor or `SIZE_OK` rationale addresses the 615 pure LOC validator.
- No Git diff is available from the requested workdir, so changed-file provenance and dirty-worktree comparison could not be verified.

## adversarialClasses

- malformed_input: pass for unknown flag and missing value probes.
- stale_state: checked current source hashes/timestamps and the newer `task-4-code-review-final.md`.
- misleading_success_output: needs-fix; token-stuffed inert generated app exits 0.
- dirty_worktree: limited; Git metadata absent, evidence writes were confined to `verify-task-4-final-*`.
- hung_commands: pass; probes used a 60s alarm wrapper and all completed.

## fixes

1. Strengthen `--check-generated` beyond marker presence. Either run a lightweight generated-app smoke contract, or parse/inspect enough structure to reject inert route/UI shells that only satisfy regexes.
2. Add a focused negative fixture like `generated-tokenstuff-pass` to the evidence suite and require it to fail.
3. Split `validate-domain-spec.mjs` by responsibility or add a justified `SIZE_OK` rationale before more expansion.
