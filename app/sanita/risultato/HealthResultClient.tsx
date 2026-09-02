"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { depRuleForHealthArea, findHealthAllowance, findHealthArea, findHealthLevel } from "@/lib/contract-health-2025-2027";

const money = new Intl.NumberFormat("it-IT", { style:"currency", currency:"EUR", minimumFractionDigits:2 });

export default function HealthResultClient() {
  const params = useSearchParams();
  const area = findHealthArea(params.get("area") || "professionisti");
  const level = findHealthLevel(params.get("livello") || "", area.id);
  const depRule = depRuleForHealthArea(area.id);
  const requestedNewDeps = Number(params.get("nuoviDep") || 0);
  const newDepCount = depRule ? Math.min(depRule.maxCount, Math.max(0, Number.isFinite(requestedNewDeps) ? Math.floor(requestedNewDeps) : 0)) : 0;
  const newDepAnnual = newDepCount * (depRule?.annualValue || 0);
  const allowance = findHealthAllowance(params.get("indennita") || "none", area.id);
  const hours = Math.min(40, Math.max(1, Number(params.get("ore") || 36)));
  const factor = Math.min(1, hours / 36);
  const scaled = (amount: number) => amount * factor;
  const value = (amount: number) => money.format(scaled(amount));
  const allowanceIncrease = allowance.increase[area.id] || 0;
  const allowanceArrears = allowance.arrears[area.id] || 0;
  const monthlyTotal = scaled(area.increase2027 + allowanceIncrease);
  const annualTotal = scaled(area.increase2027 * 13 + allowanceIncrease * 12);
  const arrearsTotal = scaled(area.arrears + allowanceArrears);
  const oldSalary = area.salary2027 - area.increase2027 * 13 + level.dep + newDepAnnual;
  const newSalary = area.salary2027 + level.dep + newDepAnnual;
  const tableOvertime = level.overtime ?? area.overtime;
  const calculatedHourly = newSalary / 1872;
  const overtime = newDepCount > 0 ? ([calculatedHourly,calculatedHourly * 1.15,calculatedHourly * 1.30,calculatedHourly * 1.50] as [number,number,number,number]) : tableOvertime;

  async function share() {
    const data = { title:"Operazione Verità — Sanità", text:`Il mio aumento CCNL Sanità 2025–2027: ${money.format(monthlyTotal)} lordi al mese.`, url:window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className="result-page health-result">
      <section className="result-head">
        <div>
          <span className="eyebrow health-eyebrow"><i /> La tua simulazione · Sanità pubblica</span>
          <h1>{area.label}</h1>
          <p>Ex categoria <b>{level.label}</b>{newDepCount > 0 ? ` · ${newDepCount} nuovi DEP` : " · nessun nuovo DEP"} · <b>{hours} ore</b> settimanali{allowance.id !== "none" ? ` · ${allowance.label}` : " · nessuna indennità specifica selezionata"}</p>
        </div>
        <div className="result-actions">
          <Link href="/sanita">← Modifica dati</Link>
          <button onClick={share}>Condividi</button>
        </div>
      </section>

      <section className="big-result health-big-result">
        <div className="big-result-label">Incremento mensile lordo a regime</div>
        <div className="big-result-value">{money.format(monthlyTotal)}</div>
        <div className="big-result-note">{allowanceIncrease ? "tabellare + indennità selezionata" : "incremento tabellare"} · {money.format(annualTotal)} lordi annui</div>
        <div className="progress-line"><span style={{width:`${area.increase2025/(area.increase2027+allowanceIncrease)*100}%`}} /><span style={{width:`${(area.increase2026-area.increase2025)/(area.increase2027+allowanceIncrease)*100}%`}} /><span style={{width:`${(area.increase2027-area.increase2026)/(area.increase2027+allowanceIncrease)*100}%`}} />{allowanceIncrease > 0 && <span style={{width:`${allowanceIncrease/(area.increase2027+allowanceIncrease)*100}%`}} />}</div>
      </section>

      <section className="timeline-card">
        <div className="timeline-title"><span>Come cresce il trattamento</span><small>importi lordi mensili</small></div>
        <div className="timeline">
          <article><span>01.01.2025</span><strong>{value(area.increase2025)}</strong><p>prima tranche tabellare</p></article>
          <article><span>01.01.2026</span><strong>{value(area.increase2026 + allowanceIncrease)}</strong><p>tabellare{allowanceIncrease ? " + indennità" : " rideterminato"}</p></article>
          <article className="active health-active"><span>01.01.2027</span><strong>{money.format(monthlyTotal)}</strong><p>a regime</p></article>
        </div>
      </section>

      <section className="result-grid health-result-grid">
        <article className="arrears-card health-arrears">
          <span className="card-kicker">Arretrati stimati</span>
          <strong>{money.format(arrearsTotal)}</strong>
          <p>Stima al netto dell’IVC, ipotizzando l’applicazione definitiva entro dicembre 2026.</p>
          <div><span>Quota tabellare</span><b>{value(area.arrears)}</b></div>
          {allowanceArrears > 0 && <div><span>Quota indennità</span><b>{value(allowanceArrears)}</b></div>}
        </article>
        <article className="salary-card">
          <span className="card-kicker">Tabellare e DEP annui</span>
          <div><span>Prima del rinnovo</span><b>{value(oldSalary)}</b></div>
          <div className="salary-arrow health-arrow">↓</div>
          <div><span>A regime dal 2027</span><b>{value(newSalary)}</b></div>
          {level.dep > 0 && <small className="dep-detail">Comprende DEP già acquisito: {value(level.dep)} annui</small>}
          {newDepAnnual > 0 && <small className="dep-detail">Nuovi DEP: {newDepCount} × {money.format(depRule!.annualValue)} = {value(newDepAnnual)} annui</small>}
        </article>
        <article className="allowance-card health-allowance-card">
          <span className="card-kicker">Indennità selezionata</span>
          {allowanceIncrease > 0 ? <><strong>{value(allowanceIncrease)}</strong><p>incremento mensile dal 2026</p><small>{allowance.label}</small></> : <><strong>—</strong><p>Nessuna indennità specifica inclusa nel calcolo.</p><small>Puoi modificare la selezione.</small></>}
        </article>
      </section>

      {overtime && <section className="overtime-section">
        <div><span className="card-kicker">Nuovi valori orari</span><h2>Quanto vale lo straordinario</h2><p>{newDepCount > 0 ? "Valori ricalcolati includendo tutti i DEP selezionati." : "Valori corrispondenti alla posizione economica selezionata."}</p></div>
        <div className="overtime-values">
          <article><span>Ordinario</span><b>{money.format(overtime[0])}</b></article>
          <article><span>Diurno +15%</span><b>{money.format(overtime[1])}</b></article>
          <article><span>Festivo/notturno +30%</span><b>{money.format(overtime[2])}</b></article>
          <article><span>Festivo e notturno +50%</span><b>{money.format(overtime[3])}</b></article>
        </div>
      </section>}

      <section className="result-disclaimer">
        <b>Una stima trasparente.</b>
        <p>Gli importi sono lordi e indicativi. Il part-time è riproporzionato su 36 ore. Indennità e arretrati dipendono dal profilo effettivo, dalla data di servizio e dalle somme già percepite.</p>
      </section>
    </main>
  );
}
