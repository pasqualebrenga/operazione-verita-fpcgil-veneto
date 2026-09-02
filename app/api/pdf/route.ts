import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { differentialRuleForLocalArea, findContractRow } from "@/lib/contract-2025-2027";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (!Number.isFinite(ore) || ore < 1 || ore > 40) {
      return NextResponse.json({ error: "Parametro ore non valido (1..40)" }, { status: 400 });
    }
    const row = findContractRow(inq);
    const differentialRule = differentialRuleForLocalArea(row.area);
    const requestedDifferentials = Number(url.searchParams.get("nuoviDiff") ?? "0");
    const differentialCount = Math.min(differentialRule.maxCount, Math.max(0, Number.isFinite(requestedDifferentials) ? Math.floor(requestedDifferentials) : 0));
    const differentialsAnnual = differentialCount * differentialRule.annualValue;

    const fattore = clamp(ore / 36, 0, 1);

    const baseAnn = (row.tabellare2024 + differentialsAnnual) * fattore;
    const finaleAnn = (row.tabellare2027 + differentialsAnnual) * fattore;
    const aumentoMese = row.aumento2027 * fattore;
    const aumentoAnn = aumentoMese * 13;
    const aumentoComparto = row.compartoIncremento2027 * fattore;
    const incrementoFissoMese = aumentoMese + aumentoComparto;
    const incrementoFissoAnn = aumentoAnn + aumentoComparto * 12;
    const arretratiTot = row.arretrati * fattore;

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
    section("1) Incremento fisso e ricorrente da luglio 2027");
    line("Tabellare mensile a regime", euro(aumentoMese));
    line("Incremento mensile indennita di comparto", euro(aumentoComparto));
    line("Totale mensile su 12 mensilita", euro(incrementoFissoMese));
    line("Totale annuo (tabellare x13 + comparto x12)", euro(incrementoFissoAnn));
    y -= 10;

    section("2) Decorrenze");
    line("Dal 1 gennaio 2025", euro(row.aumento2025 * fattore));
    line("Dal 1 gennaio 2026", euro(row.aumento2026 * fattore));
    line("Dal 1 gennaio 2027", euro(row.aumento2027 * fattore));
    line("Dal 1 luglio 2027, incluso incremento comparto", euro(incrementoFissoMese));
    y -= 10;

    section("3) Arretrati");
    line("Stima al 31 ottobre 2026", euro(arretratiTot));
    y -= 14;

    // Riepilogo stipendi
    section("Riepilogo stipendi (annuo)");
    line("Stipendio base", euro(baseAnn));
    line("Stipendio finale", euro(finaleAnn));
    if (differentialCount > 0) line("Nuovi differenziali inclusi", safe(`${differentialCount} x ${euro(differentialRule.annualValue)}`), false);

    page.drawText(
      safe("Importi lordi indicativi. Riproporzionamento part-time su base 36 ore. Verifica sempre con il cedolino."),
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
  } catch (err: unknown) {
    console.error("PDF route error:", err);
    return NextResponse.json(
      { error: "Errore generazione PDF", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
