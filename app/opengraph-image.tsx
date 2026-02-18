import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          padding: 64,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              paddingTop: 10,
              paddingRight: 14,
              paddingBottom: 10,
              paddingLeft: 14,
              backgroundColor: "rgba(225, 29, 46, 0.10)",
              color: "#e11d2e",
              fontSize: 26,
              fontWeight: 800,
              borderRadius: 999,
              width: 360,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            FP Cgil Rovigo
          </div>

          <div style={{ height: 18 }} />

          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05 }}>
            Operazione Verita
          </div>

          <div style={{ height: 12 }} />

          <div style={{ fontSize: 34, fontWeight: 650, color: "#334155", lineHeight: 1.2 }}>
            Funzioni Locali (2021-2026)
            <br />
            numeri chiari, metodo trasparente
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ fontSize: 22, color: "#475569" }}>
            Calcola pre/post, potere d&apos;acquisto e arretrati.
          </div>

          <div
            style={{
              width: 420,
              height: 14,
              borderRadius: 999,
              backgroundColor: "#e11d2e",
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}