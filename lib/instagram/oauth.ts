import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import {
  GRAPH_API_BASE,
  GRAPH_API_VERSION,
  type InstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import type { InstagramGraphDebugSnapshot } from "@/lib/instagram/graph-debug";

export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "business_management",
  "instagram_basic",
  "instagram_manage_messages",
  "pages_messaging",
] as const;

export const INSTAGRAM_OAUTH_STATE_COOKIE = "instagram_oauth_state";
export const INSTAGRAM_OAUTH_PENDING_COOKIE = "instagram_oauth_pending";
export const INSTAGRAM_OAUTH_DEBUG_COOKIE = "instagram_oauth_debug";

export type InstagramOAuthDebugPayload = {
  userAccessToken: string;
  organizationId: string;
  userId: string;
  exp: number;
};

export type FacebookOAuthPageOption = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
};

export type FacebookOAuthPageWithInstagram = FacebookOAuthPageOption & {
  hasAccessToken: boolean;
  hasInstagramConnected: boolean;
  instagramBusinessAccountId?: string;
  connectedInstagramAccountId?: string;
  instagramUsername?: string;
  instagramBusinessAccount?: { id?: string; username?: string } | null;
  connectedInstagramAccount?: { id?: string; username?: string } | null;
  instagramFetchError?: string;
  instagramFieldsUsed?: string;
};

export type InstagramBusinessAccountInfo = {
  instagramBusinessAccountId: string;
  instagramUsername: string;
};

export type InstagramOAuthPendingPayload = {
  organizationId: string;
  userId: string;
  returnTo: string;
  pages: FacebookOAuthPageWithInstagram[];
  exp: number;
  oauthScopesRequested?: string;
  debugSnapshot?: InstagramGraphDebugSnapshot;
};

export type InstagramOAuthStatePayload = {
  state: string;
  organizationId: string;
  userId: string;
  returnTo: string;
  exp: number;
};

type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

type FacebookPageAccount = {
  id: string;
  name?: string;
  access_token?: string;
};

type FacebookAccountsResponse = {
  data?: FacebookPageAccount[];
  error?: { message?: string };
};

type PageInstagramLookupResponse = {
  name?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
  };
  connected_instagram_account?:
    | {
        id?: string;
        username?: string;
      }
    | string;
};

type OAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string };
};

export type MetaGraphApiError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type MetaPermissionRow = {
  permission?: string;
  status?: string;
};

export type MetaGrantedPermission = {
  permission: string;
  status: string;
};

type MetaPermissionsResponse = {
  data?: MetaPermissionRow[];
};

export type PageInstagramLookupResult = {
  pageName?: string;
  instagramBusinessAccountId?: string;
  connectedInstagramAccountId?: string;
  instagramUsername?: string;
  instagramBusinessAccount?: { id?: string; username?: string } | null;
  connectedInstagramAccount?: { id?: string; username?: string } | null;
  fetchError: MetaGraphApiError | null;
  fieldsUsed: string;
  rawResponse: Record<string, unknown> | null;
};

function isDevOAuthLogging() {
  return process.env.NODE_ENV === "development";
}

export function getDebugInstagramBusinessAccountId(): string | undefined {
  const fromEnv = process.env.META_DEBUG_INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (isDevOAuthLogging()) {
    return "17841467128030877";
  }

  return undefined;
}

