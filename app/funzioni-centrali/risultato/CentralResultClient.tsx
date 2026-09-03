"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { differentialRuleForCentralProfile, findCentralProfile } from "@/lib/contract-central-2025-2027";

const money = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export default function CentralResultClient() {
  const params = useSearchParams();
  const profile = findCentralProfile(params.get("profilo") || "funzionari");
  const differentialRule = differentialRuleForCentralProfile(profile);
  const requestedDifferentials = Number(params.get("nuoviDiff") || 0);
  const newDifferentialCount = differentialRule
    ? Math.min(differentialRule.maxCount, Math.max(0, Number.isFinite(requestedDifferentials) ? Math.floor(requestedDifferentials) : 0))
    : 0;
  const historicalDifferentialRaw = Number(params.get("storico") || 0);
  const historicalDifferential = differentialRule && Number.isFinite(historicalDifferentialRaw)
    ? Math.min(100000, Math.max(0, historicalDifferentialRaw))
    : 0;
  const newDifferentialsAnnual = newDifferentialCount * (differentialRule?.annualValue || 0);
  const hoursRaw = Number(params.get("ore") || 36);
  const hours = Math.min(36, Math.max(1, Number.isFinite(hoursRaw) ? hoursRaw : 36));
  const factor = hours / 36;
  const scaled = (amount: number) => amount * factor;
  const value = (amount: number) => money.format(scaled(amount));
  const annualIncrease = scaled(profile.increase2027 * 13);
  const monthlyIncrease = scaled(profile.increase2027);
  const priorSalary = profile.salary2027 - profile.increase2027 * 13 + historicalDifferential + newDifferentialsAnnual;
  const finalSalary = profile.salary2027 + historicalDifferential + newDifferentialsAnnual;

  async function share() {
    const data = {
      title: "Operazione Verità — Funzioni centrali",
      text: `Il mio aumento CCNL Funzioni Centrali 2025–2027: ${money.format(monthlyIncrease)} lordi al mese.`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className="result-page central-result">
      <section className="result-head">
        <div>
          <span className="eyebrow central-eyebrow"><i /> La tua simulazione · Funzioni centrali</span>
          <h1>{profile.label}</h1>
          <p>{profile.section && <><b>{profile.section}</b> · </>}<b>{hours} ore</b> settimanali{newDifferentialCount > 0 ? ` · ${newDifferentialCount} nuovi differenziali` : ""}</p>
        </div>
        <div className="result-actions">
          <Link href="/funzioni-centrali">← Modifica dati</Link>
          <button onClick={share}>Condividi</button>
        </div>
      </section>

      <section className="big-result central-big-result">
        <div className="big-result-label">Incremento mensile lordo a regime dal 2027</div>
        <div className="big-result-value">{money.format(monthlyIncrease)}</div>
        <div className="big-result-note">tabellare per 13 mensilità · {money.format(annualIncrease)} lordi annui</div>
        <div className="progress-line">
          <span style={{ width: `${profile.increase2025 / profile.increase2027 * 100}%` }} />
          <span style={{ width: `${(profile.increase2026 - profile.increase2025) / profile.increase2027 * 100}%` }} />
          <span style={{ width: `${(profile.increase2027 - profile.increase2026) / profile.increase2027 * 100}%` }} />
        </div>
      </section>

      <section className="timeline-card">
        <div className="timeline-title"><span>Come cresce l’aumento</span><small>importi lordi mensili</small></div>
        <div className="timeline">
          <article><span>01.01.2025</span><strong>{value(profile.increase2025)}</strong><p>prima tranche</p></article>
          <article><span>01.01.2026</span><strong>{value(profile.increase2026)}</strong><p>importo rideterminato</p></article>
          <article className="active central-active"><span>01.01.2027</span><strong>{money.format(monthlyIncrease)}</strong><p>a regime</p></article>
        </div>
      </section>

      <section className="result-grid central-result-grid">
        <article className="arrears-card central-arrears">
          <span className="card-kicker">Arretrati</span>
          {profile.arrears !== undefined ? <>
            <strong>{value(profile.arrears)}</strong>
            <p>Simulazione al 30 settembre 2026, al netto degli acconti medi già percepiti.</p>
          </> : <>
            <strong>—</strong>
            <p>Per questo profilo speciale il conteggio dipende dalla posizione individuale e dagli acconti già liquidati.</p>
          </>}
        </article>
        <article className="salary-card">
          <span className="card-kicker">Tabellare e differenziali annui</span>
          <div><span>Prima del rinnovo</span><b>{value(priorSalary)}</b></div>
          <div className="salary-arrow central-arrow">↓</div>
          <div><span>A regime dal 2027</span><b>{value(finalSalary)}</b></div>
          {historicalDifferential > 0 && <small className="dep-detail central-detail">Differenziale storico incluso: {value(historicalDifferential)} annui</small>}
          {newDifferentialsAnnual > 0 && <small className="dep-detail central-detail">Nuovi differenziali inclusi: {value(newDifferentialsAnnual)} annui</small>}
        </article>
        <article className="allowance-card central-differential-card">
          <span className="card-kicker">Differenziale stipendiale</span>
          {differentialRule ? <>
            <strong>{money.format(differentialRule.annualValue)}</strong>
            <p>valore annuo di ogni nuovo differenziale</p>
            <small>massimo contrattuale: {differentialRule.maxCount}</small>
          </> : <>
            <strong>—</strong>
            <p>Nessun differenziale ordinario applicato a questo profilo.</p>
          </>}
        </article>
      </section>

      <section className="variable-resources central-variable-resources">
        <div><span className="card-kicker">Salario accessorio</span><h2>Fondo risorse decentrate</h2></div>
        <p>Il Fondo cresce in misura diversa secondo l’amministrazione. Sono risorse da distribuire tramite contrattazione integrativa e non importi individuali automatici; per questo restano fuori dal calcolo personale.</p>
      </section>

      <section className="result-disclaimer">
        <b>Un numero utile, non un cedolino.</b>
        <p>Gli importi sono lordi. Il part-time è riproporzionato su 36 ore; arretrati e liquidazione effettiva possono variare per data di servizio, assenze, amministrazione e acconti già percepiti.</p>
      </section>
    </main>
  );
}
