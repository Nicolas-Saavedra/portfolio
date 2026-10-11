// PROTOTYPE: throwaway. Variant G's automaton: one SVG machine with two layouts, D's hero snake and
// C's docked row. Every state, edge and label is re-drawn from a per-state blend of the two, so the
// machine itself travels into the panel rather than being swapped for a copy.
import { easeCubicInOut } from "d3-ease";
import type { Run } from "../../model";
import { radiusOf } from "./flavor";
import { type Plan, LEAD, MOVE, clamp, cursor, durText, hue, mix, q } from "./clock";

const NS = "http://www.w3.org/2000/svg";
const TAU = Math.PI * 2;

export interface Pt { x: number; y: number }
export interface Layout { pos: Pt[]; r: number[]; /** Row index per state, to tell turns from runs. */ row: number[]; cx: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/**
 * The hero placement: D's large, duration-sized states, but in the docked layout's topology so that
 * docking never makes states cross. Docking into a single row, the hero is a zigzag with x increasing
 * state by state; docking into C's 3-column snake (phones), it is that snake, scaled up.
 */
export function heroLayout(run: Run, R: Rect, toRow: boolean, narrow: boolean, wide: boolean): Layout {
  const n = run.states.length;
  const k = narrow ? 0.9 : wide ? 1.25 : 1.05;
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  const pos: Pt[] = [], row: number[] = [];
  let cap: number;
  if (toRow) {
    const padX = Math.min(90, R.w * 0.12);
    const step = n > 1 ? Math.min(190, (R.w - 2 * padX) / (n - 1)) : 0;
    const amp = n > 2 ? Math.min(95, R.h * 0.2, step * 0.9) : 16;
    for (let i = 0; i < n; i++) {
      pos.push({ x: cx + (i - (n - 1) / 2) * step, y: cy + (i % 2 ? amp : -amp) });
      row.push(0);
    }
    cap = n > 1 ? step * 0.42 : 40;
  } else {
    const cols = Math.min(n, 3), rows = Math.ceil(n / cols);
    const span = cols > 1 ? Math.min(150, (R.w - 88) / (cols - 1)) : 0;
    const rowH = rows > 1 ? Math.min(190, (R.h - 120) / (rows - 1)) : 0;
    for (let i = 0; i < n; i++) {
      const rw = Math.floor(i / cols), c0 = i % cols, col = rw % 2 ? cols - 1 - c0 : c0;
      pos.push({ x: cx + (col - (cols - 1) / 2) * span, y: cy + (rw - (rows - 1) / 2) * rowH + (col % 2 ? 10 : -10) });
      row.push(rw);
    }
    cap = cols > 1 ? span * 0.3 : 32;
  }
  return { pos, row, cx, h: R.h, r: run.states.map((s) => Math.max(16, Math.min(cap, radiusOf(s) * k))) };
}

/** C's docked placement inside the panel slot: one row when there's room, a 3-column snake otherwise. */
export function dockLayout(n: number, slot: Rect): Layout {
  const w = Math.max(280, slot.w - 8);
  const wideRow = w >= 600;
  const cols = wideRow ? n : Math.min(n, 3);
  const rows = Math.ceil(n / cols);
  const r = wideRow ? 22 : 19, R = r + 4, rowH = 108;
  const padL = wideRow ? 44 : 36, padR = wideRow ? 20 : 36;
  const span = cols > 1 ? Math.min(220, (w - padL - padR - 2 * R) / (cols - 1)) : 0;
  const off = (w - padL - padR - 2 * R - span * (cols - 1)) / 2;
  const y0 = R + 14;
  const pos: Pt[] = [], row: number[] = [];
  for (let i = 0; i < n; i++) {
    const rw = Math.floor(i / cols), k = i % cols, col = rw % 2 === 0 ? k : cols - 1 - k;
    pos.push({ x: slot.x + 4 + padL + off + R + col * span, y: slot.y + y0 + rw * rowH });
    row.push(rw);
  }
  return { pos, row, cx: slot.x + slot.w / 2, h: y0 + (rows - 1) * rowH + r + 44, r: Array(n).fill(r) };
}

interface Quad { s: Pt; c: Pt; e: Pt }
const bez = (k: Quad, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * k.s.x + 2 * u * t * k.c.x + t * t * k.e.x, y: u * u * k.s.y + 2 * u * t * k.c.y + t * t * k.e.y };
};
const f = (v: number) => v.toFixed(1);
const quadD = (k: Quad) => `M${f(k.s.x)},${f(k.s.y)}Q${f(k.c.x)},${f(k.c.y)} ${f(k.e.x)},${f(k.e.y)}`;
/** The part of a quadratic from 0 to t (de Casteljau). */
const quadTo = (k: Quad, t: number): Quad => ({ s: k.s, c: { x: lerp(k.s.x, k.c.x, t), y: lerp(k.s.y, k.c.y, t) }, e: bez(k, t) });
function head(tip: Pt, from: Pt): string {
  const dx = tip.x - from.x, dy = tip.y - from.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const bx = tip.x - ux * 8, by = tip.y - uy * 8;
  return `M${f(tip.x)},${f(tip.y)}L${f(bx - uy * 3.8)},${f(by + ux * 3.8)}L${f(bx + uy * 3.8)},${f(by - ux * 3.8)}Z`;
}
/** Signed sweep from angle a to b, the short way round; a near-half turn goes over the top. */
function sweep(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d <= -Math.PI) d += TAU;
  if (Math.abs(Math.abs(d) - Math.PI) < 0.05) d = Math.sin(a + Math.PI / 2) < 0 ? Math.abs(d) : -Math.abs(d);
  return d;
}

