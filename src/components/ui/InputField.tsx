"use client";

import { useState, useRef, useCallback } from "react";

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function InputField({ value, onChange, placeholder }: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFilled = value.length > 0;

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div
      className="input-field-wrapper"
      data-focused={isFocused || undefined}
      data-hovered={isHovered || undefined}
      data-filled={isFilled || undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="label-text-sm flex-1 min-w-0 bg-transparent border-none outline-none
          text-[var(--text-foreground)] tracking-[-0.07px]
          placeholder:text-[var(--text-muted-foreground)]"
      />
    </div>
  );
}
