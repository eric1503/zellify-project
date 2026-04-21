"use client";

import { useState, useRef, useCallback } from "react";

interface SliderFieldProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function SliderField({
  value,
  min = 0,
  max = 100,
  onChange,
}: SliderFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const getValueFromEvent = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + ratio * (max - min));
    },
    [min, max, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onChange(getValueFromEvent(e.clientX));
    },
    [getValueFromEvent, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onChange(getValueFromEvent(e.clientX));
    },
    [isDragging, getValueFromEvent, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="slider-field"
      data-dragging={isDragging || undefined}
      data-hovered={isHovered || undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={trackRef}
    >
      <div className="slider-field-track" />
      <div className="slider-field-progress" style={{ width: `${percent}%` }} />
      <div className="slider-field-handle" style={{ left: `${percent}%` }}>
        <div className="slider-field-handle-dot" />
      </div>
    </div>
  );
}
