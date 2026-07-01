import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { INTERNAL_FIELD_MARKERS } from "./paths.mjs";
import { runCommand, writeCommandArtifact } from "./processes.mjs";
import { HarnessError } from "./errors.mjs";

export async function waitForHttp(url, label, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = "";
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new HarnessError(`${label} did not become ready at ${url}: ${lastError}`, "failed-startup");
}

export function assertHttpStatus(result, expected, label) {
  const firstLine = result.stdout.split(/\r?\n/).find((line) => line.startsWith("HTTP/"));
  if (!firstLine || !firstLine.includes(` ${expected} `)) {
    throw new HarnessError(`${label} expected HTTP ${expected}, got ${firstLine || "no HTTP status line"}`, "failed-backend-contract");
  }
}

export function assertNoInternalMarkers(text, label) {
  const leaked = INTERNAL_FIELD_MARKERS.filter((field) => text.includes(field));
  if (leaked.length > 0) {
    throw new HarnessError(`${label} leaked internal markers: ${leaked.join(", ")}`, "failed-privacy-contract");
  }
}

export async function runCurlChecks(commands, evidenceDir, provider) {
  console.log("running backend curl checks");
  const health = await runCommand(commands.curlHealth, { timeoutMs: 30000, env: provider.env });
  await writeCommandArtifact(join(evidenceDir, "task-7-health.txt"), health);
  assertHttpStatus(health, 200, "GET /health");

  const chat = await runCommand(commands.curlChat, { timeoutMs: 30000, env: provider.env });
  await writeCommandArtifact(join(evidenceDir, "task-7-chat.txt"), chat);
  assertHttpStatus(chat, 200, "POST /chat happy path");
  for (const term of ["assistant_message", "active_agent", "public_context", "events"]) {
    if (!chat.stdout.includes(term)) {
      throw new HarnessError(`POST /chat happy path missing response term: ${term}`, "failed-backend-contract");
    }
  }
  assertNoInternalMarkers(chat.stdout, "POST /chat happy path response");

  const guardrail = await runCommand(commands.curlGuardrail, { timeoutMs: 30000, env: provider.env });
  await writeCommandArtifact(join(evidenceDir, "task-7-guardrail.txt"), guardrail);
  assertHttpStatus(guardrail, 200, "POST /chat guardrail path");
  for (const term of ["blocked", "guardrail"]) {
    if (!guardrail.stdout.includes(term)) {
      throw new HarnessError(`POST /chat guardrail path missing response term: ${term}`, "failed-backend-contract");
    }
  }

  const malformed = await runCommand(commands.curlMalformed, { timeoutMs: 30000, env: provider.env });
  const badShape = await runCommand(commands.curlBadShape, { timeoutMs: 30000, env: provider.env });
  await writeFile(join(evidenceDir, "task-7-422.txt"), formatMultiArtifact([malformed, badShape]), "utf8");
  assertHttpStatus(malformed, 422, "POST /chat malformed path");
  assertHttpStatus(badShape, 422, "POST /chat bad shape path");

  const unknownThread = await runCommand(commands.curlUnknownThread, { timeoutMs: 30000, env: provider.env });
  await writeCommandArtifact(join(evidenceDir, "task-7-unknown-thread.txt"), unknownThread);
  assertHttpStatus(unknownThread, 200, "GET /state unknown thread");
  for (const term of ['"messages":[]', '"events":[]', '"public_context"']) {
    if (!unknownThread.stdout.includes(term)) {
      throw new HarnessError(`GET /state unknown thread missing empty mock state term: ${term}`, "failed-backend-contract");
    }
  }
  assertNoInternalMarkers(unknownThread.stdout, "GET /state unknown thread response");

  const sse = await runCommand(commands.curlSse, { timeoutMs: 10000, env: provider.env, allowFailure: true });
  const postSseHealth = await waitForStreamListenerCleanup(commands.curlHealth, provider);
  await writeFile(join(evidenceDir, "task-7-sse.txt"), formatSseArtifact(sse, postSseHealth), "utf8");
  if (!sse.stdout.includes("event: state.snapshot")) {
    throw new HarnessError("GET /state/stream missing state.snapshot event", "failed-backend-contract");
  }
  if (!sse.stdout.includes("event: state.delta")) {
    throw new HarnessError("GET /state/stream missing state.delta event", "failed-backend-contract");
  }
  if (!postSseHealth.stdout.includes('"active_stream_listeners":0')) {
    throw new HarnessError("GET /state/stream did not unregister listener after disconnect", "failed-backend-contract");
  }
  assertNoInternalMarkers(sse.stdout, "GET /state/stream response");
}

async function waitForStreamListenerCleanup(command, provider) {
  let lastHealth = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    lastHealth = await runCommand(command, { timeoutMs: 30000, env: provider.env });
    if (lastHealth.stdout.includes('"active_stream_listeners":0')) {
      return lastHealth;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  return lastHealth;
}

function formatSseArtifact(sse, postSseHealth) {
  return [
    `$ ${sse.command}`,
    `exit=${sse.code}`,
    sse.signal ? `signal=${sse.signal}` : "",
    "--- stdout ---",
    sse.stdout.trimEnd(),
    "--- stderr ---",
    sse.stderr.trimEnd(),
    "--- post-disconnect health ---",
    `$ ${postSseHealth.command}`,
    `exit=${postSseHealth.code}`,
    postSseHealth.stdout.trimEnd(),
    postSseHealth.stderr.trimEnd(),
    "",
  ].filter((line) => line !== "").join("\n");
}

function formatMultiArtifact(results) {
  return results.map((result) => [
    `$ ${result.command}`,
    `exit=${result.code}`,
    result.signal ? `signal=${result.signal}` : "",
    "--- stdout ---",
    result.stdout.trimEnd(),
    "--- stderr ---",
    result.stderr.trimEnd(),
    "",
  ].filter((line) => line !== "").join("\n")).join("\n");
}
