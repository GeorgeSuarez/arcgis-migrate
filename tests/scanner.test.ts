import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { formatJson, formatMarkdown } from "../src/report.js";
import { scanProject } from "../src/scanner.js";

const fixturesDir = fileURLToPath(new URL("./fixtures", import.meta.url));

describe("scanProject", () => {
  it("finds widget-era patterns", async () => {
    const result = await scanProject({
      cwd: fixturesDir,
      include: ["widget-app.tsx"],
    });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    expect(result.summary.filesScanned).toBe(1);
    expect(result.summary.errors).toBeGreaterThan(0);
    expect(ruleIds).toContain("mapview-import");
    expect(ruleIds).toContain("mapview-usage");
    expect(ruleIds).toContain("container-property");
    expect(ruleIds).toContain("widget-import");
    expect(ruleIds).toContain("widget-usage");
    expect(ruleIds).toContain("widget-position-property");
    expect(ruleIds).toContain("widget-viewmodel-property");
    expect(ruleIds).toContain("viewmodel-import");
    expect(ruleIds).toContain("viewmodel-usage");
    expect(ruleIds).toContain("ui-add");
    expect(ruleIds).toContain("view-when");
    expect(ruleIds).toContain("view-event-name");
    expect(ruleIds).toContain("esri-namespace");
    expect(ruleIds).toContain("esri-widget-class");
    expect(ruleIds).toContain("theme-css-import");
  });

  it("does not flag a component-based app", async () => {
    const result = await scanProject({
      cwd: fixturesDir,
      include: ["component-app.tsx"],
    });

    expect(result.findings).toEqual([]);
    expect(result.summary.total).toBe(0);
    expect(result.summary.filesScanned).toBe(1);
  });

  it("finds AMD and legacy loader usage", async () => {
    const result = await scanProject({
      cwd: fixturesDir,
      include: ["amd-app.js"],
    });
    const ruleIds = result.findings.map((finding) => finding.ruleId);

    expect(ruleIds).toContain("amd-require");
    expect(ruleIds).toContain("mapview-usage");
    expect(ruleIds).toContain("view-when");
  });

  it("tracks a view stored in a non-obvious variable name", async () => {
    const result = await scanProject({
      cwd: fixturesDir,
      include: ["view-var.ts"],
    });
    const ruleIds = result.findings.map((finding) => finding.ruleId);

    expect(ruleIds).toContain("view-when");
    expect(ruleIds).toContain("view-event-name");
  });

  it("formats markdown and JSON reports", async () => {
    const result = await scanProject({
      cwd: fixturesDir,
      include: ["widget-app.tsx"],
    });

    const markdown = formatMarkdown(result);
    expect(markdown).toContain("# ArcGIS migration scan");
    expect(markdown).toContain("Findings by file");
    expect(markdown).toContain("Estimated effort");

    const parsed = JSON.parse(formatJson(result)) as {
      tool: string;
      summary: { total: number };
      findings: unknown[];
    };
    expect(parsed.tool).toBe("arcgis-migrate");
    expect(parsed.summary.total).toBe(result.findings.length);
    expect(parsed.findings).toHaveLength(result.findings.length);
  });
});
