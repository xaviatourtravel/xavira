import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Desklabs — One Platform. Endless Growth.";
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
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #ecfdf5 100%)",
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
              background: "#0f172a",
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
              fontSize: "28px",
              fontWeight: 600,
              color: "#047857",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            One Platform. Endless Growth.
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.08,
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            AI Customer Operating System
          </div>
          <div
            style={{
              fontSize: "30px",
              lineHeight: 1.45,
              color: "#475569",
            }}
          >
            Kelola seluruh perjalanan customer dalam satu platform yang didukung AI.
          </div>
        </div>

        <div style={{ fontSize: "24px", color: "#64748b" }}>desklabs.id</div>
      </div>
    ),
    { ...size },
  );
}
