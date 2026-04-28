"use client";

import { SliderField } from "./SliderField";

interface SliderWithInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function SliderWithInput({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: SliderWithInputProps) {
  return (
    <div className="flex flex-col gap-1.5 px-4">
      {/* Top row: label on left, value+px on right */}
      <div className="flex items-center justify-between">
        <span className="label-text-2xs text-[var(--text-secondary-foreground)]">
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) =>
              onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))
            }
            className="label-text-2xs w-[34px] h-[22px] px-1 text-center rounded-[var(--radius-md)]
              bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
              text-[var(--text-foreground)] outline-none
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="label-text-3xs text-[var(--text-muted-foreground)]">px</span>
        </div>
      </div>
      <SliderField
        value={value}
        min={min}
        max={max}
        onChange={onChange}
      />
    </div>
  );
}
