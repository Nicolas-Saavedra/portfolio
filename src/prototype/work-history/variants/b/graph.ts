// PROTOTYPE: throwaway. B's graph model, copied from timeline/variants/d/graph.ts (D's) and changed in two ways:
// - a Case Study span that isn't a role (the mercury-lib thesis) becomes a `span` row: a commit on the Education trunk,
//   no branch of its own, because it happened inside the degree;
// - rows carry the Case Study they open, so the rail can light a story's other rows.
// Pure data, no DOM: on the real site all of this would run at build time.
import type { Span } from "../../content";
import type { VariantContext } from "../../types";

export type Entry = VariantContext["entries"][number];
export type Lane = "engineering" | "teaching" | "education";
/** active: in a role (or studying). idle: the Track exists but sits between roles. none: not yet, or no longer. */
export type State = "active" | "idle" | "none";

/** Where a row's node sits, from the row's top, in px, from 640 px wide: the centre of the row's first line (title), i.e.
 * the label's 10 px top padding plus half its 22 px title line. Thin rows (HEAD, root) centre their 18 px line here with
 * 12 px of padding. The rail reads it as the CSS variable `--ny` (style.ts), which is 2 px less below 640. */
export const NODE_Y = 21;
/** The lane coordinate space; positions are emitted as % of the graph column. */
export const GRAPH_W = 64;

/** "YYYY-MM" to months since year 0. */
export const mi = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + m - 1;
};
export const yearOf = (m: number) => Math.floor(m / 12);

export type Row =
  | { kind: "next"; t: number }
  | { kind: "head"; t: number }
  | { kind: "edu"; t: number }
  | { kind: "entry"; t: number; e: Entry; fork: boolean }
  | { kind: "span"; t: number; s: Span; cs: string }
  | { kind: "root"; t: number };

export function model(ctx: VariantContext) {
  const now = mi(ctx.now);
  const endX = (e: { end: string }) => (e.end === "present" ? now + 1 : mi(e.end) + 1); // exclusive: June covers June
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

  // Story spans that aren't roles: commits on the trunk.
  const loose = ctx.work.flatMap((c) => c.spans.filter((s) => !s.role).map((s) => ({ s, cs: c.slug })));

  const rows: Row[] = [
    ...(ctx.openToWork ? [{ kind: "next" as const, t: now + 2 }] : []),
    { kind: "head", t: now + 1 },
    { kind: "edu", t: eduE },
    ...ctx.entries.map((e) => ({ kind: "entry" as const, t: mi(e.start), e, fork: mi(e.start) === forkOf(e.track) })),
    ...loose.map(({ s, cs }) => ({ kind: "span" as const, t: mi(s.start), s, cs })),
    { kind: "root", t: eduS },
  ];
  rows.sort((a, b) => b.t - a.t);

  /** The `t` of the next real row below `rows[i]` (the "next" row is drawn by hand, so it never counts). */
  const tBelow = (i: number) => rows[i + 1]?.t ?? rows[i].t - 1;

  return { now, endX, state, stretches, rows, tBelow, present: ctx.entries.filter((e) => e.end === "present") };
}
