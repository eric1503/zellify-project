"use client";

import { AIBlockMenu } from "@/components/AIBlockMenu";

export default function AIMenuPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "96px 24px",
        background: "var(--page-background)",
        fontFamily: "var(--font-aspekta-loaded), sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <AIBlockMenu />
      </div>
    </div>
  );
}
