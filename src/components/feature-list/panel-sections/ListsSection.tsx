"use client";

import { Check, Circle, Square, Diamond, Hexagon, Plus, Trash2 } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import type { ListItem, IconType } from "../types";

interface ListsSectionProps {
  items: ListItem[];
  iconType: IconType;
  showListDescription: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, label: string) => void;
}

const ITEM_ICONS = [Check, Circle, Square, Diamond, Hexagon];

export function ListsSection({ items, iconType, showListDescription, onAddItem, onRemoveItem, onUpdateItem }: ListsSectionProps) {
  return (
    <SectionWrapper
      title="Lists"
      action={
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center justify-center w-5 h-5 rounded-[var(--radius-md)] cursor-pointer
            bg-transparent border-none text-[var(--icon-muted-foreground)]
            hover:text-[var(--icon-foreground)] transition-colors"
          aria-label="Add item"
        >
          <Plus size={14} />
        </button>
      }
    >
      <div className="flex flex-col gap-2.5 px-4">
        {/* List items */}
        <div className="flex flex-col gap-1.5">
          {items.map((item, idx) => {
            const Icon = ITEM_ICONS[idx % ITEM_ICONS.length];
            return (
              <div
                key={item.id}
                className="flex flex-col rounded-[var(--radius-xl)] overflow-hidden
                  bg-[var(--input-field-primary-bg)] border border-[var(--input-field-primary-border)]"
              >
                {/* Item row */}
                <div className="flex items-center gap-2 h-[36px] px-2.5">
                  <div className="w-5 h-5 rounded-[var(--radius-md)] flex items-center justify-center shrink-0
                    bg-[var(--icon-container-bg)] border border-[var(--icon-container-border)]">
                    <Icon size={10} className="text-[var(--icon-secondary-foreground)]" />
                  </div>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => onUpdateItem(item.id, e.target.value)}
                    className="label-text-2xs flex-1 min-w-0 bg-transparent border-none outline-none
                      text-[var(--text-foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="shrink-0 flex items-center justify-center cursor-pointer
                      bg-transparent border-none text-[var(--icon-muted-foreground)]
                      hover:text-[var(--status-error-fg)] transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {/* Description */}
                {showListDescription && (
                  <div className="px-2.5 pb-2">
                    <p className="body-text-3xs text-[var(--text-muted-foreground)] pl-7">
                      {idx % 2 === 0 ? "{This is description}" : "{This is description, but expanded into two-lined paragraph}"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add list button */}
        <button
          type="button"
          onClick={onAddItem}
          className="label-text-2xs py-2 rounded-[var(--radius-xl)] cursor-pointer
            bg-transparent border border-dashed border-[var(--divider-primary)]
            text-[var(--text-muted-foreground)]
            hover:border-[var(--divider-secondary)] transition-colors"
        >
          + Add list
        </button>
      </div>
    </SectionWrapper>
  );
}
