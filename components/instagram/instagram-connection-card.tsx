"use client";

import { useState, useTransition } from "react";
import { Instagram, RefreshCw, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  configureInstagramConnection,
  disconnectInstagramAnalytics,
  syncInstagramAnalytics,
} from "@/app/(dashboard)/content/instagram-analytics/actions";
import type { InstagramConnectionStatus } from "@/lib/instagram/queries";

type InstagramConnectionCardProps = {
  connection: InstagramConnectionStatus;
  canManage: boolean;
  initialMessage?: string | null;
  initialError?: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Belum pernah";
  }
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getInstagramConnectHref() {
  return "/api/integrations/instagram/connect?returnTo=/content/instagram-analytics";
}

export function InstagramConnectionCard({
  connection,
  canManage,
  initialMessage = null,
  initialError = null,
}: InstagramConnectionCardProps) {
  const [showManualConfigure, setShowManualConfigure] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const isConnected =
    connection.status === "connected" && connection.isConfigured;
  const isOAuthConnected =
    isConnected && connection.connectionMethod === "oauth";
  const showManualForm =
    canManage &&
    showManualConfigure &&
    (!isConnected || connection.connectionMethod === "manual");

  function handleSync() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await syncInstagramAnalytics();
      if (result.success) {
        setMessage(result.message ?? "Sinkronisasi berhasil.");
      } else {
        setError(result.message ?? "Gagal sinkronisasi.");
      }
    });
  }

  function handleConfigure(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await configureInstagramConnection(formData);
      if (result.success) {
        setMessage(result.message ?? "Instagram terhubung.");
        setShowManualConfigure(false);
      } else {
        setError(result.message ?? "Gagal mengonfigurasi.");
      }
    });
  }

  function handleDisconnect() {
    if (!window.confirm("Putuskan koneksi Instagram?")) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await disconnectInstagramAnalytics();
      if (result.success) {
        setMessage(result.message ?? "Instagram diputuskan.");
        setShowManualConfigure(false);
      } else {
        setError(result.message ?? "Gagal memutuskan.");
      }
    });
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Instagram className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Instagram Connection</h2>
            <p className="text-sm text-muted-foreground">
              {isOAuthConnected
                ? "Terhubung via Meta OAuth. Token disimpan aman di server."
                : "Hubungkan akun Instagram Business via Meta OAuth atau token manual."}
            </p>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {isConnected ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
                />
                {isPending ? "Sinkronisasi..." : "Sync sekarang"}
              </Button>
            ) : (
              <a
                href={getInstagramConnectHref()}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Connect with Meta
              </a>
            )}

            {isConnected ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                Disconnect
              </Button>
            ) : null}

            {!isOAuthConnected ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowManualConfigure((open) => !open)}
              >
                <Settings2 className="h-4 w-4" />
                {showManualConfigure ? "Tutup manual" : "Token manual"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-semibold">
            {connection.connectionStatusLabel}
          </p>
          {connection.insightsStatusLabel ? (
            <p className="mt-1 text-xs text-amber-700">
              {connection.insightsStatusLabel}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Username</p>
          <p className="mt-1 text-lg font-semibold">
            {connection.username ? `@${connection.username}` : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Facebook Page</p>
          <p className="mt-1 text-sm font-medium">{connection.pageName ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Followers</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(connection.followersCount)}
          </p>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        Last sync: {formatDateTime(connection.lastSyncedAt)}
      </div>

      {!canManage ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Anda memiliki akses lihat saja. Hubungi owner atau admin untuk
          mengonfigurasi atau sinkronisasi.
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm text-green-700">{message}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {showManualForm ? (
        <form
          action={handleConfigure}
          className="mt-4 space-y-4 rounded-lg border p-4"
        >
          <p className="text-sm text-muted-foreground">
            Fallback manual: masukkan Page Access Token dan Instagram Business
            Account ID dari Meta Graph API Explorer.
          </p>
          <div>
            <label className="text-sm font-medium" htmlFor="access_token">
              Page Access Token *
            </label>
            <input
              id="access_token"
              name="access_token"
              required
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="EAAG..."
            />
          </div>
          <div>
            <label
              className="text-sm font-medium"
              htmlFor="instagram_business_account_id"
            >
              Instagram Business Account ID *
            </label>
            <input
              id="instagram_business_account_id"
              name="instagram_business_account_id"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="178414..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan & Hubungkan"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
