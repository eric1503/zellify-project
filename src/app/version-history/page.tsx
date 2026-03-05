"use client";

import { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Icon helper (mask-based, uses /icons/18px/)                        */
/* ------------------------------------------------------------------ */
function Icon({
  name,
  size = 18,
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(/icons/18px/18-${name}.svg)`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(/icons/18px/18-${name}.svg)`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type User = {
  initials: string;
  email: string;
  bg: string;
  color: string;
};

type VersionEntry = {
  id: string;
  type: "version";
  time: string;
  user: User;
  isCurrent?: boolean;
};

type AutosaveGroup = {
  id: string;
  type: "autosave";
  count: number;
  children: VersionEntry[];
};

type DaySection = {
  label: string;
  items: (VersionEntry | AutosaveGroup)[];
};

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */
function Avatar({
  initials,
  bg,
  color,
  size = 14,
}: {
  initials: string;
  bg: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: bg,
        color,
        fontSize: size * 0.5,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const eric: User = { initials: "EA", email: "ericangelo1503@gmail.com", bg: "#F4DCE6", color: "#A03F6B" };
const jaylah: User = { initials: "JJ", email: "jaylah.j@synapsys.net", bg: "#DCEAF4", color: "#3A5F8A" };
const tessie: User = { initials: "TK", email: "tessie_kuvalis@konex.com", bg: "#E0E8D4", color: "#5A7A3A" };
const albin: User = { initials: "A9", email: "albin92@zoomdog.net", bg: "#D4E8E8", color: "#3A7A7A" };
const margarett: User = { initials: "MW", email: "margarett.ward@donware.com", bg: "#F4E4D4", color: "#8A6A3A" };
const maceo: User = { initials: "MR", email: "maceo.reichert@zencorporation.com", bg: "#E0D8F4", color: "#5A3FA0" };
const brenda: User = { initials: "B6", email: "brenda67@plexzap.com", bg: "#D8E4F4", color: "#3A5A8A" };
const nils: User = { initials: "NZ", email: "nils@zellify.app", bg: "#EBE0F4", color: "#7B3FA0" };

const initialSections: DaySection[] = [
  {
    label: "TODAY",
    items: [
      { id: "v1", type: "version", time: "Current Version", user: eric, isCurrent: true },
      { id: "v2", type: "version", time: "Mar 3, 2026 - 5:55PM", user: jaylah },
      {
        id: "a1",
        type: "autosave",
        count: 3,
        children: [
          { id: "v3", type: "version", time: "Mar 3, 2026 - 3:17PM", user: eric },
          { id: "v4", type: "version", time: "Mar 3, 2026 - 1:27PM", user: tessie },
          { id: "v5", type: "version", time: "Mar 3, 2026 - 8:42AM", user: albin },
        ],
      },
    ],
  },
  {
    label: "YESTERDAY",
    items: [
      { id: "v6", type: "version", time: "Mar 2, 2026 - 1:17PM", user: eric },
      { id: "v7", type: "version", time: "Mar 2, 2026 - 9:42AM", user: maceo },
    ],
  },
  {
    label: "MAR 1, 2026",
    items: [
      { id: "v8", type: "version", time: "Mar 1, 2026 - 11:29 AM", user: margarett },
      { id: "v9", type: "version", time: "Mar 1, 2026 - 4:29 AM", user: eric },
    ],
  },
  {
    label: "FEB 28, 2026",
    items: [
      { id: "v10", type: "version", time: "Feb 28, 2026 - 11:29 AM", user: brenda },
      { id: "v11", type: "version", time: "Feb 28, 2026 - 4:29 AM", user: nils },
    ],
  },
];

const olderSections: DaySection[] = [
  {
    label: "FEB 27, 2026",
    items: [
      { id: "v12", type: "version", time: "Feb 27, 2026 - 3:10 PM", user: jaylah },
      { id: "v13", type: "version", time: "Feb 27, 2026 - 10:05 AM", user: tessie },
    ],
  },
  {
    label: "FEB 26, 2026",
    items: [
      { id: "v14", type: "version", time: "Feb 26, 2026 - 6:22 PM", user: maceo },
      { id: "v15", type: "version", time: "Feb 26, 2026 - 9:15 AM", user: albin },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Filter Dropdown                                                    */
/* ------------------------------------------------------------------ */
function FilterDropdown({
  open,
  onClose,
  filter,
  setFilter,
}: {
  open: boolean;
  onClose: () => void;
  filter: "all" | "mine";
  setFilter: (v: "all" | "mine") => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-4 top-[48px] z-10 flex flex-col gap-[2px] overflow-clip rounded-[var(--radius-xl)] border p-1 shadow-menu-dropdown"
      style={{
        width: 152,
        background: "var(--menu-bg)",
        borderColor: "var(--menu-border)",
      }}
    >
      {[
        { value: "all" as const, label: "All versions" },
        { value: "mine" as const, label: "My versions only" },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            setFilter(opt.value);
            onClose();
          }}
          className="flex h-[30px] items-center gap-2 rounded-[var(--radius-xl)] px-2 transition-colors"
          style={{
            background: filter === opt.value ? "var(--menu-list-hover)" : "transparent",
            borderColor: filter === opt.value ? "var(--menu-list-border-hover)" : "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--menu-list-hover)";
          }}
          onMouseLeave={(e) => {
            if (filter !== opt.value) e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            className="label-text-2xs flex-1 text-left"
            style={{
              color:
                filter === opt.value
                  ? "var(--text-foreground)"
                  : "var(--text-secondary-foreground)",
            }}
          >
            {opt.label}
          </span>
          {filter === opt.value && (
            <Icon name="check" size={12} className="text-[var(--icon-primary-foreground)]" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon Container                                                     */
/* ------------------------------------------------------------------ */
function IconContainer({
  variant,
  hoverWhite = false,
  chevronOpen = false,
}: {
  variant: "regular" | "current" | "autosave";
  hoverWhite?: boolean;
  chevronOpen?: boolean;
}) {
  const shared: React.CSSProperties = {
    width: 24,
    height: 24,
    minWidth: 24,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
  };

  if (variant === "current") {
    return (
      <div
        style={{
          ...shared,
          background: "var(--icon-primary-foreground)",
          borderColor: "rgba(255,255,255,0.2)",
          boxShadow:
            "0px 0.857px 1.714px rgba(36,38,40,0.1), 0px 0.857px 0.857px rgba(36,38,40,0.04)",
        }}
      >
        <Icon name="circle-hashtag" size={14} className="text-white" />
      </div>
    );
  }

  if (variant === "autosave") {
    return (
      <div
        style={{
          ...shared,
          background: hoverWhite ? "var(--icon-container-bg-2)" : "var(--icon-container-border)",
          borderColor: hoverWhite ? "var(--icon-container-border-2)" : "var(--icon-container-border)",
          boxShadow: hoverWhite
            ? "0px 0.857px 1.714px rgba(36,38,40,0.1), 0px 0.857px 0.857px rgba(36,38,40,0.04)"
            : "none",
          transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
        }}
      >
        <Icon
          name="chevron-down"
          size={12}
          className="text-[var(--icon-misc-foreground)]"
          style={{
            transform: chevronOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...shared,
        background: "var(--icon-container-bg-2)",
        borderColor: "var(--icon-container-border-2)",
        boxShadow:
          "0px 0.857px 1.714px rgba(36,38,40,0.1), 0px 0.857px 0.857px rgba(36,38,40,0.04)",
      }}
    >
      <Icon
        name="progress-circle-0-of-4"
        size={14}
        className="text-[var(--icon-misc-foreground)]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Restore Confirmation Modal                                         */
/* ------------------------------------------------------------------ */
function RestoreModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.25)",
        animation: "fadeIn 150ms ease",
      }}
    >
      <div
        className="flex flex-col overflow-clip rounded-[12px] border"
        style={{
          width: 420,
          background: "var(--background-modal-bg-modal)",
          borderColor: "var(--background-modal-border-modal)",
          boxShadow:
            "0px 0px 0px 1px rgba(36,38,40,0.11), 0px 8px 16px 0px rgba(36,38,40,0.09)",
          animation: "modalIn 200ms ease",
        }}
      >
        {/* Header — 52px tall */}
        <div className="flex flex-col items-center" style={{ height: 52 }}>
          <div
            className="flex flex-1 items-center gap-[10px] overflow-clip"
            style={{ padding: "22px 20px", width: "100%", minHeight: 0 }}
          >
            <Icon
              name="clock-rotate-clockwise-2"
              size={18}
              className="text-[var(--icon-secondary-foreground)]"
            />
            <span
              className="head-text-base flex-1"
              style={{ color: "var(--text-foreground)" }}
            >
              Restore version?
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 1,
              background: "var(--background-modal-border-modal)",
            }}
          />
        </div>

        {/* Body */}
        <div
          style={{
            padding: "12px 20px 14px",
            borderBottom: "1px solid var(--background-modal-border-modal)",
          }}
        >
          <p
            className="body-text-sm"
            style={{
              color: "var(--text-secondary-foreground)",
              margin: 0,
            }}
          >
            This will replace the current version with the selected one
          </p>
        </div>

        {/* Footer — 60px tall */}
        <div
          className="flex items-center justify-end gap-2"
          style={{ height: 60, padding: 16 }}
        >
          <button
            onClick={onClose}
            className="label-text-sm flex h-[30px] items-center justify-center rounded-[var(--radius-xl)] border transition-colors"
            style={{
              padding: "8px 10px",
              background: "var(--button-tertiary-bg)",
              borderColor: "var(--button-tertiary-border)",
              color: "var(--icon-secondary-foreground)",
              boxShadow:
                "0px 1px 1px 0px rgba(36,38,40,0.04), 0px 1px 2px -1px rgba(36,38,40,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--button-tertiary-bg-hover)";
              e.currentTarget.style.borderColor = "var(--button-tertiary-border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--button-tertiary-bg)";
              e.currentTarget.style.borderColor = "var(--button-tertiary-border)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="label-text-sm relative flex h-[30px] items-center justify-center rounded-[var(--radius-xl)] border overflow-clip transition-colors"
            style={{
              padding: "8px 10px",
              background: "var(--button-primary-bg)",
              borderColor: "var(--button-primary-border)",
              color: "#fff",
              boxShadow: "0px 1px 1px 0.05px rgba(24,24,27,0.24)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--button-primary-bg-hover)";
              e.currentTarget.style.borderColor = "var(--button-primary-border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--button-primary-bg)";
              e.currentTarget.style.borderColor = "var(--button-primary-border)";
            }}
          >
            Restore
            {/* Inner glow overlay */}
            <span
              className="pointer-events-none absolute inset-[-1px] rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
              }}
            />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Restore Button                                                     */
/* ------------------------------------------------------------------ */
function RestoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="label-text-xs flex h-[22px] items-center rounded-[var(--radius-lg)] border px-2.5 transition-colors"
      style={{
        background: "var(--button-secondary-bg)",
        borderColor: "var(--button-secondary-border)",
        color: "var(--text-secondary-foreground)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--button-secondary-bg-hover)";
        e.currentTarget.style.borderColor = "var(--button-secondary-border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--button-secondary-bg)";
        e.currentTarget.style.borderColor = "var(--button-secondary-border)";
      }}
    >
      Restore
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Version Row                                                        */
/* ------------------------------------------------------------------ */
function VersionRow({
  entry,
  showConnector = false,
  isLast = false,
  dotted = false,
  nested = false,
}: {
  entry: VersionEntry;
  showConnector?: boolean;
  isLast?: boolean;
  dotted?: boolean;
  nested?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isCurrent = !!entry.isCurrent;

  return (
    <>
    <div
      className="relative flex"
      style={{ padding: "0 4px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover background — for nested rows, offset left to avoid parent line */}
      <div
        className="absolute"
        style={{
          top: 0,
          bottom: 0,
          left: nested ? -4 : 4,
          right: 0,
          borderRadius: 10,
          background: "var(--background-quaternary-bg-quaternary-hover)",
          opacity: !isCurrent && hovered ? 1 : 0,
          transition: "opacity 150ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Row content */}
      <div
        className="relative flex w-full"
        style={{ padding: "0 8px", gap: 8 }}
      >
        {/* Timeline column */}
        <div className="relative flex shrink-0 flex-col items-center" style={{ width: 24 }}>
          {showConnector && (
            <div
              style={{
                width: dotted ? 0 : 1,
                height: 10,
                ...(dotted
                  ? { borderLeft: "1px dashed var(--divider-primary)" }
                  : { background: "var(--divider-primary)" }),
              }}
            />
          )}
          {!showConnector && <div style={{ height: 8 }} />}

          <IconContainer variant={isCurrent ? "current" : "regular"} />

          {!isLast && (
            <div
              className="flex-1"
              style={{
                width: dotted ? 0 : 1,
                minHeight: 10,
                ...(dotted
                  ? { borderLeft: "1px dashed var(--divider-primary)" }
                  : { background: "var(--divider-primary)" }),
              }}
            />
          )}
          {isLast && <div style={{ height: 8 }} />}
        </div>

        {/* Content */}
        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{ padding: "6px 0", gap: 1 }}
        >
          <div className="flex items-center">
            <span
              className={isCurrent ? "label-text-sm" : "label-text-xs"}
              style={{
                color: isCurrent
                  ? "var(--text-secondary-foreground)"
                  : "var(--text-foreground)",
              }}
            >
              {entry.time}
            </span>
          </div>

          {/* User row with slide transition */}
          <div className="relative" style={{ height: 24 }}>
            <div
              className="absolute inset-0 flex items-center gap-1.5"
              style={{
                opacity: !isCurrent && hovered ? 0 : 1,
                transform: !isCurrent && hovered ? "translateY(-4px)" : "translateY(0)",
                transition: "opacity 180ms ease, transform 180ms ease",
              }}
            >
              <Avatar {...entry.user} size={14} />
              <span
                className="label-text-2xs truncate"
                style={{ color: "var(--text-secondary-foreground)" }}
              >
                {entry.user.email}
              </span>
            </div>

            {!isCurrent && (
              <div
                className="absolute inset-0 flex items-center"
                style={{
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? "translateY(0)" : "translateY(4px)",
                  transition: "opacity 180ms ease, transform 180ms ease",
                  pointerEvents: hovered ? "auto" : "none",
                }}
              >
                <RestoreButton onClick={() => setModalOpen(true)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <RestoreModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onConfirm={() => {/* no-op for now */}}
    />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Autosave Group                                                     */
/* ------------------------------------------------------------------ */
function AutosaveGroupRow({
  group,
  showConnector = false,
  isLast = false,
}: {
  group: AutosaveGroup;
  showConnector?: boolean;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [open]);

  return (
    <div className="flex flex-col">
      {/* Toggle row */}
      <div
        className="relative flex"
        style={{ padding: "0 4px", cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(!open)}
      >
        {/* Hover bg */}
        <div
          className="absolute"
          style={{
            inset: "0 0 0 0",
            borderRadius: 10,
            background: "var(--background-quaternary-bg-quaternary-hover)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: "none",
          }}
        />

        <div
          className="relative flex w-full"
          style={{ padding: "0 8px", gap: 8 }}
        >
          {/* Timeline column */}
          <div className="relative flex shrink-0 flex-col items-center" style={{ width: 24 }}>
            {showConnector && (
              <div
                style={{
                  width: 1,
                  height: 10,
                  background: "var(--divider-primary)",
                }}
              />
            )}
            {!showConnector && <div style={{ height: 8 }} />}

            <IconContainer variant="autosave" hoverWhite={hovered} chevronOpen={open} />

            {!isLast && (
              <div
                className="flex-1"
                style={{
                  width: 1,
                  minHeight: 10,
                  background: "var(--divider-primary)",
                }}
              />
            )}
            {isLast && <div style={{ height: 8 }} />}
          </div>

          {/* Label */}
          <div
            className="flex min-w-0 flex-1 items-center"
            style={{ padding: "10px 0" }}
          >
            <span
              className="label-text-xs"
              style={{ color: "var(--text-muted-foreground)" }}
            >
              {group.count} autosave versions
            </span>
          </div>
        </div>
      </div>

      {/* Expanded children — animated height + opacity */}
      <div
        style={{
          height: open ? contentHeight : 0,
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "height 200ms ease, opacity 180ms ease",
        }}
      >
        <div ref={contentRef} className="relative flex flex-col" style={{ paddingLeft: 24 }}>
          {/* Continuous vertical line connecting autosave icon to last child icon center */}
          <div
            className="absolute"
            style={{
              left: 24,
              top: -10,
              bottom: 14,
              width: 1,
              background: "var(--divider-primary)",
            }}
          />
          {group.children.map((child, i) => (
            <VersionRow
              key={child.id}
              entry={child}
              showConnector={i > 0}
              isLast={i === group.children.length - 1}
              dotted
              nested
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Date Section                                                       */
/* ------------------------------------------------------------------ */
function DateSectionBlock({ section }: { section: DaySection }) {
  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div style={{ padding: "16px 16px 4px" }}>
        <span
          className="label-text-2xs uppercase"
          style={{
            color: "var(--text-muted-foreground)",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {section.label}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col" style={{ padding: "0 4px" }}>
        {section.items.map((item, idx) =>
          item.type === "autosave" ? (
            <AutosaveGroupRow
              key={item.id}
              group={item}
              showConnector={idx > 0}
              isLast={idx === section.items.length - 1}
            />
          ) : (
            <VersionRow
              key={item.id}
              entry={item}
              showConnector={idx > 0}
              isLast={idx === section.items.length - 1}
            />
          )
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function VersionHistoryPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [showOlder, setShowOlder] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const allSections = showOlder
    ? [...initialSections, ...olderSections]
    : initialSections;

  return (
    <div className="relative flex h-screen items-start justify-center overflow-hidden bg-[var(--page-background)]">
      {/* Dark mode toggle — pill switch */}
      <div
        className="absolute left-4 top-4 z-50 flex items-center gap-2.5"
      >
        <Icon name="sun" size={14} className="text-[var(--icon-secondary-foreground)]" style={{ opacity: darkMode ? 0.4 : 1, transition: "opacity 200ms" }} />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative flex items-center rounded-full transition-colors"
          style={{
            width: 36,
            height: 20,
            background: darkMode ? "var(--icon-primary-foreground)" : "var(--icon-container-border)",
            transition: "background 200ms ease",
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: 16,
              height: 16,
              top: 2,
              left: darkMode ? 18 : 2,
              background: "var(--background-modal-bg-modal)",
              boxShadow: "0px 1px 2px rgba(36,38,40,0.2)",
              transition: "left 200ms ease",
            }}
          />
        </button>
        <Icon name="moon" size={14} className="text-[var(--icon-secondary-foreground)]" style={{ opacity: darkMode ? 1 : 0.4, transition: "opacity 200ms" }} />
      </div>
      <div
        className="relative flex flex-col"
        style={{
          width: 289,
          maxHeight: "100vh",
          background: "var(--page-background)",
          borderLeft: "1px solid var(--divider-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between"
          style={{
            padding: "12px 12px 12px 16px",
            borderBottom: "1px solid var(--divider-primary)",
          }}
        >
          <div className="flex items-center gap-2">
            <Icon
              name="clock-rotate-clockwise-2"
              size={14}
              className="text-[var(--icon-secondary-foreground)]"
            />
            <span
              className="label-text-sm"
              style={{
                color: "var(--text-foreground)",
                fontWeight: 500,
              }}
            >
              Version History
            </span>
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center justify-center rounded-[var(--radius-lg)] transition-all"
            style={{
              width: 28,
              height: 28,
              color: filterOpen ? "var(--icon-foreground)" : "var(--icon-muted-foreground)",
              background: filterOpen
                ? "var(--background-quaternary-bg-quaternary-hover)"
                : "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--background-quaternary-bg-quaternary-hover)";
              e.currentTarget.style.color = "var(--icon-foreground)";
            }}
            onMouseLeave={(e) => {
              if (!filterOpen) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--icon-muted-foreground)";
              }
            }}
          >
            <Icon name="bars-filter" size={14} />
          </button>
        </div>

        {/* Filter dropdown */}
        <FilterDropdown
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filter={filter}
          setFilter={setFilter}
        />

        {/* Scrollable content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {allSections.map((section) => (
            <DateSectionBlock key={section.label} section={section} />
          ))}

          {/* Show older versions */}
          <div style={{ padding: "8px 12px 16px" }}>
            {showOlder ? (
              <div className="flex items-center justify-center" style={{ padding: "8px 0" }}>
                <span
                  className="label-text-2xs"
                  style={{ color: "var(--text-muted-foreground)" }}
                >
                  No more versions
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowOlder(true)}
                className="label-text-xs flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--button-tertiary-border)",
                  background: "var(--button-tertiary-bg)",
                  color: "var(--text-secondary-foreground)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--button-tertiary-bg-hover)";
                  e.currentTarget.style.borderColor = "var(--button-tertiary-border-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--button-tertiary-bg)";
                  e.currentTarget.style.borderColor = "var(--button-tertiary-border)";
                }}
              >
                Show older version
                <Icon name="chevron-down" size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
