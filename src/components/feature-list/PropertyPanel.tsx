"use client";

import type { FeatureListState } from "./types";
import { HeaderBar } from "./panel-sections/HeaderBar";
import { LabelSection } from "./panel-sections/LabelSection";
import { FieldsSection } from "./panel-sections/FieldsSection";
import { ConfigurationSection } from "./panel-sections/ConfigurationSection";
import { ListsSection } from "./panel-sections/ListsSection";
import { SpacingSection } from "./panel-sections/SpacingSection";
import { FontSection } from "./panel-sections/FontSection";
import { createListItem } from "./constants";

interface PropertyPanelProps {
  state: FeatureListState;
  update: <K extends keyof FeatureListState>(key: K, value: FeatureListState[K]) => void;
}

export function PropertyPanel({ state, update }: PropertyPanelProps) {
  const addItem = () => {
    update("items", [...state.items, createListItem(`Feature ${state.items.length + 1}`)]);
  };

  const removeItem = (id: string) => {
    update("items", state.items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, label: string) => {
    update("items", state.items.map((i) => (i.id === id ? { ...i, label } : i)));
  };

  return (
    <div className="property-panel">
      {/* Header + divider */}
      <div className="property-panel-header">
        <HeaderBar />
        <div style={{ height: 1, background: 'var(--divider-primary)' }} />
      </div>

      {/* Scrollable sections */}
      <div className="property-panel-scroll">
        <LabelSection
          componentId={state.componentId}
          showComponentId={state.showComponentId}
          onChangeId={(v) => update("componentId", v)}
        />
        <FieldsSection
          headerText={state.headerText}
          showHeader={state.showHeader}
          subheadText={state.subheadText}
          showSubhead={state.showSubhead}
          onToggleHeader={(v) => update("showHeader", v)}
          onChangeHeader={(v) => update("headerText", v)}
          onToggleSubhead={(v) => update("showSubhead", v)}
          onChangeSubhead={(v) => update("subheadText", v)}
        />
        <ConfigurationSection
          customPositioning={state.customPositioning}
          positioning={state.positioning}
          enableIcons={state.enableIcons}
          iconContainerEnabled={state.iconContainerEnabled}
          showListDescription={state.showListDescription}
          onTogglePositioning={(v) => update("customPositioning", v)}
          onChangePositioning={(v) => update("positioning", v)}
          onToggleIcons={(v) => update("enableIcons", v)}
          onToggleContainer={(v) => update("iconContainerEnabled", v)}
          onToggleDescription={(v) => update("showListDescription", v)}
        />
        <ListsSection
          items={state.items}
          iconType={state.iconType}
          showListDescription={state.showListDescription}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />
        <SpacingSection
          spacingTop={state.spacingTop}
          spacingBottom={state.spacingBottom}
          spacingSide={state.spacingSide}
          spacingInner={state.spacingInner}
          onChange={(k, v) => update(k as keyof FeatureListState, v as never)}
        />
        <FontSection
          headerFontSize={state.headerFontSize}
          subheadFontSize={state.subheadFontSize}
          listTextFontSize={state.listTextFontSize}
          headerFontWeight={state.headerFontWeight}
          subheadFontWeight={state.subheadFontWeight}
          listTextFontWeight={state.listTextFontWeight}
          fontColorEnabled={state.fontColorEnabled}
          headerColor={state.headerColor}
          subheadColor={state.subheadColor}
          iconColor={state.iconColor}
          iconContainerColor={state.iconContainerColor}
          listTextColor={state.listTextColor}
          onChange={(k, v) => update(k as keyof FeatureListState, v as never)}
        />
      </div>
    </div>
  );
}
