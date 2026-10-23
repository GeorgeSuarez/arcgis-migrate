import fg from "fast-glob";
import { relative, resolve } from "node:path";
import { Project, ts } from "ts-morph";
import { scanSourceFile } from "./rules/index.js";
import type { Finding, ScanOptions, ScanResult, ScanSummary } from "./types.js";

export const DEFAULT_INCLUDE = ["**/*.{ts,tsx,js,jsx,mjs,cjs}"];

export const DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/.git/**",
];

const DEFAULT_MAX_FILES = 2000;

export async function scanProject(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now();
  const cwd = resolve(options.cwd);
  const include = options.include?.length ? options.include : DEFAULT_INCLUDE;
  const exclude = [...DEFAULT_EXCLUDE, ...(options.exclude ?? [])];
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;

  const matched = await fg(include, {
    cwd,
    ignore: exclude,
    absolute: true,
    onlyFiles: true,
    unique: true,
    dot: false,
  });
  const files = matched.slice(0, maxFiles);

  const project = new Project({
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      noEmit: true,
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    useInMemoryFileSystem: false,
  });

  const findings: Finding[] = [];

  for (const file of files) {
    const relativeFile = relative(cwd, file).split("\\").join("/");
    try {
      const sourceFile = project.addSourceFileAtPath(file);
      findings.push(...scanSourceFile(sourceFile, relativeFile));
    } catch (error) {
      findings.push({
        ruleId: "parse-error",
        ruleTitle: "Parse error",
        severity: "info",
        message: `Could not parse this file: ${error instanceof Error ? error.message : String(error)}`,
        file: relativeFile,
        line: 1,
        column: 1,
        effortHours: 0,
      });
    }
  }

  const unique = dedupe(findings);
  unique.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.ruleId.localeCompare(b.ruleId),
  );

  return {
    summary: summarize(unique, files.length, performance.now() - started),
    findings: unique,
  };
}

export function summarize(
  findings: Finding[],
  filesScanned: number,
  durationMs: number,
): ScanSummary {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const info = findings.filter((finding) => finding.severity === "info").length;
  const effortHours =
    Math.round(findings.reduce((total, finding) => total + finding.effortHours, 0) * 100) / 100;

  return {
    filesScanned,
    filesWithFindings: new Set(findings.map((finding) => finding.file)).size,
    total: findings.length,
    errors,
    warnings,
    info,
    effortHours,
    durationMs,
  };
}

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.line}:${finding.column}:${finding.ruleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
