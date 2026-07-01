import { createWriteStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { ROOT } from "./paths.mjs";
import { commandLabel } from "./commands.mjs";
import { HarnessError } from "./errors.mjs";

export function spawnChild(command, options = {}) {
  const child = spawn(command.bin, command.args, {
    cwd: command.cwd,
    env: commandEnv(command, options.env || process.env),
    detached: process.platform !== "win32",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (command.input) {
    child.stdin.end(command.input);
  } else {
    child.stdin.end();
  }
  return child;
}

export async function runCommand(command, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const env = commandEnv(command, options.env || process.env);
  return await new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command.bin, command.args, {
      cwd: command.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1500).unref();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectCommand(new HarnessError(`failed to start ${commandLabel(command)}: ${error.message}`, "failed-command-start"));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const result = { code, signal, stdout, stderr, command: commandLabel(command) };
      if (timedOut) {
        rejectCommand(new HarnessError(`command timed out after ${timeoutMs}ms: ${commandLabel(command)}`, "failed-timeout"));
        return;
      }
      if (!options.allowFailure && code !== 0) {
        rejectCommand(new HarnessError(`command failed (${code ?? signal}): ${commandLabel(command)}\n${stderr || stdout}`, "failed-command"));
        return;
      }
      resolveCommand(result);
    });
    if (command.input) {
      child.stdin.end(command.input);
    } else {
      child.stdin.end();
    }
  });
}

function commandEnv(command, baseEnv) {
  return {
    ...baseEnv,
    ...(command.env || {}),
  };
}

export async function writeCommandArtifact(path, result) {
  const content = [
    `$ ${result.command}`,
    `exit=${result.code}`,
    result.signal ? `signal=${result.signal}` : "",
    "--- stdout ---",
    result.stdout.trimEnd(),
    "--- stderr ---",
    result.stderr.trimEnd(),
    "",
  ].filter((line) => line !== "").join("\n");
  await writeFile(path, content);
}

export async function startManagedProcess(command, manifest, manifestKey, logPath, provider) {
  await writeFile(logPath, `$ ${commandLabel(command)}\n`, "utf8");
  const child = spawnChild(command, { env: provider.env });
  manifest[`${manifestKey}Pid`] = child.pid || null;
  manifest[`${manifestKey}Command`] = commandLabel(command);
  const logStream = createWriteStream(logPath, { flags: "a" });
  child.stdout.pipe(logStream, { end: false });
  child.stderr.pipe(logStream, { end: false });
  child.on("exit", (code, signal) => {
    logStream.write(`\n[process exit] code=${code} signal=${signal}\n`);
    logStream.end();
  });
  child.on("error", (error) => {
    logStream.write(`\n[process error] ${error.message}\n`);
  });
  return child;
}

export function processStillAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function stopProcess(child, label) {
  if (!child || !child.pid) return `${label}: not-started`;
  if (!processStillAlive(child.pid)) return `${label}: pid ${child.pid} already-exited`;
  const killTarget = process.platform === "win32" ? child.pid : -child.pid;
  try {
    process.kill(killTarget, "SIGTERM");
  } catch (error) {
    return `${label}: pid ${child.pid} SIGTERM skipped (${error.message})`;
  }
  const exited = await new Promise((resolveExit) => {
    const timer = setTimeout(() => resolveExit(false), 4000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolveExit(true);
    });
  });
  if (!exited && processStillAlive(child.pid)) {
    try {
      process.kill(killTarget, "SIGKILL");
    } catch {
      // The process may have exited between the liveness check and SIGKILL.
    }
  }
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  return `${label}: pid ${child.pid} alive=${processStillAlive(child.pid)}`;
}

async function lsofPort(port) {
  if (!port) return { stdout: "", stderr: "", code: 0, command: "lsof skipped" };
  const command = {
    cwd: ROOT,
    bin: "lsof",
    args: ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"],
  };
  return await runCommand(command, { timeoutMs: 10000, allowFailure: true });
}

export async function cleanupProcesses(state, evidenceDir, manifest) {
  const lines = [];
  lines.push(await stopProcess(state.frontendProcess, "frontend"));
  lines.push(await stopProcess(state.backendProcess, "backend"));

  const pidChecks = [];
  for (const [label, pid] of [["backend", manifest.backendPid], ["frontend", manifest.frontendPid]]) {
    pidChecks.push(`${label} pid=${pid ?? "null"} alive=${processStillAlive(pid)}`);
  }
  const pidReceipt = `${lines.join("\n")}\n${pidChecks.join("\n")}\n`;
  await writeFile(join(evidenceDir, "task-7-cleanup-pids.txt"), pidReceipt);
  await writeFile(join(evidenceDir, "task-8-cleanup-pids.txt"), pidReceipt);

  const portResults = [];
  for (const [label, port] of [["backend", manifest.backendPort], ["frontend", manifest.frontendPort]]) {
    const result = await lsofPort(port);
    portResults.push(`$ ${result.command || `lsof -nP -iTCP:${port} -sTCP:LISTEN`}`);
    portResults.push(`${label} port=${port ?? "null"} listener=${result.stdout.trim() ? "yes" : "no"}`);
    if (result.stdout.trim()) {
      portResults.push(result.stdout.trimEnd());
    }
    if (result.stderr.trim()) {
      portResults.push(result.stderr.trimEnd());
    }
  }
  const portReceipt = `${portResults.join("\n")}\n`;
  await writeFile(join(evidenceDir, "task-7-cleanup-ports.txt"), portReceipt);
  await writeFile(join(evidenceDir, "task-8-cleanup-ports.txt"), portReceipt);

  const leakedPid = [manifest.backendPid, manifest.frontendPid].some((pid) => processStillAlive(pid));
  const leakedPort = portResults.some((line) => /listener=yes/.test(line));
  manifest.cleanup = {
    pidReceipt: manifest.mode === "browser" ? "task-8-cleanup-pids.txt" : "task-7-cleanup-pids.txt",
    portReceipt: manifest.mode === "browser" ? "task-8-cleanup-ports.txt" : "task-7-cleanup-ports.txt",
    ok: !leakedPid && !leakedPort,
  };
  return manifest.cleanup.ok;
}
