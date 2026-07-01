# Todo 8 Code Quality Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/any-agent-system-builder/task-8-code-review.md

## Blockers

- HIGH: Generated frontend pins a vulnerable direct `vite` dependency. `npm audit --omit dev --json` in `generated/library-reservation-demo/frontend` exits 1 and reports direct `vite@5.4.11` high severity plus transitive `esbuild` moderate, with a non-major fixed version available (`vite@5.4.21`). This violates the Todo 8 review focus for no avoidable audit/security issue. Template source: `agentic-system-builder/templates/frontend/package.json.tmpl:11` and `agentic-system-builder/templates/frontend/package.json.tmpl:13`; generated output: `generated/library-reservation-demo/frontend/package.json:11` and `generated/library-reservation-demo/frontend/package.json:13`; lockfile: `generated/library-reservation-demo/frontend/package-lock.json:14` and `generated/library-reservation-demo/frontend/package-lock.json:1536`.
- HIGH: Browser QA can falsely pass the public API privacy/backend-connection check if no `/chat` responses are captured. `chatApiBodies` is populated by an async passive response listener, but the test never asserts that the expected two `/chat` responses were captured before running `assertNoInternalMarkers(chatApiBodies.join("\n"), ...)` and writing `chat_api_responses`. An empty list passes the privacy assertion and would not catch a future fake-UI-only regression or proxy failure. See `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:31`, `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:54`, `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:63`, and `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:70`.

## Findings By Severity

### CRITICAL

- None found.

### HIGH

- Vulnerable generated frontend dependency: same as blocker 1.
- Browser QA false-confidence gap: same as blocker 2.

### MEDIUM

- None found.

### LOW

- `browser-qa.mjs` has empty catch blocks around dynamic import and response parsing (`agentic-system-builder/scripts/qa-lib/browser-qa.mjs:14`, `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:19`, `agentic-system-builder/scripts/qa-lib/browser-qa.mjs:36`). These are not the main blockers, but the remove-ai-slops perspective prefers preserving the relevant error detail or narrowing/rethrowing so harness failures are easier to diagnose.

## Positive Checks

- First screen is a chat UI, not a landing/hero. Required Korean labels, chat, activity timeline, public context, room widget, book widget, and guardrail banner are present in `generated/library-reservation-demo/frontend/src/App.jsx`.
- Required test IDs exist in both template and generated source: `chat-input`, `send-message`, `chat-messages`, `guardrail-banner`, `agent-activity`, `public-context`, `domain-widget`.
- Generated UI uses real backend endpoints: `fetch("/state/bootstrap")` and `fetch("/chat")` in `generated/library-reservation-demo/frontend/src/App.jsx:30` and `generated/library-reservation-demo/frontend/src/App.jsx:53`; `VITE_API_BASE` is wired through the Vite dev proxy in `generated/library-reservation-demo/frontend/vite.config.js:4`.
- Hidden markers are absent from generated frontend source, built assets, and template frontend source by direct `rg` scan.
- Screenshots are credible and nonblank. `browser-library-demo.png` is 1280x1238 and shows the happy chat, agent status, public context, room cards, and loan books. `browser-guardrail-demo.png` is 1280x1299 and shows the guardrail banner/refusal.
- Cleanup evidence is currently consistent: `run-manifest.json` records backend/frontend ports `58637/58638`; `task-8-cleanup-pids.txt` shows PIDs `87047/87315` dead; `task-8-cleanup-ports.txt` shows no listeners. I also probed those PIDs/ports directly and found no live process/listener.

## Skill Perspective Check

- Ran required skill-perspective check: loaded `omo:remove-ai-slops` and `omo:programming`, plus the TypeScript/code-smell references from `omo:programming`.
- remove-ai-slops perspective: violated by the browser QA false-confidence gap because the test can pass without proving API privacy/backend use. Empty catch blocks are also minor slop.
- programming perspective: violated by the avoidable direct high-severity vulnerable `vite` dependency in the generated frontend package. No oversized touched file was found; all inspected source files are under 250 pure LOC.

## Commands And Evidence

- `git status --short --branch`: failed because `/Users/genie/dev/tools/skills/AnyAgentbuilder` is not a Git repository, so review scope is path/evidence based rather than diff based.
- `cat .omo/plans/any-agent-system-builder.md` Todo 8 section: reviewed acceptance criteria and QA expectations.
- `cat .omo/evidence/any-agent-system-builder/task-8-*.txt`: reviewed browser, install, build, privacy, source scan, artifact, and cleanup receipts.
- `file .omo/evidence/any-agent-system-builder/browser-library-demo.png .omo/evidence/any-agent-system-builder/browser-guardrail-demo.png`: confirmed nonzero PNG dimensions.
- Local image inspection: screenshots are rendered UI, not blank.
- `node --check` on touched harness files: passed for `browser-qa.mjs`, `commands.mjs`, `lifecycle.mjs`, `processes.mjs`, and `qa-generated-demo.mjs`.
- `npm audit --omit dev --json` in generated frontend: failed with the direct `vite` high and transitive `esbuild` moderate findings.
- `rg` scans: confirmed hidden markers absent from frontend template/source/dist and confirmed required test IDs in template/generated source.
- `ps`/`lsof` probes for manifest PIDs/ports: no live backend/frontend process or listener.

## Cleanup

I did not start servers and did not modify source files. The only file written by this review is `.omo/evidence/any-agent-system-builder/task-8-code-review.md`.
