import {
  Node,
  SyntaxKind,
  type CallExpression,
  type NewExpression,
  type ObjectLiteralExpression,
  type SourceFile,
} from "ts-morph";
import type { Finding } from "../types.js";
import { lastIdentifier, makeFinding } from "./helpers.js";
import { componentTagForWidget, type ImportFacts } from "./imports.js";
import { RULES } from "./meta.js";

const VIEW_EVENTS: Record<string, string> = {
  click: "arcgisViewClick",
  "double-click": "arcgisViewDoubleClick",
  "immediate-click": "arcgisViewImmediateClick",
  "pointer-move": "arcgisViewPointerMove",
  "pointer-down": "arcgisViewPointerDown",
  "pointer-up": "arcgisViewPointerUp",
  "pointer-enter": "arcgisViewPointerEnter",
  "pointer-leave": "arcgisViewPointerLeave",
  drag: "arcgisViewDrag",
  "key-down": "arcgisViewKeyDown",
  "key-up": "arcgisViewKeyUp",
  "mouse-wheel": "arcgisViewMouseWheel",
  resize: "arcgisViewResize",
  "layerview-create": "arcgisViewLayerviewCreate",
  "layerview-destroy": "arcgisViewLayerviewDestroy",
};

export function scanUsage(
  sourceFile: SourceFile,
  facts: ImportFacts,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  scanNewExpressions(sourceFile, facts, add);
  scanCalls(sourceFile, facts, add);
  scanJsx(sourceFile, add);
  scanStrings(sourceFile, add);
  scanEsriNamespace(sourceFile, add);
}

function scanNewExpressions(
  sourceFile: SourceFile,
  facts: ImportFacts,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  for (const node of sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression)) {
    const name = lastIdentifier(node.getExpression().getText());

    if (name === "MapView" || name === "SceneView") {
      facts.hasRuntimeView = true;
      const variableName = getDeclaredVariableName(node);
      if (variableName) facts.viewNames.add(variableName);

      add(
        makeFinding(
          node,
          RULES.mapViewUsage,
          `new ${name}() creates an imperative view. It is not removed at 6.0, but components are the recommended path.`,
          `Use <${name === "MapView" ? "arcgis-map" : "arcgis-scene"}> for new code; keep MapView only for custom view workflows.`,
        ),
      );

      const objectLiteral = getFirstObjectLiteral(node);
      const container = objectLiteral?.getProperty("container");
      if (container && Node.isPropertyAssignment(container)) {
        add(
          makeFinding(
            container,
            RULES.containerProperty,
            "The container property is not used by the map component.",
            "Remove container; the component element is the container.",
          ),
        );
      }
    }

    if (facts.widgetNames.has(name)) {
      add(
        makeFinding(
          node,
          RULES.widgetUsage,
          `new ${name}() instantiates a deprecated widget.`,
          `Replace it with <${componentTagForWidget(name)}>.`,
        ),
      );

      const objectLiteral = getFirstObjectLiteral(node);
      const position = objectLiteral?.getProperty("position");
      if (position && Node.isPropertyAssignment(position)) {
        const value = getLiteralValue(position.getInitializer());
        add(
          makeFinding(
            position,
            RULES.widgetPositionProperty,
            "Widget position is deprecated; components use the slot attribute.",
            value ? `Use slot="${value}".` : "Use the slot attribute on the component.",
          ),
        );
      }

      const viewModel = objectLiteral?.getProperty("viewModel");
      if (viewModel && Node.isPropertyAssignment(viewModel)) {
        add(
          makeFinding(
            viewModel,
            RULES.widgetViewModelProperty,
            "This widget is configured with a viewModel. Many view models have no public replacement yet.",
            "Check the view-model roadmap; migrate to the component API when a replacement is available.",
          ),
        );
      }
    }

    if (facts.viewModelNames.has(name)) {
      add(
        makeFinding(
          node,
          RULES.viewModelUsage,
          `new ${name}() uses a widget view model that is being deprecated.`,
          "Check the view-model roadmap before migrating.",
        ),
      );
    }
  }
}

