"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ToggleField } from "@/components/ui/ToggleField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SliderWithInput } from "@/components/ui/SliderWithInput";
import { InputField } from "@/components/ui/InputField";

/* ═══════════════════════════════════════════════════════════════════════════
   Token data — mirrors globals.css
   ═══════════════════════════════════════════════════════════════════════════ */

type ColorToken = { name: string; light: string; dark: string };

function tokens(
  group: [string, string][],
): ColorToken[] {
  return group.map(([name, light, dark]: [string, string, string?]) => ({
    name,
    light,
    dark: dark ?? light,
  })) as ColorToken[];
}

const COLOR_GROUPS: Record<string, ColorToken[]> = {
  Status: [
    { name: "status-neutral-bg", light: "rgba(151,151,155,0.1)", dark: "#1d1e20" },
    { name: "status-neutral-border", light: "rgba(151,151,155,0.15)", dark: "#323336" },
    { name: "status-success-fg", light: "#00a186", dark: "#00b899" },
    { name: "status-success-bg", light: "rgba(0,161,134,0.08)", dark: "rgba(0,184,153,0.1)" },
    { name: "status-success-border-white", light: "rgba(255,255,255,0.18)", dark: "rgba(255,255,255,0.18)" },
    { name: "status-success-border", light: "rgba(0,161,134,0.18)", dark: "rgba(0,184,153,0.3)" },
    { name: "status-success-border-secondary", light: "rgba(0,161,134,0.1)", dark: "rgba(0,184,153,0.1)" },
    { name: "status-success-text-light", light: "#a0c5c0", dark: "#395356" },
    { name: "status-error-fg", light: "#fb2b3f", dark: "#df4453" },
    { name: "status-error-fg-hover", light: "#fc5060", dark: "#e4636f" },
    { name: "status-error-bg", light: "rgba(251,43,63,0.1)", dark: "rgba(223,68,83,0.1)" },
    { name: "status-error-border", light: "rgba(251,43,63,0.2)", dark: "rgba(223,68,83,0.3)" },
    { name: "status-error-text-light", light: "#f0a8a8", dark: "#653434" },
    { name: "status-warning-fg", light: "#fb902b", dark: "#f6c845" },
    { name: "status-warning-bg", light: "rgba(251,144,43,0.1)", dark: "rgba(246,200,69,0.1)" },
    { name: "status-warning-border", light: "rgba(251,144,43,0.3)", dark: "rgba(246,200,69,0.25)" },
    { name: "status-brand-fg", light: "rgba(243,83,63,0.1)", dark: "rgba(243,83,63,0.1)" },
    { name: "status-brand-fg-2", light: "rgba(243,83,63,0.15)", dark: "rgba(243,83,63,0.15)" },
    { name: "status-brand-border", light: "rgba(243,83,63,0.2)", dark: "rgba(243,83,63,0.2)" },
    { name: "status-color", light: "#ffffff", dark: "#ffffff" },
  ],
  Text: [
    { name: "text-foreground", light: "#0e0e16", dark: "#ffffff" },
    { name: "text-secondary-foreground", light: "#56565c", dark: "#bcbcbd" },
    { name: "text-muted-foreground", light: "#86868a", dark: "#87878b" },
    { name: "text-misc-foreground", light: "#97979b", dark: "#6e6e72" },
    { name: "text-primary-foreground", light: "#f3533f", dark: "#f3533f" },
    { name: "text-full-white", light: "#ffffff", dark: "#ffffff" },
    { name: "text-full-black", light: "#0e0e16", dark: "#0e0e16" },
  ],
  Icon: [
    { name: "icon-foreground", light: "#0e0e16", dark: "#ffffff" },
    { name: "icon-secondary-foreground", light: "#56565c", dark: "#bcbcbd" },
    { name: "icon-muted-foreground", light: "#86868a", dark: "#87888b" },
    { name: "icon-misc-foreground", light: "#97979b", dark: "#78797c" },
    { name: "icon-primary-foreground", light: "#f3533f", dark: "#f3533f" },
    { name: "icon-container-bg", light: "#f6f7f8", dark: "#25282d" },
    { name: "icon-container-border", light: "#eeeff2", dark: "#2e3238" },
    { name: "icon-container-bg-2", light: "#ffffff", dark: "#292d32" },
    { name: "icon-container-border-2", light: "#e8eaed", dark: "#32373e" },
    { name: "icon-full-white", light: "#ffffff", dark: "#ffffff" },
    { name: "icon-full-black", light: "#0e0e16", dark: "#0e0e16" },
  ],
  Page: [
    { name: "page-background", light: "#f9f9fb", dark: "#0b0b0f" },
    { name: "page-background-2", light: "#f6f6f8", dark: "#040406" },
  ],
  Foreground: [
    { name: "foreground-bg", light: "#ffffff", dark: "#191b1f" },
  ],
  Background: [
    { name: "background-bg-panel", light: "#ffffff", dark: "#0f1012" },
    { name: "background-border-panel", light: "#f1f1f4", dark: "#191c1f" },
    { name: "background-primary-bg-primary", light: "#f9f9fb", dark: "#0f1012" },
    { name: "background-primary-border-primary", light: "#eeeef2", dark: "#1c1e22" },
    { name: "background-bg-panel-secondary", light: "#f6f6f9", dark: "#000000" },
    { name: "background-modal-bg-modal", light: "#ffffff", dark: "#121417" },
    { name: "background-modal-border-modal", light: "#e9e9ed", dark: "#1c1f21" },
    { name: "background-secondary-bg-secondary", light: "#ffffff", dark: "#131416" },
    { name: "background-secondary-border-secondary", light: "#e5e5eb", dark: "#191b1f" },
    { name: "background-tertiary-bg-tertiary", light: "#ffffff", dark: "#1d2025" },
    { name: "background-tertiary-bg-tertiary-hover", light: "#fcfcfd", dark: "#14161a" },
    { name: "background-tertiary-border-tertiary", light: "#edeff3", dark: "#282c34" },
    { name: "background-quaternary-bg-quaternary", light: "#f7f7f8", dark: "#191b1f" },
    { name: "background-quaternary-bg-quaternary-hover", light: "#eeeef1", dark: "#1e2025" },
    { name: "background-quaternary-border-quaternary", light: "#e2e2e9", dark: "#262931" },
  ],
  Sidebar: [
    { name: "sidebar-bg", light: "#fdfcfc", dark: "#060809" },
    { name: "sidebar-menu-active", light: "#f4f1f1", dark: "#1b1c1d" },
    { name: "sidebar-menu-hover", light: "#f4f1f1", dark: "#1b1c1d" },
    { name: "sidebar-menu-active-border", light: "#ede9e9", dark: "rgba(0,0,0,0)" },
    { name: "sidebar-card", light: "#ffffff", dark: "#141417" },
    { name: "sidebar-card-border", light: "#f6f3f3", dark: "#1c1d21" },
  ],
  Button: [
    { name: "button-primary-bg", light: "#f3533f", dark: "#f3533f" },
    { name: "button-primary-border", light: "#f2422c", dark: "#f2422c" },
    { name: "button-primary-bg-hover", light: "#f46452", dark: "#f46452" },
    { name: "button-primary-border-hover", light: "#f24b36", dark: "#f24b36" },
    { name: "button-accent-bg", light: "rgba(243,83,63,0.1)", dark: "rgba(243,83,63,0.1)" },
    { name: "button-secondary-bg", light: "#ffffff", dark: "#191b1f" },
    { name: "button-secondary-bg-hover", light: "#f6f6f9", dark: "#22252b" },
    { name: "button-secondary-border", light: "#e5e5eb", dark: "#24272e" },
    { name: "button-secondary-border-hover", light: "#e0e0eb", dark: "#2d3139" },
    { name: "button-secondary-outset", light: "#efeff4", dark: "rgba(6,8,9,0)" },
    { name: "button-secondary-border-focus", light: "#f3533f", dark: "#f3533f" },
    { name: "button-tertiary-bg", light: "#eeeef1", dark: "#22252b" },
    { name: "button-tertiary-bg-hover", light: "#e6e6ea", dark: "#2b2d36" },
    { name: "button-tertiary-border", light: "#e3e3e8", dark: "#2d2e39" },
    { name: "button-tertiary-border-hover", light: "#dddde3", dark: "#2d3139" },
    { name: "button-checkbox-bg", light: "#e5e7eb", dark: "#22262a" },
    { name: "button-checkbox-bg-hover", light: "#e2e4e9", dark: "#2c2f35" },
    { name: "button-checkbox-border", light: "#d7dae0", dark: "#31343f" },
    { name: "button-checkbox-border-hover", light: "#d1d5dc", dark: "#383a47" },
    { name: "button-disabled", light: "#f2eeee", dark: "#1f2123" },
    { name: "button-destructive-bg", light: "#fb2b3f", dark: "#fb2b3f" },
    { name: "button-destructive-border", light: "#fb192e", dark: "#fb192e" },
    { name: "button-destructive-bg-hover", light: "#fc4b5c", dark: "#fc4b5c" },
    { name: "button-destructive-border-hover", light: "#fc3649", dark: "#fc3649" },
  ],
  "Input Field": [
    { name: "input-field-primary-bg", light: "#ededf2", dark: "#1e2025" },
    { name: "input-field-primary-bg-hover", light: "#e9e9ec", dark: "#22252a" },
    { name: "input-field-primary-border", light: "#dfdfe7", dark: "#282c33" },
    { name: "input-field-primary-border-hover", light: "#d7d7e0", dark: "#2f333c" },
    { name: "input-field-primary-foreground", light: "#ffffff", dark: "#252b30" },
    { name: "input-field-primary-foreground-border", light: "#f1f1f4", dark: "#2f363c" },
    { name: "input-field-primary-border-focus", light: "#f3533f", dark: "#f3533f" },
    { name: "input-field-primary-border-focus-outset", light: "rgba(242,115,99,0.2)", dark: "rgba(242,115,99,0.2)" },
    { name: "input-field-secondary-bg", light: "#f1eeee", dark: "#18191b" },
    { name: "input-field-secondary-bg-hover", light: "#ece9e9", dark: "#212326" },
    { name: "input-field-secondary-border", light: "#ede9e9", dark: "#1f2228" },
    { name: "input-field-secondary-border-hover", light: "#e8e3e3", dark: "#282c33" },
  ],
  Menu: [
    { name: "menu-bg", light: "#ffffff", dark: "#17191c" },
    { name: "menu-border", light: "#f0f0f4", dark: "#22252b" },
    { name: "menu-list-hover", light: "#f6f6f8", dark: "#202227" },
    { name: "menu-list-border-hover", light: "#eeeef2", dark: "#272a30" },
  ],
  Tooltip: [
    { name: "tooltip-bg", light: "#ffffff", dark: "#22252b" },
    { name: "tooltip-border", light: "#ebecef", dark: "#272b32" },
  ],
  Divider: [
    { name: "divider-primary", light: "#e9e9ed", dark: "#1c1e21" },
    { name: "divider-secondary", light: "#d2d2d5", dark: "#333537" },
  ],
  Toggle: [
    { name: "toggle-bg-primary", light: "#eeeef1", dark: "#1c1d22" },
    { name: "toggle-bg-secondary", light: "#e3e3e8", dark: "#2e3138" },
    { name: "toggle-border", light: "#e9e9ed", dark: "#17191c" },
    { name: "toggle-active-bg", light: "#ffffff", dark: "#2e3038" },
    { name: "toggle-active-border", light: "#e5e5eb", dark: "#363a45" },
  ],
  Highlight: [
    { name: "highlight-brand", light: "rgba(243,83,63,0.06)", dark: "rgba(243,83,63,0.08)" },
  ],
  Slider: [
    { name: "slider-bg", light: "#e1e4ea", dark: "#282c33" },
    { name: "slider-handle-bg", light: "#ffffff", dark: "#2a2a32" },
    { name: "slider-handle-border", light: "#f6f6f9", dark: "#32323e" },
  ],
  Builder: [
    { name: "builder-brand", light: "#f3533f", dark: "#f3533f" },
  ],
  Widget: [
    { name: "widget-brand", light: "#f3533f", dark: "#f3533f" },
    { name: "widget-page-bg", light: "#ffffff", dark: "#ffffff" },
    { name: "widget-card-bg", light: "#ffffff", dark: "#ffffff" },
    { name: "widget-secondary-card-bg", light: "#e7e7ef", dark: "#e7e7ef" },
    { name: "widget-primary-text", light: "#0e0e16", dark: "#0e0e16" },
    { name: "widget-secondary-text", light: "#56565c", dark: "#56565c" },
    { name: "widget-placeholder-text", light: "#86868a", dark: "#86868a" },
    { name: "widget-button-label", light: "#ffffff", dark: "#ffffff" },
    { name: "widget-disabled-button-label", light: "#56565c", dark: "#56565c" },
    { name: "widget-primary-button", light: "#f3533f", dark: "#f3533f" },
    { name: "widget-disabled-button", light: "#f6f6f9", dark: "#f6f6f9" },
    { name: "widget-active-input-field", light: "#f3533f", dark: "#f3533f" },
    { name: "widget-input-field", light: "#ededf2", dark: "#ededf2" },
    { name: "widget-active-user-input", light: "#f3533f", dark: "#f3533f" },
    { name: "widget-inactive-user-input", light: "#ffffff", dark: "#ffffff" },
    { name: "widget-primary-icon", light: "#86868a", dark: "#86868a" },
    { name: "widget-secondary-icon", light: "#ffffff", dark: "#ffffff" },
    { name: "widget-primary-stroke", light: "#e5e5eb", dark: "#e5e5eb" },
  ],
};

