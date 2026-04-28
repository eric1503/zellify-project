"use client";

import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SliderWithInput } from "@/components/ui/SliderWithInput";

interface SpacingSectionProps {
  spacingTop: number;
  spacingBottom: number;
  spacingSide: number;
  spacingInner: number;
  onChange: (key: string, value: number) => void;
}

export function SpacingSection({ spacingTop, spacingBottom, spacingSide, spacingInner, onChange }: SpacingSectionProps) {
  return (
    <SectionWrapper title="Spacing">
      <div className="flex flex-col gap-2">
        <SliderWithInput label="Top" value={spacingTop} min={0} max={80} onChange={(v) => onChange("spacingTop", v)} />
        <SliderWithInput label="Bottom" value={spacingBottom} min={0} max={80} onChange={(v) => onChange("spacingBottom", v)} />
        <SliderWithInput label="Side (Left & Right)" value={spacingSide} min={0} max={60} onChange={(v) => onChange("spacingSide", v)} />
        <SliderWithInput label="Inner" value={spacingInner} min={0} max={40} onChange={(v) => onChange("spacingInner", v)} />
      </div>
    </SectionWrapper>
  );
}
