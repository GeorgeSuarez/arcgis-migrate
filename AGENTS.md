# AGENTS.md

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm run scan:fixture
npm run dev -- scan tests/fixtures
```

## Architecture

- `src/cli.ts` — Commander CLI, path/file handling, `--fail-on` exit policy.
- `src/scanner.ts` — `fast-glob` discovery, `ts-morph` `Project`, dedupe, summary.
- `src/rules/imports.ts` — import-level rules and `ImportFacts`.
- `src/rules/usage.ts` — constructor/call/JSX/string/`__esri` rules.
- `src/rules/meta.ts` — rule ids, titles, severities, effort estimates.
- `src/report.ts` — Markdown and JSON output.
- `src/policy.ts` — `shouldFail(summary, failOn)`.
- `tests/fixtures/` — files parsed as data; they are intentionally excluded from `tsc` because they import packages that are not installed.

## Add a rule

1. Add a `RuleDefinition` to `src/rules/meta.ts`.
2. Implement the check in `src/rules/imports.ts` or `src/rules/usage.ts`.
3. Emit it with `makeFinding(node, RULES.yourRule, message, suggestion)`.
4. Add a fixture and an assertion in `tests/scanner.test.ts`.
5. Run `npm run typecheck && npm test`.

## Conventions

- Rules are static-analysis only: no network, no browser, no SDK runtime.
- Every finding needs a line/column, a rule id, and a suggested migration.
- Keep false positives low; prefer a missed dynamic case over a noisy report.
- The scanner is read-only. Do not add file writes outside `--output`.
- Effort hours are rough triage values, not estimates.
