export type Severity = "error" | "warning" | "info";

export type FailOn = "none" | "warning" | "error";

export interface RuleDefinition {
  id: string;
  title: string;
  severity: Severity;
  effortHours: number;
}

export interface Finding {
  ruleId: string;
  ruleTitle: string;
  severity: Severity;
  message: string;
  suggestion?: string;
  file: string;
  line: number;
  column: number;
  snippet?: string;
  effortHours: number;
}

export interface ScanOptions {
  cwd: string;
  include?: string[];
  exclude?: string[];
  maxFiles?: number;
}

export interface ScanSummary {
  filesScanned: number;
  filesWithFindings: number;
  total: number;
  errors: number;
  warnings: number;
  info: number;
  effortHours: number;
  durationMs: number;
}

export interface ScanResult {
  summary: ScanSummary;
  findings: Finding[];
}
