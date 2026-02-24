import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "assemblee_v1";

const redis = Redis.fromEnv();

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const data = await redis.get(KEY);
  return NextResponse.json({ data: data ?? null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { password, data } = body as { password?: string; data?: any };

  if (!password || password !== process.env.ADMIN_PASSWORD) return unauthorized();
  if (!Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid data (expected array)" }, { status: 400 });
  }

  // validazione minima
  for (const e of data) {
    if (!e || typeof e !== "object") return NextResponse.json({ error: "Invalid row" }, { status: 400 });
    if (typeof e.date !== "string") return NextResponse.json({ error: "Missing date" }, { status: 400 });
    if (typeof e.title !== "string") return NextResponse.json({ error: "Missing title" }, { status: 400 });
    if (typeof e.start !== "string") return NextResponse.json({ error: "Missing start" }, { status: 400 });
    if (typeof e.end !== "string") return NextResponse.json({ error: "Missing end" }, { status: 400 });
    if (typeof e.place !== "string") return NextResponse.json({ error: "Missing place" }, { status: 400 });
    if (typeof e.mode !== "string") return NextResponse.json({ error: "Missing mode" }, { status: 400 });
  }

  await redis.set(KEY, data);
  return NextResponse.json({ ok: true });
}