function scanCalls(
  sourceFile: SourceFile,
  facts: ImportFacts,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expression = call.getExpression();
    const text = expression.getText();

    if (/\.ui\.(add|remove|move|empty)$/.test(text)) {
      const position = getStringArgument(call, 1);
      add(
        makeFinding(
          call,
          RULES.uiAdd,
          "view.ui add/remove/move/empty is not available on map components; it remains valid only with MapView.",
          position
            ? `Use a slotted component: <arcgis-... slot="${position}">.`
            : "Use the slot attribute on a component (top-left, top-right, bottom-left, bottom-right).",
        ),
      );
    }

    if (text.endsWith(".when")) {
      const receiver = text.slice(0, -".when".length);
      if (isViewReceiver(receiver, facts)) {
        add(
          makeFinding(
            call,
            RULES.viewWhen,
            "view.when() is the imperative view lifecycle; if the view comes from <arcgis-map>, prefer viewOnReady() or arcgisViewReadyChange.",
            "Replace with await viewElement.viewOnReady() or listen for arcgisViewReadyChange.",
          ),
        );
      }
    }

    if (text.endsWith(".on")) {
      const receiver = text.slice(0, -".on".length);
      const eventName = getStringArgument(call, 0);
      const mappedEvent = eventName ? VIEW_EVENTS[eventName] : undefined;
      if (eventName && mappedEvent && isViewReceiver(receiver, facts)) {
        add(
          makeFinding(
            call,
            RULES.viewEventName,
            `View event "${eventName}" becomes "${mappedEvent}" on the map component.`,
            `Use addEventListener("${mappedEvent}", ...) on the component, or keep the core view event while MapView remains.`,
          ),
        );
      }
    }

    if (text === "require" || text === "requirejs") {
      const firstArgument = call.getArguments()[0];
      if (firstArgument && Node.isArrayLiteralExpression(firstArgument)) {
        const hasEsriModule = firstArgument.getElements().some(
          (element) =>
            Node.isStringLiteral(element) && element.getLiteralValue().startsWith("esri/"),
        );
        if (hasEsriModule) {
          add(
            makeFinding(
              call,
              RULES.amdRequire,
              "AMD require([...]) is deprecated and is planned for removal in 6.0.",
              "Use ESM imports or $arcgis.import() in a module script.",
            ),
          );
        }
      }
    }

    if (text === "loadModules" || text.endsWith(".loadModules")) {
      add(
        makeFinding(
          call,
          RULES.esriLoaderUsage,
          "loadModules() from esri-loader is not compatible with the component/ESM path.",
          "Use ESM imports from @arcgis/core or $arcgis.import().",
        ),
      );
    }
  }
}

function scanJsx(
  sourceFile: SourceFile,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  for (const attribute of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    if (attribute.getNameNode().getText() === "position") {
      add(
        makeFinding(
          attribute,
          RULES.positionAttribute,
          "The position attribute is deprecated on map components.",
          "Use slot=\"top-left\" (or top-right, bottom-left, bottom-right) instead.",
        ),
      );
    }
  }
}

function scanStrings(
  sourceFile: SourceFile,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  for (const literal of sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
    const tokens = literal.getLiteralValue().split(/\s+/);
    if (tokens.includes("esri-widget")) {
      add(
        makeFinding(
          literal,
          RULES.esriWidgetClass,
          "The esri-widget CSS class is tied to the legacy widget architecture.",
          "Use Calcite components and the documented CSS variables for custom UI.",
        ),
      );
    }
  }
}

function scanEsriNamespace(
  sourceFile: SourceFile,
  add: (finding: Omit<Finding, "file">) => void,
): void {
  const seenLines = new Set<number>();
  for (const identifier of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
    if (identifier.getText() !== "__esri") continue;
    const line = identifier.getStartLineNumber();
    if (seenLines.has(line)) continue;
    seenLines.add(line);
    add(
      makeFinding(
        identifier,
        RULES.esriNamespace,
        "The __esri TypeScript namespace is removed at 6.0.",
        "Import types directly from their ESM module files.",
      ),
    );
  }
}

function isViewReceiver(receiver: string, facts: ImportFacts): boolean {
  const name = lastIdentifier(receiver);
  return (
    facts.viewNames.has(name) ||
    (facts.hasRuntimeView && /^(view|mapView|sceneView|viewElement)$/.test(name))
  );
}

function getFirstObjectLiteral(node: NewExpression): ObjectLiteralExpression | undefined {
  for (const argument of node.getArguments()) {
    if (Node.isObjectLiteralExpression(argument)) return argument;
  }
  return undefined;
}

function getDeclaredVariableName(node: NewExpression): string | undefined {
  const parent = node.getParent();
  if (!parent || !Node.isVariableDeclaration(parent)) return undefined;
  return parent.getName();
}

function getStringArgument(call: CallExpression, index: number): string | undefined {
  const argument = call.getArguments()[index];
  if (!argument) return undefined;
  return getLiteralValue(argument);
}

function getLiteralValue(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralValue();
  }
  return undefined;
}
