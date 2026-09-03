export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--ov-border2)", marginTop: 28 }}>
      <div className="ov-container" style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 950, letterSpacing: "-0.02em" }}>FPCGIL Rovigo</div>
          <div className="ov-muted" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()}
          </div>
        </div>

        <div className="ov-muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4 }}>
          Operazione Verità – Enti locali, Sanità pubblica e Funzioni centrali. CCNL 2025–2027. Importi lordi indicativi. FP CGIL Rovigo.
        </div>
      </div>
    </footer>
  );
}
