import { describe, expect, it } from "vitest";
import { shouldFail } from "../src/policy.js";
import type { ScanSummary } from "../src/types.js";

const base: ScanSummary = {
  filesScanned: 1,
  filesWithFindings: 1,
  total: 0,
  errors: 0,
  warnings: 0,
  info: 0,
  effortHours: 0,
  durationMs: 0,
};

describe("shouldFail", () => {
  it("never fails on none", () => {
    expect(shouldFail({ ...base, errors: 1, warnings: 1 }, "none")).toBe(false);
  });

  it("fails on errors only when requested", () => {
    expect(shouldFail({ ...base, errors: 1 }, "error")).toBe(true);
    expect(shouldFail({ ...base, warnings: 1 }, "error")).toBe(false);
  });

  it("fails on errors or warnings when requested", () => {
    expect(shouldFail({ ...base, errors: 1 }, "warning")).toBe(true);
    expect(shouldFail({ ...base, warnings: 1 }, "warning")).toBe(true);
    expect(shouldFail({ ...base, info: 1 }, "warning")).toBe(false);
  });
});