export function formatMetaGraphApiErrorForDev(
  error: MetaGraphApiError | null | undefined,
): string | undefined {
  if (!error) {
    return undefined;
  }

  const parts = [
    error.message,
    error.type ? `type=${error.type}` : null,
    error.code !== undefined ? `code=${error.code}` : null,
    error.error_subcode !== undefined ? `subcode=${error.error_subcode}` : null,
    error.fbtrace_id ? `fbtrace_id=${error.fbtrace_id}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function parseInstagramGraphAccount(
  value: unknown,
): { id?: string; username?: string } | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return { id: value };
  }

  if (typeof value === "object") {
    const account = value as { id?: string; username?: string };
    return account.id ? account : null;
  }

  return null;
}

function parseConnectedInstagramAccount(
  value: PageInstagramLookupResponse["connected_instagram_account"],
): { id?: string; username?: string } | null {
  return parseInstagramGraphAccount(value);
}

function getSigningSecret() {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    throw new Error("Missing META_APP_SECRET");
  }
  return secret;
}

function encodePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSignedCookieValue(payload: unknown) {
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function parseSignedCookieValue<T>(value: string | undefined): T | null {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  const actual = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (
    actual.length !== expectedBuf.length ||
    !timingSafeEqual(actual, expectedBuf)
  ) {
    return null;
  }

  const payload = decodePayload<T>(encoded);
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const exp = (payload as { exp?: number }).exp;
  if (!exp || Date.now() > exp) {
    return null;
  }

  return payload;
}

export function getMissingMetaOAuthEnvVars(
  options: OAuthSiteOriginOptions = {},
): string[] {
  const missing: string[] = [];
  if (!process.env.META_APP_ID?.trim()) {
    missing.push("META_APP_ID");
  }
  if (!process.env.META_APP_SECRET?.trim()) {
    missing.push("META_APP_SECRET");
  }
  if (!canResolveOAuthSiteOrigin(options)) {
    missing.push(
      process.env.NODE_ENV === "production"
        ? "SITE_URL"
        : "NEXT_PUBLIC_SITE_URL",
    );
  }
  return missing;
}

export const INSTAGRAM_OAUTH_CALLBACK_PATH =
  "/api/integrations/instagram/callback";

const LOCALHOST_ORIGIN = "http://localhost:3000";

export type OAuthSiteOriginOptions = {
  request?: Request | URL | string;
  siteUrl?: string;
};

export type OAuthSiteOriginSource =
  | "explicit_option"
  | "site_url_env"
  | "request_forwarded_host"
  | "request_url"
  | "next_public_site_url"
  | "vercel_url"
  | "localhost_dev";

export type OAuthRedirectDiagnostics = {
  redirectUri: string;
  siteOrigin: string;
  siteUrlSource: OAuthSiteOriginSource;
  requestUrl: string | null;
  requestOrigin: string | null;
  forwardedHost: string | null;
  forwardedProto: string | null;
  hostHeader: string | null;
  environment: {
    nodeEnv: string | undefined;
    siteUrlOrigin: string | null;
    nextPublicSiteUrlOrigin: string | null;
    vercelUrl: string | null;
    metaAppIdPrefix: string | null;
  };
  oauthUrl?: string;
};

function isLocalhostOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}

export function normalizeSiteOrigin(siteUrl: string): string {
  const raw = siteUrl.trim();
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw).origin;
  } catch {
    let base = raw.replace(/\/$/, "");
    if (base.endsWith(INSTAGRAM_OAUTH_CALLBACK_PATH)) {
      base = base.slice(0, -INSTAGRAM_OAUTH_CALLBACK_PATH.length);
    }
    return base.replace(/\/$/, "");
  }
}

function getRequestHeaderSnapshot(request?: Request) {
  if (!request) {
    return {
      forwardedHost: null,
      forwardedProto: null,
      hostHeader: null,
      requestUrl: null,
      requestOrigin: null,
    };
  }

  let requestUrl: string | null = null;
  let requestOrigin: string | null = null;

  try {
    requestUrl = request.url;
    requestOrigin = new URL(request.url).origin;
  } catch {
    requestUrl = null;
    requestOrigin = null;
  }

  return {
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    hostHeader: request.headers.get("host"),
    requestUrl,
    requestOrigin,
  };
}

function resolveEnvOriginSnapshot() {
  return {
    nodeEnv: process.env.NODE_ENV,
    siteUrlOrigin: process.env.SITE_URL?.trim()
      ? normalizeSiteOrigin(process.env.SITE_URL)
      : null,
    nextPublicSiteUrlOrigin: process.env.NEXT_PUBLIC_SITE_URL?.trim()
      ? normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL)
      : null,
    vercelUrl: process.env.VERCEL_URL?.trim() ?? null,
    metaAppIdPrefix: process.env.META_APP_ID?.trim().slice(0, 6) ?? null,
  };
}

export function logOAuthRedirect(
  step: string,
  diagnostics: OAuthRedirectDiagnostics,
  extra?: Record<string, unknown>,
) {
  console.log(`[Instagram OAuth] ${step}`, {
    redirectUri: diagnostics.redirectUri,
    siteOrigin: diagnostics.siteOrigin,
    siteUrlSource: diagnostics.siteUrlSource,
    requestUrl: diagnostics.requestUrl,
    requestOrigin: diagnostics.requestOrigin,
    forwardedHost: diagnostics.forwardedHost,
    forwardedProto: diagnostics.forwardedProto,
    hostHeader: diagnostics.hostHeader,
    environment: diagnostics.environment,
    oauthUrl: diagnostics.oauthUrl,
    ...extra,
  });
}

function resolveOriginFromForwardedHeaders(request: Request): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = (forwardedHost ?? request.headers.get("host"))
    ?.split(",")[0]
    ?.trim();

  if (!host) {
    return null;
  }

  const proto = (forwardedProto ?? "https").split(",")[0].trim();
  const origin = `${proto}://${host}`;

  if (process.env.NODE_ENV === "production" && isLocalhostOrigin(origin)) {
    return null;
  }

  return origin;
}

function resolveOriginFromRequestUrl(
  request: Request | URL | string,
): string | null {
  try {
    const url =
      typeof request === "string"
        ? new URL(request)
        : request instanceof URL
          ? request
          : new URL(request.url);
    const origin = url.origin;
    if (!origin || origin === "null") {
      return null;
    }

    if (process.env.NODE_ENV === "production" && isLocalhostOrigin(origin)) {
      return null;
    }

    return origin;
  } catch {
    return null;
  }
}

function resolveOriginFromRequest(request: Request | URL | string): string | null {
  if (typeof request !== "string" && !(request instanceof URL) && "headers" in request) {
    const forwardedOrigin = resolveOriginFromForwardedHeaders(request);
    if (forwardedOrigin) {
      return forwardedOrigin;
    }
  }

  return resolveOriginFromRequestUrl(request);
}

function resolveOriginFromEnv(): {
  origin: string;
  source: OAuthSiteOriginSource;
} | null {
  const serverSiteUrl = process.env.SITE_URL?.trim();
  if (serverSiteUrl) {
    const origin = normalizeSiteOrigin(serverSiteUrl);
    if (origin && !(process.env.NODE_ENV === "production" && isLocalhostOrigin(origin))) {
      return { origin, source: "site_url_env" };
    }
  }

  const nextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (nextPublicSiteUrl) {
    const origin = normalizeSiteOrigin(nextPublicSiteUrl);
    if (origin && !(process.env.NODE_ENV === "production" && isLocalhostOrigin(origin))) {
      return { origin, source: "next_public_site_url" };
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return { origin: `https://${host}`, source: "vercel_url" };
  }

  return null;
}

export function resolveOAuthSiteOriginWithSource(
  options: OAuthSiteOriginOptions = {},
): { origin: string; source: OAuthSiteOriginSource } {
  if (options.siteUrl?.trim()) {
    return {
      origin: normalizeSiteOrigin(options.siteUrl),
      source: "explicit_option",
    };
  }

  if (process.env.NODE_ENV === "production") {
    const canonicalSiteUrl = process.env.SITE_URL?.trim();
    if (canonicalSiteUrl) {
      const origin = normalizeSiteOrigin(canonicalSiteUrl);
      if (origin && !isLocalhostOrigin(origin)) {
        return { origin, source: "site_url_env" };
      }
    }
  }

  if (options.request) {
    if (
      typeof options.request !== "string" &&
      !(options.request instanceof URL) &&
      "headers" in options.request
    ) {
      const forwardedOrigin = resolveOriginFromForwardedHeaders(options.request);
      if (forwardedOrigin) {
        return { origin: forwardedOrigin, source: "request_forwarded_host" };
      }
    }

    const requestOrigin = resolveOriginFromRequestUrl(options.request);
    if (requestOrigin) {
      return { origin: requestOrigin, source: "request_url" };
    }
  }

  const envOrigin = resolveOriginFromEnv();
  if (envOrigin) {
    return envOrigin;
  }

  if (process.env.NODE_ENV !== "production") {
    return { origin: LOCALHOST_ORIGIN, source: "localhost_dev" };
  }

  throw new Error(
    "Production site URL is not configured. Set SITE_URL=https://desklabs.vercel.app on Vercel (runtime env) or redeploy with NEXT_PUBLIC_SITE_URL set before build.",
  );
}

export function getOAuthRedirectDiagnostics(
  options: OAuthSiteOriginOptions = {},
): OAuthRedirectDiagnostics {
  const { origin, source } = resolveOAuthSiteOriginWithSource(options);
  const requestSnapshot =
    options.request &&
    typeof options.request !== "string" &&
    !(options.request instanceof URL)
      ? getRequestHeaderSnapshot(options.request)
      : options.request
        ? {
            forwardedHost: null,
            forwardedProto: null,
            hostHeader: null,
            requestUrl:
              typeof options.request === "string"
                ? options.request
                : options.request.toString(),
            requestOrigin: resolveOriginFromRequestUrl(options.request),
          }
        : getRequestHeaderSnapshot();

  return {
    redirectUri: `${origin}${INSTAGRAM_OAUTH_CALLBACK_PATH}`,
    siteOrigin: origin,
    siteUrlSource: source,
    ...requestSnapshot,
    environment: resolveEnvOriginSnapshot(),
  };
}

export function canResolveOAuthSiteOrigin(
  options: OAuthSiteOriginOptions = {},
): boolean {
  try {
    resolveOAuthSiteOriginWithSource(options);
    return true;
  } catch {
    return false;
  }
}

export function resolveOAuthSiteOrigin(
  options: OAuthSiteOriginOptions = {},
): string {
  return resolveOAuthSiteOriginWithSource(options).origin;
}

export function getMetaOAuthRedirectUri(
  options: OAuthSiteOriginOptions = {},
): string {
  return getOAuthRedirectDiagnostics(options).redirectUri;
}

export function formatMetaOAuthConfigError(): string {
  const missing = getMissingMetaOAuthEnvVars();

  if (missing.length === 0) {
    return "Konfigurasi Meta OAuth belum lengkap.";
  }

  if (process.env.NODE_ENV === "development") {
    const redirectUri = getMetaOAuthRedirectUri();
    return `Konfigurasi Meta OAuth belum lengkap. Variabel env yang belum diset: ${missing.join(", ")}. Redirect URI yang diharapkan: ${redirectUri}.`;
  }

  return "Konfigurasi Meta OAuth belum lengkap.";
}

export function getMetaOAuthConfig(
  options: OAuthSiteOriginOptions = {},
): MetaOAuthConfig {
  const missing = getMissingMetaOAuthEnvVars(options);
  if (missing.length > 0) {
    throw new Error(formatMetaOAuthConfigError());
  }

  const appId = process.env.META_APP_ID!.trim();
  const appSecret = process.env.META_APP_SECRET!.trim();

  return {
    appId,
    appSecret,
    redirectUri: getMetaOAuthRedirectUri(options),
  };
}

export function formatNoInstagramBusinessAccountError(pageName: string) {
  return `Facebook Page "${pageName}" belum terhubung ke Instagram Business Account. Hubungkan Instagram Business di Meta Business Suite, lalu coba lagi.`;
}

export function formatNoPagesWithInstagramError() {
  return "Hubungkan Instagram Business Account ke Facebook Page di Meta Business Suite.";
}

export function formatNoFacebookPagesError() {
  return "Tidak ada Facebook Page yang dapat diakses. Pastikan akun Meta Anda mengelola minimal satu Facebook Page.";
}

export function buildMetaOAuthUrl(
  state: string,
  options: OAuthSiteOriginOptions = {},
) {
  const { appId, redirectUri } = getMetaOAuthConfig(options);
  const scopes = META_OAUTH_SCOPES.join(",");

  const url = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);

  const diagnostics = getOAuthRedirectDiagnostics(options);
  diagnostics.oauthUrl = url.toString();
  logOAuthRedirect("redirect to Meta OAuth dialog", diagnostics);

  return url.toString();
}

export function createOAuthStatePayload(input: {
  organizationId: string;
  userId: string;
  returnTo?: string;
}): { state: string; signedValue: string } {
  const state = randomBytes(24).toString("hex");
  const payload: InstagramOAuthStatePayload = {
    state,
    organizationId: input.organizationId,
    userId: input.userId,
    returnTo: input.returnTo ?? "/settings/integrations",
    exp: Date.now() + 10 * 60 * 1000,
  };

  return { state, signedValue: createSignedCookieValue(payload) };
}

async function graphOAuthFetchUrl<T>(url: string): Promise<{
  data: T | null;
  error: MetaGraphApiError | null;
  status: number;
}> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T & { error?: MetaGraphApiError };

  if (!response.ok || payload.error) {
    return {
      data: null,
      error: payload.error ?? { message: `Meta OAuth request failed (${response.status})` },
      status: response.status,
    };
  }

  return {
    data: payload,
    error: null,
    status: response.status,
  };
}

