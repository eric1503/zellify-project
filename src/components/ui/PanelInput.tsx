"use client";

interface PanelInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function PanelInput({ value, onChange, placeholder }: PanelInputProps) {
  return (
    <div
      className="flex items-center gap-2 h-9 px-2.5
        bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
        rounded-[8px]"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="label-text-sm flex-1 min-w-0 bg-transparent border-none outline-none
          text-[var(--text-foreground)] tracking-[-0.07px]
          placeholder:text-[var(--text-muted-foreground)]"
      />
    </div>
  );
}
