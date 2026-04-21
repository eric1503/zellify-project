"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { SoundEvent } from "@/lib/useSoundscape";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Reference-funnel drawer
 *
 * Height policy (entry): rows collapse and drawer expands in
 * lock-step (same spring, same delay) so the modal's total
 * height transitions MONOTONICALLY toward the final size —
 * never dips down and back up.
 *
 * ENTRY (user picks a card):
 *    0ms  → rows 2,3 fade out
 *   80ms  → rows 2,3 height collapses AND drawer expands together
 *   80ms  → container bg fades in
 *  220ms  → drawer content fades + slides up
 *  300ms  → Continue button slides in from right
 *
 * EXIT (user clicks Back while drawer is open):
 *    0ms  → drawer rows + search fade out
 *   20ms  → Continue button slides out
 *   60ms  → drawer height collapses + rows 2,3 height expands
 *  100ms  → container bg fades out
 *  220ms  → rows 2,3 fade in
 * ───────────────────────────────────────────────────────── */

/* Default storyboard timings (in seconds). Override via `timing` prop. */
export type FunnelAnimationTiming = {
  entry: {
    optionsContent:  number;   // bottom options fade+slide out FIRST
    options:         number;   // then options height collapses
    containerBg:     number;   // container bg fades in
    drawer:          number;   // drawer height expands
    drawerContent:   number;   // drawer contents fade+slide in
    continueButton:  number;   // CTA slides in
  };
  exit: {
    drawerContent:   number;   // drawer contents fade out FIRST
    continueButton:  number;   // CTA slides out
    drawer:          number;   // drawer height collapses
    containerBg:     number;   // container bg fades out
    options:         number;   // options height expands (empty)
    optionsContent:  number;   // options fade+slide in AFTER height settles
  };
};

export const DEFAULT_TIMING: FunnelAnimationTiming = {
  entry: {
    optionsContent:  0,
    options:         0.08,   // rows 2,3 start collapsing
    containerBg:     0.08,
    drawer:          0.08,   // drawer starts expanding SAME TIME (same spring → monotonic height)
    drawerContent:   0.22,   // 140ms after drawer start (drawer mostly open by then)
    continueButton:  0.18,   // right after drawerContent, snappier
  },
  exit: {
    drawerContent:   0,
    continueButton:  0.02,
    drawer:          0.06,
    containerBg:     0.10,
    options:         0.12,
    optionsContent:  0.22,
  },
};

const DRAWER = {
  spring:        { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.9 },
  contentSpring: { type: "spring" as const, stiffness: 360, damping: 32 },
  entrySpring:   { type: "spring" as const, visualDuration: 0.32, bounce: 0 },
  offsetY: 6,
};

const OPTIONS = {
  spring:  { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.9 },
  offsetY: 5,
};

const CONTAINER_BG = {
  ease: [0.22, 1, 0.36, 1] as const,
  duration: 0.22,
};

const CONTINUE = {
  /* Width reserves/releases space. The button itself is kept invisible
     (opacity 0) while width animates, so the user never sees a half-cropped
     button being "wiped" into view by the overflow:hidden clip. */
  widthSpring: { type: "spring" as const, visualDuration: 0.22, bounce: 0 },

  /* Entry:  width opens FIRST, then opacity fades the button in in-place. */
  fadeIn:   { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const, delayOffset: 0.14 },
  /* Exit:   opacity fades FIRST so the button disappears in-place, then
     width collapses the empty slot. */
  fadeOut:  { duration: 0.1, ease: [0.4, 0, 0.2, 1] as const, delayOffset: 0 },
  widthExitDelay: 0.08,
  width: 80,
};

/* Favicon entry — CSS-transition based so it fires reliably even when the
   browser serves the favicon from cache (where motion's onLoad doesn't). */
const FAVICON = {
  fromScale: 0.6,
  opacityMs: 220,       // fade-in duration for the favicon
  popMs:     320,       // scale transform duration
  // Subtle overshoot so the favicon "lands" with a bit of life — per Emil:
  // start from scale(0.6), never scale(0), combine with opacity
  popEase:   "cubic-bezier(0.34, 1.56, 0.64, 1)",
  swapMs:    160,       // globe fade/shrink out — quick + quiet
};

/* Extra bottom padding inside collapsible rows so box-shadows aren't clipped
   by the row's overflow:hidden. Compensated by an equal negative margin so
   the open-state layout stays identical to the original. */
const SHADOW_PAD = 10;

type OptionId = "reference" | "context" | "brief";

/* Context-flow link rows carry a stable id so AnimatePresence tracks the
   right row when users add/remove in the middle of the list. */
