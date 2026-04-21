"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ToggleField } from "@/components/ui/ToggleField";
import { InputField } from "@/components/ui/InputField";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */
function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const prefix = size <= 12 ? "12px-filled" : "18px";
  const file = size <= 12 ? `12-${name}` : `18-${name}`;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: "currentColor",
        maskImage: `url(/icons/${prefix}/${file}.svg)`,
        WebkitMaskImage: `url(/icons/${prefix}/${file}.svg)`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Icon Button (toolbar)                                              */
/* ------------------------------------------------------------------ */
const IconButton = forwardRef<
  HTMLButtonElement,
  { icon: string; label?: string; active?: boolean } & React.ComponentPropsWithoutRef<"button">
>(({ icon, label, active, ...props }, ref) => {
  return (
    <button
      ref={ref}
      {...props}
      className="flex items-center justify-center gap-1.5 rounded-[10px] shrink-0"
      style={{
        height: 30,
        minWidth: label ? undefined : 30,
        width: label ? undefined : 30,
        padding: label ? "0 10px" : undefined,
        background: active ? "var(--button-tertiary-bg)" : "transparent",
        border: active
          ? "1px solid var(--button-tertiary-border)"
          : "1px solid transparent",
        color: active
          ? "var(--text-secondary-foreground)"
          : "var(--icon-muted-foreground)",
        cursor: "pointer",
        transition:
          "background 160ms var(--ease-out), border-color 160ms var(--ease-out), color 160ms var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--button-tertiary-bg-hover)";
          e.currentTarget.style.borderColor = "var(--button-tertiary-border-hover)";
          e.currentTarget.style.color = "var(--text-secondary-foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.color = "var(--icon-muted-foreground)";
        }
      }}
    >
      <Icon name={icon} size={16} />
      {label && <span className="label-text-sm">{label}</span>}
    </button>
  );
});
IconButton.displayName = "IconButton";

