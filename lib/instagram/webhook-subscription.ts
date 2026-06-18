import {
  GRAPH_API_BASE,
  INSTAGRAM_INTEGRATION_PROVIDER,
  parseInstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import { maskSensitiveGraphValues } from "@/lib/instagram/graph-debug";
import {
  getInstagramAccessToken,
  type MetaGrantedPermission,
} from "@/lib/instagram/oauth";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const PAGE_MESSAGING_PERMISSION = "pages_messaging" as const;

export const PAGE_WEBHOOK_SUBSCRIBED_FIELDS = ["messages"] as const;

export type MetaGraphErrorDetails = {
  message: string;
  type?: string;
  code?: number;
};

export type SubscribedAppEntry = {
  id: string;
  name: string;
  category?: string;
  link?: string;
  subscribed_fields: string[];
};

export type PageWebhookSubscriptionCheckResult = {
  ok: boolean;
  httpStatus: number;
  request: string;
  subscribedApps: SubscribedAppEntry[];
  isDesklabsAppSubscribed: boolean;
  desklabsSubscribedFields: string[];
  rawBody: unknown;
  error?: MetaGraphErrorDetails;
};

export type PageWebhookSubscribeResult = {
  ok: boolean;
  httpStatus: number;
  request: string;
  subscribedFieldsSent: string[];
  status: "success" | "failure";
  success?: boolean;
  rawBody: unknown;
  error?: MetaGraphErrorDetails;
};

export type InstagramWebhookIntegrationContext = {
  integrationStatus: string;
  pageId: string;
  pageName: string | null;
  instagramBusinessAccountId: string;
  pageAccessToken: string;
};

export type PagePermissionsDebugResult = {
  ok: boolean;
  httpStatus: number;
  request: string;
  source: "me_permissions" | "debug_token";
  permissions: MetaGrantedPermission[];
  hasPagesMessaging: boolean;
  rawBody: unknown;
  error?: MetaGraphErrorDetails;
  note?: string;
};

type MetaGraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type SubscribedAppsResponse = MetaGraphErrorBody & {
  data?: Array<{
    id?: string;
    name?: string;
    category?: string;
    link?: string;
    subscribed_fields?: string[];
  }>;
};

type SubscribeAppsResponse = MetaGraphErrorBody & {
  success?: boolean;
};

type DebugTokenResponse = MetaGraphErrorBody & {
  data?: {
    scopes?: string[];
    type?: string;
  };
};

function getMetaAppAccessToken() {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    return null;
  }
  return `${appId}|${appSecret}`;
}

function hasGrantedPermission(
  permissions: MetaGrantedPermission[],
  permission: string,
) {
  return permissions.some(
    (row) => row.permission === permission && row.status === "granted",
  );
}

function buildPermissionsDebugResult(input: {
  ok: boolean;
  httpStatus: number;
  request: string;
  source: PagePermissionsDebugResult["source"];
  permissions: MetaGrantedPermission[];
  rawBody: unknown;
  error?: MetaGraphErrorDetails;
  note?: string;
}): PagePermissionsDebugResult {
  return {
    ok: input.ok,
    httpStatus: input.httpStatus,
    request: input.request,
    source: input.source,
    permissions: input.permissions,
    hasPagesMessaging: hasGrantedPermission(
      input.permissions,
      PAGE_MESSAGING_PERMISSION,
    ),
    rawBody: maskSensitiveGraphValues(input.rawBody),
    error: input.error,
    note: input.note,
  };
}

async function fetchPagePermissionsViaDebugToken(
  pageAccessToken: string,
): Promise<PagePermissionsDebugResult> {
  const appAccessToken = getMetaAppAccessToken();
  if (!appAccessToken) {
    return buildPermissionsDebugResult({
      ok: false,
      httpStatus: 0,
      request: "GET /debug_token",
      source: "debug_token",
      permissions: [],
      rawBody: null,
      error: {
        message:
          "META_APP_ID and META_APP_SECRET are required to inspect page token scopes.",
      },
    });
  }

  const url = new URL(`${GRAPH_API_BASE}/debug_token`);
  url.searchParams.set("input_token", pageAccessToken);
  url.searchParams.set("access_token", appAccessToken);

  const request = "GET /debug_token";
  const { httpStatus, body } = await fetchGraphApi(url.toString());
  const error = parseMetaGraphError(body);
  const scopes = (body as DebugTokenResponse).data?.scopes ?? [];
  const permissions = scopes.map((scope) => ({
    permission: scope,
    status: "granted",
  }));

  return buildPermissionsDebugResult({
    ok: !error && httpStatus >= 200 && httpStatus < 300,
    httpStatus,
    request,
    source: "debug_token",
    permissions,
    rawBody: body,
    error,
    note:
      "Stored integration uses a page access token. Scopes are shown via Meta debug_token because /me/permissions requires a user access token.",
  });
}

export async function fetchStoredPagePermissionsDebug(
  pageAccessToken: string,
): Promise<PagePermissionsDebugResult> {
  const mePermissionsUrl = new URL(`${GRAPH_API_BASE}/me/permissions`);
  mePermissionsUrl.searchParams.set("access_token", pageAccessToken);
  const meRequest = "GET /me/permissions";
  const meResult = await fetchGraphApi(mePermissionsUrl.toString());
  const meError = parseMetaGraphError(meResult.body);

  if (!meError && meResult.httpStatus >= 200 && meResult.httpStatus < 300) {
    const rows =
      (meResult.body as { data?: Array<{ permission?: string; status?: string }> })
        .data ?? [];
    const permissions = rows
      .filter(
        (row): row is { permission: string; status: string } =>
          typeof row.permission === "string" &&
          row.permission.length > 0 &&
          typeof row.status === "string",
      )
      .map((row) => ({
        permission: row.permission,
        status: row.status,
      }));

    return buildPermissionsDebugResult({
      ok: true,
      httpStatus: meResult.httpStatus,
      request: meRequest,
      source: "me_permissions",
      permissions,
      rawBody: meResult.body,
    });
  }

  const debugResult = await fetchPagePermissionsViaDebugToken(pageAccessToken);
  if (meError) {
    return {
      ...debugResult,
      note:
        `${debugResult.note ?? ""} /me/permissions failed: ${meError.message}`.trim(),
    };
  }

  return debugResult;
}

