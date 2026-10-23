export { scanProject, summarize } from "./scanner.js";
export { formatJson, formatMarkdown, formatSummaryLine } from "./report.js";
export { shouldFail } from "./policy.js";
export type {
  FailOn,
  Finding,
  ScanOptions,
  ScanResult,
  ScanSummary,
  Severity,
} from "./types.js";