async function graphOAuthGet<T>(url: string): Promise<T> {
  const result = await graphOAuthFetchUrl<T>(url);
  if (result.error) {
    throw new Error(result.error.message ?? `Meta OAuth request failed (${result.status})`);
  }

  return result.data as T;
}

export async function exchangeCodeForUserAccessToken(
  code: string,
  options: OAuthSiteOriginOptions = {},
) {
  const { appId, appSecret, redirectUri } = getMetaOAuthConfig(options);
  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await graphOAuthGet<OAuthTokenResponse>(url.toString());
  if (!response.access_token) {
    throw new Error("Meta OAuth tidak mengembalikan access token.");
  }

  return response.access_token;
}

export async function exchangeForLongLivedUserToken(shortLivedToken: string) {
  const { appId, appSecret } = getMetaOAuthConfig();
  const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  try {
    const response = await graphOAuthGet<OAuthTokenResponse>(url.toString());
    return response.access_token ?? shortLivedToken;
  } catch {
    return shortLivedToken;
  }
}

export async function fetchFacebookPages(
  userAccessToken: string,
): Promise<{
  pages: FacebookOAuthPageOption[];
  rawAccounts: FacebookPageAccount[];
}> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userAccessToken);
  url.searchParams.set("limit", "100");

  const response = await graphOAuthGet<FacebookAccountsResponse>(url.toString());
  const rawAccounts = response.data ?? [];
  const pages: FacebookOAuthPageOption[] = [];

  for (const page of rawAccounts) {
    if (!page.id || !page.access_token) {
      continue;
    }

    pages.push({
      pageId: page.id,
      pageName: page.name ?? "Facebook Page",
      pageAccessToken: page.access_token,
    });
  }

  return { pages, rawAccounts };
}

