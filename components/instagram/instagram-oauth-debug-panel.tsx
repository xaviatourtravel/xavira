import {
  formatDebugJson,
  type InstagramGraphDebugSnapshot,
} from "@/lib/instagram/graph-debug";

function DebugSection({
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
    <section style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: "0.875rem" }}>
        <strong>Request:</strong> {request}
      </p>
      <p style={{ fontSize: "0.875rem" }}>
        <strong>HTTP status:</strong> {status}
      </p>
      <pre
        style={{
          marginTop: "0.5rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "#f5f5f5",
          padding: "0.75rem",
          fontSize: "0.75rem",
        }}
      >
        {formatDebugJson(body)}
      </pre>
    </section>
  );
}

type InstagramOAuthDebugPanelProps = {
  oauthScopesRequested: string;
  snapshot: InstagramGraphDebugSnapshot;
};

export function InstagramOAuthDebugPanel({
  oauthScopesRequested,
  snapshot,
}: InstagramOAuthDebugPanelProps) {
  return (
    <details
      open
      style={{
        marginBottom: "1.5rem",
        border: "1px solid #d4d4d4",
        borderRadius: "0.5rem",
        padding: "1rem",
        background: "#fafafa",
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Instagram OAuth Debug (development)
      </summary>

      <div style={{ marginTop: "1rem" }}>
        <p style={{ fontSize: "0.875rem" }}>
          <strong>OAuth scopes requested:</strong> {oauthScopesRequested}
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          <strong>Snapshot fetched at:</strong> {snapshot.fetchedAt}
        </p>

        <DebugSection
          title="1. Granted permissions"
          request={snapshot.permissions.request}
          status={snapshot.permissions.status}
          body={snapshot.permissions.body}
        />

        <DebugSection
          title="2. /me/accounts"
          request={snapshot.accounts.request}
          status={snapshot.accounts.status}
          body={snapshot.accounts.body}
        />

        {snapshot.pages.map((page, index) => (
          <DebugSection
            key={page.pageId}
            title={`3.${index + 1} Page lookup: ${page.pageName ?? page.pageId}`}
            request={`${page.request} (hasPageAccessToken=${String(page.hasPageAccessToken)})`}
            status={page.status}
            body={page.body}
          />
        ))}
      </div>
    </details>
  );
}
