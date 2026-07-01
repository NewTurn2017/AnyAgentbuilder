# Todo 4 Code Quality Review

Result: FAIL

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: `/Users/genie/dev/tools/skills/AnyAgentbuilder/.omo/evidence/any-agent-system-builder/task-4-code-review.md`

## Review Scope

- Workdir: `/Users/genie/dev/tools/skills/AnyAgentbuilder`
- Reviewed file: `agentic-system-builder/scripts/validate-domain-spec.mjs`
- Reviewed Todo 4 evidence:
  - `.omo/evidence/any-agent-system-builder/task-4-validator.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-adversarial-probes.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-negative.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-generated-negative.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-negative-statuses.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-malformed-*.txt`
  - `.omo/evidence/any-agent-system-builder/task-4-cleanup.txt`
  - `.omo/plans/any-agent-system-builder.md`
- Diff status: unavailable from this workdir. `git status --short --branch` failed with `fatal: not a git repository`, so this review is based on the current file snapshot and evidence artifacts.

## Skill-Perspective Check

The required skill-perspective check ran:

- `omo:remove-ai-slops` was loaded from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- `omo:programming` was loaded from `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`.

Violations found:

- remove-ai-slops / overfit-slop: violated. The generated-app validator can falsely pass a placeholder app through token presence and file existence checks.
- programming perspective: violated. The validator is deterministic and dependency-free, but the generated-app contract check is not honest enough for the claimed behavior, and the script is 460 pure LOC without an explicit size exception.

## Verification Run

Commands run:

- `node --check agentic-system-builder/scripts/validate-domain-spec.mjs` -> PASS
- `npm run validate:skill` -> PASS
- `npm run validate:examples` -> PASS
- `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/' agentic-system-builder/scripts/validate-domain-spec.mjs | wc -l` -> `460`
- Targeted `/tmp` fake generated-app probe -> FAILING VALIDATOR BEHAVIOR

The targeted fake generated-app probe created only required filenames plus placeholder comments and a null frontend component, then ran:

```text
node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated "$tmp"
```

Observed output:

```text
OK: generated app skeleton valid: /var/folders/.../tmp.1eFKFPPaKt
fake_generated_status=0
```

## Findings

### CRITICAL

None.

### HIGH

1. `--check-generated` falsely accepts placeholder apps with no real backend routes or frontend contract.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:424`

The generated-app validator checks required filenames, then validates endpoint terms with substring search in `backend/main.py`:

- `agentic-system-builder/scripts/validate-domain-spec.mjs:445`
- `agentic-system-builder/scripts/validate-domain-spec.mjs:446`

It also accepts frontend presence by finding any candidate entry file and a `react`/`vite`/`next` dependency:

- `agentic-system-builder/scripts/validate-domain-spec.mjs:440`
- `agentic-system-builder/scripts/validate-domain-spec.mjs:451`

This is not an honest generated-app contract check. A fake app with endpoint strings only in Python comments, required public/internal markers only in comments, and `export default function App(){ return null }` passed with status 0. That directly violates the review requirement: "no superficial generated app contract check that will falsely pass later."

Required fix: make `checkGenerated` validate observable contract structure rather than broad token presence. At minimum, reject endpoint terms that only appear in comments and verify actual route declarations for `/health`, `/state/bootstrap`, `/state`, `/state/stream`, and `/chat`; verify the frontend entry contains the expected chat/UI contract surface such as chat input/send control, agent activity, context summary, domain widget, and guardrail/error rendering markers. Keep this static and dependency-free if desired, but the checks need meaningful failure paths.

### MEDIUM

1. Public/internal context separation in docs is partially global-token based.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:255`

`assertReferenceContextSeparation` lowercases `REFERENCE.md` and `EXAMPLES.md` together, then checks for global marker strings:

- `publiccontext`
- `public_context`
- `internal_context`
- `public json`
- `internal fields`

This can pass even if the methodology lacks a coherent section-level public/internal boundary. The domain block checks are stronger, but this specific docs check still matches the anti-slop smell of global token presence where section-level validation is expected.

Required fix: make this check section-aware, or remove the claim that it validates methodology-level context separation. Prefer checking named headings or a bounded section around `PublicContext` / `internal_context`.

2. Validator size exceeds the programming/remove-ai-slops 250 pure LOC ceiling.

File: `agentic-system-builder/scripts/validate-domain-spec.mjs:1`

Measured pure LOC: `460`. The file combines CLI parsing, skill validation, example validation, generated-app validation, Markdown link parsing, simple frontmatter parsing, and recursive tree reads. The programming skill allows genuinely indivisible standalone checkers only with an explicit size exception comment near the top; this file has no such exception.

Required fix: either split by responsibility, or add an explicit size exception with rationale if this is intentionally kept as one standalone validator. Given the false-pass issue above, a split between skill/example/generated-app validators would likely improve maintainability.

### LOW

1. Todo 4 remains unchecked in the plan.

File: `.omo/plans/any-agent-system-builder.md`

The plan still shows:

```text
- [ ] 4. Harden deterministic validation coverage
```

This is not a code defect by itself, but plan acceptance is not complete. Do not treat Todo 4 as accepted until the blocker above is fixed and the plan/evidence are updated honestly.

2. Todo 4 evidence is useful but incomplete for the generated-app contract.

The evidence includes good negative probes for missing skill dir, missing values, unknown flags, missing mode, nested reference links, per-domain schema gaps, public/internal overlap, and time-sensitive wording. It does not include a generated-app false-positive probe. `.omo/evidence/any-agent-system-builder/task-4-generated-negative.txt` only verifies a missing generated directory, which does not exercise the superficial-pass risk.

## Blockers

- Fix `checkGenerated` so placeholder comments and a null frontend component cannot pass as a valid generated app contract.

## Final Status

FAIL. Request changes before approval.
