// PROTOTYPE: throwaway. Variant F's scene: D's full-bleed glyph field and d3-force automaton, tamed.
// The run is played by the shared clock (see ./plan.ts); afterwards particles stream along the
// transitions at speeds derived from the timings. Selecting a state only glows it and warms nearby glyphs.
import { forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import type { Run, RunState } from "../../model";
import { GlyphField, HOT, MONO } from "../d/glyphs";
import { TONES, type Tone, arrivalSymbol, toneOf, travelSeconds } from "../d/flavor";
import { LEAD, MOVE, type Plan, clamp01, cursorAt, durText, easeInOut, q } from "./plan";

const SANS = '"Inter Variable", ui-sans-serif, system-ui, sans-serif';
const TAU = Math.PI * 2;

type Palette = Record<"bg" | "border" | "text" | "muted" | Tone, string> & { dark: boolean };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (k: string, fb: string) => cs.getPropertyValue(`--${k}`).trim() || fb;
  return {
    bg: v("bg", "#1e1e2e"), border: v("border", "#313244"), text: v("text", "#cdd6f4"), muted: v("muted", "#a6adc8"),
    faint: v("faint", "#6c7086"), sky: v("sky", "#89dceb"), lavender: v("lavender", "#b4befe"), mauve: v("mauve", "#cba6f7"),
    peach: v("peach", "#fab387"), green: v("green", "#a6e3a1"),
    dark: matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

function rgba(hex: string, a: number) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

interface Rect { x: number; y: number; w: number; h: number }
const NO_RECT: Rect = { x: 0, y: 0, w: 0, h: 0 };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface SNode extends SimulationNodeDatum {
  x: number; y: number; vx: number; vy: number;
  i: number; state: RunState; tone: number; r: number; ax: number; ay: number; glow: number;
}
interface SLink extends SimulationLinkDatum<SNode> { source: SNode; target: SNode; d: number }
interface Edge {
  to: SNode; from: SNode | null; T: number; tone: number; dashed: boolean; symbol: string;
  sx: number; sy: number; cx: number; cy: number; tx: number; ty: number; px: number; py: number; len: number; bend: number;
}
interface Particle { e: number; t: number; j: number; tracer: boolean; cell: number; x: number; y: number; tx: number; ty: number }
interface Ripple { x: number; y: number; t0: number; tone: number }

export interface SceneParts { stage: HTMLElement; canvas: HTMLCanvasElement; layer: HTMLElement; copy: HTMLElement; orbit: HTMLElement }

export interface SceneEvents {
  enter(i: number): void; leave(i: number): void; focus(i: number): void; blur(i: number): void; tap(i: number): void;
}

export interface Scene {
  /** Advance one animation frame: `dt` in seconds, `t` the shared clock in animation ms. */
  frame(dt: number, t: number, active: number | null): void;
  /** Draw one settled frame without animating (reduced motion). */
  still(t: number, active: number | null): void;
  /** Forget the stream so a replay starts clean. */
  reset(): void;
  destroy(): void;
}

export function mountScene(p: SceneParts, run: Run, P: Plan, reducedMotion: boolean, ev: SceneEvents): Scene {
  const states = run.states;
  const n = states.length;
  const g = p.canvas.getContext("2d")!;
  const ac = new AbortController();
  const on = { signal: ac.signal };
  const field = new GlyphField();
  let pal = readPalette();
  let toneColor = TONES.map((t) => pal[t]);
  let clearGrad: CanvasGradient | null = null;

  let W = 0, H = 0, dpr = 1, phone = false, placed = false;
  let copyR = NO_RECT, orbitR = NO_RECT;
  let time = 0; // seconds of wall time, for breathing and ripples only
  let lastT = 0, lastAct: number | null = null, entered = 0;

  const main: SNode[] = states.map((s, i) => ({
    i, state: s, tone: TONES.indexOf(toneOf(s)), r: 20, ax: 0, ay: 0, x: 0, y: 0, vx: 0, vy: 0, glow: 0,
  }));
  const edges: Edge[] = states.map((s, j) => ({
    to: main[j], from: j ? main[j - 1] : null, T: travelSeconds(s), tone: TONES.indexOf(toneOf(s)), dashed: !!s.skipped,
    symbol: arrivalSymbol(s, states[j - 1], run),
    sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, px: 0, py: 0, len: 1, bend: 0,
  }));
  const parts: Particle[] = [];
  const ripples: Ripple[] = [];
  let spawnAcc = 0, streamT = 0;

  // ---------------------------------------------------------------- simulation (calm: anchors, spacing, breathing)

  const link = forceLink<SNode, SLink>([]).distance((l) => l.d).strength(0.5);
  const sim = forceSimulation<SNode>(main)
    .alpha(0.5).alphaDecay(0).alphaMin(0).velocityDecay(0.45)
    .force("link", link)
    .force("charge", forceManyBody<SNode>().strength(-260).distanceMax(200))
    .force("collide", forceCollide<SNode>((d) => d.r + (phone ? 14 : 24)).strength(0.6))
    .force("anchor", () => {
      for (const d of main) {
        const tx = d.ax + (reducedMotion ? 0 : Math.sin(time * 0.5 + d.i * 1.9) * 4);
        const ty = d.ay + (reducedMotion ? 0 : Math.cos(time * 0.4 + d.i * 1.3) * 4);
        d.vx += (tx - d.x) * 0.07;
        d.vy += (ty - d.y) * 0.07;
      }
    })
    .stop();

  function rebuild() {
    sim.nodes(main); // re-initializes every force, so radii follow the layout
    link.links(main.slice(1).map((b, j) => ({ source: main[j], target: b, d: Math.hypot(b.ax - main[j].ax, b.ay - main[j].ay) })));
  }

  // ---------------------------------------------------------------- layout

  function anchors() {
    const R = orbitR;
    if (!n || !R.w) return;
    if (phone) {
      // Vertical stream: states down the left third, labels hang to their right.
      const padY = 64, gap = n > 1 ? Math.min(96, (R.h - padY - 40) / (n - 1)) : 0;
      const x0 = R.x + Math.min(76, R.w * 0.22);
      main.forEach((d, i) => {
        d.ax = x0 + (i % 2 ? 12 : -4);
        d.ay = R.y + (n > 1 ? padY : R.h / 2) + i * gap;
      });
      return;
    }
    // Snake (boustrophedon) rows, as in variant D.
    const padX = Math.min(90, R.w * 0.14), padY = Math.min(70, R.h * 0.18);
    let per = Math.max(1, Math.min(n, Math.floor((R.w - 2 * padX) / 170) + 1));
    const rows = Math.ceil(n / per);
    per = Math.ceil(n / rows);
    const gapX = per > 1 ? Math.min(260, (R.w - 2 * padX) / (per - 1)) : 0;
    const gapY = rows > 1 ? Math.min(240, (R.h - 2 * padY) / (rows - 1)) : 0;
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    main.forEach((d, i) => {
      const row = Math.floor(i / per), c0 = i % per, col = row % 2 ? per - 1 - c0 : c0;
      d.ax = cx + (col - (per - 1) / 2) * gapX;
      d.ay = cy + (row - (rows - 1) / 2) * gapY + (col % 2 ? 1 : -1) * (gapY ? Math.min(16, gapY * 0.07) : 12);
    });
  }

  function layout() {
    const sr = p.stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    const rel = (el: HTMLElement): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    };
    const resized = sr.width !== W || sr.height !== H;
    W = sr.width; H = sr.height;
    copyR = rel(p.copy); orbitR = rel(p.orbit);
    phone = W < 640;
    if (resized) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (W * H * dpr * dpr > 5.2e6) dpr = Math.max(1, Math.sqrt(5.2e6 / (W * H)));
      p.canvas.width = Math.round(W * dpr);
      p.canvas.height = Math.round(H * dpr);
      field.resize(W, H, dpr);
    }
    const r = phone ? 17 : W >= 1200 ? 23 : 20;
    for (const d of main) {
      d.r = r;
      btns[d.i].style.width = btns[d.i].style.height = `${Math.round(r * 2 + 16)}px`;
    }
    anchors();
    for (const d of main) if (!placed || resized) { d.x = d.ax; d.y = d.ay; d.vx = d.vy = 0; }
    placed = true;
    rebuild();
    if (reducedMotion) {
      for (let k = 0; k < 200; k++) sim.tick();
      freezeStream();
    }
  }

  function paintInk() {
    field.setInk(pal.faint, pal.dark ? 0.55 : 0.7);
    clearGrad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    clearGrad.addColorStop(0, rgba(pal.bg, 0.92));
    clearGrad.addColorStop(0.7, rgba(pal.bg, 0.84));
    clearGrad.addColorStop(1, rgba(pal.bg, 0));
  }

  // ---------------------------------------------------------------- geometry

  let bx = 0, by = 0;
  function bez(e: Edge, t: number) {
    const u = 1 - t;
    bx = u * u * e.sx + 2 * u * t * e.cx + t * t * e.tx;
    by = u * u * e.sy + 2 * u * t * e.cy + t * t * e.ty;
  }

  function geometry() {
    if (!n) return;
    const a = main[0];
    let dx = phone ? 0 : 1, dy = phone ? 1 : 0;
    if (n > 1) {
      const b = main[1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      dx = (b.x - a.x) / l; dy = (b.y - a.y) / l;
    }
    const L = phone ? 50 : 70, s0x = a.x - dx * L, s0y = a.y - dy * L;
    for (const e of edges) {
      const sx = e.from ? e.from.x : s0x, sy = e.from ? e.from.y : s0y;
      const ex = e.to.x - sx, ey = e.to.y - sy, len = Math.hypot(ex, ey) || 1;
      e.sx = sx; e.sy = sy; e.tx = e.to.x; e.ty = e.to.y; e.len = len;
      e.px = -ey / len; e.py = ex / len;
      e.bend = e.from ? -Math.min(phone ? 16 : 30, len * 0.13) : 0;
      e.cx = (sx + e.to.x) / 2 + e.px * e.bend;
      e.cy = (sy + e.to.y) / 2 + e.py * e.bend;
    }
  }

  /** Parameter range of an edge outside both node bodies, so trails and the token start at the rims. */
  const rimT = (e: Edge) => [e.from ? clamp01((e.from.r + 2) / e.len) : 0, clamp01(1 - (e.to.r + 3) / e.len)] as const;

  // ---------------------------------------------------------------- stream

  function stepStream(dt: number, t: number) {
    if (t >= P.endT && n) {
      streamT += dt;
      const interval = 0.05 + 0.12 * Math.max(0, 1 - streamT / 2);
      spawnAcc += dt;
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        if (parts.length < 260) parts.push({ e: 0, t: Math.random() * 0.04, j: (Math.random() * 2 - 1) * (phone ? 6 : 10), tracer: Math.random() < 0.3, cell: -1, x: 0, y: 0, tx: 0, ty: 0 });
      }
    }
    for (let k = parts.length - 1; k >= 0; k--) {
      const pt = parts[k];
      let e = edges[pt.e];
      pt.t += dt / e.T;
      if (pt.t >= 1) {
        if (pt.e + 1 >= n) { parts[k] = parts[parts.length - 1]; parts.pop(); continue; }
        const over = (pt.t - 1) * e.T;
        e = edges[++pt.e];
        pt.t = Math.min(0.99, over / e.T);
      }
      place(pt, e);
      if (pt.tracer) {
        const c = field.at(pt.x, pt.y);
        if (c !== pt.cell) { pt.cell = c; field.warm(c, 0.75, e.tone); }
      }
    }
  }

  function place(pt: Particle, e: Edge) {
    bez(e, pt.t);
    let s = Math.sin(Math.PI * pt.t) * pt.j;
    pt.x = bx + e.px * s; pt.y = by + e.py * s;
    const tt = Math.max(0, pt.t - 0.07);
    bez(e, tt);
    s = Math.sin(Math.PI * tt) * pt.j;
    pt.tx = bx + e.px * s; pt.ty = by + e.py * s;
  }

  /** Reduced motion: the stream as a frozen, evenly spaced trace with its glyph trail. */
  function freezeStream() {
    geometry();
    parts.length = 0;
    edges.forEach((e, j) => {
      const count = Math.max(2, Math.round(e.T * 8));
      for (let k = 0; k < count; k++) {
        const pt: Particle = { e: j, t: (k + 0.5) / count, j: (((k * 7 + j * 3) % 5) / 2 - 1) * 7, tracer: false, cell: -1, x: 0, y: 0, tx: 0, ty: 0 };
        place(pt, e);
        pt.tx = pt.x; pt.ty = pt.y;
        parts.push(pt);
      }
    });
  }

  function warmStill(active: number | null) {
    field.cool(1e3);
    for (const pt of parts) field.warm(field.at(pt.x, pt.y), 0.5, edges[pt.e].tone);
    if (active !== null) warmAround(main[active], 1);
  }

  /** The focus emphasis: glyphs near the selected state take its colour. */
  function warmAround(d: SNode, share: number) {
    const R = d.r + 64;
    field.near(d.x, d.y, R, (i, _x, _y, dist) => {
      if (share < 1 && Math.random() > share) return;
      field.warm(i, 0.6 * (1 - dist / R), d.tone);
    });
  }

  // ---------------------------------------------------------------- drawing

  function halo(text: string, x: number, y: number, fill: string) {
    g.strokeText(text, x, y);
    g.fillStyle = fill;
    g.fillText(text, x, y);
  }

  function drawGlyphs() {
    field.draw(g);
    g.font = `12px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const maxA = pal.dark ? 0.8 : 0.9;
    for (let t = 0; t < TONES.length; t++) {
      g.fillStyle = toneColor[t];
      for (const i of field.hot) {
        if (field.tint[i] !== t) continue;
        const r = (i / field.cols) | 0, y = field.y(r);
        if (y > H + 10) continue;
        g.globalAlpha = Math.min(1, field.heat[i]) * maxA;
        g.fillText(HOT[field.hotChar[i]], field.x(i - r * field.cols), y);
      }
    }
    g.globalAlpha = 1;
    // Clear the texture behind the copy so it reads at full contrast.
    if (copyR.w && clearGrad) {
      g.save();
      g.translate(copyR.x + copyR.w / 2, copyR.y + copyR.h / 2);
      g.scale(copyR.w * 0.78, copyR.h * 0.78);
      g.fillStyle = clearGrad;
      g.fillRect(-1, -1, 2, 2);
      g.restore();
    }
  }

  function strokeEdge(e: Edge, a: number, b: number) {
    g.beginPath();
    for (let k = 0; k <= 20; k++) {
      bez(e, a + ((b - a) * k) / 20);
      if (k) g.lineTo(bx, by); else g.moveTo(bx, by);
    }
    g.stroke();
  }

  function arrowHead(e: Edge, t: number) {
    bez(e, t);
    const u = 1 - t;
    let dx = 2 * u * (e.cx - e.sx) + 2 * t * (e.tx - e.cx), dy = 2 * u * (e.cy - e.sy) + 2 * t * (e.ty - e.cy);
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx - dx * 7 - dy * 3.5, by - dy * 7 + dx * 3.5);
    g.lineTo(bx - dx * 7 + dy * 3.5, by - dy * 7 - dx * 3.5);
    g.closePath();
    g.fill();
  }

  /** Progress of the trail along edge j: the start arrow during the lead-in, then each MOVE. */
  const edgeProgress = (j: number, t: number) => (j === 0 ? clamp01(t / LEAD) : clamp01((t - P.leave[j - 1]) / MOVE));

  function drawEdges(t: number, act: number | null) {
    g.lineWidth = 1.25;
    for (let j = 0; j < n; j++) {
      const e = edges[j], [a, b] = rimT(e), ep = edgeProgress(j, t);
      g.globalAlpha = act !== null && act !== j && act !== j - 1 ? 0.45 : 1;
      g.setLineDash(e.dashed ? [4, 5] : []);
      g.strokeStyle = pal.border;
      strokeEdge(e, a, b);
      if (ep > 0) {
        g.strokeStyle = pal.muted;
        strokeEdge(e, a, a + (b - a) * easeInOut(ep));
      }
      g.setLineDash([]);
      g.fillStyle = ep >= 1 ? pal.muted : pal.border;
      arrowHead(e, b);
    }
    // Transition symbols.
    g.font = `10.5px ${MONO}`;
    g.lineWidth = 4;
    g.lineJoin = "round";
    g.strokeStyle = pal.bg;
    g.globalAlpha = 1;
    for (let j = 0; j < n; j++) {
      const e = edges[j];
      if (!e.from) {
        g.textBaseline = phone ? "middle" : "bottom";
        g.textAlign = phone ? "left" : "center";
        halo(e.symbol, phone ? e.sx + 12 : clamp(e.sx, 70, W - 70), phone ? e.sy : e.sy - 10, pal.faint);
        continue;
      }
      bez(e, 0.5);
      g.textBaseline = "middle";
      if (phone) {
        g.textAlign = "left";
        halo(e.symbol, Math.max(e.from.x, e.to.x) + e.to.r + 16, by, pal.faint);
      } else {
        g.textAlign = "center";
        const side = e.bend < 0 ? -1 : 1, half = g.measureText(e.symbol).width / 2 + 6;
        halo(e.symbol, clamp(bx + e.px * side * 13, half, W - half), by + e.py * side * 13, pal.faint);
      }
    }
  }

  function drawStream(act: number | null) {
    if (!parts.length) return;
    g.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    g.lineCap = "round";
    for (let t = 0; t < TONES.length; t++) {
      g.strokeStyle = g.fillStyle = toneColor[t];
      let any = false;
      g.beginPath();
      for (const pt of parts) {
        if (edges[pt.e].tone !== t) continue;
        any = true;
        g.moveTo(pt.tx, pt.ty); g.lineTo(pt.x, pt.y);
      }
      if (!any) continue;
      const dim = act !== null ? 0.55 : 1;
      if (!reducedMotion) { g.globalAlpha = 0.35 * dim; g.lineWidth = 1.4; g.stroke(); }
      g.globalAlpha = 0.85 * dim;
      g.beginPath();
      for (const pt of parts) {
        if (edges[pt.e].tone !== t) continue;
        g.moveTo(pt.x + 1.6, pt.y); g.arc(pt.x, pt.y, 1.6, 0, TAU);
      }
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  }

  function drawNodes(t: number, act: number | null) {
    const cur = cursorAt(P, t);
    for (const d of main) {
      const s = d.state, col = toneColor[d.tone];
      const inState = t >= P.enter[d.i];
      const current = d.i === cur && (t < P.leave[d.i] || d.i === n - 1) && t < P.endT;
      const r = d.r * (1 + 0.06 * d.glow);
      g.globalAlpha = act !== null && act !== d.i ? 0.45 : 1;
      const base = g.globalAlpha;
      if (d.glow > 0.01) {
        g.fillStyle = col;
        g.globalAlpha = base * 0.1 * d.glow;
        g.beginPath(); g.arc(d.x, d.y, r + 18 * d.glow, 0, TAU); g.fill();
        g.globalAlpha = base * 0.14 * d.glow;
        g.beginPath(); g.arc(d.x, d.y, r + 8 * d.glow, 0, TAU); g.fill();
        g.globalAlpha = base;
      }
      g.fillStyle = pal.bg;
      g.beginPath(); g.arc(d.x, d.y, r, 0, TAU); g.fill();
      if (inState && !s.skipped) {
        g.fillStyle = col;
        g.globalAlpha = base * (current || d.glow > 0.5 ? 0.22 : 0.1);
        g.fill();
        g.globalAlpha = base;
      }
      g.strokeStyle = !inState ? pal.border : col;
      g.globalAlpha = base * (!inState || current || s.skipped ? 1 : 0.7);
      g.lineWidth = 1.5 + d.glow * 0.6;
      g.setLineDash(s.skipped ? [3, 3] : []);
      g.stroke();
      if (d.i === n - 1) { g.beginPath(); g.arc(d.x, d.y, r - 4, 0, TAU); g.stroke(); }
      g.setLineDash([]);
      // Dwell progress: the ring sweeps while the clock is in this state.
      const ap = clamp01((t - P.enter[d.i]) / (P.leave[d.i] - P.enter[d.i]));
      if (ap > 0 && !s.skipped) {
        g.globalAlpha = base * (current ? 1 : 0.45);
        g.lineWidth = 2;
        g.lineCap = "round";
        g.beginPath(); g.arc(d.x, d.y, r + 4, -Math.PI / 2, -Math.PI / 2 + ap * TAU); g.stroke();
      }
      g.globalAlpha = base;
      g.font = `10.5px ${MONO}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = pal.muted;
      g.fillText(q(d.i), d.x, d.y + 0.5);

      g.lineWidth = 4;
      g.lineJoin = "round";
      g.strokeStyle = pal.bg;
      const strong = inState && !s.skipped;
      g.font = `${current || d.glow > 0.5 ? 600 : 500} ${phone ? 12.5 : 13}px ${SANS}`;
      if (phone) {
        g.textAlign = "left";
        g.textBaseline = "alphabetic";
        const lx = d.x + r + 14;
        halo(s.label, lx, d.y - 1, strong ? pal.text : pal.muted);
        g.font = `11px ${MONO}`;
        halo(durText(s, run), lx, d.y + 14, pal.faint);
      } else {
        g.textBaseline = "top";
        const ly = d.y + r + (d.i === n - 1 ? 8 : 7);
        halo(s.label, d.x, ly, strong ? pal.text : pal.muted);
        g.font = `11px ${MONO}`;
        halo(durText(s, run), d.x, ly + 17, pal.faint);
      }
    }
    g.globalAlpha = 1;
  }

  function drawToken(t: number) {
    if (t >= P.endT || !n) return;
    const cur = cursorAt(P, t);
    let j = -1, f = 0;
    if (cur < 0) { j = 0; f = easeInOut(clamp01(t / LEAD)); }
    else if (cur < n - 1 && t >= P.leave[cur]) { j = cur + 1; f = easeInOut(clamp01((t - P.leave[cur]) / MOVE)); }
    if (j < 0) return;
    const e = edges[j], [a, b] = rimT(e);
    bez(e, a + (b - a) * f);
    g.fillStyle = pal.text;
    g.beginPath(); g.arc(bx, by, 4.2, 0, TAU); g.fill();
    if (!reducedMotion) field.warm(field.at(bx, by), 0.9, e.tone);
  }

  function draw(t: number, act: number | null) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = pal.bg;
    g.fillRect(0, 0, W, H);
    drawGlyphs();
    geometry();
    drawEdges(t, act);
    drawStream(act);
    drawNodes(t, act);
    drawToken(t);
    for (const d of main) {
      const o = d.r + 8;
      btns[d.i].style.transform = `translate(${(d.x - o).toFixed(1)}px, ${(d.y - o).toFixed(1)}px)`;
    }
  }

  // ---------------------------------------------------------------- DOM: one focusable button per state

  const btns = main.map((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.fI = String(d.i);
    b.className =
      "pointer-events-auto absolute left-0 top-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
    b.setAttribute("aria-label", `State ${d.i + 1} of ${n}: ${d.state.label}, ${durText(d.state, run)}. ${d.state.log}`);
    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") ev.enter(d.i); }, on);
    b.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") ev.leave(d.i); }, on);
    b.addEventListener("focus", () => ev.focus(d.i), on);
    b.addEventListener("blur", () => ev.blur(d.i), on);
    b.addEventListener("click", () => ev.tap(d.i), on);
    p.layer.append(b);
    return b;
  });

  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", () => {
    pal = readPalette();
    toneColor = TONES.map((t) => pal[t]);
    paintInk();
    if (reducedMotion) api.still(lastT, lastAct);
  }, on);

  const ro = new ResizeObserver(() => {
    layout();
    if (reducedMotion) api.still(lastT, lastAct);
  });
  ro.observe(p.stage);

  paintInk();
  layout();

  const api: Scene = {
    frame(dt, t, act) {
      time += dt;
      lastT = t; lastAct = act;
      sim.tick();
      for (const d of main) {
        d.x = clamp(d.x, d.r + 6, W - d.r - 6);
        d.y = clamp(d.y, d.r + 6, H - d.r - 30);
        d.glow += ((act === d.i ? 1 : 0) - d.glow) * Math.min(1, dt * 8);
      }
      // A gentle glyph ripple as the clock enters each state.
      const now = cursorAt(P, t) + 1;
      if (now > entered) {
        for (let i = entered; i < now; i++) ripples.push({ x: main[i].x, y: main[i].y, t0: time, tone: main[i].tone });
      }
      entered = now;
      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k], e = (time - rp.t0) / 0.8;
        if (e >= 1) { ripples.splice(k, 1); continue; }
        const rr = 20 + 70 * (1 - (1 - e) ** 3), heat = 0.55 * (1 - e);
        field.near(rp.x, rp.y, rr + 8, (i, _x, _y, d) => { if (d > rr - 8) field.warm(i, heat, rp.tone); });
      }
      if (act !== null) warmAround(main[act], 0.22);
      stepStream(dt, t);
      field.scroll(6 * dt);
      field.mutate(2);
      field.cool(dt);
      draw(t, act);
    },
    still(t, act) {
      lastT = t; lastAct = act;
      for (const d of main) d.glow = act === d.i ? 1 : 0;
      warmStill(act);
      draw(t, act);
    },
    reset() {
      parts.length = 0;
      ripples.length = 0;
      spawnAcc = 0;
      streamT = 0;
      entered = 0;
    },
    destroy() {
      ac.abort();
      ro.disconnect();
      sim.stop();
      for (const b of btns) b.remove();
    },
  };
  return api;
}
