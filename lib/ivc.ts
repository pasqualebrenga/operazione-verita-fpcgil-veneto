import ivcTable from "@/data/ivc_gia_percepita.json";

export type IvcRow = {
  y2024: number;
  y2025: number;
  monthly2026?: number; // opzionale: se non c'è, stimiamo da y2025/12
};

const FULL_TIME_HOURS = 36;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function normKey(inq: string) {
  return (inq || "").trim().toUpperCase().replace(/\s+/g, "");
}

function asNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function calcolaIvcGiaPercepita(params: {
  inq: string;
  oreSettimanali?: number;
  mesi2026DaSottrarre?: number; // per noi: 2 (gen+feb 2026)
}): { totale: number; y2024: number; y2025: number; y2026: number; stimata2026: boolean } {
  const { inq, oreSettimanali = FULL_TIME_HOURS, mesi2026DaSottrarre = 0 } = params;

  const key = normKey(inq);
  const row = (ivcTable as unknown as Record<string, IvcRow>)[key];

  if (!row) {
    return { totale: 0, y2024: 0, y2025: 0, y2026: 0, stimata2026: false };
  }

  const ratio = clamp(oreSettimanali / FULL_TIME_HOURS, 0, 1);

  const y2024 = asNum(row.y2024);
  const y2025 = asNum(row.y2025);

  let stimata2026 = false;
  let monthly2026 = 0;

  if (row.monthly2026 !== undefined && row.monthly2026 !== null) {
    monthly2026 = asNum(row.monthly2026);
  } else if (y2025 > 0) {
    // stima: media mensile 2025 (y2025 / 12)
    monthly2026 = y2025 / 12;
    stimata2026 = mesi2026DaSottrarre > 0;
  }

  const y2026 = monthly2026 * asNum(mesi2026DaSottrarre);

  const tot = (y2024 + y2025 + y2026) * ratio;

  return {
    totale: round2(tot),
    y2024: round2(y2024 * ratio),
    y2025: round2(y2025 * ratio),
    y2026: round2(y2026 * ratio),
    stimata2026,
  };
}