type DirectInstagramValidationResult = {
  instagramBusinessAccountId: string;
  data: {
    id?: string;
    username?: string;
    followers_count?: number;
    media_count?: number;
  } | null;
  error: MetaGraphApiError | null;
};

export async function fetchGrantedMetaPermissions(userAccessToken: string) {
  const url = new URL(`${GRAPH_API_BASE}/me/permissions`);
  url.searchParams.set("access_token", userAccessToken);
  const result = await graphOAuthFetchUrl<MetaPermissionsResponse>(url.toString());
  const permissions = normalizeGrantedPermissions(result.data?.data ?? []);

  if (isDevOAuthLogging()) {
    console.log("[Instagram OAuth] GET /me/permissions:");
    for (const row of permissions) {
      console.log("[Instagram OAuth] permission:", row);
    }

    if (result.error) {
      console.log(
        "[Instagram OAuth] GET /me/permissions Graph API error:",
        result.error,
      );
    }
  }

  return permissions;
}

function normalizeGrantedPermissions(
  rows: MetaPermissionRow[],
): MetaGrantedPermission[] {
  return rows
    .filter(
      (row): row is MetaPermissionRow & { permission: string; status: string } =>
        typeof row.permission === "string" &&
        row.permission.length > 0 &&
        typeof row.status === "string",
    )
    .map((row) => ({
      permission: row.permission,
      status: row.status,
    }));
}

