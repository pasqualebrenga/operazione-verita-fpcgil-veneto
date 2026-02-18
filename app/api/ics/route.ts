import assemblee from "@/data/assemblee_marzo_2026.json";

function toIcsDate(date: string, time: string) {
  return date.replace(/-/g, "") + "T" + time.replace(":", "") + "00";
}

export async function GET() {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//FPCGIL Veneto//Operazione Verita//IT");
  lines.push("CALSCALE:GREGORIAN");

  for (const e of assemblee as any[]) {
    const dtStart = toIcsDate(e.date, e.start);
    const dtEnd = toIcsDate(e.date, e.end);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.date}-${String(e.title).replace(/\s+/g, "-")}@fpcgilveneto`);
    lines.push(`DTSTAMP:${toIcsDate("2026-02-17", "09:00")}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${e.title}`);
    lines.push(`LOCATION:${e.place}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="assemblee-marzo-2026.ics"'
    }
  });
}