import Link from "next/link";
import { redirect } from "next/navigation";

import { WebhookSubscriptionPanel } from "@/components/instagram/webhook-subscription-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  checkPageWebhookSubscription,
  fetchStoredPagePermissionsDebug,
  getMetaWebhookCallbackUrl,
  loadInstagramWebhookIntegrationContext,
} from "@/lib/instagram/webhook-subscription";
import { createClient } from "@/utils/supabase/server";

export default async function InstagramWebhookSubscriptionPage() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/settings/integrations");
  }

  const supabase = await createClient();
  const context = await loadInstagramWebhookIntegrationContext(
    supabase,
    profile.organization_id,
  );

  const metaAppId = process.env.META_APP_ID?.trim() || null;
  const webhookCallbackUrl = getMetaWebhookCallbackUrl();

  const initialCheck = context
    ? await checkPageWebhookSubscription(context.pageId, context.pageAccessToken)
    : null;

  const permissionsDebug = context
    ? await fetchStoredPagePermissionsDebug(context.pageAccessToken)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm">
          <Link href="/settings/integrations" className="text-primary hover:underline">
            ← Back to Integrations
          </Link>
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Instagram Webhook Subscription
        </h1>
        <p className="text-sm text-muted-foreground">
          Admin-only debug tool. Verifies that the connected Facebook Page is
          subscribed to the Desklabs Meta app so Instagram DM events reach{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            /api/webhooks/meta
          </code>
          .
        </p>
      </div>

      {!context || !initialCheck ? (
        <Card>
          <CardHeader>
            <CardTitle>Instagram not ready</CardTitle>
            <CardDescription>
              Connect Instagram with a Facebook Page and page access token before
              checking webhook subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/integrations"
              className="text-sm font-medium text-primary hover:underline"
            >
              Go to Integrations
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connected Page</CardTitle>
            <CardDescription>
              Stored integration metadata used for Meta Graph API calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Page name</dt>
                <dd className="font-medium">{context.pageName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Page ID</dt>
                <dd className="font-mono text-xs">{context.pageId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Instagram Business Account ID</dt>
                <dd className="font-mono text-xs">
                  {context.instagramBusinessAccountId}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Integration status</dt>
                <dd className="font-medium">{context.integrationStatus}</dd>
              </div>
            </dl>

            <WebhookSubscriptionPanel
              initialCheck={initialCheck}
              initialPermissionsDebug={permissionsDebug}
              metaAppId={metaAppId}
              webhookCallbackUrl={webhookCallbackUrl}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
