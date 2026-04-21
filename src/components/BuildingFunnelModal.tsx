"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Script from "next/script";

/* ------------------------------------------------------------------ */
/*  TypeScript: declare lord-icon custom element                       */
/* ------------------------------------------------------------------ */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        trigger?: string;
        state?: string;
        colors?: string;
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Load Unicorn Studio SDK via script tag (UMD, not ES module)        */
/* ------------------------------------------------------------------ */
declare global {
  interface Window {
    UnicornStudio?: {
      addScene: (opts: Record<string, unknown>) => Promise<{ destroy: () => void }>;
      destroy: () => void;
    };
  }
}

function loadUnicornSDK(): Promise<NonNullable<Window["UnicornStudio"]>> {
  if (window.UnicornStudio) return Promise.resolve(window.UnicornStudio);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/unicornStudio.umd.js";
    script.onload = () => {
      if (window.UnicornStudio) resolve(window.UnicornStudio);
      else reject(new Error("UnicornStudio not found on window after load"));
    };
    script.onerror = () => reject(new Error("Failed to load UnicornStudio SDK"));
    document.head.appendChild(script);
  });
}

/* ------------------------------------------------------------------ */
/*  Unicorn Studio scene hook                                          */
/* ------------------------------------------------------------------ */
function useUnicornScene(containerRef: React.RefObject<HTMLDivElement | null>) {
  const sceneRef = useRef<{ destroy: () => void } | null>(null);

  const init = useCallback(async () => {
    if (!containerRef.current || sceneRef.current) return;

    try {
      const US = await loadUnicornSDK();
      const scene = await US.addScene({
        elementId: containerRef.current.id,
        fps: 60,
        scale: 1,
        dpi: 1.5,
        filePath: "/light-loader-zell.json",
        interactivity: { mouse: { disabled: true, disableMobile: true } },
      });
      sceneRef.current = scene;
    } catch (err) {
      console.error("Unicorn Studio init error:", err);
    }
  }, [containerRef]);

  const destroy = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.destroy();
      sceneRef.current = null;
    }
  }, []);

  return { init, destroy };
}

/* ------------------------------------------------------------------ */
/*  BuildingFunnelModal                                                */
/* ------------------------------------------------------------------ */
export function BuildingFunnelModal({
  open,
  onOpenChange,
  iconSize = 750,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iconSize?: number;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { init, destroy } = useUnicornScene(canvasRef);

  useEffect(() => {
    if (open) {
      const t = setTimeout(init, 100);
      return () => clearTimeout(t);
    } else {
      destroy();
    }
  }, [open, init, destroy]);

  return (
    <>
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="lazyOnload" />

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>

          {/* Content */}
          <Dialog.Content
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              width: 474,
              background: "var(--background-modal-bg-modal)",
              border: "1px solid var(--background-modal-border-modal)",
              borderRadius: 12,
              boxShadow:
                "0px 0px 0px 1px rgba(0,0,0,0.05), 0px 2px 4px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.06), 0px 32px 64px rgba(0,0,0,0.06)",
              overflow: "hidden",
              outline: "none",
              animation: "modalSlideIn 300ms var(--ease-out)",
            }}
          >
            {/* Top section with animation + content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                  paddingBottom: 28,
              }}
            >
              {/* Unicorn Studio animation */}
              <div style={{ position: "relative", width: "100%", height: 221 }}>
                <div
                  id="unicorn-building-funnel"
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>

              {/* Icon + Text + Button */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 20px",
                  marginTop: -38,
                  position: "relative",
                }}
              >
                {/* Circle icon */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--button-secondary-bg)",
                      border: "0.783px solid var(--button-secondary-border)",
                      boxShadow:
                        "0px 0.783px 1.565px 0px rgba(0,0,0,0.07), 0px 1.565px 3.13px 0px rgba(0,0,0,0.07), 0px 12.522px 25.043px 0px rgba(0,0,0,0.07), 0px 25.043px 50.087px 0px rgba(0,0,0,0.07)",
                      overflow: "hidden",
                    }}
                  >
                    <lord-icon
                      src="https://cdn.lordicon.com/qjhfyrmt.json"
                      trigger="loop"
                      state="loop-center"
                      colors="primary:#f3533f"
                      style={{ width: iconSize, height: iconSize }}
                    />
                  </div>

                  {/* Text */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      width: 342,
                      textAlign: "center",
                    }}
                  >
                    <Dialog.Title
                      className="label-text-xl"
                      style={{
                        color: "var(--text-foreground)",
                        letterSpacing: "-0.2px",
                        margin: 0,
                      }}
                    >
                      Building Your Funnel
                    </Dialog.Title>
                    <Dialog.Description
                      className="body-text-base"
                      style={{
                        color: "var(--text-secondary-foreground)",
                        lineHeight: 1.6,
                        letterSpacing: "-0.16px",
                        margin: 0,
                      }}
                    >
                      Our AI is crafting your funnel based on your inputs. This
                      may take a few moments
                    </Dialog.Description>
                  </div>
                </div>

                {/* Tertiary button */}
                <button
                  onClick={() => onOpenChange(false)}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 8,
                    background: "var(--button-tertiary-bg)",
                    border: "1px solid var(--button-tertiary-border)",
                    boxShadow:
                      "0px 1px 2px -1px rgba(36,38,40,0.1), 0px 1px 1px 0px rgba(36,38,40,0.04)",
                    color: "var(--icon-secondary-foreground)",
                    cursor: "pointer",
                    transition:
                      "background 160ms var(--ease-out), border-color 160ms var(--ease-out)",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.07px",
                    lineHeight: "normal",
                    fontFamily: "var(--font-aspekta-loaded), sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--button-tertiary-bg-hover)";
                    e.currentTarget.style.borderColor =
                      "var(--button-tertiary-border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--button-tertiary-bg)";
                    e.currentTarget.style.borderColor =
                      "var(--button-tertiary-border)";
                  }}
                >
                  Wait and close this modal
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
