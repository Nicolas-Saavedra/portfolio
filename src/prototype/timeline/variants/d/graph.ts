// PROTOTYPE: throwaway. Variant D's graph model: time as months, lane states, and the rows of the
// `git log --graph`. Pure data, no DOM: on the real site all of this would run at build time.
import type { VariantContext } from "../../types";

export type Entry = VariantContext["entries"][number];
export type Lane = "engineering" | "teaching" | "education";
/** active: in a role (or studying). idle: the Track exists but sits between roles. none: not yet, or no longer. */
export type State = "active" | "idle" | "none";

/** Where a row's node sits, from the row's top, in px. The card's first line is centred on it. */
export const NODE_Y = 20;
/** Width of the graph column, in px. */
export const GRAPH_W = 64;

/** "YYYY-MM" to months since year 0. */
export const mi = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + m - 1;
};
export const yearOf = (m: number) => Math.floor(m / 12);

export type Row =
  | { kind: "next"; t: number; year: number }
  | { kind: "head"; t: number; year: number }
  | { kind: "edu"; t: number; year: number }
  | { kind: "entry"; t: number; year: number; e: Entry; fork: boolean }
  | { kind: "root"; t: number; year: number };

export function model(ctx: VariantContext) {
  const now = mi(ctx.now);
  const endX = (e: Entry) => (e.end === "present" ? now + 1 : mi(e.end) + 1); // exclusive: a role ending in June covers June
  const eduS = mi(ctx.education.start);
  const eduE = mi(ctx.education.end) + 1;
  const byTrack = (lane: Lane) => ctx.entries.filter((e) => e.track === lane);
  const forkOf = (lane: Lane) => Math.min(...byTrack(lane).map((e) => mi(e.start)));

  function state(lane: Lane, m: number): State {
    if (lane === "education") return m >= eduS && m < eduE ? "active" : "none";
    const es = byTrack(lane);
    if (!es.length || m < forkOf(lane) || m >= Math.max(...es.map(endX))) return "none";
    return es.some((e) => mi(e.start) <= m && m < endX(e)) ? "active" : "idle";
  }

  const marks = [...new Set([eduS, eduE, ...ctx.entries.flatMap((e) => [mi(e.start), endX(e)])])];
  /** The stretch of time from `hi` down to `lo`, split where `lane` changes state, as fractions (0 = hi, 1 = lo). */
  function stretches(lane: Lane, hi: number, lo: number) {
    const cuts = [hi, ...marks.filter((x) => x < hi && x > lo).sort((a, b) => b - a), lo];
    const out: { f0: number; f1: number; s: State }[] = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const s = state(lane, (cuts[i] + cuts[i + 1]) / 2);
      const f0 = (hi - cuts[i]) / (hi - lo);
      const f1 = (hi - cuts[i + 1]) / (hi - lo);
      const last = out[out.length - 1];
      if (last && last.s === s) last.f1 = f1;
      else out.push({ f0, f1, s });
    }
    return out;
  }

  const rows: Row[] = [
    ...(ctx.openToWork ? [{ kind: "next" as const, t: now + 2, year: yearOf(now) }] : []),
    { kind: "head", t: now + 1, year: yearOf(now) },
    { kind: "edu", t: eduE, year: yearOf(eduE - 1) },
    ...ctx.entries.map((e) => ({
      kind: "entry" as const,
      t: mi(e.start),
      year: yearOf(mi(e.start)),
      e,
      fork: mi(e.start) === forkOf(e.track),
    })),
    { kind: "root", t: eduS, year: yearOf(eduS) },
  ];
  rows.sort((a, b) => b.t - a.t);

  /** The `t` of the next real row below `rows[i]` (the "next" row is drawn by hand, so it never counts). */
  const tBelow = (i: number) => rows[i + 1]?.t ?? rows[i].t - 1;

  const years: { year: number; rows: { row: Row; i: number }[] }[] = [];
  for (let y = yearOf(now); y >= yearOf(eduS); y--) {
    years.push({ year: y, rows: rows.map((row, i) => ({ row, i })).filter(({ row }) => row.year === y) });
  }

  return { now, endX, state, stretches, rows, tBelow, years, present: ctx.entries.filter((e) => e.end === "present") };
}