export async function validateDirectInstagramBusinessAccount(
  instagramBusinessAccountId: string,
  pageAccessToken: string,
): Promise<DirectInstagramValidationResult> {
  const url = new URL(`${GRAPH_API_BASE}/${instagramBusinessAccountId}`);
  url.searchParams.set("fields", "id,username,followers_count,media_count");
  url.searchParams.set("access_token", pageAccessToken);

  const result = await graphOAuthFetchUrl<{
    id?: string;
    username?: string;
    followers_count?: number;
    media_count?: number;
  }>(url.toString());

  return {
    instagramBusinessAccountId,
    data: result.data,
    error: result.error,
  };
}

export async function fetchPageInstagramAccounts(
  pageId: string,
  pageAccessToken: string,
): Promise<PageInstagramLookupResult> {
  const primaryFields = "instagram_business_account,connected_instagram_account";
  const detailFields =
    "name,instagram_business_account{id,username},connected_instagram_account{id,username}";

  const primaryUrl = new URL(`${GRAPH_API_BASE}/${pageId}`);
  primaryUrl.searchParams.set("fields", primaryFields);
  primaryUrl.searchParams.set("access_token", pageAccessToken);

  const primary = await graphOAuthFetchUrl<PageInstagramLookupResponse>(
    primaryUrl.toString(),
  );

  if (isDevOAuthLogging()) {
    console.log(
      `[Instagram OAuth] GET /${pageId}?fields=${primaryFields}`,
    );
    console.log("[Instagram OAuth] Page Instagram lookup (primary):", {
      pageId,
      hasPageAccessToken: Boolean(pageAccessToken),
      rawResponseKeys: primary.data ? Object.keys(primary.data) : [],
      instagram_business_account:
        primary.data?.instagram_business_account ?? null,
      connected_instagram_account:
        primary.data?.connected_instagram_account ?? null,
      graphApiError: primary.error ?? null,
      graphApiErrorMessage: formatMetaGraphApiErrorForDev(primary.error) ?? null,
    });
  }

  let fieldsUsed = primaryFields;
  let latest = primary;

  const primaryInstagramBusinessAccount = parseInstagramGraphAccount(
    primary.data?.instagram_business_account,
  );
  const primaryConnectedInstagramAccount = parseConnectedInstagramAccount(
    primary.data?.connected_instagram_account,
  );
  const primaryIgId =
    primaryInstagramBusinessAccount?.id ?? primaryConnectedInstagramAccount?.id;

  if (!primary.error && !primaryIgId) {
    const detailUrl = new URL(`${GRAPH_API_BASE}/${pageId}`);
    detailUrl.searchParams.set("fields", detailFields);
    detailUrl.searchParams.set("access_token", pageAccessToken);

    const detail = await graphOAuthFetchUrl<PageInstagramLookupResponse>(
      detailUrl.toString(),
    );

    fieldsUsed = `${primaryFields} -> ${detailFields}`;
    latest = detail.error && primary.data ? primary : detail;
  }

  const instagramBusinessAccount = parseInstagramGraphAccount(
    latest.data?.instagram_business_account,
  );
  const connectedInstagramAccount = parseConnectedInstagramAccount(
    latest.data?.connected_instagram_account,
  );
  const resolvedInstagramAccountId =
    instagramBusinessAccount?.id ?? connectedInstagramAccount?.id;

  return {
    pageName: latest.data?.name,
    instagramBusinessAccountId: resolvedInstagramAccountId,
    connectedInstagramAccountId: connectedInstagramAccount?.id,
    instagramUsername:
      instagramBusinessAccount?.username ??
      connectedInstagramAccount?.username ??
      "",
    instagramBusinessAccount,
    connectedInstagramAccount,
    fetchError: latest.error,
    fieldsUsed,
    rawResponse: (latest.data as Record<string, unknown> | null) ?? null,
  };
}

