"use client";

import { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Icon helper — mask-image pattern from the design system            */
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
  const prefix = size === 12 ? "12px-filled" : "18px";
  const file = size === 12 ? `12-${name}` : `18-${name}`;
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
/*  Mock workspace data                                                */
/* ------------------------------------------------------------------ */
const WORKSPACES = [
  { id: "1", name: "Zellify", color: "#f3533f" },
  { id: "2", name: "Acme Corp", color: "#6366f1" },
  { id: "3", name: "Startup Inc", color: "#f59e0b" },
  { id: "4", name: "Design Lab", color: "#10b981" },
];

/* ------------------------------------------------------------------ */
/*  Workspace Switcher                                                 */
/* ------------------------------------------------------------------ */
function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(WORKSPACES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-[10px] border px-2.5 py-1.5 transition-colors"
        style={{
          background: "var(--button-secondary-bg)",
          borderColor: open
            ? "var(--button-secondary-border-focus)"
            : "var(--button-secondary-border)",
        }}
      >
        {/* Workspace icon */}
        <span
          className="flex items-center justify-center rounded-md"
          style={{
            width: 24,
            height: 24,
            background: selected.color,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {selected.name.charAt(0)}
        </span>
        <span className="label-text-sm" style={{ color: "var(--text-foreground)" }}>
          {selected.name}
        </span>
        <Icon
          name="chevron-expand-y"
          size={18}
          className="ml-1"
          style={{} as any}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[220px] rounded-xl border p-1.5 shadow-menu-dropdown"
          style={{
            background: "var(--menu-bg)",
            borderColor: "var(--menu-border)",
          }}
        >
          {WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setSelected(ws);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
              style={{
                background:
                  ws.id === selected.id
                    ? "var(--menu-list-hover)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                if (ws.id !== selected.id)
                  e.currentTarget.style.background =
                    "var(--menu-list-hover)";
              }}
              onMouseLeave={(e) => {
                if (ws.id !== selected.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="flex items-center justify-center rounded-md"
                style={{
                  width: 24,
                  height: 24,
                  background: ws.color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {ws.name.charAt(0)}
              </span>
              <span
                className="label-text-sm"
                style={{ color: "var(--text-foreground)" }}
              >
                {ws.name}
              </span>
              {ws.id === selected.id && (
                <Icon
                  name="check"
                  size={18}
                  className="ml-auto"
                  style={{} as any}
                />
              )}
            </button>
          ))}

          {/* Divider */}
          <div
            className="my-1.5 h-px"
            style={{ background: "var(--divider-primary)" }}
          />

          {/* Create new */}
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
            style={{ color: "var(--text-secondary-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--menu-list-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Icon name="plus" size={18} />
            <span className="label-text-sm">Create new workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar icon button                                                 */
/* ------------------------------------------------------------------ */
function NavIconButton({
  icon,
  label,
  active,
}: {
  icon: string;
  label?: string;
  active?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors"
      style={{
        background: active
          ? "var(--toggle-active-bg)"
          : "transparent",
        borderColor: active
          ? "var(--toggle-active-border)"
          : "transparent",
        color: active
          ? "var(--text-foreground)"
          : "var(--icon-secondary-foreground)",
      }}
      onMouseEnter={(e) => {
        if (!active)
          e.currentTarget.style.background = "var(--menu-list-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={icon} size={18} />
      {label && (
        <span className="label-text-xs">{label}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Navbar                                                         */
/* ------------------------------------------------------------------ */
export function TopNavbar() {
  return (
    <header
      className="flex h-[52px] items-center justify-between border-b px-3"
      style={{
        background: "var(--foreground-bg)",
        borderColor: "var(--divider-primary)",
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <WorkspaceSwitcher />

        {/* Breadcrumb separator */}
        <span
          className="label-text-sm"
          style={{ color: "var(--text-misc-foreground)" }}
        >
          /
        </span>

        {/* Page title */}
        <span
          className="label-text-sm"
          style={{ color: "var(--text-foreground)" }}
        >
          Development funnel
        </span>

        {/* Pin + Help */}
        <button
          className="flex items-center justify-center rounded-md p-1 transition-colors"
          style={{ color: "var(--icon-muted-foreground)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--menu-list-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Icon name="pin" size={18} />
        </button>
        <button
          className="flex items-center justify-center rounded-md p-1 transition-colors"
          style={{ color: "var(--icon-muted-foreground)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--menu-list-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Icon name="circle-question" size={18} />
        </button>
      </div>

      {/* Center section — Editor + tools */}
      <div className="flex items-center gap-1">
        <NavIconButton icon="grid-2x2" label="Editor" active />
        <div
          className="mx-1.5 h-4 w-px"
          style={{ background: "var(--divider-primary)" }}
        />
        <NavIconButton icon="sliders" />
        <NavIconButton icon="git-branch" />
        <NavIconButton icon="share-right" />
        <NavIconButton icon="globe" />
        <NavIconButton icon="code-2" />
        <NavIconButton icon="layers-2" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Share */}
        <button
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors shadow-button-secondary"
          style={{
            background: "var(--button-secondary-bg)",
            borderColor: "var(--button-secondary-border)",
            color: "var(--text-foreground)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "var(--button-secondary-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "var(--button-secondary-bg)")
          }
        >
          <span className="label-text-xs">Share</span>
        </button>

        {/* Preview */}
        <button
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors shadow-button-secondary"
          style={{
            background: "var(--button-secondary-bg)",
            borderColor: "var(--button-secondary-border)",
            color: "var(--text-foreground)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "var(--button-secondary-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "var(--button-secondary-bg)")
          }
        >
          <Icon name="eye" size={18} />
          <span className="label-text-xs">Preview</span>
        </button>

        {/* Publish */}
        <button
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors shadow-button-primary"
          style={{
            background: "var(--button-primary-bg)",
            borderColor: "var(--button-primary-border)",
            color: "#fff",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "var(--button-primary-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "var(--button-primary-bg)")
          }
        >
          <span className="label-text-xs">Publish</span>
        </button>
      </div>
    </header>
  );
}
