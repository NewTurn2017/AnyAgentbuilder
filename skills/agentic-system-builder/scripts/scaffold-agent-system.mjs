#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const TEMPLATE_ROOT = join(ROOT, "skills", "agentic-system-builder", "templates");
const DOMAIN_PATH = join(TEMPLATE_ROOT, "domains.json");
const GENERATED_ROOT = join(ROOT, "generated");
const OWNERSHIP_MARKER = ".any-agent-builder-generated.json";
const OWNER = "any-agent-system-builder";

const TEMPLATE_FILES = [
  [".ignore.tmpl", ".ignore"],
  [".gitignore.tmpl", ".gitignore"],
  ["README.md.tmpl", "README.md"],
  ["backend/requirements.txt", "backend/requirements.txt"],
  ["backend/context.py.tmpl", "backend/context.py"],
  ["backend/demo_data.py.tmpl", "backend/demo_data.py"],
  ["backend/models.py.tmpl", "backend/models.py"],
  ["backend/events.py.tmpl", "backend/events.py"],
  ["backend/memory.py.tmpl", "backend/memory.py"],
  ["backend/tools.py.tmpl", "backend/tools.py"],
  ["backend/agents.py.tmpl", "backend/agents.py"],
  ["backend/main.py.tmpl", "backend/main.py"],
  ["frontend/package.json.tmpl", "frontend/package.json"],
  ["frontend/index.html.tmpl", "frontend/index.html"],
  ["frontend/vite.config.js.tmpl", "frontend/vite.config.js"],
  ["frontend/src/main.jsx.tmpl", "frontend/src/main.jsx"],
  ["frontend/src/App.jsx.tmpl", "frontend/src/App.jsx"],
  ["frontend/src/styles.css", "frontend/src/styles.css"],
];

const PUBLIC_LABELS = {
  patron_display_name: "이용자",
  reservation_id: "예약 번호",
  resource_label: "리소스",
  time_window: "시간",
  reservation_status: "상태",
  loan_titles: "대출 도서",
  policy_summary: "정책 요약",
  passenger_display_name: "승객",
  confirmation_number: "예약 번호",
  flight_number: "항공편",
  trip_status: "운항 상태",
  selected_seat: "좌석",
  compensation_case_id: "보상 케이스",
  guest_display_name: "손님",
  seat_label: "좌석",
  pc_tier: "PC 등급",
  customer_display_name: "고객",
};

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = { domain: "library", domainSet: false, specPath: null, out: null, force: false, keepFailed: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--domain") {
      args.domain = readValue(argv, ++index, arg);
      args.domainSet = true;
    } else if (arg === "--spec") {
      args.specPath = readValue(argv, ++index, arg);
    } else if (arg === "--out") {
      args.out = readValue(argv, ++index, arg);
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--keep-failed") {
      args.keepFailed = true;
    } else if (!arg.startsWith("--") && !args.specPath) {
      args.specPath = arg;
    } else {
      fail(`unknown flag or argument: ${arg}`);
    }
  }
  if (args.specPath && args.domainSet) {
    fail("choose either --domain <built-in> or --spec <json>, not both");
  }
  return args;
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    fail(`${flag} requires a value`);
  }
  return value;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`invalid ${label} ${path}: ${detail}`);
  }
}

async function loadSpec(args) {
  if (args.specPath) {
    const specPath = resolve(args.specPath);
    if (!existsSync(specPath)) {
      fail(`missing JSON domain spec: ${specPath}`);
    }
    return normalizeSpec(await readJson(specPath, "JSON domain spec"), "custom JSON spec");
  }

  const domains = await readJson(DOMAIN_PATH, "built-in domain registry");
  const key = args.domain.trim().toLowerCase();
  if (!domains[key]) {
    fail(`unknown built-in domain "${args.domain}"; choose one of ${Object.keys(domains).join(", ")} or pass --spec <json>`);
  }
  return normalizeSpec(domains[key], `built-in domain ${key}`);
}

