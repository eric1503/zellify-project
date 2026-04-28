"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Beak SVG — the triangle naturally points DOWN.
 * Rotate 180° when tooltip is below trigger so beak points UP.
 */
function Beak({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="15"
      height="7"
      viewBox="0 0 15 7"
      fill="none"
      style={{
        display: "block",
        transform: flip ? "rotate(180deg)" : undefined,
      }}
    >
      <path d="M7.5 7L0 0H15L7.5 7Z" fill="var(--tooltip-border)" />
      <path d="M7.5 5L1 0H14L7.5 5Z" fill="var(--tooltip-bg)" />
    </svg>
  );
}

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, side = "bottom", sideOffset = 4, children, ...props }, ref) => {
  const beakOnTop = side === "bottom";

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        className={cn("radix-tooltip z-50 select-none", className)}
        style={{ transformOrigin: "var(--radix-tooltip-content-transform-origin)" }}
        {...props}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Beak on top when tooltip is below trigger */}
          {beakOnTop && (
            <div style={{ marginBottom: -2, pointerEvents: "none", position: "relative", zIndex: 1 }}>
              <Beak flip />
            </div>
          )}

          {/* Body */}
          <div
            className="label-text-xs"
            style={{
              position: "relative",
              whiteSpace: "nowrap",
              padding: "4px 8px",
              borderRadius: 8,
              background: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              color: "var(--text-secondary-foreground)",
              boxShadow:
                "0px 2px 4px 0px rgba(0,0,0,0.02), 0px 1px 4px 0px rgba(0,0,0,0.03), 0px 4px 24px 0px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                boxShadow: "inset 0px 1px 1px 0px rgba(255,255,255,0.08)",
                pointerEvents: "none",
              }}
            />
            {children}
          </div>

          {/* Beak on bottom when tooltip is above trigger */}
          {!beakOnTop && (
            <div style={{ marginTop: -2, pointerEvents: "none", position: "relative", zIndex: 1 }}>
              <Beak />
            </div>
          )}
        </div>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

function Tooltip({
  children,
  label,
  side = "bottom",
  delayDuration,
}: {
  children: React.ReactNode;
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </TooltipRoot>
  );
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent, Tooltip };
