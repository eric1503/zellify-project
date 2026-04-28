"use client";

import { AlignCenter, ChevronDown } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ToggleField } from "@/components/ui/ToggleField";
import type { Positioning } from "../types";

interface ConfigurationSectionProps {
  customPositioning: boolean;
  positioning: Positioning;
  enableIcons: boolean;
  iconContainerEnabled: boolean;
  showListDescription: boolean;
  onTogglePositioning: (custom: boolean) => void;
  onChangePositioning: (pos: Positioning) => void;
  onToggleIcons: (enabled: boolean) => void;
  onToggleContainer: (enabled: boolean) => void;
  onToggleDescription: (show: boolean) => void;
}

const POSITION_LABELS: Record<Positioning, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export function ConfigurationSection({
  customPositioning, positioning, enableIcons, iconContainerEnabled,
  showListDescription, onTogglePositioning, onChangePositioning,
  onToggleIcons, onToggleContainer, onToggleDescription,
}: ConfigurationSectionProps) {
  return (
    <SectionWrapper title="Configuration">
      <div className="flex flex-col gap-3">
        {/* Custom Positioning */}
        <div className="px-4">
          <ToggleField label="Custom Positioning" checked={customPositioning} onChange={onTogglePositioning}>
            <div
              className="flex items-center justify-between h-[36px] px-2.5
                bg-[var(--button-secondary-bg)] border border-[var(--button-secondary-border)]
                rounded-[var(--radius-xl)] shadow-button-secondary cursor-pointer"
              onClick={() => {
                const positions: Positioning[] = ["left", "center", "right"];
                const idx = positions.indexOf(positioning);
                onChangePositioning(positions[(idx + 1) % 3]);
              }}
            >
              <div className="flex items-center gap-1.5">
                <AlignCenter size={14} className="text-[var(--icon-secondary-foreground)]" />
                <span className="label-text-2xs text-[var(--text-foreground)]">
                  {POSITION_LABELS[positioning]}
                </span>
              </div>
              <ChevronDown size={12} className="text-[var(--icon-muted-foreground)]" />
            </div>
          </ToggleField>
        </div>

        {/* Enable Icons */}
        <div className="px-4">
          <ToggleField label="Enable Icons" checked={enableIcons} onChange={onToggleIcons} />
        </div>

        {/* Icon container — sub-toggle with tree-line indent */}
        {enableIcons && (
          <div className="flex gap-0 px-4">
            {/* Tree-line connector */}
            <div className="fl-tree-line" />
            <div className="flex-1 min-w-0">
              <ToggleField label="Icon container" checked={iconContainerEnabled} onChange={onToggleContainer} />
            </div>
          </div>
        )}

        {/* List Description */}
        <div className="px-4">
          <ToggleField label="List Description" checked={showListDescription} onChange={onToggleDescription} />
        </div>
      </div>
    </SectionWrapper>
  );
}
