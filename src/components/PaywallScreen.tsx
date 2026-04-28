"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";

/* ------------------------------------------------------------------ */
/*  TextSwap — fades+blurs old text up, swaps in new text, fades it    */
/*  back from below. Three-phase JS-driven sequence (transitions.dev).  */
/*  `delay` staggers the start so simultaneous swaps cascade visually   */
/*  top-to-bottom instead of all flashing at once.                      */
/* ------------------------------------------------------------------ */
const TEXT_SWAP_DUR_MS = 360;

function TextSwap({ text, delay = 0 }: { text: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState(text);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (text === displayText) return;
    const el = ref.current;
    if (!el) {
      setDisplayText(text);
      return;
    }

    const startId = window.setTimeout(() => {
      el.classList.remove("is-enter-start");
      el.classList.add("is-exit");
    }, delay);

    const swapId = window.setTimeout(() => {
      flushSync(() => {
        el.classList.remove("is-exit");
        el.classList.add("is-enter-start");
        setDisplayText(text);
      });
      void el.offsetWidth;
      el.classList.remove("is-enter-start");
    }, delay + TEXT_SWAP_DUR_MS);

    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(swapId);
    };
  }, [text, displayText, delay]);

  return (
    <span ref={ref} className="t-text-swap">
      {displayText}
    </span>
  );
}

/* Stagger step — shared so the host can pre-compute call-site delays. */
const SWAP_STAGGER_MS = 35;

type PlanId = "1-month" | "6-month";
export type PaywallBlockId = "header" | "plans" | "checkout";

/* All editable text in the paywall, surfaced as one shape so the AI menu
   (and any future text editor) can read & write every string in the UI. */
export type PaywallContent = {
  header: { title: string; body: string };
  plan1: { title: string; priceLabel: string; perDay: string };
  plan2: { title: string; priceLabel: string; perDay: string; banner: string };
  checkout: { ctaPrefix: string };
};

export const DEFAULT_CONTENT: PaywallContent = {
  header: {
    title: "Unlock Your Full Potential",
    body: "Start your journey with us and enjoy a\n3-day free trial to explore everything we offer.",
  },
  plan1: { title: "1-Month Plan", priceLabel: "$19.99/month", perDay: "$0.66" },
  plan2: {
    title: "6-Month Plan",
    priceLabel: "$49.99/6 months",
    perDay: "$0.27",
    banner: "3 DAYS FREE TRIAL",
  },
  checkout: { ctaPrefix: "Checkout with" },
};

const BRAND = "#f3533f";

export function PaywallScreen({
  selectedBlock = null,
  onSelectBlock,
  content = DEFAULT_CONTENT,
}: {
  selectedBlock?: PaywallBlockId | null;
  onSelectBlock?: (id: PaywallBlockId) => void;
  content?: PaywallContent;
} = {}) {
  const [plan, setPlan] = useState<PlanId>("6-month");

  return (
    <>
      <StatusBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "54px 20px 34px",
          gap: 28,
        }}
      >
        <SelectableBlock
          id="header"
          selected={selectedBlock === "header"}
          onSelect={onSelectBlock}
        >
          <header style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <h1
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.26px",
                lineHeight: 1.15,
                color: "var(--text-foreground)",
              }}
            >
              <TextSwap text={content.header.title} delay={0} />
            </h1>
            <p
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: 16,
                lineHeight: 1.6,
                color: "var(--text-secondary-foreground)",
                fontWeight: 500,
                letterSpacing: "-0.16px",
                whiteSpace: "pre-line",
              }}
            >
              <TextSwap text={content.header.body} delay={SWAP_STAGGER_MS} />
            </p>
          </header>
        </SelectableBlock>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SelectableBlock
            id="plans"
            selected={selectedBlock === "plans"}
            onSelect={onSelectBlock}
          >
            <LayoutGroup>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <PlanCard
                  id="1-month"
                  selected={plan === "1-month"}
                  title={content.plan1.title}
                  priceLabel={content.plan1.priceLabel}
                  perDay={content.plan1.perDay}
                  staggerStart={2}
                  onSelect={() => setPlan("1-month")}
                />
                <PlanCard
                  id="6-month"
                  selected={plan === "6-month"}
                  title={content.plan2.title}
                  priceLabel={content.plan2.priceLabel}
                  perDay={content.plan2.perDay}
                  banner={content.plan2.banner}
                  staggerStart={5}
                  onSelect={() => setPlan("6-month")}
                />
              </div>
            </LayoutGroup>
          </SelectableBlock>

          <SelectableBlock
            id="checkout"
            selected={selectedBlock === "checkout"}
            onSelect={onSelectBlock}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <CheckoutButton ctaPrefix={content.checkout.ctaPrefix} staggerStart={9} />
              <PaymentLogos />
            </div>
          </SelectableBlock>
        </div>
      </div>

      <HomeIndicator />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SelectableBlock — design-tool selection: solid brand border, brand */
