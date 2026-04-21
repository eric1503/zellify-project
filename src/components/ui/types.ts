export type FontWeight = "400" | "500" | "600" | "700";
export type BorderRadius = "default" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export const BORDER_RADIUS_MAP: Record<BorderRadius, number> = {
  default: 6,
  sm: 4,
  md: 8,
  "2xl": 10,
  lg: 12,
  xl: 16,
  full: 999,
};
