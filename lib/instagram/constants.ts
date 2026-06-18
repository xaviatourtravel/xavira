export const INSTAGRAM_INTEGRATION_PROVIDER = "instagram_business" as const;

export const GRAPH_API_VERSION = "v21.0";

export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** Metadata keys stored on integrations.metadata for instagram_business. */
export type InstagramIntegrationMetadata = {
  accessToken?: string;
  pageId?: string;
  pageName?: string;
  pageAccessToken?: string;
  instagramBusinessAccountId?: string;
  instagramUsername?: string;
  username?: string;
  followersCount?: number;
  lastSyncedAt?: string;
  businessAccountStatus?: string;
  connectedAccount?: string;
  connectionMethod?: "oauth" | "manual";
  instagramManageInsightsGranted?: boolean;
};

export const INSTAGRAM_MEDIA_SYNC_LIMIT = 50;

export function parseInstagramIntegrationMetadata(
  metadata: unknown,
): InstagramIntegrationMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }
  const record = metadata as Record<string, unknown>;
  return {
    accessToken:
      typeof record.accessToken === "string" ? record.accessToken : undefined,
    pageId: typeof record.pageId === "string" ? record.pageId : undefined,
    pageName: typeof record.pageName === "string" ? record.pageName : undefined,
    pageAccessToken:
      typeof record.pageAccessToken === "string"
        ? record.pageAccessToken
        : undefined,
    instagramBusinessAccountId:
      typeof record.instagramBusinessAccountId === "string"
        ? record.instagramBusinessAccountId
        : undefined,
    instagramUsername:
      typeof record.instagramUsername === "string"
        ? record.instagramUsername
        : undefined,
    username: typeof record.username === "string" ? record.username : undefined,
    followersCount:
      typeof record.followersCount === "number"
        ? record.followersCount
        : undefined,
    lastSyncedAt:
      typeof record.lastSyncedAt === "string" ? record.lastSyncedAt : undefined,
    businessAccountStatus:
      typeof record.businessAccountStatus === "string"
        ? record.businessAccountStatus
        : undefined,
    connectedAccount:
      typeof record.connectedAccount === "string"
        ? record.connectedAccount
        : undefined,
    connectionMethod:
      record.connectionMethod === "oauth" || record.connectionMethod === "manual"
        ? record.connectionMethod
        : undefined,
    instagramManageInsightsGranted:
      record.instagramManageInsightsGranted === true ? true : undefined,
  };
}

export function computeInstagramEngagement(metrics: {
  likes: number;
  comments: number;
  saves: number;
}) {
  return metrics.likes + metrics.comments + metrics.saves;
}
