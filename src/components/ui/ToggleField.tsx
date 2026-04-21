"use client";

import * as Switch from "@radix-ui/react-switch";

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

export function ToggleField({ label, checked, onChange, children }: ToggleFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label-text-xs text-[var(--text-secondary-foreground)] whitespace-nowrap">
          {label}
        </span>
        <Switch.Root
          checked={checked}
          onCheckedChange={onChange}
          className="fl-switch"
        >
          <Switch.Thumb className="fl-switch-thumb" />
        </Switch.Root>
      </div>
      {checked && children}
    </div>
  );
}
