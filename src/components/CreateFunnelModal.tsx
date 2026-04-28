"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

/* ─────────────────────────────────────────────────────────
 * CreateFunnelModal — step shown after the intro, before the
 * "How do you want to start?" modal. Lets the user pick between
 *   • Start from Scratch
 *   • Start with Template
 *   • Create with AI
 *
 * Each card renders an interactive Lottie animation (LottieLab
 * state machine): idle at frame 0, plays to frame 50 on hover,
 * rewinds back to 0 on unhover. Dark/light variants are swapped
 * via the data-theme attribute.
 * ───────────────────────────────────────────────────────── */

type CardId = "scratch" | "template" | "ai";

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

const CARDS: Array<{
  id: CardId;
  title: string;
  description: string;
  slug: string;
}> = [
  {
    id: "scratch",
    title: "Start from Scratch",
    description:
      "Create a fully custom funnel by adding and arranging your own layout and components",
    slug: "start-from-scratch",
  },
  {
    id: "template",
    title: "Start with Template",
    description:
      "Jump into a ready-made funnel layout with preconfigured steps and components",
    slug: "start-with-template",
  },
  {
    id: "ai",
    title: "Create with AI",
    description:
      "Describe your ideal funnel and let AI build or iterate it for you in seconds",
    slug: "create-with-ai",
  },
];

export function CreateFunnelModal({
  onClose,
  onSelect,
  onNext,
}: {
  onClose?: () => void;
  onSelect?: (id: CardId) => void;
  onNext?: () => void;
}) {
  return (
    <div
      style={{
        width: 940,
        background: "var(--background-modal-bg-modal)",
        border: "1px solid var(--background-modal-border-modal)",
        borderRadius: 12,
        boxShadow:
          "0px 0px 0px 1px rgba(36,38,40,0.11), 0px 8px 16px 0px rgba(36,38,40,0.09)",
        overflow: "hidden",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--background-modal-border-modal)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon
            name="connection-2"
            size={18}
            style={{ color: "var(--icon-primary-foreground)" }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text-foreground)",
              lineHeight: 1,
            }}
          >
            Create Funnel
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            padding: 0,
            borderRadius: 6,
            background: "transparent",
            border: "none",
            color: "var(--text-muted-foreground)",
            cursor: "pointer",
          }}
        >
          <Icon name="xmark" size={18} />
        </button>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          padding: 20,
        }}
      >
        {CARDS.map((card) => (
          <OptionCard
            key={card.id}
            title={card.title}
            description={card.description}
            slug={card.slug}
            onClick={() => {
              onSelect?.(card.id);
              onNext?.();
            }}
          />
        ))}
      </div>

      {/* Pagination dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "4px 20px 20px",
        }}
      >
        <span
          style={{
            width: 20,
            height: 5,
            borderRadius: 999,
            background: "var(--brand-primary, #F86516)",
          }}
        />
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: "var(--button-secondary-border)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Option card — animation + title + description                     */
/* ------------------------------------------------------------------ */
function OptionCard({
  title,
  description,
  slug,
  onClick,
}: {
  title: string;
  description: string;
  slug: string;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: 0,
        background: "var(--background-subtle-bg, var(--button-secondary-bg))",
        border: `1px solid ${
          hover
            ? "var(--button-secondary-border-hover)"
            : "var(--button-secondary-border)"
        }`,
        borderRadius: 12,
        cursor: "pointer",
        overflow: "hidden",
        textAlign: "left",
        transition:
          "border-color 160ms var(--ease-out), transform 160ms var(--ease-out)",
        fontFamily: "inherit",
        color: "inherit",
      }}
    >
      <AnimationArea slug={slug} hover={hover} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "16px 18px 18px",
          background: "var(--background-modal-bg-modal)",
          borderTop: "1px solid var(--background-modal-border-modal)",
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--text-foreground)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            color: "var(--text-muted-foreground)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation area — loads light/dark Lottie and controls playhead     */
/* ------------------------------------------------------------------ */
function AnimationArea({ slug, hover }: { slug: string; hover: boolean }) {
  const theme = useTheme();
  const [data, setData] = useState<object | null>(null);
  const ref = useRef<LottieRefCurrentProps>(null);

  const path = useMemo(
    () => `/animations/funnel-creation/${slug}-${theme}.json`,
    [slug, theme],
  );

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetch(path)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        console.error(`Failed to load animation ${path}:`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  /* Drive the state-machine style playback manually:
     Idle → frame 0 (paused).
     Hover → play from current frame to frame 50 (midpoint).
     Unhover → rewind smoothly back to frame 0. */
  useEffect(() => {
    const lottie = ref.current;
    if (!lottie || !data) return;
    if (hover) {
      lottie.playSegments([0, 50], true);
    } else {
      lottie.playSegments([50, 0], true);
    }
  }, [hover, data]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "474 / 260",
        overflow: "hidden",
      }}
    >
      {data && (
        <Lottie
          lottieRef={ref}
          animationData={data}
          loop={false}
          autoplay={false}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon — mask-image with currentColor                                */
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
