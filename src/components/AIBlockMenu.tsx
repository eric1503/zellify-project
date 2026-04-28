"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useDialKit } from "dialkit";
import Lottie from "lottie-react";
import writingLoaderAnimation from "../../public/animations/writing-loader.json";
import analyzingLoaderAnimation from "../../public/animations/analyzing-loader.json";

/* ─────────────────────────────────────────────────────────
 * AI Block Menu — inline command palette that appears inside
 * a block, Notion-style. Prompt input + quick actions + model
 * + scope selectors + Deep think toggle.
 * ───────────────────────────────────────────────────────── */

type ActionId = "grammar" | "clarity" | "longer" | "shorter";

type Action = {
  id: ActionId;
  iconSrc: string;
  iconFlipY?: boolean;
  label: string;
};

const ACTIONS: Action[] = [
  { id: "grammar", iconSrc: "/icons/brands/prompt-a.svg", label: "Fix spelling & grammar" },
  { id: "clarity", iconSrc: "/icons/brands/regenerate-a.svg", label: "Improve clarity" },
  { id: "longer", iconSrc: "/icons/brands/magic-pencil-b.svg", iconFlipY: true, label: "Write longer" },
  { id: "shorter", iconSrc: "/icons/brands/magic-eraser.svg", label: "Write shorter" },
];

type Model = {
  id: string;
  label: string;
  avatar: "claude" | "openai" | "gemini" | "grok" | "deepseek";
};

const MODELS: Model[] = [
  { id: "opus-4-6", label: "Opus 4.6", avatar: "claude" },
  { id: "sonnet-4-5", label: "Sonnet 4.5", avatar: "claude" },
  { id: "gpt-5-2", label: "GPT 5.2", avatar: "openai" },
  { id: "gpt-5-0", label: "GPT 5.0", avatar: "openai" },
  { id: "gpt-5-1-codex", label: "GPT 5.1 Codex", avatar: "openai" },
  { id: "gemini-3-flash", label: "Gemini 3 Flash", avatar: "gemini" },
  { id: "grok-code", label: "Grok Code", avatar: "grok" },
  { id: "deepseek-r1", label: "DeepSeek R1", avatar: "deepseek" },
  { id: "deepseek-v3-2", label: "DeepSeek V3.2", avatar: "deepseek" },
];

/* `fieldKey` lets the host map a suggestion back to a specific field in
   its content shape (e.g. "header.title", "plan2.banner"). Optional so
   the standalone /ai-menu preview still works without a host. */
export type Suggestion = { next: string; prev: string; fieldKey?: string };

const FALLBACK_SUGGESTIONS: Suggestion[] = [
  { next: "Step Into Your Full Potential", prev: "Unlock Your Full Potential" },
  {
    next: "Try everything free for 3 days and see where your journey takes you.",
    prev: "Start your journey with us and enjoy a 3-day free trial to explore everything we offer",
  },
  { next: "Monthly Plan", prev: "1-Month Plan" },
  { next: "TRY 3 DAYS FREE", prev: "3 DAYS FREE TRIAL" },
];

export type Scope = "this-block" | "all-blocks";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 };

