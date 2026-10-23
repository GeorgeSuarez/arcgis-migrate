import type { FailOn, ScanSummary } from "./types.js";

export function shouldFail(summary: ScanSummary, failOn: FailOn): boolean {
  if (failOn === "error") return summary.errors > 0;
  if (failOn === "warning") return summary.errors + summary.warnings > 0;
  return false;
}