function parseMetaGraphError(body: unknown): MetaGraphErrorDetails | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const error = (body as MetaGraphErrorBody).error;
  if (!error?.message) {
    return undefined;
  }

  return {
    message: error.message,
    type: error.type,
    code: error.code,
  };
}

function normalizeSubscribedApps(body: unknown): SubscribedAppEntry[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const rows = (body as SubscribedAppsResponse).data ?? [];
  return rows
    .filter(
      (row): row is typeof row & { id: string } =>
        typeof row.id === "string" && row.id.length > 0,
    )
    .map((row) => ({
      id: row.id,
      name: row.name ?? "Unknown app",
      category: row.category,
      link: row.link,
      subscribed_fields: Array.isArray(row.subscribed_fields)
        ? row.subscribed_fields.filter(
            (field): field is string => typeof field === "string",
          )
        : [],
    }));
}

function getConfiguredMetaAppId() {
  const appId = process.env.META_APP_ID?.trim();
  return appId || null;
}

function findDesklabsSubscription(
  subscribedApps: SubscribedAppEntry[],
  metaAppId: string | null,
) {
  if (!metaAppId) {
    return { isSubscribed: false, subscribedFields: [] as string[] };
  }

  const match = subscribedApps.find((app) => app.id === metaAppId);
  return {
    isSubscribed: Boolean(match),
    subscribedFields: match?.subscribed_fields ?? [],
  };
}

async function fetchGraphApi(
  url: string,
  init?: RequestInit,
): Promise<{ httpStatus: number; body: unknown }> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json();
  return { httpStatus: response.status, body };
}

export async function checkPageWebhookSubscription(
  pageId: string,
  pageAccessToken: string,
): Promise<PageWebhookSubscriptionCheckResult> {
  const url = new URL(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`);
  url.searchParams.set("access_token", pageAccessToken);

  const request = `GET /${pageId}/subscribed_apps`;
  const { httpStatus, body } = await fetchGraphApi(url.toString());
  const error = parseMetaGraphError(body);
  const subscribedApps = error ? [] : normalizeSubscribedApps(body);
  const metaAppId = getConfiguredMetaAppId();
  const desklabs = findDesklabsSubscription(subscribedApps, metaAppId);

  return {
    ok: !error && httpStatus >= 200 && httpStatus < 300,
    httpStatus,
    request,
    subscribedApps,
    isDesklabsAppSubscribed: desklabs.isSubscribed,
    desklabsSubscribedFields: desklabs.subscribedFields,
    rawBody: maskSensitiveGraphValues(body),
    error,
  };
}

export async function subscribePageToWebhook(
  pageId: string,
  pageAccessToken: string,
  subscribedFields: readonly string[] = PAGE_WEBHOOK_SUBSCRIBED_FIELDS,
): Promise<PageWebhookSubscribeResult> {
  const subscribedFieldsSent = [...subscribedFields];
  const fields = subscribedFieldsSent.join(",");
  const url = new URL(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`);
  url.searchParams.set("access_token", pageAccessToken);
  url.searchParams.set("subscribed_fields", fields);

  const request = `POST /${pageId}/subscribed_apps?subscribed_fields=${fields}`;
  const { httpStatus, body } = await fetchGraphApi(url.toString(), {
    method: "POST",
  });

  const error = parseMetaGraphError(body);
  const success =
    !error &&
    httpStatus >= 200 &&
    httpStatus < 300 &&
    (body as SubscribeAppsResponse).success === true;

  const result: PageWebhookSubscribeResult = {
    ok: success,
    httpStatus,
    request,
    subscribedFieldsSent,
    status: success ? "success" : "failure",
    success: success || undefined,
    rawBody: maskSensitiveGraphValues(body),
    error,
  };

  console.log("[instagram-webhook-subscribe]", {
    pageId,
    subscribedFieldsSent,
    httpStatus,
    status: result.status,
    error: error?.message ?? null,
  });

  return result;
}

export async function loadInstagramWebhookIntegrationContext(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<InstagramWebhookIntegrationContext | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select("status, metadata")
    .eq("organization_id", organizationId)
    .eq("provider", INSTAGRAM_INTEGRATION_PROVIDER)
    .maybeSingle();

  if (error || !data || data.status !== "connected") {
    return null;
  }

  const metadata = parseInstagramIntegrationMetadata(data.metadata);
  const pageAccessToken = getInstagramAccessToken(metadata);
  const pageId = metadata.pageId?.trim();
  const instagramBusinessAccountId = metadata.instagramBusinessAccountId?.trim();

  if (!pageAccessToken || !pageId || !instagramBusinessAccountId) {
    return null;
  }

  return {
    integrationStatus: data.status,
    pageId,
    pageName: metadata.pageName ?? metadata.connectedAccount ?? null,
    instagramBusinessAccountId,
    pageAccessToken,
  };
}

export function getMetaWebhookCallbackUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return siteUrl ? `${siteUrl}/api/webhooks/meta` : "/api/webhooks/meta";
}
