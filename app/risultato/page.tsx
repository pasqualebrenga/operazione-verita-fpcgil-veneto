import { redirect } from "next/navigation";

export default async function LegacyResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) query.set(key, value);
  }
  redirect(`/enti-locali/risultato${query.size ? `?${query.toString()}` : ""}`);
}
