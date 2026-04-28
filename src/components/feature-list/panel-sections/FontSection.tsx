"use client";

import { Palette } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SliderWithInput } from "@/components/ui/SliderWithInput";
import { FontWeightSelect } from "@/components/ui/FontWeightSelect";
import { ColorPickerSwatch } from "@/components/ui/ColorPickerSwatch";
import type { FontWeight } from "@/components/ui/types";

interface FontSectionProps {
  headerFontSize: number;
  subheadFontSize: number;
  listTextFontSize: number;
  headerFontWeight: FontWeight;
  subheadFontWeight: FontWeight;
  listTextFontWeight: FontWeight;
  fontColorEnabled: boolean;
  headerColor: string;
  subheadColor: string;
  iconColor: string;
  iconContainerColor: string;
  listTextColor: string;
  onChange: (key: string, value: string | number | boolean) => void;
}

const WEIGHT_ROWS = [
  { label: "Header", key: "headerFontWeight" },
  { label: "Subhead", key: "subheadFontWeight" },
  { label: "List Text Size", key: "listTextFontWeight" },
] as const;

const COLOR_FIELDS = [
  { label: "Header", key: "headerColor" },
  { label: "Subhead", key: "subheadColor" },
  { label: "Icon", key: "iconColor" },
  { label: "Icon Container", key: "iconContainerColor" },
  { label: "List Text", key: "listTextColor" },
] as const;

export function FontSection({
  headerFontSize, subheadFontSize, listTextFontSize,
  headerFontWeight, subheadFontWeight, listTextFontWeight,
  fontColorEnabled, headerColor, subheadColor, iconColor, iconContainerColor, listTextColor,
  onChange,
}: FontSectionProps) {
  const colorMap: Record<string, string> = { headerColor, subheadColor, iconColor, iconContainerColor, listTextColor };
  const weightMap: Record<string, FontWeight> = { headerFontWeight, subheadFontWeight, listTextFontWeight };

  return (
    <SectionWrapper title="Font">
      <div className="flex flex-col gap-2">
        {/* Font Sizes */}
        <SliderWithInput label="Header" value={headerFontSize} min={10} max={48} onChange={(v) => onChange("headerFontSize", v)} />
        <SliderWithInput label="Subhead" value={subheadFontSize} min={10} max={32} onChange={(v) => onChange("subheadFontSize", v)} />
        <SliderWithInput label="List Text Size" value={listTextFontSize} min={10} max={28} onChange={(v) => onChange("listTextFontSize", v)} />

        {/* Divider */}
        <div className="mx-4 h-0 my-1" style={{ borderTop: "1px dashed var(--divider-primary)" }} />

        {/* Font Weight */}
        <div className="flex flex-col gap-2 px-4">
          <span className="label-text-2xs text-[var(--text-secondary-foreground)]">Font Weight</span>
          <div className="flex flex-col gap-1.5">
            {WEIGHT_ROWS.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between h-[36px] px-2.5
                  bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
                  rounded-[var(--radius-xl)]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="label-text-2xs text-[var(--text-muted-foreground)]">T</span>
                  <span className="label-text-2xs text-[var(--text-secondary-foreground)]">{row.label}</span>
                </div>
                <FontWeightSelect value={weightMap[row.key]} onChange={(v) => onChange(row.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-0 my-1" style={{ borderTop: "1px dashed var(--divider-primary)" }} />

        {/* Font Color */}
        <div className="flex flex-col gap-2 px-4">
          <span className="label-text-2xs text-[var(--text-secondary-foreground)]">Font Color</span>
          <div className="flex flex-col gap-1.5">
            {COLOR_FIELDS.map(({ label, key }) => (
              <div
                key={key}
                className="flex items-center justify-between h-[36px] px-2.5
                  bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]
                  rounded-[var(--radius-xl)]"
              >
                <div className="flex items-center gap-1.5">
                  <Palette size={12} className="text-[var(--icon-muted-foreground)]" />
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: colorMap[key] }}
                  />
                  <span className="label-text-2xs text-[var(--text-secondary-foreground)]">{label}</span>
                </div>
                <ColorPickerSwatch color={colorMap[key]} onChange={(v) => onChange(key, v)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
