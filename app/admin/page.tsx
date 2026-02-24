"use client";

import { useEffect, useMemo, useState } from "react";
import defaultAssemblee from "@/data/assemblee_marzo_2026.json";

type Assemblea = {
  title: string;
  date: string;  // YYYY-MM-DD
  start: string; // HH:MM
  end: string;   // HH:MM
  place: string;
  mode: "da_remoto" | "in_presenza" | string;
};

function emptyRow(): Assemblea {
  return {
    title: "Assemblea",
    date: "2026-03-01",
    start: "09:00",
    end: "11:00",
    place: "",
    mode: "in_presenza",
  };
}

function sortKey(a: Assemblea) {
  return `${a.date} ${a.start}`.trim();
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);

  const [rows, setRows] = useState<Assemblea[]>((defaultAssemblee as any) as Assemblea[]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const canEdit = useMemo(() => logged && password.length > 0, [logged, password]);

  // recupera password salvata (comodità)
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password");
    if (saved) setPassword(saved);
  }, []);

  async function load() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/assemblee", { cache: "no-store" });
      const bodyText = await res.text();
      let bodyJson: any = null;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        bodyJson = null;
      }

      const data = bodyJson?.data;
      if (Array.isArray(data)) setRows(data);
      else setRows((defaultAssemblee as any) as Assemblea[]);
    } catch {
      setRows((defaultAssemblee as any) as Assemblea[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogin() {
    if (!password) return;
    sessionStorage.setItem("admin_password", password);
    setLogged(true);
    setMsg("Ok: admin attivo ✅");
    setTimeout(() => setMsg(null), 1500);
  }

  function logout() {
    setLogged(false);
    setMsg("Admin disattivato");
    setTimeout(() => setMsg(null), 1500);
  }

  function updateRow(i: number, patch: Partial<Assemblea>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function sortByDate() {
    setRows((prev) => [...prev].sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/assemblee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, data: rows }),
      });

      // body sempre leggibile
      const bodyText = await res.text();
      let bodyJson: any = null;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        bodyJson = null;
      }

      if (res.status === 401) {
        setMsg("Password errata ❌");
        setLogged(false);
        return;
      }

      if (!res.ok) {
        setMsg(`Errore salvataggio ❌ (HTTP ${res.status}) ${bodyJson?.error ?? bodyText ?? "unknown"}`);
        return;
      }

      setMsg("Salvato ✅");
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Errore di rete ❌");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="ov-container" style={{ padding: 24 }}>
      <section className="ov-card" style={{ padding: 24 }}>
        <div className="ov-h1">Admin assemblee</div>
        <div className="ov-muted" style={{ marginTop: 6 }}>
          Aggiungi / rimuovi / modifica. Salvataggio su Upstash via API.
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="password"
            className="ov-input"
            placeholder="Password admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ maxWidth: 320 }}
          />

          <button type="button" className="ov-btn ov-btn-primary" onClick={doLogin}>
            Attiva admin
          </button>

          <button type="button" className="ov-btn ov-btn-ghost" onClick={logout} disabled={!logged}>
            Disattiva
          </button>

          <button type="button" className="ov-btn ov-btn-ghost" onClick={load} disabled={loading}>
            Ricarica
          </button>

          <button type="button" className="ov-btn ov-btn-ghost" onClick={sortByDate} disabled={!canEdit}>
            Ordina per data
          </button>

          <button type="button" className="ov-btn ov-btn-ghost" onClick={addRow} disabled={!canEdit}>
            + Aggiungi
          </button>

          <button type="button" className="ov-btn ov-btn-primary" onClick={save} disabled={!canEdit || saving}>
            {saving ? "Salvataggio…" : "Salva"}
          </button>

          {msg && <div className="ov-muted" style={{ fontWeight: 900 }}>{msg}</div>}
        </div>
      </section>

      <section className="ov-card" style={{ padding: 24, marginTop: 12 }}>
        <div className="ov-h2">Elenco assemblee</div>

        {loading ? (
          <div className="ov-muted" style={{ marginTop: 10 }}>Caricamento…</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {rows.map((r, i) => (
              <div key={`${r.date}-${r.start}-${i}`} className="ov-card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "1.2fr 0.7fr 0.5fr 0.5fr 1.2fr 0.7fr auto",
                    alignItems: "center",
                  }}
                >
                  <input
                    className="ov-input"
                    value={r.title}
                    onChange={(e) => updateRow(i, { title: e.target.value })}
                    disabled={!canEdit}
                    placeholder="Titolo"
                  />

                  <input
                    className="ov-input"
                    value={r.date}
                    onChange={(e) => updateRow(i, { date: e.target.value })}
                    disabled={!canEdit}
                    placeholder="YYYY-MM-DD"
                  />

                  <input
                    className="ov-input"
                    value={r.start}
                    onChange={(e) => updateRow(i, { start: e.target.value })}
                    disabled={!canEdit}
                    placeholder="HH:MM"
                  />

                  <input
                    className="ov-input"
                    value={r.end}
                    onChange={(e) => updateRow(i, { end: e.target.value })}
                    disabled={!canEdit}
                    placeholder="HH:MM"
                  />

                  <input
                    className="ov-input"
                    value={r.place}
                    onChange={(e) => updateRow(i, { place: e.target.value })}
                    disabled={!canEdit}
                    placeholder="Luogo"
                  />

                  <select
                    className="ov-select"
                    value={r.mode}
                    onChange={(e) => updateRow(i, { mode: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="in_presenza">In presenza</option>
                    <option value="da_remoto">Da remoto</option>
                  </select>

                  <button
                    type="button"
                    className="ov-btn ov-btn-ghost"
                    onClick={() => removeRow(i)}
                    disabled={!canEdit}
                    title="Rimuovi"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}