export function AIBlockMenu({
  suggestions,
  onApplyAll,
  onApplyOne,
  onDismiss,
  onScopeChange,
}: {
  /* Per-block prev→next pairs to render in the suggestions panel. When
     omitted (e.g. /ai-menu standalone preview), falls back to a canned
     demo set so the component still works in isolation. */
  suggestions?: Suggestion[];
  /* Called when the user clicks "Apply all" — host should commit the
     `next` text into its own state. */
  onApplyAll?: () => void;
  /* Called when the user clicks Apply on a single suggestion card.
     Host inspects `fieldKey` to know which field to commit. */
  onApplyOne?: (suggestion: Suggestion) => void;
  /* Called when the menu wants to close. When provided the host owns
     visibility; when omitted the component falls back to its internal
     `dismissed` state for standalone use. */
  onDismiss?: () => void;
  /* Called when the user toggles the scope dropdown — host can mirror
     to drive its own suggestion/apply logic (e.g. compute over all
     blocks vs. just the selected one). */
  onScopeChange?: (scope: Scope) => void;
} = {}) {
  const effectiveSuggestions = suggestions ?? FALLBACK_SUGGESTIONS;
  const [prompt, setPrompt] = useState("");
  const [hoveredAction, setHoveredAction] = useState<ActionId | null>(null);
  const [modelId, setModelId] = useState<string>("deepseek-r1");
  const [modelOpen, setModelOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all-blocks");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionId | null>(null);
  const [loadingPromptText, setLoadingPromptText] = useState<string | null>(null);
  const [writingPhase, setWritingPhase] = useState<"analyzing" | "writing" | "suggestions" | null>(null);
  const [animateText, setAnimateText] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chipsAnchorRef = useRef<HTMLDivElement>(null);
  /* Once dismiss starts, freeze the card height so the panel doesn't
     shrink (e.g. from a suggestion being applied + filtered out) while
     the wrapper exit animation plays. */
  const isDismissingRef = useRef(false);

  const selectedModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const isLoading = loadingAction !== null || loadingPromptText !== null;
  const isSuggestions = writingPhase === "suggestions";
  const isWorking = isLoading && !isSuggestions;
  const loadingLabel = loadingAction
    ? ACTIONS.find((a) => a.id === loadingAction)?.label ?? ""
    : loadingPromptText ?? "";
  const isCustomPrompt = loadingPromptText !== null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Notify host of scope (incl. on mount with the default) so it can
     keep its suggestion/apply derivation in sync with the dropdown. */
  useEffect(() => {
    onScopeChange?.(scope);
  }, [scope, onScopeChange]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt, isLoading]);

  const activeAction = hoveredAction;

  const runAction = (id: ActionId) => {
    setLoadingAction(id);
    setWritingPhase("writing");
    console.log("run action", id, { prompt, scope, deepThink, modelId });
  };

  const stopAction = () => {
    setLoadingAction(null);
    setLoadingPromptText(null);
    setWritingPhase(null);
    setAnimateText(true);
  };

  const dismissAll = () => {
    isDismissingRef.current = true;
    if (onDismiss) onDismiss();
    else setDismissed(true);
  };

  /* Single-apply commits just this suggestion and leaves the panel
     open so the user can keep picking through the remaining cards.
     The applied card drops out automatically once the parent's
     updated content makes the prev/next pair equal. */
  const applyOne = (s: Suggestion) => {
    onApplyOne?.(s);
  };

  const runCustomPrompt = (text: string) => {
    flushSync(() => setAnimateText(false));
    setLoadingPromptText(text);
    setWritingPhase("analyzing");
    console.log("run prompt", { prompt: text, scope, deepThink, modelId });
  };

  const runPrompt = () => {
    if (activeAction) {
      runAction(activeAction);
      return;
    }
    if (prompt.trim().length === 0) return;
    runCustomPrompt(prompt);
  };

  const transition = useDialKit("Transition", {
    heightMs: [320, 50, 800],
    contentMs: [360, 50, 800],
    beamDelayMs: [500, 0, 3000],
    analyzingMs: [3000, 200, 6000],
    writingMs: [2500, 200, 8000],
  });

  useEffect(() => {
    if (writingPhase !== "analyzing") return;
    const t = setTimeout(() => setWritingPhase("writing"), transition.analyzingMs);
    return () => clearTimeout(t);
  }, [writingPhase, transition.analyzingMs]);

  useEffect(() => {
    if (writingPhase !== "writing") return;
    const t = setTimeout(() => setWritingPhase("suggestions"), transition.writingMs);
    return () => clearTimeout(t);
  }, [writingPhase, transition.writingMs]);

  /* If the user accepts every suggestion individually (or the AI returns
     none), the panel would otherwise sit empty with just the Dismiss /
     Apply-all footer. Auto-close so it gets out of the way. */
  useEffect(() => {
    if (writingPhase === "suggestions" && effectiveSuggestions.length === 0) {
      if (onDismiss) onDismiss();
      else setDismissed(true);
    }
  }, [writingPhase, effectiveSuggestions.length, onDismiss]);

  const beamActive = isWorking;
  const [beamReveal, setBeamReveal] = useState(false);
  useEffect(() => {
    if (beamActive) {
      const t = setTimeout(() => setBeamReveal(true), transition.beamDelayMs);
      return () => clearTimeout(t);
    }
    setBeamReveal(false);
  }, [beamActive, transition.beamDelayMs]);

  const cardContentRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = cardContentRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (isDismissingRef.current) return;
      setCardHeight(el.offsetHeight);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* When `dismissed` is true (standalone mode without onDismiss), unmount
     immediately. Entry/exit animation is owned by the parent's
     AnimatePresence — nesting our own here caused the wrapper motion.div
     to animate but never unmount. */
  if (dismissed) return null;

  return (
    <div style={{ display: "inline-block" }}>
    <CustomBeam
      active={beamReveal}
      duration={4.4}
      thickness={1.2}
      borderRadius={12}
      blur={11}
      headColor="#ff00ea"
      tailColor="#ff6a57"
      trailLength={41}
      bloomOpacity={1.0}
      bloomBlur={15}
      hueShift={25}
      style={{
        display: "inline-block",
        width: "fit-content",
        overflow: "visible",
      }}
    >
    <motion.div
      animate={cardHeight !== undefined ? { height: cardHeight } : undefined}
      transition={{ duration: transition.heightMs / 1000, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "relative",
        width: 400,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.05)",
        boxSizing: "content-box",
        background:
          "linear-gradient(90deg, rgba(243,83,63,0.06), rgba(243,83,63,0.06)), #ffffff",
        boxShadow:
          `0 0 10px 0px ${hexToRgba("#f3533f", beamReveal ? 0.08 : 0)}, 0px 1px 1px 0px #fcd8d0, 0px 4px 16px 0px rgba(17,17,26,0.05), 0px 8px 32px 0px rgba(17,17,26,0.05)`,
        transition: "box-shadow 300ms ease-out",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        overflow: "hidden",
      }}
    >
      <div ref={cardContentRef} style={{ padding: 4 }}>
      {/* Inner frosted card — prompt input + menu list */}
      <div
        style={{
          position: "relative",
          borderRadius: 10,
          border: "1px solid rgba(231,231,231,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            borderRadius: 10,
            border: "1px solid #ffffff",
          }}
        >
          <style>{`.ai-block-menu-input::placeholder{color:var(--text-muted-foreground);opacity:1;}`}</style>

          <AnimatePresence mode="popLayout" initial={false}>
          {!isSuggestions ? (
          <motion.div
            key="input-area"
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -5, opacity: 0 }}
            transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
          >
          {/* Top row: avatar anchors to first line; content can wrap below */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "9px 8px 9px 8px",
              minHeight: 40,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", height: "1.35em", fontSize: 14, flexShrink: 0 }}>
              <AgentAvatar active={isLoading} />
            </div>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.div
                    key="label"
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 5, opacity: 0 }}
                    transition={{ duration: animateText ? transition.contentMs / 1000 : 0, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-foreground)",
                        letterSpacing: "-0.07px",
                        whiteSpace: isCustomPrompt ? "normal" : "nowrap",
                        overflow: "hidden",
                        textOverflow: isCustomPrompt ? "clip" : "ellipsis",
                        lineHeight: 1.35,
                        wordBreak: "break-word",
                      }}
                    >
                      {loadingLabel}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    transition={{ duration: animateText ? transition.contentMs / 1000 : 0, ease: [0.32, 0.72, 0, 1] }}
                    style={{ marginRight: 34 }}
                  >
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          runPrompt();
                        }
                      }}
                      rows={1}
                      placeholder="Ask agent anything/choose options below..."
                      className="label-text-sm ai-block-menu-input"
                      style={{
                        display: "block",
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        padding: 0,
                        margin: 0,
                        color: "var(--text-foreground)",
                        letterSpacing: "-0.07px",
                        fontSize: 14,
                        fontWeight: 500,
                        fontFamily: "inherit",
                        lineHeight: 1.35,
                        resize: "none",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence initial={false}>
              {!isLoading && (
                <motion.div
                  key="submit"
                  initial={{ x: 5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 5, opacity: 0 }}
                  transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: "absolute", right: 7, top: 7 }}
                >
                  <SubmitButton onClick={runPrompt} enabled={prompt.length > 0} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider + action list — only in idle */}
          <AnimatePresence mode="popLayout" initial={false}>
            {!isLoading && (
              <motion.div
                key="actions-section"
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
              >
                <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
                <div
                  style={{ padding: 4, display: "flex", flexDirection: "column" }}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  {ACTIONS.map((a) => (
                    <ActionRow
                      key={a.id}
                      action={a}
                      active={activeAction === a.id}
                      onMouseEnter={() => setHoveredAction(a.id)}
                      onClick={() => runAction(a.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
          ) : (
          <motion.div
            key="suggestions-area"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 5, opacity: 0 }}
            transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
          >
            <SuggestionsPanel
              suggestions={effectiveSuggestions}
              onApplyOne={applyOne}
            />
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer — chip row or writing status, depending on state */}
      <AnimatePresence mode="popLayout" initial={false}>
      {isSuggestions && (
        <motion.div
          key="suggestions-footer"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 5, opacity: 0 }}
          transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 6px 6px 6px",
            marginTop: 2,
          }}
        >
          <GhostButton onClick={dismissAll}>Dismiss</GhostButton>
          <div style={{ marginLeft: "auto" }}>
            <PrimaryButton
              onClick={() => {
                onApplyAll?.();
                dismissAll();
              }}
            >
              Apply all
            </PrimaryButton>
          </div>
          {/* dismissAll already routes to onDismiss when provided. */}
        </motion.div>
      )}
      {isWorking && (
        <motion.div
          key="writing-footer"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 5, opacity: 0 }}
          transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 6px 6px 10px",
            marginTop: 2,
          }}
        >
          <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {writingPhase === "analyzing" ? (
                <motion.div
                  key="analyzing-icon"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <AnalyzingLoader />
                </motion.div>
              ) : (
                <motion.div
                  key="writing-icon"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <WritingLoader />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-secondary-foreground)",
              letterSpacing: "-0.07px",
              position: "relative",
              display: "block",
              height: "1.35em",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {writingPhase === "analyzing" ? (
                <motion.span
                  key="analyzing-text"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -5, opacity: 0 }}
                  transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: "absolute", inset: 0, display: "block" }}
                >
                  <ShimmerText
                    text="Analyzing your text..."
                    length={67}
                    baseOpacity={0.6}
                    duration={5.8}
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="writing-text"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -5, opacity: 0 }}
                  transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: "absolute", inset: 0, display: "block" }}
                >
                  <ShimmerText
                    text="Agent is writing..."
                    length={67}
                    baseOpacity={0.6}
                    duration={5.8}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <StopButton onClick={stopAction} />
        </motion.div>
      )}
      {!isLoading && (
      <motion.div
        key="chip-footer"
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -5, opacity: 0 }}
        transition={{ duration: transition.contentMs / 1000, ease: [0.32, 0.72, 0, 1] }}
        style={{ display: "flex", gap: 4, paddingTop: 4 }}
      >
        <div
          ref={chipsAnchorRef}
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 8,
            overflow: "visible",
            position: "relative",
          }}
        >
          <ModelChip
            model={selectedModel}
            open={modelOpen}
            onToggle={() => {
              setModelOpen((v) => !v);
              setScopeOpen(false);
            }}
          />
          <div
            aria-hidden
            style={{ width: 1, height: 14, background: "var(--divider-primary)" }}
          />
          <ScopeChip
            scope={scope}
            open={scopeOpen}
            onToggle={() => {
              setScopeOpen((v) => !v);
              setModelOpen(false);
            }}
          />

          {/* Model dropdown */}
          <AnimatePresence>
            {modelOpen && (
              <Dropdown
                width={249}
                offsetX={0}
                onDismiss={() => setModelOpen(false)}
                maxHeight={240}
                anchorRef={chipsAnchorRef}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {MODELS.map((m) => (
                    <DropdownItem
                      key={m.id}
                      selected={m.id === modelId}
                      onClick={() => {
                        setModelId(m.id);
                        setModelOpen(false);
                      }}
                      leading={<AvatarTile kind={m.avatar} selected={m.id === modelId} />}
                      label={m.label}
                    />
                  ))}
                </div>
              </Dropdown>
            )}
          </AnimatePresence>

          {/* Scope dropdown */}
          <AnimatePresence>
            {scopeOpen && (
              <Dropdown
                width={152}
                offsetX={90}
                onDismiss={() => setScopeOpen(false)}
                anchorRef={chipsAnchorRef}
              >
                <DropdownItem
                  selected={scope === "this-block"}
                  onClick={() => {
                    setScope("this-block");
                    setScopeOpen(false);
                  }}
                  label="This block only"
                />
                <DropdownItem
                  selected={scope === "all-blocks"}
                  onClick={() => {
                    setScope("all-blocks");
                    setScopeOpen(false);
                  }}
                  label="All block in page"
                />
              </Dropdown>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => setDeepThink((v) => !v)}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 30,
            padding: "0 10px",
            borderRadius: 8,
            background: "transparent",
            boxShadow: "inset 0 0 0 1px transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            transition:
              "background 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.06)";
            e.currentTarget.style.boxShadow =
              "inset 0 0 0 1px rgba(0,0,0,0.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.boxShadow = "inset 0 0 0 1px transparent";
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary-foreground)",
              opacity: 0.8,
              letterSpacing: 0,
              whiteSpace: "nowrap",
            }}
          >
            Deep think
          </span>
          <ToggleSwitch checked={deepThink} />
        </button>
      </motion.div>
      )}
      </AnimatePresence>
      </div>
    </motion.div>
    </CustomBeam>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CustomBeam — thin traveling arc circling the container             */
