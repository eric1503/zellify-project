"use client";

import { BuildingFunnelModal } from "@/components/BuildingFunnelModal";

export default function BuildingFunnelDemo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F7F7",
      }}
    >
      <BuildingFunnelModal open={true} onOpenChange={() => {}} iconSize={18} />
    </div>
  );
}
