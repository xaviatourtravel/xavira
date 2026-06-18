import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import {
  buildMetaOAuthUrl,
  createOAuthStatePayload,
  formatMetaOAuthConfigError,
  getMissingMetaOAuthEnvVars,
  getOAuthRedirectDiagnostics,
  INSTAGRAM_OAUTH_STATE_COOKIE,
  logOAuthRedirect,
} from "@/lib/instagram/oauth";

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/settings/integrations";
  }
  return value;
}

function getConnectErrorMessage(error: unknown) {
  if (getMissingMetaOAuthEnvVars().length > 0) {
    return formatMetaOAuthConfigError();
  }

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return error.message;
  }

  return "Konfigurasi Meta OAuth belum lengkap.";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logOAuthRedirect(
      "redirect to login",
      getOAuthRedirectDiagnostics({ request }),
      { targetPath: "/login" },
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    const target = new URL(
      "/settings/integrations?error=Hanya%20admin%20atau%20owner%20yang%20dapat%20menghubungkan%20Instagram.",
      request.url,
    );
    logOAuthRedirect(
      "redirect unauthorized connect attempt",
      getOAuthRedirectDiagnostics({ request }),
      { target: target.toString() },
    );
    return NextResponse.redirect(target);
  }

  try {
    const returnTo = getSafeReturnTo(
      request.nextUrl.searchParams.get("returnTo"),
    );
    const { state, signedValue } = createOAuthStatePayload({
      organizationId: profile.organization_id,
      userId: profile.id,
      returnTo,
    });

    const cookieStore = await cookies();
    cookieStore.set(INSTAGRAM_OAUTH_STATE_COOKIE, signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    const oauthUrl = buildMetaOAuthUrl(state, { request });
    logOAuthRedirect(
      "connect route issuing Meta OAuth redirect",
      getOAuthRedirectDiagnostics({ request }),
      { oauthUrl, returnTo },
    );
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error("Instagram OAuth connect failed", error);
    const message = getConnectErrorMessage(error);
    const url = new URL("/settings/integrations", request.url);
    url.searchParams.set("error", message);
    logOAuthRedirect(
      "connect route failed",
      getOAuthRedirectDiagnostics({ request }),
      {
        error: error instanceof Error ? error.message : "connect_failed",
        target: url.toString(),
      },
    );
    return NextResponse.redirect(url);
  }
}
