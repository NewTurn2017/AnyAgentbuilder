#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

// SIZE_OK: single-file, built-in-only validator kept portable for copied skill bundles;
// structural helpers stay here so copied skills can run negative fixture/probe checks
// without package installation, transpilation, or repo-local test harness coupling.

const SCHEMA_TERMS = [
  "domain_key",
  "actors",
  "resources",
  "reservation_states",
  "availability_rules",
  "policies",
  "actions",
  "tools",
  "agents",
  "handoffs",
  "guardrails",
  "public_context",
  "internal_context",
  "widgets",
  "happy_path_qa",
  "failure_path_qa",
];

const GENERATED_REQUIRED = [
  "README.md",
  "backend/main.py",
  "backend/agents.py",
  "backend/tools.py",
  "backend/context.py",
  "backend/demo_data.py",
  "backend/models.py",
  "backend/memory.py",
  "backend/events.py",
  "backend/requirements.txt",
  "frontend/package.json",
];

const GENERATED_FRONTEND_ENTRY_CANDIDATES = [
  "frontend/src/App.jsx",
  "frontend/src/App.tsx",
  "frontend/src/main.jsx",
  "frontend/src/main.tsx",
  "frontend/app/page.jsx",
  "frontend/app/page.tsx",
  "frontend/pages/index.jsx",
  "frontend/pages/index.tsx",
];

const ENDPOINT_CONTRACTS = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/state/bootstrap" },
  { method: "GET", path: "/state" },
  { method: "GET", path: "/state/stream" },
  { method: "POST", path: "/chat" },
];

const BACKEND_MODULE_CONTRACTS = [
  {
    rel: "backend/models.py",
    label: "typed public models",
    groups: [
      ["class PublicContextModel", "class StateResponse", "class ChatResponse"],
      ["BaseModel", "JsonValue", "GuardrailModel", "EventModel"],
    ],
  },
  {
    rel: "backend/context.py",
    label: "context/public context",
    groups: [
      ["public_context", "PublicContext", "build_public_context"],
      ["internal_context", "InternalContext", "build_internal_context"],
    ],
  },
  {
    rel: "backend/tools.py",
    label: "tools",
    groups: [["def ", "class "], ["tool", "availability", "reservation"]],
  },
  {
    rel: "backend/agents.py",
    label: "agents",
    groups: [["def ", "class "], ["agent", "handoff", "guardrail"]],
  },
  {
    rel: "backend/memory.py",
    label: "memory/events",
    groups: [["def ", "class "], ["memory", "event", "conversation"]],
  },
  {
    rel: "backend/events.py",
    label: "events",
    groups: [["def ", "class "], ["event", "stream", "state"]],
  },
  {
    rel: "backend/demo_data.py",
    label: "demo data",
    groups: [["DOMAIN_KEY", "DEMO_PUBLIC_SEED", "DEMO_INTERNAL_SEED", "initial_state"], ["public_context", "internal_context", "resources"]],
  },
];

const FRONTEND_CONTRACT_GROUPS = [
  {
    label: "chat input test id",
    alternatives: ["data-testid=\"chat-input\"", "data-testid='chat-input'"],
  },
  {
    label: "send control test id",
    alternatives: ["data-testid=\"send-message\"", "data-testid='send-message'", "data-testid=\"chat-send\"", "data-testid='chat-send'"],
  },
  {
    label: "agent activity test id",
    alternatives: ["data-testid=\"agent-activity\"", "data-testid='agent-activity'"],
  },
  {
    label: "domain widget test id",
    alternatives: ["data-testid=\"domain-widget\"", "data-testid='domain-widget'"],
  },
  {
    label: "guardrail banner test id",
    alternatives: ["data-testid=\"guardrail-banner\"", "data-testid='guardrail-banner'"],
  },
  {
    label: "public context rendering test id",
    alternatives: ["data-testid=\"public-context\"", "data-testid='public-context'", "data-testid=\"public-context-panel\"", "data-testid='public-context-panel'"],
  },
  {
    label: "chat API call",
    alternatives: ["/chat"],
  },
  {
    label: "bootstrap/state API call",
    alternatives: ["/state/bootstrap", "/state"],
  },
  {
    label: "state handling",
    alternatives: ["useState", "setState", "useReducer", "createSignal"],
  },
];

const REQUIRED_DOMAINS = ["airline", "library", "pcbang", "generic"];

const LIBRARY_PUBLIC_FIELDS = [
  "patron_display_name",
  "reservation_id",
  "resource_label",
  "time_window",
  "reservation_status",
  "loan_titles",
  "policy_summary",
];

const LIBRARY_INTERNAL_FIELDS = [
  "member_id",
  "internal_notes",
  "policy_overrides",
  "raw_hold_queue",
  "staff_token",
  "inventory_cost",
];

const STALE_GENERATED_MARKERS = [
  ["LIBRARY", "RESERVATION", "PATRON", "MARKER"].join("_"),
  ["library", "reservation", "patron"].join(" "),
];

