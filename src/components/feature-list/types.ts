import type { FontWeight, BorderRadius } from "@/components/ui/types";
export type { FontWeight, BorderRadius };
export { BORDER_RADIUS_MAP } from "@/components/ui/types";

export type IconType = "check" | "star" | "custom";
export type Positioning = "left" | "center" | "right";

export interface ListItem {
  id: string;
  label: string;
  customIcon?: string;
}

export interface FeatureListState {
  componentId: string;
  showComponentId: boolean;
  headerText: string;
  showHeader: boolean;
  subheadText: string;
  showSubhead: boolean;
  iconType: IconType;
  iconSizePx: number;
  enableIcons: boolean;
  iconContainerEnabled: boolean;
  iconContainerColor: string;
  iconContainerRadius: BorderRadius;
  showListDescription: boolean;
  customPositioning: boolean;
  positioning: Positioning;
  items: ListItem[];
  spacingTop: number;
  spacingBottom: number;
  spacingSide: number;
  spacingInner: number;
  headerFontSize: number;
  subheadFontSize: number;
  listTextFontSize: number;
  headerFontWeight: FontWeight;
  subheadFontWeight: FontWeight;
  listTextFontWeight: FontWeight;
  fontColorEnabled: boolean;
  headerColor: string;
  subheadColor: string;
  iconColor: string;
  listTextColor: string;
}
