"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  centralProfiles,
  differentialRuleForCentralProfile,
  findCentralProfile,
} from "@/lib/contract-central-2025-2027";

export default function CentralFunctionsPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState("funzionari");
  const [historicalDifferential, setHistoricalDifferential] = useState("0");
  const [newDifferentials, setNewDifferentials] = useState("0");
  const [hours, setHours] = useState("36");
  const [error, setError] = useState("");
  const profile = useMemo(() => findCentralProfile(profileId), [profileId]);
  const differentialRule = useMemo(() => differentialRuleForCentralProfile(profile), [profile]);

  function changeProfile(value: string) {
    setProfileId(value);
    setHistoricalDifferential("0");
    setNewDifferentials("0");
  }

  function calculate(event: React.FormEvent) {
    event.preventDefault();
    const weeklyHours = Number(hours.replace(",", "."));
    const historical = Number(historicalDifferential.replace(",", "."));

    if (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 36) {
      setError("Inserisci un orario compreso tra 1 e 36 ore.");
      return;
    }
    if (!Number.isFinite(historical) || historical < 0 || historical > 100000) {
      setError("Inserisci un differenziale storico annuo valido.");
      return;
    }

    const params = new URLSearchParams({
      profilo: profileId,
      storico: String(historical),
      nuoviDiff: newDifferentials,
      ore: String(weeklyHours),
    });
    router.push(`/funzioni-centrali/risultato?${params.toString()}`);
  }

  return (
    <main className="central-page">
      <section className="hero central-hero">
        <div className="hero-copy">
          <Link className="back-sector" href="/">← Scegli un altro comparto</Link>
          <span className="eyebrow central-eyebrow"><i /> CCNL Funzioni Centrali 2025–2027</span>
          <h1>Lo Stato funziona<br /><em>grazie a te.</em></h1>
          <p className="hero-lead">Calcola aumenti tabellari e arretrati in base alla tua area. Il contratto è definitivo dal 6 agosto 2026.</p>
          <div className="hero-highlights">
            <div><strong>+7,6%</strong><span>sui tabellari a regime</span></div>
            <div><strong>190 mila</strong><span>lavoratrici e lavoratori</span></div>
            <div><strong>30 giorni</strong><span>per applicare gli aumenti</span></div>
          </div>
        </div>

        <form className="calculator central-calculator" onSubmit={calculate}>
          <div className="calculator-kicker">La tua simulazione</div>
          <h2>Quanto aumenta?</h2>
          <p>Seleziona l’inquadramento indicato sul cedolino.</p>
          <label>
            <span>Area o profilo</span>
            <select value={profileId} onChange={(event) => changeProfile(event.target.value)}>
              {centralProfiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.section ? `${item.label} — ${item.section}` : item.label}
                </option>
              ))}
            </select>
          </label>
          {differentialRule && <>
            <label>
              <span>Differenziale storico annuo già in godimento</span>
              <div className="hours-field"><input inputMode="decimal" value={historicalDifferential} onChange={(event) => setHistoricalDifferential(event.target.value)} /><b>€</b></div>
            </label>
            <div className="field-help">Nelle Funzioni centrali il valore storico varia secondo amministrazione e precedente fascia: inserisci l’importo annuo indicato sul cedolino, oppure lascia zero.</div>
            <label>
              <span>Nuovi differenziali stipendiali acquisiti</span>
              <select value={newDifferentials} onChange={(event) => setNewDifferentials(event.target.value)}>
                {Array.from({ length: differentialRule.maxCount + 1 }, (_, count) => (
                  <option key={count} value={count}>{count === 0 ? "Nessun nuovo differenziale" : `${count} · ${(count * differentialRule.annualValue).toLocaleString("it-IT", { minimumFractionDigits: 2 })} € annui`}</option>
                ))}
              </select>
            </label>
            <div className="field-help">Ogni differenziale vale {differentialRule.annualValue.toLocaleString("it-IT", { minimumFractionDigits: 2 })} € annui nell’area selezionata.</div>
          </>}
          <label>
            <span>Ore settimanali</span>
            <div className="hours-field"><input inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} /><b>ore</b></div>
          </label>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          <button className="primary-action" type="submit">Calcola il tuo aumento <span>→</span></button>
          <small>Importi lordi. Gli arretrati sono una simulazione al 30 settembre 2026, al netto degli acconti medi considerati nelle tabelle.</small>
        </form>
      </section>

      <section className="contract-strip central-strip">
        <div><span>01</span><strong>Aumenti tabellari</strong><p>Tre decorrenze: 2025, 2026 e valore a regime dal 2027.</p></div>
        <div><span>02</span><strong>Arretrati</strong><p>Liquidazione prevista entro trenta giorni dalla firma definitiva.</p></div>
        <div><span>03</span><strong>Nuovi diritti</strong><p>Ferie, turni, formazione, genitorialità e regole sull’intelligenza artificiale.</p></div>
      </section>

      <section className="rights-section central-rights">
        <div className="section-number">FC<br />—27</div>
        <div>
          <span className="eyebrow dark">Un contratto che guarda avanti</span>
          <h2>Più valore al lavoro<br />pubblico.</h2>
          <div className="rights-grid">
            <article><b>IA sotto controllo umano</b><p>Trasparenza, informazione sindacale e divieto di decisioni esclusivamente automatizzate.</p></article>
            <article><b>Indennità in ferie</b><p>Per i turnisti viene riconosciuta una quota giornaliera calcolata sull’anno precedente.</p></article>
            <article><b>Patentino delle competenze</b><p>La formazione certificata entra nel percorso di valorizzazione professionale.</p></article>
            <article><b>Nuove tutele</b><p>Più attenzione a genitori, pendolari, screening oncologici e lavoro agile.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
