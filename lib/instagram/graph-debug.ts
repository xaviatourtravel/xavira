import { GRAPH_API_BASE } from "@/lib/instagram/constants";

export type InstagramGraphDebugSection = {
  request: string;
  status: number;
  body: unknown;
};

export type InstagramGraphPageDebugSection = InstagramGraphDebugSection & {
  pageId: string;
  pageName: string | null;
  hasPageAccessToken: boolean;
};

export type InstagramGraphDebugSnapshot = {
  fetchedAt: string;
  notes: string[];
  permissions: InstagramGraphDebugSection;
  accounts: InstagramGraphDebugSection;
  pages: InstagramGraphPageDebugSection[];
};

const SENSITIVE_JSON_KEYS = new Set([
  "access_token",
  "accessToken",
  "pageaccesstoken",
  "page_access_token",
  "token",
  "fb_exchange_token",
]);

function maskTokenValue(value: string) {
  if (value.length <= 8) {
    return "***";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function maskSensitiveGraphValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveGraphValues(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const masked: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      SENSITIVE_JSON_KEYS.has(key.toLowerCase())
    ) {
      masked[key] = maskTokenValue(child);
      continue;
    }

    masked[key] = maskSensitiveGraphValues(child);
  }

  return masked;
}

async function fetchGraphApiRaw(url: string): Promise<{
  status: number;
  body: unknown;
}> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  return { status: response.status, body };
}

function buildSection(request: string, result: { status: number; body: unknown }) {
  return {
    request,
    status: result.status,
    body: maskSensitiveGraphValues(result.body),
  };
}

type AccountsPageRow = {
  id?: string;
  name?: string;
  access_token?: string;
};

export async function buildInstagramGraphDebugSnapshot(
  userAccessToken: string,
): Promise<InstagramGraphDebugSnapshot> {
  const permissionsUrl = new URL(`${GRAPH_API_BASE}/me/permissions`);
  permissionsUrl.searchParams.set("access_token", userAccessToken);

  const accountsUrl = new URL(`${GRAPH_API_BASE}/me/accounts`);
  accountsUrl.searchParams.set("fields", "id,name,access_token");
  accountsUrl.searchParams.set("access_token", userAccessToken);
  accountsUrl.searchParams.set("limit", "100");

  const [permissions, accounts] = await Promise.all([
    fetchGraphApiRaw(permissionsUrl.toString()),
    fetchGraphApiRaw(accountsUrl.toString()),
  ]);

  const accountRows = Array.isArray((accounts.body as { data?: unknown })?.data)
    ? ((accounts.body as { data: AccountsPageRow[] }).data ?? [])
    : [];

  const pages: InstagramGraphPageDebugSection[] = [];

  for (const page of accountRows) {
    if (!page.id) {
      continue;
    }

    const pageFields =
      "id,name,instagram_business_account,connected_instagram_account";
    const pageUrl = new URL(`${GRAPH_API_BASE}/${page.id}`);
    pageUrl.searchParams.set("fields", pageFields);

    if (page.access_token) {
      pageUrl.searchParams.set("access_token", page.access_token);
    } else {
      pageUrl.searchParams.set("access_token", userAccessToken);
    }

    const pageResult = await fetchGraphApiRaw(pageUrl.toString());

    pages.push({
      pageId: page.id,
      pageName: page.name ?? null,
      hasPageAccessToken: Boolean(page.access_token),
      request: `GET /${page.id}?fields=${pageFields}`,
      status: pageResult.status,
      body: maskSensitiveGraphValues(pageResult.body),
    });
  }

  return {
    fetchedAt: new Date().toISOString(),
    notes: [
      "Development-only debug snapshot.",
      "Access tokens are masked in displayed JSON.",
      "Page lookups use each page access token when available.",
    ],
    permissions: buildSection("GET /me/permissions", permissions),
    accounts: buildSection(
      "GET /me/accounts?fields=id,name,access_token",
      accounts,
    ),
    pages,
  };
}

export function formatDebugJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
