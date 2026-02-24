import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ccnl from "@/data/ccnl_fl_2021_2026.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- schema vecchio ---
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

// --- schema nuovo ---
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

function isOldRow(r: AnyRow): r is OldRow {
  return (r as any).stipendio_attuale_2021 !== undefined;
}
function isNewRow(r: AnyRow): r is NewRow {
  return (r as any).stipendio_mensile_2019_2021 !== undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safe(s: string) {
  // Helvetica/WinAnsi: evita simboli “strani”
  return s
    .replaceAll("→", "->")
    .replaceAll("•", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u00A0", " ");
}

function euro(n: number) {
  return safe(`€ ${n.toFixed(2)}`);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const inq = (url.searchParams.get("inq") ?? "C1").toUpperCase();
    const ore = Number(url.searchParams.get("ore") ?? "36");
    const inflazionePct = Number(url.searchParams.get("infl") ?? "18");

    if (!Number.isFinite(ore) || ore < 1 || ore > 40) {
      return NextResponse.json({ error: "Parametro ore non valido (1..40)" }, { status: 400 });
    }
    if (!Number.isFinite(inflazionePct) || inflazionePct < 0 || inflazionePct > 99) {
      return NextResponse.json({ error: "Parametro infl non valido (0..99)" }, { status: 400 });
    }

    const data = ccnl as unknown as AnyRow[];
    const row = (data.find((x) => (x as any).inquadramento === inq) ?? data[0]) as AnyRow;

    const fattore = clamp(ore / 36, 0, 1);

    // Valori normalizzati (annui su 13 mensilità dove ha senso)
    let baseAnn = 0;
    let finaleAnn = 0;

    let aumentoMese = 0;
    let aumentoAnn = 0;

    let arretratiTot = 0;
    let arretratiDa = 0;

    let riduzioneRealePct: number | null = null;

    if (isOldRow(row)) {
      baseAnn = row.stipendio_attuale_2021 * fattore;
      finaleAnn = row.stipendio_che_avrai_2026 * fattore;

      aumentoAnn = finaleAnn - baseAnn;
      aumentoMese = aumentoAnn / 13;

      arretratiTot = row.arretrati_anni_2022_2024 * fattore;
      arretratiDa = row.da_ricevere_per_gli_anni_2022_2024 * fattore;
    } else if (isNewRow(row)) {
      // tabella nuova: mensile -> annuo (13)
      baseAnn = row.stipendio_mensile_2019_2021 * 13 * fattore;
      finaleAnn = row.stipendio_con_conglobamento_2026 * 13 * fattore;

      // aumento “politico” dalla tabella
      aumentoMese = row.differenza_mensile_da_percepire_2024_2025 * fattore;
      aumentoAnn = aumentoMese * 13;

      arretratiTot = row.arretrati_fino_feb_2026 * fattore;
      arretratiDa = arretratiTot;

      riduzioneRealePct = row.riduzione_valore_reale_percent;
    } else {
      return NextResponse.json({ error: "Formato dati non riconosciuto" }, { status: 500 });
    }

    // Potere d’acquisto (calcolo)
    const infl = inflazionePct / 100;
    const necessario = baseAnn * (1 + infl);
    const perditaAnn = Math.max(0, necessario - finaleAnn);
    const perditaMese = perditaAnn / 13;

    // ---- PDF ----
    const A4_W = 595.28;
    const A4_H = 841.89;
    const margin = 48;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4_W, A4_H]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const red = rgb(0.882, 0.114, 0.180); // CGIL-ish
    const text = rgb(0.06, 0.09, 0.16);
    const muted = rgb(0.35, 0.38, 0.43);
    const border = rgb(0.85, 0.86, 0.88);

    let y = A4_H - margin;

    page.drawText(safe("FP Cgil Rovigo"), { x: margin, y, size: 12, font: fontBold, color: red });
    page.drawText(safe("Operazione Verita - Funzioni Locali"), {
      x: margin,
      y: y - 18,
      size: 18,
      font: fontBold,
      color: text,
    });
    page.drawText(safe(`Inquadramento: ${inq} - Ore settimanali: ${ore}`), {
      x: margin,
      y: y - 40,
      size: 11,
      font,
      color: text,
    });

    y -= 74;

    const section = (title: string) => {
      page.drawText(safe(title), { x: margin, y, size: 12, font: fontBold, color: red });
      y -= 18;
      page.drawLine({ start: { x: margin, y }, end: { x: A4_W - margin, y }, thickness: 1, color: border });
      y -= 14;
    };

    const line = (label: string, value: string, boldValue = true) => {
      const L = safe(label);
      const V = safe(value);
      page.drawText(L, { x: margin, y, size: 11, font, color: text });

      const chosen = boldValue ? fontBold : font;
      const w = chosen.widthOfTextAtSize(V, 11);
      page.drawText(V, { x: A4_W - margin - w, y, size: 11, font: chosen, color: text });

      y -= 18;
    };

    // 1) DIFFERENZA
    section("1) Differenza (aumento)");
    line("Aumento medio (mensile)", euro(aumentoMese));
    line("Aumento medio (annuo su 13)", euro(aumentoAnn));
    y -= 10;

    // 2) POTERE D’ACQUISTO
    section("2) Potere d'acquisto");
    line("Inflazione cumulata usata", safe(`${inflazionePct.toFixed(0)}%`), false);
    line("Necessario (per non perdere)", euro(necessario));
    line("Perdita (mensile su 13)", euro(perditaMese));
    line("Perdita (annua)", euro(perditaAnn));
    if (riduzioneRealePct !== null && Number.isFinite(riduzioneRealePct)) {
      y -= 6;
      line("Riduzione valore reale (dato tabella)", safe(`${riduzioneRealePct.toFixed(2)}%`), false);
    }
    y -= 10;

    // 3) ARRETRATI
    section("3) Arretrati");
    line("Totale arretrati", euro(arretratiTot));
    line("Da ricevere", euro(arretratiDa));
    y -= 14;

    // Riepilogo stipendi
    section("Riepilogo stipendi (annuo)");
    line("Stipendio base", euro(baseAnn));
    line("Stipendio finale", euro(finaleAnn));

    page.drawText(
      safe("Fonte dati: tabella CGIL fornita. Riproporzionamento part-time su base 36 ore. Verifica sempre con il cedolino."),
      { x: margin, y: margin - 6, size: 9, font, color: muted }
    );

    const bytes = await pdfDoc.save();
    const filename = `operazione-verita_${inq}_${ore}h.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF route error:", err);
    return NextResponse.json(
      { error: "Errore generazione PDF", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}