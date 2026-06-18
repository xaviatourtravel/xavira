import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import {
  buildMetaOAuthUrl,
  createOAuthStatePayload,
  formatMetaOAuthConfigError,
  getMissingMetaOAuthEnvVars,
  INSTAGRAM_OAUTH_STATE_COOKIE,
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    return NextResponse.redirect(
      new URL(
        "/settings/integrations?error=Hanya%20admin%20atau%20owner%20yang%20dapat%20menghubungkan%20Instagram.",
        request.url,
      ),
    );
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

    return NextResponse.redirect(buildMetaOAuthUrl(state, { request }));
  } catch (error) {
    console.error("Instagram OAuth connect failed", error);
    const message = getConnectErrorMessage(error);
    const url = new URL("/settings/integrations", request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
