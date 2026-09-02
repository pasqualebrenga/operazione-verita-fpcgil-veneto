"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { contractGroups, differentialRuleForLocalArea, findContractRow } from "@/lib/contract-2025-2027";

export default function HomePage() {
  const router = useRouter();
  const [area, setArea] = useState("Istruttori");
  const [inq, setInq] = useState("C1");
  const [ore, setOre] = useState("36");
  const [newDifferentials, setNewDifferentials] = useState("0");
  const [error, setError] = useState("");
  const selectedRow = findContractRow(inq);
  const selectedGroup = contractGroups.find((group) => group.label === area) ?? contractGroups[2];
  const differentialRule = differentialRuleForLocalArea(selectedRow.area);

  function changeArea(nextArea: string) {
    const nextGroup = contractGroups.find((group) => group.label === nextArea) ?? contractGroups[2];
    setArea(nextGroup.label);
    setInq(nextGroup.values[0]);
    setNewDifferentials("0");
  }

  function calculate(event: React.FormEvent) {
    event.preventDefault();
    const hours = Number(ore.replace(",", "."));
    if (!Number.isFinite(hours) || hours < 1 || hours > 40) {
      setError("Inserisci un orario compreso tra 1 e 40 ore.");
      return;
    }
    router.push(`/enti-locali/risultato?inq=${inq}&nuoviDiff=${newDifferentials}&ore=${hours}`);
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <Link className="back-sector" href="/">← Scegli un altro comparto</Link>
          <span className="eyebrow"><i /> CCNL Funzioni Locali 2025–2027</span>
          <h1>Il nuovo contratto,<br /><em>senza giri di parole.</em></h1>
          <p className="hero-lead">Scopri cosa cambia davvero nella tua busta paga: aumenti, arretrati e indennità, calcolati sul tuo inquadramento.</p>
          <div className="hero-highlights">
            <div><strong>7,2%</strong><span>incremento fisso e ricorrente</span></div>
            <div><strong>3 tranche</strong><span>aumenti dal 2025 al 2027</span></div>
            <div><strong>luglio 2027</strong><span>nuova indennità di comparto</span></div>
          </div>
        </div>

        <form className="calculator" onSubmit={calculate}>
          <div className="calculator-kicker">La tua simulazione</div>
          <h2>Quanto ti spetta?</h2>
          <p>Qualifica, posizione e differenziali: ogni voce al suo posto.</p>
          <label>
            <span>Qualifica / area</span>
            <select value={area} onChange={(e) => changeArea(e.target.value)}>
              {contractGroups.map((group) => <option key={group.label}>{group.label}</option>)}
            </select>
          </label>
          <label>
            <span>Eventuale posizione economica storica</span>
            <select value={inq} onChange={(e) => setInq(e.target.value)}>
              {selectedGroup.values.map((value, index) => (
                <option key={value} value={value}>{index === 0 ? `Nessuna posizione aggiuntiva (base ex ${value})` : `Posizione economica ex ${value}`}</option>
              ))}
            </select>
          </label>
          <div className="field-help">Serve a ricostruire il differenziale stipendiale già consolidato nel passaggio al nuovo ordinamento.</div>
          <label>
            <span>Nuovi differenziali acquisiti dal 1° aprile 2023</span>
            <select value={newDifferentials} onChange={(e) => setNewDifferentials(e.target.value)}>
              {Array.from({ length:differentialRule.maxCount + 1 }, (_, count) => <option key={count} value={count}>{count === 0 ? "Nessun nuovo differenziale" : `${count === 1 ? "1 differenziale" : `${count} differenziali`} · ${(count * differentialRule.annualValue).toLocaleString("it-IT", { minimumFractionDigits:2 })} € annui`}</option>)}
            </select>
          </label>
          <div className="field-help">Ogni nuovo differenziale vale {differentialRule.annualValue.toLocaleString("it-IT", { minimumFractionDigits:2 })} € annui nell’area selezionata.</div>
          <label>
            <span>Ore settimanali</span>
            <div className="hours-field"><input inputMode="decimal" value={ore} onChange={(e) => setOre(e.target.value)} /><b>ore</b></div>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-action" type="submit">Calcola il tuo aumento <span>→</span></button>
          <small>Calcolo lordo indicativo, riproporzionato per il part-time.</small>
        </form>
      </section>

      <section className="contract-strip">
        <div><span>01</span><strong>Aumenti progressivi</strong><p>Tre decorrenze: gennaio 2025, gennaio 2026 e regime da gennaio 2027.</p></div>
        <div><span>02</span><strong>Arretrati già depurati</strong><p>La stima al 31 ottobre 2026 considera l’IVC già percepita.</p></div>
        <div><span>03</span><strong>Più risorse</strong><p>Tabellare, comparto e nuovi strumenti per la contrattazione decentrata.</p></div>
      </section>

      <section className="rights-section">
        <div className="section-number">2025<br />—27</div>
        <div>
          <span className="eyebrow dark">Non solo numeri</span>
          <h2>Un contratto è anche<br />tempo, tutele e dignità.</h2>
          <div className="rights-grid">
            <article><b>Ferie piene da subito</b><p>Eliminata la riduzione prevista per il personale neoassunto.</p></article>
            <article><b>Genitorialità tutelata</b><p>Il congedo parentale conta integralmente per tredicesima, ferie e anzianità.</p></article>
            <article><b>IA sotto controllo</b><p>Informazione e confronto sindacale, trasparenza e decisione umana effettiva.</p></article>
            <article><b>Più tempo per curarsi</b><p>Nuove tutele per patologie oncologiche, invalidanti, croniche e rare.</p></article>
          </div>
        </div>
      </section>

    </main>
  );
}
