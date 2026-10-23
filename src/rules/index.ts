import type { SourceFile } from "ts-morph";
import type { Finding } from "../types.js";
import { scanImports } from "./imports.js";
import { scanUsage } from "./usage.js";

export function scanSourceFile(sourceFile: SourceFile, file: string): Finding[] {
  const findings: Finding[] = [];
  const add = (finding: Omit<Finding, "file">) => findings.push({ ...finding, file });

  const facts = scanImports(sourceFile, add);
  scanUsage(sourceFile, facts, add);

  return findings;
}
