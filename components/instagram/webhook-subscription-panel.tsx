"use client";

import { useState, useTransition } from "react";

import {
  refreshInstagramWebhookSubscription,
  subscribeInstagramPageWebhook,
  type InstagramWebhookActionResult,
} from "@/app/(dashboard)/settings/integrations/instagram/webhook-actions";
import { Button } from "@/components/ui/button";
import {
  PAGE_WEBHOOK_SUBSCRIBED_FIELDS,
  type PageWebhookSubscribeResult,
  type PageWebhookSubscriptionCheckResult,
} from "@/lib/instagram/webhook-subscription";

type WebhookSubscriptionPanelProps = {
  initialCheck: PageWebhookSubscriptionCheckResult;
  metaAppId: string | null;
  webhookCallbackUrl: string;
};

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={
        ok
          ? "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
          : "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"
      }
    >
      {label}
    </span>
  );
}

export function WebhookSubscriptionPanel({
  initialCheck,
  metaAppId,
  webhookCallbackUrl,
}: WebhookSubscriptionPanelProps) {
  const [check, setCheck] = useState(initialCheck);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubscribeLog, setLastSubscribeLog] =
    useState<PageWebhookSubscribeResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyResult(result: InstagramWebhookActionResult) {
    if (result.subscribe) {
      setLastSubscribeLog(result.subscribe);
    }

    if ("check" in result && result.check) {
      setCheck(result.check);
    }

    if (!result.success) {
      setError(result.message);
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(result.message ?? "Status webhook diperbarui.");
  }

  function runRefresh() {
    setError(null);
    startTransition(async () => {
      const result = await refreshInstagramWebhookSubscription();
      applyResult(result);
    });
  }

  function runSubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await subscribeInstagramPageWebhook();
      applyResult(result);
    });
  }

  const hasMessagesField = check.desklabsSubscribedFields.includes("messages");

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge
          ok={check.isDesklabsAppSubscribed}
          label={
            check.isDesklabsAppSubscribed
              ? "Desklabs app subscribed"
              : "Desklabs app not subscribed"
          }
        />
        <StatusBadge
          ok={hasMessagesField}
          label={
            hasMessagesField
              ? "messages field active"
              : "messages field missing"
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={runRefresh}
          disabled={isPending}
        >
          {isPending ? "Memeriksa..." : "Refresh status"}
        </Button>
        <Button type="button" onClick={runSubscribe} disabled={isPending}>
          {isPending ? "Subscribe..." : "Subscribe Page to Webhook"}
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p>
          <strong>Webhook callback URL:</strong> {webhookCallbackUrl}
        </p>
        <p className="mt-2">
          <strong>META_APP_ID:</strong> {metaAppId ?? "Not configured"}
        </p>
        <p className="mt-2">
          <strong>Fields to subscribe:</strong>{" "}
          {PAGE_WEBHOOK_SUBSCRIBED_FIELDS.join(", ")}
        </p>
        <p className="mt-2 text-muted-foreground">
          Instagram DM events are delivered only when the connected Facebook Page
          is subscribed to this Meta app. App-level webhook verification alone is
          not enough.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Subscribed apps</h2>
        {check.subscribedApps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No apps subscribed to this Page, or Meta returned an empty list.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">App</th>
                  <th className="px-4 py-3 text-left font-medium">App ID</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Subscribed fields
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-background">
                {check.subscribedApps.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{app.name}</div>
                      {app.category ? (
                        <div className="text-xs text-muted-foreground">
                          {app.category}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{app.id}</td>
                    <td className="px-4 py-3">
                      {app.subscribed_fields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {app.subscribed_fields.map((field) => (
                            <span
                              key={field}
                              className="rounded bg-muted px-2 py-0.5 text-xs"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {check.error ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-red-700">Meta API error</h2>
          <p className="text-sm text-red-600">{check.error.message}</p>
          {check.error.code ? (
            <p className="text-xs text-muted-foreground">
              Code: {check.error.code}
              {check.error.type ? ` · Type: ${check.error.type}` : ""}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Check request</h2>
        <p className="text-sm text-muted-foreground">
          {check.request} · HTTP {check.httpStatus}
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">
          {formatJson(check.rawBody)}
        </pre>
      </section>

      {lastSubscribeLog ? (
        <section className="space-y-3 rounded-lg border border-dashed p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Subscribe debug log</h2>
            <StatusBadge
              ok={lastSubscribeLog.status === "success"}
              label={
                lastSubscribeLog.status === "success"
                  ? "Subscribe succeeded"
                  : "Subscribe failed"
              }
            />
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">subscribed_fields sent</dt>
              <dd className="font-mono text-xs">
                {lastSubscribeLog.subscribedFieldsSent.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">HTTP status</dt>
              <dd className="font-medium">{lastSubscribeLog.httpStatus}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Request</dt>
              <dd className="font-mono text-xs break-all">
                {lastSubscribeLog.request}
              </dd>
            </div>
          </dl>

          {lastSubscribeLog.error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              <strong>Meta error:</strong> {lastSubscribeLog.error.message}
              {lastSubscribeLog.error.code ? (
                <span className="block text-xs text-muted-foreground">
                  Code: {lastSubscribeLog.error.code}
                  {lastSubscribeLog.error.type
                    ? ` · Type: ${lastSubscribeLog.error.type}`
                    : ""}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Meta API response body</h3>
            <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">
              {formatJson(lastSubscribeLog.rawBody)}
            </pre>
          </div>
        </section>
      ) : null}
    </div>
  );
}
