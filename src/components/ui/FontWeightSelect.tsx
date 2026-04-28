"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import type { FontWeight } from "./types";

interface FontWeightSelectProps {
  value: FontWeight;
  onChange: (value: FontWeight) => void;
}

const WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

export function FontWeightSelect({ value, onChange }: FontWeightSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as FontWeight)}>
      <Select.Trigger
        className="label-text-2xs flex items-center gap-1 cursor-pointer outline-none
          bg-transparent border-none text-[var(--text-muted-foreground)]"
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={10} className="opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="rounded-[var(--radius-lg)] p-1 z-50 shadow-menu-dropdown
            bg-[var(--menu-bg)] border border-[var(--menu-border)] animate-popover-in"
          style={{ transformOrigin: "var(--radix-select-content-transform-origin, top)" }}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport>
            {WEIGHTS.map((w) => (
              <Select.Item
                key={w.value}
                value={w.value}
                className="label-text-2xs px-2.5 py-1.5 rounded-[var(--radius-md)] cursor-pointer outline-none
                  text-[var(--text-foreground)]
                  data-[highlighted]:bg-[var(--menu-list-hover)]
                  transition-colors duration-100"
                style={{ fontWeight: Number(w.value) }}
              >
                <Select.ItemText>{w.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
