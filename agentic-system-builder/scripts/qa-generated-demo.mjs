#!/usr/bin/env node
import { join, resolve } from "node:path";
import { parseArgs, modeFromArgs } from "./qa-lib/args.mjs";
import { requireBrowserQaDependency, runBrowserQa } from "./qa-lib/browser-qa.mjs";
import { buildPlannedCommands, commandLabel } from "./qa-lib/commands.mjs";
import { ensureEvidenceDir } from "./qa-lib/fs-utils.mjs";
import { waitForHttp, runCurlChecks } from "./qa-lib/http-checks.mjs";
import { ensureBackendDependencies, ensureFrontendDependencies, runSetup } from "./qa-lib/lifecycle.mjs";
import { writeManifest } from "./qa-lib/manifest.mjs";
import { cleanupProcesses, startManagedProcess } from "./qa-lib/processes.mjs";
import { freePort } from "./qa-lib/ports.mjs";
import { makeProviderEnv, requireMockRuntime } from "./qa-lib/provider-security.mjs";

function printDryRun(manifest) {
  console.log("DRY RUN: generated-demo QA harness lifecycle plan");
  console.log(`scenario=${manifest.scenario}`);
  console.log(`mode=${manifest.mode}`);
  console.log(`backendPort=${manifest.backendPort}`);
  console.log(`frontendPort=${manifest.frontendPort}`);
  console.log("planned commands:");
  for (const [name, command] of Object.entries(manifest.commands)) {
    console.log(`- ${name}: (cwd ${command.cwd}) ${commandLabel(command)}`);
  }
  console.log("cleanup handlers:");
  for (const handler of manifest.cleanupHandlers) {
    console.log(`- ${handler}`);
  }
  console.log("DRY RUN: no servers started, no dependency installs performed");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidenceDir = resolve(args.evidence);
  ensureEvidenceDir(evidenceDir);
  const provider = makeProviderEnv();
  requireMockRuntime(provider);

  const backendPort = await freePort();
  const frontendPort = await freePort();
  const commands = buildPlannedCommands(backendPort, frontendPort);
  const manifest = {
    scenario: args.scenario,
    mode: modeFromArgs(args),
    dryRun: args.dryRun,
    runtime: "mock",
    backendPort,
    frontendPort,
    backendPid: null,
    frontendPid: null,
    commands,
    cleanupHandlers: ["SIGINT/SIGTERM process-group termination", "PID liveness receipt", "lsof listener receipt"],
    providerCredentialsScrubbed: provider.scrubbed,
    openaiImportAttempted: null,
    openaiCalls: null,
    mockProviderBoundary: null,
    generatedAppChecked: false,
    status: "initializing",
  };
  const state = { backendProcess: null, frontendProcess: null };
  const manifestPath = join(evidenceDir, "run-manifest.json");

  let cleanupOk = true;
  let finalError = null;
  let cleaning = false;
  const runCleanup = async () => {
    if (cleaning) return true;
    cleaning = true;
    cleanupOk = await cleanupProcesses(state, evidenceDir, manifest);
    await writeManifest(evidenceDir, manifest);
    return cleanupOk;
  };

  const handleSignal = (signal) => {
    manifest.status = `interrupted-${signal}`;
    runCleanup().finally(() => process.exit(130));
  };
  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);

  try {
    await writeManifest(evidenceDir, manifest);
    if (args.dryRun) {
      manifest.status = "dry-run";
      await writeManifest(evidenceDir, manifest);
      printDryRun(manifest);
      return;
    }

    await runSetup(commands, manifest, provider);
    await writeManifest(evidenceDir, manifest);
    await ensureBackendDependencies(commands, provider);

    manifest.status = "starting-backend";
    state.backendProcess = await startManagedProcess(commands.backendStart, manifest, "backend", join(evidenceDir, "task-7-backend-process.txt"), provider);
    await writeManifest(evidenceDir, manifest);
    await waitForHttp(`http://127.0.0.1:${backendPort}/health`, "generated backend");

    if (manifest.mode !== "browser") {
      await runCurlChecks(commands, evidenceDir, provider);
    }

    if (manifest.mode !== "backend") {
      await ensureFrontendDependencies(commands, provider, evidenceDir);
      manifest.status = "checking-browser-dependency";
      await requireBrowserQaDependency();
      await writeManifest(evidenceDir, manifest);
      manifest.status = "starting-frontend";
      state.frontendProcess = await startManagedProcess(commands.frontendStart, manifest, "frontend", join(evidenceDir, "task-7-frontend-process.txt"), provider);
      await writeManifest(evidenceDir, manifest);
      await waitForHttp(`http://127.0.0.1:${frontendPort}`, "generated frontend");
      await runBrowserQa(frontendPort, evidenceDir);
    }

    manifest.status = "passed";
    await writeManifest(evidenceDir, manifest);
  } catch (error) {
    finalError = error;
    manifest.status = error.status || "failed";
    manifest.error = error.message;
    if (error.boundaryReport) {
      manifest.mockProviderBoundary = error.boundaryReport;
      manifest.openaiImportAttempted = error.boundaryReport.findings.length > 0;
      manifest.openaiCalls = error.boundaryReport.findings.some((item) => item.kind.includes("call"));
    }
    await writeManifest(evidenceDir, manifest);
  } finally {
    cleanupOk = await runCleanup();
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
  }

  console.log(`manifest: ${manifestPath}`);
  console.log(`cleanup: ${cleanupOk ? "ok" : "failed"}`);
  if (finalError) {
    console.error(`ERROR: ${finalError.message}`);
    process.exitCode = 1;
  } else if (!cleanupOk) {
    console.error("ERROR: cleanup verification failed; see task-7-cleanup-pids.txt and task-7-cleanup-ports.txt");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
