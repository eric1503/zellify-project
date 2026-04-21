import type { FeatureListState, ListItem } from "./types";

let itemCounter = 5;
export function createListItem(label: string): ListItem {
  return { id: `item-${++itemCounter}`, label };
}

export const DEFAULT_ITEMS: ListItem[] = [
  { id: "item-1", label: "Revenue Forecasting", customIcon: "18-calculator-2" },
  { id: "item-2", label: "Automated Inventory", customIcon: "18-car-side" },
  { id: "item-3", label: "Customer Analytics", customIcon: "18-chart-donut-2" },
  { id: "item-4", label: "Marketing Automation", customIcon: "18-chart-radar" },
  { id: "item-5", label: "Sales Performance", customIcon: "18-circle-bolt" },
];

export const DEFAULT_STATE: FeatureListState = {
  componentId: "feature-list-1",
  showComponentId: true,
  headerText: "Features List",
  showHeader: true,
  subheadText: "{Medium sized description}",
  showSubhead: true,
  iconType: "custom",
  iconSizePx: 18,
  enableIcons: true,
  iconContainerEnabled: true,
  iconContainerColor: "var(--icon-container-bg-2)",
  iconContainerRadius: "2xl",
  showListDescription: true,
  customPositioning: false,
  positioning: "left",
  items: DEFAULT_ITEMS,
  spacingTop: 0,
  spacingBottom: 0,
  spacingSide: 20,
  spacingInner: 0,
  headerFontSize: 20,
  subheadFontSize: 16,
  listTextFontSize: 16,
  headerFontWeight: "600",
  subheadFontWeight: "500",
  listTextFontWeight: "500",
  fontColorEnabled: false,
  headerColor: "#0e0e16",
  subheadColor: "#56565c",
  iconColor: "#0e0e16",
  listTextColor: "#0e0e16",
};
