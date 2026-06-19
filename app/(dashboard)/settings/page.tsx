import { Suspense } from "react";

import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { isSettingsSectionId, type SettingsSectionId } from "@/lib/settings/constants";
import { loadSettingsWorkspaceData } from "@/lib/settings/queries";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    message?: string;
    error?: string;
    instagram?: string;
  }>;
}) {
  const params = await searchParams;
  const activeSection: SettingsSectionId = isSettingsSectionId(
    params.section ?? "",
  )
    ? (params.section as SettingsSectionId)
    : "general";

  const data = await loadSettingsWorkspaceData(activeSection);
  const flashMessage =
    params.message ??
    (params.instagram === "connected"
      ? "Instagram connected successfully. You can sync analytics from Content."
      : null);
  const flashError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading settings...</div>}>
      <SettingsWorkspace
        data={data}
        flashMessage={flashMessage}
        flashError={flashError}
      />
    </Suspense>
  );
}