const SKILL_HEADING_GROUPS = [
  {
    label: "Quick start",
    alternatives: [/quick\s+start/i, /quick\s+workflow/i],
  },
  {
    label: "Workflows",
    alternatives: [/workflows?/i, /conversation\s+pattern/i, /output\s+shape/i],
  },
  {
    label: "Advanced features",
    alternatives: [/advanced\s+features?/i, /progressive\s+disclosure/i, /guardrails?/i],
  },
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function parseArgs(argv) {
  const parsed = {
    checkSkill: null,
    validateExample: null,
    requireDomains: [],
    checkGenerated: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check-skill") {
      parsed.checkSkill = readValue(argv, ++index, arg);
    } else if (arg === "--validate-example") {
      parsed.validateExample = readValue(argv, ++index, arg);
    } else if (arg === "--require-domain") {
      parsed.requireDomains.push(readValue(argv, ++index, arg));
    } else if (arg === "--check-generated") {
      parsed.checkGenerated = readValue(argv, ++index, arg);
    } else {
      fail(`unknown flag or argument: ${arg}`);
    }
  }

  const modes = [parsed.checkSkill, parsed.validateExample, parsed.checkGenerated].filter(Boolean);
  if (modes.length !== 1) {
    fail("choose exactly one mode: --check-skill <dir>, --validate-example <file>, or --check-generated <dir>");
  }
  if (parsed.requireDomains.length > 0 && !parsed.validateExample) {
    fail("--require-domain can only be used with --validate-example <file>");
  }
  if (parsed.validateExample && parsed.requireDomains.length === 0) {
    fail("--validate-example requires at least one --require-domain <domain>");
  }

  return parsed;
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    fail(`${flag} requires a value`);
  }
  return value;
}

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    fail(`missing ${label}: ${path}`);
  }
  if (!statSync(path).isFile()) {
    fail(`${label} is not a file: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function stripPythonComments(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*#.*$/, ""))
    .join("\n");
}

function stripPythonNonCode(text) {
  return stripPythonComments(text).replace(/(?:[rRuUbBfF]*)("""|''')[\s\S]*?\1/g, "");
}

function stripJsxComments(text) {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function meaningfulLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^#/.test(line) && !/^\/\//.test(line));
}

function assertSubstantiveContent(text, label) {
  const lines = meaningfulLines(text);
  const substantive = lines.filter((line) => !/\b(stub|replace me|coming soon|return null)\b/i.test(line));
  if (substantive.length === 0 || substantive.join("\n").length < 12) {
    fail(`${label} has only draft-only content`);
  }
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertContainsAny(text, alternatives, label) {
  if (!alternatives.some((term) => text.includes(term))) {
    fail(`${label} missing required content: ${alternatives.join(" or ")}`);
  }
}

function assertContainsAllGroups(text, groups, label) {
  for (const group of groups) {
    assertContainsAny(text, group, label);
  }
}

function assertNoStaleGeneratedMarkers(text, label) {
  const found = STALE_GENERATED_MARKERS.filter((marker) => text.includes(marker));
  if (found.length > 0) {
    fail(`${label} contains stale generated marker residue: ${found.join(", ")}`);
  }
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function routeCallSnippet(lines, startIndex) {
  const snippet = [];
  let balance = 0;
  for (const line of lines.slice(startIndex, startIndex + 8)) {
    snippet.push(line);
    balance += countMatches(line, /\(/g);
    balance -= countMatches(line, /\)/g);
    if (balance <= 0 && line.includes(")")) {
      break;
    }
  }
  return snippet.join("\n");
}

function routeSnippetHasMethod(snippet, method) {
  return new RegExp(`\\bmethods\\s*=\\s*[\\[\\(\\{][\\s\\S]*?["']${method}["']`, "i").test(snippet);
}

function assertFastApiRoutes(text, endpoints, label) {
  const lines = text.split(/\r?\n/);
  const missing = [];
  for (const endpoint of endpoints) {
    const method = endpoint.method.toLowerCase();
    const methodLabel = endpoint.method.toUpperCase();
    const escapedPath = escapeRegex(endpoint.path);
    const routeMethods = "get|post|put|patch|delete|api_route";
    const decorator = new RegExp(`^\\s*@(app|router)\\.${method}\\(\\s*["']${escapedPath}["']`);
    const apiRouteDecorator = new RegExp(`^\\s*@(app|router)\\.api_route\\(\\s*["']${escapedPath}["']`);
    const anyDecorator = new RegExp(`^\\s*@(app|router)\\.(${routeMethods})\\(\\s*["']${escapedPath}["']`);
    const addApiRoute = new RegExp(`^\\s*(app|router)\\.add_api_route\\(\\s*["']${escapedPath}["']\\s*,\\s*[A-Za-z_]`);
    let decoratorIndex = lines.findIndex((line) => decorator.test(line));
    if (decoratorIndex === -1) {
      decoratorIndex = lines.findIndex((line, index) => {
        if (!apiRouteDecorator.test(line)) {
          return false;
        }
        const snippet = routeCallSnippet(lines, index);
        return routeSnippetHasMethod(snippet, methodLabel);
      });
    }
    const addApiRouteIndex = lines.findIndex((line, index) => {
      if (!addApiRoute.test(line)) {
        return false;
      }
      const snippet = routeCallSnippet(lines, index);
      const explicitMethods = /\bmethods\s*=\s*[\[\(\{][\s\S]*?[\]\)\}]/.test(snippet);
      const matchingMethod = routeSnippetHasMethod(snippet, methodLabel);
      return explicitMethods && matchingMethod;
    });
    if (addApiRouteIndex !== -1) {
      continue;
    }
    if (decoratorIndex === -1) {
      const hasWrongMethodDecorator = lines.some((line) => anyDecorator.test(line));
      const hasWrongMethodAddApiRoute = lines.some((line, index) => addApiRoute.test(line) && !routeSnippetHasMethod(routeCallSnippet(lines, index), methodLabel));
      const suffix = hasWrongMethodDecorator || hasWrongMethodAddApiRoute ? " (method/path mismatch)" : "";
      missing.push(`${methodLabel} ${endpoint.path}${suffix}`);
      continue;
    }
    const nextCode = lines.slice(decoratorIndex + 1).find((line) => line.trim().length > 0);
    if (!nextCode || !/^\s*(async\s+def|def)\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(nextCode)) {
      missing.push(`${methodLabel} ${endpoint.path} (missing route handler)`);
    }
  }
  if (missing.length > 0) {
    fail(`${label} missing FastAPI route declarations or method/path mismatch: ${missing.join(", ")}`);
  }
}

function assertPythonPublicSymbols(text, label) {
  const hasPublicSymbol = /^\s*(?:async\s+def|def|class)\s+[A-Za-z][A-Za-z0-9_]*\b/m.test(text)
    || /^\s*[A-Za-z][A-Za-z0-9_]*\s*=/m.test(text);
  if (!hasPublicSymbol) {
    fail(`${label} must define executable/exported public symbols`);
  }
}

function assertPythonExecutableBeyondMarkers(text, label) {
  const lines = meaningfulLines(stripPythonNonCode(text));
  const executableLines = lines.filter((line) => {
    return !/^(from|import)\s+/.test(line)
      && !/^@/.test(line)
      && !/^(async\s+def|def|class)\s+/.test(line)
      && !/^\)/.test(line);
  });
  if (executableLines.length === 0) {
    fail(`${label} must contain executable data/logic, not only declarations`);
  }
  const markerOnly = executableLines.every((line) => {
    return /^pass\b/.test(line)
      || /^return\s+(?:[rRuUbBfF]*)?["'][^"']*["']\s*$/.test(line)
      || /^[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:[rRuUbBfF]*)?["'][^"']*["']\s*$/.test(line);
  });
  if (markerOnly) {
    fail(`${label} must contain executable data/logic beyond literal marker strings`);
  }
}

function assertFrontendApiFetch(text, endpoints, label) {
  const hasEndpointFetch = endpoints.some((endpoint) => {
    const escaped = escapeRegex(endpoint);
    return new RegExp(`\\bfetch\\(\\s*["'][^"']*${escaped}`).test(text);
  });
  if (!hasEndpointFetch) {
    fail(`${label} must fetch one of: ${endpoints.join(", ")}`);
  }
}

function assertControlledChatInput(text, label) {
  const inputTags = Array.from(text.matchAll(/<(input|textarea)\b[^>]*>/gi)).map((match) => match[0]);
  const chatInput = inputTags.find((tag) => /data-testid\s*=\s*["']chat-input["']/.test(tag));
  if (!chatInput) {
    fail(`${label} must render a chat input control`);
  }
  if (!/\bvalue\s*=/.test(chatInput) || !/\bonChange\s*=/.test(chatInput)) {
    fail(`${label} chat input must be controlled with value and onChange handling`);
  }
}

function assertSendControl(text, label) {
  const sendButton = Array.from(text.matchAll(/<button\b[^>]*>/gi))
    .map((match) => match[0])
    .find((tag) => /data-testid\s*=\s*["'](?:send-message|chat-send)["']/.test(tag));
  if (!sendButton) {
    fail(`${label} must render a send button control`);
  }
  if (!/\bonClick\s*=/.test(sendButton)) {
    fail(`${label} send button must wire an onClick send action`);
  }
  const chatFetchConsumesResponse = /\b(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s+fetch\(\s*["'][^"']*\/chat[\s\S]{0,800}?\bawait\s+\1\.json\s*\(/.test(text)
    || /\bfetch\(\s*["'][^"']*\/chat[\s\S]{0,800}?\)\s*\.then\(\s*\(?\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)?\s*=>\s*\2\.json\s*\(/.test(text);
  if (!chatFetchConsumesResponse) {
    fail(`${label} send action must consume /chat API responses, not fire inert fetch calls`);
  }
}

function assertDynamicTestIdRegion(text, testId, label) {
  const escaped = escapeRegex(testId);
  const regex = new RegExp(`<([A-Za-z][A-Za-z0-9.]*)\\b(?=[^>]*data-testid\\s*=\\s*["']${escaped}["'])[^>]*>[\\s\\S]*?<\\/\\1>`, "i");
  const match = text.match(regex);
  if (!match) {
    fail(`${label} missing ${testId} region`);
  }
  if (!/\{[^}]+\}/.test(match[0])) {
    fail(`${label} ${testId} region must render dynamic state/data, not static marker text`);
  }
}

function assertJsxTestIdAttribute(text, testId, label) {
  const escaped = escapeRegex(testId);
  const regex = new RegExp(`<[A-Za-z][A-Za-z0-9.]*\\b[^>]*\\bdata-testid\\s*=\\s*["']${escaped}["'][^>]*>`, "i");
  if (!regex.test(text)) {
    fail(`${label} must render ${testId} as a JSX data-testid attribute, not as a comment or loose string`);
  }
}

function assertFrontendContractStructure(text, label) {
  for (const testId of ["chat-input", "agent-activity", "domain-widget", "guardrail-banner", "public-context"]) {
    assertJsxTestIdAttribute(text, testId, label);
  }
  if (!/<button\b[^>]*\bdata-testid\s*=\s*["'](?:send-message|chat-send)["'][^>]*>/i.test(text)) {
    fail(`${label} must render send-message/chat-send as a JSX button data-testid attribute, not as a comment or loose string`);
  }
  if (!/\b(?:function|const|let)\s+[A-Za-z_][A-Za-z0-9_]*\b[\s\S]{0,600}\b(?:await\s+)?fetch\(\s*["'][^"']*\/chat/.test(text)) {
    fail(`${label} must wire /chat fetch inside a send handler, not only keep the route as a loose string`);
  }
}

function assertPinnedPackageDependencies(parsedPackage, label) {
  const dependencyEntries = [
    ...Object.entries(parsedPackage.dependencies || {}),
    ...Object.entries(parsedPackage.devDependencies || {}),
  ];
  const unpinned = dependencyEntries.filter(([, version]) => {
    return typeof version !== "string"
      || version === "latest"
      || /^[~^*<>=]/.test(version)
      || /\bx\b/i.test(version)
      || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version);
  });
  if (unpinned.length > 0) {
    fail(`${label} must pin dependency versions exactly: ${unpinned.map(([name, version]) => `${name}@${version}`).join(", ")}`);
  }
}

function assertNoTimeSensitiveWording(text, label) {
  const forbidden = /\b(today|tomorrow|yesterday|latest|currently|recently|right now|this year|next year|as of|as-of|202[0-9]|203[0-9])\b/i;
  const match = text.match(forbidden);
  if (match) {
    fail(`${label} contains time-sensitive wording: ${match[0]}`);
  }
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) {
    fail("SKILL.md is missing frontmatter fence");
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    fail("SKILL.md frontmatter is not closed");
  }
  const frontmatter = text.slice(4, end).trim();
  const values = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    } else {
      fail(`SKILL.md frontmatter contains unsupported syntax: ${line}`);
    }
  }
  return values;
}

function markdownLinks(text) {
  const links = [];
  const regex = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function isExternalLink(target) {
  return /^(https?:|mailto:)/i.test(target);
}

function assertSkillLinks(skillText, dir) {
  const allowedLocal = new Set(["REFERENCE.md", "EXAMPLES.md"]);
  const links = markdownLinks(skillText);
  const bad = [];

  for (const target of links) {
    if (isExternalLink(target)) {
      continue;
    }
    if (target.startsWith("#")) {
      continue;
    }
    if (target.includes("#")) {
      bad.push(`${target} (anchors create deep references)`);
      continue;
    }
    if (!allowedLocal.has(target)) {
      bad.push(target);
      continue;
    }
    const targetPath = join(dir, target);
    if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
      fail(`SKILL.md links to missing one-level reference: ${target}`);
    }
  }

  if (bad.length > 0) {
    fail(`SKILL.md has unsupported local links; only REFERENCE.md and EXAMPLES.md are allowed: ${bad.join(", ")}`);
  }
}

function assertNoNestedReferenceChains(refText, label) {
  const localMarkdownLinks = markdownLinks(refText).filter((target) => !isExternalLink(target) && !target.startsWith("#"));
  if (localMarkdownLinks.length > 0) {
    fail(`${label} contains local markdown links, which would create nested reference chains: ${localMarkdownLinks.join(", ")}`);
  }
}

function assertRequiredSkillHeadings(text) {
  const headings = text
    .split(/\r?\n/)
    .filter((line) => /^#{2,6}\s+/.test(line))
    .map((line) => line.replace(/^#{2,6}\s+/, "").trim());

  const missing = SKILL_HEADING_GROUPS.filter((group) => {
    return !headings.some((heading) => group.alternatives.some((regex) => regex.test(heading)));
  });

  if (missing.length > 0) {
    fail(`SKILL.md missing required methodology headings or local equivalents: ${missing.map((group) => group.label).join(", ")}`);
  }
}

function assertReferenceContextSeparation(referenceText, examplesText) {
  const combined = `${referenceText}\n${examplesText}`.toLowerCase();
  const requiredMarkers = [
    "publiccontext",
    "public_context",
    "internal_context",
    "public json",
    "internal fields",
  ];
  const missing = requiredMarkers.filter((marker) => !combined.includes(marker));
  if (missing.length > 0) {
    fail(`reference/examples missing public/internal context separation markers: ${missing.join(", ")}`);
  }
}

function assertScaffoldDeletionGuard(dir) {
  const scriptPath = join(dir, "scripts/scaffold-agent-system.mjs");
  const text = readRequiredFile(scriptPath, "scaffold script");
  const requiredMarkers = [
    "OWNERSHIP_MARKER",
    "prepareOutputDir",
    "hasOwnershipMarker",
    "refusing unsafe output path",
    "refusing to overwrite existing unowned output",
  ];
  const missing = requiredMarkers.filter((marker) => !text.includes(marker));
  if (missing.length > 0) {
    fail(`scaffold script missing deletion safety guard markers: ${missing.join(", ")}`);
  }
  if (!/await\s+prepareOutputDir\(\s*outputDir,\s*spec,\s*args\.force\s*\)/.test(text)) {
    fail("scaffold script must prepare output through ownership-marker safety guard before writing");
  }
  if (!/prepared\s*=\s*true;[\s\S]{0,200}await\s+scaffold\(\s*spec,\s*outputDir\s*\)/.test(text)) {
    fail("scaffold script must mark cleanup eligibility only after safe output preparation");
  }
}

function checkSkill(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    fail(`missing skill directory: ${dir}`);
  }

  const skillPath = join(dir, "SKILL.md");
  const text = readRequiredFile(skillPath, "SKILL.md");
  const lines = text.split(/\r?\n/);
  if (lines.length > 100) {
    fail(`SKILL.md must be <=100 lines; found ${lines.length}`);
  }

  const frontmatter = parseFrontmatter(text);
  if (!frontmatter.name) {
    fail("SKILL.md frontmatter missing name");
  }
  if (!frontmatter.description) {
    fail("SKILL.md frontmatter missing description");
  }
  if (frontmatter.description.length > 1024) {
    fail(`SKILL.md description must be <=1024 characters; found ${frontmatter.description.length}`);
  }
  if (!frontmatter.description.includes("Use when")) {
    fail('SKILL.md description must contain "Use when"');
  }
  assertNoTimeSensitiveWording(text, "SKILL.md");
  assertRequiredSkillHeadings(text);
  assertSkillLinks(text, dir);
  assertScaffoldDeletionGuard(dir);

  for (const ref of ["REFERENCE.md", "EXAMPLES.md"]) {
    if (!text.includes(ref)) {
      fail(`SKILL.md must reference ${ref}`);
    }
    const refPath = join(dir, ref);
    if (!existsSync(refPath)) {
      fail(`SKILL.md references missing ${ref}: ${refPath}`);
    }
  }

  const referenceText = readRequiredFile(join(dir, "REFERENCE.md"), "REFERENCE.md");
  const examplesText = readRequiredFile(join(dir, "EXAMPLES.md"), "EXAMPLES.md");
  assertNoTimeSensitiveWording(referenceText, "REFERENCE.md");
  assertNoTimeSensitiveWording(examplesText, "EXAMPLES.md");
  assertNoNestedReferenceChains(referenceText, "REFERENCE.md");
  assertNoNestedReferenceChains(examplesText, "EXAMPLES.md");
  assertReferenceContextSeparation(referenceText, examplesText);

  ok(`skill structure valid: ${skillPath}`);
}

function normalizeDomain(domain) {
  return domain.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function parsePythonStringAssignment(text, name, label) {
  const regex = new RegExp(`^\\s*${escapeRegex(name)}\\s*=\\s*(["'])([^"']+)\\1\\s*$`, "m");
  const match = text.match(regex);
  if (!match) {
    fail(`${label} missing ${name} string metadata`);
  }
  return normalizeDomain(match[2]);
}

function parsePythonStringListAssignment(text, name, label) {
  const regex = new RegExp(`^\\s*${escapeRegex(name)}\\s*=\\s*\\[([\\s\\S]*?)^\\s*\\]`, "m");
  const match = text.match(regex);
  if (!match) {
    fail(`${label} missing ${name} list metadata`);
  }
  const fields = [];
  const itemRegex = /(["'])([^"']+)\1/g;
  let item;
  while ((item = itemRegex.exec(match[1])) !== null) {
    fields.push(item[2]);
  }
  if (fields.length === 0) {
    fail(`${label} ${name} must contain at least one field`);
  }
  return fields;
}

function parsePythonClassFieldNames(text, className, label) {
  const classStart = new RegExp(`^class\\s+${escapeRegex(className)}\\([^)]*\\):\\s*$`, "m").exec(text);
  if (!classStart) {
    fail(`${label} missing ${className}`);
  }
  const start = classStart.index + classStart[0].length;
  const nextClass = /^class\s+[A-Za-z_][A-Za-z0-9_]*\([^)]*\):\s*$/m.exec(text.slice(start));
  const block = nextClass ? text.slice(start, start + nextClass.index) : text.slice(start);
  const fields = [];
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=]+?)(?:\s*=.*)?$/);
    if (!match || match[1] === "model_config") {
      continue;
    }
    fields.push(match[1]);
  }
  if (fields.length === 0) {
    fail(`${label} ${className} must define typed fields`);
  }
  return fields;
}

function assertGeneratedTypedBackendModels(mainText, modelsText, publicFields, label) {
  const requiredModels = [
    "PublicContextModel",
    "InternalContextModel",
    "EventModel",
    "ChatMessageModel",
    "GuardrailModel",
    "ConversationStateModel",
    "HealthResponse",
    "StateResponse",
    "ChatRequest",
    "ChatResponse",
  ];
  for (const modelName of requiredModels) {
    if (!new RegExp(`^class\\s+${modelName}\\(BaseModel\\):`, "m").test(modelsText)) {
      fail(`${label} missing typed Pydantic model: ${modelName}`);
    }
  }
  if (/\bAny\b/.test(modelsText) || /\bdict\s*\[\s*str\s*,\s*Any\s*]/.test(`${mainText}\n${modelsText}`)) {
    fail(`${label} must not use Any or dict[str, Any] in public API/state models`);
  }
  assertExactFields(
    parsePythonClassFieldNames(modelsText, "PublicContextModel", label),
    publicFields,
    `${label} PublicContextModel missing generated public fields`,
    `${label} PublicContextModel has unexpected public fields`,
  );
  const routeModels = [
    ["/health", "HealthResponse"],
    ["/state/bootstrap", "StateResponse"],
    ["/state", "StateResponse"],
    ["/chat", "ChatResponse"],
  ];
  for (const [path, modelName] of routeModels) {
    const escapedPath = escapeRegex(path);
    const routeRegex = new RegExp(`@app\\.(?:get|post)\\(\\s*["']${escapedPath}["']\\s*,\\s*response_model\\s*=\\s*${modelName}\\s*\\)`);
    if (!routeRegex.test(mainText)) {
      fail(`${label} route ${path} must declare response_model=${modelName}`);
    }
  }
  const publicFunctions = [
    ["health", "HealthResponse"],
    ["state_bootstrap", "StateResponse"],
    ["state", "StateResponse"],
    ["chat", "ChatResponse"],
    ["public_state", "StateResponse"],
  ];
  for (const [functionName, returnType] of publicFunctions) {
    const functionRegex = new RegExp(`(?:async\\s+def|def)\\s+${functionName}\\([^)]*\\)\\s*->\\s*${returnType}\\s*:`);
    if (!functionRegex.test(mainText)) {
      fail(`${label} ${functionName} must return typed ${returnType}`);
    }
  }
}

function parsePythonDictAssignmentKeys(text, name, label) {
  const assignment = new RegExp(`^\\s*${escapeRegex(name)}\\s*=\\s*\\{`, "m").exec(text);
  if (!assignment) {
    fail(`${label} missing ${name} dict metadata`);
  }

  const openIndex = assignment.index + assignment[0].lastIndexOf("{");
  let depth = 0;
  let quote = null;
  let escaped = false;
  let block = "";
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    block += char;
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        break;
      }
    }
  }

  if (depth !== 0) {
    fail(`${label} ${name} dict metadata is not closed`);
  }

  const keys = [];
  depth = 0;
  quote = null;
  escaped = false;
  let lineStart = true;
  for (let index = 0; index < block.length; index += 1) {
    const char = block[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "\"" || char === "'") {
      if (depth === 1 && lineStart) {
        const quoteChar = char;
        let key = "";
        index += 1;
        for (; index < block.length; index += 1) {
          const keyChar = block[index];
          if (keyChar === "\\") {
            index += 1;
            key += block[index] || "";
          } else if (keyChar === quoteChar) {
            break;
          } else {
            key += keyChar;
          }
        }
        const rest = block.slice(index + 1).match(/^\s*:/);
        if (rest) {
          keys.push(key);
        }
        lineStart = false;
        continue;
      }
      quote = char;
      lineStart = false;
      continue;
    }
    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
    } else if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
    }
    if (char === "\n") {
      lineStart = true;
    } else if (!/\s/.test(char)) {
      lineStart = false;
    }
  }

  if (keys.length === 0) {
    fail(`${label} ${name} must contain at least one field`);
  }
  return keys;
}

function assertExactFields(actualFields, expectedFields, missingMessage, extraMessage) {
  const actualSet = new Set(actualFields);
  const expectedSet = new Set(expectedFields);
  const missing = expectedFields.filter((field) => !actualSet.has(field));
  const extra = actualFields.filter((field) => !expectedSet.has(field));
  if (missing.length > 0) {
    fail(`${missingMessage}: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    fail(`${extraMessage}: ${extra.join(", ")}`);
  }
}

function assertDomainFieldContract(domainKey, publicFields, internalFields) {
  const publicSet = new Set(publicFields);
  const duplicatePublic = publicFields.filter((field, index) => publicFields.indexOf(field) !== index);
  const duplicateInternal = internalFields.filter((field, index) => internalFields.indexOf(field) !== index);
  if (duplicatePublic.length > 0 || duplicateInternal.length > 0) {
    fail(`generated ${domainKey} context metadata contains duplicate fields: ${[...duplicatePublic, ...duplicateInternal].join(", ")}`);
  }
  const overlap = internalFields.filter((field) => publicSet.has(field));
  if (overlap.length > 0) {
    fail(`generated ${domainKey} leaks internal fields into public context metadata: ${overlap.join(", ")}`);
  }
  if (domainKey === "library") {
    const internalSet = new Set(internalFields);
    const missingInternal = LIBRARY_INTERNAL_FIELDS.filter((field) => !internalSet.has(field));
    assertExactFields(
      publicFields,
      LIBRARY_PUBLIC_FIELDS,
      "generated library backend missing required public context fields",
      "generated library backend has unexpected extra public context fields",
    );
    if (missingInternal.length > 0) {
      fail(`generated library backend missing required internal context fields: ${missingInternal.join(", ")}`);
    }
  }
}

function assertGeneratedPublicSeedContract(domainKey, publicSeedFields) {
  if (domainKey !== "library") {
    return;
  }
  assertExactFields(
    publicSeedFields,
    LIBRARY_PUBLIC_FIELDS,
    "generated library backend DEMO_PUBLIC_SEED missing required public context fields",
    "generated library backend DEMO_PUBLIC_SEED has unexpected extra public context fields",
  );
}

function parseDomainBlocks(text) {
  const blocks = new Map();
  const regex = /```(?:yaml|yml|json)?\s*\n([\s\S]*?)```/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const keyMatch = block.match(/^\s*["']?domain_key["']?\s*[:=]\s*["']?([A-Za-z0-9_-]+)["']?\s*$/im);
    if (keyMatch) {
      blocks.set(normalizeDomain(keyMatch[1]), block);
    }
  }
  return blocks;
}

function extractTopLevelKeys(block) {
  const keys = new Set();
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)\s*:/);
    if (match) {
      keys.add(match[1].toLowerCase());
    }
  }
  return keys;
}

function extractYamlList(block, key) {
  const lines = block.split(/\r?\n/);
  const items = [];
  let collecting = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`, "i").test(line)) {
      collecting = true;
      continue;
    }
    if (collecting && /^[A-Za-z0-9_]+\s*:/.test(line)) {
      break;
    }
    if (collecting) {
      const item = line.match(/^\s+-\s+(.+?)\s*$/);
      if (item) {
        items.push(item[1].split(":")[0].trim().replace(/^["']|["']$/g, ""));
      }
    }
  }
  return items;
}

function assertDomainSchema(block, domain) {
  const keys = extractTopLevelKeys(block);
  const missingTerms = SCHEMA_TERMS.filter((term) => !keys.has(term));
  if (missingTerms.length > 0) {
    fail(`domain ${domain} missing required schema terms: ${missingTerms.join(", ")}`);
  }

  const publicFields = extractYamlList(block, "public_context");
  const internalFields = extractYamlList(block, "internal_context");
  if (publicFields.length === 0 || internalFields.length === 0) {
    fail(`domain ${domain} must define non-empty public_context and internal_context lists`);
  }

  const publicSet = new Set(publicFields);
  const overlap = internalFields.filter((field) => publicSet.has(field));
  if (overlap.length > 0) {
    fail(`domain ${domain} leaks internal fields into public_context: ${overlap.join(", ")}`);
  }

  if (domain === "library") {
    const missingPublic = LIBRARY_PUBLIC_FIELDS.filter((field) => !publicSet.has(field));
    const internalSet = new Set(internalFields);
    const missingInternal = LIBRARY_INTERNAL_FIELDS.filter((field) => !internalSet.has(field));
    if (missingPublic.length > 0) {
      fail(`library example missing required public context fields: ${missingPublic.join(", ")}`);
    }
    if (missingInternal.length > 0) {
      fail(`library example missing required internal context fields: ${missingInternal.join(", ")}`);
    }
  }
}

function checkExample(file, domains) {
  const text = readRequiredFile(file, "example file");
  assertNoTimeSensitiveWording(text, file);
  const blocks = parseDomainBlocks(text);
  const requiredDomains = new Set(domains.map(normalizeDomain));
  if (file.endsWith("EXAMPLES.md")) {
    for (const domain of REQUIRED_DOMAINS) {
      requiredDomains.add(domain);
    }
  }

  for (const domain of requiredDomains) {
    if (!blocks.has(domain)) {
      fail(`missing required domain section/key: ${domain}`);
    }
    assertDomainSchema(blocks.get(domain), domain);
  }

  ok(`example domains valid: ${Array.from(requiredDomains).join(", ")}`);
}

function checkGenerated(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    fail(`missing generated app directory: ${dir}`);
  }

  const missing = [];
  for (const rel of GENERATED_REQUIRED) {
    const path = join(dir, rel);
    if (!existsSync(path)) {
      missing.push(rel);
    }
  }
  if (missing.length > 0) {
    fail(`missing generated app skeleton files: ${missing.join(", ")}`);
  }

  const frontendEntry = GENERATED_FRONTEND_ENTRY_CANDIDATES.find((rel) => existsSync(join(dir, rel)));
  if (!frontendEntry) {
    fail(`missing generated frontend entry; expected one of: ${GENERATED_FRONTEND_ENTRY_CANDIDATES.join(", ")}`);
  }

  const main = readRequiredFile(join(dir, "backend/main.py"), "generated backend main.py");
  const mainWithoutComments = stripPythonNonCode(main);
  assertSubstantiveContent(mainWithoutComments, "generated backend main.py");
  if (!/\bFastAPI\b/.test(mainWithoutComments) || !/^\s*app\s*=\s*FastAPI\s*\(/m.test(mainWithoutComments)) {
    fail("generated backend main.py must create a FastAPI app");
  }
  assertFastApiRoutes(mainWithoutComments, ENDPOINT_CONTRACTS, "generated backend");
  assertContainsAllGroups(mainWithoutComments, [["AGENT_RUNTIME"], ["mock"]], "generated backend main.py");
  if (/\b(from\s+openai\b|import\s+openai\b)/.test(mainWithoutComments)) {
    fail("generated backend must not import OpenAI directly in the mock generated app");
  }

  const frontendPackage = readRequiredFile(join(dir, "frontend/package.json"), "generated frontend package.json");
  assertSubstantiveContent(frontendPackage, "generated frontend/package.json");
  try {
    const parsedPackage = JSON.parse(frontendPackage);
    if (!parsedPackage.scripts || !parsedPackage.scripts.dev) {
      fail("generated frontend/package.json must define scripts.dev");
    }
    assertPinnedPackageDependencies(parsedPackage, "generated frontend/package.json");
    const dependencyNames = new Set([
      ...Object.keys(parsedPackage.dependencies || {}),
      ...Object.keys(parsedPackage.devDependencies || {}),
    ]);
    if (![...dependencyNames].some((name) => ["@vitejs/plugin-react", "vite", "next", "react"].includes(name))) {
      fail("generated frontend/package.json must declare a React-compatible frontend dependency");
    }
  } catch (error) {
    fail(`generated frontend/package.json is invalid JSON: ${error.message}`);
  }

  const contextMetadata = stripPythonNonCode(readRequiredFile(join(dir, "backend/context.py"), "generated backend/context.py"));
  const demoDataMetadata = stripPythonNonCode(readRequiredFile(join(dir, "backend/demo_data.py"), "generated backend/demo_data.py"));
  const modelsMetadata = stripPythonNonCode(readRequiredFile(join(dir, "backend/models.py"), "generated backend/models.py"));
  const domainKey = parsePythonStringAssignment(demoDataMetadata, "DOMAIN_KEY", "generated backend/demo_data.py");
  const publicFields = parsePythonStringListAssignment(contextMetadata, "PUBLIC_FIELD_NAMES", "generated backend/context.py");
  const internalFields = parsePythonStringListAssignment(contextMetadata, "INTERNAL_FIELD_NAMES", "generated backend/context.py");
  const publicSeedFields = parsePythonDictAssignmentKeys(demoDataMetadata, "DEMO_PUBLIC_SEED", "generated backend/demo_data.py");
  assertDomainFieldContract(domainKey, publicFields, internalFields);
  assertGeneratedPublicSeedContract(domainKey, publicSeedFields);
  assertGeneratedTypedBackendModels(mainWithoutComments, modelsMetadata, publicFields, "generated backend typed model contract");

  const requirements = readRequiredFile(join(dir, "backend/requirements.txt"), "generated backend requirements.txt");
  assertSubstantiveContent(requirements, "generated backend/requirements.txt");
  for (const term of ["fastapi", "uvicorn"]) {
    if (!requirements.toLowerCase().includes(term)) {
      fail(`generated backend/requirements.txt missing dependency: ${term}`);
    }
  }

  const readme = readRequiredFile(join(dir, "README.md"), "generated README.md");
  assertSubstantiveContent(readme, "generated README.md");
  for (const term of ["mock", "backend", "frontend", "AGENT_RUNTIME", "npm run", "uvicorn", "qa"]) {
    if (!readme.toLowerCase().includes(term.toLowerCase())) {
      fail(`generated README.md missing run/extension term: ${term}`);
    }
  }

  const backendContractTexts = [mainWithoutComments];
  for (const contract of BACKEND_MODULE_CONTRACTS) {
    const moduleText = stripPythonNonCode(readRequiredFile(join(dir, contract.rel), `generated ${contract.rel}`));
    assertSubstantiveContent(moduleText, `generated ${contract.rel}`);
    assertPythonPublicSymbols(moduleText, `generated ${contract.rel}`);
    assertPythonExecutableBeyondMarkers(moduleText, `generated ${contract.rel}`);
    assertContainsAllGroups(moduleText, contract.groups, `generated ${contract.rel} ${contract.label}`);
    backendContractTexts.push(moduleText);
  }

  const backendText = backendContractTexts.join("\n");
  if (/\bdict\s*\[\s*str\s*,\s*Any\s*]|\bfrom\s+typing\s+import\s+Any\b/.test(backendText)) {
    fail("generated backend must not use broad dict[str, Any] or typing.Any in public/state implementation");
  }
  const frontendText = readTextTree(join(dir, "frontend"));
  const generatedText = `${backendText}\n${frontendText}\n${readme}\n${frontendPackage}\n${requirements}`;
  assertNoStaleGeneratedMarkers(generatedText, "generated app");
  const missingBackendPublic = publicFields.filter((field) => !backendText.includes(field));
  const missingBackendInternal = internalFields.filter((field) => !backendText.includes(field));
  if (missingBackendPublic.length > 0) {
    fail(`generated backend missing public context field markers: ${missingBackendPublic.join(", ")}`);
  }
  if (missingBackendInternal.length > 0) {
    fail(`generated backend missing internal context field markers: ${missingBackendInternal.join(", ")}`);
  }
  const missingFrontendPublic = publicFields.filter((field) => !frontendText.includes(field));
  if (missingFrontendPublic.length > 0) {
    fail(`generated frontend missing public context field labels: ${missingFrontendPublic.join(", ")}`);
  }
  const leakedFrontendInternal = [...new Set([...internalFields, ...LIBRARY_INTERNAL_FIELDS])].filter((field) => frontendText.includes(field));
  if (leakedFrontendInternal.length > 0) {
    fail(`generated frontend leaks internal context field markers: ${leakedFrontendInternal.join(", ")}`);
  }
  const frontendSource = stripJsxComments(readRequiredFile(join(dir, frontendEntry), `generated ${frontendEntry}`));
  assertSubstantiveContent(frontendSource, `generated ${frontendEntry}`);
  if (/\breturn\s+null\b/.test(frontendSource)) {
    fail(`generated ${frontendEntry} must render the generated app UI, not return null`);
  }
  if (countMatches(frontendSource, /\buse(State|Reducer)\s*\(/g) < 2) {
    fail(`generated ${frontendEntry} must keep separate UI state for input and generated app data`);
  }
  if (!/\b(useEffect|on[A-Z][A-Za-z0-9_]*\s*=)\b/.test(frontendSource)) {
    fail(`generated ${frontendEntry} must include event/effect handling`);
  }
  assertControlledChatInput(frontendSource, `generated ${frontendEntry}`);
  assertSendControl(frontendSource, `generated ${frontendEntry}`);
  assertFrontendApiFetch(frontendSource, ["/chat"], `generated ${frontendEntry} chat API call`);
  assertFrontendApiFetch(frontendSource, ["/state/bootstrap", "/state"], `generated ${frontendEntry} bootstrap/state API call`);
  assertFrontendContractStructure(frontendSource, `generated ${frontendEntry}`);
  for (const group of FRONTEND_CONTRACT_GROUPS) {
    assertContainsAny(frontendSource, group.alternatives, `generated ${frontendEntry} ${group.label}`);
  }
  for (const testId of ["agent-activity", "domain-widget", "guardrail-banner", "public-context"]) {
    assertDynamicTestIdRegion(frontendSource, testId, `generated ${frontendEntry}`);
  }

  ok(`generated ${domainKey} app skeleton valid: ${resolve(dir)}`);
}

function readTextTree(dir) {
  let output = "";
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist", "build", "__pycache__"].includes(entry.name)) {
        continue;
      }
      output += readTextTree(path);
    } else if (entry.isFile() && [".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt"].includes(extname(entry.name))) {
      output += `\n${readFileSync(path, "utf8")}`;
    }
  }
  return output;
}

const args = parseArgs(process.argv.slice(2));
if (args.checkSkill) {
  checkSkill(args.checkSkill);
} else if (args.validateExample) {
  checkExample(args.validateExample, args.requireDomains);
} else if (args.checkGenerated) {
  checkGenerated(args.checkGenerated);
}
