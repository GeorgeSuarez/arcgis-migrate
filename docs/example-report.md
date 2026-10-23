# ArcGIS migration scan

Scanned **4** files in 0.02s.

Found **27** findings in **3** files: **12** errors, **15** warnings, **0** info.

Estimated effort: **~17.5h** (rough).

## Findings by rule

| Rule | Severity | Count | Est. hours |
| --- | --- | ---: | ---: |
| `container-property` | warning | 3 | 0.75 |
| `mapview-usage` | error | 3 | 4.5 |
| `view-when` | warning | 3 | 1.5 |
| `mapview-import` | error | 2 | 1 |
| `ui-add` | error | 2 | 1 |
| `view-event-name` | warning | 2 | 0.5 |
| `widget-import` | error | 2 | 0.5 |
| `widget-usage` | error | 2 | 1.5 |
| `amd-require` | error | 1 | 2 |
| `esri-namespace` | warning | 1 | 1 |
| `esri-widget-class` | warning | 1 | 0.25 |
| `theme-css-import` | warning | 1 | 0.25 |
| `viewmodel-import` | warning | 1 | 1 |
| `viewmodel-usage` | warning | 1 | 0.5 |
| `widget-position-property` | warning | 1 | 0.25 |
| `widget-viewmodel-property` | warning | 1 | 1 |

## Findings by file

### `widget-app.tsx`

- **ERROR** `mapview-import` — MapView is imported from the deprecated imperative view module. (line 2, col 1)
  - Use <arcgis-map> and await viewOnReady() instead.
  - `import MapView from "@arcgis/core/views/MapView.js";`
- **ERROR** `widget-import` — Search is a widget deprecated since version 5.0. (line 3, col 1)
  - Use <arcgis-search> instead.
  - `import Search from "@arcgis/core/widgets/Search.js";`
- **ERROR** `widget-import` — Legend is a widget deprecated since version 5.0. (line 4, col 1)
  - Use <arcgis-legend> instead.
  - `import Legend from "@arcgis/core/widgets/Legend.js";`
- **WARNING** `viewmodel-import` — SearchViewModel is a widget view model. Many view models have no public replacement yet. (line 5, col 1)
  - Check the view-model roadmap before migrating; keep the view model until a replacement ships.
  - `import SearchViewModel from "@arcgis/core/widgets/Search/SearchViewModel.js";`
- **WARNING** `theme-css-import` — Core API theme CSS is not needed for components and is difficult to scope inside shadow DOM. (line 6, col 1)
  - Use Calcite mode classes (calcite-mode-light/calcite-mode-dark) and component CSS variables.
  - `import "@arcgis/core/assets/esri/themes/light/main.css";`
- **ERROR** `mapview-usage` — new MapView() creates an imperative view that the component API replaces. (line 9, col 14)
  - Use <arcgis-map> and await viewOnReady().
  - `new MapView({`
- **WARNING** `container-property` — The container property is not used by the map component. (line 10, col 3)
  - Remove container; the component element is the container.
  - `container: "viewDiv"`
- **ERROR** `widget-usage` — new Search() instantiates a deprecated widget. (line 16, col 16)
  - Replace it with <arcgis-search>.
  - `new Search({`
- **WARNING** `widget-position-property` — Widget position is deprecated; components use the slot attribute. (line 18, col 3)
  - Use slot="top-right".
  - `position: "top-right"`
- **WARNING** `widget-viewmodel-property` — This widget is configured with a viewModel. Many view models have no public replacement yet. (line 19, col 3)
  - Check the view-model roadmap; migrate to the component API when a replacement is available.
  - `viewModel: new SearchViewModel({ view })`
- **WARNING** `viewmodel-usage` — new SearchViewModel() uses a widget view model that is being deprecated. (line 19, col 14)
  - Check the view-model roadmap before migrating.
  - `new SearchViewModel({ view })`
- **ERROR** `widget-usage` — new Legend() instantiates a deprecated widget. (line 22, col 16)
  - Replace it with <arcgis-legend>.
  - `new Legend({ view })`
- **ERROR** `ui-add` — view.ui add/remove/move/empty is not available with map components. (line 24, col 1)
  - Use a slotted component: <arcgis-... slot="top-right">.
  - `view.ui.add(search, "top-right")`
- **ERROR** `ui-add` — view.ui add/remove/move/empty is not available with map components. (line 25, col 1)
  - Use a slotted component: <arcgis-... slot="bottom-left">.
  - `view.ui.add(legend, "bottom-left")`
- **WARNING** `view-when` — view.when() is the imperative view lifecycle; components expose viewOnReady() and arcgisViewReadyChange. (line 27, col 1)
  - Replace with await viewElement.viewOnReady() or listen for arcgisViewReadyChange.
  - `view.when(() => {`
- **WARNING** `view-event-name` — View event "click" becomes "arcgisViewClick" on the map component. (line 28, col 3)
  - Use addEventListener("arcgisViewClick", ...) on the component, or keep the core view event while MapView remains.
  - `view.on("click", (event) => {`
- **WARNING** `esri-namespace` — The __esri TypeScript namespace is removed at 6.0. (line 33, col 11)
  - Import types directly from their ESM module files.
  - `__esri`
- **WARNING** `esri-widget-class` — The esri-widget CSS class is tied to the legacy widget architecture. (line 35, col 23)
  - Use Calcite components and the documented CSS variables for custom UI.
  - `"esri-widget"`

### `view-var.ts`

- **ERROR** `mapview-import` — MapView is imported from the deprecated imperative view module. (line 1, col 1)
  - Use <arcgis-map> and await viewOnReady() instead.
  - `import MapView from "@arcgis/core/views/MapView.js";`
- **ERROR** `mapview-usage` — new MapView() creates an imperative view that the component API replaces. (line 3, col 11)
  - Use <arcgis-map> and await viewOnReady().
  - `new MapView({ container: "viewDiv" })`
- **WARNING** `container-property` — The container property is not used by the map component. (line 3, col 25)
  - Remove container; the component element is the container.
  - `container: "viewDiv"`
- **WARNING** `view-when` — view.when() is the imperative view lifecycle; components expose viewOnReady() and arcgisViewReadyChange. (line 5, col 1)
  - Replace with await viewElement.viewOnReady() or listen for arcgisViewReadyChange.
  - `v.when(() => {`
- **WARNING** `view-event-name` — View event "click" becomes "arcgisViewClick" on the map component. (line 6, col 3)
  - Use addEventListener("arcgisViewClick", ...) on the component, or keep the core view event while MapView remains.
  - `v.on("click", () => {`

### `amd-app.js`

- **ERROR** `amd-require` — AMD require([...]) is deprecated and is planned for removal in 6.0. (line 1, col 1)
  - Use ESM imports or $arcgis.import() in a module script.
  - `require(["esri/Map", "esri/views/MapView"], function (Map, MapView) {`
- **ERROR** `mapview-usage` — new MapView() creates an imperative view that the component API replaces. (line 3, col 16)
  - Use <arcgis-map> and await viewOnReady().
  - `new MapView({ container: "viewDiv", map })`
- **WARNING** `container-property` — The container property is not used by the map component. (line 3, col 30)
  - Remove container; the component element is the container.
  - `container: "viewDiv"`
- **WARNING** `view-when` — view.when() is the imperative view lifecycle; components expose viewOnReady() and arcgisViewReadyChange. (line 5, col 3)
  - Replace with await viewElement.viewOnReady() or listen for arcgisViewReadyChange.
  - `view.when(function () {`

---

Generated by `arcgis-migrate`. Review each finding; dynamic code, custom wrappers, and view models may need manual migration.