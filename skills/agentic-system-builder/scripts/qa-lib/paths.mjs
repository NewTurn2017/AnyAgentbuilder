import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
export const GENERATED_ROOT = join(ROOT, "generated/library-reservation-demo");
export const BACKEND_ROOT = join(GENERATED_ROOT, "backend");
export const FRONTEND_ROOT = join(GENERATED_ROOT, "frontend");
export const EVIDENCE_DEFAULT = ".omo/evidence/any-agent-system-builder";

export const INTERNAL_FIELD_MARKERS = [
  "member_id",
  "internal_notes",
  "policy_overrides",
  "raw_hold_queue",
  "staff_token",
  "inventory_cost",
];