const TYPOGRAPHY_GROUPS: Record<
  string,
  { className: string; label: string; details: string }[]
> = {
  Headings: [
    { className: "head-text-3xl", label: "head-text-3xl", details: "26px / 600 / -0.01em" },
    { className: "head-text-2xl", label: "head-text-2xl", details: "22px / 600 / lh 1.3 / -0.01em" },
    { className: "head-text-xl", label: "head-text-xl", details: "20px / 600 / -0.01em" },
    { className: "head-text-lg", label: "head-text-lg", details: "18px / 600 / 0" },
    { className: "head-text-base", label: "head-text-base", details: "16px / 600 / -0.01em" },
    { className: "head-text-sm", label: "head-text-sm", details: "14px / 600 / -0.01em" },
    { className: "head-text-xs", label: "head-text-xs", details: "13px / 600 / -0.01em" },
    { className: "head-text-2xs", label: "head-text-2xs", details: "12px / 600 / 0" },
    { className: "head-text-3xs", label: "head-text-3xs", details: "11px / 600 / 0" },
    { className: "head-text-4xs", label: "head-text-4xs", details: "10px / 600 / 0" },
  ],
  Labels: [
    { className: "label-text-3xl", label: "label-text-3xl", details: "26px / 500 / -0.01em" },
    { className: "label-text-2xl", label: "label-text-2xl", details: "22px / 500 / 0" },
    { className: "label-text-xl", label: "label-text-xl", details: "20px / 500 / -0.01em" },
    { className: "label-text-lg", label: "label-text-lg", details: "18px / 500 / -0.01em" },
    { className: "label-text-base", label: "label-text-base", details: "16px / 500 / -0.01em" },
    { className: "label-text-sm", label: "label-text-sm", details: "14px / 500 / -0.005em" },
    { className: "label-text-xs", label: "label-text-xs", details: "13px / 500 / 0" },
    { className: "label-text-2xs", label: "label-text-2xs", details: "12px / 500 / 0" },
    { className: "label-text-3xs", label: "label-text-3xs", details: "11px / 500 / lh 1.5 / 0.005em" },
    { className: "label-text-4xs", label: "label-text-4xs", details: "10px / 500 / 0" },
  ],
  Body: [
    { className: "body-text-base", label: "body-text-base", details: "16px / 500 / lh 1.6 / -0.01em" },
    { className: "body-text-sm", label: "body-text-sm", details: "14px / 500 / lh 1.6 / 0" },
    { className: "body-text-xs", label: "body-text-xs", details: "13px / 500 / lh 1.55 / 0" },
    { className: "body-text-2xs", label: "body-text-2xs", details: "12px / 500 / lh 1.65 / 0" },
    { className: "body-text-3xs", label: "body-text-3xs", details: "11px / 500 / lh 1.35 / 0.03em" },
  ],
  Overline: [
    { className: "overline-text-sm", label: "overline-text-sm", details: "14px / 500 / -0.01em / uppercase" },
    { className: "overline-text-xs", label: "overline-text-xs", details: "13px / 500 / -0.01em / uppercase" },
    { className: "overline-text-2xs", label: "overline-text-2xs", details: "12px / 500 / 0 / uppercase" },
  ],
};

