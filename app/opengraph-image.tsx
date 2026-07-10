import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Desklabs — Customer Operations Platform for Service Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eef4fc 100%)",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#1f5fbf",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#0f172a" }}>
            Desklabs
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#1f5fbf",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Customer Operations Platform
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 1.08,
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            One calm workspace for service businesses
          </div>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.45,
              color: "#475569",
            }}
          >
            Unify communication, CRM, operations, finance, automation, and AI.
          </div>
        </div>

        <div style={{ fontSize: "24px", color: "#64748b" }}>desklabs.id</div>
      </div>
    ),
    { ...size },
  );
}
