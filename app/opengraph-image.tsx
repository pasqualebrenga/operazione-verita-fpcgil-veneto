import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Operazione Verita - FP Cgil Rovigo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          padding: "64px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* BADGE */}
          <div
            style={{
              display: "flex",          // <-- era inline-flex (NON supportato)
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: "999px",
              backgroundColor: "rgba(225, 29, 46, 0.10)",
              color: "#e11d2e",
              fontSize: "26px",
              fontWeight: 800,
              width: "340px",           // così “sembra” inline
            }}
          >
            FP Cgil Rovigo
          </div>

          <div style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.04em" }}>
            Operazione Verita
          </div>

          <div style={{ fontSize: "34px", lineHeight: 1.2, color: "#334155", fontWeight: 650 }}>
            Funzioni Locali (2021-2026)
            <br />
            numeri chiari, metodo trasparente
          </div>
        </div>

        {/* FOOTER STRIP */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "24px",
          }}
        >
          <div style={{ fontSize: "22px", color: "#475569" }}>
            Calcola pre/post, potere d&apos;acquisto e arretrati.
          </div>

          <div
            style={{
              width: "420px",
              height: "14px",
              borderRadius: "999px",
              backgroundColor: "#e11d2e",
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}