const RADIUS_TOKENS = [
  { name: "radius-none", value: "0px" },
  { name: "radius-sm", value: "2px" },
  { name: "radius-md", value: "4px" },
  { name: "radius-lg", value: "6px" },
  { name: "radius-xl", value: "8px" },
  { name: "radius-2xl", value: "10px" },
  { name: "radius-3xl", value: "12px" },
  { name: "radius-4xl", value: "14px" },
  { name: "radius-5xl", value: "16px" },
  { name: "radius-6xl", value: "18px" },
  { name: "radius-7xl", value: "20px" },
  { name: "radius-full", value: "999px" },
];

const SPACING_TOKENS = [
  { name: "spacing-none", value: "0px" },
  { name: "spacing-sm", value: "2px" },
  { name: "spacing-md", value: "4px" },
  { name: "spacing-lg", value: "6px" },
  { name: "spacing-xl", value: "8px" },
  { name: "spacing-2xl", value: "10px" },
  { name: "spacing-3xl", value: "12px" },
  { name: "spacing-4xl", value: "14px" },
  { name: "spacing-5xl", value: "16px" },
  { name: "spacing-6xl", value: "18px" },
  { name: "spacing-7xl", value: "20px" },
  { name: "spacing-8xl", value: "22px" },
];

const SHADOW_CLASSES = [
  { name: "shadow-pop-up-modal", css: "0px 8px 16px 0px rgba(36,38,40,0.09)" },
  { name: "shadow-floating-sidebar-left", css: "18px 0px 36px 0px rgba(0,0,0,0.06)" },
  { name: "shadow-page-canvas", css: "0px 0px 0px 1px rgba(36,36,40,0.05)" },
  { name: "shadow-menu-dropdown", css: "0px 12px 42px 0px rgba(0,0,0,0.1)" },
  { name: "shadow-node-connector", css: "0px 3.59px 10.78px 0px rgba(0,0,0,0.06)" },
  { name: "shadow-tooltip", css: "0px 4px 24px 0px rgba(0,0,0,0.05)" },
  { name: "shadow-toast", css: "0px 4px 12px 0px rgba(0,0,0,0.06)" },
  { name: "shadow-display-menu", css: "0px 1px 1px 0px rgba(36,38,40,0.04)" },
  { name: "shadow-button-primary", css: "0px 1px 1px 0.05px rgba(24,24,27,0.24)" },
  { name: "shadow-button-secondary", css: "0px 1px 1px 0px rgba(36,38,40,0.04)" },
  { name: "shadow-button-secondary-floating", css: "0px 4px 12px 0px rgba(0,0,0,0.06)" },
  { name: "shadow-button-secondary-floating-focus", css: "0px 4px 12px 0px rgba(0,0,0,0.06)" },
];

