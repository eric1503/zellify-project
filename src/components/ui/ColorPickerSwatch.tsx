"use client";

import { useState, useRef, useEffect } from "react";

interface ColorPickerSwatchProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPickerSwatch({ color, onChange }: ColorPickerSwatchProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fl-color-swatch"
        style={{ background: color }}
        aria-label="Pick color"
      />
      {open && (
        <div
          className="absolute top-8 right-0 z-10 flex flex-col gap-2 p-3
          bg-[var(--background-bg-panel)] border border-[var(--background-border-panel)]
          rounded-[var(--radius-xl)] shadow-menu-dropdown animate-popover-in"
          style={{ transformOrigin: "top right" }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-[120px] h-20 border-none cursor-pointer p-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value);
            }}
            className="label-text-2xs w-[120px] px-2 py-1 rounded-[var(--radius-md)]
              bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
              text-[var(--text-foreground)] outline-none"
          />
        </div>
      )}
    </div>
  );
}
