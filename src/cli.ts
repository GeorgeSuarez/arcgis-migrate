#!/usr/bin/env node
import { Command, Option } from "commander";
import { writeFileSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import pc from "picocolors";
import { shouldFail } from "./policy.js";
import { formatJson, formatMarkdown } from "./report.js";
import { scanProject } from "./scanner.js";
import type { FailOn } from "./types.js";
import { getVersion } from "./version.js";

const program = new Command();

program
  .name("arcgis-migrate")
  .description(
    "Scan an ArcGIS Maps SDK for JavaScript app for widget-era patterns before the 6.0 component migration.",
  )
  .version(getVersion())
  .showHelpAfterError();

program
  .command("scan")
  .description("Scan a file or directory and print a migration report.")
  .argument("[path]", "file or directory to scan", ".")
  .addOption(
    new Option("-f, --format <format>", "report format")
      .choices(["markdown", "json"])
      .default("markdown"),
  )
  .option("-o, --output <file>", "write the report to a file instead of stdout")
  .option("--include <glob>", "include glob (repeatable)", collect, [])
  .option("--exclude <glob>", "exclude glob (repeatable)", collect, [])
  .option(
    "--max-files <number>",
    "maximum number of files to scan",
    (value) => Number.parseInt(value, 10),
    2000,
  )
  .addOption(
    new Option("--fail-on <level>", "exit non-zero on findings")
      .choices(["none", "warning", "error"])
      .default("none"),
  )
  .option("--no-color", "disable colored status output")
  .action(
    async (
      target: string,
      options: {
        format: "markdown" | "json";
        output?: string;
        include: string[];
        exclude: string[];
        maxFiles: number;
        failOn: FailOn;
        color: boolean;
      },
    ) => {
      const status = createStatus(options.color);

      try {
        const absolute = resolve(target);
        const stat = statSync(absolute);
        const isFile = stat.isFile();
        const cwd = isFile ? dirname(absolute) : absolute;
        const include = isFile ? [basename(absolute)] : options.include;

        if (!Number.isFinite(options.maxFiles) || options.maxFiles <= 0) {
          throw new Error("--max-files must be a positive number");
        }

        status(`Scanning ${cwd} ...`);
        const result = await scanProject({
          cwd,
          include,
          exclude: options.exclude,
          maxFiles: options.maxFiles,
        });

        const report =
          options.format === "json" ? formatJson(result) : formatMarkdown(result);

        if (options.output) {
          const outputPath = resolve(options.output);
          writeFileSync(outputPath, report, "utf8");
          status(`Wrote ${outputPath}`);
        } else {
          process.stdout.write(report + "\n");
        }

        if (shouldFail(result.summary, options.failOn)) {
          process.exitCode = 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(pc.red(`arcgis-migrate failed: ${message}`) + "\n");
        process.exitCode = 1;
      }
    },
  );

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(pc.red(`arcgis-migrate failed: ${message}`) + "\n");
  process.exitCode = 1;
});

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function createStatus(color: boolean): (message: string) => void {
  return (message: string) => {
    process.stderr.write((color ? pc.dim(message) : message) + "\n");
  };
}
