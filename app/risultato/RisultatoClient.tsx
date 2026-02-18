"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import assemblee from "@/data/assemblee_marzo_2026.json";
import ccnl from "@/data/ccnl_fl_2021_2026.json";

type Row = {
  inquadramento: string;
  stipendio_attuale_2021: number;
  stipendio_minimo_piattaforma_2026: number;
  stipendio_che_avrai_2026: number;
  arretrati_anni_2022_2024: number;
  gia_anticipato_in_busta: number;
  da_ricevere_per_gli_anni_2022_2024: number;
  taglio_governo_tre_anni: number;
  costo_al_mese: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function RisultatoClient() {
  const sp = useSearchParams();
  const inq = (sp.get("inq") ?? "C1").toUpperCase();
  const ore = Number(sp.get("ore") ?? "36");

  const [tab, setTab] = useState<"prepost" | "potere" | "arretrati">("prepost");

  // Inflazione cumulata 2021–2026: intero 0..99 (max 2 cifre)
  const [inflazionePct, setInflazionePct] = useState<number>(18);

  const [shareOpen, setShareOpen] = useState(false);

  const row = useMemo(() => {
    const data = ccnl as Row[];
    return data.find((x) => x.inquadramento === inq) ?? data[0];
  }, [inq]);

  const calc = useMemo(() => {
    const fattore = clamp(ore / 36, 0, 1);

    const attuale = row.stipendio_attuale_2021 * fattore;
    const avrai = row.stipendio_che_avrai_2026 * fattore;
    const piattaforma = row.stipendio_minimo_piattaforma_2026 * fattore;

    const deltaAnn = avrai - attuale;
    const deltaMese = deltaAnn / 13;

    const gapAnn = piattaforma - avrai;
    const gapMese = gapAnn / 13;

    const arretrati = row.arretrati_anni_2022_2024 * fattore;
    const anticipato = row.gia_anticipato_in_busta * fattore;
    const daRicevere = row.da_ricevere_per_gli_anni_2022_2024 * fattore;

    const taglio = row.taglio_governo_tre_anni * fattore;
    const costoMese = row.costo_al_mese * fattore;

    const infl = clamp(inflazionePct, 0, 99) / 100;
    const necessarioPerTenerePotere = attuale * (1 + infl);
    const perditaPotereAnnua = Math.max(0, necessarioPerTenerePotere - avrai);
    const perditaPotereMensile = perditaPotereAnnua / 13;

    return {
      fattore,
      attuale,
      avrai,
      piattaforma,
      deltaAnn,
      deltaMese,
      gapAnn,
      gapMese,
      arretrati,
      anticipato,
      daRicevere,
      taglio,
      costoMese,
      infl,
      necessarioPerTenerePotere,
      perditaPotereAnnua,
      perditaPotereMensile,
    };
  }, [ore, row, inflazionePct]);

  // ---- Actions ----
  const downloadPdf = () => {
    const url = `/api/pdf?inq=${encodeURIComponent(inq)}&ore=${encodeURIComponent(
      String(ore)
    )}&infl=${encodeURIComponent(String(inflazionePct))}`;
    window.open(url, "_blank");
  };

  const copyUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiato ✅ (perfetto per Instagram)");
    } catch {
      prompt("Copia questo link:", url);
    }
  };

  const shareFacebook = () => {
    const url = window.location.href;
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fb, "_blank", "noopener,noreferrer");
  };

  const shareNow = async () => {
    const url = window.location.href;
    const text =
      `Operazione Verita - Funzioni Locali (FP Cgil Rovigo)\n` +
      `Inquadramento ${inq}, ore ${ore}\n` +
      `Guarda il risultato: ${url}`;

    const navAny = navigator as any;
    if (typeof navAny.share === "function") {
      try {
        await navAny.share({
          title: "Operazione Verita - FP Cgil Rovigo",
          text,
          url,
        });
        return;
      } catch {
        // annullato o fallito: fallback menu
      }
    }
    setShareOpen((v) => !v);
  };

  const Tab = (p: { id: typeof tab; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(p.id)}
      className={tab === p.id ? "ov-tab ov-tab-active" : "ov-tab"}
    >
      {p.label}
    </button>
  );

  const gapMesePos = Math.max(0, calc.gapMese);
  const gapAnnPos = Math.max(0, calc.gapAnn);
  const obiettivoRaggiunto = calc.gapMese <= 0.0001;

  return (
    <main className="space-y-8">
      {/* HEADER RISULTATO */}
      <section className="ov-card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="ov-chip">Risultato • 2021-2026</div>
            <div style={{ marginTop: 14 }} className="ov-h1">
              Operazione Verita
            </div>
            <div style={{ marginTop: 6 }} className="ov-muted">
              Inquadramento{" "}
              <span style={{ color: "var(--ov-text)", fontWeight: 900 }}>{inq}</span> • ore{" "}
              <span style={{ color: "var(--ov-text)", fontWeight: 900 }}>{ore}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative" }}>
            <a href="/" className="ov-btn ov-btn-ghost ov-btn-sm">
              Torna al calcolatore
            </a>

            <button type="button" onClick={downloadPdf} className="ov-btn ov-btn-ghost ov-btn-sm">
              Scarica PDF
            </button>

            <button type="button" onClick={shareNow} className="ov-btn ov-btn-primary ov-btn-sm">
              Condividi
            </button>

            {/* fallback desktop */}
            {shareOpen && (
              <div
                className="ov-card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: 48,
                  padding: 12,
                  minWidth: 240,
                  zIndex: 10,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <button type="button" onClick={shareFacebook} className="ov-btn ov-btn-ghost ov-btn-sm">
                    Condividi su Facebook
                  </button>
                  <button type="button" onClick={copyUrl} className="ov-btn ov-btn-ghost ov-btn-sm">
                    Copia link (Instagram)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareOpen(false)}
                    className="ov-btn ov-btn-ghost ov-btn-sm"
                    style={{ opacity: 0.85 }}
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }} className="ov-tabs">
          <Tab id="prepost" label="Pre / Post" />
          <Tab id="potere" label="Potere d’acquisto (in €)" />
          <Tab id="arretrati" label="Arretrati 22–24" />
        </div>
      </section>

      {/* TAB 1: PRE/POST */}
      {tab === "prepost" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Differenza 2021 → 2026</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            La cifra qui sotto è la variazione mensile (su 13 mensilità).
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              alignItems: "stretch",
            }}
          >
            {/* AUMENTO */}
            <div
              className="ov-card"
              style={{
                padding: 18,
                border: "1px solid rgba(225,29,46,0.25)",
                boxShadow: "0 12px 32px rgba(225,29,46,0.10)",
              }}
            >
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Aumento medio
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 56,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                }}
              >
                € {calc.deltaMese.toFixed(2)}
              </div>

              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                al mese
              </div>

              <div className="ov-muted" style={{ marginTop: 10 }}>
                € {calc.deltaAnn.toFixed(2)} / anno (13 mensilità)
              </div>
            </div>

            {/* GAP RICHIESTA */}
            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Quanto manca a quello che chiedevamo
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 950,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    color: "var(--ov-text)",
                  }}
                >
                  € {gapMesePos.toFixed(2)}
                </div>

                {obiettivoRaggiunto ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 900,
                      background: "rgba(16,185,129,0.12)",
                      color: "#059669",
                      border: "1px solid rgba(16,185,129,0.25)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Obiettivo raggiunto
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 900,
                      background: "rgba(225,29,46,0.10)",
                      color: "#e11d2e",
                      border: "1px solid rgba(225,29,46,0.25)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    al mese in meno
                  </span>
                )}
              </div>

              <div className="ov-muted" style={{ marginTop: 6 }}>
                € {gapAnnPos.toFixed(2)} / anno
              </div>

              <div
                className="ov-muted"
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  borderTop: "1px solid var(--ov-border2)",
                  paddingTop: 12,
                  lineHeight: 1.4,
                }}
              >
                Differenza tra l’obiettivo CGIL 2026 (€ {calc.piattaforma.toFixed(2)} / anno) e lo stipendio 2026
                che avrai.
              </div>
            </div>
          </div>

          <div
            className="ov-card"
            style={{
              marginTop: 12,
              padding: 16,
              display: "grid",
              gap: 8,
              fontSize: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio 2021</span>
              <b>€ {calc.attuale.toFixed(2)} / anno</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio 2026 (che avrai)</span>
              <b>€ {calc.avrai.toFixed(2)} / anno</b>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: POTERE D’ACQUISTO */}
      {tab === "potere" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Potere d’acquisto (in €)</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            Nel 2026: quanto perdi rispetto al tuo stipendio 2021 rivalutato per inflazione.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              alignItems: "stretch",
            }}
          >
            <div
              className="ov-card"
              style={{
                padding: 18,
                border: "1px solid rgba(225,29,46,0.25)",
                boxShadow: "0 12px 32px rgba(225,29,46,0.10)",
              }}
            >
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Perdita di potere d’acquisto
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 56,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                }}
              >
                € {calc.perditaPotereMensile.toFixed(2)}
              </div>

              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                al mese
              </div>

              <div className="ov-muted" style={{ marginTop: 10 }}>
                € {calc.perditaPotereAnnua.toFixed(2)} / anno
              </div>
            </div>

            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Inflazione cumulata 2021–2026
              </div>

              {/* INPUT COMPATTO: max 2 cifre + % */}
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  className="ov-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Math.round(inflazionePct))}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 2);
                    const n = onlyDigits === "" ? 0 : Number(onlyDigits);
                    setInflazionePct(n);
                  }}
                  style={{
                    width: 84,
                    textAlign: "center",
                    paddingTop: 10,
                    paddingBottom: 10,
                    fontWeight: 900,
                  }}
                  aria-label="Inflazione cumulata 2021-2026 in percentuale"
                />
                <span style={{ fontWeight: 900, color: "var(--ov-text)" }}>%</span>
              </div>

              <div
                className="ov-muted"
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  lineHeight: 1.4,
                  borderTop: "1px solid var(--ov-border2)",
                  paddingTop: 12,
                }}
              >
                Calcolo: necessario = stipendio 2021 × (1 + inflazione).<br />
                Perdita = max(0, necessario − stipendio 2026).
              </div>
            </div>
          </div>

          <div
            className="ov-card"
            style={{
              marginTop: 12,
              padding: 16,
              display: "grid",
              gap: 8,
              fontSize: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio 2021 (base)</span>
              <b>€ {calc.attuale.toFixed(2)} / anno</b>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Necessario nel 2026 (per non perdere)</span>
              <b>€ {calc.necessarioPerTenerePotere.toFixed(2)} / anno</b>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio 2026 (che avrai)</span>
              <b>€ {calc.avrai.toFixed(2)} / anno</b>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: ARRETRATI */}
      {tab === "arretrati" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Arretrati 2022–2024</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            Qui trovi il totale arretrati e quanto ti resta ancora da ricevere.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              alignItems: "stretch",
            }}
          >
            <div
              className="ov-card"
              style={{
                padding: 18,
                border: "1px solid rgba(225,29,46,0.25)",
                boxShadow: "0 12px 32px rgba(225,29,46,0.10)",
              }}
            >
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Da ricevere (2022–2024)
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 56,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                }}
              >
                € {calc.daRicevere.toFixed(2)}
              </div>

              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                una tantum
              </div>

              <div className="ov-muted" style={{ marginTop: 10 }}>
                (Totale arretrati: € {calc.arretrati.toFixed(2)})
              </div>
            </div>

            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Dettagli arretrati
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Totale arretrati</span>
                  <b>€ {calc.arretrati.toFixed(2)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Già anticipato in busta</span>
                  <b>€ {calc.anticipato.toFixed(2)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Da ricevere</span>
                  <b>€ {calc.daRicevere.toFixed(2)}</b>
                </div>
              </div>

              <div
                className="ov-muted"
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  borderTop: "1px solid var(--ov-border2)",
                  paddingTop: 12,
                  lineHeight: 1.4,
                }}
              >
                Altri indicatori (tabella CGIL): taglio 3 anni e “costo mese”.
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Taglio complessivo (3 anni)</span>
                  <b>€ {calc.taglio.toFixed(2)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Costo al mese</span>
                  <b>€ {calc.costoMese.toFixed(2)}</b>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <a href="/" className="ov-btn ov-btn-primary ov-btn-sm">
              Torna al calcolatore
            </a>
          </div>
        </section>
      )}

      {/* ASSEMBLEE (sempre visibili) */}
      <section className="ov-card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="ov-h2">Assemblee di marzo</div>
            <div className="ov-muted" style={{ marginTop: 4 }}>
              Hai verificato i numeri. Ora portiamoli in assemblea.
            </div>
          </div>

          <a href="/api/ics" className="ov-btn ov-btn-primary ov-btn-sm">
            Scarica calendario (.ics)
          </a>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {(assemblee as any[]).map((e) => (
            <div key={e.date + e.title} className="ov-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900 }}>{e.title}</div>
              <div className="ov-muted">
                {e.date} • {e.start}–{e.end} • {e.place}
              </div>
              <div className="ov-muted" style={{ fontSize: 12 }}>
                {e.mode === "da_remoto" ? "Da remoto" : "In presenza"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <a href="/" className="ov-btn ov-btn-ghost ov-btn-sm">
          Torna al calcolatore
        </a>
      </div>
    </main>
  );
}