import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { BACKEND_ROOT, GENERATED_ROOT } from "./paths.mjs";
import { runCommand } from "./processes.mjs";
import { pathExists } from "./fs-utils.mjs";
import { assertMockProviderSafe } from "./provider-security.mjs";

export async function runSetup(commands, manifest, provider) {
  console.log("running validator: skill structure");
  await runCommand(commands.validateSkill, { timeoutMs: 60000, env: provider.env });
  console.log("running validator: examples");
  await runCommand(commands.validateExamples, { timeoutMs: 60000, env: provider.env });
  console.log("scaffolding generated library demo from current templates");
  await runCommand(commands.scaffoldLibrary, { timeoutMs: 60000, env: provider.env });
  console.log("running validator: generated app contract");
  await runCommand(commands.validateGenerated, { timeoutMs: 60000, env: provider.env });
  const boundaryReport = assertMockProviderSafe(BACKEND_ROOT);
  manifest.mockProviderBoundary = boundaryReport;
  manifest.openaiImportAttempted = boundaryReport.findings.length > 0;
  manifest.openaiCalls = boundaryReport.findings.some((item) => item.kind.includes("call"));
  manifest.generatedAppChecked = true;
}

export async function ensureBackendDependencies(commands, provider) {
  if (!(await pathExists(join(GENERATED_ROOT, ".venv/bin/python")))) {
    console.log("installing backend dependency environment locally: generated/library-reservation-demo/.venv");
    await runCommand(commands.backendVenv, { timeoutMs: 120000, env: provider.env });
  }
  console.log("installing backend dependencies locally from backend/requirements.txt");
  await runCommand(commands.backendInstall, { timeoutMs: 180000, env: provider.env });
}

export async function ensureFrontendDependencies(commands, provider, evidenceDir = null) {
  console.log("installing frontend dependencies locally in generated/library-reservation-demo/frontend");
  const install = await runCommand(commands.frontendInstall, { timeoutMs: 180000, env: provider.env });
  console.log("installing browser runtime locally via generated frontend Playwright");
  const browserInstall = await runCommand(commands.frontendBrowserInstall, { timeoutMs: 180000, env: provider.env });
  if (evidenceDir) {
    await writeInstallArtifact(join(evidenceDir, "task-8-install.txt"), [install, browserInstall]);
  }
}

async function writeInstallArtifact(path, results) {
  const sections = results.map((result) => [
    `$ ${result.command}`,
    `exit=${result.code}`,
    result.signal ? `signal=${result.signal}` : "",
    "--- stdout ---",
    result.stdout.trimEnd(),
    "--- stderr ---",
    result.stderr.trimEnd(),
    "",
  ].filter((line) => line !== "").join("\n"));
  await writeFile(path, sections.join("\n"), "utf8");
}
