"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const INQ = [
  "A1","A2","A3","A4","A5","A6",
  "B1","B2","B3","B4","B5","B6","B7","B8",
  "C1","C2","C3","C4","C5","C6",
  "D1","D2","D3","D4","D5","D6","D7"
] as const;

type Inq = (typeof INQ)[number];
const INQ_FOR_ZOD = INQ as unknown as [Inq, ...Inq[]];

// Output “pulito” dopo Zod (ore = number)
const schema = z.object({
  inq: z.enum(INQ_FOR_ZOD),
  oreSettimanali: z.coerce.number().int().min(1).max(40),
});
type FormOutput = z.infer<typeof schema>;

// Input “raw” dei campi (ore = string)
type FormInput = {
  inq: Inq;
  oreSettimanali: string;
};

export default function HomePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema) as unknown as Resolver<FormInput, any, FormOutput>,
    defaultValues: {
      inq: "C1",
      oreSettimanali: "36",
    },
    mode: "onSubmit",
  });

  const onSubmit = (data: FormOutput) => {
    const params = new URLSearchParams({
      inq: data.inq,
      ore: String(data.oreSettimanali),
    });
    router.push(`/risultato?${params.toString()}`);
  };

  // stessa altezza per select + input (così sono identici)
  const controlStyle: React.CSSProperties = {
    height: 44,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <main className="space-y-8">
      <section className="ov-card" style={{ padding: 24 }}>
        <div className="ov-chip">CCNL Funzioni Locali 22–24 • Confronto 2021→2026</div>

        <h1 className="ov-h1" style={{ marginTop: 14 }}>
          Operazione Verità
        </h1>

        <p className="ov-muted" style={{ marginTop: 10, maxWidth: 820, lineHeight: 1.5 }}>
          Inserisci il tuo inquadramento e le ore settimanali. In un click vedi aumento, arretrati e potere d’acquisto.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 18 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
              alignItems: "end",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>Inquadramento</div>
              <select className="ov-select" style={controlStyle} {...register("inq")}>
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
                className="ov-select"
                style={controlStyle}
                type="text"
                inputMode="numeric"
                {...register("oreSettimanali", {
                  setValueAs: (v) => String(v ?? "").trim().replace(",", "."),
                })}
                aria-invalid={errors.oreSettimanali ? "true" : "false"}
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
        </form>
      </section>
    </main>
  );
}