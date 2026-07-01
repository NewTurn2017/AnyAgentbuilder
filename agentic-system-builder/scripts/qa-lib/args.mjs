import { EVIDENCE_DEFAULT } from "./paths.mjs";
import { HarnessError } from "./errors.mjs";

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new HarnessError(`${flag} requires a value`, "failed-malformed-input");
  }
  return value;
}

export function parseArgs(argv) {
  const parsed = {
    backendOnly: false,
    browserOnly: false,
    scenario: "library",
    evidence: EVIDENCE_DEFAULT,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--backend-only") {
      parsed.backendOnly = true;
    } else if (arg === "--browser-only") {
      parsed.browserOnly = true;
    } else if (arg === "--scenario") {
      parsed.scenario = readValue(argv, ++index, arg);
    } else if (arg === "--evidence") {
      parsed.evidence = readValue(argv, ++index, arg);
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else {
      throw new HarnessError(`unknown flag or argument: ${arg}`, "failed-malformed-input");
    }
  }

  if (parsed.backendOnly && parsed.browserOnly) {
    throw new HarnessError("choose at most one of --backend-only or --browser-only", "failed-malformed-input");
  }
  if (!/^[a-z0-9_-]+$/i.test(parsed.scenario)) {
    throw new HarnessError(`invalid --scenario value: ${parsed.scenario}`, "failed-malformed-input");
  }
  if (parsed.scenario !== "library") {
    throw new HarnessError(`unsupported --scenario value: ${parsed.scenario}; only library is wired for generated-demo QA`, "failed-malformed-input");
  }

  return parsed;
}

export function modeFromArgs(args) {
  if (args.backendOnly) return "backend";
  if (args.browserOnly) return "browser";
  return "full";
}
