// PROTOTYPE: throwaway. Pure model for the Request Automaton, shared by every variant.
// Turns the /cdn-cgi/trace text and the Navigation Timing entry into the run a renderer draws.

export type StateId = "lookup" | "connect" | "secure" | "edge" | "firstByte" | "delivered" | "cached";

export interface RunState {
  id: StateId;
  label: string;
  /** Milliseconds spent in this state; undefined when there is no data for it. */
  durationMs?: number;
  /** The browser reported this phase as zero (e.g. a reused connection). */
  skipped?: boolean;
  /** Short log-style line shown on hover/focus, in mono. */
  log: string;
}

export interface RunMeta {
  colo?: string;
  city?: string;
  http?: string;
  tls?: string;
  kex?: string;
  edgeCache?: "HIT" | "MISS";
}

export interface Run {
  kind: "real" | "example";
  states: RunState[];
  meta: RunMeta;
  totalMs?: number;
}

export type NavTimingLike = Pick<
  PerformanceNavigationTiming,
  | "domainLookupStart" | "domainLookupEnd" | "connectStart" | "connectEnd" | "secureConnectionStart"
  | "requestStart" | "responseStart" | "responseEnd" | "transferSize" | "decodedBodySize" | "nextHopProtocol"
> & { deliveryType?: string };

const TRACE_KEYS = ["colo", "http", "tls", "kex"] as const;

const CITIES: Record<string, string> = {
  BOG: "Bogotá", MDE: "Medellín", MIA: "Miami", LIM: "Lima", SCL: "Santiago", GRU: "São Paulo",
  MEX: "Mexico City", SJC: "San Jose", IAD: "Ashburn", EWR: "Newark", LHR: "London", FRA: "Frankfurt",
  MAD: "Madrid", AMS: "Amsterdam", CDG: "Paris", NRT: "Tokyo", SIN: "Singapore",
};

/** Keeps only whitelisted keys. Everything else, including `ip`, is dropped here and never returned. */
export function parseTrace(text: string): Partial<Record<(typeof TRACE_KEYS)[number], string>> {
  const out: Partial<Record<(typeof TRACE_KEYS)[number], string>> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    if ((TRACE_KEYS as readonly string[]).includes(key)) out[key as (typeof TRACE_KEYS)[number]] = line.slice(i + 1).trim();
  }
  return out;
}

const span = (a: number, b: number) => Math.max(0, Math.round(b - a));

export function toRun(traceText: string | null, nav: NavTimingLike | null, edgeCache?: "HIT" | "MISS"): Run {
  if (!traceText || !nav) return EXAMPLE_RUN;
  const t = parseTrace(traceText);
  if (!t.colo) return EXAMPLE_RUN;

  const meta: RunMeta = { colo: t.colo, city: CITIES[t.colo], http: t.http ?? nav.nextHopProtocol, tls: t.tls, kex: t.kex, edgeCache };
  const where = meta.city ? `${meta.city} (${meta.colo})` : meta.colo;

  const fromBrowserCache = nav.deliveryType === "cache" || (nav.transferSize === 0 && nav.decodedBodySize > 0);
  if (fromBrowserCache) {
    return {
      kind: "real",
      meta,
      totalMs: span(0, nav.responseEnd),
      states: [
        { id: "cached", label: "Cached", durationMs: span(0, nav.responseEnd), log: "[cache] served from your browser; the network was never asked" },
        { id: "delivered", label: "Delivered", log: "[done] page ready" },
      ],
    };
  }

  const lookup = span(nav.domainLookupStart, nav.domainLookupEnd);
  const tlsStart = nav.secureConnectionStart > 0 ? nav.secureConnectionStart : nav.connectEnd;
  const connect = span(nav.connectStart, tlsStart);
  const secure = nav.secureConnectionStart > 0 ? span(nav.secureConnectionStart, nav.connectEnd) : 0;
  const firstByte = span(nav.requestStart, nav.responseStart);
  const delivered = span(nav.responseStart, nav.responseEnd);

  const s = (id: StateId, label: string, ms: number, log: string): RunState =>
    ms === 0 ? { id, label, skipped: true, log: `${log} (skipped: reused)` } : { id, label, durationMs: ms, log };

  return {
    kind: "real",
    meta,
    totalMs: span(nav.domainLookupStart, nav.responseEnd),
    states: [
      s("lookup", "Lookup", lookup, `[dns] resolved nicolassaavedra.com in ${lookup} ms`),
      s("connect", "Connect", connect, `[tcp] handshake in ${connect} ms`),
      s("secure", "Secure", secure, `[tls] ${meta.tls ?? "TLS"} · ${meta.kex ?? "key exchange"} in ${secure} ms`),
      { id: "edge", label: "Edge", log: `[edge] ${where} answered over ${meta.http ?? "http"}${edgeCache ? ` · cache ${edgeCache}` : ""}` },
      s("firstByte", "First byte", firstByte, `[ttfb] first byte after ${firstByte} ms`),
      s("delivered", "Delivered", delivered, `[done] ${Math.round(nav.decodedBodySize / 1024)} KB of HTML in ${delivered} ms`),
    ],
  };
}

/** Clearly labeled example run: what a Bogotá visitor typically sees. */
export const EXAMPLE_RUN: Run = {
  kind: "example",
  meta: { colo: "BOG", city: "Bogotá", http: "http/3", tls: "TLSv1.3", kex: "X25519MLKEM768" },
  totalMs: 126,
  states: [
    { id: "lookup", label: "Lookup", durationMs: 14, log: "[dns] resolved nicolassaavedra.com in 14 ms" },
    { id: "connect", label: "Connect", durationMs: 22, log: "[quic] handshake in 22 ms" },
    { id: "secure", label: "Secure", durationMs: 31, log: "[tls] TLSv1.3 · X25519MLKEM768 (post-quantum) in 31 ms" },
    { id: "edge", label: "Edge", log: "[edge] Bogotá (BOG) answered over http/3" },
    { id: "firstByte", label: "First byte", durationMs: 41, log: "[ttfb] first byte after 41 ms" },
    { id: "delivered", label: "Delivered", durationMs: 18, log: "[done] 24 KB of HTML in 18 ms" },
  ],
};

/** Browser-side collection. `?data=sample` forces the example; `?data=live` tries the real request. */
export async function collectRun(): Promise<Run> {
  const mode = new URLSearchParams(location.search).get("data") ?? "sample";
  if (mode === "sample") return EXAMPLE_RUN;
  const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined) ?? null;
  let trace: string | null = null;
  try {
    const res = await fetch("/cdn-cgi/trace", { cache: "no-store" });
    if (res.ok) trace = await res.text();
  } catch {}
  return toRun(trace, nav);
}
