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

export default async function IntegrationsSettingsPage() {
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
    if (integration.provider !== "openai") {
      return integration;
    }

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
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Pusat kontrol untuk semua koneksi pihak ketiga organisasi Anda.
        </p>
      </div>

      {!canManage && (
        <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          Anda memiliki akses lihat saja. Hubungi owner atau admin untuk
          mengubah integrasi.
        </div>
      )}

      <IntegrationsGrid
        integrations={enrichedIntegrations}
        canManage={canManage}
      />
    </div>
  );
}
