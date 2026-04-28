"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useDialKit } from "dialkit";
import {
  DEFAULT_CONTENT,
  PaywallScreen,
  type PaywallBlockId,
  type PaywallContent,
} from "@/components/PaywallScreen";
import { AIBlockMenu, type Scope, type Suggestion } from "@/components/AIBlockMenu";

/* Mock "AI rewrite" — what the model would propose for each block.
   Real integration would replace this with a server call that returns a
   PaywallContent diff for the selected block. */
const MOCK_REWRITES: PaywallContent = {
  header: {
    title: "Step Into Your Full Potential",
    body: "Try everything free for 3 days and see\nwhere your journey takes you.",
  },
  plan1: { title: "Monthly Plan", priceLabel: "$19.99 / month", perDay: "$0.66" },
  plan2: {
    title: "6-Month Bundle",
    priceLabel: "$49.99 / 6 mo",
    perDay: "$0.27",
    banner: "TRY 3 DAYS FREE",
  },
  checkout: { ctaPrefix: "Continue with" },
};

/* Which content fields belong to each selectable block. Used both to
   compute suggestions and to apply the rewrite scoped to the selection. */
const BLOCK_FIELDS: Record<PaywallBlockId, Array<keyof PaywallContent>> = {
  header: ["header"],
  plans: ["plan1", "plan2"],
  checkout: ["checkout"],
};

/* Resolve which content sections a given (selectedBlock, scope) pair
   should rewrite. "all-blocks" cascades across header → plans → checkout
   so the AI can rewrite the entire phone in one pass. */
function sectionsForScope(
  selectedBlock: PaywallBlockId,
  scope: Scope,
): Array<keyof PaywallContent> {
  if (scope === "all-blocks") {
    return [
      ...BLOCK_FIELDS.header,
      ...BLOCK_FIELDS.plans,
      ...BLOCK_FIELDS.checkout,
    ];
  }
  return BLOCK_FIELDS[selectedBlock];
}

function computeSuggestions(
  current: PaywallContent,
  sections: Array<keyof PaywallContent>,
): Suggestion[] {
  const out: Suggestion[] = [];
  for (const key of sections) {
    const cur = current[key] as Record<string, string>;
    const next = MOCK_REWRITES[key] as Record<string, string>;
    for (const field of Object.keys(cur)) {
      const prev = cur[field];
      const proposed = next[field];
      if (proposed && proposed !== prev) {
        /* `fieldKey` is "<section>.<field>" — round-trip identifier the
           single-suggestion Apply handler uses to commit just this field. */
        out.push({ prev, next: proposed, fieldKey: `${key}.${field}` });
      }
    }
  }
  return out;
}

function applyRewrite(
  current: PaywallContent,
  sections: Array<keyof PaywallContent>,
): PaywallContent {
  const updated = { ...current } as PaywallContent;
  for (const key of sections) {
    (updated as Record<string, unknown>)[key] = {
      ...(current[key] as object),
      ...(MOCK_REWRITES[key] as object),
    };
  }
  return updated;
}

/* Apply a single suggestion by its "<section>.<field>" identifier. Used
   by the per-card Apply button so the user can accept rewrites one at a
   time. */
function applyOneRewrite(
  current: PaywallContent,
  fieldKey: string,
): PaywallContent {
  const [section, field] = fieldKey.split(".") as [keyof PaywallContent, string];
  const proposed = (MOCK_REWRITES[section] as Record<string, string>)[field];
  if (proposed === undefined) return current;
  return {
    ...current,
    [section]: {
      ...(current[section] as object),
      [field]: proposed,
    },
  };
}

/* ─────────────────────────────────────────────────────────
 * Paywall — mobile subscription screen. Matches Figma spec
 * 7756:425434 (Zellify mobile paywall). Phone-frame preview
 * with two plan tiles (outer glow on selected), a 3-day
 * free-trial banner on the annual plan, and a Stripe CTA
 * with top-highlight gloss.
 * ───────────────────────────────────────────────────────── */