function logFacebookPagesFromAccounts(rawAccounts: FacebookPageAccount[]) {
  console.log("[Instagram OAuth] GET /me/accounts?fields=id,name,access_token");
  for (const page of rawAccounts) {
    console.log("[Instagram OAuth] page:", {
      pageId: page.id ?? null,
      pageName: page.name ?? null,
      hasPageAccessToken: Boolean(page.access_token),
    });
  }
}

function logPageInstagramLookup(
  page: FacebookOAuthPageOption,
  lookup: PageInstagramLookupResult,
) {
  const rawResponse = lookup.rawResponse ?? {};

  console.log(
    `[Instagram OAuth] GET /${page.pageId}?fields=instagram_business_account,connected_instagram_account`,
  );
  console.log("[Instagram OAuth] Page Instagram lookup:", {
    pageId: page.pageId,
    pageName: lookup.pageName ?? page.pageName,
    hasPageAccessToken: Boolean(page.pageAccessToken),
    fieldsUsed: lookup.fieldsUsed,
    rawResponseKeys: Object.keys(rawResponse),
    instagram_business_account:
      rawResponse.instagram_business_account ?? null,
    connected_instagram_account:
      rawResponse.connected_instagram_account ?? null,
    resolvedInstagramAccountId: lookup.instagramBusinessAccountId ?? null,
    graphApiError: lookup.fetchError ?? null,
    graphApiErrorMessage: formatMetaGraphApiErrorForDev(lookup.fetchError) ?? null,
  });
}