/* ------------------------------------------------------------------ */
/*  Theme toggle — sun / moon (uses master SegmentedControl)           */
/* ------------------------------------------------------------------ */
function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return (
    <SegmentedControl
      options={[
        { value: "light" as const, label: "", icon: <Icon name="sun" size={16} /> },
        { value: "dark" as const, label: "", icon: <Icon name="moon" size={16} /> },
      ]}
      value={theme}
      onChange={setTheme}
      iconOnly
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Row 1 — Top Bar                                                    */
/* ------------------------------------------------------------------ */
const CENTER_ICONS: { icon: string; label: string; active?: boolean }[] = [
  { icon: "connection-2", label: "Funnel", active: true },
  { icon: "split", label: "A/B Test" },
  { icon: "box", label: "Product" },
  { icon: "megaphone", label: "Campaign" },
  { icon: "sliders", label: "Configuration" },
];

function TopBar() {
  return (
    <div
      className="relative flex items-center justify-between h-[52px] px-4 shrink-0 border-b"
      style={{
        background: "var(--page-background)",
        borderColor: "var(--divider-primary)",
      }}
    >
      {/* Left — Workspace switcher */}
      <div className="flex items-center shrink-0">
        <button
          className="flex items-center gap-2 rounded-[10px] border shrink-0"
          style={{
            height: 34,
            paddingLeft: 8,
            paddingRight: 10,
            background: "var(--button-secondary-bg)",
            borderColor: "var(--button-secondary-border)",
            boxShadow:
              "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
            cursor: "pointer",
            transition: "background 160ms var(--ease-out)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--button-secondary-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--button-secondary-bg)")
          }
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: "#635bff",
              color: "#fff",
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            S
          </span>
          <span
            className="label-text-sm"
            style={{ color: "var(--text-secondary-foreground)" }}
          >
            Stripe
          </span>
          <Icon
            name="chevron-expand-y"
            size={11}
            className="text-[var(--icon-muted-foreground)]"
          />
        </button>
      </div>

      {/* Center — Nav buttons with tooltips (absolutely centered) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 py-2.5">
        {CENTER_ICONS.map((item) =>
          item.active ? (
            <IconButton key={item.icon} icon={item.icon} label={item.label} active />
          ) : (
            <Tooltip key={item.icon} label={item.label}>
              <IconButton icon={item.icon} />
            </Tooltip>
          )
        )}
      </div>

      {/* Right — Dashboard + Theme toggle */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <IconButton icon="chart" label="Dashboard" />
        <ThemeToggle />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row 2 — Sub Bar                                                    */
/* ------------------------------------------------------------------ */
function SubBar() {
  const [activeView, setActiveView] = useState<"page" | "flow" | "analytics">(
    "page",
  );

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0 border-b"
      style={{
        background: "var(--page-background)",
        borderColor: "var(--divider-primary)",
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      {/* Left — Sidebar toggle + Funnel selector */}
      <div className="flex items-center shrink-0">
        <div
          className="flex items-center rounded-[8px] overflow-hidden border"
          style={{
            background: "var(--button-tertiary-bg)",
            borderColor: "var(--button-tertiary-border)",
          }}
        >
          {/* Sidebar toggle */}
          <button
            className="flex items-center justify-center shrink-0 border-r"
            style={{
              width: 34,
              height: 30,
              background: "var(--button-secondary-bg)",
              borderColor: "var(--button-secondary-border)",
              color: "var(--icon-secondary-foreground)",
              cursor: "pointer",
              transition: "background 160ms var(--ease-out)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--button-secondary-bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--button-secondary-bg)")
            }
          >
            <Icon name="sidebar-right" size={16} />
          </button>

          {/* Funnel selector */}
          <button
            className="flex items-center gap-1.5 px-2.5 shrink-0"
            style={{
              height: 30,
              background: "transparent",
              border: "none",
              color: "var(--icon-secondary-foreground)",
              cursor: "pointer",
              transition: "background 160ms var(--ease-out)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--button-tertiary-bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Icon name="connection-2" size={16} />
            <span
              className="label-text-sm"
              style={{ color: "var(--icon-secondary-foreground)" }}
            >
              Winter Funnel
            </span>
            <Icon
              name="chevron-down"
              size={11}
              className="text-[var(--icon-muted-foreground)]"
            />
          </button>
        </div>
      </div>

      {/* Center — Page / Flow / Analytics toggle (master component) */}
      <div className="shrink-0">
        <SegmentedControl
          options={[
            {
              value: "page" as const,
              label: "Page",
              icon: <Icon name="mobile" size={16} />,
            },
            {
              value: "flow" as const,
              label: "Flow",
              icon: <Icon name="code-branch" size={16} />,
            },
            {
              value: "analytics" as const,
              label: "Analytics",
              icon: <Icon name="chart-line" size={16} />,
            },
          ]}
          value={activeView}
          onChange={setActiveView}
        />
      </div>

      {/* Right — Link + Preview, Publish */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Link + Preview group */}
        <div
          className="flex items-center rounded-[8px] overflow-hidden border"
          style={{
            background: "var(--button-secondary-bg)",
            borderColor: "var(--button-secondary-border)",
            boxShadow:
              "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
          }}
        >
          <button
            className="flex items-center justify-center border-r shrink-0"
            style={{
              width: 32,
              height: 30,
              background: "var(--button-secondary-bg)",
              borderColor: "var(--button-secondary-border)",
              color: "var(--icon-secondary-foreground)",
              cursor: "pointer",
              transition: "background 160ms var(--ease-out)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--button-secondary-bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--button-secondary-bg)")
            }
          >
            <Icon name="link" size={16} />
          </button>
          <button
            className="flex items-center gap-1.5 px-2 shrink-0"
            style={{
              height: 30,
              background: "var(--button-secondary-bg)",
              border: "none",
              color: "var(--icon-secondary-foreground)",
              cursor: "pointer",
              transition: "background 160ms var(--ease-out)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--button-secondary-bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--button-secondary-bg)")
            }
          >
            <Icon name="eye" size={16} />
            <span
              className="label-text-sm"
              style={{ color: "var(--text-secondary-foreground)" }}
            >
              Preview
            </span>
          </button>
        </div>

        {/* Publish */}
        <button
          className="flex items-center justify-center rounded-[8px] shrink-0"
          style={{
            height: 30,
            padding: "0 10px",
            background: "var(--button-primary-bg)",
            border: "1px solid var(--button-primary-border)",
            boxShadow:
              "0px 1px 1px 0.05px rgba(24,24,27,0.24), inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
            color: "var(--text-full-white)",
            cursor: "pointer",
            transition: "background 160ms var(--ease-out)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "var(--button-primary-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--button-primary-bg)")
          }
        >
          <span className="label-text-sm">Publish</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas — Undo/Redo + Phone Preview + Zoom + Page Selector          */
/* ------------------------------------------------------------------ */
function SmallButton({ icon, children, ...props }: { icon: string; children?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="flex items-center justify-center rounded-[8px] border"
      style={{
        width: children ? undefined : 30,
        height: 30,
        padding: children ? "0 8px" : undefined,
        gap: 4,
        background: "var(--button-secondary-bg)",
        borderColor: "var(--button-secondary-border)",
        color: "var(--icon-muted-foreground)",
        cursor: "pointer",
        boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        transition: "background 160ms var(--ease-out)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--button-secondary-bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--button-secondary-bg)")}
    >
      <Icon name={icon} size={16} />
      {children}
    </button>
  );
}

const DOT_PATTERN = {
  image: "radial-gradient(circle, #9a9a9f 0.5px, transparent 0.5px)",
  size: "10px 10px",
  opacity: 0.5,
};

function Canvas() {

  return (
    <div className="min-w-0 flex flex-col gap-3 overflow-hidden" style={{ flex: "1 1 0%", order: 0, background: "var(--page-background)", padding: "12px 0 12px 12px" }}>
      {/* Canvas card */}
      <div
        className="flex-1 min-h-0 relative flex flex-col rounded-[10px] border overflow-hidden"
        style={{
          background: "var(--background-bg-panel)",
          borderColor: "var(--background-secondary-border-secondary)",
          boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04), 0px 1px 0px 0px rgba(0,0,0,0.04), 0px 4px 12px 0px rgba(0,0,0,0.06)",
        }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: DOT_PATTERN.image,
            backgroundSize: DOT_PATTERN.size,
            opacity: DOT_PATTERN.opacity,
          }}
        />

        {/* Undo / Redo — floating top-left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
          <SmallButton icon="arrow-rotate-anticlockwise" />
          <SmallButton icon="arrow-rotate-clockwise" />
        </div>

        {/* Phone mockup + page selector — centered */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-[1]">
          <div
            className="relative shrink-0"
            style={{ width: 278, height: 585 }}
          >
            {/* Phone frame — dark border with inner radius */}
            <div
              className="absolute inset-0 rounded-[31px] pointer-events-none"
              style={{
                border: "2.5px solid #a0a0a7",
                background: "#000",
                boxShadow: "inset 0 0 0.2px 2.6px #3f3f3f, 0 11.366px 17.049px -3.41px rgba(0,0,0,0.10), 0 4.546px 6.819px -2.273px rgba(0,0,0,0.05)",
              }}
            />

            {/* Screen area */}
            <div
              className="absolute overflow-hidden"
              style={{
                top: "1.9%",
                left: "3.5%",
                right: "3.3%",
                bottom: "1.7%",
                borderRadius: 22,
                background: "#ffffff",
              }}
            >
              <img
                src="/phone-screen.webp"
                alt="Paywall screen"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* Page selector — below phone */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-[8px] border px-2.5"
              style={{
                height: 30,
                background: "var(--button-secondary-bg)",
                borderColor: "var(--button-secondary-border)",
                boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
              }}
            >
              <Icon name="mobile" size={14} className="text-[var(--icon-muted-foreground)]" />
              <span className="label-text-xs" style={{ color: "var(--text-secondary-foreground)" }}>Pricing</span>
              <Icon name="chevron-expand-y" size={10} className="text-[var(--icon-muted-foreground)]" />
            </div>
            <div
              className="flex items-center gap-1 rounded-[8px] border px-2"
              style={{
                height: 30,
                background: "var(--button-secondary-bg)",
                borderColor: "var(--button-secondary-border)",
                boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
              }}
            >
              <Icon name="flask" size={14} className="text-[var(--icon-muted-foreground)]" />
              <span className="label-text-xs" style={{ color: "var(--text-secondary-foreground)" }}>A</span>
              <Icon name="chevron-expand-y" size={10} className="text-[var(--icon-muted-foreground)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right Property Panel                                               */
/* ------------------------------------------------------------------ */
function PropertyPanel() {
  const [propTab, setPropTab] = useState<"props" | "style" | "variable">("props");
  const [panelTab, setPanelTab] = useState<"properties" | "variant">("properties");
  const [headerText, setHeaderText] = useState("Create your nickname");
  const [showHeader, setShowHeader] = useState(true);
  const [subheadText, setSubheadText] = useState("Enter a unique nickname to get started");
  const [showSubhead, setShowSubhead] = useState(true);
  const [showUnit, setShowUnit] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("Enter your nickname");
  const [answerRequired, setAnswerRequired] = useState(true);
  const [customPositioning, setCustomPositioning] = useState(true);

  return (
    <div
      className="property-panel flex flex-col overflow-hidden"
      style={{
        width: 340,
        flexShrink: 0,
        order: 1,
        background: "var(--page-background)",
        borderColor: "var(--divider-primary)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Scrollable content — single panel card */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3" style={{ scrollbarWidth: "none" }}>
        <div
          className="rounded-[12px] overflow-hidden"
          style={{
            background: "var(--background-primary-bg-primary)",
            border: "1px solid var(--background-secondary-border-secondary)",
            boxShadow: "0 1px 2px -1px rgba(36,38,40,0.10), 0 1px 1px 0 rgba(36,38,40,0.04), 0 1px 0 0 rgba(0,0,0,0.04), 0 4px 12px 0 rgba(0,0,0,0.06)",
          }}
        >
          {/* Grey top zone — tabs */}
          <div className="px-3 pt-3 pb-3">
            <SegmentedControl
              options={[
                { value: "props" as const, label: "Props", icon: <Icon name="grid-2" size={14} /> },
                { value: "style" as const, label: "Style", icon: <Icon name="paintbrush" size={14} /> },
                { value: "variable" as const, label: "Variable", icon: <Icon name="x-variable" size={14} /> },
              ]}
              value={propTab}
              onChange={setPropTab}
            />
          </div>

          {/* White content zone — rounded top corners, no border */}
          <div
            style={{
              background: "var(--background-bg-panel)",
              borderRadius: "10px 10px 0 0",
              borderTop: "1px solid var(--background-secondary-border-secondary)",
            }}
          >
            {/* Component header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Icon name="input-field" size={16} className="text-[var(--icon-secondary-foreground)]" />
                <span className="label-text-sm" style={{ color: "var(--text-foreground)", fontWeight: 600 }}>Input Field</span>
              </div>
              <button style={{ background: "transparent", border: "none", color: "var(--icon-muted-foreground)", cursor: "pointer" }}>
                <Icon name="trash" size={12} />
              </button>
            </div>

            {/* Properties / Variant toggle */}
            <div className="px-4 pb-3">
              <SegmentedControl
                options={[
                  { value: "properties" as const, label: "Properties" },
                  { value: "variant" as const, label: "Variant" },
                ]}
                value={panelTab}
                onChange={setPanelTab}
              />
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-5 pb-6">
              <SectionWrapper title="Label">
                <div className="flex flex-col gap-2 px-4">
                  <span className="label-text-xs" style={{ color: "var(--text-secondary-foreground)" }}>Component ID</span>
                  <InputField value="input-field-1" onChange={() => {}} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="FIELDS">
                <div className="flex flex-col gap-4 px-4">
                  <ToggleField label="Header" checked={showHeader} onChange={setShowHeader}>
                    <InputField value={headerText} onChange={setHeaderText} />
                  </ToggleField>
                  <ToggleField label="Subhead" checked={showSubhead} onChange={setShowSubhead}>
                    <InputField value={subheadText} onChange={setSubheadText} />
                  </ToggleField>
                  <ToggleField label="Unit" checked={showUnit} onChange={setShowUnit} />
                  <div className="flex flex-col gap-2">
                    <span className="label-text-xs" style={{ color: "var(--text-secondary-foreground)" }}>Placeholder</span>
                    <InputField value={placeholderText} onChange={setPlaceholderText} />
                  </div>
                </div>
              </SectionWrapper>

              <SectionWrapper title="CONFIGURATION">
                <div className="flex flex-col gap-3 px-4">
                  <ToggleField label="Answer Required" checked={answerRequired} onChange={setAnswerRequired} />
                  <div className="flex flex-col gap-2">
                    <span className="label-text-xs" style={{ color: "var(--text-secondary-foreground)" }}>Border Radius</span>
                    <div
                      className="flex items-center justify-between px-2.5 rounded-[8px]"
                      style={{
                        height: 36,
                        background: "var(--input-field-secondary-bg)",
                        border: "1px solid var(--input-field-secondary-border)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon name="corner-radius" size={14} className="text-[var(--icon-muted-foreground)]" />
                        <span className="label-text-sm" style={{ color: "var(--text-foreground)" }}>Default</span>
                      </div>
                      <Icon name="chevron-down" size={12} className="text-[var(--icon-muted-foreground)]" />
                    </div>
                  </div>
                  <ToggleField label="Custom Positioning" checked={customPositioning} onChange={setCustomPositioning} />
                </div>
              </SectionWrapper>
            </div>{/* end sections */}
          </div>{/* end white content zone */}
        </div>{/* end panel card */}
      </div>{/* end scrollable */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right Icon Sidebar                                                 */
/* ------------------------------------------------------------------ */
const SIDEBAR_ITEMS = [
  { id: "pages", icon: "mobile", label: "Pages" },
  { id: "format", icon: "pen-2", label: "Format" },
  { id: "blocks", icon: "grid-2", label: "Blocks" },
  { id: "agents", icon: "sparkle", label: "Agents" },
] as const;

function RightSidebar() {
  const [active, setActive] = useState("format");
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const btn = btnRefs.current[active];
      if (!btn) return;
      setIndicator({ top: btn.offsetTop, height: btn.offsetHeight });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [active]);

  return (
    <div
      className="flex flex-col border-l"
      style={{
        width: 90,
        flexShrink: 0,
        order: 2,
        background: "var(--page-background)",
        borderColor: "var(--divider-primary)",
        padding: 12,
      }}
    >
      <div
        ref={containerRef}
        style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}
      >
        {/* Sliding active indicator */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            top: indicator?.top ?? 0,
            height: indicator?.height ?? 0,
            opacity: indicator ? 1 : 0,
            borderRadius: 8,
            background: "var(--button-secondary-bg)",
            border: "1px solid var(--button-secondary-border)",
            boxShadow: "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
            transition: "top 280ms cubic-bezier(0.23, 1, 0.32, 1), height 280ms cubic-bezier(0.23, 1, 0.32, 1)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {SIDEBAR_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { btnRefs.current[item.id] = el; }}
              onClick={(e) => { e.currentTarget.style.background = "transparent"; setActive(item.id); }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 66,
                height: 63,
                padding: "10px 6px",
                gap: 4,
                borderRadius: 8,
                background: "transparent",
                border: "none",
                outline: "none",
                color: isActive ? "var(--text-secondary-foreground)" : "var(--text-muted-foreground)",
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                transition: "color 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
              onMouseEnter={(e) => {
                if (active !== item.id) e.currentTarget.style.background = "var(--button-tertiary-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              onFocus={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ color: isActive ? "var(--button-primary-bg)" : undefined, display: "flex" }}>
                <Icon name={item.icon} size={20} />
              </span>
              <span className="label-text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prototype Page                                                     */
/* ------------------------------------------------------------------ */
export default function PrototypePage() {
  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={0}>
    <div
      className="h-screen overflow-hidden"
      style={{ display: "flex", flexDirection: "column", background: "var(--page-background)" }}
    >
      <TopBar />
      <SubBar />
      <div style={{ display: "flex", flexDirection: "row", flex: "1 1 0%", minHeight: 0 }}>
        <Canvas />
        <PropertyPanel />
        <RightSidebar />
      </div>
    </div>
    </TooltipProvider>
  );
}
