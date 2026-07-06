"use client";

import { Plus } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
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
    <DsCard className="p-4 md:p-5">
      <div className="mb-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">{bb("ruleCategories")}</h2>
        <div className="space-y-1">
          {BRAIN_BEHAVIOR_TYPES.map((type) => {
            const count = behaviors.filter((item) => item.type === type).length;
            const active = activeCategory === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => onCategoryChange(type)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/30 hover:bg-muted/30",
                )}
              >
                <span className="font-medium">{bbBehaviorTypeLabel(bb, type)}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
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

            <div className="space-y-2">
              {categoryBehaviors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {bb("rulesEmptyState")}
                </div>
              ) : (
                categoryBehaviors.map((behavior) => {
                  const selected = behavior.id === selectedBehaviorId;
                  return (
                    <button
                      key={behavior.id}
                      type="button"
                      onClick={() => onSelectBehavior(behavior.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                        !behavior.enabled && "opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">{behavior.name}</p>
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
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {behavior.description}
                        </p>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              const configBehavior = categoryBehaviors[0];
              if (configBehavior) onSelectBehavior(configBehavior.id);
            }}
            className={cn(
              "w-full rounded-xl border p-3 text-left transition-colors",
              selectedBehaviorId && categoryBehaviors[0]?.id === selectedBehaviorId
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
            )}
          >
            <p className="font-medium text-foreground">{bb("configureSettings")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {CONFIG_BEHAVIOR_TYPES.includes(activeCategory as "REPLY_STYLE")
                ? bb("replyToneDefaults")
                : bb("requiredQualificationQuestions")}
            </p>
          </button>
        )}
      </div>
    </DsCard>
  );
}
