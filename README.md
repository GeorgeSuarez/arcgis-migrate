# arcgis-migrate

Find widget-era code in an ArcGIS Maps SDK for JavaScript app before the 6.0 component migration.

## Why

- All ArcGIS Maps SDK widgets are deprecated as of **5.0**.
- **6.0** is planned for **Q1 2027** and is the removal point for widgets and the `__esri` TypeScript namespace; AMD `require()` is deprecated and may also be removed.
- The migration is not a rename. `MapView` becomes `<arcgis-map>`, `view.ui.add()` becomes slots, view events become `arcgis*` events, theme CSS becomes Calcite modes, and many view models have no public replacement yet.
- Teams need a quick inventory before they can plan the work. This CLI produces that inventory from the AST, not from a fragile text search.

## Quick start

```bash
npm install
npm run build

# scan a directory
node dist/cli.js scan ./src

# scan a single file
node dist/cli.js scan ./src/App.tsx

# JSON for CI
node dist/cli.js scan ./src --format json --output migration-report.json

# fail CI if anything error-level is found
node dist/cli.js scan ./src --fail-on error
```

During development:

```bash
npm run dev -- scan tests/fixtures
npm run scan:fixture
```

After `npm link` or publishing (remove `"private": true` first):

```bash
npx arcgis-migrate scan ./src
```

See [`docs/example-report.md`](./docs/example-report.md) for a full report.

## What it finds

| Rule                        | Severity | Finds                                                    | Migration hint                                                         |
| --------------------------- | -------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `mapview-import`            | warning  | `@arcgis/core/views/MapView.js` / `SceneView.js` imports | Prefer `<arcgis-map>` / `<arcgis-scene>` for new code                  |
| `mapview-usage`             | warning  | `new MapView()` / `new SceneView()`                      | Prefer the map/scene component; keep MapView for custom view workflows |
| `container-property`        | warning  | `container` in a view constructor                        | Remove it; the component element is the container                      |
| `widget-import`             | error    | `@arcgis/core/widgets/*` imports                         | Use the matching `arcgis-*` component                                  |
| `widget-usage`              | error    | `new Search()`, `new Legend()`, etc.                     | Replace with the component                                             |
| `widget-position-property`  | warning  | `position` in a widget constructor                       | Use `slot="top-right"`                                                 |
| `widget-viewmodel-property` | warning  | `viewModel` in a widget constructor                      | Check the view-model roadmap                                           |
| `viewmodel-import`          | warning  | `*ViewModel.js` imports                                  | Many view models have no public replacement yet                        |
| `viewmodel-usage`           | warning  | `new *ViewModel()`                                       | Check the view-model roadmap                                           |
| `ui-add`                    | warning  | `view.ui.add/remove/move/empty`                          | Use slotted components                                                 |
| `view-when`                 | warning  | `view.when()`                                            | `viewOnReady()` or `arcgisViewReadyChange`                             |
| `view-event-name`           | warning  | Common view events, e.g. `"click"`                       | `arcgisViewClick` and friends                                          |
| `position-attribute`        | warning  | JSX `position` attribute                                 | Use `slot`                                                             |
| `esri-namespace`            | warning  | `__esri` type references                                 | Import types from ESM module files                                     |
| `amd-require`               | error    | `require(["esri/..."])`                                  | ESM or `$arcgis.import()`                                              |
| `esri-loader-import`        | error    | `esri-loader` imports                                    | ESM or `$arcgis.import()`                                              |
| `esri-loader-usage`         | error    | `loadModules()`                                          | ESM or `$arcgis.import()`                                              |
| `theme-css-import`          | warning  | `@arcgis/core/assets/esri/themes/*` CSS                  | Calcite light/dark modes                                               |
| `esri-widget-class`         | warning  | `esri-widget` CSS class                                  | Calcite components and CSS variables                                   |

## Example output