export interface Machine {
  svg: SVGSVGElement;
  nodes: SVGGElement[];
  /** `slideFrom`: the progress at which states start moving sideways (0 unless the copy sits beside the hero). */
  setLayouts(hero: Layout, dock: Layout, size: { w: number; h: number }, slideFrom: number): void;
  render(p: number, t: number, act: number | null): void;
  /** Section-space centre and radius of state i, and the token position, from the last render. */
  node(i: number): { x: number; y: number; r: number };
  token(): Pt | null;
  /** Section-space top of the states (at their focused size) and the start arrow, from the last render. */
  top(): number;
}

export function createMachine(run: Run, P: Plan, summary: string): Machine {
  const states = run.states;
  const n = states.length;
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    parent?.append(e);
    return e;
  };

  const svg = el("svg", { class: "g-machine pointer-events-none absolute left-0 top-0 overflow-visible", role: "group", "aria-label": summary });
  // Landing marks: where each state will dock, so the panel's empty slot reads as a berth mid-dock.
  const marks = states.map(() => el("circle", { fill: "none", stroke: "var(--border)", "stroke-width": 1.25, "stroke-dasharray": "3 4", opacity: 0 }, svg));
  const gEdges = el("g", {}, svg);
  const startPath = el("path", { fill: "none", "stroke-width": 1.3 }, gEdges);
  const startHead = el("path", {}, gEdges);
  const edges = states.slice(1).map((s) => ({
    base: el("path", { fill: "none", "stroke-width": 1.3, "stroke-dasharray": s.skipped ? "4 5" : "" }, gEdges),
    trail: el("path", { fill: "none", "stroke-width": 1.5, "stroke-linecap": "round" }, gEdges),
    head: el("path", {}, gEdges),
  }));

  const nodes: SVGGElement[] = [];
  const parts = states.map((s, i) => {
    const g = el("g", {
      class: "g-node", tabindex: 0, role: "img", "data-g-i": i,
      "aria-label": `${s.label}, ${durText(s, run)}. ${s.log}`,
    }, svg);
    nodes.push(g);
    const glow = el("circle", { fill: hue(s), opacity: 0 }, g);
    const focus = el("circle", { class: "g-focus", fill: "none", stroke: "var(--lavender)", "stroke-width": 1.5, "stroke-dasharray": "2 3" }, g);
    const hit = el("circle", { fill: "transparent" }, g);
    const body = el("circle", { "stroke-width": 1.5, "stroke-dasharray": s.skipped ? "3 3" : "" }, g);
    const ring = i === n - 1 ? el("circle", { fill: "none", "stroke-width": 1.25, "stroke-dasharray": s.skipped ? "3 3" : "" }, g) : null;
    const arc = el("path", { fill: "none", "stroke-width": 2, "stroke-linecap": "round", stroke: s.skipped ? "var(--faint)" : hue(s) }, g);
    const qid = el("text", { "text-anchor": "middle", dy: "0.35em", class: "font-mono", fill: "var(--muted)" }, g);
    qid.textContent = q(i);
    const label = el("text", { "text-anchor": "middle", class: "g-halo font-sans" }, g);
    label.textContent = s.label;
    const detail = el("text", { "text-anchor": "middle", class: "g-halo font-mono", fill: s.skipped ? "var(--faint)" : "var(--muted)" }, g);
    detail.textContent = durText(s, run);
    return { glow, focus, hit, body, ring, arc, qid, label, detail };
  });
  const tokenGlow = el("circle", { r: 10, opacity: 0.22 }, svg);
  const tokenDot = el("circle", { r: 4.5 }, svg);

  let H: Layout | null = null, Dk: Layout | null = null, slide0 = 0;
  const cur: { x: number; y: number; r: number }[] = states.map(() => ({ x: 0, y: 0, r: 0 }));
  let tok: Pt | null = null, topY = 0;

  function setLayouts(hero: Layout, dock: Layout, size: { w: number; h: number }, slideFrom: number) {
    H = hero; Dk = dock; slide0 = slideFrom;
    svg.setAttribute("width", f(size.w));
    svg.setAttribute("height", f(size.h));
    svg.setAttribute("viewBox", `0 0 ${f(size.w)} ${f(size.h)}`);
  }

  /** Edge into state j (j ≥ 1) as a quadratic, bending like D in the hero and running straight like C once docked. */
  function edgeQuad(j: number, s: number): Quad {
    const a = cur[j - 1], b = cur[j];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    // By role, not identity: with reduced motion the hero and dock are the same layout object.
    const bendFor = (L: Layout, hero: boolean) => {
      if (L.row[j - 1] === L.row[j]) return hero ? -Math.min(34, len * 0.14) : 0;
      const mx = (a.x + b.x) / 2;
      return Math.sign(px * (mx - L.cx) || 1) * 34; // turns between rows bulge outwards
    };
    const bend = lerp(bendFor(H!, true), bendFor(Dk!, false), s);
    const c = { x: (a.x + b.x) / 2 + px * bend, y: (a.y + b.y) / 2 + py * bend };
    const ua = Math.hypot(c.x - a.x, c.y - a.y) || 1, ub = Math.hypot(c.x - b.x, c.y - b.y) || 1;
    return {
      s: { x: a.x + ((c.x - a.x) / ua) * a.r, y: a.y + ((c.y - a.y) / ua) * a.r },
      c,
      e: { x: b.x + ((c.x - b.x) / ub) * (b.r + 2), y: b.y + ((c.y - b.y) / ub) * (b.r + 2) },
    };
  }

  function render(p: number, t: number, act: number | null) {
    if (!H || !Dk || !n) return;
    const s = smooth(0, 1, p);
    const sx = smooth(slide0, 1, p); // one factor for every x, so states keep their order and never cross
    const base = `color-mix(in srgb, var(--surface) ${Math.round(s * 100)}%, var(--bg))`;
    svg.style.setProperty("--g-halo", base);
    for (let i = 0; i < n; i++) {
      cur[i].x = lerp(H.pos[i].x, Dk.pos[i].x, sx);
      cur[i].y = lerp(H.pos[i].y, Dk.pos[i].y, p); // linear in scroll: the machine holds still on screen while it docks
      cur[i].r = lerp(H.r[i], Dk.r[i], s);
    }
    const quads = states.slice(1).map((_, k) => edgeQuad(k + 1, s));
    const u0 = n > 1 ? { x: cur[1].x - cur[0].x, y: cur[1].y - cur[0].y } : { x: 1, y: 0 };
    const ul = Math.hypot(u0.x, u0.y) || 1;
    // Docked, C's arrow comes in from the left; in the hero, D's points along the first transition.
    const dir = { x: lerp(u0.x / ul, 1, sx), y: lerp(u0.y / ul, 0, sx) };
    const dl = Math.hypot(dir.x, dir.y) || 1;
    // Long enough to read as an arrow, short enough to stay on screen at 360px.
    const room = dir.x / dl > 0.5 ? (cur[0].x - cur[0].r - 6) / (dir.x / dl) : Infinity;
    const sL = Math.max(18, Math.min(lerp(64, 34, s), room));
    const sq: Quad = {
      s: { x: cur[0].x - (dir.x / dl) * (cur[0].r + sL), y: cur[0].y - (dir.y / dl) * (cur[0].r + sL) },
      c: { x: 0, y: 0 },
      e: { x: cur[0].x - (dir.x / dl) * (cur[0].r + 1), y: cur[0].y - (dir.y / dl) * (cur[0].r + 1) },
    };
    sq.c = { x: (sq.s.x + sq.e.x) / 2, y: (sq.s.y + sq.e.y) / 2 };
    topY = Math.min(sq.s.y, ...cur.map((c) => c.y - c.r * 1.06));

    // Each mark shows once the panel frame is up and fades out before any state (or its labels) reaches it.
    const markIn = smooth(0.2, 0.5, p);
    marks.forEach((m, i) => {
      const d = Dk!.pos[i];
      const room = Math.min(...cur.map((c) => Math.hypot(c.x - d.x, Math.max(0, d.y - c.y - 42, c.y - d.y)) - c.r * 1.06 - Dk!.r[i]));
      const v = markIn * clamp(room / 28);
      m.setAttribute("cx", f(d.x)); m.setAttribute("cy", f(d.y)); m.setAttribute("r", f(Dk!.r[i]));
      m.setAttribute("opacity", v.toFixed(2));
    });

    const ci = cursor(P, t);
    const pending = `color-mix(in srgb, var(--border) ${Math.round(s * 100)}%, var(--faint))`;
    const dimOthers = act !== null;

    startPath.setAttribute("d", quadD(sq));
    startPath.setAttribute("stroke", "var(--muted)");
    startHead.setAttribute("d", head(sq.e, sq.s));
    startHead.setAttribute("fill", "var(--muted)");
    gEdges.style.opacity = dimOthers ? "0.5" : "1";

    quads.forEach((k, j) => {
      const e = edges[j];
      const ep = clamp((t - P.leave[j]) / MOVE);
      e.base.setAttribute("d", quadD(k));
      e.base.setAttribute("stroke", pending);
      e.trail.setAttribute("d", ep > 0 ? quadD(quadTo(k, ep)) : "");
      e.trail.setAttribute("stroke", "var(--muted)");
      e.head.setAttribute("d", head(k.e, k.c));
      e.head.setAttribute("fill", ep >= 1 ? "var(--muted)" : pending);
    });

    // Where the token enters and leaves each state, for the dwell arc over its rim.
    const entryPt = (i: number) => (i === 0 ? sq.e : quads[i - 1].e);
    const exitPt = (i: number) => {
      if (i < n - 1) return quads[i].s;
      const a = entryPt(i), c = cur[i];
      return { x: 2 * c.x - a.x, y: 2 * c.y - a.y };
    };

    states.forEach((state, i) => {
      const pt = parts[i], c = cur[i];
      const entered = t >= P.enter[i];
      const current = i === ci && (t < P.leave[i] || i === n - 1);
      const isAct = act === i;
      const col = hue(state);
      const r = c.r * (isAct ? 1.06 : 1);
      const stroke = !entered ? pending : state.skipped ? "var(--faint)" : current || isAct ? col : mix(col, 65, "var(--border)");
      const fill = !entered || state.skipped ? base : mix(col, current || isAct ? 22 : 10, base);
      pt.body.setAttribute("cx", f(c.x)); pt.body.setAttribute("cy", f(c.y)); pt.body.setAttribute("r", f(r));
      pt.body.setAttribute("stroke", stroke); pt.body.setAttribute("fill", fill);
      if (pt.ring) {
        pt.ring.setAttribute("cx", f(c.x)); pt.ring.setAttribute("cy", f(c.y)); pt.ring.setAttribute("r", f(r - 4));
        pt.ring.setAttribute("stroke", stroke);
      }
      pt.glow.setAttribute("cx", f(c.x)); pt.glow.setAttribute("cy", f(c.y)); pt.glow.setAttribute("r", f(r + 9));
      pt.glow.setAttribute("opacity", isAct ? "0.16" : "0");
      pt.focus.setAttribute("cx", f(c.x)); pt.focus.setAttribute("cy", f(c.y)); pt.focus.setAttribute("r", f(r + 6));
      pt.hit.setAttribute("cx", f(c.x)); pt.hit.setAttribute("cy", f(c.y + 14)); pt.hit.setAttribute("r", f(r + 16));

      // Dwell arc over the rim, filling while the token is in the state.
      const a1 = Math.atan2(entryPt(i).y - c.y, entryPt(i).x - c.x), a2 = Math.atan2(exitPt(i).y - c.y, exitPt(i).x - c.x);
      const sw = sweep(a1, a2), ap = clamp((t - P.enter[i]) / (P.leave[i] - P.enter[i]));
      const R = r + 4, ae = a1 + sw * ap;
      pt.arc.setAttribute("d", ap > 0
        ? `M${f(c.x + R * Math.cos(a1))},${f(c.y + R * Math.sin(a1))}A${f(R)},${f(R)} 0 ${Math.abs(sw * ap) > Math.PI ? 1 : 0} ${sw > 0 ? 1 : 0} ${f(c.x + R * Math.cos(ae))},${f(c.y + R * Math.sin(ae))}`
        : "");
      pt.arc.setAttribute("opacity", current ? "1" : "0.45");

      const qs = lerp(c.r > 26 ? 11.5 : 11, 11, s);
      pt.qid.setAttribute("x", f(c.x)); pt.qid.setAttribute("y", f(c.y)); pt.qid.style.fontSize = `${f(qs)}px`;
      pt.label.setAttribute("x", f(c.x)); pt.label.setAttribute("y", f(c.y + r + lerp(22, 21, s)));
      pt.label.style.fontSize = `${f(lerp(14, 12.5, s))}px`;
      pt.label.style.fontWeight = current || isAct || s < 0.5 ? "600" : "400";
      pt.label.setAttribute("fill", !entered || state.skipped ? "var(--muted)" : "var(--text)");
      pt.detail.setAttribute("x", f(c.x)); pt.detail.setAttribute("y", f(c.y + r + lerp(39, 36, s)));
      pt.detail.style.fontSize = "11px";
      nodes[i].style.opacity = dimOthers && !isAct ? "0.45" : "1";
    });

    // Token: start arrow → rim of each state → edge → … → rests on the accepting state.
    let tp: Pt;
    let tcol = "var(--text)";
    if (ci < 0) tp = bez(sq, easeCubicInOut(clamp(t / LEAD)));
    else if (t < P.leave[ci] || ci === n - 1) {
      const c = cur[ci], R = c.r + 4;
      const a1 = Math.atan2(entryPt(ci).y - c.y, entryPt(ci).x - c.x), a2 = Math.atan2(exitPt(ci).y - c.y, exitPt(ci).x - c.x);
      const a = a1 + sweep(a1, a2) * clamp((t - P.enter[ci]) / (P.leave[ci] - P.enter[ci]));
      tp = { x: c.x + R * Math.cos(a), y: c.y + R * Math.sin(a) };
      tcol = states[ci].skipped ? "var(--faint)" : hue(states[ci]);
    } else tp = bez(quads[ci], easeCubicInOut(clamp((t - P.leave[ci]) / MOVE)));
    tok = tp;
    for (const d of [tokenGlow, tokenDot]) { d.setAttribute("cx", f(tp.x)); d.setAttribute("cy", f(tp.y)); }
    tokenDot.setAttribute("fill", "var(--text)");
    tokenGlow.setAttribute("fill", tcol);
    tokenGlow.setAttribute("opacity", t >= P.endT ? "0" : "0.22");
  }

  return { svg, nodes, setLayouts, render, node: (i) => cur[i], token: () => tok, top: () => topY };
}

