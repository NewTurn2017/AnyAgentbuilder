# Todo 4 Adversarial Verification

recommendation: REJECT
verdict: needs-fix
confidence: high

## originalIntent

Verify Todo 4 of the `any-agent-system-builder` plan independently and read-only: the deterministic validator must genuinely validate skill structure, frontmatter, line count, one-level links, required headings, no time-sensitive claims, no nested references, example schema, generated app contract, and public/internal context separation.

## desiredOutcome

The user should be able to trust Todo 4 as complete only if the required pass command exits 0, malformed CLI probes fail clearly, missing skill/generated app probes fail clearly, `node --check` passes, and source inspection plus adversarial probes show the validator is not a superficial token checker.

## userOutcomeReview

The normal pass path and most negative probes work. However, the shipped `--check-generated` contract check is too superficial: a fake generated app with required filenames, route names only in comments/strings, public/internal field markers only in comments, and a `return null` frontend exits 0. That means the validator can report success for an app that does not satisfy the generated app contract. Todo 4 is therefore not confirmed.

## checkedArtifactPaths

- `.omo/plans/any-agent-system-builder.md`
- `.omo/start-work/any-agent-system-builder-notepad.md`
- `.omo/start-work/ledger.jsonl`
- `package.json`
- `agentic-system-builder/SKILL.md`
- `agentic-system-builder/REFERENCE.md`
- `agentic-system-builder/EXAMPLES.md`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `.omo/evidence/any-agent-system-builder/task-4-*.txt`
- `.omo/evidence/any-agent-system-builder/task-4-code-review.md`
- `.omo/evidence/any-agent-system-builder/verify-task-4-20260701T195133KST/*`

## reproCommands

- Required pass: `sh -c 'node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder && npm run validate:examples'` -> exit 0.
- Missing skill dir: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill /tmp/does-not-exist` -> exit 1, `missing skill directory`.
- Missing generated app: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo` -> exit 1, `missing generated app directory`.
- Unknown flag: `node agentic-system-builder/scripts/validate-domain-spec.mjs --nope` -> exit 1, `unknown flag or argument`.
- Missing value: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill` -> exit 1, `--check-skill requires a value`.
- Missing `--require-domain` value: `node agentic-system-builder/scripts/validate-domain-spec.mjs --validate-example agentic-system-builder/EXAMPLES.md --require-domain` -> exit 1.
- Missing mode: `node agentic-system-builder/scripts/validate-domain-spec.mjs` -> exit 1, `choose exactly one mode`.
- Wrong-mode `--require-domain`: `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-skill agentic-system-builder --require-domain library` -> exit 1.
- Syntax: `node --check agentic-system-builder/scripts/validate-domain-spec.mjs` -> exit 0.
- Public/internal overlap fixture: `node ... --validate-example verify-task-4-20260701T195133KST/fixtures/overlap-example.md --require-domain library` -> exit 1, overlap rejected.
- Generated missing endpoints fixture: `node ... --check-generated verify-task-4-20260701T195133KST/fixtures/generated-bad` -> exit 1, endpoint terms rejected when absent.
- Generated frontend internal leak fixture: `node ... --check-generated verify-task-4-20260701T195133KST/fixtures/generated-leak` -> exit 1, `member_id` leak rejected.
- Generated placeholder false-positive fixture: `node ... --check-generated verify-task-4-20260701T195133KST/fixtures/generated-placeholder-pass` -> exit 0 incorrectly.

## evidenceInspected

- `required-pass.txt`: required pass command exits 0 with `OK: skill structure valid` and `OK: example domains valid`.
- `statuses.txt`: records all pass/negative statuses, including the blocking `generated-placeholder-false-positive=0`.
- `source-excerpts.txt` and source lines `424-490`: `checkGenerated` checks filenames, substring endpoint terms, package dependency names, README terms, backend field markers, and frontend internal-field absence.
- `generated-placeholder-false-positive.txt`: fake app accepted with `OK: generated app skeleton valid`.
- `task-4-code-review.md`: independent code review also rejects Todo 4, citing the same placeholder generated-app false positive, global-token context separation weakness, and 460 pure LOC size issue.

## blockers

1. `checkGenerated` falsely accepts placeholder apps. Source lines `445-448` use substring checks for endpoint terms and lines `475-488` use broad tree text scans for context markers/leaks. This can be satisfied by comments and inert strings.
2. The generated frontend contract is not meaningfully validated. Any candidate entry file plus React/Vite/Next dependency can pass even if the app renders `null`.
3. The required code review report is present now and explicitly marks Todo 4 as `FAIL` / `REQUEST_CHANGES`.

## exactEvidenceGaps

- There is no passing evidence that rejects a placeholder generated app where route names and context fields exist only as comments/strings.
- Todo 4 remains unchecked in `.omo/plans/any-agent-system-builder.md`; I did not edit plan checkboxes per scope.
- The workspace is not a Git repository, so no diff-based dirty-worktree or changed-file review was possible. `context.txt` records `fatal: not a git repository`.

## adversarialClasses

- malformed_input: confirmed for unknown flag, missing values, missing mode, wrong-mode `--require-domain`, and public/internal overlap.
- stale_state: checked current files and evidence after the concurrent `task-4-code-review.md` appeared; current plan still shows Todo 4 unchecked.
- misleading_success_output: needs-fix. `OK: generated app skeleton valid` can be produced by a nonfunctional placeholder app.
- dirty_worktree: not applicable as Git metadata is absent at this workspace root; evidence-only files were written under the allowed verifier path.
- hung_commands: confirmed low risk. Only short Node/static validation commands were run; all exited. No servers were started.
- prompt_injection: not applicable; this Todo validates static local files and evidence fixtures only.
- cancel_resume: not applicable; no resumable runtime flow was exercised.
- flaky_tests: not applicable; deterministic CLI validators only.
- repeated_interruptions: not applicable; no interrupted long-running operation occurred.

## requiredFixes

1. Strengthen `checkGenerated` so it rejects endpoint terms that appear only in comments/strings. Prefer static checks for actual route declarations for `/health`, `/state/bootstrap`, `/state`, `/state/stream`, and `/chat`.
2. Validate frontend contract markers beyond file existence and dependencies: chat input/send control, agent activity panel, context summary, domain widget, and guardrail/error state.
3. Keep the generated-app privacy checks, but make them structure-aware enough that backend comment markers do not count as real public/internal contract coverage.
4. Address the code review’s size/maintainability blocker: split the validator by responsibility or add an explicit, justified size exception if the standalone-file choice is intentional.
5. Rerun this verifier’s false-positive fixture after fixes; it must exit nonzero before Todo 4 can be confirmed.
