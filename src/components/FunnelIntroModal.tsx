"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
 * FunnelIntroModal — welcome screen shown before the
 * FunnelStartModal. Two outcomes:
 *
 *   • "Maybe later"          → onDismiss()
 *   • "Setup first funnel"   → onSetup()   (parent transitions to main modal)
 * ───────────────────────────────────────────────────────── */

/* Raw RGB components of the modal bg per theme — lets us build
   `rgba(r,g,b,alpha)` gradient stops where only the alpha changes.
   Keeps the gradient from passing through dirty gray midpoints. */
const MODAL_BG_RGB = {
  light: "255, 255, 255",
  dark:  "18, 20, 23",
} as const;

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

export function FunnelIntroModal({
  onSetup,
  onDismiss,
}: {
  onSetup?: () => void;
  onDismiss?: () => void;
}) {
  const theme = useTheme();
  const suffix = theme === "dark" ? "-dark" : "";

  return (
    <div
      style={{
        width: 467,
        background: "var(--background-modal-bg-modal)",
        border: "1px solid var(--background-modal-border-modal)",
        borderRadius: 12,
        boxShadow:
          "0px 0px 0px 1px rgba(36,38,40,0.11), 0px 8px 16px 0px rgba(36,38,40,0.09)",
        overflow: "hidden",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      {/* Hero + content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 24px 20px",
          borderBottom: "1px solid var(--background-modal-border-modal)",
          // Clip the Z hero + its orange drop-shadow so it can't bleed
          // past the divider into the footer (the image is 518px tall
          // positioned with top:-120.5, so it overflows by ~180px below).
          overflow: "hidden",
        }}
      >
        {/* Dither pattern band behind the hero — matches the option card pattern */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            overflow: "hidden",
            pointerEvents: "none",
            opacity: 0.45,
            maskImage:
              "linear-gradient(to bottom, black 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 55%, transparent 100%)",
          }}
        >
          <Image
            src={`/illustrations/funnel-start/hover-pattern${suffix}.png`}
            alt=""
            width={1956}
            height={246}
            unoptimized
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </div>

        {/* Hero visual — 3D Z logo.
            The PNG itself has a near-black backdrop baked in. We composite
            it with `mix-blend-mode: multiply` (light theme) so the dark
            regions fall through to the card's white background, leaving
            only the illuminated logo. The soft orange `drop-shadow` stack
            recreates the Figma glow that makes it feel like the logo is
            emitting light onto the card below. */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 219,
            marginTop: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "calc(50% + 3.5px)",
              top: -120.5,
              transform: "translateX(-50%)",
              width: 518,
              height: 518,
              opacity: 0.95,
              mixBlendMode: theme === "dark" ? "lighten" : "multiply",
              // Bloom: soft orange glow that bleeds onto the card background
              filter:
                "drop-shadow(-3.5px 9.8px 23px rgba(248,101,22,0.36)) drop-shadow(-14.1px 39.3px 42px rgba(248,101,22,0.31)) drop-shadow(-31.8px 88.8px 56.6px rgba(248,101,22,0.18))",
            }}
          >
            <Image
              src="/illustrations/funnel-intro/hero.png"
              alt=""
              width={518}
              height={518}
              unoptimized
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Fade mask — gradient from transparent (top, hero visible) to
            solid modal bg (bottom, title + description sit on solid surface).
            Matched RGB stops (alpha-only interpolation) so the gradient never
            passes through a muddy gray midpoint in either theme. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 1,
            background: `linear-gradient(
              to bottom,
              rgba(${MODAL_BG_RGB[theme]}, 0) 0%,
              rgba(${MODAL_BG_RGB[theme]}, 0) 35%,
              rgba(${MODAL_BG_RGB[theme]}, 0.85) 58%,
              rgba(${MODAL_BG_RGB[theme]}, 1) 72%
            )`,
          }}
        />

        {/* Floating connection circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--button-secondary-bg)",
            border: "0.783px solid var(--button-secondary-border)",
            boxShadow:
              "0px 0.78px 1.57px 0px rgba(0,0,0,0.07), 0px 1.57px 3.13px 0px rgba(0,0,0,0.07), 0px 12.5px 25px 0px rgba(0,0,0,0.07), 0px 25px 50px 0px rgba(0,0,0,0.07)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              width: 18,
              height: 18,
              color: "var(--icon-primary-foreground)",
            }}
          >
            <Icon name="connection-2" size={18} />
          </span>
        </div>

        {/* Title + description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            textAlign: "center",
            width: "100%",
            maxWidth: 353,
            position: "relative",
            zIndex: 2,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-aspekta-loaded), sans-serif",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text-foreground)",
              lineHeight: 1,
            }}
          >
            Let&apos;s Create Your First Funnel
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-aspekta-loaded), sans-serif",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--text-secondary-foreground)",
              lineHeight: 1.6,
            }}
          >
            We&apos;ll guide you through building your first funnel with
            Zellify. It takes about 2 minutes to setup
          </p>
        </div>
      </div>

      {/* Footer — two buttons, flex-1 each */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "stretch",
          gap: 10,
          height: 60,
          padding: "14px 16px",
        }}
      >
        <SecondaryButton onClick={onDismiss}>Maybe later</SecondaryButton>
        <PrimaryButton onClick={onSetup} icon="connection-2">
          Setup first funnel
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon — mask-image with currentColor (matches FunnelStartModal)     */
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
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */
function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: "1 1 0",
        height: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        background: hover
          ? "var(--button-secondary-bg-hover)"
          : "var(--button-secondary-bg)",
        border: `1px solid ${hover ? "var(--button-secondary-border-hover)" : "var(--button-secondary-border)"}`,
        boxShadow:
          "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
        color: "var(--text-secondary-foreground)",
        cursor: "pointer",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition:
          "background 160ms var(--ease-out), border-color 160ms var(--ease-out)",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        flex: "1 1 0",
        height: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 8,
        background: hover
          ? "var(--button-primary-bg-hover)"
          : "var(--button-primary-bg)",
        border: "1px solid var(--button-primary-border)",
        boxShadow:
          "0px 1px 1px 0.05px rgba(24,24,27,0.24), inset 0px 8px 16px 0px rgba(255,255,255,0.16), inset 0px 2px 0px 0px rgba(255,255,255,0.2)",
        color: "var(--text-full-white)",
        cursor: "pointer",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1,
        transition: "background 160ms var(--ease-out)",
      }}
    >
      {icon && <Icon name={icon} size={18} style={{ width: 16, height: 16 }} />}
      <span>{children}</span>
    </button>
  );
}
