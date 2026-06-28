import { ComingSoonWorkspace } from "@/components/layout/coming-soon-workspace";
import {
  COMING_SOON_PRESETS,
  resolveComingSoonPreset,
} from "@/lib/navigation/coming-soon-presets";

type ComingSoonPageProps = {
  preset: keyof typeof COMING_SOON_PRESETS;
};

export function ComingSoonPage({ preset }: ComingSoonPageProps) {
  return (
    <ComingSoonWorkspace {...resolveComingSoonPreset(COMING_SOON_PRESETS[preset])} />
  );
}
