// GET /api/space-weather — server-side proxy for NASA DONKI (FLR + SEP), last 30 days.
// Keeps NASA_API_KEY on the server, validates and normalizes records, caches for 6 h, and never invents data.
import { NextResponse } from "next/server";

export const revalidate = 21600; // 6 hours

type Flare = { type: "FLR"; id: string; classType: string; time: string; link: string | null };
type Sep = { type: "SEP"; id: string; time: string; link: string | null };

const TIMEOUT_MS = 8000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function getJSON(url: string): Promise<unknown[]> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, next: { revalidate } });
    if (r.status === 429) throw new Error("rate limited (429)");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const txt = await r.text();
    if (!txt.trim()) return [];
    const j = JSON.parse(txt);
    if (!Array.isArray(j)) throw new Error("unexpected response shape");
    return j;
  } finally {
    clearTimeout(t);
  }
}

const normFLR = (a: unknown[]): Flare[] =>
  a.flatMap((x: any) =>
    x && typeof x.flrID === "string" && typeof x.classType === "string" && /^[ABCMX]\d/.test(x.classType) && (x.peakTime || x.beginTime)
      ? [{ type: "FLR" as const, id: x.flrID, classType: x.classType, time: x.peakTime || x.beginTime, link: typeof x.link === "string" ? x.link : null }]
      : []);
const normSEP = (a: unknown[]): Sep[] =>
  a.flatMap((x: any) =>
    x && typeof x.sepID === "string" && typeof x.eventTime === "string"
      ? [{ type: "SEP" as const, id: x.sepID, time: x.eventTime, link: typeof x.link === "string" ? x.link : null }]
      : []);
const rank = (c: string) => ({ X: 4, M: 3, C: 2, B: 1, A: 0 } as Record<string, number>)[c[0]] * 100 + (parseFloat(c.slice(1)) || 0);

export async function GET() {
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  const end = new Date(), start = new Date(end.getTime() - 30 * 864e5);
  const q = `startDate=${iso(start)}&endDate=${iso(end)}`;
  const endpoints = [
    { name: "api.nasa.gov", url: (t: string) => `https://api.nasa.gov/DONKI/${t}?${q}&api_key=${encodeURIComponent(key)}` },
    { name: "CCMC DONKI web service", url: (t: string) => `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${t}?${q}` },
  ];
  let lastErr = "unavailable";
  for (const ep of endpoints) {
    try {
      const [flr, sep] = await Promise.all([getJSON(ep.url("FLR")).then(normFLR), getJSON(ep.url("SEP")).then(normSEP)]);
      const latestSep = [...sep].sort((a, b) => b.time.localeCompare(a.time))[0] ?? null;
      const strongest = [...flr].sort((a, b) => rank(b.classType) - rank(a.classType))[0] ?? null;
      // Game interpretation (documented in SOURCES.md): SEP → high, X-class flare → elevated, otherwise moderate.
      const tier = latestSep ? "high" : strongest?.classType.startsWith("X") ? "elevated" : "moderate";
      return NextResponse.json({
        status: "live", source: "NASA DONKI", endpoint: ep.name, range: [iso(start), iso(end)], fetchedAt: Date.now(),
        counts: { flr: flr.length, sep: sep.length }, record: latestSep ?? strongest, tier,
        note: "DONKI catalogs solar events. It is not a measurement of radiation at the lunar surface.",
      });
    } catch (e) {
      lastErr = e instanceof Error ? (e.name === "AbortError" ? "timed out" : e.message) : String(e);
    }
  }
  return NextResponse.json(
    { status: "curated", source: null, tier: "elevated", error: lastErr, label: "Predefined educational scenario",
      note: "NASA DONKI could not be reached. The game uses its built-in teaching scenario; no data were substituted." },
    { status: 200 },
  );
}
