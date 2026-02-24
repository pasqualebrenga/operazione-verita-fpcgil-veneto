import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "assemblee_v1";

function getRedis() {
  // Vercel Upstash integration spesso espone KV_REST_API_URL / KV_REST_API_TOKEN
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_URL ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN ||
    "";

  if (!url || !token) {
    throw new Error("Missing Upstash env vars (KV_REST_API_URL / KV_REST_API_TOKEN)");
  }

  return new Redis({ url, token });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const redis = getRedis();
    const data = await redis.get(KEY);
    return NextResponse.json({ data: data ?? null });
  } catch (err: any) {
    console.error("GET /api/assemblee error:", err);
    return NextResponse.json({ error: "Upstash not configured" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    const { password, data } = body as { password?: string; data?: any };

    const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
    const provided = (password ?? "").trim();
    if (!provided || provided !== expected) return unauthorized();

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

    const redis = getRedis();
    await redis.set(KEY, data);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/assemblee error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}