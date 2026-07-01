import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BACKEND_ROOT, ROOT } from "./paths.mjs";
import { HarnessError } from "./errors.mjs";

const PYTHON_AGENTS_SYMBOLS = new Set([
  "Agent",
  "Runner",
  "SQLiteSession",
  "function_tool",
  "handoff",
  "RunContextWrapper",
  "input_guardrail",
  "GuardrailFunctionOutput",
]);
const RUNTIME_EXTENSIONS = new Set([".py", ".js", ".mjs", ".cjs", ".ts", ".tsx"]);
const SKIP_DIRS = new Set([".venv", "node_modules", "__pycache__", ".pytest_cache"]);

export function makeProviderEnv() {
  const env = { ...process.env, AGENT_RUNTIME: "mock" };
  const scrubbed = [];
  for (const key of Object.keys(env)) {
    if (key === "OPENAI_API_KEY" || key.startsWith("OPENAI_")) {
      scrubbed.push(key);
      delete env[key];
    }
  }
  return { env, scrubbed };
}

export function requireMockRuntime(provider) {
  if (process.env.AGENT_RUNTIME !== "mock") {
    throw new HarnessError("AGENT_RUNTIME must be mock for local QA; OpenAI calls are disabled by this harness", "failed-mock-runtime");
  }
  if (provider.scrubbed.length > 0) {
    console.log(`mock mode active: scrubbed provider environment keys: ${provider.scrubbed.join(", ")}`);
  } else {
    console.log("mock mode active: no provider credentials present");
  }
  console.log("mock mode active: harness will scan generated runtime paths for provider imports/calls before startup");
}

function extensionOf(path) {
  const match = path.match(/(\.[^.]+)$/);
  return match ? match[1] : "";
}

function listRuntimeFiles(root) {
  const files = [];
  const visit = (path) => {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(path.split(/[\\/]/).pop())) return;
      for (const entry of readdirSync(path)) {
        visit(join(path, entry));
      }
      return;
    }
    if (stat.isFile() && RUNTIME_EXTENSIONS.has(extensionOf(path))) {
      files.push(path);
    }
  };
  visit(root);
  return files.sort();
}

function finding(file, lineNumber, kind, match) {
  return {
    file: relative(ROOT, file),
    line: lineNumber,
    kind,
    match: match.trim(),
  };
}

function stripInlineComment(line, extension) {
  if (extension === ".py") return line.replace(/\s+#.*$/, "");
  return line.replace(/\s+\/\/.*$/, "");
}

function importedPythonNames(importClause) {
  return importClause
    .replace(/[()]/g, "")
    .split(",")
    .map((part) => part.trim().split(/\s+as\s+/)[0])
    .filter(Boolean);
}

function scanPythonLine(file, line, lineNumber, context) {
  const findings = [];
  const code = stripInlineComment(line, ".py");
  const fromAgents = code.match(/^\s*from\s+agents\s+import\s+(.+)$/);
  if (fromAgents) {
    const imported = importedPythonNames(fromAgents[1]);
    const importsSdkSymbols = imported.some((name) => name === "*" || PYTHON_AGENTS_SYMBOLS.has(name));
    if (importsSdkSymbols || !context.localAgentsModuleExists) {
      findings.push(finding(file, lineNumber, importsSdkSymbols ? "python-agents-sdk-import" : "python-agents-import", code));
    }
  }
  if (/^\s*import\s+agents(?:\s+as\s+\w+)?\s*$/.test(code) || /^\s*import\s+.*\bagents\b/.test(code)) {
    findings.push(finding(file, lineNumber, "python-agents-module-import", code));
  }
  if (/^\s*from\s+openai\b/.test(code) || /^\s*import\s+openai(?:\s+as\s+\w+)?\s*$/.test(code) || /^\s*import\s+.*\bopenai\b/.test(code)) {
    findings.push(finding(file, lineNumber, "python-openai-import", code));
  }
  if (/\b(?:OpenAI|AsyncOpenAI)\s*\(/.test(code) || /\bopenai\.[A-Za-z_]\w*\s*\(/.test(code)) {
    findings.push(finding(file, lineNumber, "python-openai-call", code));
  }
  return findings;
}

function scanPythonFile(file, lines, context) {
  const findings = [];
  let pending = null;
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const code = stripInlineComment(line, ".py");
    if (pending) {
      pending.code = `${pending.code} ${code}`;
      if (/\)/.test(code)) {
        findings.push(...scanPythonLine(file, pending.code, pending.lineNumber, context));
        pending = null;
      }
      return;
    }
    if (/^\s*from\s+agents\s+import\s*\(/.test(code)) {
      pending = { code, lineNumber };
      if (/\)/.test(code)) {
        findings.push(...scanPythonLine(file, pending.code, pending.lineNumber, context));
        pending = null;
      }
      return;
    }
    findings.push(...scanPythonLine(file, line, lineNumber, context));
  });
  if (pending) {
    findings.push(...scanPythonLine(file, pending.code, pending.lineNumber, context));
  }
  return findings;
}

function scanJavaScriptLine(file, line, lineNumber) {
  const findings = [];
  const code = stripInlineComment(line, ".js");
  if (/\bfrom\s+["']openai["']/.test(code) || /\bimport\s*\(\s*["']openai["']\s*\)/.test(code) || /\brequire\s*\(\s*["']openai["']\s*\)/.test(code)) {
    findings.push(finding(file, lineNumber, "js-openai-import", code));
  }
  if (/\b(?:OpenAI|AsyncOpenAI)\s*\(/.test(code)) {
    findings.push(finding(file, lineNumber, "js-openai-call", code));
  }
  return findings;
}

export function scanMockProviderBoundary(root = BACKEND_ROOT) {
  if (!existsSync(root)) {
    throw new HarnessError(`generated backend contract missing after scaffold: ${root}`, "failed-backend-contract");
  }
  const files = listRuntimeFiles(root);
  const context = { localAgentsModuleExists: existsSync(join(root, "agents.py")) };
  const findings = [];
  for (const file of files) {
    const extension = extensionOf(file);
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    if (extension === ".py") {
      findings.push(...scanPythonFile(file, lines, context));
    } else {
      lines.forEach((line, index) => {
        findings.push(...scanJavaScriptLine(file, line, index + 1));
      });
    }
  }
  return {
    root: relative(ROOT, root),
    scannedFiles: files.map((file) => relative(ROOT, file)),
    findings,
    allowed: findings.length === 0,
  };
}

export function assertMockProviderSafe(root = BACKEND_ROOT) {
  const report = scanMockProviderBoundary(root);
  if (!report.allowed) {
    const preview = report.findings.map((item) => `${item.file}:${item.line} ${item.kind} ${item.match}`).join("; ");
    throw new HarnessError(`mock backend provider boundary blocked disallowed provider imports/calls: ${preview}`, "failed-provider-boundary", { boundaryReport: report });
  }
  console.log("mock provider boundary: generated backend runtime scan passed; providerImportAttempted=false; providerCalls=false");
  return report;
}
