"use client";

import type { FeatureListState } from "./types";
import { BORDER_RADIUS_MAP } from "./types";

interface FeatureListPreviewProps {
  state: FeatureListState;
  phoneWidth?: number;
  phoneHeight?: number;
  phoneBorderRadius?: number;
  phonePaddingX?: number;
}

/* ── Default Nucleo icons for each list item ─────────────────────── */
const DEFAULT_ICONS = [
  "18-calculator-2",
  "18-car-side",
  "18-chart-donut-2",
  "18-chart-radar",
  "18-circle-bolt",
];

/* ── Icon color filter based on container background ──────────────── */
// CSS filter to turn black SVGs into #f3533f (brand orange)
const BRAND_ICON_FILTER = "invert(38%) sepia(96%) saturate(2163%) hue-rotate(342deg) brightness(97%) contrast(95%)";

function isDarkContainer(color: string): boolean {
  if (color.startsWith("rgba") || color.startsWith("var(--highlight")) return false;
  if (color.startsWith("var(--widget-brand") || color.startsWith("var(--button-primary")) return true;
  const hex = color.replace("#", "");
  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  }
  return false;
}

function getIconFilter(containerEnabled: boolean, containerColor: string): string {
  if (containerEnabled && isDarkContainer(containerColor)) return "invert(1)"; // white icons on dark bg
  return BRAND_ICON_FILTER; // brand orange icons by default
}

export function FeatureListPreview({
  state,
  phoneWidth = 390,
  phoneHeight = 844,
  phoneBorderRadius = 40,
  phonePaddingX = 20,
}: FeatureListPreviewProps) {
  const headerColor = state.fontColorEnabled ? state.headerColor : "var(--widget-primary-text)";
  const subheadColor = state.fontColorEnabled ? state.subheadColor : "var(--widget-secondary-text)";
  const listTextColor = state.fontColorEnabled ? state.listTextColor : "var(--widget-primary-text)";

  const textAlign = state.customPositioning ? state.positioning : ("left" as const);
  const containerRadius = BORDER_RADIUS_MAP[state.iconContainerRadius];
  const containerSize = state.iconSizePx + 16; // 8px padding on each side, matching Figma
  const iconFilter = getIconFilter(state.iconContainerEnabled, state.iconContainerColor);

  return (
    <div
      style={{
        width: phoneWidth,
        height: phoneHeight,
        background: "var(--widget-page-bg)",
        borderRadius: phoneBorderRadius,
        border: "6px solid var(--background-secondary-border-secondary)",
        boxShadow: "0px 8px 16px 0px rgba(36,38,40,0.09)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "21px 16px 19px",
        }}
      >
        <span
          className="head-text-xs"
          style={{ color: "var(--widget-primary-text)", fontWeight: 600 }}
        >
          9:41
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="19" height="12" viewBox="0 0 19 12" fill="var(--widget-primary-text)">
            <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.3" />
            <rect x="5" y="2" width="3" height="10" rx="1" opacity="0.5" />
            <rect x="10" y="1" width="3" height="11" rx="1" opacity="0.7" />
            <rect x="15" y="0" width="3" height="12" rx="1" />
          </svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="var(--widget-primary-text)">
            <path d="M8.5 2.5C10.7 2.5 12.7 3.4 14.1 4.9L15.5 3.5C13.7 1.6 11.2 0.5 8.5 0.5C5.8 0.5 3.3 1.6 1.5 3.5L2.9 4.9C4.3 3.4 6.3 2.5 8.5 2.5ZM8.5 6.5C9.9 6.5 11.1 7 12 7.9L13.4 6.5C12.1 5.2 10.4 4.5 8.5 4.5C6.6 4.5 4.9 5.2 3.6 6.5L5 7.9C5.9 7 7.1 6.5 8.5 6.5ZM8.5 10.5C9.1 10.5 9.6 10.3 10 9.9L8.5 8.5L7 9.9C7.4 10.3 7.9 10.5 8.5 10.5Z" />
          </svg>
          <svg width="27" height="13" viewBox="0 0 27 13" fill="var(--widget-primary-text)">
            <rect x="0" y="1" width="22" height="11" rx="2.5" stroke="var(--widget-primary-text)" strokeWidth="1" fill="none" opacity="0.35" />
            <rect x="2" y="3" width="18" height="7" rx="1.5" />
            <rect x="23.5" y="4.5" width="2" height="4" rx="1" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Content — vertically centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `0 ${Math.max(phonePaddingX, state.spacingSide)}px`,
          gap: 18,
          textAlign,
        }}
      >
        {/* Header block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {state.showHeader && (
            <h2
              style={{
                fontSize: state.headerFontSize,
                fontWeight: Number(state.headerFontWeight),
                color: headerColor,
                lineHeight: 1,
                margin: 0,
              }}
            >
              {state.headerText}
            </h2>
          )}
          {state.showSubhead && (
            <p
              style={{
                fontSize: state.subheadFontSize,
                fontWeight: Number(state.subheadFontWeight),
                color: subheadColor,
                lineHeight: 1,
                margin: 0,
              }}
            >
              {state.subheadText}
            </p>
          )}
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {state.items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 0",
              }}
            >
              {/* Icon */}
              {!state.enableIcons ? null : state.iconContainerEnabled ? (
                <div
                  style={{
                    width: containerSize,
                    height: containerSize,
                    borderRadius: containerRadius,
                    background: state.iconContainerColor,
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/icons/18px/${item.customIcon || DEFAULT_ICONS[idx % DEFAULT_ICONS.length]}.svg`}
                    alt=""
                    width={state.iconSizePx}
                    height={state.iconSizePx}
                    style={{ filter: iconFilter }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: state.iconSizePx,
                    height: state.iconSizePx,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/icons/18px/${item.customIcon || DEFAULT_ICONS[idx % DEFAULT_ICONS.length]}.svg`}
                    alt=""
                    width={state.iconSizePx}
                    height={state.iconSizePx}
                    style={{ filter: iconFilter }}
                  />
                </div>
              )}

              {/* Text */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: state.listTextFontSize,
                    fontWeight: Number(state.listTextFontWeight),
                    color: listTextColor,
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
                {state.showListDescription && (
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--widget-secondary-text)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {idx % 2 === 0
                      ? "Analyze sales trends and predict future revenue with confidence."
                      : "Real-time tracking of your products, ensuring optimal stock levels."}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 134,
          height: 5,
          borderRadius: 999,
          background: "var(--widget-primary-text)",
          opacity: 0.2,
        }}
      />
    </div>
  );
}
