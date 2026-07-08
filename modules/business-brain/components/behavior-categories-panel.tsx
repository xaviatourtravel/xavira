"use client";

import { Plus } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { BusinessBrainCompactSection } from "@/modules/business-brain/components/business-brain-content-shell";
import { ExpandableList } from "@/modules/business-brain/components/expandable-list";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  BB_COMPACT_LIST_IDLE_CLASS,
  BB_COMPACT_LIST_SELECTED_CLASS,
} from "@/modules/business-brain/lib/business-brain-compact-styles";
import {
  bbBehaviorTypeDescription,
  bbBehaviorTypeLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  BRAIN_BEHAVIOR_TYPES,
  CONFIG_BEHAVIOR_TYPES,
  type BrainBehaviorRecord,
  type BrainBehaviorType,
} from "@/modules/business-brain/types/behaviors";
import { cn } from "@/lib/utils";

type BehaviorCategoriesPanelProps = {
  behaviors: BrainBehaviorRecord[];
  activeCategory: BrainBehaviorType;
  selectedBehaviorId: string | null;
  canEdit: boolean;
  isCreating: boolean;
  onCategoryChange: (category: BrainBehaviorType) => void;
  onSelectBehavior: (behaviorId: string) => void;
  onCreateRule: () => void;
};

function isConfigCategory(type: BrainBehaviorType) {
  return type === "REPLY_STYLE" || type === "QUALIFICATION_RULE";
}

export function BehaviorCategoriesPanel({
  behaviors,
  activeCategory,
  selectedBehaviorId,
  canEdit,
  isCreating,
  onCategoryChange,
  onSelectBehavior,
  onCreateRule,
}: BehaviorCategoriesPanelProps) {
  const { bb } = useBbTranslation();
  const categoryBehaviors = behaviors.filter((item) => item.type === activeCategory);
  const showRuleList = !isConfigCategory(activeCategory);

  return (
    <BusinessBrainCompactSection title={bb("ruleCategories")}>
      <div className="mb-3 space-y-1">
        {BRAIN_BEHAVIOR_TYPES.map((type) => {
          const count = behaviors.filter((item) => item.type === type).length;
          const active = activeCategory === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onCategoryChange(type)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border/70 text-foreground hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <span className="text-sm font-medium">{bbBehaviorTypeLabel(bb, type)}</span>
              <span className="text-[11px] text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        <p className="text-[11px] text-muted-foreground">
          {bbBehaviorTypeDescription(bb, activeCategory)}
        </p>

        {showRuleList ? (
          <>
            {canEdit ? (
              <DsButton
                type="button"
                size="sm"
                onClick={onCreateRule}
                loading={isCreating}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                {bb("addRule")}
              </DsButton>
            ) : null}

            {categoryBehaviors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
                {bb("rulesEmptyState")}
              </div>
            ) : (
              <ExpandableList
                items={categoryBehaviors}
                itemsClassName="space-y-1.5"
                getItemKey={(behavior) => behavior.id}
                renderItem={(behavior) => {
                  const selected = behavior.id === selectedBehaviorId;
                  return (
                    <button
                      type="button"
                      onClick={() => onSelectBehavior(behavior.id)}
                      className={cn(
                        "w-full rounded-lg border p-2.5 text-left transition-colors",
                        selected ? BB_COMPACT_LIST_SELECTED_CLASS : BB_COMPACT_LIST_IDLE_CLASS,
                        !behavior.enabled && "opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{behavior.name}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            behavior.enabled
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {behavior.enabled ? bb("on") : bb("off")}
                        </span>
                      </div>
                      {behavior.description ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                          {behavior.description}
                        </p>
                      ) : null}
                    </button>
                  );
                }}
              />
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              const configBehavior = categoryBehaviors[0];
              if (configBehavior) onSelectBehavior(configBehavior.id);
            }}
            className={cn(
              "w-full rounded-lg border p-2.5 text-left transition-colors",
              selectedBehaviorId && categoryBehaviors[0]?.id === selectedBehaviorId
                ? BB_COMPACT_LIST_SELECTED_CLASS
                : BB_COMPACT_LIST_IDLE_CLASS,
            )}
          >
            <p className="text-sm font-medium text-foreground">{bb("configureSettings")}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {CONFIG_BEHAVIOR_TYPES.includes(activeCategory as "REPLY_STYLE")
                ? bb("replyToneDefaults")
                : bb("requiredQualificationQuestions")}
            </p>
          </button>
        )}
      </div>
    </BusinessBrainCompactSection>
  );
}
