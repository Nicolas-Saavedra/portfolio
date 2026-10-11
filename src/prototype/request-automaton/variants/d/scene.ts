// PROTOTYPE: throwaway. Variant D's scene: the run as a live d3-force automaton on a full-bleed canvas.
// Particles stream along transitions at speeds derived from the timings, states explode into
// illustrative sub-states on hover, the cursor parts the stream, and holding it makes a gravity well.
import { forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { easeCubicInOut, easeCubicOut } from "d3-ease";
import type { Run, RunState } from "../../model";
import { GlyphField, HOT, MONO } from "./glyphs";
import { TONES, type Tone, arrivalSymbol, detailOf, introSeconds, radiusOf, subStates, toneOf, travelSeconds } from "./flavor";

const SANS = '"Inter Variable", ui-sans-serif, system-ui, sans-serif';
const TAU = Math.PI * 2;
const INTRO_START = 0.35;

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

interface SNode extends SimulationNodeDatum {
  x: number; y: number; vx: number; vy: number;
  kind: "state" | "sub";
  r: number;
  tone: number;
  /** Anchor (state) or nothing (sub; its target is computed from the parent). */
  ax: number; ay: number;
  i: number;
  state: RunState;
  revealed: boolean;
  pulse: number;
  btn: HTMLButtonElement | null;
  parent: SNode | null;
  k: number; m: number;
  label: string;
  /** Sub: width of its label. State: width of its widest sub-state label while exploded. */
  lw: number;
  born: number; dying: number;
}

interface SLink extends SimulationLinkDatum<SNode> { source: SNode; target: SNode; d: number }

interface Edge {
  to: SNode; from: SNode | null;
  T: number; tone: number; dashed: boolean; symbol: string;
  sx: number; sy: number; cx: number; cy: number; tx: number; ty: number;
  px: number; py: number; len: number; bend: number;
}

interface Particle { e: number; t: number; j: number; dx: number; dy: number; tracer: boolean; cell: number; x: number; y: number; tx: number; ty: number }
interface Shock { x: number; y: number; t0: number; dur: number; R: number; tone: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; tone: number }

export interface SceneParts {
  root: HTMLElement; canvas: HTMLCanvasElement; layer: HTMLElement; tip: HTMLElement;
  copy: HTMLElement; orbit: HTMLElement; transcript: HTMLElement;
}

export interface SceneHooks {
  onReveal(i: number): void;
  onCount(ms: number): void;
  onAccept(): void;
  onActive(i: number | null): void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const toneIx = (t: Tone) => TONES.indexOf(t);

export function mountScene(p: SceneParts, run: Run, reducedMotion: boolean, hooks: SceneHooks): () => void {
  const states = run.states;
  const n = states.length;
  const g = p.canvas.getContext("2d");
  if (!g) {
    states.forEach((_, i) => hooks.onReveal(i));
    hooks.onAccept();
    return () => {};
  }
  const ac = new AbortController();
  const on = { signal: ac.signal };
  const field = new GlyphField();
  let pal = readPalette();
  let toneColor = TONES.map((t) => pal[t]);
  let clearGrad: CanvasGradient | null = null;

  let W = 0, H = 0, dpr = 1, narrow = false;
  let copyR = NO_RECT, orbitR = NO_RECT, transR = NO_RECT;
  let time = 0, last = 0, raf = 0, visible = true, placed = false;

  const sumMs = states.reduce((a, s) => a + (s.durationMs ?? 0), 0);
  const totalMs = run.totalMs ?? sumMs;
  const cum: number[] = [0];
  states.forEach((s, i) => cum.push(cum[i] + (s.durationMs ?? 0)));

  const main: SNode[] = states.map((s, i) => ({
    kind: "state", i, state: s, r: radiusOf(s), tone: toneIx(toneOf(s)), ax: 0, ay: 0, x: 0, y: 0, vx: 0, vy: 0,
    revealed: reducedMotion, pulse: 0, btn: null, parent: null, k: 0, m: 0, label: s.label, lw: 0, born: 0, dying: 0,
  }));
  let subs: SNode[] = [];
  const edges: Edge[] = states.map((s, j) => ({
    to: main[j], from: j ? main[j - 1] : null, T: travelSeconds(s), tone: toneIx(toneOf(s)), dashed: !!s.skipped,
    symbol: arrivalSymbol(s, states[j - 1], run),
    sx: 0, sy: 0, cx: 0, cy: 0, tx: 0, ty: 0, px: 0, py: 0, len: 1, bend: 0,
  }));

  // Opening execution: a token walks the machine, each state pops into existence when reached.
  const arrive: number[] = [];
  states.reduce((t, s, j) => (arrive[j] = t + introSeconds(s)), INTRO_START);
  const acceptAt = (n ? arrive[n - 1] : INTRO_START) + 0.25;
  let revealedCount = reducedMotion ? n : 0;
  let accepted = reducedMotion;
  let lastCount = -1;

  // Interaction state.
  let cursor: { x: number; y: number } | null = null;
  let wellOn = false, wellS = 0;
  let dragging: SNode | null = null;
  let active: SNode | null = null, pinned = false, releaseAt = 0, exploded: SNode | null = null;
  let tipW = 0, tipH = 0;

  const parts: Particle[] = [];
  const shocks: Shock[] = [];
  const sparks: Spark[] = [];
  let streaming = false, streamT = 0, spawnAcc = 0;

  // ---------------------------------------------------------------- simulation

  const link = forceLink<SNode, SLink>([]).distance((l) => l.d).strength(0.5);
  const sim = forceSimulation<SNode>([])
    .alpha(0.5).alphaDecay(0).alphaMin(0).velocityDecay(0.38)
    .force("link", link)
    .force("charge", forceManyBody<SNode>().strength((d) => (d.kind === "sub" ? -45 : -340)).distanceMax(230))
    .force("collide", forceCollide<SNode>((d) => d.r + (d.kind === "sub" ? 12 : narrow ? 18 : 26)).strength(0.7))
    .force("anchor", anchorForce)
    .force("field", fieldForce)
    .stop();

  function rebuild() {
    sim.nodes([...main.filter((d) => d.revealed), ...subs]);
    const links: SLink[] = [];
    for (let j = 1; j < n; j++) {
      const a = main[j - 1], b = main[j];
      if (a.revealed && b.revealed) links.push({ source: a, target: b, d: Math.hypot(b.ax - a.ax, b.ay - a.ay) });
    }
    link.links(links);
  }

  const ringRadius = (par: SNode, m: number) => par.r + (narrow ? 32 : 44) + m * (narrow ? 3 : 4);
  /** Children fan over the top of their parent, leaving the bottom free for its label. */
  const ringAngle = (k: number, m: number) => ((140 + (m > 1 ? (k * 260) / (m - 1) : 130)) * Math.PI) / 180;

  function anchorForce() {
    for (const d of sim.nodes()) {
      let tx: number, ty: number, k: number;
      if (d.kind === "state") {
        tx = d.ax + (reducedMotion ? 0 : Math.sin(time * 0.55 + d.i * 1.9) * 7);
        ty = d.ay + (reducedMotion ? 0 : Math.cos(time * 0.45 + d.i * 1.3) * 7);
        k = 0.045;
      } else {
        const par = d.parent!;
        if (d.dying) {
          tx = par.x; ty = par.y; k = 0.3;
        } else {
          const a = ringAngle(d.k, d.m) + Math.sin(time * 0.8 + d.k) * 0.06;
          const R = ringRadius(par, d.m);
          tx = par.x + Math.cos(a) * R; ty = par.y + Math.sin(a) * R; k = 0.2;
        }
      }
      d.vx += (tx - d.x) * k;
      d.vy += (ty - d.y) * k;
    }
  }

  function exclude(d: SNode, R: Rect, pad: number) {
    if (!R.w) return;
    const x0 = R.x - pad, x1 = R.x + R.w + pad, y0 = R.y - pad, y1 = R.y + R.h + pad;
    if (d.x <= x0 || d.x >= x1 || d.y <= y0 || d.y >= y1) return;
    const l = d.x - x0, r = x1 - d.x, t = d.y - y0, b = y1 - d.y, m = Math.min(l, r, t, b);
    if (m === l) d.vx -= l * 0.22; else if (m === r) d.vx += r * 0.22; else if (m === t) d.vy -= t * 0.22; else d.vy += b * 0.22;
  }

  function fieldForce() {
    for (const d of sim.nodes()) {
      if (d === dragging) continue;
      exclude(d, copyR, d.r + 14);
      exclude(d, transR, d.r + 10);
      if (d === exploded && d !== dragging) {
        // Room for the ring plus its side labels; on a phone this centres the exploded state.
        const ring = ringRadius(d, subStates(d.state, run).length), mx = ring + d.lw + 24, my = ring + 24;
        if (d.x < mx) d.vx += (mx - d.x) * 0.4; else if (d.x > W - mx) d.vx -= (d.x - W + mx) * 0.4;
        if (d.y < my) d.vy += (my - d.y) * 0.4; else if (d.y > H - my) d.vy -= (d.y - H + my) * 0.4;
      }
      if (!cursor) continue;
      const dx = d.x - cursor.x, dy = d.y - cursor.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
      if (wellS > 0.01) {
        if (dist > d.r + 26) {
          const f = wellS * 1.3 * Math.min(1, 320 / dist);
          d.vx += -ux * f - uy * f * 0.35;
          d.vy += -uy * f + ux * f * 0.35;
        }
      } else if (d.kind === "state" && d !== active) {
        // Lean away from a passing cursor, but snap toward it when it aims at the state.
        const snap = d.r + 36, far = 180;
        if (dist < snap) {
          const f = 0.45 * (1 - dist / snap);
          d.vx -= ux * f; d.vy -= uy * f;
        } else if (dist < far) {
          const f = 1.1 * (1 - (dist - snap) / (far - snap)) ** 2;
          d.vx += ux * f; d.vy += uy * f;
        }
      }
    }
  }

  // ---------------------------------------------------------------- layout

  function anchors() {
    const R = orbitR;
    if (!n || !R.w) return;
    const padX = Math.min(90, R.w * 0.14), padY = Math.min(80, R.h * 0.16);
    const gapMin = narrow ? 140 : 170;
    let per = Math.max(1, Math.min(n, Math.floor((R.w - 2 * padX) / gapMin) + 1));
    const rows = Math.ceil(n / per);
    per = Math.ceil(n / rows);
    const gapX = per > 1 ? Math.min(narrow ? 200 : 270, (R.w - 2 * padX) / (per - 1)) : 0;
    const gapY = rows > 1 ? Math.min(narrow ? 190 : 300, (R.h - 2 * padY) / (rows - 1)) : 0;
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    main.forEach((d, i) => {
      const row = Math.floor(i / per), c0 = i % per, col = row % 2 ? per - 1 - c0 : c0;
      d.ax = cx + (col - (per - 1) / 2) * gapX;
      d.ay = cy + (row - (rows - 1) / 2) * gapY + (col % 2 ? 1 : -1) * (gapY ? Math.min(18, gapY * 0.08) : 14);
    });
  }

  function layout() {
    const rr = p.root.getBoundingClientRect();
    if (!rr.width || !rr.height) return;
    const rel = (el: HTMLElement): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - rr.left, y: r.top - rr.top, w: r.width, h: r.height };
    };
    const sizeChanged = rr.width !== W || rr.height !== H;
    W = rr.width; H = rr.height;
    copyR = rel(p.copy); orbitR = rel(p.orbit); transR = rel(p.transcript);
    narrow = W < 640;
    if (sizeChanged) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (W * H * dpr * dpr > 5.2e6) dpr = Math.max(1, Math.sqrt(5.2e6 / (W * H)));
      p.canvas.width = Math.round(W * dpr);
      p.canvas.height = Math.round(H * dpr);
      field.resize(W, H, dpr);
    }
    for (const d of main) {
      d.r = radiusOf(d.state) * (narrow ? 0.85 : W >= 1200 ? 1.2 : 1);
      if (d.btn) d.btn.style.width = d.btn.style.height = `${Math.round(d.r * 2 + 12)}px`;
    }
    anchors();
    for (const d of main) {
      if (!placed || !d.revealed) { d.x = d.ax; d.y = d.ay; }
    }
    placed = true;
    rebuild(); // re-initializes every force, so radii and link lengths follow the new size
  }

  function paintInk() {
    field.setInk(pal.faint, pal.dark ? 0.55 : 0.7);
    clearGrad = g!.createRadialGradient(0, 0, 0, 0, 0, 1);
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

  function startPoint() {
    const a = main[0];
    let dx = 1, dy = 0;
    if (n > 1) {
      const b = main[1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      dx = (b.x - a.x) / l; dy = (b.y - a.y) / l;
    }
    const L = narrow ? 54 : 78;
    return { x: a.x - dx * L, y: a.y - dy * L };
  }

  function geometry() {
    if (!n) return;
    const s0 = startPoint();
    for (const e of edges) {
      const sx = e.from ? e.from.x : s0.x, sy = e.from ? e.from.y : s0.y;
      const dx = e.to.x - sx, dy = e.to.y - sy, len = Math.hypot(dx, dy) || 1;
      e.sx = sx; e.sy = sy; e.tx = e.to.x; e.ty = e.to.y; e.len = len;
      e.px = -dy / len; e.py = dx / len;
      e.bend = e.from ? -Math.min(34, len * 0.14) : 0;
      e.cx = (sx + e.to.x) / 2 + e.px * e.bend;
      e.cy = (sy + e.to.y) / 2 + e.py * e.bend;
    }
  }

  // ---------------------------------------------------------------- events in the scene

  function shock(x: number, y: number, tone: number, R: number, dur = 0.9) {
    if (reducedMotion) return;
    shocks.push({ x, y, t0: time, dur, R, tone });
    if (shocks.length > 6) shocks.shift();
  }

  function burst(x: number, y: number, tone: number, count: number, speed: number) {
    if (reducedMotion) return;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * TAU, v = speed * (0.4 + Math.random() * 0.6);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, tone });
    }
    if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
  }

  function reveal(j: number) {
    const d = main[j];
    d.revealed = true;
    d.x = d.ax; d.y = d.ay;
    const e = edges[j];
    d.vx = (e.tx - e.sx) / e.len * 5; d.vy = (e.ty - e.sy) / e.len * 5;
    if (d.btn) d.btn.style.visibility = "visible";
    rebuild();
    shock(d.x, d.y, d.tone, 120, 0.8);
    burst(d.x, d.y, d.tone, 14, 3);
    hooks.onReveal(j);
  }

  function accept() {
    accepted = true;
    streaming = true;
    hooks.onCount(totalMs);
    hooks.onAccept();
    const f = main[n - 1];
    if (f) {
      f.pulse = 1;
      shock(f.x, f.y, f.tone, 260, 1.3);
      burst(f.x, f.y, f.tone, 28, 4);
    }
  }

  function explode(d: SNode) {
    if (exploded === d) return;
    collapse();
    const labels = subStates(d.state, run);
    if (!labels.length) return;
    exploded = d;
    const m = labels.length;
    g!.font = `10.5px ${MONO}`;
    const widths = labels.map((l) => g!.measureText(l).width);
    d.lw = Math.max(...widths);
    labels.forEach((label, k) => {
      const a = ringAngle(k, m);
      subs.push({
        lw: widths[k],
        kind: "sub", i: d.i, state: d.state, r: 5.5, tone: d.tone, ax: 0, ay: 0,
        x: d.x + Math.cos(a) * 4, y: d.y + Math.sin(a) * 4, vx: Math.cos(a) * 11, vy: Math.sin(a) * 11,
        revealed: true, pulse: 0, btn: null, parent: d, k, m, label, born: time, dying: 0,
      });
    });
    rebuild();
    shock(d.x, d.y, d.tone, 190, 0.85);
    burst(d.x, d.y, d.tone, 22, 4.5);
  }

  function collapse() {
    if (!exploded) return;
    for (const s of subs) if (s.parent === exploded && !s.dying) s.dying = time;
    exploded = null;
  }

  function activate(d: SNode) {
    releaseAt = 0;
    if (active === d) return;
    active = d;
    hooks.onActive(d.i);
    if (!reducedMotion) explode(d);
    showTip(d);
    if (reducedMotion) drawStatic();
  }

  function deactivate() {
    if (!active) return;
    active = null; pinned = false; releaseAt = 0;
    hooks.onActive(null);
    collapse();
    p.tip.style.opacity = "0";
    if (reducedMotion) drawStatic();
  }

  function release(delay: number) {
    if (pinned || !active) return;
    if (reducedMotion || delay <= 0) deactivate();
    else releaseAt = time + delay;
  }

  function togglePin(d: SNode) {
    if (active === d && pinned) return deactivate();
    activate(d);
    pinned = true;
  }

  function showTip(d: SNode) {
    const zoomed = !reducedMotion && subStates(d.state, run).length > 0;
    p.tip.replaceChildren();
    const line = document.createElement("span");
    line.className = "block";
    line.textContent = d.state.log;
    p.tip.append(line);
    if (zoomed) {
      const note = document.createElement("span");
      note.className = "mt-0.5 block text-[10.5px] text-faint";
      note.textContent = "zoomed in: typical sub-steps, not measured";
      p.tip.append(note);
    }
    p.tip.style.opacity = "1";
    tipW = p.tip.offsetWidth;
    tipH = p.tip.offsetHeight;
    placeTip();
  }

  function placeTip() {
    const d = active;
    if (!d) return;
    const lift = exploded === d ? ringRadius(d, subStates(d.state, run).length) + 40 : d.r + 14;
    let y = d.y - lift - tipH;
    if (y < 8) y = d.y + lift + (exploded === d ? 0 : 30);
    const x = clamp(d.x - tipW / 2, 8, Math.max(8, W - tipW - 8));
    p.tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  // ---------------------------------------------------------------- per-frame updates

  function stepIntro() {
    while (revealedCount < n && time >= arrive[revealedCount]) reveal(revealedCount++);
    if (!accepted && time >= acceptAt) accept();
    if (accepted) return;
    let ms = cum[n] ?? 0;
    if (revealedCount < n) {
      const j = revealedCount, from = j ? arrive[j - 1] : INTRO_START;
      const f = clamp((time - from) / (arrive[j] - from), 0, 1);
      ms = cum[j] + (states[j].durationMs ?? 0) * f;
    }
    const v = Math.round(ms);
    if (v !== lastCount) hooks.onCount((lastCount = v));
  }

  function tokenAt(): { e: number; t: number } | null {
    if (accepted || revealedCount >= n || time < INTRO_START) return null;
    const j = revealedCount, from = j ? arrive[j - 1] : INTRO_START;
    return { e: j, t: easeCubicInOut(clamp((time - from) / (arrive[j] - from), 0, 1)) };
  }

  function stepParticles(dt: number) {
    if (streaming && n) {
      streamT += dt;
      const interval = 0.028 + 0.1 * Math.max(0, 1 - streamT / 1.6);
      spawnAcc += dt;
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        if (parts.length >= 420) continue;
        parts.push({
          e: 0, t: Math.random() * 0.04, j: (Math.random() * 2 - 1) * (narrow ? 7 : 11), dx: 0, dy: 0,
          tracer: Math.random() < 0.4, cell: -1, x: 0, y: 0, tx: 0, ty: 0,
        });
      }
    }
    const relax = 1 - Math.min(1, dt * (wellS > 0.01 ? 1.2 : 5));
    for (let k = parts.length - 1; k >= 0; k--) {
      const q = parts[k];
      let e = edges[q.e];
      q.t += dt / e.T;
      if (q.t >= 1) {
        if (q.e + 1 >= n) {
          const f = main[n - 1];
          f.pulse = Math.min(1, f.pulse + 0.05);
          parts[k] = parts[parts.length - 1];
          parts.pop();
          continue;
        }
        const over = (q.t - 1) * e.T;
        e = edges[++q.e];
        q.t = Math.min(0.99, over / e.T);
      }
      bez(e, q.t);
      let s = Math.sin(Math.PI * q.t) * q.j;
      const x = bx + e.px * s, y = by + e.py * s;
      if (cursor) {
        const ddx = x + q.dx - cursor.x, ddy = y + q.dy - cursor.y, d = Math.hypot(ddx, ddy) || 1;
        if (wellS > 0.01) {
          const fr = wellS * dt * (d > 34 ? 560 * Math.min(1, 240 / d) : -320), ft = wellS * dt * 420 * Math.min(1, 200 / d);
          q.dx += (-ddx / d) * fr - (ddy / d) * ft;
          q.dy += (-ddy / d) * fr + (ddx / d) * ft;
        } else if (d < 130) {
          const f = (1 - d / 130) ** 2 * 420 * dt;
          q.dx += (ddx / d) * f;
          q.dy += (ddy / d) * f;
        }
      }
      q.dx *= relax;
      q.dy *= relax;
      q.x = x + q.dx; q.y = y + q.dy;
      const tt = Math.max(0, q.t - 0.08);
      bez(e, tt);
      s = Math.sin(Math.PI * tt) * q.j;
      q.tx = bx + e.px * s + q.dx; q.ty = by + e.py * s + q.dy;
      if (q.tracer) {
        const c = field.at(q.x, q.y);
        if (c !== q.cell) { q.cell = c; field.warm(c, 0.9, e.tone); }
      }
    }
  }

  function stepFx(dt: number) {
    for (let k = shocks.length - 1; k >= 0; k--) {
      const s = shocks[k], e = (time - s.t0) / s.dur;
      if (e >= 1) { shocks.splice(k, 1); continue; }
      const rr = easeCubicOut(e) * s.R, heat = 0.85 * (1 - e);
      field.near(s.x, s.y, rr + 9, (i, _x, _y, d) => { if (d > rr - 9) field.warm(i, heat, s.tone); });
    }
    const fr = Math.pow(0.93, dt * 60);
    for (let k = sparks.length - 1; k >= 0; k--) {
      const s = sparks[k];
      s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;
      s.vx *= fr; s.vy *= fr;
      s.life -= dt * 1.3;
      if (s.life <= 0) { sparks[k] = sparks[sparks.length - 1]; sparks.pop(); }
    }
  }

  // ---------------------------------------------------------------- drawing

  function halo(text: string, x: number, y: number, fill: string) {
    g!.strokeText(text, x, y);
    g!.fillStyle = fill;
    g!.fillText(text, x, y);
  }

  function clearing(R: Rect, grow: number) {
    if (!R.w || !clearGrad) return;
    g!.save();
    g!.translate(R.x + R.w / 2, R.y + R.h / 2);
    g!.scale((R.w / 2) * grow, (R.h / 2) * grow);
    g!.fillStyle = clearGrad;
    g!.fillRect(-1, -1, 2, 2);
    g!.restore();
  }

  function drawGlyphs() {
    const c = g!;
    field.draw(c);
    c.font = `12px ${MONO}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const maxA = pal.dark ? 0.8 : 0.9;
    for (let t = 0; t < TONES.length; t++) {
      c.fillStyle = toneColor[t];
      for (const i of field.hot) {
        if (field.tint[i] !== t) continue;
        const r = (i / field.cols) | 0, y = field.y(r);
        if (y > H + 10) continue;
        c.globalAlpha = Math.min(1, field.heat[i]) * maxA;
        c.fillText(HOT[field.hotChar[i]], field.x(i - r * field.cols), y);
      }
    }
    if (cursor && !reducedMotion) {
      const well = wellS > 0.05, R = well ? 90 + 120 * wellS : 96, roll = (time * 12) | 0;
      c.fillStyle = well ? pal.mauve : pal.lavender;
      field.near(cursor.x, cursor.y, R, (i, x, y, d) => {
        const a = 1 - d / R;
        c.globalAlpha = a * a * 0.75;
        c.fillText(HOT[well ? (field.hotChar[i] + roll) % HOT.length : field.hotChar[i]], x, y);
      });
    }
    c.globalAlpha = 1;
  }

  function arrowHead(e: Edge) {
    const c = g!;
    const t = clamp(1 - (e.to.r + 3) / e.len, 0, 1);
    bez(e, t);
    const u = 1 - t;
    let dx = 2 * u * (e.cx - e.sx) + 2 * t * (e.tx - e.cx), dy = 2 * u * (e.cy - e.sy) + 2 * t * (e.ty - e.cy);
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    c.beginPath();
    c.moveTo(bx, by);
    c.lineTo(bx - dx * 8 - dy * 4, by - dy * 8 + dx * 4);
    c.lineTo(bx - dx * 8 + dy * 4, by - dy * 8 - dx * 4);
    c.closePath();
    c.fill();
  }

  function drawEdges(token: { e: number; t: number } | null) {
    const c = g!;
    c.lineWidth = 1.3;
    c.strokeStyle = c.fillStyle = pal.faint;
    for (let j = 0; j < n; j++) {
      const e = edges[j];
      const vis = e.to.revealed ? 1 : token && token.e === j ? token.t : 0;
      if (!vis) continue;
      c.setLineDash(e.dashed ? [4, 5] : []);
      c.beginPath();
      c.moveTo(e.sx, e.sy);
      if (vis >= 1) c.quadraticCurveTo(e.cx, e.cy, e.tx, e.ty);
      else for (let k = 1; k <= 16; k++) { bez(e, (vis * k) / 16); c.lineTo(bx, by); }
      c.stroke();
      c.setLineDash([]);
      if (vis >= 1) arrowHead(e);
    }
    // Transition symbols, on the outside of each bow.
    c.font = `10.5px ${MONO}`;
    c.lineWidth = 4;
    c.lineJoin = "round";
    c.strokeStyle = pal.bg;
    for (let j = 0; j < n; j++) {
      const e = edges[j];
      if (!e.to.revealed) continue;
      if (!e.from) {
        c.textAlign = "center";
        c.textBaseline = "bottom";
        const x = clamp(e.sx, 70, W - 70);
        halo(e.symbol, x, e.sy - 10, pal.muted);
        continue;
      }
      bez(e, 0.5);
      const side = e.bend < 0 ? -1 : 1;
      c.textAlign = "center";
      c.textBaseline = "middle";
      const half = c.measureText(e.symbol).width / 2 + 6;
      halo(e.symbol, clamp(bx + e.px * side * 13, half, W - half), by + e.py * side * 13, pal.muted);
    }
  }

  function drawSubs() {
    if (!subs.length) return;
    const c = g!;
    const byParent = new Map<SNode, SNode[]>();
    for (const s of subs) {
      const list = byParent.get(s.parent!) ?? [];
      list[s.k] = s;
      byParent.set(s.parent!, list);
    }
    for (const [par, kids] of byParent) {
      const life = (s: SNode) => (s.dying ? Math.max(0, 1 - (time - s.dying) / 0.4) : Math.min(1, (time - s.born) / 0.25));
      const col = toneColor[par.tone];
      const chain: SNode[] = [par, ...kids.filter(Boolean), par];
      c.strokeStyle = c.fillStyle = col;
      c.lineWidth = 1;
      for (let k = 0; k < chain.length - 1; k++) {
        const a = chain[k], b = chain[k + 1], s = a.kind === "sub" ? a : b;
        const L = life(s);
        if (L <= 0) continue;
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
        const x0 = a.x + ux * (a.r + 2), y0 = a.y + uy * (a.r + 2), x1 = b.x - ux * (b.r + 3), y1 = b.y - uy * (b.r + 3);
        c.globalAlpha = 0.55 * L;
        c.setLineDash(a === par || b === par ? [3, 4] : []);
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x1 - ux * 6 - uy * 3, y1 - uy * 6 + ux * 3);
        c.lineTo(x1 - ux * 6 + uy * 3, y1 - uy * 6 - ux * 3);
        c.fill();
        // Two packets per sub-transition, looping.
        c.globalAlpha = 0.9 * L;
        for (let q = 0; q < 2; q++) {
          const f = (time * 0.9 + k * 0.31 + q * 0.5) % 1;
          c.beginPath(); c.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 1.6, 0, TAU); c.fill();
        }
      }
      c.font = `10.5px ${MONO}`;
      c.lineWidth = 4;
      c.lineJoin = "round";
      for (const s of kids) {
        if (!s) continue;
        const L = life(s);
        if (L <= 0) continue;
        c.globalAlpha = L;
        c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU);
        c.fillStyle = pal.bg; c.fill();
        c.strokeStyle = col; c.lineWidth = 1.4; c.stroke();
        const dx = s.x - par.x, dy = s.y - par.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
        c.textAlign = ux > 0.35 ? "left" : ux < -0.35 ? "right" : "center";
        c.textBaseline = uy > 0.35 ? "top" : uy < -0.35 ? "bottom" : "middle";
        c.lineWidth = 4;
        c.strokeStyle = pal.bg;
        halo(s.label, s.x + ux * (s.r + 6), s.y + uy * (s.r + 6), pal.text);
      }
    }
    c.globalAlpha = 1;
  }

  function drawParticles() {
    if (!parts.length) return;
    const c = g!;
    c.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    c.lineCap = "round";
    for (let t = 0; t < TONES.length; t++) {
      c.strokeStyle = c.fillStyle = toneColor[t];
      c.globalAlpha = reducedMotion ? 0 : 0.45;
      c.lineWidth = 1.6;
      c.beginPath();
      let any = false;
      for (const q of parts) {
        if (edges[q.e].tone !== t) continue;
        any = true;
        c.moveTo(q.tx, q.ty); c.lineTo(q.x, q.y);
      }
      if (!any) continue;
      if (!reducedMotion) c.stroke();
      c.globalAlpha = 0.95;
      c.beginPath();
      for (const q of parts) {
        if (edges[q.e].tone !== t) continue;
        c.moveTo(q.x + 2, q.y); c.arc(q.x, q.y, 2, 0, TAU);
      }
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  }

  function drawFx() {
    const c = g!;
    c.lineWidth = 1.4;
    for (const s of shocks) {
      const e = (time - s.t0) / s.dur;
      c.strokeStyle = toneColor[s.tone];
      c.globalAlpha = (1 - e) ** 1.5 * 0.55;
      c.beginPath(); c.arc(s.x, s.y, easeCubicOut(e) * s.R, 0, TAU); c.stroke();
    }
    for (const s of sparks) {
      c.fillStyle = toneColor[s.tone];
      c.globalAlpha = s.life * 0.9;
      c.beginPath(); c.arc(s.x, s.y, 1.5, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }

  function drawNodes() {
    const c = g!;
    const shareOf = (s: RunState) => (s.durationMs != null && sumMs ? s.durationMs / sumMs : 0);
    for (const d of main) {
      if (!d.revealed) continue;
      const col = toneColor[d.tone], act = active === d, s = d.state;
      const h = d.pulse * 0.6 + (act ? 0.5 : 0);
      if (h > 0.02) {
        c.globalAlpha = Math.min(0.32, 0.16 * h);
        c.fillStyle = col;
        c.beginPath(); c.arc(d.x, d.y, d.r + 6 + 10 * h, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      c.fillStyle = pal.bg;
      c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill();
      c.globalAlpha = 0.13;
      c.fillStyle = col;
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = col;
      c.lineWidth = act ? 2.4 : 1.6;
      c.setLineDash(s.skipped ? [3, 4] : []);
      c.stroke();
      c.setLineDash([]);
      const share = shareOf(s);
      if (share > 0 && d.r > 15) {
        c.lineWidth = 3;
        c.lineCap = "butt";
        c.globalAlpha = 0.85;
        c.beginPath(); c.arc(d.x, d.y, d.r - 5.5, -Math.PI / 2, -Math.PI / 2 + Math.max(0.04, share) * TAU); c.stroke();
        c.globalAlpha = 1;
      }
      if (d.i === n - 1) {
        c.lineWidth = 1.2;
        c.beginPath(); c.arc(d.x, d.y, d.r + 4.5, 0, TAU); c.stroke();
      }
      c.font = `10px ${MONO}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = pal.muted;
      c.fillText(`q${d.i}`, d.x, d.y + 0.5);

      const ly = d.y + d.r + (d.i === n - 1 ? 9 : 6);
      c.lineWidth = 4;
      c.lineJoin = "round";
      c.strokeStyle = pal.bg;
      c.textBaseline = "top";
      c.font = `600 ${narrow ? 12 : 13}px ${SANS}`;
      halo(s.label, d.x, ly, pal.text);
      c.font = `${narrow ? 10.5 : 11}px ${MONO}`;
      halo(detailOf(s, run), d.x, ly + (narrow ? 16 : 17), s.skipped ? pal.faint : pal.muted);
    }
  }

  function drawToken(token: { e: number; t: number } | null) {
    if (!token) return;
    const c = g!, e = edges[token.e];
    bez(e, token.t);
    const col = toneColor[e.tone];
    c.fillStyle = col;
    c.globalAlpha = 0.25;
    c.beginPath(); c.arc(bx, by, 11, 0, TAU); c.fill();
    c.globalAlpha = 1;
    c.beginPath(); c.arc(bx, by, 4.2, 0, TAU); c.fill();
    field.warm(field.at(bx, by), 1, e.tone);
  }

  function drawWell() {
    if (!cursor || wellS < 0.01) return;
    const c = g!;
    c.strokeStyle = pal.mauve;
    c.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      c.globalAlpha = (wellS * 0.6) / (k + 1);
      c.setLineDash([2, 7]);
      c.lineDashOffset = -time * 24 * (k + 1);
      c.beginPath(); c.arc(cursor.x, cursor.y, 14 + k * 17 + 6 * wellS, 0, TAU); c.stroke();
    }
    c.setLineDash([]);
    c.lineDashOffset = 0;
    c.globalAlpha = 1;
    c.fillStyle = pal.bg;
    c.beginPath(); c.arc(cursor.x, cursor.y, 3 + 5 * wellS, 0, TAU); c.fill(); c.stroke();
  }

  function draw() {
    const c = g!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.fillStyle = pal.bg;
    c.fillRect(0, 0, W, H);
    drawGlyphs();
    clearing(copyR, 1.5);
    clearing(transR, 1.35);
    geometry();
    const token = tokenAt();
    drawEdges(token);
    drawSubs();
    drawParticles();
    drawFx();
    drawNodes();
    drawToken(token);
    drawWell();
  }

  function placeDom() {
    for (const d of main) {
      if (!d.btn || !d.revealed) continue;
      const o = d.r + 6;
      d.btn.style.transform = `translate(${(d.x - o).toFixed(1)}px, ${(d.y - o).toFixed(1)}px)`;
    }
    placeTip();
  }

  // ---------------------------------------------------------------- loops

  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    stepIntro();
    wellS = wellOn ? Math.min(1, wellS + dt / 0.9) : Math.max(0, wellS - dt * 4);
    sim.tick();
    for (const d of sim.nodes()) {
      d.x = clamp(d.x, d.r + 4, W - d.r - 4);
      d.y = clamp(d.y, d.r + 4, H - d.r - 36);
      if (d.kind !== "sub") continue;
      // Keep every sub-state label fully on screen, whichever side it hangs off.
      const ux = (d.x - d.parent!.x) / (Math.hypot(d.x - d.parent!.x, d.y - d.parent!.y) || 1), pad = d.r + 10;
      if (ux > 0.35) d.x = Math.min(d.x, W - d.lw - pad);
      else if (ux < -0.35) d.x = Math.max(d.x, d.lw + pad);
      else d.x = clamp(d.x, d.lw / 2 + 8, W - d.lw / 2 - 8);
    }
    if (subs.some((s) => s.dying && time - s.dying > 0.45)) {
      subs = subs.filter((s) => !(s.dying && time - s.dying > 0.45));
      rebuild();
    }
    for (const d of main) d.pulse *= Math.exp(-dt * 2.5);
    if (releaseAt && time >= releaseAt) deactivate();
    stepParticles(dt);
    stepFx(dt);
    field.scroll(7 * dt);
    field.mutate(3);
    field.cool(dt);
    draw();
    placeDom();
    schedule();
  }

  function schedule() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  /** The calm frame for reduced motion: settled layout, a frozen stream, no loop. */
  function settleStatic() {
    for (let k = 0; k < 300; k++) sim.tick();
    geometry();
    parts.length = 0;
    edges.forEach((e, j) => {
      const count = Math.max(2, Math.round(e.T * 9));
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count, jit = (((k * 7 + j * 3) % 5) / 2 - 1) * 8;
        bez(e, t);
        const s = Math.sin(Math.PI * t) * jit, x = bx + e.px * s, y = by + e.py * s;
        parts.push({ e: j, t, j: jit, dx: 0, dy: 0, tracer: false, cell: -1, x, y, tx: x, ty: y });
        field.warm(field.at(x, y), 0.5, e.tone);
      }
    });
  }

  function drawStatic() {
    if (!W) return;
    draw();
    placeDom();
  }

  // ---------------------------------------------------------------- DOM: one button per state

  main.forEach((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className =
      "pointer-events-auto absolute left-0 top-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
      (reducedMotion ? "cursor-pointer" : "cursor-grab touch-none active:cursor-grabbing");
    b.style.visibility = d.revealed ? "visible" : "hidden";
    b.setAttribute("aria-label", `State ${d.i + 1} of ${n}: ${d.state.label}, ${detailOf(d.state, run)}. ${d.state.log}`);
    d.btn = b;
    p.layer.append(b);

    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !dragging) activate(d); }, on);
    b.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && dragging !== d) release(0.5); }, on);
    b.addEventListener("focus", () => activate(d), on);
    b.addEventListener("blur", () => release(0.15), on);
    b.addEventListener("click", (e) => { if (e.detail === 0 || reducedMotion) togglePin(d); }, on);
    if (reducedMotion) return;

    let start = { x: 0, y: 0 }, prev = { x: 0, y: 0, t: 0 }, vel = { x: 0, y: 0 }, moved = false;
    b.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      b.setPointerCapture(e.pointerId);
      dragging = d;
      moved = false;
      start = local(e);
      prev = { ...start, t: performance.now() };
      vel = { x: 0, y: 0 };
      d.fx = d.x; d.fy = d.y;
    }, on);
    b.addEventListener("pointermove", (e) => {
      if (dragging !== d) return;
      const pt = local(e), now = performance.now();
      if (!moved && Math.hypot(pt.x - start.x, pt.y - start.y) > 5) moved = true;
      if (!moved) return;
      d.fx = pt.x; d.fy = pt.y;
      const dt = Math.max(1, now - prev.t);
      vel = { x: ((pt.x - prev.x) / dt) * 16, y: ((pt.y - prev.y) / dt) * 16 };
      prev = { ...pt, t: now };
    }, on);
    const end = (e: PointerEvent, tap: boolean) => {
      if (dragging !== d) return;
      dragging = null;
      d.fx = null; d.fy = null;
      if (moved) { d.vx = clamp(vel.x, -40, 40); d.vy = clamp(vel.y, -40, 40); }
      else if (tap) togglePin(d);
      if (e.pointerType === "mouse" && moved && !b.matches(":hover")) release(0.5);
    };
    b.addEventListener("pointerup", (e) => end(e, true), on);
    b.addEventListener("pointercancel", (e) => end(e, false), on);
  });

  function local(e: PointerEvent | MouseEvent) {
    const r = p.root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // ---------------------------------------------------------------- scene-wide listeners

  p.root.addEventListener("keydown", (e) => { if (e.key === "Escape") deactivate(); }, on);

  if (!reducedMotion) {
    p.root.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") cursor = local(e); }, on);
    p.root.addEventListener("pointerleave", () => { if (!wellOn) cursor = null; }, on);
    p.canvas.addEventListener("pointerdown", (e) => {
      if (pinned) deactivate();
      if (e.pointerType === "touch" || e.button !== 0) return;
      e.preventDefault();
      p.canvas.setPointerCapture(e.pointerId);
      cursor = local(e);
      wellOn = true;
    }, on);
    const drop = () => {
      if (!wellOn) return;
      wellOn = false;
      if (!cursor || wellS < 0.15) return;
      const { x, y } = cursor;
      shock(x, y, toneIx("mauve"), 140 + 260 * wellS, 1.1);
      burst(x, y, toneIx("mauve"), 30, 6 * wellS);
      for (const d of sim.nodes()) {
        const dx = d.x - x, dy = d.y - y, l = Math.hypot(dx, dy) || 1;
        const f = (wellS * 16 * Math.min(1, 260 / l));
        d.vx += (dx / l) * f; d.vy += (dy / l) * f;
      }
      for (const q of parts) {
        const dx = q.x - x, dy = q.y - y, l = Math.hypot(dx, dy) || 1;
        q.dx += (dx / l) * 40 * wellS; q.dy += (dy / l) * 40 * wellS;
      }
    };
    p.canvas.addEventListener("pointerup", drop, on);
    p.canvas.addEventListener("pointercancel", drop, on);
  } else {
    p.canvas.addEventListener("pointerdown", () => { if (pinned) deactivate(); }, on);
  }

  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", () => {
    pal = readPalette();
    toneColor = TONES.map((t) => pal[t]);
    paintInk();
    if (reducedMotion) drawStatic();
  }, on);

  const ro = new ResizeObserver(() => {
    layout();
    if (reducedMotion) { settleStatic(); drawStatic(); }
  });
  ro.observe(p.root);

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (reducedMotion) return;
    if (visible) { last = 0; schedule(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  io.observe(p.root);

  // ---------------------------------------------------------------- go

  paintInk();
  layout();
  if (reducedMotion) {
    states.forEach((_, i) => hooks.onReveal(i));
    hooks.onCount(totalMs);
    hooks.onAccept();
    settleStatic();
    drawStatic();
  } else {
    schedule();
  }

  return () => {
    ac.abort();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    ro.disconnect();
    io.disconnect();
    sim.stop();
    sim.nodes([]);
    for (const d of main) d.btn?.remove();
  };
}
