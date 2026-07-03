import { loadBrainBehaviorsAction } from "@/modules/business-brain/actions/behavior-actions";
import { BehaviorsPageClient } from "@/modules/business-brain/components/behaviors-page";

export const metadata = {
  title: "Behaviors · Business Brain · Desklabs",
};

export default async function BusinessBrainBehaviorsPage() {
  const { behaviors, canEdit } = await loadBrainBehaviorsAction();

  return <BehaviorsPageClient initialBehaviors={behaviors} canEdit={canEdit} />;
}
