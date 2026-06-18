export const INTEGRATION_PROVIDERS = [
  "openai",
  "whatsapp_cloud",
  "instagram_business",
  "facebook_page",
  "google_drive",
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = [
  "connected",
  "not_connected",
  "pending_setup",
] as const;

export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export type IntegrationProviderConfig = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  /** Status used when no row exists yet for this org. */
  defaultStatus: IntegrationStatus;
  /** Metadata fields shown in the detail view, in display order. */
  detailFields: ReadonlyArray<{ key: string; label: string }>;
};

export const INTEGRATION_PROVIDER_CONFIGS: ReadonlyArray<IntegrationProviderConfig> =
  [
    {
      provider: "openai",
      name: "OpenAI",
      description: "AI Content Studio, sales assistant, dan thumbnail generator.",
      defaultStatus: "connected",
      detailFields: [
        { key: "model", label: "Connected Model" },
        { key: "lastUsedAt", label: "Last Successful Usage" },
        { key: "apiStatus", label: "API Status" },
      ],
    },
    {
      provider: "whatsapp_cloud",
      name: "WhatsApp Cloud API",
      description: "Kirim dan terima pesan WhatsApp melalui Cloud API resmi.",
      defaultStatus: "pending_setup",
      detailFields: [
        { key: "phoneNumber", label: "Phone Number" },
        { key: "wabaStatus", label: "WABA Status" },
        { key: "migrationNotes", label: "Migration Notes" },
      ],
    },
    {
      provider: "instagram_business",
      name: "Instagram Business",
      description: "Hubungkan akun Instagram Business untuk analytics dan publish konten.",
      defaultStatus: "not_connected",
      detailFields: [
        { key: "connectedAccount", label: "Connected Account" },
        { key: "pageName", label: "Facebook Page" },
        { key: "username", label: "Instagram Username" },
        { key: "followersCount", label: "Followers" },
        { key: "lastSyncedAt", label: "Last Sync" },
        { key: "connectionMethod", label: "Connection Method" },
        { key: "businessAccountStatus", label: "Business Account Status" },
      ],
    },
    {
      provider: "facebook_page",
      name: "Facebook Page",
      description: "Hubungkan Facebook Page untuk distribusi konten.",
      defaultStatus: "not_connected",
      detailFields: [
        { key: "connectedPage", label: "Connected Page" },
        { key: "pageName", label: "Page Name" },
      ],
    },
    {
      provider: "google_drive",
      name: "Google Drive",
      description: "Simpan dan kelola aset media di Google Drive.",
      defaultStatus: "not_connected",
      detailFields: [
        { key: "connectedAccount", label: "Connected Account" },
        { key: "storageStatus", label: "Storage Status" },
      ],
    },
  ];

const PROVIDER_SET = new Set<string>(INTEGRATION_PROVIDERS);
const STATUS_SET = new Set<string>(INTEGRATION_STATUSES);

const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: "Connected",
  not_connected: "Not Connected",
  pending_setup: "Pending Setup",
};

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return PROVIDER_SET.has(value);
}

export function isIntegrationStatus(value: string): value is IntegrationStatus {
  return STATUS_SET.has(value);
}

export function getIntegrationProviderConfig(provider: IntegrationProvider) {
  return INTEGRATION_PROVIDER_CONFIGS.find(
    (config) => config.provider === provider,
  );
}

export function formatIntegrationStatusLabel(status: string) {
  return isIntegrationStatus(status)
    ? INTEGRATION_STATUS_LABELS[status]
    : status.replace(/_/g, " ");
}