/*  tint fill, and four white corner handles. Overlay is absolutely    */
/*  positioned so the layout doesn't shift when selected. Inert when   */
/*  no onSelect handler is provided (e.g. standalone preview).         */
/* ------------------------------------------------------------------ */
function SelectableBlock({
  id,
  selected,
  onSelect,
  children,
}: {
  id: PaywallBlockId;
  selected: boolean;
  onSelect?: (id: PaywallBlockId) => void;
  children: React.ReactNode;
}) {
  if (!onSelect) return <>{children}</>;
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      style={{ position: "relative", cursor: "pointer" }}
    >
      {children}
      {selected && <SelectionFrame />}
    </div>
  );
}

function SelectionFrame() {
  const handle: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    background: "#ffffff",
    border: `1.5px solid ${BRAND}`,
    boxSizing: "border-box",
  };
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: -6,
        border: `1.5px solid ${BRAND}`,
        background: "rgba(243,83,63,0.06)",
        pointerEvents: "none",
      }}
    >
      <span style={{ ...handle, top: -5, left: -5 }} />
      <span style={{ ...handle, top: -5, right: -5 }} />
      <span style={{ ...handle, bottom: -5, left: -5 }} />
      <span style={{ ...handle, bottom: -5, right: -5 }} />
    </div>
  );
}

function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        padding: "18px 28px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 2,
        color: "#0e0e16",
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.4px",
          fontFamily:
            "-apple-system, 'SF Pro Text', 'SF Pro Display', BlinkMacSystemFont, sans-serif",
        }}
      >
        9:41
      </span>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 11,
          left: "50%",
          transform: "translateX(-50%)",
          width: 124,
          height: 37,
          borderRadius: 999,
          background: "#0e0e16",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 134,
        height: 5,
        borderRadius: 999,
        background: "#0e0e16",
      }}
    />
  );
}

function PlanCard({
  selected,
  title,
  priceLabel,
  perDay,
  banner,
  staggerStart,
  onSelect,
}: {
  id: PlanId;
  selected: boolean;
  title: string;
  priceLabel: string;
  perDay: string;
  banner?: string;
  staggerStart: number;
  onSelect: () => void;
}) {
  const bannerDelay = staggerStart * SWAP_STAGGER_MS;
  const titleDelay = (staggerStart + (banner ? 1 : 0)) * SWAP_STAGGER_MS;
  const priceDelay = titleDelay + SWAP_STAGGER_MS;
  const perDayDelay = priceDelay + SWAP_STAGGER_MS;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
      animate={{
        boxShadow: selected
          ? "0 0 0 2px rgba(243,114,63,0.22), 0 10px 28px -14px rgba(243,83,63,0.28)"
          : "0 1.5px 3px -1.5px rgba(36,38,40,0.10), 0 1px 2px -1px rgba(36,38,40,0.10), 0 1px 1px 0 rgba(36,38,40,0.04)",
      }}
      style={{
        all: "unset",
        position: "relative",
        display: "block",
        borderRadius: 12,
        cursor: "pointer",
        background: "#ffffff",
      }}
      aria-pressed={selected}
    >
      <AnimatePresence initial={false}>
        {banner && (
          <motion.div
            key="banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 28, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{
              overflow: "hidden",
              background: BRAND,
              color: "#ffffff",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <div
              style={{
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              <TextSwap text={banner} delay={bannerDelay} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          height: 72,
          borderRadius: banner ? "0 0 12px 12px" : 12,
          background: selected
            ? "linear-gradient(rgba(243,83,63,0.05), rgba(243,83,63,0.05)), #ffffff"
            : "#ffffff",
          border: `1px solid ${selected ? BRAND : "var(--button-secondary-border)"}`,
          boxSizing: "border-box",
          transition:
            "background 220ms var(--ease-out), border-color 220ms var(--ease-out)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", alignSelf: "stretch", paddingTop: 4 }}>
          <RadioDot selected={selected} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-foreground)",
              letterSpacing: "-0.16px",
              lineHeight: 1.2,
            }}
          >
            <TextSwap text={title} delay={titleDelay} />
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-secondary-foreground)",
              fontWeight: 500,
              letterSpacing: "-0.07px",
              lineHeight: 1.2,
            }}
          >
            <TextSwap text={priceLabel} delay={priceDelay} />
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-foreground)",
              letterSpacing: "-0.16px",
              lineHeight: 1.2,
            }}
          >
            <TextSwap text={perDay} delay={perDayDelay} />
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-secondary-foreground)",
              fontWeight: 500,
              letterSpacing: "-0.07px",
              lineHeight: 1.2,
            }}
          >
            per day
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 999,
        background: selected ? "#ffffff" : "#e5e7eb",
        border: selected ? `5px solid ${BRAND}` : "1.25px solid #d7dae0",
        boxSizing: "border-box",
        flexShrink: 0,
        transition:
          "background 180ms var(--ease-out), border-color 180ms var(--ease-out), border-width 180ms var(--ease-out)",
      }}
    />
  );
}

