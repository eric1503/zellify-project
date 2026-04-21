interface SectionWrapperProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionWrapper({ title, action, children }: SectionWrapperProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Section header: label + dashed line + optional action */}
      <div className="flex items-center gap-2 px-4">
        <span className="label-text-3xs text-[var(--text-muted-foreground)] tracking-[0.3px] whitespace-nowrap uppercase">
          {title}
        </span>
        <div
          className="flex-1 h-0"
          style={{ borderTop: "1px dashed var(--divider-primary)" }}
        />
        {action}
      </div>
      {children}
    </div>
  );
}
