"use client";

import { Construction } from "lucide-react";

import { DsCard } from "@/components/design-system/card";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";

type BusinessBrainComingSoonProps = {
  title: string;
  description: string;
};

export function BusinessBrainComingSoon({
  title,
  description,
}: BusinessBrainComingSoonProps) {
  const { bb } = useBbTranslation();

  return (
    <DsCard className="max-w-2xl">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Construction className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <p className="text-xs text-muted-foreground">{bb("comingSoonLabel")}</p>
        </div>
      </div>
    </DsCard>
  );
}
