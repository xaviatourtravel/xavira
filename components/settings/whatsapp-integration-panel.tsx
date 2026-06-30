"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Unplug,
} from "lucide-react";

import { DesklabsButton } from "@/components/ui/desklabs-button";
import { designSystemPanelClass } from "@/lib/design-system/tokens";
import type {
  WhatsAppConnectResponse,
  WhatsAppDisconnectResponse,
  WhatsAppQrResponse,
  WhatsAppStatusResponse,
} from "@/lib/integrations/whatsapp/types";
import { cn } from "@/lib/utils";

type WhatsAppIntegrationPanelProps = {
  canManage: boolean;
};

type PanelState = {
  status: "disconnected" | "connecting" | "connected";
  instanceName: string;
  phoneNumber: string | null;
  profileName: string | null;
  lastConnectedAt: string | null;
  connectionStatus: string | null;
  qrBase64: string | null;
  error: string | null;
  loading: boolean;
  actionPending: boolean;
};

const INITIAL_STATE: PanelState = {
  status: "disconnected",
  instanceName: "desklabs-local",
  phoneNumber: null,
  profileName: null,
  lastConnectedAt: null,
  connectionStatus: null,
  qrBase64: null,
  error: null,
  loading: true,
  actionPending: false,
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPhoneNumber(value: string | null) {
  if (!value) {
    return "-";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  return value;
}

function getStatusLabel(status: PanelState["status"]) {
  switch (status) {
    case "connected":
      return "Terhubung";
    case "connecting":
      return "Menunggu Scan QR";
    default:
      return "Belum Terhubung";
  }
}

function getStatusBadgeClass(status: PanelState["status"]) {
  switch (status) {
    case "connected":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30";
    case "connecting":
      return "bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30";
    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

type ApiEnvelope<T> =
  | ({ ok: true } & T)
  | { ok: false; message?: string; error?: string };

function getApiErrorMessage(payload: ApiEnvelope<unknown>, fallback: string) {
  if (payload.ok) {
    return fallback;
  }

  return payload.message?.trim() || fallback;
}

export function WhatsAppIntegrationPanel({ canManage }: WhatsAppIntegrationPanelProps) {
  const [state, setState] = useState<PanelState>(INITIAL_STATE);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const applyStatus = useCallback((payload: WhatsAppStatusResponse) => {
    setState((current) => ({
      ...current,
      status: payload.status,
      instanceName: payload.instanceName,
      phoneNumber: payload.phoneNumber,
      profileName: payload.profileName,
      lastConnectedAt: payload.lastConnectedAt,
      connectionStatus: payload.connectionStatus,
      loading: false,
      error: null,
      qrBase64: payload.status === "connected" ? null : current.qrBase64,
    }));
  }, []);

  const refreshStatus = useCallback(async () => {
    const response = await fetch("/api/integrations/whatsapp/status", {
      cache: "no-store",
    });
    const payload = await readJson<ApiEnvelope<WhatsAppStatusResponse>>(response);

    if (!response.ok || !payload.ok) {
      throw new Error(
        getApiErrorMessage(
          payload,
          "Gagal memuat status WhatsApp. Silakan coba lagi.",
        ),
      );
    }

    applyStatus(payload);
    return payload;
  }, [applyStatus]);

  const loadInitialStatus = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const payload = await refreshStatus();

      if (payload.status === "connecting") {
        const qrResponse = await fetch("/api/integrations/whatsapp/qr", {
          cache: "no-store",
        });
        const qrPayload = await readJson<ApiEnvelope<WhatsAppQrResponse>>(qrResponse);

        if (qrResponse.ok && qrPayload.ok && qrPayload.qrBase64) {
          setState((current) => ({
            ...current,
            qrBase64: qrPayload.qrBase64,
          }));
        }
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat status WhatsApp. Silakan coba lagi.",
      }));
    }
  }, [refreshStatus]);

  useEffect(() => {
    void loadInitialStatus();
    return () => stopPolling();
  }, [loadInitialStatus, stopPolling]);

  useEffect(() => {
    stopPolling();

    if (state.status !== "connecting") {
      return;
    }

    pollRef.current = window.setInterval(() => {
      void refreshStatus().catch(() => {
        // Keep polling quietly; user can reload QR manually if needed.
      });
    }, 3000);

    return () => stopPolling();
  }, [refreshStatus, state.status, stopPolling]);

  async function handleConnect() {
    setState((current) => ({
      ...current,
      actionPending: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
      });
      const payload = await readJson<ApiEnvelope<WhatsAppConnectResponse>>(response);

      if (!response.ok || !payload.ok) {
        throw new Error(
          getApiErrorMessage(
            payload,
            "Gagal menghubungkan WhatsApp. Silakan coba lagi.",
          ),
        );
      }

      setState((current) => ({
        ...current,
        status: payload.status,
        instanceName: payload.instanceName,
        qrBase64: payload.qrBase64,
        actionPending: false,
        loading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        actionPending: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghubungkan WhatsApp. Silakan coba lagi.",
      }));
    }
  }

  async function handleReloadQr() {
    setState((current) => ({
      ...current,
      actionPending: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/integrations/whatsapp/qr", {
        cache: "no-store",
      });
      const payload = await readJson<ApiEnvelope<WhatsAppQrResponse>>(response);

      if (!response.ok || !payload.ok) {
        throw new Error(
          getApiErrorMessage(payload, "Gagal memuat ulang QR. Silakan coba lagi."),
        );
      }

      setState((current) => ({
        ...current,
        status: payload.qrBase64 ? "connecting" : current.status,
        qrBase64: payload.qrBase64,
        actionPending: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        actionPending: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat ulang QR. Silakan coba lagi.",
      }));
    }
  }

  async function handleDisconnect() {
    setState((current) => ({
      ...current,
      actionPending: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
      });
      const payload = await readJson<ApiEnvelope<WhatsAppDisconnectResponse>>(response);

      if (!response.ok || !payload.ok) {
        throw new Error(
          getApiErrorMessage(
            payload,
            "Gagal memutuskan koneksi WhatsApp. Silakan coba lagi.",
          ),
        );
      }

      setState((current) => ({
        ...current,
        status: payload.status,
        qrBase64: null,
        phoneNumber: null,
        profileName: null,
        lastConnectedAt: null,
        connectionStatus: null,
        actionPending: false,
      }));

      await refreshStatus();
    } catch (error) {
      setState((current) => ({
        ...current,
        actionPending: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memutuskan koneksi WhatsApp. Silakan coba lagi.",
      }));
    }
  }

  async function handleSync() {
    setState((current) => ({
      ...current,
      actionPending: true,
      error: null,
    }));

    try {
      await refreshStatus();
    } catch (error) {
      setState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "Gagal menyinkronkan status WhatsApp. Silakan coba lagi.",
      }));
    } finally {
      setState((current) => ({
        ...current,
        actionPending: false,
      }));
    }
  }

  return (
    <div className="space-y-6">
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {state.error}
        </div>
      ) : null}

      {!canManage ? (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Anda hanya dapat melihat status. Hubungi admin workspace untuk
          menghubungkan WhatsApp.
        </div>
      ) : null}

      <section className={cn(designSystemPanelClass, "overflow-hidden")}>
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Status Koneksi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pantau koneksi WhatsApp workspace Anda dari sini.
                </p>
              </div>
            </div>

            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                getStatusBadgeClass(state.status),
              )}
            >
              {state.loading ? "Memuat..." : getStatusLabel(state.status)}
            </span>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-6">
          {state.loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {!state.loading && state.status === "disconnected" ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Smartphone className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium text-foreground">
                  WhatsApp belum terhubung
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hubungkan nomor WhatsApp agar percakapan customer dapat masuk
                  ke Inbox Desklabs.
                </p>
              </div>

              {canManage ? (
                <div className="flex justify-end">
                  <DesklabsButton
                    type="button"
                    onClick={() => void handleConnect()}
                    loading={state.actionPending}
                    loadingLabel="Menyiapkan QR..."
                    className="h-11 w-full sm:w-auto"
                  >
                    Hubungkan WhatsApp
                  </DesklabsButton>
                </div>
              ) : null}
            </div>
          ) : null}

          {!state.loading && state.status === "connecting" ? (
            <div className="space-y-5">
              <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-sm">
                {state.qrBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.qrBase64}
                    alt="QR Code WhatsApp"
                    className="mx-auto h-auto w-full max-w-[280px] rounded-xl"
                  />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Buka WhatsApp di HP Anda, pilih Perangkat Tertaut, lalu scan QR
                ini.
              </div>

              {canManage ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <DesklabsButton
                    type="button"
                    variant="outline"
                    onClick={() => void handleReloadQr()}
                    loading={state.actionPending}
                    loadingLabel="Memuat QR..."
                    className="h-11 w-full sm:w-auto"
                  >
                    Muat Ulang QR
                  </DesklabsButton>
                </div>
              ) : null}
            </div>
          ) : null}

          {!state.loading && state.status === "connected" ? (
            <div className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Instance
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {state.instanceName}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nomor WhatsApp
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatPhoneNumber(state.phoneNumber)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Terakhir Terhubung
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatDateTime(state.lastConnectedAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status Koneksi
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {state.connectionStatus || "Terhubung"}
                  </dd>
                </div>
              </dl>

              {state.profileName ? (
                <p className="text-sm text-muted-foreground">
                  Profil WhatsApp:{" "}
                  <span className="font-medium text-foreground">
                    {state.profileName}
                  </span>
                </p>
              ) : null}

              {canManage ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <DesklabsButton
                    type="button"
                    variant="outline"
                    onClick={() => void handleSync()}
                    loading={state.actionPending}
                    loadingLabel="Menyinkronkan..."
                    className="h-11 w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sinkronkan Ulang
                  </DesklabsButton>
                  <DesklabsButton
                    type="button"
                    variant="outline"
                    onClick={() => void handleDisconnect()}
                    loading={state.actionPending}
                    loadingLabel="Memutuskan..."
                    className="h-11 w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10 sm:w-auto"
                  >
                    <Unplug className="h-4 w-4" />
                    Putuskan Koneksi
                  </DesklabsButton>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Webhook pesan masuk</p>
        <p className="mt-1 leading-relaxed">
          Aktifkan hanya event <span className="font-medium">MESSAGES_UPSERT</span>{" "}
          di Evolution. Hindari mengaktifkan semua event agar log tetap bersih.
        </p>
        <Link
          href="/settings/integrations/whatsapp/webhook"
          className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          Atur webhook WhatsApp
        </Link>
      </div>
    </div>
  );
}
