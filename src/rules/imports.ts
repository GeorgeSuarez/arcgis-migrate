import type { ImportDeclaration, SourceFile } from "ts-morph";
import type { Finding } from "../types.js";
import { makeFinding, pascalToKebab } from "./helpers.js";
import { RULES } from "./meta.js";

export interface ImportFacts {
  viewNames: Set<string>;
  widgetNames: Set<string>;
  viewModelNames: Set<string>;
  hasRuntimeView: boolean;
}

const WIDGET_COMPONENT_OVERRIDES: Record<string, string> = {
  AreaMeasurement2D: "arcgis-area-measurement-2d",
  AreaMeasurement3D: "arcgis-area-measurement-3d",
  BasemapGallery: "arcgis-basemap-gallery",
  BasemapToggle: "arcgis-basemap-toggle",
  Bookmarks: "arcgis-bookmarks",
  Compass: "arcgis-compass",
  CoordinateConversion: "arcgis-coordinate-conversion",
  DirectLineMeasurement3D: "arcgis-direct-line-measurement-3d",
  DistanceMeasurement2D: "arcgis-distance-measurement-2d",
  Editor: "arcgis-editor",
  ElevationProfile: "arcgis-elevation-profile",
  Expand: "arcgis-expand",
  FeatureTable: "arcgis-feature-table",
  Home: "arcgis-home",
  LayerList: "arcgis-layer-list",
  Legend: "arcgis-legend",
  LineOfSight: "arcgis-line-of-sight",
  Locate: "arcgis-locate",
  Popup: "arcgis-popup",
  Print: "arcgis-print",
  ScaleBar: "arcgis-scale-bar",
  Search: "arcgis-search",
  ShadowCast: "arcgis-shadow-cast",
  Sketch: "arcgis-sketch",
  Slice: "arcgis-slice",
  TimeSlider: "arcgis-time-slider",
  UtilityNetworkTrace: "arcgis-utility-network-trace",
  Viewshed: "arcgis-viewshed",
  VolumeMeasurement: "arcgis-volume-measurement",
};

export function componentTagForWidget(widgetName: string): string {
  return WIDGET_COMPONENT_OVERRIDES[widgetName] ?? `arcgis-${pascalToKebab(widgetName)}`;
}

export function scanImports(
  sourceFile: SourceFile,
  add: (finding: Omit<Finding, "file">) => void,
): ImportFacts {
  const facts: ImportFacts = {
    viewNames: new Set(),
    widgetNames: new Set(),
    viewModelNames: new Set(),
    hasRuntimeView: false,
  };

  for (const declaration of sourceFile.getImportDeclarations()) {
    if (isTypeOnlyImport(declaration)) continue;

    const specifier = declaration.getModuleSpecifierValue();
    const localName = getImportLocalName(declaration);

    const viewMatch = /^@arcgis\/core\/views\/(MapView|SceneView)(?:\.js)?$/.exec(specifier);
    if (viewMatch) {
      const viewType = viewMatch[1] as "MapView" | "SceneView";
      facts.hasRuntimeView = true;
      if (localName) facts.viewNames.add(localName);
      add(
        makeFinding(
          declaration,
          RULES.mapViewImport,
          `${viewType} is the imperative view API. It is not removed at 6.0, but components are the recommended path.`,
          `Use <${viewType === "MapView" ? "arcgis-map" : "arcgis-scene"}> for new code; keep MapView only for custom view workflows.`,
        ),
      );
      continue;
    }

    if (specifier === "esri-loader" || specifier.startsWith("esri-loader/")) {
      add(
        makeFinding(
          declaration,
          RULES.esriLoaderImport,
          "esri-loader loads AMD modules and is not compatible with the component/ESM path.",
          "Use ESM imports from @arcgis/core or $arcgis.import().",
        ),
      );
      continue;
    }

    if (specifier.includes("@arcgis/core/assets/esri/themes/")) {
      add(
        makeFinding(
          declaration,
          RULES.themeCssImport,
          "Core API theme CSS is not needed for components and is difficult to scope inside shadow DOM.",
          "Use Calcite mode classes (calcite-mode-light/calcite-mode-dark) and component CSS variables.",
        ),
      );
      continue;
    }

    if (specifier.startsWith("@arcgis/core/widgets/")) {
      const viewModelName = viewModelNameFromSpecifier(specifier);
      if (viewModelName) {
        facts.viewModelNames.add(viewModelName);
        add(
          makeFinding(
            declaration,
            RULES.viewModelImport,
            `${viewModelName} is a widget view model. Many view models have no public replacement yet.`,
            "Check the view-model roadmap before migrating; keep the view model until a replacement ships.",
          ),
        );
        continue;
      }

      const widgetName = widgetNameFromSpecifier(specifier);
      if (widgetName && /^[A-Z]/.test(widgetName)) {
        facts.widgetNames.add(widgetName);
        add(
          makeFinding(
            declaration,
            RULES.widgetImport,
            `${widgetName} is a widget deprecated since version 5.0.`,
            `Use <${componentTagForWidget(widgetName)}> instead.`,
          ),
        );
      }
    }
  }

  return facts;
}

function getImportLocalName(declaration: ImportDeclaration): string | undefined {
  const defaultImport = declaration.getDefaultImport();
  if (defaultImport) return defaultImport.getText();

  const namespaceImport = declaration.getNamespaceImport();
  if (namespaceImport) return namespaceImport.getText();

  const namedImport = declaration.getNamedImports()[0];
  if (namedImport) {
    return namedImport.getAliasNode()?.getText() ?? namedImport.getName();
  }

  return undefined;
}

function isTypeOnlyImport(declaration: ImportDeclaration): boolean {
  if (declaration.isTypeOnly()) return true;

  const namedImports = declaration.getNamedImports();
  return (
    !declaration.getDefaultImport() &&
    !declaration.getNamespaceImport() &&
    namedImports.length > 0 &&
    namedImports.every((namedImport) => namedImport.isTypeOnly())
  );
}

function viewModelNameFromSpecifier(specifier: string): string | undefined {
  const match = /\/widgets\/(?:.+\/)?([A-Za-z0-9]+ViewModel)(?:\.js)?$/.exec(specifier);
  return match?.[1];
}

function widgetNameFromSpecifier(specifier: string): string | undefined {
  const afterWidgets = specifier.slice("@arcgis/core/widgets/".length);
  return afterWidgets.split("/")[0]?.replace(/\.js$/, "");
}
