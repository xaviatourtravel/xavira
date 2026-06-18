import { InstagramAnalyticsView } from "@/components/instagram/instagram-analytics-view";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadInstagramAnalyticsMetrics } from "@/lib/instagram/queries";
import { createClient } from "@/utils/supabase/server";

export default async function InstagramAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const supabase = await createClient();

  const metrics = await loadInstagramAnalyticsMetrics(
    supabase,
    profile.organization_id,
  );

  return (
    <InstagramAnalyticsView
      metrics={metrics}
      canManage={canManage}
      initialMessage={params.message ?? null}
      initialError={params.error ?? null}
    />
  );
}
