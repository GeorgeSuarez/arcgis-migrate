import type { Node } from "ts-morph";
import type { Finding, RuleDefinition } from "../types.js";

export function makeFinding(
  node: Node,
  rule: RuleDefinition,
  message: string,
  suggestion?: string,
): Omit<Finding, "file"> {
  const sourceFile = node.getSourceFile();
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
  const firstLine = node.getText().split("\n")[0]?.trim() ?? "";

  return {
    ruleId: rule.id,
    ruleTitle: rule.title,
    severity: rule.severity,
    message,
    suggestion,
    line,
    column,
    snippet: firstLine.slice(0, 180),
    effortHours: rule.effortHours,
  };
}

export function lastIdentifier(text: string): string {
  return text.split(".").pop()?.trim() ?? text.trim();
}

export function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}
