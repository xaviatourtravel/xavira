import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { saveInstagramConnection } from "@/lib/instagram/integration";
import { buildInstagramGraphDebugSnapshot } from "@/lib/instagram/graph-debug";
import {
  createSignedCookieValue,
  enrichFacebookPagesWithInstagram,
  exchangeCodeForUserAccessToken,
  exchangeForLongLivedUserToken,
  fetchFacebookPages,
  fetchGrantedMetaPermissions,
  formatNoFacebookPagesError,
  getMetaOAuthRedirectUri,
  INSTAGRAM_OAUTH_DEBUG_COOKIE,
  INSTAGRAM_OAUTH_PENDING_COOKIE,
  INSTAGRAM_OAUTH_STATE_COOKIE,
  logOAuthPageDiscovery,
  META_OAUTH_SCOPES,
  parseSignedCookieValue,
  type InstagramOAuthDebugPayload,
  type InstagramOAuthStatePayload,
} from "@/lib/instagram/oauth";
import { createClient } from "@/utils/supabase/server";

function redirectWithError(request: Request, message: string, returnTo: string) {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

function redirectToPageSelector(
  request: Request,
  returnTo: string,
  pendingValue: string,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  cookieStore.set(INSTAGRAM_OAUTH_PENDING_COOKIE, pendingValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const selectUrl = new URL(
    "/settings/integrations/instagram/select-page",
    request.url,
  );
  selectUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(selectUrl);
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;
  const statePayload = parseSignedCookieValue<InstagramOAuthStatePayload>(
    stateCookie,
  );

  const fallbackReturnTo = statePayload?.returnTo ?? "/settings/integrations";
  const queryState = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const stateIsValid = Boolean(
    statePayload && queryState && statePayload.state === queryState,
  );

  if (process.env.NODE_ENV === "development") {
    console.log("[Instagram OAuth] Callback route hit:", request.nextUrl.pathname);
    console.log("[Instagram OAuth] Redirect URI expected:", getMetaOAuthRedirectUri({ request }));
    console.log("[Instagram OAuth] Code received:", Boolean(code));
    console.log("[Instagram OAuth] OAuth error param:", errorParam ?? "none");
    console.log("[Instagram OAuth] State validation:", stateIsValid ? "valid" : "invalid");
  }

  cookieStore.delete(INSTAGRAM_OAUTH_STATE_COOKIE);

  if (errorParam) {
    return redirectWithError(
      request,
      "Autorisasi Meta dibatalkan.",
      fallbackReturnTo,
    );
  }

  if (!stateIsValid) {
    return redirectWithError(
      request,
      "Sesi OAuth tidak valid. Coba hubungkan lagi.",
      fallbackReturnTo,
    );
  }

  if (!code) {
    return redirectWithError(
      request,
      "Kode OAuth tidak ditemukan.",
      fallbackReturnTo,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== statePayload!.userId) {
    return redirectWithError(
      request,
      "Sesi pengguna tidak valid.",
      fallbackReturnTo,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.organization_id !== statePayload!.organizationId) {
    return redirectWithError(
      request,
      "Organisasi tidak valid.",
      fallbackReturnTo,
    );
  }

  try {
    const shortLivedToken = await exchangeCodeForUserAccessToken(code, { request });
    const userAccessToken = await exchangeForLongLivedUserToken(shortLivedToken);

    if (process.env.NODE_ENV === "development") {
      cookieStore.set(
        INSTAGRAM_OAUTH_DEBUG_COOKIE,
        createSignedCookieValue({
          userAccessToken,
          organizationId: profile.organization_id,
          userId: profile.id,
          exp: Date.now() + 30 * 60 * 1000,
        } satisfies InstagramOAuthDebugPayload),
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 60,
        },
      );
    }

    const [permissions, facebookPagesResult] = await Promise.all([
      fetchGrantedMetaPermissions(userAccessToken),
      fetchFacebookPages(userAccessToken),
    ]);
    const { pages, rawAccounts } = facebookPagesResult;

    if (pages.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Instagram OAuth] /me/accounts returned no usable pages:", {
          rawPageCount: rawAccounts.length,
          rawPages: rawAccounts.map((page) => ({
            pageId: page.id ?? null,
            pageName: page.name ?? null,
            hasAccessToken: Boolean(page.access_token),
          })),
        });
      }

      return redirectWithError(
        request,
        formatNoFacebookPagesError(),
        fallbackReturnTo,
      );
    }

    const pagesWithInstagram = await enrichFacebookPagesWithInstagram(pages);

    logOAuthPageDiscovery({
      permissions,
      rawAccounts,
      pages,
      pagesWithInstagram,
    });

    const pendingValue = createSignedCookieValue({
      organizationId: profile.organization_id,
      userId: profile.id,
      returnTo: fallbackReturnTo,
      pages: pagesWithInstagram,
      exp: Date.now() + 10 * 60 * 1000,
      ...(process.env.NODE_ENV === "development"
        ? {
            oauthScopesRequested: META_OAUTH_SCOPES.join(","),
            debugSnapshot: await buildInstagramGraphDebugSnapshot(userAccessToken),
          }
        : {}),
    });

    return redirectToPageSelector(
      request,
      fallbackReturnTo,
      pendingValue,
      cookieStore,
    );
  } catch (error) {
    console.error("Instagram OAuth callback failed", error);
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Gagal menghubungkan Instagram.";
    return redirectWithError(request, message, fallbackReturnTo);
  }
}
