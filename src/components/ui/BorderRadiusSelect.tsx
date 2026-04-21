"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import type { BorderRadius } from "./types";

interface BorderRadiusSelectProps {
  value: BorderRadius;
  onChange: (value: BorderRadius) => void;
}

const OPTIONS: { value: BorderRadius; label: string }[] = [
  { value: "default", label: "Default (6px)" },
  { value: "sm", label: "Small (4px)" },
  { value: "md", label: "Medium (8px)" },
  { value: "lg", label: "Large (12px)" },
  { value: "xl", label: "XL (16px)" },
  { value: "full", label: "Full (pill)" },
];

export function BorderRadiusSelect({ value, onChange }: BorderRadiusSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as BorderRadius)}>
      <Select.Trigger
        className="label-text-2xs flex items-center justify-between px-2 py-1.5
          rounded-[var(--radius-md)] cursor-pointer outline-none
          bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
          text-[var(--text-foreground)]"
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={12} className="opacity-50" />
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
            {OPTIONS.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="label-text-2xs px-2 py-1.5 rounded-[var(--radius-md)] cursor-pointer outline-none
                  text-[var(--text-foreground)]
                  data-[highlighted]:bg-[var(--menu-list-hover)]
                  transition-colors duration-100"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
