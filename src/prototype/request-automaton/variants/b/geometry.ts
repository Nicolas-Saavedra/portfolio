// PROTOTYPE: throwaway. Layout and path geometry for the Textbook DFA variant.
// Two layouts: one row of states, or a boustrophedon ("snake") of three per row for narrow screens.

export const R = 24;
const MARGIN = 84;

export interface Pt { x: number; y: number }

export interface Layout {
  w: number;
  h: number;
  pos: Pt[];
  /** Direction of travel along the row each state sits in: +1 rightwards, -1 leftwards. */
  dirs: number[];
  snake: boolean;
}

export interface EdgeGeom {
  d: string;
  start: Pt;
  end: Pt;
  /** The arrowhead at `end`, as a closed path. */
  head: string;
  label: { x: number; y: number; anchor: "start" | "middle" | "end" };
}

export function layout(n: number, snake: boolean): Layout {
  if (!snake) {
    const S = 104, y = 82;
    const pos = Array.from({ length: n }, (_, i) => ({ x: MARGIN + R + i * S, y }));
    return { w: 2 * MARGIN + 2 * R + Math.max(0, n - 1) * S, h: 138, pos, dirs: pos.map(() => 1), snake };
  }
  const S = 96, per = 3, pitch = 146, rows = Math.ceil(n / per);
  const pos: Pt[] = [], dirs: number[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per), col = i % per, dir = row % 2 ? -1 : 1;
    pos.push({ x: MARGIN + R + (dir === 1 ? col : per - 1 - col) * S, y: 82 + row * pitch });
    dirs.push(dir);
  }
  return { w: 2 * MARGIN + 2 * R + (per - 1) * S, h: 82 + (rows - 1) * pitch + 56, pos, dirs, snake };
}

/** Width the single-row layout would need; used to decide when to fold into the snake. */
export const rowWidth = (n: number) => layout(n, false).w;

const f = (v: number) => v.toFixed(1);
const at = (c: Pt, angle: number, r = R): Pt => ({ x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) });

function arrowhead(tip: Pt, from: Pt): string {
  const dx = tip.x - from.x, dy = tip.y - from.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, L = 8, W = 3.6;
  const bx = tip.x - ux * L, by = tip.y - uy * L;
  return `M${f(tip.x)},${f(tip.y)}L${f(bx - uy * W)},${f(by + ux * W)}L${f(bx + uy * W)},${f(by - ux * W)}Z`;
}

/** The start arrow: a short straight line into q₀ from outside the machine. */
export function startArrow(L: Layout): EdgeGeom {
  const c = L.pos[0], dir = L.dirs[0];
  const start = { x: c.x - dir * (R + 46), y: c.y }, end = { x: c.x - dir * R, y: c.y };
  return {
    d: `M${f(start.x)},${f(start.y)}L${f(end.x)},${f(end.y)}`,
    start, end, head: arrowhead(end, start),
    label: { x: (start.x + end.x) / 2, y: c.y - 9, anchor: "middle" },
  };
}

/** The transition from state i to i+1: an arc over the top within a row, a bulge on the side between rows. */
export function transition(L: Layout, i: number): EdgeGeom {
  const a = L.pos[i], b = L.pos[i + 1];
  if (a.y === b.y) {
    const d = Math.sign(b.x - a.x), tilt = (50 * Math.PI) / 180;
    const start = { x: a.x + d * R * Math.sin(tilt), y: a.y - R * Math.cos(tilt) };
    const end = { x: b.x - d * R * Math.sin(tilt), y: b.y - R * Math.cos(tilt) };
    const ctrl = { x: (a.x + b.x) / 2, y: a.y - R - 30 };
    const apex = (start.y + 2 * ctrl.y + end.y) / 4;
    return {
      d: `M${f(start.x)},${f(start.y)}Q${f(ctrl.x)},${f(ctrl.y)} ${f(end.x)},${f(end.y)}`,
      start, end, head: arrowhead(end, ctrl),
      label: { x: ctrl.x, y: apex - 7, anchor: "middle" },
    };
  }
  const o = L.dirs[i], k = Math.PI / 6;
  const start = { x: a.x + o * R * Math.cos(k), y: a.y + R * Math.sin(k) };
  const end = { x: b.x + o * R * Math.cos(k), y: b.y - R * Math.sin(k) };
  const c1 = { x: a.x + o * (R + 30), y: a.y + 34 }, c2 = { x: b.x + o * (R + 30), y: b.y - 34 };
  return {
    d: `M${f(start.x)},${f(start.y)}C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(end.x)},${f(end.y)}`,
    start, end, head: arrowhead(end, c2),
    label: { x: a.x + o * (R + 30), y: (a.y + b.y) / 2 + 4, anchor: o === 1 ? "start" : "end" },
  };
}

/** A self-loop on the last state, on the side the machine was travelling towards. */
export function selfLoop(L: Layout, i: number): EdgeGeom {
  const c = L.pos[i], o = L.dirs[i], k = (35 * Math.PI) / 180;
  const start = { x: c.x + o * R * Math.cos(k), y: c.y - R * Math.sin(k) };
  const end = { x: c.x + o * R * Math.cos(k), y: c.y + R * Math.sin(k) };
  const c1 = { x: c.x + o * (R + 46), y: c.y - 36 }, c2 = { x: c.x + o * (R + 46), y: c.y + 36 };
  return {
    d: `M${f(start.x)},${f(start.y)}C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(end.x)},${f(end.y)}`,
    start, end, head: arrowhead(end, c2),
    label: { x: c.x + o * (R + 44), y: c.y + 4, anchor: o === 1 ? "start" : "end" },
  };
}

/** Point on the rim of state `c`, moving from `from` to `to` the short way round, at progress p. */
export function rim(c: Pt, from: Pt, to: Pt, p: number): Pt {
  const a1 = Math.atan2(from.y - c.y, from.x - c.x), a2 = Math.atan2(to.y - c.y, to.x - c.x);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return at(c, a1 + d * p);
}
