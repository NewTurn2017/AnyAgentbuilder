# Todo 9 Code Review

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: .omo/evidence/any-agent-system-builder/task-9-code-review.md
blockers: []

## Review Scope

Reviewed Todo 9 final polish for `/Users/genie/dev/tools/skills/AnyAgentbuilder` in read-only mode. I inspected the plan, skill docs, scripts, generated library demo README/backend/frontend files, task-9 and verify-task-9 evidence, manifest/cleanup receipts, and screenshots.

This directory is not a Git repository, so I could not verify a Git diff or changed-file set with `git diff`. I reviewed the live files and evidence artifacts instead.

## Skill-Perspective Check

Ran the required perspective check by loading:

- `omo:remove-ai-slops` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`
- `omo:programming` from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`

Result: no deletion-only tests, tautological tests, prompt-string brittle tests, placeholder-only production code, or provider-scope drift found in the final generated app proof. The diff does carry maintainability debt under the programming perspective: an oversized validator and broad `Any` usage in the generated Python starter.

## Findings By Severity

### CRITICAL

None.

### HIGH

None.

### MEDIUM

1. Evidence hygiene is split between stale `task-9-*` receipts and current `verify-task-9-*` receipts.
   The older `.omo/evidence/any-agent-system-builder/task-9-final.txt` and `task-9-cleanup-*` files are not current relative to the regenerated app/current manifest. For example, `task-9-cleanup-pids.txt:2` and `task-9-cleanup-pids.txt:4` cite PIDs `19915` and `20563`, while `run-manifest.json:6` through `run-manifest.json:9` records current ports/PIDs `50305`, `50306`, `26477`, and `27132`. This would be misleading if only the `task-9-*` set were used. The current proof is acceptable only because `.omo/evidence/any-agent-system-builder/verify-task-9-final-command.txt:1` through `:34` records the exact final command, exit 0, current manifest, browser QA, and cleanup, and `verify-task-9-cleanup.txt:1` through `:13` proves current PIDs/ports are gone.

2. `agentic-system-builder/scripts/validate-domain-spec.mjs` is substantially oversized.
   The file has a `SIZE_OK` waiver at `agentic-system-builder/scripts/validate-domain-spec.mjs:5`, but the measured pure LOC is 993. It mixes skill frontmatter/link validation, example block parsing, generated backend checks, generated frontend checks, package dependency checks, and Python/JSX static parsing. The waiver is understandable for a portable copied skill bundle, so I am not blocking Todo 9, but the programming/remove-ai-slops perspective would prefer splitting this into focused validator modules before the next non-trivial change.

3. The generated Python starter uses `Any` across public mock surfaces.
   Examples include `generated/library-reservation-demo/backend/main.py:36`, `:46`, `:51`, `:79`, `:94`, and `:108`, plus template equivalents under `agentic-system-builder/templates/backend/`. For the mock starter this does not break the verified behavior, but the programming perspective would prefer typed response models or `TypedDict`/dataclasses for public state, events, resources, and context before this is presented as a stricter reference backend.

### LOW

1. File-structure evidence is depth-limited and one verification artifact explicitly flags deeper files.
   `.omo/evidence/any-agent-system-builder/verify-task-9-file-structure.txt:26` through `:53` reports `nested_file_verdict=FAIL` for `scripts/qa-lib/**` and nested templates. I do not treat this as a blocker because `SKILL.md` links only `REFERENCE.md` and `EXAMPLES.md`, and the reference files do not create nested reference chains. The practical risk is handoff confusion: `task-9-file-list.txt` is not a complete install/copy list for the skill bundle.

2. Todo 9 remains unchecked in `.omo/plans/any-agent-system-builder.md`.
   The current evidence supports completion, but the plan checkbox itself was not updated. This is process drift, not a runtime or code-quality blocker.

## Evidence Reviewed

- Exact current final command: `.omo/evidence/any-agent-system-builder/verify-task-9-final-command.txt:1` through `:34`
- Current cleanup proof: `.omo/evidence/any-agent-system-builder/verify-task-9-cleanup.txt:1` through `:13`
- Placeholder scan proof: `.omo/evidence/any-agent-system-builder/verify-task-9-placeholders.txt:5` through `:7`
- Generated app/screenshot/privacy proof: `.omo/evidence/any-agent-system-builder/verify-task-9-regression.txt:1` through `:23`
- Current manifest: `.omo/evidence/any-agent-system-builder/run-manifest.json`
- Browser screenshots manually inspected:
  - `.omo/evidence/any-agent-system-builder/browser-library-demo.png`
  - `.omo/evidence/any-agent-system-builder/browser-guardrail-demo.png`

## Commands Run

- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder` -> PASS
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --validate-example agentic-system-builder/EXAMPLES.md --require-domain airline --require-domain library --require-domain pcbang --require-domain generic` -> PASS
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo` -> PASS
- `rg -n "TODO|FIXME|<fill|placeholder|lorem" agentic-system-builder generated/library-reservation-demo` -> no matches
- Manifest cleanup probe against current `run-manifest.json` -> backend/frontend PIDs not alive; backend/frontend ports have no listeners
- `rg -n "member_id|internal_notes|policy_overrides|raw_hold_queue|staff_token|inventory_cost" generated/library-reservation-demo/frontend generated/library-reservation-demo/README.md` -> no matches

I did not rerun `npm run qa:generated-demo` because it writes evidence/regenerates the app and this review was constrained to write only this report.

## Cleanup

Current manifest cleanup is clean:

- backend PID `26477`: gone
- frontend PID `27132`: gone
- backend port `50305`: no listener
- frontend port `50306`: no listener

## Final Judgment

APPROVE with WATCH. The current `verify-task-9-*` evidence proves the exact final command, mock-only boundary, browser QA, privacy checks, placeholder scan, audit, and cleanup. No CRITICAL or HIGH findings remain. The main residual risks are evidence naming/staleness, the oversized validator, and weak typing in the generated Python starter.
