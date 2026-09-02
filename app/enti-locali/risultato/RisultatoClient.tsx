"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { contractGroups, differentialRuleForLocalArea, findContractRow } from "@/lib/contract-2025-2027";

const money = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export default function RisultatoClient() {
  const params = useSearchParams();
  const inq = (params.get("inq") || "C1").toUpperCase();
  const ore = Math.min(40, Math.max(1, Number(params.get("ore") || 36)));
  const row = findContractRow(inq);
  const basePosition = contractGroups.find((group) => group.label === row.area)?.values[0];
  const historicalPosition = inq === basePosition ? `base ex ${inq}` : `posizione economica ex ${inq}`;
  const differentialRule = differentialRuleForLocalArea(row.area);
  const requestedDifferentials = Number(params.get("nuoviDiff") || 0);
  const newDifferentialCount = Math.min(differentialRule.maxCount, Math.max(0, Number.isFinite(requestedDifferentials) ? Math.floor(requestedDifferentials) : 0));
  const newDifferentialsAnnual = newDifferentialCount * differentialRule.annualValue;
  const factor = Math.min(1, ore / 36);
  const value = (amount: number) => money.format(amount * factor);
  const comparto2027 = (row.comparto2026 + row.compartoIncremento2027) * factor;
  const aumentoComplessivoMese = (row.aumento2027 + row.compartoIncremento2027) * factor;
  const aumentoComplessivoAnno = (row.aumento2027 * 13 + row.compartoIncremento2027 * 12) * factor;

  async function share() {
    const data = { title: "Operazione Verità", text: `Il mio incremento fisso CCNL 2025–2027: ${money.format(aumentoComplessivoMese)} lordi al mese da luglio 2027.`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className="result-page">
      <section className="result-head">
        <div>
          <span className="eyebrow"><i /> La tua simulazione</span>
          <h1>{row.area}</h1>
          <p><b>{historicalPosition}</b>{newDifferentialCount > 0 ? ` · ${newDifferentialCount} ${newDifferentialCount === 1 ? "nuovo differenziale" : "nuovi differenziali"}` : " · nessun nuovo differenziale"} · <b>{ore} ore</b> settimanali</p>
        </div>
        <div className="result-actions">
          <Link href="/enti-locali">← Modifica dati</Link>
          <button onClick={share}>Condividi</button>
        </div>
      </section>

      <section className="big-result">
        <div className="big-result-label">Incremento fisso e ricorrente da luglio 2027</div>
        <div className="big-result-value">{money.format(aumentoComplessivoMese)}</div>
        <div className="big-result-note">tabellare + incremento dell’indennità di comparto · {money.format(aumentoComplessivoAnno)} lordi annui</div>
        <div className="progress-line"><span style={{ width: `${(row.aumento2025 / (row.aumento2027 + row.compartoIncremento2027)) * 100}%` }} /><span style={{ width: `${((row.aumento2026 - row.aumento2025) / (row.aumento2027 + row.compartoIncremento2027)) * 100}%` }} /><span style={{ width: `${((row.aumento2027 - row.aumento2026) / (row.aumento2027 + row.compartoIncremento2027)) * 100}%` }} /><span style={{ width: `${(row.compartoIncremento2027 / (row.aumento2027 + row.compartoIncremento2027)) * 100}%` }} /></div>
      </section>

      <section className="timeline-card">
        <div className="timeline-title"><span>Come cresce l’aumento</span><small>importi lordi mensili</small></div>
        <div className="timeline timeline-four">
          <article><span>01.01.2025</span><strong>{value(row.aumento2025)}</strong><p>prima tranche</p></article>
          <article><span>01.01.2026</span><strong>{value(row.aumento2026)}</strong><p>importo rideterminato</p></article>
          <article><span>01.01.2027</span><strong>{value(row.aumento2027)}</strong><p>tabellare a regime</p></article>
          <article className="active"><span>01.07.2027</span><strong>{money.format(aumentoComplessivoMese)}</strong><p>con incremento comparto</p></article>
        </div>
      </section>

      <section className="result-grid">
        <article className="arrears-card">
          <span className="card-kicker">Arretrati stimati</span>
          <strong>{value(row.arretrati)}</strong>
          <p>Fino al 31 ottobre 2026, già al netto dell’IVC indicata nelle tabelle.</p>
          <div><span>IVC 2025</span><b>{value(row.ivc2025)}</b></div>
          <div><span>IVC 2026 fino a ottobre</span><b>{value(row.ivc2026)}</b></div>
        </article>
        <article className="salary-card">
          <span className="card-kicker">Tabellare e differenziali annui</span>
          <div><span>CCNL 2022–2024</span><b>{value(row.tabellare2024 + newDifferentialsAnnual)}</b></div>
          <div className="salary-arrow">↓</div>
          <div><span>A regime dal 2027</span><b>{value(row.tabellare2027 + newDifferentialsAnnual)}</b></div>
          {newDifferentialsAnnual > 0 && <small className="dep-detail">Nuovi differenziali: {newDifferentialCount} × {money.format(differentialRule.annualValue)} = {value(newDifferentialsAnnual)} annui</small>}
        </article>
        <article className="allowance-card">
          <span className="card-kicker">Indennità di comparto</span>
          <strong>{money.format(comparto2027)}</strong>
          <p>al mese dal 1° luglio 2027</p>
          <small>incremento di {value(row.compartoIncremento2027)} rispetto al 2026</small>
        </article>
      </section>

      <section className="variable-resources">
        <div>
          <span className="card-kicker">Oltre gli importi garantiti</span>
          <h2>Fondo decentrato e incarichi EQ</h2>
        </div>
        <p>Dal 2027 il fondo cresce di 52 € pro capite annui; per gli enti esclusi dal fondo statale di armonizzazione si aggiungono 164,75 € pro capite annui da luglio. Queste sono risorse da contrattare, non un aumento individuale automatico.</p>
        {row.area === "Funzionari ed EQ" && <p><b>Se hai un incarico EQ:</b> l’ente può destinare fino al 10% dei risparmi permanenti derivanti da assunzioni inferiori a quelle consentite per incrementarne le risorse. Non esiste però un importo uguale e garantito per tutti.</p>}
      </section>

      <section className="result-disclaimer">
        <b>Un numero utile, non un cedolino.</b>
        <p>Gli importi sono lordi e indicativi. Il part-time è riproporzionato su 36 ore; arretrati e liquidazione effettiva possono variare per decorrenza, assenze e posizione individuale.</p>
      </section>
    </main>
  );
}
