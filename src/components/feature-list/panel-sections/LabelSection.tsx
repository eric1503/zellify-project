"use client";

import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { InputField } from "@/components/ui/InputField";

interface LabelSectionProps {
  componentId: string;
  showComponentId: boolean;
  onChangeId: (id: string) => void;
}

export function LabelSection({ componentId, onChangeId }: LabelSectionProps) {
  return (
    <SectionWrapper title="Label">
      <div className="flex flex-col gap-2 px-4">
        <div className="flex items-center justify-between">
          <span className="label-text-xs text-[var(--text-secondary-foreground)]">
            Component ID
          </span>
        </div>
        <InputField
          value={componentId}
          onChange={onChangeId}
          placeholder="component_id"
        />
      </div>
    </SectionWrapper>
  );
}