function normalizeSpec(input, sourceLabel) {
  const required = ["domain_key", "brand_name", "public_context", "internal_context", "agents", "handoffs", "guardrails", "resources"];
  const missing = required.filter((key) => input[key] === undefined);
  if (missing.length > 0) {
    fail(`${sourceLabel} missing required fields: ${missing.join(", ")}`);
  }
  if (!isRecord(input.public_context) || !isRecord(input.internal_context)) {
    fail(`${sourceLabel} public_context and internal_context must be JSON objects`);
  }
  if (![input.agents, input.handoffs, input.guardrails, input.resources].every(Array.isArray)) {
    fail(`${sourceLabel} agents, handoffs, guardrails, and resources must be arrays`);
  }
  const publicFields = Object.keys(input.public_context);
  const internalFields = Object.keys(input.internal_context);
  const overlap = publicFields.filter((field) => internalFields.includes(field));
  if (overlap.length > 0) {
    fail(`${sourceLabel} leaks internal fields into public_context: ${overlap.join(", ")}`);
  }
  const resourceKind = String(input.resource_kind || "예약 리소스");
  return {
    ...input,
    domain_key: safeIdentifier(input.domain_key),
    slug: slugify(input.slug || `${input.domain_key}-reservation-demo`),
    user_prompt: input.user_prompt || "예약을 도와주세요",
    assistant_message: input.assistant_message || "요청을 확인했고 가능한 선택지를 정리했습니다.",
    active_agent: input.active_agent || input.agents[0] || "triage_agent",
    widget_title: input.widget_title || "예약 선택",
    widget_empty: input.widget_empty || "가능한 선택지를 확인 중입니다.",
    resource_kind: resourceKind,
    policy_summary: input.policy_summary || String(input.public_context.policy_summary || "공개 가능한 정책 요약만 표시합니다."),
    publicFields,
    internalFields,
    field_labels: Object.fromEntries(publicFields.map((field) => [field, PUBLIC_LABELS[field] || field.replace(/_/g, " ")])),
    relevance_guardrail_reason: `이 데스크는 ${resourceKind} 예약 업무만 처리합니다.`,
    sample_chat_json_shell: shellQuote(JSON.stringify({ thread_id: "demo", message: input.user_prompt || "예약을 도와주세요" })),
    public_context_model_fields: pythonModelFields(input.public_context),
    internal_context_model_fields: pythonModelFields(input.internal_context),
  };
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function safeIdentifier(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function slugify(value) {
  return safeIdentifier(value).replace(/^-+|-+$/g, "") || "agent-system-demo";
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function jsonLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function pythonLiteral(value, depth = 0) {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("Python literal values must be finite numbers");
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${nextIndent}${pythonLiteral(item, depth + 1)}`).join(",\n")},\n${indent}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([key, item]) => `${nextIndent}${JSON.stringify(key)}: ${pythonLiteral(item, depth + 1)}`).join(",\n")},\n${indent}}`;
  }
  fail(`unsupported value in Python literal: ${String(value)}`);
}

function pythonType(value) {
  if (typeof value === "string") return "str";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (Array.isArray(value)) {
    if (value.length === 0) return "list[JsonValue]";
    const itemTypes = [...new Set(value.map((item) => pythonType(item)))];
    return itemTypes.length === 1 ? `list[${itemTypes[0]}]` : "list[JsonValue]";
  }
  if (isRecord(value)) return "JsonObject";
  return "JsonValue";
}

function pythonModelFields(record) {
  return Object.entries(record)
    .map(([key, value]) => `    ${key}: ${pythonType(value)}`)
    .join("\n");
}

function specValue(spec, key) {
  if (!(key in spec)) {
    fail(`template references missing spec value: ${key}`);
  }
  return spec[key];
}

function renderTemplate(template, spec) {
  return template.replaceAll(/{{(TEXT|JS|PY):([a-zA-Z0-9_]+)}}/g, (_match, mode, key) => {
    const value = specValue(spec, key);
    if (mode === "TEXT") return String(value);
    if (mode === "JS") return jsonLiteral(value);
    return pythonLiteral(value);
  });
}

async function writeProjectFile(root, rel, content) {
  const path = join(root, rel);
  await assertSafeOutputPath(path);
  await assertSafeOutputPath(dirname(path));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content.trimStart(), "utf8");
}

function isWithin(child, parent) {
  const rel = relative(parent, child);
  return rel === "" || (rel && !rel.startsWith("..") && !rel.startsWith("/") && !/^[A-Za-z]:/.test(rel));
}

const PROTECTED_EXACT_PATHS = [
  resolve("/"),
  homedir(),
  ROOT,
  GENERATED_ROOT,
  join(ROOT, "skills", "agentic-system-builder"),
  join(ROOT, ".omo"),
].map((path) => resolve(path));

const PROTECTED_WORKSPACE_SUBTREES = [join(ROOT, "skills", "agentic-system-builder"), join(ROOT, ".omo")].map((path) => resolve(path));

function assertNotProtectedPath(path, outputDir) {
  if (PROTECTED_EXACT_PATHS.includes(path)) {
    fail(`refusing unsafe output path: ${outputDir}`);
  }
  for (const protectedDir of PROTECTED_WORKSPACE_SUBTREES) {
    if (isWithin(path, protectedDir)) {
      fail(`refusing unsafe output path inside protected workspace: ${outputDir}`);
    }
  }
}

async function intendedRealPath(path) {
  const normalized = resolve(path);
  let existingAncestor = normalized;
  while (!existsSync(existingAncestor)) {
    const parent = dirname(existingAncestor);
    if (parent === existingAncestor) break;
    existingAncestor = parent;
  }
  const realAncestor = await realpath(existingAncestor);
  return resolve(realAncestor, relative(existingAncestor, normalized));
}

async function assertSafeOutputPath(outputDir) {
  const normalized = resolve(outputDir);
  assertNotProtectedPath(normalized, outputDir);
  assertNotProtectedPath(await intendedRealPath(normalized), outputDir);
}

async function hasOwnershipMarker(outputDir) {
  try {
    const marker = JSON.parse(await readFile(join(outputDir, OWNERSHIP_MARKER), "utf8"));
    return marker.owner === OWNER;
  } catch {
    return false;
  }
}

async function writeOwnershipMarker(outputDir, spec) {
  const marker = {
    owner: OWNER,
    domain_key: spec.domain_key,
    slug: spec.slug,
  };
  const markerPath = join(outputDir, OWNERSHIP_MARKER);
  await assertSafeOutputPath(markerPath);
  await writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
}

async function prepareOutputDir(outputDir, spec, force) {
  await assertSafeOutputPath(outputDir);
  if (existsSync(outputDir)) {
    if (!force) fail(`output already exists: ${outputDir}; pass --force to overwrite`);
    const owned = await hasOwnershipMarker(outputDir);
    if (!owned) {
      fail(`refusing to overwrite existing unowned output: ${outputDir}; add ${OWNERSHIP_MARKER} only for generated outputs`);
    }
    await assertSafeOutputPath(outputDir);
    await rm(outputDir, { recursive: true, force: true });
  }
  await assertSafeOutputPath(outputDir);
  await mkdir(outputDir, { recursive: true });
  await writeOwnershipMarker(outputDir, spec);
}

async function cleanupPreparedOutput(outputDir) {
  await assertSafeOutputPath(outputDir);
  if (!(await hasOwnershipMarker(outputDir))) {
    return false;
  }
  await assertSafeOutputPath(outputDir);
  await rm(outputDir, { recursive: true, force: true });
  return true;
}

async function scaffold(spec, outputDir) {
  for (const [templateRel, outputRel] of TEMPLATE_FILES) {
    const template = await readFile(join(TEMPLATE_ROOT, templateRel), "utf8");
    await writeProjectFile(outputDir, outputRel, renderTemplate(template, spec));
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  let prepared = false;
  let outputDir = args.out ? resolve(args.out) : null;
  try {
    const spec = await loadSpec(args);
    outputDir = outputDir || resolve(join(ROOT, "generated", spec.slug));
    await prepareOutputDir(outputDir, spec, args.force);
    prepared = true;
    await scaffold(spec, outputDir);
    console.log(`OK: scaffolded ${spec.domain_key} agent system at ${outputDir}`);
    console.log("OK: backend endpoints include GET /health, GET /state/bootstrap, GET /state, GET /state/stream, POST /chat");
  } catch (error) {
    if (prepared && outputDir && !args.keepFailed) {
      console.error(`ERROR: ${error.message}`);
      if (await cleanupPreparedOutput(outputDir)) {
        console.error(`OK: removed partial output ${outputDir}`);
      } else {
        console.error(`OK: preserved output without ${OWNERSHIP_MARKER} ${outputDir}`);
      }
    } else {
      console.error(`ERROR: ${error.message}`);
    }
    process.exitCode = 1;
  }
}

run();
