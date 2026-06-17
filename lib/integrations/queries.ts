import {
  formatIntegrationStatusLabel,
  getIntegrationProviderConfig,
  INTEGRATION_PROVIDER_CONFIGS,
  isIntegrationProvider,
  isIntegrationStatus,
  type IntegrationProvider,
  type IntegrationStatus,
} from "@/lib/integrations/constants";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type IntegrationRow = {
  id: string;
  organization_id: string;
  provider: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IntegrationCard = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  status: IntegrationStatus;
  statusLabel: string;
  metadata: Record<string, unknown>;
  detailFields: ReadonlyArray<{ key: string; label: string; value: string }>;
  updatedAt: string | null;
};

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export async function loadOrganizationIntegrations(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<IntegrationCard[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, organization_id, provider, status, metadata, created_at, updated_at")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  const rowsByProvider = new Map<string, IntegrationRow>();
  for (const row of (data ?? []) as IntegrationRow[]) {
    rowsByProvider.set(row.provider, row);
  }

  return INTEGRATION_PROVIDER_CONFIGS.map((config) => {
    const row = rowsByProvider.get(config.provider);
    const status: IntegrationStatus =
      row && isIntegrationStatus(row.status)
        ? row.status
        : config.defaultStatus;
    const metadata = (row?.metadata ?? {}) as Record<string, unknown>;

    return {
      provider: config.provider,
      name: config.name,
      description: config.description,
      status,
      statusLabel: formatIntegrationStatusLabel(status),
      metadata,
      detailFields: config.detailFields.map((field) => ({
        key: field.key,
        label: field.label,
        value: formatMetadataValue(metadata[field.key]),
      })),
      updatedAt: row?.updated_at ?? null,
    } satisfies IntegrationCard;
  });
}

export function resolveIntegrationProvider(value: string) {
  return isIntegrationProvider(value) ? value : null;
}

export function getProviderDisplayName(provider: IntegrationProvider) {
  return getIntegrationProviderConfig(provider)?.name ?? provider;
}
