# Todo 5 Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-5-code-review.md

## Blockers

1. `agentic-system-builder/scripts/scaffold-agent-system.mjs` is an oversized 997-pure-LOC source file that combines built-in domain data, CLI parsing, output orchestration, Python backend templates, React templates, and CSS templates in one module. This violates the loaded `remove-ai-slops` oversized-module pass and the `programming` 250 pure LOC ceiling, and it creates review/maintenance risk for every future scaffold change. Split by responsibility, for example domain specs, CLI/spec loading, template rendering/static templates, and file emission.
   - Refs: `agentic-system-builder/scripts/scaffold-agent-system.mjs:9`, `agentic-system-builder/scripts/scaffold-agent-system.mjs:280`, `agentic-system-builder/scripts/scaffold-agent-system.mjs:311`, `agentic-system-builder/scripts/scaffold-agent-system.mjs:585`, `agentic-system-builder/scripts/scaffold-agent-system.mjs:764`, `agentic-system-builder/scripts/scaffold-agent-system.mjs:932`
   - Evidence: `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(#|\/\/)/' agentic-system-builder/scripts/scaffold-agent-system.mjs | wc -l` returned `997`.

2. The generated frontend dependencies are not pinned. Todo 5 inherits the plan runtime constraint that generated frontend dependencies are pinned in `package.json`; the scaffold emits `"latest"` for React/Vite packages, so a fresh generated demo can change behavior over time and break the QA surface.
   - Refs: `agentic-system-builder/scripts/scaffold-agent-system.mjs:704`, `generated/library-reservation-demo/frontend/package.json:11`
   - Evidence: `rg -n '"latest"|\*|\^|~' generated/library-reservation-demo/frontend/package.json package.json agentic-system-builder/scripts/scaffold-agent-system.mjs` found `latest` at generated package lines 12-15 and scaffold template lines 705-708.

## CRITICAL

None.

## HIGH

- Oversized scaffold script, as listed in Blocker 1.
- Unpinned generated frontend dependencies, as listed in Blocker 2.

## MEDIUM

- Custom JSON specs can have string data silently corrupted when generating Python files. The helper converts JSON to Python literals by stringifying the whole object and globally replacing `true`, `false`, and `null`; that also rewrites those words inside quoted string values.
  - Refs: `agentic-system-builder/scripts/scaffold-agent-system.mjs:300`
  - Evidence: a temp JSON-spec probe with policy text `true false null must stay lowercase` generated Python containing rewritten `True False None`; temp output was removed in the same command.

## LOW

- `--domain library --spec <path>` is accepted even though the CLI error says callers must choose either a built-in domain or a JSON spec. The mutual-exclusion check only rejects explicit `--domain` when the value is not `library`, so the default domain value leaks into argument validation.
  - Ref: `agentic-system-builder/scripts/scaffold-agent-system.mjs:185`

- No Git diff was available for independent changed-file comparison because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository. I reviewed the requested working files and evidence artifacts directly.

## Positive Checks

- Scaffold flags exist for `--domain`, `--out`, `--force`, `--keep-failed`, and JSON specs through `--spec`.
- Built-in `airline`, `library`, `pcbang`, and `generic` variants are present and non-library smoke probes for `airline` and `generic` generated expected brand/agent/widget strings.
- A custom JSON spec path generated an app with expected backend/frontend files in the normal case.
- Generated library backend route declarations match the validator contract: `GET /health`, `GET /state/bootstrap`, `GET /state`, `GET /state/stream`, and `POST /chat`.
- Generated library public context fields are exactly `patron_display_name`, `reservation_id`, `resource_label`, `time_window`, `reservation_status`, `loan_titles`, `policy_summary` in `generated/library-reservation-demo/backend/context.py:4`.
- Direct generated backend probe confirmed `initial_state()` and `run_mock_agent_turn()` do not serialize the internal field markers into public state/result data.
- Frontend first screen is a chat UI with Korean labels and expected test IDs (`chat-input`, `send-message`, `agent-activity`, `public-context`, `domain-widget`, `guardrail-banner`), not a marketing landing page.
- No `openai` import/call was found in generated mock backend/frontend; OpenAI only appears in README/template extension text.
- Evidence files include real generated file paths and cleanup receipts, not stdout-only claims.

