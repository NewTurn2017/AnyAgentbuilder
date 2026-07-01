import { access } from "node:fs/promises";
import { mkdirSync } from "node:fs";

export function ensureEvidenceDir(path) {
  mkdirSync(path, { recursive: true });
}

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
