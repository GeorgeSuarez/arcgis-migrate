import type { RuleDefinition } from "../types.js";

export const RULES = {
  mapViewImport: {
    id: "mapview-import",
    title: "Imperative view import",
    severity: "warning",
    effortHours: 0.5,
  },
  mapViewUsage: {
    id: "mapview-usage",
    title: "Imperative MapView / SceneView",
    severity: "warning",
    effortHours: 1.5,
  },
  containerProperty: {
    id: "container-property",
    title: "container property",
    severity: "warning",
    effortHours: 0.25,
  },
  widgetImport: {
    id: "widget-import",
    title: "Widget import",
    severity: "error",
    effortHours: 0.25,
  },
  widgetUsage: {
    id: "widget-usage",
    title: "Widget instantiation",
    severity: "error",
    effortHours: 0.75,
  },
  widgetPositionProperty: {
    id: "widget-position-property",
    title: "Widget position property",
    severity: "warning",
    effortHours: 0.25,
  },
  widgetViewModelProperty: {
    id: "widget-viewmodel-property",
    title: "Widget view model usage",
    severity: "warning",
    effortHours: 1,
  },
  viewModelImport: {
    id: "viewmodel-import",
    title: "View model import",
    severity: "warning",
    effortHours: 1,
  },
  viewModelUsage: {
    id: "viewmodel-usage",
    title: "View model instantiation",
    severity: "warning",
    effortHours: 0.5,
  },
  uiAdd: {
    id: "ui-add",
    title: "view.ui add/remove",
    severity: "warning",
    effortHours: 0.5,
  },
  viewWhen: {
    id: "view-when",
    title: "view.when lifecycle",
    severity: "warning",
    effortHours: 0.5,
  },
  viewEventName: {
    id: "view-event-name",
    title: "View event name",
    severity: "warning",
    effortHours: 0.25,
  },
  positionAttribute: {
    id: "position-attribute",
    title: "position attribute",
    severity: "warning",
    effortHours: 0.25,
  },
  esriNamespace: {
    id: "esri-namespace",
    title: "__esri namespace",
    severity: "warning",
    effortHours: 1,
  },
  amdRequire: {
    id: "amd-require",
    title: "AMD require",
    severity: "error",
    effortHours: 2,
  },
  esriLoaderImport: {
    id: "esri-loader-import",
    title: "esri-loader import",
    severity: "error",
    effortHours: 2,
  },
  esriLoaderUsage: {
    id: "esri-loader-usage",
    title: "esri-loader usage",
    severity: "error",
    effortHours: 2,
  },
  themeCssImport: {
    id: "theme-css-import",
    title: "Core theme CSS import",
    severity: "warning",
    effortHours: 0.25,
  },
  esriWidgetClass: {
    id: "esri-widget-class",
    title: "esri-widget CSS class",
    severity: "warning",
    effortHours: 0.25,
  },
} as const satisfies Record<string, RuleDefinition>;
