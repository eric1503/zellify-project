"use client";

import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ToggleField } from "@/components/ui/ToggleField";
import { InputField } from "@/components/ui/InputField";

interface FieldsSectionProps {
  headerText: string;
  showHeader: boolean;
  subheadText: string;
  showSubhead: boolean;
  onToggleHeader: (show: boolean) => void;
  onChangeHeader: (text: string) => void;
  onToggleSubhead: (show: boolean) => void;
  onChangeSubhead: (text: string) => void;
}

export function FieldsSection({
  headerText, showHeader, subheadText, showSubhead,
  onToggleHeader, onChangeHeader, onToggleSubhead, onChangeSubhead,
}: FieldsSectionProps) {
  return (
    <SectionWrapper title="Fields">
      <div className="flex flex-col gap-4 px-4">
        <ToggleField label="Header" checked={showHeader} onChange={onToggleHeader}>
          <InputField value={headerText} onChange={onChangeHeader} />
        </ToggleField>
        <ToggleField label="Subhead" checked={showSubhead} onChange={onToggleSubhead}>
          <InputField value={subheadText} onChange={onChangeSubhead} />
        </ToggleField>
      </div>
    </SectionWrapper>
  );
}
