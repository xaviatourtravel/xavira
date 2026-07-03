import { loadPlaygroundAction } from "@/modules/business-brain/actions/playground-actions";
import { PlaygroundPageClient } from "@/modules/business-brain/components/playground-page";

export const metadata = {
  title: "Playground · Business Brain · Desklabs",
};

export default async function BusinessBrainPlaygroundPage() {
  const { availableContext, savedExamples, canEdit, llmConfigured } = await loadPlaygroundAction();

  return (
    <PlaygroundPageClient
      initialAvailableContext={availableContext}
      initialSavedExamples={savedExamples}
      canEdit={canEdit}
      llmConfigured={llmConfigured}
    />
  );
}