```text
# ArcGIS migration scan

Scanned 4 files in 0.02s.

Found 27 findings in 3 files: 5 errors, 22 warnings, 0 info.

Estimated effort: ~17.5h (rough).

## Findings by rule

| Rule | Severity | Count | Est. hours |
| --- | --- | ---: | ---: |
| `container-property` | warning | 3 | 0.75 |
| `mapview-usage` | warning | 3 | 4.5 |
| `view-when` | warning | 3 | 1.5 |
| `mapview-import` | warning | 2 | 1 |
| `ui-add` | warning | 2 | 1 |
| `widget-usage` | error | 2 | 1.5 |
| `widget-import` | error | 2 | 0.5 |
...

## Findings by file

### `src/App.tsx`

- **WARNING** `mapview-usage` — new MapView() creates an imperative view. It is not removed at 6.0, but components are the recommended path. (line 9, col 14)
  - Use <arcgis-map> for new code; keep MapView only for custom view workflows.
  - `new MapView({`
```

## JSON and CI

`--format json` returns:

```json
{
  "tool": "arcgis-migrate",
  "version": "0.1.0",
  "generatedAt": "2026-10-23T00:00:00.000Z",
  "summary": {
    "filesScanned": 3,
    "filesWithFindings": 2,
    "total": 22,
    "errors": 10,
    "warnings": 12,
    "info": 0,
    "effortHours": 14.5,
    "durationMs": 20
  },
  "findings": []
}
```

CI example:

```yaml
- name: ArcGIS migration scan
  run: node dist/cli.js scan ./src --fail-on error
```

`--fail-on warning` also fails on warnings. `--fail-on none` (the default) always exits 0 unless the scan itself fails.

## How it works

```text
src/cli.ts          Commander CLI, path handling, exit policy
src/scanner.ts      fast-glob discovery + ts-morph Project + summary
src/rules/          AST rules
  imports.ts        view/widget/view-model/esri-loader/theme imports
  usage.ts          constructors, calls, JSX, strings, __esri
  meta.ts           rule ids, severities, effort estimates
src/report.ts       Markdown + JSON formatting
src/policy.ts       --fail-on behavior
```

- No network calls, no browser, no runtime dependency on the ArcGIS SDK.
- `ts-morph` parses `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, and `.cjs`.
- Default excludes: `node_modules`, `dist`, `build`, `.next`, `coverage`, `.git`.
- Findings are deduplicated and sorted by file, line, column, and rule.
- The effort estimate is a rough sum of per-rule hours; use it for triage, not scheduling.

## Validation

- Fixtures cover a widget app, a component app, an AMD app, and a view stored in a non-obvious variable name.
- Real-world check: a 53-file component-based app that imports `MapView` only as a type and owns the view through `<arcgis-map>` produced a single finding: a legacy theme CSS import.
- `npm test` covers rule detection, the clean component app, AMD, JSON/Markdown output, and `--fail-on` policy.

## Limitations

- **Static analysis only.** Widgets created through variables, arrays, factories, or dynamic property access may be missed.
- **Vue/Svelte templates are not parsed yet.** Only JS/TS/JSX is scanned.
- **Custom wrappers may hide SDK usage.** If your app wraps `MapView` in an internal class, the scanner may only see the wrapper.
- **View models are reported, not solved.** Many view models are still "In product plan" for a public replacement.
- **Event mapping is partial.** It covers common view events; widget/component event names vary by component.
- **False positives are possible.** Every finding is a hint, not a guarantee.
- **No auto-fix yet.** The roadmap is to add safe fixes for event renames and simple imports.
- The scanner does not read CSS, HTML, or `node_modules`; it only scans source files you point it at.

## Roadmap

- [ ] `--fix` for safe rules (event names, `position` -> `slot`, theme CSS)
- [ ] Vue SFC and Svelte support
- [ ] SARIF output for GitHub code scanning
- [ ] Config file (`.arcgis-migraterc`) for rule overrides
- [ ] Widget-specific event mapping
- [ ] Migration score / component-readiness badge
- [ ] Codemod mode for `Map` + `MapView` -> `<arcgis-map>`
- [ ] Test the scanner against a corpus of public Esri samples

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run scan:fixture
```

Add a rule:

1. Add metadata to `src/rules/meta.ts`.
2. Implement the check in `src/rules/imports.ts` or `src/rules/usage.ts`.
3. Add a fixture under `tests/fixtures/` and an assertion in `tests/scanner.test.ts`.
4. Run `npm test && npm run typecheck`.

## License

MIT
