"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Icon helper                                                        */
/* ------------------------------------------------------------------ */
function Icon({
  name,
  size = 16,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const prefix = size <= 12 ? "12px-filled" : "18px";
  const file = size <= 12 ? `12-${name}` : `18-${name}`;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: "currentColor",
        maskImage: `url(/icons/${prefix}/${file}.svg)`,
        WebkitMaskImage: `url(/icons/${prefix}/${file}.svg)`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  ScrubRow — drag-to-scrub numeric input                              */
/* ------------------------------------------------------------------ */
interface ScrubRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  onChange: (value: number) => void;
}

function ScrubRow({
  label,
  value,
  min,
  max,
  step = 1,
  precision = 0,
  onChange,
}: ScrubRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(
    (n: number) => Math.max(min, Math.min(max, n)),
    [min, max],
  );

  const snap = useCallback(
    (n: number) => {
      const snapped = Math.round(n / step) * step;
      return Number(snapped.toFixed(precision));
    },
    [step, precision],
  );

  const valueFromX = useCallback(
    (clientX: number) => {
      const rail = trackRef.current;
      if (!rail) return value;
      const rect = rail.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snap(clamp(min + ratio * (max - min)));
    },
    [min, max, value, clamp, snap],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      onChange(valueFromX(e.clientX));
    },
    [onChange, valueFromX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      onChange(valueFromX(e.clientX));
    },
    [isDragging, onChange, valueFromX],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const display = precision > 0 ? value.toFixed(precision) : String(value);

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-dragging={isDragging || undefined}
      className="phone-scrub-row"
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
    >
      <div className="phone-scrub-fill" style={{ width: `${pct}%` }} />
      <span className="phone-scrub-label">{label}</span>
      <span className="phone-scrub-value">{display}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PhoneSettingsPanel                                                  */
/* ------------------------------------------------------------------ */
export interface PhoneSettings {
  scale: number;
  width: number;
  height: number;
  bezelRadius: number;
  bezelPadding: number;
}

interface PhoneSettingsPanelProps {
  settings: PhoneSettings;
  onChange: (next: Partial<PhoneSettings>) => void;
}

function PanelButton({
  children,
  onClick,
  square,
}: {
  children: ReactNode;
  onClick?: () => void;
  square?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="phone-panel-btn"
      data-square={square || undefined}
      type="button"
    >
      {children}
    </button>
  );
}

export function PhoneSettingsPanel({ settings, onChange }: PhoneSettingsPanelProps) {
  const set = <K extends keyof PhoneSettings>(key: K) => (v: PhoneSettings[K]) =>
    onChange({ [key]: v } as Partial<PhoneSettings>);

  return (
    <div className="phone-panel">
      {/* Header */}
      <div className="phone-panel-header">
        <span className="phone-panel-title">Phone</span>
        <button className="phone-panel-icon-btn" type="button" aria-label="Settings">
          <Icon name="sliders-3" size={14} />
        </button>
      </div>

      {/* Toolbar — add / version dropdown / copy */}
      <div className="phone-panel-toolbar">
        <PanelButton square>
          <Icon name="stack-2-plus" size={14} />
        </PanelButton>
        <button className="phone-panel-version" type="button">
          <span className="phone-panel-version-label">Version 1</span>
          <Icon name="chevron-expand-y" size={11} className="phone-panel-version-chev" />
        </button>
        <PanelButton>
          <Icon name="copy" size={14} />
          <span>Copy</span>
        </PanelButton>
      </div>

      {/* Divider */}
      <div className="phone-panel-divider" />

      {/* Scrub rows */}
      <div className="phone-panel-rows">
        <ScrubRow
          label="Scale"
          value={settings.scale}
          min={0.25}
          max={1.5}
          step={0.05}
          precision={2}
          onChange={set("scale")}
        />
        <ScrubRow
          label="Width"
          value={settings.width}
          min={280}
          max={500}
          step={1}
          onChange={set("width")}
        />
        <ScrubRow
          label="Height"
          value={settings.height}
          min={500}
          max={1100}
          step={1}
          onChange={set("height")}
        />
        <ScrubRow
          label="Bezel Radius"
          value={settings.bezelRadius}
          min={0}
          max={80}
          step={1}
          onChange={set("bezelRadius")}
        />
        <ScrubRow
          label="Bezel Padding"
          value={settings.bezelPadding}
          min={0}
          max={24}
          step={1}
          onChange={set("bezelPadding")}
        />
      </div>
    </div>
  );
}
