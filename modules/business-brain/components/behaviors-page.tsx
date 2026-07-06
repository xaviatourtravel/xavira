"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BehaviorCategoriesPanel } from "@/modules/business-brain/components/behavior-categories-panel";
import { BehaviorEditor } from "@/modules/business-brain/components/behavior-editor";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type {
  BrainBehaviorRecord,
  BrainBehaviorType,
} from "@/modules/business-brain/types/behaviors";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type BehaviorsPageClientProps = {
  initialBehaviors: BrainBehaviorRecord[];
  canEdit: boolean;
};

export function BehaviorsPageClient({
  initialBehaviors,
  canEdit,
}: BehaviorsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [behaviors, setBehaviors] = useState(initialBehaviors);
  const [activeCategory, setActiveCategory] = useState<BrainBehaviorType>("ALWAYS_DO");
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string | null>(() => {
    const first = initialBehaviors.find((item) => item.type === "ALWAYS_DO");
    return first?.id ?? null;
  });
  const [isCreating, setIsCreating] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  useEffect(() => {
    setBehaviors(initialBehaviors);
  }, [initialBehaviors]);

  const selectedBehavior = useMemo(
    () => behaviors.find((item) => item.id === selectedBehaviorId) ?? null,
    [behaviors, selectedBehaviorId],
  );

  const configBehavior = useMemo(() => {
    if (activeCategory === "REPLY_STYLE" || activeCategory === "QUALIFICATION_RULE") {
      return behaviors.find((item) => item.type === activeCategory) ?? null;
    }
    return null;
  }, [activeCategory, behaviors]);

  const editorBehavior =
    activeCategory === "REPLY_STYLE" || activeCategory === "QUALIFICATION_RULE"
      ? configBehavior
      : isCreating
        ? null
        : selectedBehavior;

  const handleCategoryChange = (category: BrainBehaviorType) => {
    setActiveCategory(category);
    setIsCreating(false);

    if (category === "REPLY_STYLE" || category === "QUALIFICATION_RULE") {
      const config = behaviors.find((item) => item.type === category);
      setSelectedBehaviorId(config?.id ?? null);
      setMobileShowEditor(true);
      return;
    }

    const first = behaviors.find((item) => item.type === category);
    setSelectedBehaviorId(first?.id ?? null);
  };

  const handleSelectBehavior = (behaviorId: string) => {
    setSelectedBehaviorId(behaviorId);
    setIsCreating(false);
    setMobileShowEditor(true);
  };

  const handleBehaviorUpdated = (behavior: BrainBehaviorRecord) => {
    const wasCreate = !behaviors.some((item) => item.id === behavior.id);
    setBehaviors((current) => {
      const exists = current.some((item) => item.id === behavior.id);
      if (!exists) return [behavior, ...current];
      return current.map((item) => (item.id === behavior.id ? behavior : item));
    });
    setSelectedBehaviorId(behavior.id);
    setIsCreating(false);
    if (wasCreate) {
      router.refresh();
    }
  };

  const handleBehaviorDeleted = (behaviorId: string) => {
    setBehaviors((current) => current.filter((item) => item.id !== behaviorId));
    setSelectedBehaviorId(null);
    setIsCreating(false);
    setMobileShowEditor(false);
  };

  const handleCreateRule = () => {
    if (activeCategory === "REPLY_STYLE" || activeCategory === "QUALIFICATION_RULE") return;
    setIsCreating(true);
    setSelectedBehaviorId(null);
    setMobileShowEditor(true);
  };

  return (
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "behaviors")}
        iconSlug="behaviors"
        description={translateBusinessBrainSectionDescription(t, "behaviors")}
      />
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <div className={cn(mobileShowEditor ? "hidden lg:block" : "block")}>
          <BehaviorCategoriesPanel
            behaviors={behaviors}
            activeCategory={activeCategory}
            selectedBehaviorId={isCreating ? null : selectedBehaviorId}
            canEdit={canEdit}
            isCreating={isCreating}
            onCategoryChange={handleCategoryChange}
            onSelectBehavior={handleSelectBehavior}
            onCreateRule={handleCreateRule}
          />
        </div>

        <div className={cn(!mobileShowEditor ? "hidden lg:block" : "block")}>
          <BehaviorEditor
            behavior={editorBehavior}
            category={activeCategory}
            canEdit={canEdit}
            isNew={isCreating}
            onBack={() => {
              setIsCreating(false);
              setMobileShowEditor(false);
            }}
            onBehaviorUpdated={handleBehaviorUpdated}
            onBehaviorDeleted={handleBehaviorDeleted}
            onCancelCreate={() => setIsCreating(false)}
          />
        </div>
      </div>
    </div>
  );
}