type LinkItem = { id: string; value: string };
let linkIdSeq = 0;
const makeLink = (value = ""): LinkItem => ({
  id: `link-${++linkIdSeq}`,
  value,
});

function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setTheme(el.getAttribute("data-theme") === "dark" ? "dark" : "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function FunnelStartModal({
  selected,
  onSelect,
  onBack,
  onContinue,
  timing = DEFAULT_TIMING,
  expanded: expandedProp,
  onExpandedChange,
  onSoundEvent,
}: {
  selected?: OptionId;
  onSelect?: (id: OptionId) => void;
  onBack?: () => void;
  onContinue?: () => void;
  timing?: FunnelAnimationTiming;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onSoundEvent?: (event: SoundEvent) => void;
}) {
  const theme = useTheme();
  const suffix = theme === "dark" ? "-dark" : "";
  const TIMING = timing;

  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = expandedProp ?? internalExpanded;
  const setExpanded = (v: boolean) => {
    if (expandedProp === undefined) setInternalExpanded(v);
    onExpandedChange?.(v);
  };

  const [pickedFunnelId, setPickedFunnelId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [brief, setBrief] = useState("");

  /* Context flow — list of URL inputs with stable IDs so add/remove
     animations don't re-mount the wrong rows. Plus a shared brief
     textarea that appears once the user has typed at least one link. */
  const [links, setLinks] = useState<LinkItem[]>(() => [makeLink()]);
  const [contextBrief, setContextBrief] = useState("");

  const handleSelect = (id: OptionId) => {
    onSoundEvent?.("optionSelect");
    onSelect?.(id);
    if (id === "reference" || id === "brief" || id === "context") setExpanded(true);
  };

  const handleBack = () => {
    if (expanded) {
      onSoundEvent?.("drawerClose");
      setExpanded(false);
      setPickedFunnelId(null);
      setQuery("");
      setBrief("");
      setLinks([makeLink()]);
      setContextBrief("");
    } else {
      onSoundEvent?.("backClick");
      onBack?.();
    }
  };

  const handleContinue = () => {
    onSoundEvent?.("continueClick");
    onContinue?.();
  };

  const handlePickFunnel = (id: string) => {
    if (id !== pickedFunnelId) onSoundEvent?.("funnelPick");
    setPickedFunnelId(id);
  };

  const handleLinksChange = (next: LinkItem[]) => {
    if (next.length > links.length) onSoundEvent?.("linkAdd");
    else if (next.length < links.length) onSoundEvent?.("linkRemove");
    setLinks(next);
  };

  return (
    <div
      style={{
        width: 724,
        background: "var(--background-modal-bg-modal)",
        border: "1px solid var(--background-modal-border-modal)",
        borderRadius: 12,
        boxShadow: "0px 8px 16px 0px rgba(36,38,40,0.09)",
        overflow: "hidden",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* Top: title + options / drawer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: 20,
          borderBottom: "1px solid var(--background-modal-border-modal)",
        }}
      >
        <h2
          className="label-text-lg"
          style={{
            color: "var(--text-foreground)",
            letterSpacing: "-0.01em",
            padding: "0 4px",
            margin: 0,
          }}
        >
          How do you want to start?
        </h2>

        <OptionsBlock
          expanded={expanded}
          selected={selected}
          suffix={suffix}
          onSelect={handleSelect}
          query={query}
          onQueryChange={setQuery}
          pickedFunnelId={pickedFunnelId}
          onPickFunnel={handlePickFunnel}
          brief={brief}
          onBriefChange={setBrief}
          links={links}
          onLinksChange={handleLinksChange}
          contextBrief={contextBrief}
          onContextBriefChange={setContextBrief}
          timing={TIMING}
          onSoundEvent={onSoundEvent}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          padding: "16px 16px 16px 22px",
        }}
      >
        <ProgressDots activeIndex={1} total={3} />
        <div style={{ display: "flex", gap: 8 }}>
          <TertiaryButton onClick={handleBack}>Back</TertiaryButton>
          <motion.div
            initial={false}
            animate={{
              width: expanded ? CONTINUE.width : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{
              width: {
                ...CONTINUE.widthSpring,
                /* On entry, open space immediately. On exit, wait for the
                   button's opacity to fade before collapsing — so the user
                   never sees the clip edge chew through the button. */
                delay: expanded
                  ? TIMING.entry.continueButton
                  : TIMING.exit.continueButton + CONTINUE.widthExitDelay,
              },
              opacity: {
                duration: expanded ? CONTINUE.fadeIn.duration : CONTINUE.fadeOut.duration,
                ease: expanded ? CONTINUE.fadeIn.ease : CONTINUE.fadeOut.ease,
                /* Entry: fade in only after the width has opened most of
                   the way, so the button materializes into the already-
                   visible slot instead of being clip-wiped. */
                delay: expanded
                  ? TIMING.entry.continueButton + CONTINUE.fadeIn.delayOffset
                  : TIMING.exit.continueButton + CONTINUE.fadeOut.delayOffset,
              },
            }}
            style={{ overflow: "hidden", display: "flex", justifyContent: "flex-end" }}
          >
            <PrimaryButton
              disabled={!pickedFunnelId}
              onClick={handleContinue}
            >
              Continue
            </PrimaryButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon — mask-image with currentColor (matches TopNavbar pattern)    */
/* ------------------------------------------------------------------ */
function Icon({
  name,
  size = 18,
  style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const prefix = size === 12 ? "12px-filled" : "18px";
  const file = size === 12 ? `12-${name}` : `18-${name}`;
  return (
    <span
      aria-hidden
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
        maskPosition: "center",
        WebkitMaskPosition: "center",
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Options block — all 3 rows, whichever is active expands its drawer */
/* ------------------------------------------------------------------ */
const OPTION_DEFS: Array<{
  id: OptionId;
  title: string;
  description: string;
  illustration: string;
}> = [
  {
    id: "reference",
    title: "Reference existing funnel",
    description: "Use one of your funnels as a base",
    illustration: "reference",
  },
  {
    id: "context",
    title: "Pull context from websites/links",
    description: "We'll analyze your website or links to build your funnel",
    illustration: "context",
  },
  {
    id: "brief",
    title: "Start from a brief",
    description: "Tell us what you need and we'll build it",
    illustration: "brief",
  },
];

function OptionsBlock({
  expanded,
  selected,
  suffix,
  onSelect,
  query,
  onQueryChange,
  pickedFunnelId,
  onPickFunnel,
  brief,
  onBriefChange,
  links,
  onLinksChange,
  contextBrief,
  onContextBriefChange,
  timing,
  onSoundEvent,
}: {
  expanded: boolean;
  selected?: OptionId;
  suffix: string;
  onSelect: (id: OptionId) => void;
  query: string;
  onQueryChange: (v: string) => void;
  pickedFunnelId: string | null;
  onPickFunnel: (id: string) => void;
  brief: string;
  onBriefChange: (v: string) => void;
  links: LinkItem[];
  onLinksChange: (links: LinkItem[]) => void;
  contextBrief: string;
  onContextBriefChange: (v: string) => void;
  timing: FunnelAnimationTiming;
  onSoundEvent?: (event: SoundEvent) => void;
}) {
  const TIMING = timing;

  /* Context title/description swap: singular copy when exactly one URL is filled */
  const contextFilled = links.filter((l) => l.value.trim()).length;
  const contextSingular =
    selected === "context" && expanded && contextFilled === 1;
  /* External brief textarea visibility — shows once user types any link */
  const showContextBrief =
    selected === "context" && expanded && contextFilled >= 1;

  return (
    <>
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
      }}
    >
      {/* Theme-safe background layer: animates OPACITY only, not
          backgroundColor — so in dark mode we don't flash through
          light-grey intermediate colors during the fade. */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={{
          ...CONTAINER_BG,
          delay: expanded
            ? TIMING.entry.containerBg
            : TIMING.exit.containerBg,
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--background-primary-bg-primary)",
          borderRadius: 12,
          pointerEvents: "none",
        }}
      />
    <motion.div
      initial={false}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
      }}
    >
      {OPTION_DEFS.map((def, idx) => {
        const isSelected = selected === def.id;
        const rowOpen = !expanded || isSelected;
        const isLoneTop = expanded && isSelected;

        return (
          <CollapsibleRow
            key={def.id}
            open={rowOpen}
            spring={DRAWER.spring}
            delay={expanded ? TIMING.entry.options : TIMING.exit.options}
            shadowPad={SHADOW_PAD}
          >
            <motion.div
              initial={false}
              animate={{
                opacity: rowOpen ? 1 : 0,
                y: rowOpen ? 0 : OPTIONS.offsetY,
                paddingTop: idx === 0 || isLoneTop ? 0 : 10,
              }}
              transition={{
                opacity: {
                  duration: expanded ? 0.16 : 0.22,
                  delay: expanded
                    ? TIMING.entry.optionsContent
                    : TIMING.exit.optionsContent,
                },
                y: {
                  ...OPTIONS.spring,
                  delay: expanded
                    ? TIMING.entry.optionsContent
                    : TIMING.exit.optionsContent,
                },
                paddingTop: {
                  ...OPTIONS.spring,
                  delay: expanded
                    ? TIMING.entry.options
                    : TIMING.exit.options,
                },
              }}
            >
              <OptionRow
                title={
                  def.id === "context" && contextSingular
                    ? "Pull context from a website"
                    : def.title
                }
                description={
                  def.id === "context" && contextSingular
                    ? "We'll analyze your website to build your funnel"
                    : def.description
                }
                selected={isSelected}
                onClick={() => onSelect(def.id)}
                illustrationSrc={`/illustrations/funnel-start/${def.illustration}${suffix}.png`}
                hoverPatternSrc={`/illustrations/funnel-start/hover-pattern${suffix}.png`}
                interactive={!expanded}
              />
            </motion.div>
          </CollapsibleRow>
        );
      })}

      {/* Drawer — slides down flush below the active row */}
      <CollapsibleRow
        open={expanded}
        spring={DRAWER.spring}
        delay={expanded ? TIMING.entry.drawer : TIMING.exit.drawer}
      >
        <AnimatePresence initial={false} mode="wait">
          {expanded && selected === "reference" && (
            <motion.div
              key="reference-drawer"
              initial={{ opacity: 0, y: DRAWER.offsetY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -DRAWER.offsetY,
                transition: {
                  ...DRAWER.contentSpring,
                  delay: TIMING.exit.drawerContent,
                },
              }}
              transition={{
                ...DRAWER.entrySpring,
                delay: TIMING.entry.drawerContent,
              }}
            >
              <ReferencePicker
                query={query}
                onQueryChange={onQueryChange}
                pickedFunnelId={pickedFunnelId}
                onPickFunnel={onPickFunnel}
              />
            </motion.div>
          )}
          {expanded && selected === "brief" && (
            <motion.div
              key="brief-drawer"
              initial={{ opacity: 0, y: DRAWER.offsetY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -DRAWER.offsetY,
                transition: {
                  ...DRAWER.contentSpring,
                  delay: TIMING.exit.drawerContent,
                },
              }}
              transition={{
                ...DRAWER.entrySpring,
                delay: TIMING.entry.drawerContent,
              }}
            >
              <BriefInput value={brief} onChange={onBriefChange} />
            </motion.div>
          )}
          {expanded && selected === "context" && (
            <motion.div
              key="context-drawer"
              initial={{ opacity: 0, y: DRAWER.offsetY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -DRAWER.offsetY,
                transition: {
                  ...DRAWER.contentSpring,
                  delay: TIMING.exit.drawerContent,
                },
              }}
              transition={{
                ...DRAWER.entrySpring,
                delay: TIMING.entry.drawerContent,
              }}
            >
              <ContextLinks
                links={links}
                onChange={onLinksChange}
                onSoundEvent={onSoundEvent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleRow>
    </motion.div>
    </div>

    {/* External brief textarea — lives OUTSIDE the primary-bg container so
        it visually sits on the modal's white background, matching the
        "Pull context from a website" spec. Negative marginTop during
        collapsed state cancels the flex `gap: 18` so it mounts/unmounts
        without a sudden jump in spacing. */}
    <AnimatePresence initial={false}>
      {showContextBrief && (
        <motion.div
          key="context-brief-external"
          initial={{ opacity: 0, height: 0, marginTop: -18 }}
          animate={{ opacity: 1, height: "auto", marginTop: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: -18 }}
          transition={{
            height: LINK_ROW.spring,
            marginTop: LINK_ROW.spring,
            opacity: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
          }}
          style={{ overflow: "hidden" }}
        >
          <textarea
            value={contextBrief}
            onChange={(e) => onContextBriefChange(e.target.value)}
            placeholder="Describe what you need for your funnel, we will ask follow up questions after..."
            style={{
              display: "block",
              width: "100%",
              height: 185,
              padding: "12px 14px",
              background: "var(--input-field-primary-bg)",
              border: "1px solid var(--input-field-primary-border)",
              borderRadius: 8,
              resize: "none",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.07px",
              color: "var(--text-foreground)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Smoothly collapsing row — motion grid-template-rows                */
/* ------------------------------------------------------------------ */
function CollapsibleRow({
  open,
  delay = 0,
  spring,
  children,
  shadowPad = 0,
}: {
  open: boolean;
  delay?: number;
  spring: object;
  children: React.ReactNode;
  shadowPad?: number;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        gridTemplateRows: open ? "1fr" : "0fr",
        marginBottom: open ? -shadowPad : 0,
      }}
      transition={{ ...spring, delay }}
      style={{ display: "grid" }}
    >
      {/* Clip box — MUST have no padding of its own, or its min-content
          floor prevents `0fr` from collapsing to 0. */}
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {/* Pad lives on an inner child so it's clip-able content,
            giving box-shadows breathing room without locking row height. */}
        <div style={{ paddingBottom: shadowPad }}>{children}</div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Option row — minimalist hover animation                            */
/* ------------------------------------------------------------------ */
function OptionRow({
  title,
  description,
  illustrationSrc,
  hoverPatternSrc,
  selected = false,
  onClick,
  interactive = true,
}: {
  title: string;
  description: string;
  illustrationSrc: string;
  hoverPatternSrc: string;
  selected?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(false);

  /* Clear hover when the row becomes non-interactive (drawer opened).
     Otherwise mouseLeave never fires — the user clicks, the card "goes
     away", and when they Back out the hover state is still true even
     though the pointer isn't actually over the row anymore. */
  useEffect(() => {
    if (!interactive) setHover(false);
  }, [interactive]);

  /* Show the orange-dither pattern on hover OR when this row is the
     active/selected one in the expanded drawer state. The pattern stays
     continuously visible across the hover → active transition because
     either `hover` or `selected && !interactive` is true throughout. */
  const showPattern = hover || (selected && !interactive);

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      className="funnel-option-row"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        height: 82,
        width: "100%",
        background: "var(--button-secondary-bg)",
        border: "1px solid var(--button-secondary-border)",
        borderRadius: 12,
        overflow: "hidden",
        cursor: interactive ? "pointer" : "default",
        padding: 0,
        textAlign: "left",
        boxShadow:
          "0px 1.56px 3.12px -1.56px rgba(36,38,40,0.1), 0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* Hover / active pattern — minimalist fade + micro-scale.
          Stays visible when this row is the active (selected + expanded) one. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
          opacity: showPattern ? 1 : 0,
          transform: showPattern ? "scale(1)" : "scale(0.98)",
          transformOrigin: "center right",
          transition: showPattern
            ? "opacity 260ms var(--ease-out), transform 260ms var(--ease-out)"
            : "opacity 140ms var(--ease-out), transform 140ms var(--ease-out)",
          willChange: "transform, opacity",
        }}
      >
        <Image
          src={hoverPatternSrc}
          alt=""
          width={1956}
          height={246}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center right",
          }}
          priority
          unoptimized
        />
      </div>

      {/* Illustration — shifts 5px right on hover, gets cropped */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: hover ? "translateX(3px)" : "translateX(0)",
            transition: "transform 260ms var(--ease-out)",
            willChange: "transform",
          }}
        >
          <Image
            src={illustrationSrc}
            alt=""
            width={1956}
            height={246}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center right",
            }}
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Left block — text (above everything) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "0 18px",
          flex: "0 0 auto",
          width: 400,
          zIndex: 2,
          position: "relative",
        }}
      >
        <span
          className="label-text-base"
          style={{
            color: "var(--text-foreground)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
        <span
          className="label-text-xs"
          style={{
            color: "var(--text-secondary-foreground)",
            letterSpacing: 0,
          }}
        >
          {description}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reference picker — search + tree list                              */
/* ------------------------------------------------------------------ */
type FunnelNode = {
  id: string;
  label: string;
  flag?: { emoji: string; name: string };
  children?: FunnelNode[];
};

const FUNNELS: FunnelNode[] = [
  {
    id: "acquisition",
    label: "Acquisition Flow",
    children: [
      {
        id: "acquisition-es",
        label: "Acquisition Flow",
        flag: { emoji: "🇪🇸", name: "Spanish" },
      },
      {
        id: "acquisition-zh",
        label: "Acquisition Flow",
        flag: { emoji: "🇨🇳", name: "Chinese" },
      },
      {
        id: "acquisition-fr",
        label: "Acquisition Flow",
        flag: { emoji: "🇫🇷", name: "French" },
      },
    ],
  },
  { id: "conversion", label: "Conversion Path" },
  { id: "checkout", label: "Checkout Sequence" },
];

/* ------------------------------------------------------------------ */
/*  Context links — URL list with favicon detection                    */
/* ------------------------------------------------------------------ */
function extractDomain(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const { hostname } = new URL(withScheme);
    // require at least one dot and 2+ char TLD so we don't fire on "a" or "http://local"
    if (!hostname.includes(".") || hostname.split(".").pop()!.length < 2) return null;
    return hostname;
  } catch {
    return null;
  }
}

function ContextLinks({
  links,
  onChange,
  onSoundEvent,
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
  onSoundEvent?: (event: SoundEvent) => void;
}) {
  const updateAt = (i: number, value: string) => {
    onChange(links.map((l, idx) => (idx === i ? { ...l, value } : l)));
  };
  const addLink = () => onChange([...links, makeLink()]);
  const removeAt = (i: number) =>
    onChange(links.filter((_, idx) => idx !== i));

  return (
    <div>
      {/* Input list — AnimatePresence + layout gives smooth add/remove with
          neighboring rows sliding to fill the gap. */}
      <div
        style={{
          padding: "12px 10px 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <AnimatePresence initial={false}>
          {links.map((link, i) => (
            <motion.div
              key={link.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                layout: LINK_ROW.spring,
                height: LINK_ROW.spring,
                opacity: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
              }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 2px" }}>
                <UrlInput
                  value={link.value}
                  onChange={(v) => updateAt(i, v)}
                  showRemove={i > 0}
                  onRemove={() => removeAt(i)}
                  onSoundEvent={onSoundEvent}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add more link button */}
      <div style={{ padding: "12px 10px" }}>
        <div style={{ padding: "0 2px" }}>
          <AddMoreLinkButton onClick={addLink} />
        </div>
      </div>
    </div>
  );
}

const LINK_ROW = {
  spring: { type: "spring" as const, stiffness: 400, damping: 34 },
};

function UrlInput({
  value,
  onChange,
  showRemove = false,
  onRemove,
  onSoundEvent,
}: {
  value: string;
  onChange: (v: string) => void;
  showRemove?: boolean;
  onRemove?: () => void;
  onSoundEvent?: (event: SoundEvent) => void;
}) {
  /* Debounce domain extraction so we don't hammer the favicon service on every keystroke. */
  const [stableDomain, setStableDomain] = useState<string | null>(null);
  const [faviconReady, setFaviconReady] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const next = extractDomain(value);
    const t = setTimeout(() => {
      setStableDomain((prev) => {
        if (prev !== next) setFaviconReady(false);
        return next;
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  // Google's favicon service — reliable, returns a branded icon if available.
  const faviconUrl = stableDomain
    ? `https://www.google.com/s2/favicons?domain=${stableDomain}&sz=64`
    : null;

  /* Probe the favicon with a detached Image() so we detect loads consistently,
     even when the browser serves the request from cache. React's onLoad on a
     motion.img doesn't fire reliably for cache hits. */
  useEffect(() => {
    if (!faviconUrl) {
      setFaviconReady(false);
      return;
    }
    let canceled = false;
    // window.Image avoids collision with the next/image import aliased as Image
    const probe = new window.Image();
    probe.onload = () => {
      if (!canceled) {
        setFaviconReady(true);
        onSoundEvent?.("faviconAppear");
      }
    };
    probe.onerror = () => {
      if (!canceled) setFaviconReady(false);
    };
    probe.src = faviconUrl;
    return () => {
      canceled = true;
    };
  }, [faviconUrl, onSoundEvent]);

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 10px",
        borderRadius: 8,
        background: "var(--input-field-primary-bg)",
        border: `1px solid ${focused ? "#f3533f" : "var(--input-field-primary-border)"}`,
        boxShadow: focused ? "0 0 0 1.5px rgba(243, 83, 63, 0.15)" : "0 0 0 1.5px rgba(243, 83, 63, 0)",
        transition: "border-color 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
      }}
    >
      {/* Leading icon slot — globe by default, favicon when detected.
          Both layers stay mounted so CSS transitions can crossfade between
          them smoothly when `faviconReady` flips. */}
      <div
        style={{
          position: "relative",
          width: 16,
          height: 16,
          flexShrink: 0,
        }}
      >
        {/* Globe fallback — fades/shrinks away once favicon is ready */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-misc-foreground)",
            pointerEvents: "none",
            opacity: faviconReady ? 0 : 0.8,
            transform: faviconReady ? "scale(0.7)" : "scale(1)",
            transition: `opacity ${FAVICON.swapMs}ms var(--ease-out), transform ${FAVICON.swapMs}ms var(--ease-out)`,
            willChange: "opacity, transform",
          }}
        >
          <Icon name="globe-2" size={18} style={{ width: 14, height: 14 }} />
        </span>
        {/* Favicon — mounted as soon as a domain is parsed so the probe above
            can preload; stays at opacity 0 / scale 0.6 until probe confirms.
            CSS transitions handle the pop-in with a subtle overshoot. */}
        {faviconUrl && (
          <img
            key={faviconUrl}
            src={faviconUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: 16,
              height: 16,
              borderRadius: 3,
              objectFit: "contain",
              pointerEvents: "none",
              opacity: faviconReady ? 1 : 0,
              transform: faviconReady ? "scale(1)" : `scale(${FAVICON.fromScale})`,
              transition: `opacity ${FAVICON.opacityMs}ms var(--ease-out), transform ${FAVICON.popMs}ms ${FAVICON.popEase}`,
              willChange: "opacity, transform",
            }}
          />
        )}
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Enter a URL link"
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-foreground)",
          fontFamily: "var(--font-aspekta-loaded), sans-serif",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.07px",
        }}
      />

      {/* Ghost × to remove — only rendered for 2nd+ rows so there's always at
          least one URL slot. onMouseDown prevents the label from stealing
          focus before onClick fires. */}
      {showRemove && onRemove && (
        <button
          type="button"
          aria-label="Remove link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            padding: 0,
            flexShrink: 0,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "var(--text-misc-foreground)",
            cursor: "pointer",
            transition:
              "background 140ms var(--ease-out), color 140ms var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "var(--menu-list-hover, rgba(0,0,0,0.06))";
            e.currentTarget.style.color = "var(--text-foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-misc-foreground)";
          }}
        >
          <Icon name="xmark" size={12} />
        </button>
      )}
    </label>
  );
}

function AddMoreLinkButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 34,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        background: hover
          ? "var(--button-secondary-bg-hover)"
          : "var(--button-secondary-bg)",
        border: `1px solid ${hover ? "var(--button-secondary-border-hover)" : "var(--button-secondary-border)"}`,
        boxShadow:
          "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        cursor: "pointer",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        transition:
          "background 160ms var(--ease-out), border-color 160ms var(--ease-out)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          color: "var(--text-secondary-foreground)",
        }}
      >
        <Icon name="plus" size={18} style={{ width: 16, height: 16 }} />
      </span>
      <span
        className="label-text-sm"
        style={{
          color: "var(--text-secondary-foreground)",
          letterSpacing: "-0.07px",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Add more link
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  BriefInput — textarea for "Start from a brief"                      */
/* ------------------------------------------------------------------ */
function BriefInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ padding: "12px 10px" }}>
      <div style={{ padding: "0 2px" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you need for your funnel, we will ask follow up questions too after..."
          style={{
            display: "block",              // kills 6px baseline descent below textarea
            width: "100%",
            height: 185,
            padding: "12px 14px",
            background: "var(--input-field-primary-bg)",
            border: "1px solid var(--input-field-primary-border)",
            borderRadius: 8,
            resize: "none",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.07px",
            color: "var(--text-foreground)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

function ReferencePicker({
  query,
  onQueryChange,
  pickedFunnelId,
  onPickFunnel,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  pickedFunnelId: string | null;
  onPickFunnel: (id: string) => void;
}) {
  const filtered = useMemo(() => filterFunnels(FUNNELS, query), [query]);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Search */}
      <div
        style={{
          padding: "14px 10px",
          borderBottom: "1px solid var(--divider-primary)",
        }}
      >
        <div style={{ padding: "0 2px" }}>
          <SearchInput value={query} onChange={onQueryChange} />
        </div>
      </div>

      {/* Tree list */}
      <div
        ref={scrollRef}
        style={{
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 260,
          overflowY: "auto",
        }}
        className="funnel-tree-scroll"
      >
        {filtered.length === 0 && (
          <div
            className="label-text-sm"
            style={{
              color: "var(--text-misc-foreground)",
              opacity: 0.8,
              padding: "10px 6px",
            }}
          >
            No funnels match “{query}”.
          </div>
        )}

        {filtered.map((node) => (
          <div
            key={node.id}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <FunnelRow
              label={node.label}
              selected={pickedFunnelId === node.id}
              onClick={() => onPickFunnel(node.id)}
            />
            {node.children?.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingLeft: 15,
                }}
              >
                <TreeConnector last={i === (node.children?.length ?? 0) - 1} />
                <div style={{ flex: "1 1 0" }}>
                  <FunnelRow
                    label={c.label}
                    flag={c.flag}
                    selected={pickedFunnelId === c.id}
                    onClick={() => onPickFunnel(c.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function filterFunnels(nodes: FunnelNode[], query: string): FunnelNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const match = (n: FunnelNode) =>
    n.label.toLowerCase().includes(q) ||
    (n.flag?.name.toLowerCase().includes(q) ?? false);
  return nodes
    .map((n) => {
      const kids = n.children?.filter(match) ?? [];
      const selfMatch = match(n);
      if (selfMatch || kids.length) {
        return { ...n, children: kids.length ? kids : undefined };
      }
      return null;
    })
    .filter(Boolean) as FunnelNode[];
}

/* ------------------------------------------------------------------ */
/*  Search input                                                       */
/* ------------------------------------------------------------------ */
function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 10px",
        borderRadius: 8,
        background: "var(--input-field-primary-bg)",
        border: `1px solid ${focused ? "#f3533f" : "var(--input-field-primary-border)"}`,
        boxShadow: focused ? "0 0 0 1.5px rgba(243, 83, 63, 0.15)" : "0 0 0 1.5px rgba(243, 83, 63, 0)",
        transition: "border-color 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
      }}
    >
      <span
        style={{
          color: "var(--text-misc-foreground)",
          opacity: 0.8,
          display: "inline-flex",
        }}
      >
        <Icon name="magnifier" size={18} style={{ width: 14, height: 14 }} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search funnel"
        className="label-text-xs"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-foreground)",
          fontFamily: "var(--font-aspekta-loaded), sans-serif",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: 0,
        }}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree row                                                           */
/* ------------------------------------------------------------------ */
function FunnelRow({
  label,
  flag,
  selected,
  onClick,
}: {
  label: string;
  flag?: { emoji: string; name: string };
  selected?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);

  const bg = selected
    ? "var(--button-secondary-bg)"
    : hover
      ? "var(--button-secondary-bg-hover)"
      : "var(--button-secondary-bg)";

  const borderColor = selected
    ? "var(--icon-primary-foreground)"
    : hover
      ? "var(--button-secondary-border-hover)"
      : "var(--button-secondary-border)";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 42,
        width: "100%",
        padding: "8px",
        borderRadius: 10,
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: selected
          ? "0 0 0 3px rgba(243,83,63,0.12), 0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)"
          : "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        cursor: "pointer",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        textAlign: "left",
        transition:
          "background 160ms var(--ease-out), border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "var(--button-tertiary-bg)",
          border: "1px solid var(--button-tertiary-border)",
          color: "var(--icon-secondary-foreground)",
          flex: "0 0 auto",
        }}
      >
        <Icon name="connection-2" size={18} style={{ width: 14, height: 14 }} />
      </span>

      <span
        className="label-text-sm"
        style={{
          color: "var(--text-secondary-foreground)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>

      {flag && <FlagChip emoji={flag.emoji} name={flag.name} />}
    </button>
  );
}

function FlagChip({ emoji, name }: { emoji: string; name: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 8px 0 6px",
        borderRadius: 6,
        background: "var(--button-secondary-bg)",
        border: "1px solid var(--button-secondary-border)",
        boxShadow:
          "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
      }}
    >
      <span
        style={{
          fontSize: 12,
          lineHeight: 1,
          fontFamily:
            '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        }}
      >
        {emoji}
      </span>
      <span
        className="label-text-xs"
        style={{
          color: "var(--text-secondary-foreground)",
          letterSpacing: 0,
        }}
      >
        {name}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree connector — L-shape SVG using icon-misc token                 */
/* ------------------------------------------------------------------ */
function TreeConnector({ last = false }: { last?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: 16,
        height: 42,
        flex: "0 0 auto",
        /* Use the misc-foreground token so the dotted line reads in both
           light and dark modes. Previous `color-mix(..., black 20%)` looked
           fine on white but disappeared on the dark modal background. */
        color: "var(--icon-misc-foreground)",
        opacity: 0.6,
      }}
    >
      <svg
        width="16"
        height="42"
        viewBox="0 0 16 42"
        fill="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <path
          d={
            last
              ? "M8 -8 V 21 Q 8 23 10 23 H 16"
              : "M8 -8 V 50 M8 21 Q 8 23 10 23 H 16"
          }
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress dots                                                      */
/* ------------------------------------------------------------------ */
function ProgressDots({
  activeIndex,
  total,
}: {
  activeIndex: number;
  total: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            style={{
              width: isActive ? 32 : 6,
              height: 6,
              borderRadius: 999,
              background: isActive
                ? "var(--icon-primary-foreground)"
                : "var(--icon-misc-foreground)",
              opacity: isActive ? 1 : 0.6,
              transition: "width 200ms var(--ease-out)",
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */
function TertiaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: "var(--button-tertiary-bg)",
        border: "1px solid var(--button-tertiary-border)",
        boxShadow:
          "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        color: "var(--icon-secondary-foreground)",
        cursor: "pointer",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition:
          "background 160ms var(--ease-out), border-color 160ms var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--button-tertiary-bg-hover)";
        e.currentTarget.style.borderColor =
          "var(--button-tertiary-border-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--button-tertiary-bg)";
        e.currentTarget.style.borderColor = "var(--button-tertiary-border)";
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "relative",
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: "var(--button-primary-bg)",
        border: "1px solid var(--button-primary-border)",
        boxShadow:
          "0px 1px 1px 0.05px rgba(24,24,27,0.24), inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
        color: "var(--text-full-white)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition: "opacity 160ms var(--ease-out)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
