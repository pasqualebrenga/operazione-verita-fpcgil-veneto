"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import defaultAssemblee from "@/data/assemblee_marzo_2026.json";
import ccnl from "@/data/ccnl_fl_2021_2026.json";
import { calcolaIvcGiaPercepita } from "@/lib/ivc";

const MEET_URL = (process.env.NEXT_PUBLIC_ASSEMBLEA_MEET_URL ?? "").trim();

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

function isOnlineAssemblea(e: Assemblea) {
  const s = `${e.title ?? ""} ${e.place ?? ""} ${e.mode ?? ""}`.toLowerCase();
  return (
    s.includes("online") ||
    s.includes("teams") ||
    s.includes("zoom") ||
    s.includes("meet") ||
    s.includes("webinar") ||
    s.includes("stream")
  );
}
function keepOnlyOneOnline(list: Assemblea[]) {
  const online = (list ?? []).filter(isOnlineAssemblea);
  return online.length ? [online[0]] : [];
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Link copiato ✅");
  } catch {
    prompt("Copia questo link:", text);
  }
}

export default function RisultatoClient() {
  const sp = useSearchParams();
  const inq = (sp.get("inq") ?? "C1").toUpperCase();
  const ore = Number(sp.get("ore") ?? "36");

  const [tab, setTab] = useState<"prepost" | "potere" | "arretrati">("prepost");
  const [inflStr, setInflStr] = useState("18");
  const [shareOpen, setShareOpen] = useState(false);

  const [assembleeState, setAssembleeState] = useState<Assemblea[]>(
    keepOnlyOneOnline((defaultAssemblee as any) as Assemblea[])
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/assemblee", { cache: "no-store" });
        if (!r.ok) throw new Error("assemblee api not ok");
        const j = await r.json();
        const list = Array.isArray(j) ? (j as Assemblea[]) : [];
        const filtered = keepOnlyOneOnline(list);
        setAssembleeState(
          filtered.length ? filtered : keepOnlyOneOnline((defaultAssemblee as any) as Assemblea[])
        );
      } catch {
        setAssembleeState(keepOnlyOneOnline((defaultAssemblee as any) as Assemblea[]));
      }
    })();
  }, []);

  const row = useMemo(() => {
    const data = (ccnl as unknown as AnyRow[]) ?? [];
    return (data.find((x) => (x as any).inquadramento === inq) ?? data[0]) as AnyRow;
  }, [inq]);

  const dataset = useMemo(
    () => (isOldRow(row) ? "old" : isNewRow(row) ? "new" : "unknown"),
    [row]
  );

  const inflazionePct = useMemo(() => {
    const n = inflStr === "" ? 0 : Number(inflStr);
    return clamp(Number.isFinite(n) ? n : 0, 0, 99);
  }, [inflStr]);

  const calc = useMemo(() => {
    const fattore = clamp(ore / 36, 0, 1);

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
      baseAnn = row.stipendio_mensile_2019_2021 * 13 * fattore;
      finaleAnn = row.stipendio_con_conglobamento_2026 * 13 * fattore;

      aumentoMese = row.differenza_mensile_da_percepire_2024_2025 * fattore;
      aumentoAnn = aumentoMese * 13;

      arretratiTot = row.arretrati_fino_feb_2026 * fattore;

      const ivc = calcolaIvcGiaPercepita({
        inq,
        oreSettimanali: ore,
        mesi2026DaSottrarre: 2,
      });

      arretratiGia = ivc.totale;
      arretratiDa = Math.max(0, arretratiTot - arretratiGia);

      riduzioneValoreRealePct = row.riduzione_valore_reale_percent;
    }

    const infl = inflazionePct / 100;
    const necessario = baseAnn * (1 + infl);
    const perditaAnn = Math.max(0, necessario - finaleAnn);
    const perditaMese = perditaAnn / 13;

    return {
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
  }, [inq, ore, row, inflazionePct]);

  const downloadPdf = () => {
    const url = `/api/pdf?inq=${encodeURIComponent(inq)}&ore=${encodeURIComponent(
      String(ore)
    )}&infl=${encodeURIComponent(String(calc.inflazionePct))}`;
    window.open(url, "_blank");
  };

  const shareFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyUrl = async () => {
    await copyToClipboard(window.location.href);
  };

  const shareNow = async () => {
    const url = window.location.href;
    const text = `Operazione Verità – Funzioni Locali\nInquadramento ${inq}, ore ${ore}\n${url}`;

    const navAny = navigator as any;
    if (typeof navAny.share === "function") {
      try {
        await navAny.share({ title: "Operazione Verità", text, url });
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
      {/* Header risultato */}
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
              Operazione Verità
            </div>
            <div style={{ marginTop: 6 }} className="ov-muted">
              Inquadramento <b style={{ color: "var(--ov-text)" }}>{inq}</b> • ore{" "}
              <b style={{ color: "var(--ov-text)" }}>{ore}</b>
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
                  <button type="button" onClick={() => setShareOpen(false)} className="ov-btn ov-btn-ghost ov-btn-sm">
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="ov-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Tab id="prepost" label="Prima/Dopo" />
          <Tab id="potere" label="Potere d’acquisto" />
          <Tab id="arretrati" label="Arretrati" />
        </div>
      </section>

      {/* TAB: Prima/Dopo (solo aumento mensile evidenziato) */}
      {tab === "prepost" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Aumento mensile</div>

          <div
            className="ov-card"
            style={{
              padding: 22,
              marginTop: 16,
              border: "2px solid #c40000",
              background: "rgba(196, 0, 0, 0.06)",
              textAlign: "center",
            }}
          >
            <div className="ov-muted" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Aumento mensile (lordo)
            </div>

            <div style={{ marginTop: 12, fontSize: 56, fontWeight: 950, color: "#c40000", lineHeight: 1.05 }}>
              € {calc.aumentoMese.toFixed(2)}
            </div>

            <div className="ov-muted" style={{ marginTop: 10, fontSize: 14 }}>
              Su 13 mensilità: € {calc.aumentoAnn.toFixed(2)} annui
            </div>
          </div>

          <div className="ov-card" style={{ padding: 18, marginTop: 12 }}>
            <div className="ov-muted" style={{ fontWeight: 900 }}>
              Nota
            </div>
            <div className="ov-muted" style={{ marginTop: 10 }}>
              Qui abbiamo scelto di dare risalto solo all’aumento mensile lordo.
            </div>
          </div>
        </section>
      )}

      {/* TAB: Potere d’acquisto */}
      {tab === "potere" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Potere d’acquisto</div>

          <div className="ov-muted" style={{ marginTop: 10 }}>
            Scegli inflazione (stimata) per vedere quanto manca al mantenimento del potere d’acquisto.
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div className="ov-muted" style={{ fontWeight: 900 }}>
              Inflazione (%)
            </div>
            <input
              value={inflStr}
              onChange={(e) => setInflStr(only2Digits(e.target.value))}
              className="ov-input"
              inputMode="numeric"
              style={{ width: 90 }}
            />
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Stipendio necessario (annuo)
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>€ {calc.necessario.toFixed(2)}</div>
            </div>

            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Perdita annua stimata
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>€ {calc.perditaAnn.toFixed(2)}</div>
              <div className="ov-muted" style={{ marginTop: 6 }}>
                al mese ≈ € {calc.perditaMese.toFixed(2)}
              </div>
            </div>

            {calc.riduzioneValoreRealePct !== null && (
              <div className="ov-card" style={{ padding: 18 }}>
                <div className="ov-muted" style={{ fontWeight: 900 }}>
                  Riduzione valore reale (tabella CGIL)
                </div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>{calc.riduzioneValoreRealePct.toFixed(2)}%</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB: Arretrati */}
      {tab === "arretrati" && (
        <section className="ov-card" style={{ padding: 24 }}>
          <div className="ov-h2">Arretrati</div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div className="ov-card" style={{ padding: 18 }}>
              <div className="ov-muted" style={{ fontWeight: 900 }}>
                Da ricevere
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>€ {calc.arretratiDa.toFixed(2)}</div>
              <div className="ov-muted" style={{ marginTop: 6 }}>
                Totale tabella: € {calc.arretratiTot.toFixed(2)}
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
                  <span className="ov-muted">{dataset === "new" ? "IVC già ricevuta" : "Già anticipato"}</span>
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

      {/* Assemblea: SOLO bottone dentro la card (niente link sopra, niente bottone in alto) */}
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
            <div className="ov-h2">Assemblea online</div>
            <div className="ov-muted" style={{ marginTop: 6 }}>
              Partecipa da remoto e passa parola.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="/api/ics" className="ov-btn ov-btn-ghost ov-btn-sm">
              Scarica calendario (.ics)
            </a>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {assembleeState.length === 0 ? (
            <div className="ov-muted">Nessuna assemblea online pubblicata al momento.</div>
          ) : (
            assembleeState.map((e) => (
              <div key={`${e.date}-${e.start}-${e.title}`} className="ov-card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 900 }}>{e.title}</div>
                <div className="ov-muted">
                  {e.date} • {e.start}–{e.end} • {e.place}
                </div>
                <div className="ov-muted" style={{ marginTop: 6 }}>
                  {e.mode}
                </div>

                {/* ✅ UNICO bottone Meet: solo qui */}
                {MEET_URL && (
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a href={MEET_URL} target="_blank" rel="noopener noreferrer" className="ov-btn ov-btn-primary ov-btn-sm">
                      Entra al Meet
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}