// PROTOTYPE: throwaway. Variant D's reading of a run: tones, sub-states, transition symbols, timing scales.
import type { Run, RunState, StateId } from "../../model";

export type Tone = "sky" | "lavender" | "mauve" | "peach" | "green" | "faint";
export const TONES: Tone[] = ["sky", "lavender", "mauve", "peach", "green", "faint"];

const TONE_OF: Record<StateId, Tone> = {
  lookup: "sky", connect: "lavender", secure: "mauve", edge: "peach", firstByte: "lavender", delivered: "green", cached: "green",
};

export const toneOf = (s: RunState): Tone => (s.skipped ? "faint" : (TONE_OF[s.id] ?? "lavender"));

const quic = (run: Run) => /3|quic/i.test(run.meta.http ?? "");

/** Typical sub-steps of a state. Illustrative, never measured; the UI says so. */
export function subStates(s: RunState, run: Run): string[] {
  const m = run.meta;
  switch (s.id) {
    case "lookup": return ["stub resolver", "recursive", "root  .", "TLD  com.", "authoritative"];
    case "connect": return quic(run) ? ["Initial →", "← Initial", "Handshake"] : ["SYN →", "← SYN-ACK", "ACK →"];
    case "secure": return ["ClientHello", "ServerHello", "Certificate", "Finished"];
    case "edge": return [m.colo ? `colo ${m.colo}` : "colo", m.edgeCache ? `cache ${m.edgeCache}` : "cache", "worker"];
    case "firstByte": return ["request sent", "waiting", "headers in"];
    case "delivered": return ["first chunk", "last chunk", "parse"];
    case "cached": return ["HTTP cache", "fresh?", "disk read"];
    default: return [];
  }
}

/** What travels along the transition into `to`. The first state's symbol labels the initial arrow. */
export function arrivalSymbol(to: RunState, from: RunState | undefined, run: Run): string {
  if (!from) return "nicolassaavedra.com";
  switch (to.id) {
    case "connect": return quic(run) ? "QUIC" : "TCP";
    case "secure": return "ClientHello";
    case "edge": return "GET /";
    case "firstByte": return "response";
    case "delivered": return from.id === "cached" ? "disk" : "body";
    default: return "ε";
  }
}

/** Seconds a particle takes to cross the transition into `s`: slow phases visibly congest. */
export const travelSeconds = (s: RunState) =>
  s.skipped ? 0.22 : s.durationMs == null ? 0.8 : Math.min(3.2, 0.35 + s.durationMs * 0.028);

/** Seconds the opening execution spends on the transition into `s`. */
export const introSeconds = (s: RunState) =>
  s.skipped ? 0.14 : s.durationMs == null ? 0.32 : 0.18 + Math.min(s.durationMs, 400) * 0.012;

export function detailOf(s: RunState, run: Run): string {
  if (s.skipped) return "skipped";
  if (s.durationMs != null) return `${s.durationMs} ms`;
  if (s.id === "edge" && run.meta.colo) return run.meta.colo;
  return "no timing";
}

export const radiusOf = (s: RunState) =>
  s.skipped ? 13 : s.durationMs == null ? 17 : Math.min(34, 14 + Math.sqrt(s.durationMs) * 2.3);
