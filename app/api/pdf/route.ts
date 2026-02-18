import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ccnl from "@/data/ccnl_fl_2021_2026.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
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

function safe(s: string) {
  // Helvetica/WinAnsi non supporta vari simboli Unicode (→ • – — ecc.)
  return s
    .replaceAll("→", "->")
    .replaceAll("•", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u00A0", " "); // no-break space
}

function euro(n: number) {
  // Manteniamo il simbolo € ma lo facciamo passare da safe() (extra-sicuro)
  return safe(`€ ${n.toFixed(2)}`);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const inq = (url.searchParams.get("inq") ?? "C1").toUpperCase();
    const ore = Number(url.searchParams.get("ore") ?? "36");
    const inflazionePct = Number(url.searchParams.get("infl") ?? "18");

    if (!Number.isFinite(ore) || ore < 1 || ore > 40) {
      return NextResponse.json(
        { error: "Parametro ore non valido (1..40)" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(inflazionePct) || inflazionePct < 0 || inflazionePct > 100) {
      return NextResponse.json(
        { error: "Parametro infl non valido (0..100)" },
        { status: 400 }
      );
    }

    const data = ccnl as Row[];
    const row = data.find((x) => x.inquadramento === inq) ?? data[0];

    const fattore = clamp(ore / 36, 0, 1);

    const attuale = row.stipendio_attuale_2021 * fattore;
    const avrai = row.stipendio_che_avrai_2026 * fattore;
    const piattaforma = row.stipendio_minimo_piattaforma_2026 * fattore;

    const deltaAnn = avrai - attuale;
    const deltaMese = deltaAnn / 13;

    const gapAnn = piattaforma - avrai;
    const gapMese = gapAnn / 13;

    const obiettivoRaggiunto = gapMese <= 0.0001;
    const gapAnnPos = Math.max(0, gapAnn);
    const gapMesePos = Math.max(0, gapMese);

    const arretrati = row.arretrati_anni_2022_2024 * fattore;
    const anticipato = row.gia_anticipato_in_busta * fattore;
    const daRicevere = row.da_ricevere_per_gli_anni_2022_2024 * fattore;

    const taglio = row.taglio_governo_tre_anni * fattore;
    const costoMese = row.costo_al_mese * fattore;

    const infl = inflazionePct / 100;
    const necessarioPerTenerePotere = attuale * (1 + infl);
    const perditaPotereAnnua = Math.max(0, necessarioPerTenerePotere - avrai);
    const perditaPotereMensile = perditaPotereAnnua / 13;

    // ---- PDF setup (A4 points) ----
    const A4_W = 595.28;
    const A4_H = 841.89;
    const margin = 48;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4_W, A4_H]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const red = rgb(0.882, 0.114, 0.180); // ~ #e11d2e
    const text = rgb(0.06, 0.09, 0.16);
    const muted = rgb(0.35, 0.38, 0.43);
    const border = rgb(0.85, 0.86, 0.88);

    let y = A4_H - margin;

    // Header
    page.drawText(safe("FP Cgil Rovigo"), {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: red,
    });

    page.drawText(safe("Operazione Verita - Funzioni Locali (2021-2026)"), {
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
      page.drawText(safe(title), {
        x: margin,
        y,
        size: 12,
        font: fontBold,
        color: red,
      });
      y -= 18;
      page.drawLine({
        start: { x: margin, y },
        end: { x: A4_W - margin, y },
        thickness: 1,
        color: border,
      });
      y -= 14;
    };

    const line = (label: string, value: string, boldValue = true) => {
      const L = safe(label);
      const V = safe(value);

      page.drawText(L, { x: margin, y, size: 11, font, color: text });

      const chosen = boldValue ? fontBold : font;
      const w = chosen.widthOfTextAtSize(V, 11);

      page.drawText(V, {
        x: A4_W - margin - w,
        y,
        size: 11,
        font: chosen,
        color: text,
      });

      y -= 18;
    };

    // 1) PRE/POST
    section("1) Pre/Post (stipendio)");
    line("Stipendio 2021 (annuo)", euro(attuale));
    line("Stipendio 2026 (annuo)", euro(avrai));
    line("Aumento medio (mensile su 13)", euro(deltaMese));
    line("Aumento medio (annuo)", euro(deltaAnn));
    y -= 6;

    if (obiettivoRaggiunto) {
      line("Quanto manca a quello che chiedevamo", safe("Obiettivo raggiunto"), true);
    } else {
      line("Quanto manca a quello che chiedevamo (mensile su 13)", euro(gapMesePos));
      line("Quanto manca a quello che chiedevamo (annuo)", euro(gapAnnPos));
    }

    line("Nota", "Differenza tra l’obiettivo CGIL 2026 e lo stipendio 2026 che avrai.", false);

    y -= 18;

    // 2) POTERE D’ACQUISTO
    section("2) Potere d'acquisto (in euro)");
    line("Inflazione cumulata 2021-2026", safe(`${inflazionePct.toFixed(1)}%`), false);
    line("Necessario nel 2026 (per non perdere)", euro(necessarioPerTenerePotere));
    line("Perdita potere d'acquisto (mensile su 13)", euro(perditaPotereMensile));
    line("Perdita potere d'acquisto (annua)", euro(perditaPotereAnnua));
    y -= 18;

    // 3) ARRETRATI
    section("3) Arretrati 2022-2024");
    line("Totale arretrati", euro(arretrati));
    line("Gia' anticipato in busta", euro(anticipato));
    line("Da ricevere", euro(daRicevere));
    y -= 6;
    line("Taglio complessivo (3 anni)", euro(taglio));
    line("Costo al mese", euro(costoMese));
    y -= 18;

    // Footer
    page.drawText(
      safe(
        "Fonte: tabella CGIL fornita. Valori annui riproporzionati su base 36 ore. Verifica sempre con il cedolino."
      ),
      { x: margin, y: margin - 6, size: 9, font, color: muted }
    );

    const bytes = await pdfDoc.save();
    const filename = `operazione-verita_${inq}_${ore}h.pdf`;

    // Niente Buffer: compatibile ovunque
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