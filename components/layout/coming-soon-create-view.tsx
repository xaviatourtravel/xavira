import type { LucideIcon } from "lucide-react";
import { Wrench } from "lucide-react";

import { ComingSoonWorkspace } from "@/components/layout/coming-soon-workspace";
import { resolveComingSoonPreset } from "@/lib/navigation/coming-soon-presets";

type ComingSoonCreateViewProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  icon?: LucideIcon;
};

export function ComingSoonCreateView({
  title,
  description,
  backHref,
  backLabel = "Kembali",
  icon = Wrench,
}: ComingSoonCreateViewProps) {
  const preset = resolveComingSoonPreset({
    title,
    subtitle: description,
    icon,
    primaryActionHref: backHref,
    primaryActionLabel: backLabel,
  });

  return <ComingSoonWorkspace {...preset} />;
}