async function logDirectInstagramValidationForPage(
  page: FacebookOAuthPageOption,
  instagramBusinessAccountId: string,
) {
  const validation = await validateDirectInstagramBusinessAccount(
    instagramBusinessAccountId,
    page.pageAccessToken,
  );

  console.log(
    `[Instagram OAuth] GET /${instagramBusinessAccountId}?fields=id,username,followers_count,media_count`,
  );
  console.log("[Instagram OAuth] Direct IG validation:", {
    pageId: page.pageId,
    pageName: page.pageName,
    instagramBusinessAccountId,
    hasPageAccessToken: Boolean(page.pageAccessToken),
    rawResponseKeys: validation.data ? Object.keys(validation.data) : [],
    data: validation.data,
    graphApiError: validation.error ?? null,
    graphApiErrorMessage:
      formatMetaGraphApiErrorForDev(validation.error) ?? null,
  });

  return validation;
}

export async function enrichFacebookPagesWithInstagram(
  pages: FacebookOAuthPageOption[],
): Promise<FacebookOAuthPageWithInstagram[]> {
  const enriched: FacebookOAuthPageWithInstagram[] = [];
  const debugInstagramBusinessAccountId = getDebugInstagramBusinessAccountId();

  for (const page of pages) {
    const lookup = await fetchPageInstagramAccounts(page.pageId, page.pageAccessToken);

    if (isDevOAuthLogging()) {
      logPageInstagramLookup(page, lookup);
      if (debugInstagramBusinessAccountId) {
        await logDirectInstagramValidationForPage(
          page,
          debugInstagramBusinessAccountId,
        );
      }
    }

    enriched.push({
      pageId: page.pageId,
      pageName: lookup.pageName ?? page.pageName,
      pageAccessToken: page.pageAccessToken,
      hasAccessToken: Boolean(page.pageAccessToken),
      hasInstagramConnected: Boolean(lookup.instagramBusinessAccountId),
      instagramBusinessAccountId: lookup.instagramBusinessAccountId,
      connectedInstagramAccountId: lookup.connectedInstagramAccountId,
      instagramUsername: lookup.instagramUsername,
      instagramBusinessAccount: lookup.instagramBusinessAccount,
      connectedInstagramAccount: lookup.connectedInstagramAccount,
      instagramFetchError: formatMetaGraphApiErrorForDev(lookup.fetchError),
      instagramFieldsUsed: lookup.fieldsUsed,
    });
  }

  return enriched;
}