export default function PaywallPage() {
  const [selectedBlock, setSelectedBlock] = useState<PaywallBlockId | null>(
    null,
  );
  const [isEditingText, setIsEditingText] = useState(false);
  const [content, setContent] = useState<PaywallContent>(DEFAULT_CONTENT);
  /* Mirrors the AI menu's scope dropdown (default matches the menu's
     "All block in page"). Used to widen suggestions/apply across every
     section of the phone, not just the clicked block. */
  const [scope, setScope] = useState<Scope>("all-blocks");

  /* Edit text only makes sense while a block is selected; deselecting
     should also dismiss the AI menu. */
  useEffect(() => {
    if (selectedBlock === null) setIsEditingText(false);
  }, [selectedBlock]);

  /* Each time the menu opens for a block, derive the prev→next pairs
     the (mock) AI would propose. Recomputed when content/scope change
     so a re-edit shows the latest current text as `prev`. */
  const suggestions = useMemo(
    () =>
      selectedBlock
        ? computeSuggestions(content, sectionsForScope(selectedBlock, scope))
        : [],
    [content, selectedBlock, scope],
  );

  const dial = useDialKit("Phone", {
    scale: [0.7, 0.3, 1.4, 0.05],
    width: [390, 320, 430, 1],
    height: [820, 600, 932, 1],
    bezelRadius: [54, 24, 80, 1],
    bezelPadding: [10, 4, 16, 1],
  });

  /* Tunable timing for the Edit-text reveal/hide. Bounce influences
     the spring's overshoot — keep low for snappy chip motion. */
  const motionDial = useDialKit("Edit-text motion", {
    entryDuration: [0.32, 0.05, 1.5, 0.01],
    entryDelay: [0, 0, 1, 0.01],
    exitDuration: [0.18, 0.05, 1.5, 0.01],
    exitDelay: [0, 0, 1, 0.01],
    bounce: [0.18, 0, 0.6, 0.01],
  });

  /* transform: scale doesn't shrink layout — derive the visual footprint
     so the toolbar can sit flush beneath the bezel at any dial value. */
  const visualWidth = dial.width * dial.scale;
  const visualHeight = dial.height * dial.scale;

  return (
    <div
      onClick={() => setSelectedBlock(null)}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--page-background)",
        backgroundImage:
          "radial-gradient(rgba(17,17,24,0.08) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* The phone is the only in-flow child — toolbar and AI menu are
          absolutely positioned so the phone stays perfectly centered
          regardless of toolbar width or menu state. */}
      <div
        style={{
          position: "relative",
          width: visualWidth,
          height: visualHeight,
        }}
      >
        <PhoneFrame
          scale={dial.scale}
          width={dial.width}
          height={dial.height}
          bezelRadius={dial.bezelRadius}
          bezelPadding={dial.bezelPadding}
          transformOrigin="top left"
          zIndex={1}
        >
          <PaywallScreen
            selectedBlock={selectedBlock}
            content={content}
            onSelectBlock={(id) =>
              setSelectedBlock((prev) => (prev === id ? null : id))
            }
          />
        </PhoneFrame>

        {/* Toolbar floats below the phone, centered horizontally. Sits
            behind the phone (z-index 0) so the phone bezel layers over
            it if they ever overlap. */}
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 20px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
          }}
        >
          <Toolbar
            selectedBlock={selectedBlock}
            isEditingText={isEditingText}
            onEditTextClick={() => setIsEditingText((v) => !v)}
            entryDuration={motionDial.entryDuration}
            entryDelay={motionDial.entryDelay}
            exitDuration={motionDial.exitDuration}
            exitDelay={motionDial.exitDelay}
            bounce={motionDial.bounce}
          />
        </div>

        {/* AI menu floats to the right, vertically centered with phone. */}
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 24px)",
            top: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {/* AnimatePresence dropped exit-driven unmounts here (the
              wrapper finished animating to its exit values but never
              unmounted, leaving a zombie menu). Drive opacity/x off the
              flag directly and keep the wrapper mounted; remount the
              menu on block change via key so re-edits get a fresh
              session. */}
          <motion.div
            initial={false}
            animate={
              isEditingText && selectedBlock
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -10 }
            }
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: isEditingText && selectedBlock ? "auto" : "none",
            }}
          >
            {selectedBlock && (
              <AIBlockMenu
                key={`ai-menu-${selectedBlock}`}
                suggestions={suggestions}
                onScopeChange={setScope}
                onApplyAll={() =>
                  selectedBlock &&
                  setContent((c) =>
                    applyRewrite(c, sectionsForScope(selectedBlock, scope)),
                  )
                }
                onApplyOne={(s) => {
                  if (!s.fieldKey) return;
                  setContent((c) => applyOneRewrite(c, s.fieldKey!));
                }}
                onDismiss={() => {
                  setIsEditingText(false);
                  /* Wait for the wrapper exit animation (240ms) before
                     clearing the selected block — otherwise the menu
                     unmounts mid-fade and the selection / Edit text
                     button vanish before the user sees the exit. */
                  setTimeout(() => setSelectedBlock(null), 240);
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar — sits beneath the phone. Page picker is always shown;     */
/*  Edit text reveals when a block is selected.                        */
/* ------------------------------------------------------------------ */
function Toolbar({
  selectedBlock,
  isEditingText,
  onEditTextClick,
  entryDuration,
  entryDelay,
  exitDuration,
  exitDelay,
  bounce,
}: {
  selectedBlock: PaywallBlockId | null;
  isEditingText: boolean;
  onEditTextClick: () => void;
  entryDuration: number;
  entryDelay: number;
  exitDuration: number;
  exitDelay: number;
  bounce: number;
}) {
  /* AnimatePresence reads `transition` off the *exiting* element, so we
     branch on `selectedBlock` to swap entry/exit timing. The `layout`
     transition is shared between siblings so the picker slides in step. */
  const isEntering = selectedBlock !== null;
  const phase = isEntering
    ? { duration: entryDuration, delay: entryDelay }
    : { duration: exitDuration, delay: exitDelay };
  const layoutTransition = {
    type: "spring" as const,
    duration: isEntering ? entryDuration : exitDuration,
    delay: isEntering ? entryDelay : exitDelay,
    bounce,
  };

  return (
    <LayoutGroup>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <ToolbarButton
          layoutTransition={layoutTransition}
          style={{ position: "relative", zIndex: 2 }}
        >
          <Icon name="mobile" size={16} />
          <span>Name Input Page</span>
          <Icon name="chevron-expand-y" size={16} />
        </ToolbarButton>

        {/* popLayout pulls the exiting wrapper out of flow on the same
            frame the state flips, so the Page-name FLIP slide runs in
            lockstep with the Edit-text fade. The wrapper (not the button)
            is the AnimatePresence child so motion's position:absolute
            injection isn't blocked by the button's `all: "unset"`. */}
        <AnimatePresence initial={false} mode="popLayout">
          {selectedBlock && (
            <motion.div
              key="edit-text"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{
                ...phase,
                ease: [0.23, 1, 0.32, 1],
              }}
              style={{ display: "inline-flex" }}
            >
              <ToolbarButton
                onClick={onEditTextClick}
                style={
                  isEditingText
                    ? {
                        background: "var(--button-secondary-bg-hover)",
                        borderColor: "var(--button-secondary-border-hover)",
                      }
                    : undefined
                }
              >
                <Icon name="text-sparkle" size={16} />
                <span>Edit text</span>
              </ToolbarButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

function ToolbarButton({
  children,
  layoutId,
  initial,
  animate,
  exit,
  transition,
  layoutTransition,
  style,
  onClick,
}: {
  children: React.ReactNode;
  layoutId?: string;
  initial?: Parameters<typeof motion.button>[0]["initial"];
  animate?: Parameters<typeof motion.button>[0]["animate"];
  exit?: Parameters<typeof motion.button>[0]["exit"];
  transition?: Parameters<typeof motion.button>[0]["transition"];
  layoutTransition?: Parameters<typeof motion.button>[0]["transition"];
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  /* layout shifts use the toolbar's tunable spring; visual property
     animations (opacity/scale on enter+exit, hover) keep their own. */
  const fallbackSpring = { type: "spring" as const, duration: 0.42, bounce: 0.18 };
  return (
    <motion.button
      type="button"
      layout
      layoutId={layoutId}
      onClick={onClick}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      transition={{
        layout: layoutTransition ?? fallbackSpring,
        default: transition ?? fallbackSpring,
      }}
      variants={{
        hover: {
          backgroundColor: "var(--button-secondary-bg-hover)",
          borderColor: "var(--button-secondary-border-hover)",
        },
      }}
      style={{
        all: "unset",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 7px",
        borderRadius: 8,
        background: "#ffffff",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#e5e5eb",
        color: "var(--text-secondary-foreground)",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.07px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        boxSizing: "border-box",
        boxShadow:
          "0 1px 2px -1px rgba(36,38,40,0.10), 0 1px 1px 0 rgba(36,38,40,0.04), 0 1px 0 0 rgba(0,0,0,0.04), 0 4px 12px 0 rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
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
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Phone frame — custom-drawn bezel sized by the dial. The bezel is a */
/*  thin dark ring (bezelPadding) with a screen rect inset inside it.  */
/*  Inner radius derives from outer (bezelRadius) minus padding so the */
/*  screen corners stay concentric with the bezel.                      */
/* ------------------------------------------------------------------ */
function PhoneFrame({
  children,
  scale = 1,
  width = 390,
  height = 820,
  bezelRadius = 54,
  bezelPadding = 10,
  transformOrigin = "center",
  zIndex,
}: {
  children: React.ReactNode;
  scale?: number;
  width?: number;
  height?: number;
  bezelRadius?: number;
  bezelPadding?: number;
  transformOrigin?: string;
  zIndex?: number;
}) {
  const innerRadius = Math.max(0, bezelRadius - bezelPadding);
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        transform: `scale(${scale})`,
        transformOrigin,
        background: "#111118",
        borderRadius: bezelRadius,
        padding: bezelPadding,
        boxSizing: "border-box",
        zIndex,
        boxShadow:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(0,0,0,0.4), 0 30px 60px -20px rgba(0,0,0,0.35), 0 12px 24px -12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: innerRadius,
          overflow: "hidden",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
