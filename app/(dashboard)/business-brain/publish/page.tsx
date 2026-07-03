import { loadPublishPageAction } from "@/modules/business-brain/actions/publish-actions";
import { PublishPageClient } from "@/modules/business-brain/components/publish-page";

export const metadata = {
  title: "Publish · Business Brain · Desklabs",
};

export default async function BusinessBrainPublishPage() {
  const { status, draftSummary, versions, canPublish } = await loadPublishPageAction();

  return (
    <PublishPageClient
      initialStatus={status}
      initialDraftSummary={draftSummary}
      initialVersions={versions}
      canPublish={canPublish}
    />
  );
}
