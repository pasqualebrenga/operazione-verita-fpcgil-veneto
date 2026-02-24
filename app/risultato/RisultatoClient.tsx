"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import defaultAssemblee from "@/data/assemblee_marzo_2026.json";
import ccnl from "@/data/ccnl_fl_2021_2026.json";

// --- schema vecchio (2021-2026) ---
type OldRow = {
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

// --- schema nuovo (tabella aggiornata) ---
type NewRow = {
  inquadramento: string;
  stipendio_mensile_2019_2021: number;
  aumento_mensile_lordo_2022_2024: number;
  stipendio_tabellare_2022_2024: number;
  anticipo_mensile_2022_2024: number;
  differenza_mensile_da_percepire_2024_2025: number;
  riduzione_valore_reale_percent: number;
  arretrati_fino_feb_2026: number;
  conglobamento_indennita_comparto_2026_13: number;
  stipendio_con_conglobamento_2026: number;
  nuova_indennita_comparto_2026_12: number;
  nuova_indennita_comparto_2026_var: number;
};

type AnyRow = OldRow | NewRow;

type Assemblea = {
  title: string;
  date: string;
  start: string;
  end: string;
  place: string;
  mode: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function only2Digits(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}
function isOldRow(r: AnyRow): r is OldRow {
  return (r as any).stipendio_attuale_2021 !== undefined;
}
function isNewRow(r: AnyRow): r is NewRow {
  return (r as any).stipendio_mensile_2019_2021 !== undefined;
}

export default function RisultatoClient() {
  const sp = useSearchParams();
  const inq = (sp.get("inq") ?? "C1").toUpperCase();
  const ore = Number(sp.get("ore") ?? "36");

  const [tab, setTab] = useState<"prepost" | "potere" | "arretrati">("prepost");

  // Inflazione default sempre 18 (2 cifre)
  const [inflStr, setInflStr] = useState<string>("18");

  // Assemblee: da API (Upstash) con fallback al JSON
  const [assembleeState, setAssembleeState] = useState<Assemblea[]>(
    (defaultAssemblee as any) as Assemblea[]
  );

  const [shareOpen, setShareOpen] = useState(false);

  // carica assemblee da Upstash (se presenti)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assemblee", { cache: "no-store" });
        const json = await res.json();
        if (Array.isArray(json?.data)) setAssembleeState(json.data);
        else setAssembleeState((defaultAssemblee as any) as Assemblea[]);
      } catch {
        setAssembleeState((defaultAssemblee as any) as Assemblea[]);
      }
    })();
  }, []);

  const row = useMemo(() => {
    const data = (ccnl as unknown as AnyRow[]) ?? [];
    return (data.find((x) => (x as any).inquadramento === inq) ?? data[0]) as AnyRow;
  }, [inq]);

  const dataset = useMemo(() => {
    if (isOldRow(row)) return "old";
    if (isNewRow(row)) return "new";
    return "unknown";
  }, [row]);

  const inflazionePct = useMemo(() => {
    const n = inflStr === "" ? 0 : Number(inflStr);
    return clamp(Number.isFinite(n) ? n : 0, 0, 99);
  }, [inflStr]);

  const calc = useMemo(() => {
    const fattore = clamp(ore / 36, 0, 1);

    // Normalizziamo tutto per UI:
    // base/finale = annuo (13 mensilità)
    // aumentoMese = quello che mostriamo nel box
    let baseAnn = 0;
    let finaleAnn = 0;
    let aumentoMese = 0;
    let aumentoAnn = 0;

    let arretratiTot = 0;
    let arretratiGia = 0;
    let arretratiDa = 0;

    let riduzioneValoreRealePct: number | null = null;

    if (isOldRow(row)) {
      baseAnn = row.stipendio_attuale_2021 * fattore;
      finaleAnn = row.stipendio_che_avrai_2026 * fattore;

      aumentoAnn = finaleAnn - baseAnn;
      aumentoMese = aumentoAnn / 13;

      arretratiTot = row.arretrati_anni_2022_2024 * fattore;
      arretratiGia = row.gia_anticipato_in_busta * fattore;
      arretratiDa = row.da_ricevere_per_gli_anni_2022_2024 * fattore;
    } else if (isNewRow(row)) {
      // nuovo: mensile -> annuo (13)
      baseAnn = row.stipendio_mensile_2019_2021 * 13 * fattore;
      finaleAnn = row.stipendio_con_conglobamento_2026 * 13 * fattore;

      // “aumento” come differenza mensile da percepire 2024-2025 (dato tabella)
      aumentoMese = row.differenza_mensile_da_percepire_2024_2025 * fattore;
      aumentoAnn = aumentoMese * 13;

      arretratiTot = row.arretrati_fino_feb_2026 * fattore;
      arretratiGia = 0;
      arretratiDa = arretratiTot;

      riduzioneValoreRealePct = row.riduzione_valore_reale_percent;
    }

    // Potere d’acquisto (calcolo nostro con inflazione scelta)
    const infl = inflazionePct / 100;
    const necessario = baseAnn * (1 + infl);
    const perditaAnn = Math.max(0, necessario - finaleAnn);
    const perditaMese = perditaAnn / 13;

    return {
      fattore,
      baseAnn,
      finaleAnn,
      aumentoMese,
      aumentoAnn,
      arretratiTot,
      arretratiGia,
      arretratiDa,
      inflazionePct,
      necessario,
      perditaAnn,
      perditaMese,
      riduzioneValoreRealePct,
    };
  }, [ore, row, inflazionePct]);

  // ---- actions
  const downloadPdf = () => {
    const url = `/api/pdf?inq=${encodeURIComponent(inq)}&ore=${encodeURIComponent(
      String(ore)
    )}&infl=${encodeURIComponent(String(calc.inflazionePct))}`;
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
        // fallback
      }
    }
    setShareOpen((v) => !v);
  };

  const Tab = (p: { id: "prepost" | "potere" | "arretrati"; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(p.id)}
      className={tab === p.id ? "ov-tab ov-tab-active" : "ov-tab"}
    >
      {p.label}
    </button>
  );

  return (
    <main className="space-y-8">
      {/* HEADER */}
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
            <div className="ov-chip">Risultato</div>
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
          <Tab id="arretrati" label="Arretrati" />
        </div>

        <div className="ov-muted" style={{ marginTop: 10, fontSize: 12 }}>
          Dataset: <b>{dataset}</b>
        </div>
      </section>

      {/* TAB PRE/POST */}
      {tab === "prepost" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Differenza</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            {dataset === "new"
              ? "Con tabella nuova: usiamo la differenza mensile da percepire 2024–2025."
              : "Variazione mensile su 13 mensilità (calcolata da stipendio 2021 → 2026)."}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {/* aumento */}
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
                € {calc.aumentoMese.toFixed(2)}
              </div>
              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                al mese
              </div>
              <div className="ov-muted" style={{ marginTop: 10 }}>
                € {calc.aumentoAnn.toFixed(2)} / anno (13 mensilità)
              </div>
            </div>

            {/* box 2 */}
            {dataset === "new" ? (
              <div className="ov-card" style={{ padding: 18 }}>
                <div className="ov-muted" style={{ fontWeight: 900 }}>
                  Riduzione del valore reale dello stipendio
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
                    {calc.riduzioneValoreRealePct == null ? "—" : calc.riduzioneValoreRealePct.toFixed(2)}%
                  </div>

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
                    valore reale in meno
                  </span>
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
                  Dato già presente nella tabella CGIL (non è un calcolo del sito).
                </div>
              </div>
            ) : (
              <div className="ov-card" style={{ padding: 18 }}>
                <div className="ov-muted" style={{ fontWeight: 900 }}>
                  Nota
                </div>
                <div className="ov-muted" style={{ marginTop: 10 }}>
                  Con dataset vecchio era disponibile anche “Quanto manca a quello che chiedevamo” (piattaforma 2026).
                  Con la tabella nuova quel dato non esiste e non lo inventiamo.
                </div>
              </div>
            )}
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
              <span className="ov-muted">Stipendio base (annuo)</span>
              <b>€ {calc.baseAnn.toFixed(2)} / anno</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio finale (annuo)</span>
              <b>€ {calc.finaleAnn.toFixed(2)} / anno</b>
            </div>
          </div>
        </section>
      )}

      {/* TAB POTERE */}
      {tab === "potere" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Potere d’acquisto (in €)</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            Quanto perdi nel 2026 rispetto allo stipendio base rivalutato per inflazione.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                € {calc.perditaMese.toFixed(2)}
              </div>

              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                al mese
              </div>

              <div className="ov-muted" style={{ marginTop: 10 }}>
                € {calc.perditaAnn.toFixed(2)} / anno
              </div>
            </div>

            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Inflazione cumulata 2021–2026 (%)
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inflStr}
                  onChange={(e) => setInflStr(only2Digits(e.target.value))}
                  className="ov-input"
                  style={{
                    width: 80,
                    maxWidth: 80,
                    minWidth: 80,
                    display: "inline-block",
                    textAlign: "center",
                    paddingTop: 10,
                    paddingBottom: 10,
                    fontWeight: 900,
                  }}
                  placeholder="18"
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
                Calcolo: necessario = stipendio base × (1 + inflazione).<br />
                Perdita = max(0, necessario − stipendio finale).
              </div>
            </div>
          </div>

          <div className="ov-card" style={{ marginTop: 12, padding: 16, display: "grid", gap: 8, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Necessario (per non perdere)</span>
              <b>€ {calc.necessario.toFixed(2)} / anno</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="ov-muted">Stipendio finale</span>
              <b>€ {calc.finaleAnn.toFixed(2)} / anno</b>
            </div>
          </div>
        </section>
      )}

      {/* TAB ARRETRATI */}
      {tab === "arretrati" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Arretrati</div>
          <div className="ov-muted" style={{ marginTop: 6 }}>
            {dataset === "new" ? "Tabella nuova: arretrati calcolati fino a febbraio 2026." : "Arretrati 2022–2024."}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                Da ricevere
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
                € {calc.arretratiDa.toFixed(2)}
              </div>

              <div className="ov-muted" style={{ marginTop: 6, fontWeight: 900 }}>
                una tantum
              </div>

              <div className="ov-muted" style={{ marginTop: 10 }}>
                (Totale: € {calc.arretratiTot.toFixed(2)})
              </div>
            </div>

            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Dettagli
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Totale arretrati</span>
                  <b>€ {calc.arretratiTot.toFixed(2)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Già anticipato</span>
                  <b>€ {calc.arretratiGia.toFixed(2)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="ov-muted">Da ricevere</span>
                  <b>€ {calc.arretratiDa.toFixed(2)}</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ASSEMBLEE (da Upstash con fallback JSON) */}
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
            <div className="ov-h2">Assemblee</div>
            <div className="ov-muted" style={{ marginTop: 4 }}>
              Aggiornate via admin (Upstash) — se vuoto, usa il JSON di default.
            </div>
          </div>

          <a href="/api/ics" className="ov-btn ov-btn-primary ov-btn-sm">
            Scarica calendario (.ics)
          </a>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {assembleeState.map((e) => (
            <div key={`${e.date}-${e.start}-${e.title}`} className="ov-card" style={{ padding: 16 }}>
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