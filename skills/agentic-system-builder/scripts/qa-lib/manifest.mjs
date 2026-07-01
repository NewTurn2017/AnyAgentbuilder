import { join } from "node:path";
import { writeFile } from "node:fs/promises";

export async function writeManifest(evidenceDir, manifest) {
  const manifestPath = join(evidenceDir, "run-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}