export function logOAuthPageDiscovery(input: {
  permissions: MetaGrantedPermission[];
  rawAccounts: FacebookPageAccount[];
  pages: FacebookOAuthPageOption[];
  pagesWithInstagram: FacebookOAuthPageWithInstagram[];
}) {
  if (!isDevOAuthLogging()) {
    return;
  }

  const requiredPermissions = [...META_OAUTH_SCOPES];
  const grantedPermissions = input.permissions
    .filter((row) => row.status === "granted")
    .map((row) => row.permission);

  console.log(
    "[Instagram OAuth] Required permissions check:",
    Object.fromEntries(
      requiredPermissions.map((permission) => [
        permission,
        grantedPermissions.includes(permission),
      ]),
    ),
  );

  logFacebookPagesFromAccounts(input.rawAccounts);

  console.log(
    "[Instagram OAuth] Connectable pages:",
    input.pagesWithInstagram
      .filter((page) => page.hasInstagramConnected)
      .map((page) => ({
        pageId: page.pageId,
        pageName: page.pageName,
        instagramBusinessAccountId: page.instagramBusinessAccountId ?? null,
        connectedInstagramAccountId: page.connectedInstagramAccountId ?? null,
        instagramUsername: page.instagramUsername ?? null,
      })),
  );

  console.log(
    "[Instagram OAuth] Pages without Instagram:",
    input.pagesWithInstagram
      .filter((page) => !page.hasInstagramConnected)
      .map((page) => ({
        pageId: page.pageId,
        pageName: page.pageName,
        instagramFetchError: page.instagramFetchError ?? null,
        instagramBusinessAccount: page.instagramBusinessAccount ?? null,
        connectedInstagramAccount: page.connectedInstagramAccount ?? null,
      })),
  );
}

export function getInstagramAccessToken(
  metadata: InstagramIntegrationMetadata,
): string | undefined {
  return metadata.pageAccessToken ?? metadata.accessToken;
}

export function isInstagramIntegrationConfigured(
  metadata: InstagramIntegrationMetadata,
): boolean {
  return Boolean(
    getInstagramAccessToken(metadata) && metadata.instagramBusinessAccountId,
  );
}

export function toPublicInstagramMetadata(
  metadata: InstagramIntegrationMetadata,
): Record<string, string | number | null> {
  return {
    connectedAccount: metadata.connectedAccount ?? metadata.pageName ?? null,
    pageName: metadata.pageName ?? null,
    username: metadata.instagramUsername ?? metadata.username ?? null,
    followersCount: metadata.followersCount ?? null,
    lastSyncedAt: metadata.lastSyncedAt ?? null,
    businessAccountStatus: metadata.businessAccountStatus ?? null,
    connectionMethod: metadata.connectionMethod ?? null,
  };
}

export const SENSITIVE_INSTAGRAM_METADATA_KEYS = new Set([
  "accessToken",
  "pageAccessToken",
]);
