import { join } from "node:path";
import { BACKEND_ROOT, FRONTEND_ROOT, GENERATED_ROOT, ROOT } from "./paths.mjs";

export function commandLabel(command) {
  return [command.bin, ...command.args].join(" ");
}

export function buildPlannedCommands(backendPort, frontendPort) {
  const venvPython = join(GENERATED_ROOT, ".venv/bin/python");
  return {
    validateSkill: {
      cwd: ROOT,
      bin: process.execPath,
      args: ["agentic-system-builder/scripts/validate-domain-spec.mjs", "--check-skill", "agentic-system-builder"],
    },
    validateExamples: {
      cwd: ROOT,
      bin: process.execPath,
      args: [
        "agentic-system-builder/scripts/validate-domain-spec.mjs",
        "--validate-example",
        "agentic-system-builder/EXAMPLES.md",
        "--require-domain",
        "airline",
        "--require-domain",
        "library",
        "--require-domain",
        "pcbang",
        "--require-domain",
        "generic",
      ],
    },
    scaffoldLibrary: {
      cwd: ROOT,
      bin: process.execPath,
      args: ["agentic-system-builder/scripts/scaffold-agent-system.mjs", "--domain", "library", "--out", "generated/library-reservation-demo", "--force"],
    },
    validateGenerated: {
      cwd: ROOT,
      bin: process.execPath,
      args: ["agentic-system-builder/scripts/validate-domain-spec.mjs", "--check-generated", "generated/library-reservation-demo"],
    },
    backendVenv: {
      cwd: GENERATED_ROOT,
      bin: process.env.PYTHON || "python3",
      args: ["-m", "venv", ".venv"],
    },
    backendInstall: {
      cwd: GENERATED_ROOT,
      bin: venvPython,
      args: ["-m", "pip", "install", "--disable-pip-version-check", "-r", "backend/requirements.txt"],
    },
    backendStart: {
      cwd: BACKEND_ROOT,
      bin: venvPython,
      args: ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", String(backendPort)],
    },
    frontendInstall: {
      cwd: FRONTEND_ROOT,
      bin: "npm",
      args: ["install"],
    },
    frontendBrowserInstall: {
      cwd: FRONTEND_ROOT,
      bin: "npx",
      args: ["playwright", "install", "chromium"],
    },
    frontendStart: {
      cwd: FRONTEND_ROOT,
      bin: "npm",
      args: ["run", "dev", "--", "--port", String(frontendPort)],
      env: {
        VITE_API_BASE: `http://127.0.0.1:${backendPort}`,
      },
    },
    curlHealth: {
      cwd: ROOT,
      bin: "curl",
      args: ["-i", `http://127.0.0.1:${backendPort}/health`],
    },
    curlChat: {
      cwd: ROOT,
      bin: "curl",
      args: [
        "-i",
        "-X",
        "POST",
        `http://127.0.0.1:${backendPort}/chat`,
        "-H",
        "content-type: application/json",
        "-d",
        '{"thread_id":"demo","message":"도서관 스터디룸 예약하고 싶어요"}',
      ],
    },
    curlGuardrail: {
      cwd: ROOT,
      bin: "curl",
      args: [
        "-i",
        "-X",
        "POST",
        `http://127.0.0.1:${backendPort}/chat`,
        "-H",
        "content-type: application/json",
        "-d",
        '{"thread_id":"demo","message":"무관한 주식 추천해줘"}',
      ],
    },
    curlMalformed: {
      cwd: ROOT,
      bin: "curl",
      args: [
        "-i",
        "-X",
        "POST",
        `http://127.0.0.1:${backendPort}/chat`,
        "-H",
        "content-type: application/json",
        "--data-binary",
        "@-",
      ],
      input: '{"thread_id":"demo","message":',
    },
    curlBadShape: {
      cwd: ROOT,
      bin: "curl",
      args: [
        "-i",
        "-X",
        "POST",
        `http://127.0.0.1:${backendPort}/chat`,
        "-H",
        "content-type: application/json",
        "-d",
        '{"thread_id":"","message":{"text":"bad shape"}}',
      ],
    },
    curlUnknownThread: {
      cwd: ROOT,
      bin: "curl",
      args: ["-i", `http://127.0.0.1:${backendPort}/state?thread_id=qa-unknown-thread`],
    },
    curlSse: {
      cwd: ROOT,
      bin: "curl",
      args: ["-i", "-N", `http://127.0.0.1:${backendPort}/state/stream?thread_id=demo`, "--max-time", "5"],
    },
  };
}
