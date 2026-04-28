"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion } from "motion/react";
import { useDialKit } from "dialkit";
import {
  DEFAULT_TIMING,
  FunnelStartModal,
  type FunnelAnimationTiming,
} from "@/components/FunnelStartModal";
import { useSoundscape } from "@/lib/useSoundscape";

type OptionId = "reference" | "context" | "brief";
type Theme = "light" | "dark";

export default function FunnelStartDemo() {
  const [selected, setSelected] = useState<OptionId | undefined>(undefined);
  const [theme, setTheme] = useState<Theme>("light");
  const [expanded, setExpanded] = useState(false);
  const playTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playSoundRef = useRef<((e: import("@/lib/useSoundscape").SoundEvent) => void) | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);


  /* Circular-wipe theme change — uses the View Transitions API to clip the
     new theme in from the clicked toggle button. Falls back to an instant
     swap on browsers without startViewTransition (currently FF / older
     Safari). */
  const switchTheme = useCallback(
    (next: Theme, event?: React.MouseEvent<HTMLElement>) => {
      if (next === theme) return;
      playSoundRef.current?.("themeSwitch");
      const doc = document as Document & {
        startViewTransition?: (cb: () => void | Promise<void>) => {
          ready: Promise<void>;
        };
      };
      if (!doc.startViewTransition || !event) {
        setTheme(next);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      document.documentElement.style.setProperty("--theme-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-y", `${y}px`);
      document.documentElement.style.setProperty(
        "--theme-r",
        `${endRadius}px`,
      );
      doc.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    },
    [theme],
  );

  const clearPlayTimers = () => {
    playTimers.current.forEach(clearTimeout);
    playTimers.current = [];
  };

  const replayCycle = useCallback(() => {
    clearPlayTimers();
    setExpanded(false);
    setSelected(undefined);
    playTimers.current.push(
      setTimeout(() => {
        setSelected("reference");
        setExpanded(true);
      }, 260),
    );
    playTimers.current.push(
      setTimeout(() => {
        setExpanded(false);
        setSelected(undefined);
      }, 2200),
    );
  }, []);

  useEffect(() => clearPlayTimers, []);

  /* ── DialKit: live-tune entry + exit timings (seconds) ───────── */
  const dials = useDialKit(
    "Funnel Modal Animation",
    {
      entry: {
        optionsContent:  [DEFAULT_TIMING.entry.optionsContent,  0, 0.6],
        options:         [DEFAULT_TIMING.entry.options,         0, 0.6],
        containerBg:     [DEFAULT_TIMING.entry.containerBg,     0, 0.6],
        drawer:          [DEFAULT_TIMING.entry.drawer,          0, 0.6],
        drawerContent:   [DEFAULT_TIMING.entry.drawerContent,   0, 0.8],
        continueButton:  [DEFAULT_TIMING.entry.continueButton,  0, 0.8],
      },
      exit: {
        drawerContent:   [DEFAULT_TIMING.exit.drawerContent,    0, 0.6],
        continueButton:  [DEFAULT_TIMING.exit.continueButton,   0, 0.6],
        drawer:          [DEFAULT_TIMING.exit.drawer,           0, 0.6],
        containerBg:     [DEFAULT_TIMING.exit.containerBg,      0, 0.6],
        options:         [DEFAULT_TIMING.exit.options,          0, 0.6],
        optionsContent:  [DEFAULT_TIMING.exit.optionsContent,   0, 0.8],
      },
      layout: {
        toggleGap: [12, 0, 120],
      },
      themeWipe: {
        ease: {
          type: "select" as const,
          options: [
            { value: "cubic-bezier(0.83, 0, 0.17, 1)",  label: "1 · Quart in-out" },
            { value: "cubic-bezier(0.87, 0, 0.13, 1)",  label: "2 · Expo in-out" },
            { value: "cubic-bezier(0.85, 0, 0.15, 1)",  label: "3 · Circ in-out" },
            { value: "cubic-bezier(0.77, 0, 0.175, 1)", label: "4 · Emil ease-in-out" },
            { value: "cubic-bezier(0.4, 0, 0.2, 1)",    label: "5 · Material standard" },
            { value: "cubic-bezier(0.5, 0, 0.1, 1)",    label: "6 · Swift" },
          ],
          default: "cubic-bezier(0.5, 0, 0.1, 1)",
        },
        durationMs: [800, 200, 1200],
      },
      replay: { type: "action", label: "Replay cycle" },
    },
    {
      onAction: (action) => {
        if (action === "replay") replayCycle();
      },
    },
  );

  useEffect(() => {
    const ease = dials.themeWipe?.ease ?? "cubic-bezier(0.5, 0, 0.1, 1)";
    const ms = dials.themeWipe?.durationMs ?? 800;
    document.documentElement.style.setProperty("--theme-wipe-ease", ease);
    document.documentElement.style.setProperty("--theme-wipe-duration", `${ms}ms`);
  }, [dials.themeWipe?.ease, dials.themeWipe?.durationMs]);

  const { play: playSound } = useSoundscape(0, 0.75, 3);
  playSoundRef.current = playSound;

  const timing: FunnelAnimationTiming = {
    entry: {
      optionsContent:  dials.entry.optionsContent  ?? DEFAULT_TIMING.entry.optionsContent,
      options:         dials.entry.options         ?? DEFAULT_TIMING.entry.options,
      containerBg:     dials.entry.containerBg     ?? DEFAULT_TIMING.entry.containerBg,
      drawer:          dials.entry.drawer          ?? DEFAULT_TIMING.entry.drawer,
      drawerContent:   dials.entry.drawerContent   ?? DEFAULT_TIMING.entry.drawerContent,
      continueButton:  dials.entry.continueButton  ?? DEFAULT_TIMING.entry.continueButton,
    },
    exit: {
      drawerContent:   dials.exit.drawerContent    ?? DEFAULT_TIMING.exit.drawerContent,
      continueButton:  dials.exit.continueButton   ?? DEFAULT_TIMING.exit.continueButton,
      drawer:          dials.exit.drawer           ?? DEFAULT_TIMING.exit.drawer,
      containerBg:     dials.exit.containerBg      ?? DEFAULT_TIMING.exit.containerBg,
      options:         dials.exit.options          ?? DEFAULT_TIMING.exit.options,
      optionsContent:  dials.exit.optionsContent   ?? DEFAULT_TIMING.exit.optionsContent,
    },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        background: "var(--page-background)",
        padding: 40,
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* Crossfade between the intro and the start modal. mode="wait" so the
          exiting modal fully disappears before the incoming one mounts. */}
      {/* Modal entry — Apple-style spring (Emil's recommendation): start from
          scale 0.96 + a subtle lift, never from scale(0). Modals keep a
          centered transform-origin since they aren't trigger-anchored.
          Animates only transform + opacity for GPU-friendly entry. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{
          opacity: { duration: 0.32, ease: [0.23, 1, 0.32, 1] },
          filter:  { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
          scale:   { type: "spring", duration: 0.55, bounce: 0.22 },
          y:       { type: "spring", duration: 0.55, bounce: 0.22 },
        }}
        style={{ transformOrigin: "center", willChange: "transform, opacity, filter" }}
      >
        <FunnelStartModal
          selected={selected}
          onSelect={setSelected}
          onBack={() => {}}
          timing={timing}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onSoundEvent={playSound}
        />
      </motion.div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ThemeToggle theme={theme} onChange={switchTheme} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Theme toggle — segmented pill with sliding indicator               */
/* ------------------------------------------------------------------ */
function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme, event?: React.MouseEvent<HTMLElement>) => void;
}) {
  const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <SunIcon /> },
    { id: "dark", label: "Dark", icon: <MoonIcon /> },
  ];
  const activeIndex = options.findIndex((o) => o.id === theme);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: 36,
        padding: 3,
        borderRadius: 999,
        background: "var(--button-secondary-bg)",
        border: "1px solid var(--button-secondary-border)",
        boxShadow:
          "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
      }}
    >
      {/* Sliding indicator */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          height: "calc(100% - 6px)",
          width: "calc(50% - 3px)",
          borderRadius: 999,
          background: "var(--button-tertiary-bg)",
          border: "1px solid var(--button-tertiary-border)",
          boxShadow:
            "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform 260ms var(--ease-out)",
          willChange: "transform",
        }}
      />

      {options.map((o) => {
        const active = o.id === theme;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={(e) => onChange(o.id, e)}
            style={{
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 28,
              width: 28,
              padding: 0,
              borderRadius: 999,
              background: "transparent",
              border: "none",
              color: active
                ? "var(--text-foreground)"
                : "var(--text-muted-foreground)",
              cursor: "pointer",
              transition: "color 200ms var(--ease-out)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 14,
                height: 14,
                color: "currentColor",
              }}
            >
              {o.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2.75" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7 1.5v1.25M7 11.25v1.25M2.5 7H1.25M12.75 7H11.5M3.818 3.818l-.884-.884M11.066 11.066l-.884-.884M3.818 10.182l-.884.884M11.066 2.934l-.884.884"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12 8.5A5 5 0 0 1 5.5 2a5 5 0 1 0 6.5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
