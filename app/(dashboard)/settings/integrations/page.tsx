import Link from "next/link";
import { IntegrationsGrid } from "@/components/settings/integrations-grid";
import { AI_MODEL } from "@/lib/ai/client";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadOrganizationIntegrations } from "@/lib/integrations/queries";
import { createClient } from "@/utils/supabase/server";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
    instagram?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManage = isAdminOrOwner(profile);
  const supabase = await createClient();

  const [integrations, { data: lastAiLog }] = await Promise.all([
    loadOrganizationIntegrations(supabase, profile.organization_id),
    supabase
      .from("ai_generation_logs")
      .select("model, created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const enrichedIntegrations = integrations.map((integration) => {
    if (integration.provider === "openai") {
      const lastUsedAt = lastAiLog?.created_at
        ? formatDateTime(lastAiLog.created_at)
        : "Belum ada penggunaan";

      return {
        ...integration,
        detailFields: integration.detailFields.map((field) => {
          if (field.key === "model") {
            return { ...field, value: lastAiLog?.model ?? AI_MODEL };
          }
          if (field.key === "lastUsedAt") {
            return { ...field, value: lastUsedAt };
          }
          if (field.key === "apiStatus") {
            return {
              ...field,
              value:
                integration.status === "connected" ? "Operational" : field.value,
            };
          }
          return field;
        }),
      };
    }

    if (integration.provider === "instagram_business") {
      return {
        ...integration,
        detailFields: integration.detailFields.map((field) => {
          if (field.key === "lastSyncedAt" && field.value !== "—") {
            return { ...field, value: formatDateTime(field.value) };
          }
          if (field.key === "followersCount" && field.value !== "—") {
            return {
              ...field,
              value: new Intl.NumberFormat("id-ID").format(Number(field.value)),
            };
          }
          if (field.key === "connectionMethod" && field.value !== "—") {
            return {
              ...field,
              value: field.value === "oauth" ? "Meta OAuth" : "Manual token",
            };
          }
          return field;
        }),
      };
    }

    return integration;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Pusat kontrol untuk semua koneksi pihak ketiga organisasi Anda.
        </p>
      </div>

      {params.message || params.instagram === "connected" ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {params.message ??
            "Instagram berhasil terhubung. Anda dapat sinkronisasi analytics sekarang."}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {params.error}
        </div>
      ) : null}

      {!canManage && (
        <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          Anda memiliki akses lihat saja. Hubungi owner atau admin untuk
          mengubah integrasi.
        </div>
      )}

      {canManage ? (
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/settings/integrations/instagram/webhook"
            className="font-medium text-primary hover:underline"
          >
            Instagram Webhook Subscription
          </Link>
          {process.env.NODE_ENV === "development" ? (
            <Link
              href="/settings/integrations/instagram/debug"
              className="text-muted-foreground hover:underline"
            >
              Instagram Graph API Debug
            </Link>
          ) : null}
        </div>
      ) : null}

      <IntegrationsGrid
        integrations={enrichedIntegrations}
        canManage={canManage}
      />
    </div>
  );
}
