// PROTOTYPE: throwaway. Variant G's single clock, copied from variant C (which doesn't export it).
// Animation time t (ms) maps to request time, the state the token is in, and per-state dwell windows.
import type { Run, RunState, StateId } from "../../model";

export const LEAD = 500; // token rides the start arrow
export const MOVE = 300; // token rides an edge
const BASE = 380; // minimum dwell in a state
const SPREAD = 2600; // extra dwell, shared by duration
const SETTLE = 400; // counter catches up to totalMs when phases don't cover it
export const CHAR_MS = 12; // log typing speed

export const HUE: Record<StateId, string> = {
  lookup: "sky", connect: "lavender", secure: "mauve", edge: "peach", firstByte: "peach", delivered: "green", cached: "green",
};

export const hue = (s: RunState) => `var(--${HUE[s.id] ?? "lavender"})`;
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (c: string, pct: number, base = "var(--surface)") => `color-mix(in srgb, ${c} ${pct}%, ${base})`;
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const SUB = "₀₁₂₃₄₅₆₇₈₉";
export const q = (i: number) => "q" + [...String(i)].map((d) => SUB[+d]).join("");

export interface Plan {
  start: number[]; end: number[]; // request-ms offsets per state
  enter: number[]; leave: number[]; // animation-ms per state
  sum: number; domain: number; total?: number; endT: number;
}

export function plan(run: Run): Plan {
  const n = run.states.length;
  const start: number[] = [], end: number[] = [], enter: number[] = [], leave: number[] = [];
  let r = 0;
  for (const s of run.states) { start.push(r); r += s.durationMs ?? 0; end.push(r); }
  const sum = r;
  const domain = Math.max(sum, run.totalMs ?? 0);
  let a = LEAD;
  run.states.forEach((s, i) => {
    enter.push(a);
    a += BASE + (sum > 0 ? (SPREAD * (s.durationMs ?? 0)) / sum : 0);
    leave.push(a);
    if (i < n - 1) a += MOVE;
  });
  const typed = Math.max(0, ...run.states.map((s, i) => enter[i] + s.log.length * CHAR_MS));
  const endT = Math.max(a + (domain > sum ? SETTLE : 0), typed);
  return { start, end, enter, leave, sum, domain, total: run.totalMs ?? (sum || undefined), endT };
}

/** Request time (ms) the playhead has reached at animation time t. */
export function reqAt(p: Plan, t: number): number {
  const n = p.enter.length;
  for (let i = n - 1; i >= 0; i--) {
    if (t < p.enter[i]) continue;
    if (t < p.leave[i]) return p.start[i] + ((p.end[i] - p.start[i]) * (t - p.enter[i])) / (p.leave[i] - p.enter[i]);
    if (i === n - 1) return p.sum + (p.domain - p.sum) * clamp((t - p.leave[i]) / SETTLE);
    return p.end[i];
  }
  return 0;
}

/** Inverse of reqAt, for scrubbing: the earliest animation time whose request time reaches r.
 *  States that took no time take no request time, so scrubbing passes straight through them. */
export function tAtReq(p: Plan, r: number): number {
  const n = p.enter.length;
  if (r >= p.domain) return p.endT;
  if (r >= p.sum) return p.leave[n - 1] + (SETTLE * (r - p.sum)) / (p.domain - p.sum);
  for (let i = 0; i < n; i++) {
    if (p.end[i] > r) return p.enter[i] + ((r - p.start[i]) / (p.end[i] - p.start[i])) * (p.leave[i] - p.enter[i]);
  }
  return p.endT;
}

/** Index of the state the token is in (or just left), -1 before the run starts. */
export function cursor(p: Plan, t: number): number {
  for (let i = p.enter.length - 1; i >= 0; i--) if (t >= p.enter[i]) return i;
  return -1;
}

/** Honest detail for a state: its duration, the colo for the untimed edge, "skipped", never a fake 0 ms. */
export function durText(s: RunState, run: Run): string {
  if (s.skipped) return "skipped";
  if (s.durationMs !== undefined) return `${s.durationMs} ms`;
  if (s.id === "edge" && run.meta.colo) return run.meta.colo;
  return "no data";
}
