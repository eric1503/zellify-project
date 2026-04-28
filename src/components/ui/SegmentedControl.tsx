"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  iconOnly?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  iconOnly,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeIndex = options.findIndex((o) => o.value === value);
    if (activeIndex === -1) return;
    // +1 to skip the indicator div itself
    const btn = container.children[activeIndex + 1] as HTMLElement;
    if (!btn) return;
    setIndicator({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
    });
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className="fl-segment-group"
      data-icon-only={iconOnly || undefined}
      role="radiogroup"
    >
      {/* Sliding indicator (always rendered so children indexing stays stable) */}
      <div
        className="fl-segment-indicator"
        style={{
          left: indicator?.left ?? 0,
          width: indicator?.width ?? 0,
          opacity: indicator ? 1 : 0,
        }}
      />

      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-active={isActive}
            onClick={() => onChange(opt.value)}
            className="fl-segment-btn"
          >
            {opt.icon && <span className="fl-segment-icon">{opt.icon}</span>}
            {opt.label && (
              <span className="label-text-sm" style={{ whiteSpace: "nowrap" }}>
                {opt.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