## Skill-Perspective Check

- Ran the required `remove-ai-slops` consultation by reading `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`.
- Ran the required `programming` consultation by reading `/Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`, plus relevant Python, TypeScript, and code-smell references.
- `remove-ai-slops` perspective: violation present. The scaffold script is an oversized module with inline multi-language templates; this is needless production complexity and a maintenance burden.
- `programming` perspective: violation present. The 997-pure-LOC scaffold script breaches the 250 LOC ceiling; generated Python also uses loose `dict[str, Any]` patterns, but that is secondary to the scaffold blocker for this Todo 5 review.
- Test relevance pass: no deletion-only, tautological, prompt-string, or implementation-mirroring tests were added in Todo 5. The evidence is mostly deterministic scaffold/static checks, which is appropriate for this todo, but it does not offset the maintainability blockers above.

## Evidence Inspected

- `.omo/plans/any-agent-system-builder.md`
- `.omo/evidence/any-agent-system-builder/task-5-summary.txt`
- `.omo/evidence/any-agent-system-builder/task-5-scaffold.txt`
- `.omo/evidence/any-agent-system-builder/task-5-negative.txt`
- `.omo/evidence/any-agent-system-builder/task-5-cleanup.txt`
- `.omo/evidence/any-agent-system-builder/task-5-domain-smoke.txt`
- `.omo/evidence/any-agent-system-builder/task-5-generated-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-frontend-internal-scan.txt`
- `.omo/evidence/any-agent-system-builder/task-5-node-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-py-compile.txt`
- `.omo/evidence/any-agent-system-builder/task-5-skill-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-examples-check.txt`
- `.omo/evidence/any-agent-system-builder/task-5-bad-json.txt`
- `.omo/evidence/any-agent-system-builder/task-5-missing-spec.txt`
- `.omo/evidence/any-agent-system-builder/task-5-transient-cleanup.txt`
- `agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `agentic-system-builder/scripts/validate-domain-spec.mjs`
- `generated/library-reservation-demo/**`
- `package.json`

## Commands Run

- `sed -n '1,240p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`
- `sed -n '241,520p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/remove-ai-slops/SKILL.md`
- `sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`
- `sed -n '261,560p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/SKILL.md`
- `sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/python/README.md`
- `sed -n '261,340p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/python/README.md`
- `sed -n '1,220p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/typescript/README.md`
- `sed -n '1,260p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/code-smells.md`
- `sed -n '261,620p' /Users/genie/.codex/plugins/cache/sisyphuslabs/omo/4.15.0/skills/programming/references/code-smells.md`
- `rg --files -g 'AGENTS.md' -g '!node_modules'`
- `git status --short` (failed: not a Git repository)
- `find generated/library-reservation-demo -maxdepth 4 -type f | sort`
- `node --check agentic-system-builder/scripts/scaffold-agent-system.mjs`
- `node agentic-system-builder/scripts/validate-domain-spec.mjs --check-generated generated/library-reservation-demo`
- `python3` AST parse probe for generated backend Python files
- Temporary Node scaffold probe for `airline`, `generic`, and a normal custom JSON spec
- Temporary Node edge probe for JSON string-literal preservation
- `PYTHONDONTWRITEBYTECODE=1 python3` direct generated backend public-context/guardrail probe
- Pure LOC measurement for scaffold and generated files
- `rg` scans for OpenAI calls/imports, internal field markers, placeholders, and unpinned dependency ranges

## Cleanup

- No servers were started.
- Temporary scaffold probe directory `/var/folders/6w/ryvjgm214g361w38k2x2dcch0000gn/T/aab-task5-review-6lhQiw` was removed; command output confirmed `exists=false`.
- Temporary JSON edge probe directory `/var/folders/6w/ryvjgm214g361w38k2x2dcch0000gn/T/aab-task5-json-edge-Rxnlpz` was removed; command output confirmed `exists=false`.
- `PYTHONDONTWRITEBYTECODE=1` direct Python probe left no `generated/library-reservation-demo/backend/__pycache__`.

## Final Status

REQUEST_CHANGES. The generated library demo is structurally credible and the evidence is real, but Todo 5 should not be approved until the scaffold is split below the documented size ceiling and generated frontend dependencies are pinned.
