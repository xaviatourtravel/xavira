import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { finalizeInstagramPageSelection } from "@/app/(dashboard)/settings/integrations/instagram/actions";
import { InstagramOAuthDebugPanel } from "@/components/instagram/instagram-oauth-debug-panel";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  INSTAGRAM_OAUTH_PENDING_COOKIE,
  parseSignedCookieValue,
  type InstagramOAuthPendingPayload,
} from "@/lib/instagram/oauth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getSafeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/settings/integrations";
  }
  return value;
}

export default async function InstagramSelectPagePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/settings/integrations");
  }

  const returnTo = getSafeReturnTo(params.returnTo);
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(INSTAGRAM_OAUTH_PENDING_COOKIE)?.value;
  const pending = parseSignedCookieValue<InstagramOAuthPendingPayload>(
    pendingCookie,
  );

  if (
    !pending ||
    pending.organizationId !== profile.organization_id ||
    pending.userId !== profile.id ||
    pending.pages.length === 0
  ) {
    redirect(
      `${returnTo}?error=${encodeURIComponent("Sesi pemilihan halaman kedaluwarsa. Coba hubungkan lagi.")}`,
    );
  }

  const connectablePages = pending.pages.filter(
    (page) => page.hasInstagramConnected,
  );
  const showDebugPanel =
    process.env.NODE_ENV === "development" &&
    Boolean(pending.debugSnapshot && pending.oauthScopesRequested);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pilih Facebook Page</h1>
        <p className="text-sm text-muted-foreground">
          Pilih Facebook Page yang sudah terhubung ke Instagram Business
          Account. Halaman tanpa Instagram tidak dapat dipilih.
        </p>
      </div>

      {showDebugPanel ? (
        <InstagramOAuthDebugPanel
          oauthScopesRequested={pending.oauthScopesRequested!}
          snapshot={pending.debugSnapshot!}
        />
      ) : null}

      {connectablePages.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Tidak ada Facebook Page dengan Instagram Business Account yang
          terdeteksi dari Graph API. Hubungkan Instagram Business Account ke
          Facebook Page di Meta Business Suite, lalu coba lagi.
        </div>
      ) : null}

      <form action={finalizeInstagramPageSelection} className="space-y-4">
        <input type="hidden" name="return_to" value={returnTo} />

        <div className="space-y-3">
          {pending.pages.map((page) => {
            const isConnectable = page.hasInstagramConnected;

            return (
              <label
                key={page.pageId}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                  isConnectable
                    ? "cursor-pointer hover:bg-accent/40"
                    : "cursor-not-allowed bg-muted/30 opacity-70",
                )}
              >
                <input
                  type="radio"
                  name="page_id"
                  value={page.pageId}
                  disabled={!isConnectable}
                  required={isConnectable}
                  className="mt-1"
                  defaultChecked={
                    connectablePages.length === 1 && isConnectable
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{page.pageName}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Page ID: {page.pageId}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    instagram_business_account:{" "}
                    {page.instagramBusinessAccount?.id ?? "—"}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    connected_instagram_account:{" "}
                    {page.connectedInstagramAccountId ?? "—"}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-sm",
                      isConnectable
                        ? "text-green-700"
                        : "text-muted-foreground",
                    )}
                  >
                    {isConnectable
                      ? `Instagram terhubung: @${page.instagramUsername || "instagram"}`
                      : page.instagramFetchError
                        ? `Graph API: ${page.instagramFetchError}`
                        : "Instagram belum terhubung ke halaman ini"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={connectablePages.length === 0}>
            Simpan Koneksi
          </Button>
          <Link
            href={returnTo}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
