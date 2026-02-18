"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const INQ = [
  "A1","A2","A3","A4","A5","A6",
  "B1","B2","B3","B4","B5","B6","B7","B8",
  "C1","C2","C3","C4","C5","C6",
  "D1","D2","D3","D4","D5","D6","D7"
] as const;

// ✅ Niente coerce: oreSettimanali è NUMBER vero
const schema = z.object({
  inq: z.enum(INQ),
  oreSettimanali: z.number().min(1).max(40),
});

type FormData = z.infer<typeof schema>;

export default function HomePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { inq: "C1", oreSettimanali: 36 },
    mode: "onSubmit",
  });

  const onSubmit = (data: FormData) => {
    const params = new URLSearchParams({
      inq: data.inq,
      ore: String(data.oreSettimanali),
    });
    router.push(`/risultato?${params.toString()}`);
  };

  return (
    <main className="space-y-8">
      <section className="ov-card" style={{ padding: 24 }}>
        <div className="ov-chip">CCNL Funzioni Locali 22–24 • Confronto 2021→2026</div>

        <h1 className="ov-h1" style={{ marginTop: 14 }}>
          Operazione Verità
        </h1>

        <p className="ov-muted" style={{ marginTop: 10, maxWidth: 820, lineHeight: 1.5 }}>
          Inserisci il tuo inquadramento e le ore settimanali. In un click vedi l’aumento medio,
          lo scarto piattaforma e la perdita di potere d’acquisto (in euro).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 18 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              alignItems: "end",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>Inquadramento</div>
              <select className="ov-select" {...register("inq")}>
                {INQ.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>Ore settimanali</div>
              <input
                className="ov-input"
                type="number"
                step="1"
                // ✅ questo fa arrivare un number vero a RHF, quindi z.number() è felice
                {...register("oreSettimanali", { valueAsNumber: true })}
              />
              {errors.oreSettimanali && (
                <div style={{ fontSize: 12, color: "var(--ov-red)", fontWeight: 900 }}>
                  Inserisci un valore tra 1 e 40
                </div>
              )}
            </label>
          </div>

          <button
            className="ov-btn ov-btn-primary"
            type="submit"
            style={{ width: "100%", height: 48, marginTop: 12 }}
          >
            Calcola
          </button>

          <div className="ov-muted" style={{ marginTop: 12, fontSize: 12 }}>
            Dati: tabella CGIL (valori annui). Riproporzionamento part-time su base 36 ore.
          </div>
        </form>
      </section>
    </main>
  );
}