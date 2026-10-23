# arcgis-migrate

Find widget-era code in an ArcGIS Maps SDK for JavaScript app before the 6.0 component migration.

> Weekend-scaffold status: **scanner only**. It reports what needs to change and gives a rough effort estimate; it does not rewrite your code yet.

## Why

- All ArcGIS Maps SDK widgets are deprecated as of **5.0**.
- **6.0** is planned for **Q1 2027** and is the removal point for widgets, AMD `require()`, and the `__esri` TypeScript namespace.
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

| Rule | Severity | Finds | Migration hint |
| --- | --- | --- | --- |
| `mapview-import` | error | `@arcgis/core/views/MapView.js` / `SceneView.js` imports | Use `<arcgis-map>` / `<arcgis-scene>` |
| `mapview-usage` | error | `new MapView()` / `new SceneView()` | Use the map/scene component and `viewOnReady()` |
| `container-property` | warning | `container` in a view constructor | Remove it; the component element is the container |
| `widget-import` | error | `@arcgis/core/widgets/*` imports | Use the matching `arcgis-*` component |
| `widget-usage` | error | `new Search()`, `new Legend()`, etc. | Replace with the component |
| `widget-position-property` | warning | `position` in a widget constructor | Use `slot="top-right"` |
| `widget-viewmodel-property` | warning | `viewModel` in a widget constructor | Check the view-model roadmap |
| `viewmodel-import` | warning | `*ViewModel.js` imports | Many view models have no public replacement yet |
| `viewmodel-usage` | warning | `new *ViewModel()` | Check the view-model roadmap |
| `ui-add` | error | `view.ui.add/remove/move/empty` | Use slotted components |
| `view-when` | warning | `view.when()` | `viewOnReady()` or `arcgisViewReadyChange` |
| `view-event-name` | warning | Common view events, e.g. `"click"` | `arcgisViewClick` and friends |
| `position-attribute` | warning | JSX `position` attribute | Use `slot` |
| `esri-namespace` | warning | `__esri` type references | Import types from ESM module files |
| `amd-require` | error | `require(["esri/..."])` | ESM or `$arcgis.import()` |
| `esri-loader-import` | error | `esri-loader` imports | ESM or `$arcgis.import()` |
| `esri-loader-usage` | error | `loadModules()` | ESM or `$arcgis.import()` |
| `theme-css-import` | warning | `@arcgis/core/assets/esri/themes/*` CSS | Calcite light/dark modes |
| `esri-widget-class` | warning | `esri-widget` CSS class | Calcite components and CSS variables |

## Example output

```text
# ArcGIS migration scan

Scanned 4 files in 0.02s.

Found 27 findings in 3 files: 12 errors, 15 warnings, 0 info.

Estimated effort: ~17.5h (rough).

## Findings by rule

| Rule | Severity | Count | Est. hours |
| --- | --- | ---: | ---: |
| `mapview-usage` | error | 3 | 4.5 |
| `view-when` | warning | 3 | 1.5 |
| `container-property` | warning | 3 | 0.75 |
| `ui-add` | error | 2 | 1 |
| `widget-usage` | error | 2 | 1.5 |
...

## Findings by file

### `src/App.tsx`

- **ERROR** `mapview-usage` — new MapView() creates an imperative view that the component API replaces. (line 9, col 14)
  - Use <arcgis-map> and await viewOnReady().
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

## Publishing

The package is marked `"private": true` to prevent an accidental publish.

1. Pick an available name (or use a scope).
2. Remove `"private": true`.
3. `npm run build && npm publish --access public`.

## License

MIT