/* ------------------------------------------------------------------ */
function CustomBeam({
  active,
  duration,
  thickness,
  borderRadius,
  blur,
  headColor,
  tailColor,
  trailLength,
  bloomOpacity,
  bloomBlur,
  hueShift,
  children,
  style,
}: {
  active: boolean;
  duration: number;
  thickness: number;
  borderRadius: number;
  blur: number;
  headColor: string;
  tailColor: string;
  trailLength: number;
  bloomOpacity: number;
  bloomBlur: number;
  hueShift: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const midStop = trailLength * 0.5;
  const shineStop = Math.max(0.5, trailLength * 0.12);
  const gradient = `conic-gradient(from var(--cbm-angle), ${headColor} 0%, ${hexToRgba("#ffffff", 0.9)} ${shineStop}%, ${tailColor} ${midStop}%, ${hexToRgba(tailColor, 0)} ${trailLength}%, transparent 100%)`;
  const maskRing =
    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)";
  const hueAnim = hueShift > 0 ? `, custom-beam-hue 12s ease-in-out infinite` : "";
  return (
    <div style={{ position: "relative", ...style }}>
      <style>{`
        @property --cbm-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes custom-beam-rotate {
          to { --cbm-angle: 360deg; }
        }
        @keyframes custom-beam-hue {
          0%   { filter: var(--cbm-base-filter) hue-rotate(-${hueShift}deg); }
          50%  { filter: var(--cbm-base-filter) hue-rotate(${hueShift}deg); }
          100% { filter: var(--cbm-base-filter) hue-rotate(-${hueShift}deg); }
        }
        .cbm-rotating {
          animation: custom-beam-rotate ${duration}s linear infinite${hueAnim};
        }
        .cbm-bloom {
          animation: custom-beam-rotate ${duration}s linear infinite${hueAnim};
        }
      `}</style>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>

      {/* Bloom layer — blurred, desaturated-boosted for halo glow */}
      <div
        aria-hidden
        className="cbm-bloom"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          padding: thickness,
          background: gradient,
          WebkitMask: maskRing,
          mask: maskRing,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          ["--cbm-base-filter" as string]: `blur(${bloomBlur}px) brightness(1.3) saturate(1.2)`,
          filter: `blur(${bloomBlur}px) brightness(1.3) saturate(1.2)`,
          opacity: active ? bloomOpacity : 0,
          transition: "opacity 300ms ease-out",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* Sharp stroke ring */}
      <div
        aria-hidden
        className="cbm-rotating"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          padding: thickness,
          background: gradient,
          WebkitMask: maskRing,
          mask: maskRing,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          ["--cbm-base-filter" as string]: blur > 0 ? `blur(${blur}px)` : "none",
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          opacity: active ? 1 : 0,
          transition: "opacity 300ms ease-out",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ShimmerText — looping gradient sweep across text (thinking state)   */
/* ------------------------------------------------------------------ */
function ShimmerText({
  text,
  length,
  baseOpacity,
  duration,
}: {
  text: string;
  length: number;
  baseOpacity: number;
  duration: number;
}) {
  const half = length / 2;
  const leftEdge = Math.max(0, 50 - half);
  const rightEdge = Math.min(100, 50 + half);
  const basePct = Math.round(baseOpacity * 100);
  return (
    <>
      <style>{`
        @keyframes ai-shimmer-sweep {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ai-shimmer-text {
          background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--text-secondary-foreground) ${basePct}%, transparent) 0%,
            color-mix(in srgb, var(--text-secondary-foreground) ${basePct}%, transparent) ${leftEdge}%,
            var(--text-foreground) 50%,
            color-mix(in srgb, var(--text-secondary-foreground) ${basePct}%, transparent) ${rightEdge}%,
            color-mix(in srgb, var(--text-secondary-foreground) ${basePct}%, transparent) 100%
          );
          background-size: 200% 100%;
          background-position: 200% 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: ai-shimmer-sweep ${duration}s linear infinite;
        }
      `}</style>
      <span className="ai-shimmer-text">{text}</span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  hexToRgba — convert "#rrggbb" + alpha → "rgba(r,g,b,a)"             */
/* ------------------------------------------------------------------ */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(243,83,63,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ------------------------------------------------------------------ */
/*  Writing loader — Lottie spinner (system-solid-737-spinner-rain)     */
/* ------------------------------------------------------------------ */
function WritingLoader() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        flexShrink: 0,
      }}
    >
      <Lottie
        animationData={writingLoaderAnimation}
        loop
        autoplay
        style={{ width: 16, height: 16 }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Analyzing loader — Lottie dashed-circle spinner (phase 1)          */
/* ------------------------------------------------------------------ */
function AnalyzingLoader() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        flexShrink: 0,
      }}
    >
      <Lottie
        animationData={analyzingLoaderAnimation}
        loop
        autoplay
        style={{ width: 16, height: 16 }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Suggestions panel — text replacement proposals (phase 3)           */
/* ------------------------------------------------------------------ */
function SuggestionsPanel({
  suggestions,
  onApplyOne,
}: {
  suggestions: Suggestion[];
  onApplyOne?: (suggestion: Suggestion) => void;
}) {
  return (
    <div style={{ padding: "8px 8px 10px 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 4px 10px 4px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1px",
            color: "var(--text-muted-foreground)",
            textTransform: "uppercase",
          }}
        >
          Text Suggestions
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            borderTop: "1px dashed rgba(0,0,0,0.15)",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suggestions.map((s, i) => (
          <SuggestionCard
            key={s.fieldKey ?? i}
            suggestion={s}
            onApply={onApplyOne ? () => onApplyOne(s) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: Suggestion;
  onApply?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 10,
        border: "1px solid rgba(231,231,231,0.7)",
        background: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "inset 0 0 0 1px #ffffff, 0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflow: "hidden",
        transition: "background 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
      }}
    >
      <div style={{ paddingRight: 66, display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-foreground)",
            letterSpacing: "-0.1px",
            lineHeight: 1.4,
          }}
        >
          {suggestion.next}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "var(--text-muted-foreground)",
            textDecoration: "line-through",
            letterSpacing: "-0.07px",
            lineHeight: 1.4,
          }}
        >
          {suggestion.prev}
        </span>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.button
            key="apply"
            type="button"
            onClick={onApply}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 3, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--button-secondary-bg)",
              border: "1px solid var(--button-secondary-border)",
              boxShadow:
                "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1,
              color: "var(--text-secondary-foreground)",
              letterSpacing: "-0.07px",
              whiteSpace: "nowrap",
              transition:
                "background 140ms var(--ease-out), border-color 140ms var(--ease-out)",
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
            Apply
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Primary / Secondary buttons — style guide tokens                   */
/* ------------------------------------------------------------------ */
function PrimaryButton({
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
        position: "relative",
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: "var(--button-primary-bg)",
        border: "1px solid var(--button-primary-border)",
        boxShadow:
          "0px 1px 1px 0.05px rgba(24,24,27,0.24), inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
        color: "var(--text-full-white)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition: "background 140ms var(--ease-out), border-color 140ms var(--ease-out)",
        whiteSpace: "nowrap",
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
      {children}
    </button>
  );
}

function GhostButton({
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
        background: "transparent",
        boxShadow: "inset 0 0 0 1px transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text-secondary-foreground)",
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition:
          "background 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0,0,0,0.06)";
        e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.03)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.boxShadow = "inset 0 0 0 1px transparent";
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Stop button — square icon to cancel the running agent              */
/* ------------------------------------------------------------------ */
function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Stop"
      style={{
        width: 26,
        height: 26,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: "rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
        color: "var(--text-foreground)",
        transition: "background 140ms var(--ease-out)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(0,0,0,0.05)")
      }
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 2,
          background: "currentColor",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Submit button — orange primary, arrow-turn-left icon               */
/* ------------------------------------------------------------------ */
function SubmitButton({
  onClick,
  enabled,
}: {
  onClick: () => void;
  enabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Submit prompt"
      style={{
        width: 26,
        height: 26,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: "var(--button-primary-bg)",
        border: "1px solid var(--button-primary-border)",
        boxShadow:
          "0px 1px 1px 0.05px rgba(24,24,27,0.24), inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
        cursor: "pointer",
        color: "#ffffff",
        opacity: enabled ? 1 : 1,
        transition: "background 140ms var(--ease-out)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--button-primary-bg-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--button-primary-bg)")
      }
    >
      <Icon name="arrow-turn-left" size={12} style={{ width: 11, height: 11 }} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Action row — hoverable command                                     */
/* ------------------------------------------------------------------ */
function ActionRow({
  action,
  active,
  onMouseEnter,
  onClick,
}: {
  action: Action;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: 32,
        padding: "0 12px 0 8px",
        borderRadius: 8,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      {active && (
        <motion.span
          layoutId="action-hover-pill"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: "#fcf7f6",
            border: "1px solid #f5f5f5",
            zIndex: 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
        />
      )}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          width: 16,
          height: 16,
          flexShrink: 0,
          color: active
            ? "var(--icon-primary-foreground)"
            : "var(--icon-muted-foreground)",
          transition: "color 220ms var(--ease-out)",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            display: "block",
            background: "currentColor",
            transform: action.iconFlipY ? "scaleY(-1)" : undefined,
            WebkitMaskImage: `url(${action.iconSrc})`,
            maskImage: `url(${action.iconSrc})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      </span>
      <span
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.07px",
          color: active
            ? "var(--text-foreground)"
            : "var(--text-secondary-foreground)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          transition: "color 220ms var(--ease-out)",
        }}
      >
        {action.label}
      </span>
      {active && (
        <motion.span
          layoutId="action-hover-arrow"
          aria-hidden
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            color: "var(--text-misc-foreground)",
            flexShrink: 0,
            pointerEvents: "none",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
        >
          <Icon name="arrow-turn-left" size={12} />
        </motion.span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip — Opus model selector                                          */
/* ------------------------------------------------------------------ */
function ModelChip({
  model,
  open,
  onToggle,
}: {
  model: Model;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: open ? "rgba(0,0,0,0.06)" : "transparent",
        boxShadow: open
          ? "inset 0 0 0 1px rgba(0,0,0,0.03)"
          : "inset 0 0 0 1px transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        transition:
          "background 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        if (!open) {
          e.currentTarget.style.background = "rgba(0,0,0,0.06)";
          e.currentTarget.style.boxShadow =
            "inset 0 0 0 1px rgba(0,0,0,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        if (!open) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px transparent";
        }
      }}
    >
      <AvatarTile kind={model.avatar} size={13} selected />
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary-foreground)",
          opacity: 0.8,
          letterSpacing: 0,
          whiteSpace: "nowrap",
        }}
      >
        {model.label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip — scope (this block / all blocks)                             */
/* ------------------------------------------------------------------ */
function ScopeChip({
  scope,
  open,
  onToggle,
}: {
  scope: Scope;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: open ? "rgba(0,0,0,0.06)" : "transparent",
        boxShadow: open
          ? "inset 0 0 0 1px rgba(0,0,0,0.03)"
          : "inset 0 0 0 1px transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        transition:
          "background 140ms var(--ease-out), box-shadow 140ms var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        if (!open) {
          e.currentTarget.style.background = "rgba(0,0,0,0.06)";
          e.currentTarget.style.boxShadow =
            "inset 0 0 0 1px rgba(0,0,0,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        if (!open) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px transparent";
        }
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary-foreground)",
          opacity: 0.8,
          letterSpacing: 0,
          whiteSpace: "nowrap",
        }}
      >
        {scope === "this-block" ? "This block" : "All block"}
      </span>
      <span
        style={{
          display: "inline-flex",
          color: "var(--icon-muted-foreground)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 160ms var(--ease-out)",
        }}
      >
        <Icon name="chevron-down" size={12} style={{ width: 10, height: 10 }} />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Dropdown — menu popover                                             */
/* ------------------------------------------------------------------ */
function Dropdown({
  width,
  offsetX,
  onDismiss,
  children,
  maxHeight,
  anchorRef,
}: {
  width: number;
  offsetX: number;
  onDismiss: () => void;
  children: React.ReactNode;
  maxHeight?: number;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + 6 + window.scrollY,
        left: r.left + offsetX + window.scrollX,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, offsetX]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onDismiss();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    /* defer so the click that opened the menu doesn't immediately close it */
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onDocClick);
    }, 0);
    document.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onDismiss, anchorRef]);

  if (typeof document === "undefined" || !pos) return null;

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      exit={{
        opacity: 0,
        scale: 0.99,
        transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
      }}
      className={maxHeight ? "ai-block-menu-dropdown" : undefined}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width,
        padding: 4,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        background: "var(--menu-bg)",
        border: "1px solid var(--menu-border)",
        borderRadius: 8,
        boxShadow: "0px 12px 42px 0px rgba(0,0,0,0.1)",
        zIndex: 40,
        transformOrigin: "top left",
        maxHeight,
        overflowY: maxHeight ? "auto" : undefined,
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {maxHeight && (
        <style>{`
          .ai-block-menu-dropdown{scrollbar-width:thin;scrollbar-color:rgba(0,0,0,0.18) transparent;}
          .ai-block-menu-dropdown::-webkit-scrollbar{width:6px;height:6px;}
          .ai-block-menu-dropdown::-webkit-scrollbar-track{background:transparent;border:none;}
          .ai-block-menu-dropdown::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,0.14);border-radius:999px;border:1px solid transparent;background-clip:padding-box;}
          .ai-block-menu-dropdown::-webkit-scrollbar-thumb:hover{background-color:rgba(0,0,0,0.28);}
          .ai-block-menu-dropdown::-webkit-scrollbar-button{display:none;height:0;width:0;}
        `}</style>
      )}
      {children}
    </motion.div>,
    document.body,
  );
}

function DropdownHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 8px",
      }}
    >
      <Icon name={icon} size={18} style={{ width: 14, height: 14 }} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary-foreground)",
          letterSpacing: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function DropdownDivider() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        background: "var(--divider-primary)",
        marginLeft: -4,
        marginRight: -4,
      }}
    />
  );
}

function DropdownItem({
  selected,
  onClick,
  leading,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  leading?: React.ReactNode;
  label: string;
}) {
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
        gap: 8,
        width: "100%",
        height: 30,
        padding: "0 8px",
        borderRadius: 8,
        background: hover ? "var(--menu-list-hover)" : "transparent",
        border: hover
          ? "1px solid var(--menu-list-border-hover)"
          : "1px solid transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background 120ms var(--ease-out)",
      }}
    >
      {leading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {leading}
        </span>
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 500,
          color: selected
            ? "var(--text-foreground)"
            : "var(--text-secondary-foreground)",
          letterSpacing: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      {selected && (
        <span
          style={{
            display: "inline-flex",
            color: "var(--icon-primary-foreground)",
            flexShrink: 0,
          }}
        >
          <Icon name="check" size={12} />
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar tiles — branded model icons                                  */
/* ------------------------------------------------------------------ */
function AvatarTile({
  kind,
  size = 16,
  selected = false,
}: {
  kind: Model["avatar"];
  size?: number;
  selected?: boolean;
}) {
  const src: string =
    kind === "claude"
      ? "/icons/brands/claude.svg"
      : kind === "openai"
        ? "/icons/brands/openai.svg"
        : kind === "gemini"
          ? "/icons/brands/gemini-bg.png"
          : kind === "grok"
            ? "/icons/brands/grok.png"
            : "/icons/brands/deepseek.png";

  const brandColor: string =
    kind === "claude"
      ? "#d97757"
      : kind === "openai"
        ? "#000000"
        : kind === "gemini"
          ? "#4285f4"
          : kind === "grok"
            ? "#000000"
            : "#4368fe";

  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        background: selected ? brandColor : "var(--icon-muted-foreground)",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function AgentAvatar({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      {active ? (
        <LiquidMetalScene size={22} />
      ) : (
        <img
          src="/icons/brands/agent-avatar.png"
          alt=""
          width={22}
          height={22}
          style={{ display: "block", objectFit: "cover", width: "100%", height: "100%" }}
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  LiquidMetalScene — Unicorn Studio shader scene used while the AI   */
/*  is running. Loads the runtime once on demand, then mounts the      */
/*  scene from `/animations/3d-liquid-metal.json`.                     */
/* ------------------------------------------------------------------ */
const UNICORN_STUDIO_SRC = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.9/dist/unicornStudio.umd.js";
let unicornStudioLoader: Promise<void> | null = null;
function loadUnicornStudio(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { UnicornStudio?: { isInitialized?: boolean; addScene?: (opts: object) => Promise<{ destroy?: () => void }> } };
  if (w.UnicornStudio?.addScene) return Promise.resolve();
  if (unicornStudioLoader) return unicornStudioLoader;
  unicornStudioLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${UNICORN_STUDIO_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("UnicornStudio failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = UNICORN_STUDIO_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("UnicornStudio failed to load"));
    document.head.appendChild(s);
  });
  return unicornStudioLoader;
}

function LiquidMetalScene({ size }: { size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let destroyed = false;
    let scene: { destroy?: () => void } | null = null;
    loadUnicornStudio()
      .then(() => {
        if (destroyed || !ref.current) return;
        const w = window as unknown as { UnicornStudio: { addScene: (opts: object) => Promise<{ destroy?: () => void }> } };
        return w.UnicornStudio.addScene({
          element: ref.current,
          filePath: "/animations/3d-liquid-metal.json",
          scale: 1,
          dpi: 1.5,
          fps: 60,
          lazyLoad: false,
          interactivity: { mouse: { disableMobile: true } },
        });
      })
      .then((s) => {
        if (destroyed) {
          s?.destroy?.();
          return;
        }
        scene = s ?? null;
      })
      .catch(() => {});
    return () => {
      destroyed = true;
      scene?.destroy?.();
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle switch — small inline variant matching footer spec           */
/* ------------------------------------------------------------------ */
function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        display: "inline-block",
        width: 24,
        height: 14,
        borderRadius: 999,
        background: checked ? "var(--builder-brand)" : "rgba(0,0,0,0.12)",
        border: "0.5px solid rgba(0,0,0,0.04)",
        transition: "background 160ms var(--ease-out)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: 1,
          width: 12,
          height: 12,
          borderRadius: 999,
          background: "#ffffff",
          boxShadow: "0px 1.5px 4px 0px rgba(0,0,0,0.15)",
          transform: checked
            ? "translate(9px, -50%)"
            : "translate(0, -50%)",
          transition: "transform 200ms var(--ease-out)",
        }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon — mask-image with currentColor                                 */
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
  const prefix = size <= 12 ? "12px-filled" : "18px";
  const file = size <= 12 ? `12-${name}` : `18-${name}`;
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
