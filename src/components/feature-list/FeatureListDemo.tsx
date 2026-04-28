"use client";

import { useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import { useDialKit } from "dialkit";
import type { FeatureListState } from "./types";
import { DEFAULT_STATE } from "./constants";
import { PropertyPanel } from "./PropertyPanel";
import { FeatureListPreview } from "./FeatureListPreview";

export function FeatureListDemo() {
  const [state, setState] = useState<FeatureListState>(DEFAULT_STATE);
  const [dark, setDark] = useState(false);

  /* ── DialKit: tune layout & preview ────────────────────────────── */
  const dials = useDialKit("Feature List", {
    layout: {
      panelWidth: [310, 280, 420],
    },
    preview: {
      phoneWidth: [390, 320, 430],
      phoneHeight: [840, 600, 920],
      phoneBorderRadius: [28, 16, 60],
      phonePaddingX: [20, 0, 60],
    },
  });

  const update = useCallback(
    <K extends keyof FeatureListState>(key: K, value: FeatureListState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  const panelW = dials.layout.panelWidth ?? 310;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-background-2)] p-3 gap-3">
      {/* Property panel — card with margin */}
      <div
        className="relative h-full overflow-hidden shrink-0 rounded-[var(--radius-3xl)] shadow-page-canvas"
        style={{ width: panelW, minWidth: panelW, maxWidth: panelW }}
      >
        <PropertyPanel state={state} update={update} />
      </div>

      {/* Preview area */}
      <div className="flex-1 min-w-0 overflow-auto flex items-start justify-center py-6">
        <FeatureListPreview
          state={state}
          phoneWidth={dials.preview.phoneWidth ?? 390}
          phoneHeight={dials.preview.phoneHeight ?? 840}
          phoneBorderRadius={dials.preview.phoneBorderRadius ?? 28}
          phonePaddingX={dials.preview.phonePaddingX ?? 20}
        />
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 w-9 h-9 rounded-[var(--radius-xl)] flex items-center justify-center
          cursor-pointer bg-[var(--background-bg-panel)] border border-[var(--background-border-panel)]
          text-[var(--text-foreground)] hover:bg-[var(--background-primary-bg-primary)] transition-colors
          shadow-button-secondary"
        aria-label="Toggle theme"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