const COMPONENT_LIST = [
  {
    name: "Feature List",
    description: "Interactive property panel + live mobile preview for the Feature List widget. Supports icon types (Check, Star, Custom), optional icon containers with color & border radius, list descriptions, custom positioning, font/spacing controls.",
    route: "/feature-list-demo",
    files: [
      "components/feature-list/FeatureListDemo.tsx",
      "components/feature-list/PropertyPanel.tsx",
      "components/feature-list/FeatureListPreview.tsx",
    ],
    subComponents: [
      "HeaderBar", "LabelSection", "FieldsSection", "ConfigurationSection",
      "ListsSection", "SpacingSection", "FontSection",
    ],
    uiPrimitives: [
      "SliderWithInput", "ToggleField", "SectionWrapper", "SegmentedControl",
      "ColorPickerSwatch", "FontWeightSelect", "BorderRadiusSelect",
    ],
  },
] as const;

const SECTIONS = [
  { id: "components", label: "Components" },
  { id: "icons", label: "Icons" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "radius", label: "Radius" },
  { id: "spacing", label: "Spacing" },
  { id: "shadows", label: "Shadows" },
] as const;

const COMPONENT_ITEMS = [
  { id: "input-field", name: "InputField", path: "ui/InputField.tsx", description: "Text input field with consistent styling. Supports placeholder text, focus states, and full-width layouts." },
  { id: "segmented-control", name: "SegmentedControl", path: "ui/SegmentedControl.tsx", description: "Horizontal toggle group for switching between options. The active segment has a raised, highlighted appearance." },
  { id: "slider-with-input", name: "SliderWithInput", path: "ui/SliderWithInput.tsx", description: "Combination of a slider and numeric input field. Edit the value by dragging or typing directly." },
  { id: "toggle-field", name: "ToggleField", path: "ui/ToggleField.tsx", description: "Switch toggle with a label. Supports expandable child content that reveals when toggled on." },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
   Checkerboard for transparent colors
   ═══════════════════════════════════════════════════════════════════════════ */
const CHECKER = {
  backgroundImage:
    "linear-gradient(45deg,#e0e0e0 25%,transparent 25%),linear-gradient(-45deg,#e0e0e0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e0e0e0 75%),linear-gradient(-45deg,transparent 75%,#e0e0e0 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
};

const CHECKER_DARK = {
  backgroundImage:
    "linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Component preview card
   ═══════════════════════════════════════════════════════════════════════════ */

function PreviewCard({ name, path, children }: { name: string; path: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: "12px",
      background: "var(--background-bg-panel)",
      border: "1px solid var(--background-border-panel)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--background-border-panel)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span className="head-text-sm" style={{ color: "var(--text-foreground)" }}>{name}</span>
        <span className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", fontFamily: "monospace" }}>{path}</span>
      </div>
      {/* Preview area */}
      <div style={{ padding: "24px 20px" }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Components section — live previews of all UI primitives
   ═══════════════════════════════════════════════════════════════════════════ */

function ComponentsSection() {
  const [toggleA, setToggleA] = useState(true);
  const [segment, setSegment] = useState<"left" | "center" | "right">("left");
  const [sliderInputVal, setSliderInputVal] = useState(24);
  const [inputVal, setInputVal] = useState("Hello world");
  const [search, setSearch] = useState("");

  const components = [
    { id: "input-field", name: "InputField" },
    { id: "segmented-control", name: "SegmentedControl" },
    { id: "slider-with-input", name: "SliderWithInput" },
    { id: "toggle-field", name: "ToggleField" },
  ];

  const filtered = search.trim()
    ? components.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : components;

  const show = (id: string) => filtered.some(c => c.id === id);

  return (
    <section id="components" style={{ marginBottom: "72px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
        <h2 className="head-text-2xl">Components</h2>
        <span className="label-text-3xs" style={{ color: "var(--text-misc-foreground)" }}>{filtered.length} of {components.length}</span>
      </div>
      <p className="body-text-sm" style={{ color: "var(--text-muted-foreground)", marginBottom: "20px" }}>
        Reusable UI primitives from <span style={{ fontFamily: "monospace" }}>src/components/ui/</span>
      </p>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "24px", maxWidth: "360px" }}>
        <input
          type="text"
          placeholder={`Search ${components.length} components...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="label-text-xs"
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            borderRadius: "8px",
            border: "1px solid var(--input-field-primary-border)",
            background: "var(--input-field-primary-bg)",
            color: "var(--text-foreground)",
            outline: "none",
          }}
        />
        <svg
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
          width="14" height="14" viewBox="0 0 18 18" fill="none"
        >
          <circle cx="7.5" cy="7.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {show("input-field") && <PreviewCard name="InputField" path="ui/InputField.tsx">
          <div style={{ maxWidth: "320px" }}>
            <InputField value={inputVal} onChange={setInputVal} placeholder="Type something..." />
          </div>
        </PreviewCard>}

        {show("segmented-control") && <PreviewCard name="SegmentedControl" path="ui/SegmentedControl.tsx">
          <div style={{ maxWidth: "280px" }}>
            <SegmentedControl
              options={[
                { value: "left" as const, label: "Left" },
                { value: "center" as const, label: "Center" },
                { value: "right" as const, label: "Right" },
              ]}
              value={segment}
              onChange={setSegment}
            />
          </div>
        </PreviewCard>}

        {show("slider-with-input") && <PreviewCard name="SliderWithInput" path="ui/SliderWithInput.tsx">
          <div style={{ maxWidth: "320px" }}>
            <SliderWithInput label="Font Size" value={sliderInputVal} min={10} max={48} onChange={setSliderInputVal} />
          </div>
        </PreviewCard>}

        {show("toggle-field") && <PreviewCard name="ToggleField" path="ui/ToggleField.tsx">
          <div style={{ maxWidth: "320px" }}>
            <ToggleField label="Enable feature" checked={toggleA} onChange={setToggleA} />
          </div>
        </PreviewCard>}

        {filtered.length === 0 && (
          <p className="label-text-sm" style={{ color: "var(--text-muted-foreground)", padding: "48px 0", textAlign: "center" }}>
            No components matching &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StyleguidePage() {
  const [activeSection, setActiveSection] = useState("components");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const mainRef = useRef<HTMLElement | null>(null);
  const [iconManifest, setIconManifest] = useState<Record<string, string[]>>({});
  const [iconSearch, setIconSearch] = useState("");
  const [iconSize, setIconSize] = useState<"18px" | "12px-filled">("18px");
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [iconPage, setIconPage] = useState(0);
  const ICONS_PER_PAGE = 200;
  const [activeComponent, setActiveComponent] = useState<string>(COMPONENT_ITEMS[0].id);
  const [componentSearch, setComponentSearch] = useState("");

  const filteredComponents = useMemo(() => {
    if (!componentSearch.trim()) return COMPONENT_ITEMS;
    const q = componentSearch.toLowerCase();
    return COMPONENT_ITEMS.filter(c => c.name.toLowerCase().includes(q));
  }, [componentSearch]);

  useEffect(() => {
    fetch("/icons/icons-manifest.json")
      .then((r) => r.json())
      .then((d) => setIconManifest(d))
      .catch(() => {});
  }, []);

  const filteredIcons = useMemo(() => {
    const list = iconManifest[iconSize] || [];
    if (!iconSearch.trim()) return list;
    const q = iconSearch.toLowerCase();
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [iconManifest, iconSize, iconSearch]);

  const copyIconName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedIcon(name);
    setTimeout(() => setCopiedIcon(null), 1500);
  };

  const switchSection = (id: string) => {
    setActiveSection(id);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh", background: "var(--page-background)", color: "var(--text-foreground)" }}>
      <style>{`
        .sg-icon-btn:hover {
          background: var(--button-tertiary-bg) !important;
          border-color: var(--button-tertiary-border) !important;
        }
        .sg-icon-btn:active {
          background: var(--button-tertiary-bg-hover) !important;
          border-color: var(--button-tertiary-border-hover) !important;
        }
        .sg-page-btn:hover:not(:disabled) {
          background: var(--button-secondary-bg-hover) !important;
          border-color: var(--button-secondary-border-hover) !important;
        }
        .sg-nav-btn:hover {
          background: var(--sidebar-menu-hover) !important;
        }
        .sg-comp-btn:hover {
          color: var(--text-foreground) !important;
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: "220px",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--divider-primary)",
        display: "flex", flexDirection: "column",
        padding: "32px 0 24px",
        zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: "0 24px", marginBottom: "40px" }}>
          <p className="head-text-base" style={{ color: "var(--text-foreground)" }}>Zellify</p>
          <p className="label-text-3xs" style={{ color: "var(--text-muted-foreground)", marginTop: "2px" }}>Design Tokens</p>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 12px" }}>
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => switchSection(s.id)}
                className={`label-text-sm${!isActive ? " sg-nav-btn" : ""}`}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: isActive ? "var(--sidebar-menu-active)" : "transparent",
                  color: isActive ? "var(--text-foreground)" : "var(--text-secondary-foreground)",
                  border: isActive ? "1px solid var(--sidebar-menu-active-border)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Token count */}
        <div style={{ marginTop: "auto", padding: "0 24px" }}>
          <p className="label-text-4xs" style={{ color: "var(--text-misc-foreground)" }}>
            4,048 icons &middot; 134 colors
          </p>
          <p className="label-text-4xs" style={{ color: "var(--text-misc-foreground)" }}>
            28 type &middot; 12 radius &middot; 12 spacing &middot; 12 shadows
          </p>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main ref={mainRef} style={{ marginLeft: "220px", flex: 1, minWidth: 0, padding: "40px 48px 80px", height: "100vh", overflowY: "auto" }}>

        {/* ── Top bar with pill toggle ────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <span className="label-text-3xs" style={{ color: theme === "light" ? "var(--text-foreground)" : "var(--text-muted-foreground)" }}>Light</span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                position: "relative",
                width: "44px",
                height: "24px",
                borderRadius: "999px",
                background: theme === "dark" ? "var(--button-primary-bg)" : "var(--toggle-bg-secondary)",
                border: "1px solid " + (theme === "dark" ? "var(--button-primary-border)" : "var(--toggle-border)"),
                cursor: "pointer",
                padding: 0,
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <div style={{
                position: "absolute",
                top: "2px",
                left: theme === "dark" ? "22px" : "2px",
                width: "18px",
                height: "18px",
                borderRadius: "999px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s ease",
              }} />
            </button>
            <span className="label-text-3xs" style={{ color: theme === "dark" ? "var(--text-foreground)" : "var(--text-muted-foreground)" }}>Dark</span>
          </div>
        </div>

        {/* ── Components ───────────────────────────────────────── */}
        {activeSection === "components" && <ComponentsSection />}

        {/* ── Icons ──────────────────────────────────────────────── */}
        {activeSection === "icons" && <section
          ref={(el) => { sectionRefs.current.icons = el; }}
          id="icons"
          style={{ scrollMarginTop: "24px", marginBottom: "72px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "24px" }}>Icons</h2>

          {/* Controls bar */}
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: "12px",
            marginBottom: "24px",
          }}>
            {/* Size toggle */}
            <div style={{
              display: "flex", flexDirection: "row",
              background: "var(--toggle-bg-primary)",
              borderRadius: "8px",
              border: "1px solid var(--toggle-border)",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {(["18px", "12px-filled"] as const).map((size) => {
                const isActive = iconSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => { setIconSize(size); setIconPage(0); }}
                    className="label-text-2xs"
                    style={{
                      padding: "6px 14px",
                      background: isActive ? "var(--toggle-active-bg)" : "transparent",
                      border: isActive ? "1px solid var(--toggle-active-border)" : "1px solid transparent",
                      borderRadius: "7px",
                      color: isActive ? "var(--text-foreground)" : "var(--text-muted-foreground)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {size === "18px" ? "18px Outlined" : "12px Filled"}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{
              flex: 1,
              position: "relative",
            }}>
              <input
                type="text"
                placeholder={`Search ${(iconManifest[iconSize] || []).length} icons...`}
                value={iconSearch}
                onChange={(e) => { setIconSearch(e.target.value); setIconPage(0); }}
                className="label-text-xs"
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--input-field-primary-border)",
                  background: "var(--input-field-primary-bg)",
                  color: "var(--text-foreground)",
                  outline: "none",
                }}
              />
              {/* Search icon */}
              <svg
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
                width="14" height="14" viewBox="0 0 18 18" fill="none"
              >
                <circle cx="7.5" cy="7.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Count badge */}
            <span className="label-text-3xs" style={{
              color: "var(--text-muted-foreground)",
              flexShrink: 0,
            }}>
              {filteredIcons.length} icons
            </span>
          </div>

          {/* Icon grid */}
          {(() => {
            const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
            const pageIcons = filteredIcons.slice(iconPage * ICONS_PER_PAGE, (iconPage + 1) * ICONS_PER_PAGE);
            return (
              <>
                <div style={{
                  display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "4px",
                }}>
                  {pageIcons.map((name) => (
                    <button
                      key={name}
                      onClick={() => copyIconName(name)}
                      title={name}
                      className={copiedIcon !== name ? "sg-icon-btn" : ""}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        width: "56px", height: "56px",
                        borderRadius: "8px",
                        border: copiedIcon === name ? "1px solid var(--button-primary-bg)" : "1px solid transparent",
                        background: copiedIcon === name ? "var(--highlight-brand)" : "transparent",
                        cursor: "pointer",
                        padding: 0,
                        transition: "all 0.1s",
                        position: "relative",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/icons/${iconSize}/${name}.svg`}
                        alt={name}
                        width={iconSize === "18px" ? 18 : 12}
                        height={iconSize === "18px" ? 18 : 12}
                        style={{
                          filter: theme === "dark" ? "invert(1)" : "none",
                          opacity: 0.85,
                        }}
                      />
                      {copiedIcon === name && (
                        <span className="label-text-4xs" style={{
                          position: "absolute",
                          bottom: "2px",
                          color: "var(--button-primary-bg)",
                        }}>
                          copied
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: "8px", marginTop: "24px",
                  }}>
                    <button
                      onClick={() => { setIconPage((p) => Math.max(0, p - 1)); mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={iconPage === 0}
                      className="label-text-2xs sg-page-btn"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--button-secondary-border)",
                        background: "var(--button-secondary-bg)",
                        boxShadow: "0px 1px 1px 0px rgba(36,38,40,0.04)",
                        color: iconPage === 0 ? "var(--text-misc-foreground)" : "var(--text-foreground)",
                        cursor: iconPage === 0 ? "default" : "pointer",
                        opacity: iconPage === 0 ? 0.5 : 1,
                        transition: "all 0.1s",
                      }}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => { setIconPage(i); mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`label-text-2xs${i !== iconPage ? " sg-page-btn" : ""}`}
                        style={{
                          width: "32px", height: "32px",
                          borderRadius: "6px",
                          border: i === iconPage ? "1px solid var(--button-primary-border)" : "1px solid var(--button-secondary-border)",
                          background: i === iconPage ? "var(--button-primary-bg)" : "var(--button-secondary-bg)",
                          boxShadow: i === iconPage ? "0px 1px 1px 0.05px rgba(24,24,27,0.24)" : "0px 1px 1px 0px rgba(36,38,40,0.04)",
                          color: i === iconPage ? "#fff" : "var(--text-foreground)",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.1s",
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => { setIconPage((p) => Math.min(totalPages - 1, p + 1)); mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                      disabled={iconPage === totalPages - 1}
                      className="label-text-2xs sg-page-btn"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--button-secondary-border)",
                        background: "var(--button-secondary-bg)",
                        boxShadow: "0px 1px 1px 0px rgba(36,38,40,0.04)",
                        color: iconPage === totalPages - 1 ? "var(--text-misc-foreground)" : "var(--text-foreground)",
                        cursor: iconPage === totalPages - 1 ? "default" : "pointer",
                        opacity: iconPage === totalPages - 1 ? 0.5 : 1,
                        transition: "all 0.1s",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()}
          {filteredIcons.length === 0 && iconSearch && (
            <p className="label-text-sm" style={{
              color: "var(--text-muted-foreground)",
              padding: "48px 0",
              textAlign: "center",
            }}>
              No icons matching &ldquo;{iconSearch}&rdquo;
            </p>
          )}
        </section>}

        {/* ── Colors ─────────────────────────────────────────────── */}
        {activeSection === "colors" && <section
          ref={(el) => { sectionRefs.current.colors = el; }}
          id="colors"
          style={{ scrollMarginTop: "24px", marginBottom: "72px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "32px" }}>Colors</h2>

          {Object.entries(COLOR_GROUPS).map(([group, colorTokens]) => (
            <div key={group} style={{ marginBottom: "36px" }}>
              <h3 className="head-text-sm" style={{ color: "var(--text-secondary-foreground)", marginBottom: "12px" }}>
                {group}
              </h3>

              {/* Table header */}
              <div style={{
                display: "flex", flexDirection: "row", alignItems: "center",
                padding: "8px 16px",
                borderBottom: "1px solid var(--divider-primary)",
                gap: "16px",
              }}>
                <span className="label-text-4xs" style={{ color: "var(--text-misc-foreground)", width: "220px", flexShrink: 0 }}>TOKEN</span>
                <span className="label-text-4xs" style={{ color: "var(--text-misc-foreground)", flex: 1 }}>LIGHT</span>
                <span className="label-text-4xs" style={{ color: "var(--text-misc-foreground)", flex: 1 }}>DARK</span>
              </div>

              {/* Token rows */}
              {colorTokens.map((t) => (
                <div key={t.name} style={{
                  display: "flex", flexDirection: "row", alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--divider-primary)",
                  gap: "16px",
                }}>
                  {/* Token name */}
                  <span className="label-text-3xs" style={{
                    color: "var(--text-foreground)",
                    width: "220px", flexShrink: 0,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}>
                    --{t.name}
                  </span>

                  {/* Light value */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative", width: "32px", height: "32px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid #e0e0e0" }}>
                      <div style={{ position: "absolute", inset: 0, ...CHECKER }} />
                      <div style={{ position: "absolute", inset: 0, backgroundColor: t.light }} />
                    </div>
                    <span className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", fontFamily: "monospace" }}>
                      {t.light}
                    </span>
                  </div>

                  {/* Dark value */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative", width: "32px", height: "32px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid #333" }}>
                      <div style={{ position: "absolute", inset: 0, ...CHECKER_DARK }} />
                      <div style={{ position: "absolute", inset: 0, backgroundColor: t.dark }} />
                    </div>
                    <span className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", fontFamily: "monospace" }}>
                      {t.dark}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>}

        {/* ── Typography ─────────────────────────────────────────── */}
        {activeSection === "typography" && <section
          ref={(el) => { sectionRefs.current.typography = el; }}
          id="typography"
          style={{ scrollMarginTop: "24px", marginBottom: "72px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "32px" }}>Typography</h2>

          {Object.entries(TYPOGRAPHY_GROUPS).map(([group, styles]) => (
            <div key={group} style={{ marginBottom: "36px" }}>
              <h3 className="head-text-sm" style={{ color: "var(--text-secondary-foreground)", marginBottom: "16px" }}>
                {group}
              </h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {styles.map((s) => (
                  <div
                    key={s.className}
                    style={{
                      display: "flex", flexDirection: "row", alignItems: "baseline", gap: "24px",
                      padding: "14px 0",
                      borderBottom: "1px solid var(--divider-primary)",
                    }}
                  >
                    <div style={{ width: "200px", flexShrink: 0 }}>
                      <p className="label-text-xs" style={{ color: "var(--text-foreground)", fontFamily: "monospace" }}>
                        .{s.label}
                      </p>
                      <p className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", marginTop: "4px" }}>
                        {s.details}
                      </p>
                    </div>
                    <p className={s.className} style={{ color: "var(--text-foreground)" }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>}

        {/* ── Radius ──────────────────────────────────────────────── */}
        {activeSection === "radius" && <section
          ref={(el) => { sectionRefs.current.radius = el; }}
          id="radius"
          style={{ scrollMarginTop: "24px", marginBottom: "72px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "32px" }}>Radius</h2>
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "28px" }}>
            {RADIUS_TOKENS.map((t) => (
              <div key={t.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "64px", height: "64px",
                  background: "var(--button-primary-bg)",
                  borderRadius: t.value,
                }} />
                <div style={{ textAlign: "center" }}>
                  <p className="label-text-3xs" style={{ color: "var(--text-foreground)", fontFamily: "monospace" }}>--{t.name}</p>
                  <p className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", marginTop: "2px" }}>{t.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>}

        {/* ── Spacing ─────────────────────────────────────────────── */}
        {activeSection === "spacing" && <section
          ref={(el) => { sectionRefs.current.spacing = el; }}
          id="spacing"
          style={{ scrollMarginTop: "24px", marginBottom: "72px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "32px" }}>Spacing</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {SPACING_TOKENS.map((t) => (
              <div key={t.name} style={{
                display: "flex", flexDirection: "row", alignItems: "center", gap: "16px",
                padding: "6px 0",
              }}>
                <span className="label-text-3xs" style={{ color: "var(--text-secondary-foreground)", fontFamily: "monospace", width: "140px", flexShrink: 0 }}>
                  --{t.name}
                </span>
                <div style={{
                  height: "24px",
                  width: t.value === "999px" ? "100px" : t.value === "0px" ? "2px" : t.value,
                  background: "var(--button-primary-bg)",
                  borderRadius: "3px",
                  opacity: t.value === "999px" ? 0.4 : 1,
                }} />
                <span className="label-text-4xs" style={{ color: "var(--text-muted-foreground)" }}>
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </section>}

        {/* ── Shadows ─────────────────────────────────────────────── */}
        {activeSection === "shadows" && <section
          ref={(el) => { sectionRefs.current.shadows = el; }}
          id="shadows"
          style={{ scrollMarginTop: "24px" }}
        >
          <h2 className="head-text-2xl" style={{ marginBottom: "32px" }}>Shadows &amp; Effects</h2>
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "20px" }}>
            {SHADOW_CLASSES.map((s) => (
              <div
                key={s.name}
                className={s.name}
                style={{
                  width: "calc(33.333% - 14px)",
                  minWidth: "260px",
                  flexGrow: 1,
                  borderRadius: "12px",
                  background: "var(--background-bg-panel)",
                  border: "1px solid var(--background-border-panel)",
                  padding: "24px 20px",
                  display: "flex", flexDirection: "column", gap: "8px",
                  minHeight: "100px",
                  justifyContent: "center",
                }}
              >
                <p className="label-text-xs" style={{ color: "var(--text-foreground)", fontFamily: "monospace" }}>
                  .{s.name}
                </p>
                <p className="label-text-4xs" style={{ color: "var(--text-muted-foreground)", fontFamily: "monospace" }}>
                  {s.css}
                </p>
              </div>
            ))}
          </div>
        </section>}
      </main>
    </div>
  );
}
