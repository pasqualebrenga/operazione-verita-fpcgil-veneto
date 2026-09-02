"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { depRuleForHealthArea, healthAllowances, healthAreas, levelsForHealthArea } from "@/lib/contract-health-2025-2027";

export default function HealthHomePage() {
  const router = useRouter();
  const [area, setArea] = useState("professionisti");
  const [allowance, setAllowance] = useState("none");
  const [level, setLevel] = useState("professionisti-d");
  const [newDeps, setNewDeps] = useState("0");
  const [hours, setHours] = useState("36");
  const [error, setError] = useState("");
  const availableAllowances = useMemo(() => healthAllowances.filter((item) => item.areas.includes(area)), [area]);
  const availableLevels = useMemo(() => levelsForHealthArea(area), [area]);
  const depRule = useMemo(() => depRuleForHealthArea(area), [area]);

  function changeArea(value: string) {
    setArea(value);
    setLevel(levelsForHealthArea(value)[0].id);
    setNewDeps("0");
    if (!healthAllowances.some((item) => item.id === allowance && item.areas.includes(value))) setAllowance("none");
  }

  function calculate(event: React.FormEvent) {
    event.preventDefault();
    const weeklyHours = Number(hours.replace(",", "."));
    if (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 40) {
      setError("Inserisci un orario compreso tra 1 e 40 ore.");
      return;
    }
    router.push(`/sanita/risultato?area=${area}&livello=${encodeURIComponent(level)}&nuoviDep=${newDeps}&indennita=${allowance}&ore=${weeklyHours}`);
  }

  return (
    <main className="health-page">
      <section className="hero health-hero">
        <div className="hero-copy">
          <Link className="back-sector" href="/">← Scegli un altro comparto</Link>
          <span className="eyebrow health-eyebrow"><i /> CCNL Sanità Pubblica 2025–2027</span>
          <h1>Chi cura il Paese<br /><em>merita risposte.</em></h1>
          <p className="hero-lead">Calcola gli aumenti del tabellare, le indennità specifiche e gli arretrati legati alla tua area professionale.</p>
          <div className="hero-highlights">
            <div><strong>7,7%</strong><span>crescita retributiva media</span></div>
            <div><strong>600 mila</strong><span>dipendenti coinvolti</span></div>
            <div><strong>dal 2025</strong><span>tre decorrenze economiche</span></div>
          </div>
        </div>

        <form className="calculator health-calculator" onSubmit={calculate}>
          <div className="calculator-kicker">La tua simulazione</div>
          <h2>Quanto ti spetta?</h2>
          <p>Seleziona le voci che trovi nel tuo inquadramento.</p>
          <label>
            <span>Area o profilo</span>
            <select value={area} onChange={(event) => changeArea(event.target.value)}>
              {healthAreas.map((item) => <option key={item.id} value={item.id}>{item.section ? `${item.label} — ${item.section}` : item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Posizione economica ex categoria (al 31.12.2022)</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              {availableLevels.map((item) => <option key={item.id} value={item.id}>{item.label}{item.dep ? ` · DEP annuo ${item.dep.toLocaleString("it-IT", { minimumFractionDigits:2 })} €` : " · nessun DEP"}</option>)}
            </select>
          </label>
          <div className="field-help">Questa selezione ricostruisce il DEP consolidato derivante dalla vecchia fascia.</div>
          {depRule && <label>
            <span>Nuovi DEP acquisiti dal 1° gennaio 2023</span>
            <select value={newDeps} onChange={(event) => setNewDeps(event.target.value)}>
              {Array.from({ length:depRule.maxCount + 1 }, (_, count) => <option key={count} value={count}>{count === 0 ? "Nessun nuovo DEP" : `${count} DEP · ${(count * depRule.annualValue).toLocaleString("it-IT", { minimumFractionDigits:2 })} € annui`}</option>)}
            </select>
          </label>}
          {depRule && <div className="field-help">Ogni nuovo DEP vale {depRule.annualValue.toLocaleString("it-IT", { minimumFractionDigits:2 })} € annui nell’area selezionata e si aggiunge al DEP derivante dalla ex categoria.</div>}
          <label>
            <span>Indennità specifica applicabile</span>
            <select value={allowance} onChange={(event) => setAllowance(event.target.value)}>
              {availableAllowances.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Ore settimanali</span>
            <div className="hours-field"><input inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} /><b>ore</b></div>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-action" type="submit">Calcola il tuo aumento <span>→</span></button>
          <small>Importi lordi indicativi. Seleziona l’indennità soltanto se effettivamente spettante.</small>
        </form>
      </section>

      <section className="contract-strip health-strip">
        <div><span>01</span><strong>Aumenti tabellari</strong><p>Incrementi dal 2025, rideterminati nel 2026 e a regime dal 2027.</p></div>
        <div><span>02</span><strong>Indennità rivalutate</strong><p>Specificità infermieristica e tutela del malato crescono dal gennaio 2026.</p></div>
        <div><span>03</span><strong>Arretrati</strong><p>Stima basata sull’entrata in vigore definitiva entro dicembre 2026.</p></div>
      </section>

      <section className="rights-section health-rights">
        <div className="section-number">SSN<br />—27</div>
        <div>
          <span className="eyebrow dark">Non solo busta paga</span>
          <h2>Più tutele per chi<br />si prende cura degli altri.</h2>
          <div className="rights-grid">
            <article><b>Indennità anche in ferie</b><p>Riconosciuta la continuità delle indennità durante i giorni di ferie.</p></article>
            <article><b>Supporto dopo le aggressioni</b><p>Previsto il sostegno psicologico per il personale vittima di violenza.</p></article>
            <article><b>Ferie uguali da subito</b><p>Superata la differenza tra neoassunti e personale con maggiore anzianità.</p></article>
            <article><b>Nuove professionalità</b><p>Soccorritore, assistente odontoiatrico, mediatore culturale e cybersecurity.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
