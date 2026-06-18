import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  buildInstagramGraphDebugSnapshot,
  formatDebugJson,
} from "@/lib/instagram/graph-debug";
import {
  INSTAGRAM_OAUTH_DEBUG_COOKIE,
  parseSignedCookieValue,
  type InstagramOAuthDebugPayload,
} from "@/lib/instagram/oauth";

function InstagramDebugRouteMarker() {
  return (
    <div
      style={{
        border: "2px solid #16a34a",
        padding: "1rem",
        marginBottom: "1.5rem",
        background: "#f0fdf4",
      }}
    >
      <p>
        <strong>Route registered OK</strong>
      </p>
      <p>
        <strong>File:</strong>{" "}
        app/(dashboard)/settings/integrations/instagram/debug/page.tsx
      </p>
      <p>
        <strong>URL:</strong> /settings/integrations/instagram/debug
      </p>
      <p>
        <strong>NODE_ENV:</strong> {process.env.NODE_ENV ?? "unknown"}
      </p>
    </div>
  );
}

function Section({
  title,
  request,
  status,
  body,
}: {
  title: string;
  request: string;
  status: number;
  body: unknown;
}) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2>{title}</h2>
      <p>
        <strong>Request:</strong> {request}
      </p>
      <p>
        <strong>HTTP status:</strong> {status}
      </p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "#f5f5f5",
          padding: "1rem",
        }}
      >
        {formatDebugJson(body)}
      </pre>
    </section>
  );
}

async function InstagramDebugContent() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return (
      <div style={{ padding: "1rem", background: "#fef2f2" }}>
        <p>
          <strong>Access denied.</strong> Instagram Graph API Debug requires
          owner or admin role.
        </p>
        <p>
          <strong>Current role:</strong> {profile.role}
        </p>
      </div>
    );
  }

  const cookieStore = await cookies();
  const debugCookie = cookieStore.get(INSTAGRAM_OAUTH_DEBUG_COOKIE)?.value;
  const debugPayload = parseSignedCookieValue<InstagramOAuthDebugPayload>(
    debugCookie,
  );

  const hasValidDebugSession =
    Boolean(debugPayload) &&
    debugPayload!.organizationId === profile.organization_id &&
    debugPayload!.userId === profile.id;

  const snapshot = hasValidDebugSession
    ? await buildInstagramGraphDebugSnapshot(debugPayload!.userAccessToken)
    : null;

  return (
    <>
      <h1>Instagram Graph API Debug</h1>
      <p>Development only. Raw Meta Graph API responses with masked tokens.</p>
      <p>
        <strong>Logged in as:</strong> {profile.full_name ?? profile.id} (
        {profile.role})
      </p>

      {!hasValidDebugSession ? (
        <div>
          <p>
            No debug OAuth session found. Connect Instagram first to store a
            temporary user access token for this page.
          </p>
          <p>
            <a href="/api/integrations/instagram/connect?returnTo=/settings/integrations/instagram/debug">
              Connect Instagram (debug)
            </a>
          </p>
        </div>
      ) : (
        <>
          <p>
            <strong>Fetched at:</strong> {snapshot!.fetchedAt}
          </p>
          <ul>
            {snapshot!.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          <Section
            title="1. Granted permissions"
            request={snapshot!.permissions.request}
            status={snapshot!.permissions.status}
            body={snapshot!.permissions.body}
          />

          <Section
            title="2. Pages (/me/accounts)"
            request={snapshot!.accounts.request}
            status={snapshot!.accounts.status}
            body={snapshot!.accounts.body}
          />

          {snapshot!.pages.map((page, index) => (
            <Section
              key={page.pageId}
              title={`3.${index + 1} Page lookup: ${page.pageName ?? page.pageId}`}
              request={`${page.request} (hasPageAccessToken=${page.hasPageAccessToken})`}
              status={page.status}
              body={page.body}
            />
          ))}
        </>
      )}
    </>
  );
}

export default async function InstagramGraphDebugPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px" }}>
      <InstagramDebugRouteMarker />
      <p>
        <Link href="/settings/integrations">Back to Integrations</Link>
      </p>
      <InstagramDebugContent />
    </div>
  );
}
