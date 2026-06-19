"use client";

import Link from "next/link";
import {
  Bot,
  Cloud,
  Facebook,
  HardDrive,
  Instagram,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

import {
  connectIntegration,
  disconnectIntegration,
  markIntegrationPendingSetup,
} from "@/app/(dashboard)/settings/integrations/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { IntegrationProvider } from "@/lib/integrations/constants";
import type { IntegrationCard } from "@/lib/integrations/queries";
import { cn } from "@/lib/utils";

type IntegrationsGridProps = {
  integrations: IntegrationCard[];
  canManage: boolean;
  settingsReturnPath?: string;
};

const PROVIDER_ICONS: Record<IntegrationProvider, LucideIcon> = {
  openai: Bot,
  whatsapp_cloud: Cloud,
  instagram_business: Instagram,
  facebook_page: Facebook,
  google_drive: HardDrive,
};

const STATUS_BADGE_CLASSES: Record<IntegrationCard["status"], string> = {
  connected: "bg-green-100 text-green-700",
  pending_setup: "bg-amber-100 text-amber-700",
  not_connected: "bg-slate-100 text-slate-600",
};

function getInstagramConnectHref(returnPath = "/settings?section=integrations") {
  return `/api/integrations/instagram/connect?returnTo=${encodeURIComponent(returnPath)}`;
}

export function IntegrationsGrid({
  integrations,
  canManage,
  settingsReturnPath = "/settings?section=integrations",
}: IntegrationsGridProps) {
  const [detail, setDetail] = useState<IntegrationCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    provider: IntegrationProvider,
    action: (formData: FormData) => Promise<{ success: boolean; message?: string }>,
  ) {
    setError(null);
    setPendingProvider(provider);

    const formData = new FormData();
    formData.set("provider", provider);

    startTransition(async () => {
      const result = await action(formData);
      setPendingProvider(null);

      if (!result.success) {
        setError(result.message ?? "Gagal memperbarui integrasi.");
      }
    });
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = PROVIDER_ICONS[integration.provider];
          const isRowPending = isPending && pendingProvider === integration.provider;
          const isConnected = integration.status === "connected";
          const isInstagram = integration.provider === "instagram_business";

          return (
            <div
              key={integration.provider}
              className="flex flex-col rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{integration.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_BADGE_CLASSES[integration.status],
                  )}
                >
                  {integration.statusLabel}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDetail(integration)}
                >
                  View Details
                </Button>

                {canManage && (
                  <>
                    {isConnected ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction(integration.provider, disconnectIntegration)
                        }
                        disabled={isRowPending}
                      >
                        Disconnect
                      </Button>
                    ) : isInstagram ? (
                      <a
                        href={getInstagramConnectHref(settingsReturnPath)}
                        className={cn(buttonVariants({ size: "sm" }))}
                      >
                        Connect
                      </a>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          runAction(integration.provider, connectIntegration)
                        }
                        disabled={isRowPending}
                      >
                        Connect
                      </Button>
                    )}

                    {isInstagram ? (
                      <Link
                        href="/content/instagram-analytics"
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                      >
                        Configure
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction(
                            integration.provider,
                            markIntegrationPendingSetup,
                          )
                        }
                        disabled={isRowPending}
                      >
                        Configure
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <IntegrationDetailModal
          integration={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function IntegrationDetailModal({
  integration,
  onClose,
}: {
  integration: IntegrationCard;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{integration.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {integration.statusLabel}
          </p>
        </div>

        <dl className="space-y-3 px-6 py-4 text-sm">
          {integration.detailFields.map((field) => (
            <div
              key={field.key}
              className="flex flex-wrap items-start justify-between gap-3"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="max-w-[60%] text-right font-medium">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