function CheckoutButton({ ctaPrefix, staggerStart }: { ctaPrefix: string; staggerStart: number }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
      style={{
        all: "unset",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        height: 48,
        borderRadius: 10,
        background: "#0e0e16",
        color: "#ffffff",
        cursor: "pointer",
        boxSizing: "border-box",
        border: "1px solid #0e0e16",
        boxShadow:
          "0 1px 1px rgba(24,24,27,0.24), inset 0 8px 16px rgba(255,255,255,0.16), inset 0 2px 0 rgba(255,255,255,0.2)",
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "-0.16px",
          color: "#ffffff",
        }}
      >
        <TextSwap text={ctaPrefix} delay={staggerStart * SWAP_STAGGER_MS} />
      </span>
      <img
        src="/icons/brands/stripe-white.svg"
        alt="Stripe"
        width={48}
        height={20}
        style={{ display: "block", transform: "translateY(0.5px)" }}
      />
    </motion.button>
  );
}

function PaymentLogos() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <img src="/icons/brands/visa.svg" alt="Visa" width={43} height={17} style={{ display: "block" }} />
      <img src="/icons/brands/discover.svg" alt="Discover" width={54} height={9} style={{ display: "block" }} />
      <img src="/icons/brands/mastercard.svg" alt="Mastercard" width={27} height={16} style={{ display: "block" }} />
      <img src="/icons/brands/amex.svg" alt="American Express" width={45} height={12} style={{ display: "block" }} />
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
      <rect x="0" y="8" width="3" height="3" rx="0.6" fill="currentColor" />
      <rect x="4.5" y="6" width="3" height="5" rx="0.6" fill="currentColor" />
      <rect x="9" y="3.5" width="3" height="7.5" rx="0.6" fill="currentColor" />
      <rect x="13.5" y="0.5" width="3" height="10.5" rx="0.6" fill="currentColor" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
      <path d="M8 11a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z" fill="currentColor" />
      <path
        d="M11.86 7.34l1.07-1.07a6.95 6.95 0 0 0-9.86 0l1.07 1.07a5.45 5.45 0 0 1 7.72 0z"
        fill="currentColor"
      />
      <path
        d="M14.62 4.58L15.69 3.5a10.94 10.94 0 0 0-15.38 0L1.38 4.58a9.43 9.43 0 0 1 13.24 0z"
        fill="currentColor"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="13" viewBox="0 0 25 13" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="21"
        height="12"
        rx="3.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        fill="none"
      />
      <rect
        x="22.5"
        y="4"
        width="1.5"
        height="5"
        rx="0.75"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
    </svg>
  );
}
