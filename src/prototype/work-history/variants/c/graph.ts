// PROTOTYPE: throwaway. Variant C's graph model: a copy of D's `timeline/variants/d/graph.ts` (month arithmetic, lane
// states, stretches), extended for the fusion. Pure data, no DOM: on the real site all of this runs at build time.
// Changes from D:
// - A `thesis` row: a Case Study span that is not a role (mercury-lib) becomes a one-line commit on the Education trunk,
//   since it happened inside the degree. It changes no lane's state.
// - Rows are flat (one list), and each row carries the year headers that sit above it (`years`), so the rows tile the
//   list with no gaps: whatever is at the readout's marker line is always some row.
// - Each row says which readout it docks (`dock`): a Case Study's slug, a role readout ("edu", "role:<id>"), or "rest".
import { caseStudyBySlug, caseStudyOf } from "../../content";
import type { CaseStudy, Span } from "../../content";
import type { VariantContext } from "../../types";

export type Entry = VariantContext["entries"][number];
export type Lane = "engineering" | "teaching" | "education";
/** active: in a role (or studying). idle: the Track exists but sits between roles. none: not yet, or no longer. */
export type State = "active" | "idle" | "none";

/** Where a row's node sits, from the row's top, in px. The card's first line is centred on it. */
export const NODE_Y = 20;
/** Width of the graph column's coordinate space. */
export const GRAPH_W = 64;

/** "YYYY-MM" to months since year 0. */
export const mi = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + m - 1;
};
export const yearOf = (m: number) => Math.floor(m / 12);

type Base = { t: number; year: number; dock: string; years: number[] };
export type Row = Base &
  (
    | { kind: "next" }
    | { kind: "head" }
    | { kind: "edu" }
    | { kind: "entry"; e: Entry; fork: boolean; cs?: CaseStudy }
    | { kind: "thesis"; cs: CaseStudy; span: Span }
    | { kind: "root" }
  );

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

  const base = (t: number, dock: string) => ({ t, year: yearOf(t), dock, years: [] as number[] });
  const rows: Row[] = [
    ...(ctx.openToWork ? [{ kind: "next" as const, ...base(now + 2, "rest"), year: yearOf(now) }] : []),
    { kind: "head", ...base(now + 1, "rest"), year: yearOf(now) },
    { kind: "edu", ...base(eduE, "edu"), year: yearOf(eduE - 1) },
    ...ctx.entries.map((e) => {
      const cs = caseStudyOf(e);
      return { kind: "entry" as const, ...base(mi(e.start), cs ? cs.slug : `role:${e.id}`), e, cs, fork: mi(e.start) === forkOf(e.track) };
    }),
    // Story spans that aren't roles (the thesis). They sit on the trunk at their start month.
    ...ctx.work.flatMap((cs) =>
      cs.spans.filter((s) => !s.role).map((span) => ({ kind: "thesis" as const, ...base(mi(span.start), cs.slug), cs: caseStudyBySlug(cs.slug)!, span })),
    ),
    { kind: "root", ...base(eduS, "edu") },
  ];
  rows.sort((a, b) => b.t - a.t);

  // Year headers: each row carries every year from just below the previous row's year down to its own, so empty
  // years (2021) sit on the row below them, and the first row carries the current year.
  let prev = yearOf(now) + 1;
  for (const r of rows) {
    for (let y = prev - 1; y >= r.year; y--) r.years.push(y);
    prev = Math.min(prev, r.year);
  }

  /** The `t` of the next real row below `rows[i]` (the "next" row is drawn by hand, so it never counts). */
  const tBelow = (i: number) => rows[i + 1]?.t ?? rows[i].t - 1;

  return { now, endX, state, stretches, rows, tBelow, present: ctx.entries.filter((e) => e.end === "present") };
}
