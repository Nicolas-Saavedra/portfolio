// PROTOTYPE: throwaway. Variant E's instrument panel: C's console, reworked to sit on D's glyph field.
// It has no clock of its own: the scene's single frame loop calls step(), so panel and field never disagree.
// The playhead is a slider: drag it (or use the arrow keys) to scrub the run.
import type { Run, RunState, StateId } from "../../model";

export type Tone = "sky" | "lavender" | "mauve" | "peach" | "green";

// Animation clock (ms of animation, not of request).
const LEAD = 500; // token rides the start arrow
const MOVE = 300; // token rides an edge
const BASE = 380; // minimum dwell in a state
const SPREAD = 2600; // extra dwell, shared by duration
const SETTLE = 400; // counter catches up to totalMs when phases don't cover it
const CHAR_MS = 12; // log typing speed

const TONE: Record<StateId, Tone> = {
  lookup: "sky", connect: "lavender", secure: "mauve", edge: "peach", firstByte: "peach", delivered: "green", cached: "green",
};
const SERVICE: Record<StateId, string> = {
  lookup: "dns", connect: "tcp", secure: "tls", edge: "edge", firstByte: "edge", delivered: "browser", cached: "browser",
};

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const q = (i: number) => "q" + [...String(i)].map((d) => SUB[+d]).join("");
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const hue = (s: RunState) => `var(--${TONE[s.id]})`;
const mix = (c: string, pct: number, base = "var(--surface)") => `color-mix(in srgb, ${c} ${pct}%, ${base})`;
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** d3-style nice ticks from 0 to max, without pulling in d3-scale. */
function ticks(max: number, count: number): number[] {
  if (max <= 0) return [0];
  const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw)), f = raw / mag;
  const step = mag * (f >= 7.07 ? 10 : f >= 3.16 ? 5 : f >= 1.41 ? 2 : 1);
  const out: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

interface Plan {
  start: number[]; end: number[]; // request-ms offsets per state
  enter: number[]; leave: number[]; // animation-ms per state
  sum: number; domain: number; total?: number; endT: number;
}

function plan(run: Run): Plan {
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
  const typed = Math.max(...run.states.map((s, i) => enter[i] + s.log.length * CHAR_MS));
  const endT = Math.max(a + (domain > sum ? SETTLE : 0), typed);
  return { start, end, enter, leave, sum, domain, total: run.totalMs ?? (sum || undefined), endT };
}

/** Request time (ms) the playhead has reached at animation time t. */
function reqAt(p: Plan, t: number): number {
  const n = p.enter.length;
  for (let i = n - 1; i >= 0; i--) {
    if (t < p.enter[i]) continue;
    if (t < p.leave[i]) return p.start[i] + ((p.end[i] - p.start[i]) * (t - p.enter[i])) / (p.leave[i] - p.enter[i]);
    if (i === n - 1) return p.sum + (p.domain - p.sum) * clamp((t - p.leave[i]) / SETTLE);
    return p.end[i];
  }
  return 0;
}

/** Inverse of reqAt for scrubbing: the latest animation time whose request time is still ≤ r.
 *  Zero-duration states take no request time, so scrubbing passes through them, as the request did. */
function tAtReq(p: Plan, r: number): number {
  const n = p.enter.length;
  if (r >= p.domain) return p.endT;
  if (r >= p.sum) return p.leave[n - 1] + (SETTLE * (r - p.sum)) / (p.domain - p.sum);
  for (let i = 0; i < n; i++) {
    if (p.end[i] > r) return p.enter[i] + ((r - p.start[i]) / (p.end[i] - p.start[i])) * (p.leave[i] - p.enter[i]);
  }
  return p.endT;
}

/** Index of the state the token is in (or just left), -1 before the run starts. */
function cursor(p: Plan, t: number): number {
  for (let i = p.enter.length - 1; i >= 0; i--) if (t >= p.enter[i]) return i;
  return -1;
}

export function durText(s: RunState, run: Run): string {
  if (s.skipped) return "skipped";
  if (s.durationMs !== undefined) return `${s.durationMs} ms`;
  if (s.id === "edge" && run.meta.colo) return run.meta.colo;
  return "no data";
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent?.append(el);
  return el;
}

const STYLE = `
@keyframes eobs-blink { 50% { opacity: 0 } }
.eobs-cursor { animation: eobs-blink 1.05s steps(1) infinite; }
.eobs-x { transition: opacity .15s ease, background-color .15s ease; }
.eobs-node { cursor: pointer; outline: none; }
.eobs-node .eobs-focus { opacity: 0; }
.eobs-node:focus-visible .eobs-focus { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .eobs-cursor { animation: none; } .eobs-x { transition: none; } }
`;

export interface Probe {
  panel: DOMRect;
  /** Client-space centre of the token, or null before it exists. */
  token: { x: number; y: number } | null;
  /** Client-space x of the playhead. */
  playheadX: number;
  /** True while the run is playing on its own. */
  playing: boolean;
  tone: Tone;
}

export interface ConsoleHandle {
  el: HTMLElement;
  play(): void;
  /** Advance the run by dt ms of animation time (no-op unless playing). */
  step(dt: number): void;
  probe(): Probe;
  dispose(): void;
}

export function mountConsole(host: HTMLElement, run: Run, reducedMotion: boolean, onChange: () => void): ConsoleHandle {
  const states = run.states;
  const n = states.length;
  const P = plan(run);
  const D = P.domain;
  const pct = (v: number) => (D > 0 ? (v / D) * 100 : 0);
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K, fn: (e: HTMLElementEventMap[K]) => void) =>
    el.addEventListener(type, fn as EventListener, { signal: ac.signal });

  const example = run.kind === "example";
  const m = run.meta;
  const where = m.city && m.colo ? `${m.city} · ${m.colo}` : (m.colo ?? "—");
  const tks = ticks(D, 6);
  const tickCls = (i: number) => (i % 2 === 0 ? "" : "hidden sm:block"); // every other label on phones
  const service = (s: RunState) => (s.id === "connect" ? (/3|quic/i.test(m.http ?? "") ? "quic" : "tcp") : SERVICE[s.id]);
  const totalLabel = P.total !== undefined ? `${P.total} ms` : "unknown";
  const summary =
    `Request automaton, ${example ? "example run" : "your request"}: ` +
    states.map((s) => `${s.label} ${durText(s, run)}`).join(", ") +
    `. Total ${totalLabel}.`;

  const el = document.createElement("div");
  el.className = "relative rounded-md border border-border bg-surface";
  el.style.boxShadow = "0 18px 40px -28px rgb(0 0 0 / 0.45)"; // solid surface, lifted off the field
  el.innerHTML = `
<style>${STYLE}</style>
<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
  <h2 class="flex items-baseline gap-2.5 text-sm">
    <span class="font-mono text-text">GET /</span>
    <span class="text-muted">${example ? "a page load, traced" : "your page load, traced"}</span>
  </h2>
  <div class="flex min-w-0 items-center gap-3 font-mono text-[11px]">
    ${
      example
        ? `<span class="rounded-sm border border-dashed border-border px-2 py-0.5 text-muted">example run<span class="text-faint"> · your real request appears on the live site</span></span>`
        : `<span class="flex items-center gap-1.5 text-muted"><span class="size-1.5 rounded-full bg-green"></span>live · your request</span>`
    }
    ${reducedMotion ? "" : `<button data-replay type="button" class="whitespace-nowrap rounded-sm border border-border px-2 py-0.5 text-muted hover:border-faint hover:text-text focus-visible:outline-2 focus-visible:outline-lavender" aria-label="Replay the request animation">↻ replay</button>`}
  </div>
</div>

<div aria-hidden="true" class="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-[1.1fr_1fr_0.8fr_1.3fr]">
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">total</div>
    <div class="mt-0.5 flex items-baseline gap-1 font-mono tabular-nums"><span data-total class="text-3xl leading-none">0</span><span class="text-xs text-muted">ms</span></div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">edge</div>
    <div class="mt-1.5 truncate font-mono text-sm text-text">${esc(where)}${m.edgeCache ? ` <span class="text-faint">· ${m.edgeCache}</span>` : ""}</div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">protocol</div>
    <div class="mt-1.5 truncate font-mono text-sm text-text">${esc(m.http ?? "—")}</div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">tls</div>
    <div class="mt-1.5 font-mono text-sm text-text">${esc(m.tls ?? "—")}</div>${m.kex ? `<div class="truncate font-mono text-[11px] text-faint">${esc(m.kex)}</div>` : ""}
  </div>
</div>

<div class="border-b border-border">
  <div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">automaton</span><span aria-hidden="true" class="text-faint">${q(0)} → ${q(n - 1)}</span></div>
  <div data-svg class="px-1 pt-1"></div>
  <p data-inspect aria-hidden="true" class="min-h-10 px-4 pb-3 font-mono text-xs leading-5"></p>
  <ol class="sr-only">
    ${states.map((s) => `<li>${esc(s.label)}: ${esc(durText(s, run))}. ${esc(s.log)}</li>`).join("")}
    <li>Total: ${esc(totalLabel)}.${example ? " This is an example run; your real request appears on the live site." : ""}</li>
  </ol>
</div>

<div class="border-b border-border">
  <div aria-hidden="true" class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">trace</span><span class="text-faint">${n + 1} spans</span></div>
  <div class="relative px-4 pb-3 pt-2 [--lab:5.5rem] [--pad:3.25rem] sm:[--lab:11rem]">
    <div aria-hidden="true" class="pointer-events-none absolute top-2" style="bottom:1.625rem;left:calc(1rem + var(--lab));right:calc(1rem + var(--pad))">
      ${tks.map((v) => `<div class="absolute inset-y-0 border-l border-dashed border-border" style="left:${pct(v)}%"></div>`).join("")}
      <div data-playhead class="absolute inset-y-0 w-px bg-text/60" style="left:0"></div>
    </div>
    <div aria-hidden="true" class="grid grid-cols-[var(--lab)_1fr]">
      <div></div>
      <div class="relative mr-[var(--pad)] h-6 font-mono text-[10px] text-faint">
        ${tks.map((v, i) => `<span class="absolute top-1 ${i === 0 ? "" : "-translate-x-1/2"} ${tickCls(i)} whitespace-nowrap" style="left:${pct(v)}%">${v}${i === 0 ? " ms" : ""}</span>`).join("")}
      </div>
    </div>
    <div data-wf-row="root" aria-hidden="true" class="grid grid-cols-[var(--lab)_1fr]">
      <div class="flex items-center truncate pr-2 font-mono text-[12px] text-text">GET /</div>
      <div class="relative mr-[var(--pad)] h-7">
        <div data-bar class="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] border-l-2 border-muted bg-text/10" style="left:0;width:0"></div>
        <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 font-mono text-[11px] text-muted" style="left:0"></span>
      </div>
    </div>
    ${states
      .map(
        (s, i) => `
    <div data-wf-row="${i}" data-eobs-i="${i}" aria-hidden="true" class="eobs-x grid cursor-default grid-cols-[var(--lab)_1fr] rounded-sm">
      <div class="flex items-center gap-2 truncate pl-2 pr-2 text-[13px] sm:pl-4"><span class="hidden w-12 font-mono text-[11px] text-faint sm:inline">${service(s)}</span><span data-lab class="text-muted">${esc(s.label)}</span></div>
      <div class="relative mr-[var(--pad)] h-7">
        ${
          s.durationMs !== undefined && !s.skipped
            ? `<div data-bar class="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] border-l-2" style="left:${pct(P.start[i])}%;width:0;border-color:${hue(s)};background:${mix(hue(s), 40, "transparent")}"></div>`
            : `<div data-bar class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${s.skipped ? "border-dashed" : ""}" style="left:${pct(P.start[i])}%;border-color:${s.skipped ? "var(--faint)" : hue(s)};background:${s.skipped ? "transparent" : mix(hue(s), 50, "transparent")}"></div>`
        }
        <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] text-muted"></span>
      </div>
    </div>`,
      )
      .join("")}
    <div class="grid grid-cols-[var(--lab)_1fr]">
      <div aria-hidden="true" class="flex items-center pl-2 font-mono text-[10px] text-faint sm:pl-4">scrub<span class="hidden sm:inline">&nbsp;the run</span></div>
      <div data-rail class="relative mr-[var(--pad)] h-7 touch-none select-none" style="cursor:ew-resize">
        <div aria-hidden="true" class="absolute top-1/2 bg-border" style="left:0;right:0;height:1px"></div>
        <div data-knob role="slider" tabindex="0" aria-label="Scrub the request timeline" aria-valuemin="0" aria-valuemax="${Math.round(D)}"
          class="absolute top-1/2 whitespace-nowrap rounded-sm border bg-surface font-mono text-[10px] tabular-nums text-text focus-visible:outline-2 focus-visible:outline-lavender" style="left:0;transform:translate(0,-50%);padding:1px 6px;border-color:var(--faint);cursor:grab">0 ms</div>
      </div>
    </div>
  </div>
</div>

<div aria-hidden="true">
  <div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">logs</span><span class="text-faint">tail -f</span></div>
  <div class="px-2 pb-4 pt-2 font-mono text-[12px] leading-5 sm:px-3">
    ${states
      .map(
        (s, i) => `
    <div data-log="${i}" data-eobs-i="${i}" class="eobs-x grid grid-cols-[3.5rem_1fr] gap-3 rounded-sm px-2 py-0.5">
      <span class="text-right tabular-nums text-faint">+${P.start[i]}ms</span>
      <span data-msg class="grid border-l-2 pl-3 break-words" style="border-color:var(--border)">
        <span data-ghost class="invisible [grid-area:1/1]">${esc(s.log)}</span>
        <span data-typed class="[grid-area:1/1]"></span>
      </span>
    </div>`,
      )
      .join("")}
  </div>
</div>`;
  host.append(el);

  const $ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = el) => from.querySelector<T>(sel)!;
  const svgWrap = $("[data-svg]");
  const inspect = $("[data-inspect]");
  const totalEl = $("[data-total]");
  const playhead = $("[data-playhead]");
  const rail = $("[data-rail]");
  const knob = $("[data-knob]");
  const rootRow = $('[data-wf-row="root"]');
  const rootBar = $("[data-bar]", rootRow);
  const rootDur = $("[data-dur]", rootRow);
  const wf = states.map((_, i) => {
    const row = $(`[data-wf-row="${i}"]`);
    return { row, bar: $("[data-bar]", row), dur: $("[data-dur]", row), lab: $("[data-lab]", row) };
  });
  const logs = states.map((_, i) => {
    const row = $(`[data-log="${i}"]`);
    return { row, typed: $("[data-typed]", row), ghost: $("[data-ghost]", row), msg: $("[data-msg]", row) };
  });
  const typedCache = states.map(() => -1);

  // ---- clock state: driven from outside via step(), or set directly by scrubbing ----
  let curT = reducedMotion ? P.endT : 0;
  let playing = false;
  let scrubbed = false; // a scrubbed (paused) frame shows every reached log line in full

  // ---- hover / focus / tap: one active index shared by all three views ----
  let hover: number | null = null, focused: number | null = null, pinned: number | null = null;
  const active = () => hover ?? focused ?? pinned;
  const repaint = () => render(curT);
  const bind = (target: Element, i: number) => {
    on(target, "pointerenter", (e) => { if (e.pointerType === "mouse") { hover = i; repaint(); } });
    on(target, "pointerleave", (e) => { if (e.pointerType === "mouse") { hover = null; repaint(); } });
    on(target, "click", () => { pinned = pinned === i ? null : i; repaint(); });
  };
  wf.forEach((w, i) => bind(w.row, i));
  logs.forEach((l, i) => bind(l.row, i));
  on(document, "click", (e) => {
    if (pinned !== null && !(e.target as Element | null)?.closest?.("[data-eobs-i]")) { pinned = null; repaint(); }
  });

  // ---- scrubbing ----
  const scrubTo = (r: number) => {
    playing = false;
    scrubbed = true;
    curT = tAtReq(P, Math.max(0, Math.min(D, r)));
    typedCache.fill(-1);
    render(curT);
    onChange();
  };
  const fromX = (clientX: number) => {
    const b = rail.getBoundingClientRect();
    return clamp((clientX - b.left) / (b.width || 1)) * D;
  };
  on(rail, "pointerdown", (e) => {
    if (D <= 0) return;
    rail.setPointerCapture(e.pointerId);
    knob.focus({ preventScroll: true });
    scrubTo(fromX(e.clientX));
  });
  on(rail, "pointermove", (e) => { if (rail.hasPointerCapture(e.pointerId)) scrubTo(fromX(e.clientX)); });
  on(knob, "keydown", (e) => {
    const now = reqAt(P, curT), big = Math.max(1, Math.round(D / 10));
    const to =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? now + (e.shiftKey ? big : 1)
      : e.key === "ArrowLeft" || e.key === "ArrowDown" ? now - (e.shiftKey ? big : 1)
      : e.key === "PageUp" ? now + big : e.key === "PageDown" ? now - big
      : e.key === "Home" ? 0 : e.key === "End" ? D : null;
    if (to === null || D <= 0) return;
    e.preventDefault();
    scrubTo(Math.round(to));
  });

  // ---- automaton SVG, rebuilt on resize (a 3-column snake on phones) ----
  interface SvgRefs {
    nodes: SVGGElement[]; circles: SVGCircleElement[]; rings: (SVGCircleElement | null)[];
    labels: SVGTextElement[]; arcs: SVGPathElement[]; arcLen: number[];
    edges: { path: SVGPathElement; trail: SVGPathElement; len: number }[];
    start: SVGPathElement; startLen: number; token: SVGCircleElement; group: SVGGElement;
  }
  let refs: SvgRefs | null = null;
  let builtW = -1;

  function buildSvg() {
    const w = Math.max(280, svgWrap.clientWidth - 8);
    if (w === builtW) return;
    builtW = w;
    const wide = w >= 600;
    const cols = wide ? n : Math.min(n, 3);
    const rows = Math.ceil(n / cols);
    const r = wide ? 22 : 19, R = r + 4, rowH = 108, bulge = 34;
    const padL = wide ? 44 : 36, padR = wide ? 20 : 36;
    const span = cols > 1 ? Math.min(220, (w - padL - padR - 2 * R) / (cols - 1)) : 0;
    const off = (w - padL - padR - 2 * R - span * (cols - 1)) / 2;
    const y0 = R + 14;
    const h = y0 + (rows - 1) * rowH + r + 44;
    const pos = states.map((_, i) => {
      const row = Math.floor(i / cols), k = i % cols;
      const col = row % 2 === 0 ? k : cols - 1 - k;
      return { x: padL + off + R + col * span, y: y0 + row * rowH, row, col };
    });

    const hadFocus = focused;
    svgWrap.replaceChildren();
    const root = svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: "block overflow-visible", role: "group", "aria-label": summary }, svgWrap);
    const defs = svg("defs", {}, root);
    for (const [id, color] of [["eobs-arrow", "var(--border)"], ["eobs-arrow-done", "var(--muted)"]]) {
      const mk = svg("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      svg("path", { d: "M0,1 L9,5 L0,9 z" }, mk).style.fill = color;
    }
    const line = (d: string, stroke: string, parent: Element) => {
      const p = svg("path", { d }, parent);
      Object.assign(p.style, { fill: "none", stroke, strokeWidth: "1.25" });
      return p;
    };

    // Entry/exit side per node (-1 left, +1 right); the token arcs over the top between them.
    const side = (i: number, j: number) => (pos[i].row === pos[j].row ? Math.sign(pos[j].x - pos[i].x) : pos[i].col === 0 ? -1 : 1);
    const entry = states.map((_, i) => (i === 0 ? -1 : pos[i - 1].row === pos[i].row ? -side(i - 1, i) : side(i - 1, i)));
    const exit = states.map((_, i) => (i < n - 1 ? side(i, i + 1) : -entry[i]));

    const group = svg("g", {}, root);
    const start = line(`M${pos[0].x - R - 34},${pos[0].y} L${pos[0].x - R},${pos[0].y}`, "var(--muted)", group);
    start.setAttribute("marker-end", "url(#eobs-arrow-done)");
    const edges = states.slice(0, -1).map((_, i) => {
      const a = pos[i], b = pos[i + 1], s = side(i, i + 1);
      const sx = a.x + exit[i] * R, ex = b.x + entry[i + 1] * R;
      const d = a.row === b.row
        ? `M${sx},${a.y} L${ex},${b.y}`
        : `M${sx},${a.y} C${sx + s * bulge},${a.y} ${ex + s * bulge},${b.y} ${ex},${b.y}`;
      const path = line(d, "var(--border)", group);
      path.setAttribute("marker-end", "url(#eobs-arrow)");
      const trail = line(d, "var(--muted)", group);
      const len = trail.getTotalLength();
      trail.style.strokeDasharray = `${len}`;
      return { path, trail, len };
    });

    const nodes: SVGGElement[] = [], circles: SVGCircleElement[] = [], rings: (SVGCircleElement | null)[] = [];
    const labels: SVGTextElement[] = [], arcs: SVGPathElement[] = [], arcLen: number[] = [];
    states.forEach((s, i) => {
      const { x, y } = pos[i];
      const g = svg("g", { class: "eobs-node eobs-x", tabindex: 0, role: "img", "data-eobs-i": i, "aria-label": `${s.label}, ${durText(s, run)}. ${s.log}` }, root);
      Object.assign(svg("circle", { class: "eobs-focus", cx: x, cy: y, r: R + 6 }, g).style, { fill: "none", stroke: "var(--lavender)", strokeWidth: "1.5", strokeDasharray: "2 3" });
      svg("circle", { cx: x, cy: y + 18, r: R + 14 }, g).style.fill = "transparent"; // larger hit target
      const sweep = entry[i] < exit[i] ? 1 : 0;
      const arc = svg("path", { d: `M${x + entry[i] * R},${y} A${R},${R} 0 0 ${sweep} ${x + exit[i] * R},${y}` }, g);
      Object.assign(arc.style, { fill: "none", stroke: s.skipped ? "var(--faint)" : hue(s), strokeWidth: "2", strokeLinecap: "round" });
      const al = arc.getTotalLength();
      arc.style.strokeDasharray = `${al}`;
      const c = svg("circle", { cx: x, cy: y, r }, g);
      c.style.strokeWidth = "1.5";
      circles.push(c);
      if (i === n - 1) {
        const ring = svg("circle", { cx: x, cy: y, r: r - 4 }, g);
        Object.assign(ring.style, { fill: "none", strokeWidth: "1.25" });
        rings.push(ring);
      } else rings.push(null);
      const qt = svg("text", { x, y, dy: "0.35em", "text-anchor": "middle", class: "font-mono" }, g);
      Object.assign(qt.style, { fontSize: "11px", fill: "var(--muted)" });
      qt.textContent = q(i);
      const lt = svg("text", { x, y: y + r + 21, "text-anchor": "middle", class: "font-sans" }, g);
      lt.style.fontSize = "12.5px";
      lt.textContent = s.label;
      labels.push(lt);
      const dt = svg("text", { x, y: y + r + 36, "text-anchor": "middle", class: "font-mono" }, g);
      Object.assign(dt.style, { fontSize: "11px", fill: "var(--faint)" });
      dt.textContent = durText(s, run);
      bind(g, i);
      on(g, "focus", () => { focused = i; repaint(); });
      on(g, "blur", () => { if (focused === i) { focused = null; repaint(); } });
      nodes.push(g); arcs.push(arc); arcLen.push(al);
    });

    const token = svg("circle", { r: 4.5 }, root);
    Object.assign(token.style, { fill: "var(--text)", pointerEvents: "none" });
    refs = { nodes, circles, rings, labels, arcs, arcLen, edges, start, startLen: start.getTotalLength(), token, group };
    if (hadFocus !== null) nodes[hadFocus].focus();
  }

  function paintSvg(t: number) {
    if (!refs) return;
    const R = refs;
    const cur = cursor(P, t);
    const act = active();
    states.forEach((s, i) => {
      const entered = t >= P.enter[i];
      const current = i === cur && (t < P.leave[i] || i === n - 1);
      const c = hue(s);
      const stroke = !entered ? "var(--border)" : s.skipped ? "var(--faint)" : current ? c : mix(c, 65, "var(--border)");
      for (const ring of [R.circles[i], R.rings[i]]) {
        if (!ring) continue;
        ring.style.stroke = stroke;
        ring.style.strokeDasharray = s.skipped ? "3 3" : "";
      }
      R.circles[i].style.fill = !entered || s.skipped ? "var(--surface)" : mix(c, current ? 22 : 9);
      R.labels[i].style.fill = !entered || s.skipped ? "var(--muted)" : "var(--text)";
      R.labels[i].style.fontWeight = current ? "600" : "400";
      const ap = clamp((t - P.enter[i]) / (P.leave[i] - P.enter[i]));
      R.arcs[i].style.strokeDashoffset = `${R.arcLen[i] * (1 - ap)}`;
      R.arcs[i].style.opacity = current ? "1" : "0.45";
      R.nodes[i].style.opacity = act !== null && act !== i ? "0.3" : "1";
    });
    R.edges.forEach((e, i) => {
      const ep = clamp((t - P.leave[i]) / MOVE);
      e.trail.style.strokeDashoffset = `${e.len * (1 - ep)}`;
      e.path.setAttribute("marker-end", ep >= 1 ? "url(#eobs-arrow-done)" : "url(#eobs-arrow)");
    });
    R.group.style.opacity = act !== null ? "0.45" : "1";

    // Token: start arrow → arc over each state → edge → … → rests on the accepting state.
    let path: SVGPathElement, len: number, p: number;
    if (cur < 0) { path = R.start; len = R.startLen; p = ease(clamp(t / LEAD)); }
    else if (t < P.leave[cur] || cur === n - 1) { path = R.arcs[cur]; len = R.arcLen[cur]; p = clamp((t - P.enter[cur]) / (P.leave[cur] - P.enter[cur])); }
    else { const e = R.edges[cur]; path = e.trail; len = e.len; p = ease(clamp((t - P.leave[cur]) / MOVE)); }
    const pt = path.getPointAtLength(len * p);
    R.token.setAttribute("cx", `${pt.x}`);
    R.token.setAttribute("cy", `${pt.y}`);
  }

  let lastKnob = -1;
  function render(t: number) {
    const req = reqAt(P, t);
    const done = t >= P.endT;
    const cur = cursor(P, t);
    const act = active();

    // Stat: ticking total, colored by a Grafana-style threshold.
    totalEl.textContent = D > 0 ? `${done && P.total !== undefined ? P.total : Math.round(req)}` : "—";
    totalEl.style.color = D === 0 ? "var(--text)" : req < 300 ? "var(--green)" : req < 1000 ? "var(--peach)" : "var(--red)";

    paintSvg(t);

    // Waterfall and its scrubber.
    playhead.style.left = `${pct(req)}%`;
    knob.style.left = `${pct(req)}%`;
    knob.style.transform = `translate(-${pct(req)}%, -50%)`; // stays inside the rail at both ends
    const rounded = Math.round(req);
    if (rounded !== lastKnob) {
      lastKnob = rounded;
      knob.textContent = `${rounded} ms`;
      knob.setAttribute("aria-valuenow", `${rounded}`);
      knob.setAttribute("aria-valuetext", `${rounded} ms${cur >= 0 ? `, ${states[cur].label}` : ""}`);
    }
    rootBar.style.width = `${pct(req)}%`;
    rootDur.style.left = `${pct(req)}%`;
    rootDur.textContent = t > 0 ? `${rounded} ms` : "";
    states.forEach((s, i) => {
      const { row, bar, dur, lab } = wf[i];
      const entered = t >= P.enter[i];
      const isBar = s.durationMs !== undefined && !s.skipped;
      bar.style.opacity = entered ? "1" : "0";
      let label = "";
      if (isBar) {
        const elapsed = Math.max(0, Math.min(req, P.end[i]) - P.start[i]);
        bar.style.width = `${pct(entered ? elapsed : 0)}%`;
        label = entered ? `${Math.round(elapsed)} ms` : "";
      } else if (entered) label = durText(s, run) === "no data" ? "" : durText(s, run);
      dur.textContent = label;
      // Duration label sits after the span, or before it when the span ends near the axis edge.
      const finalEnd = pct(isBar ? P.end[i] : P.start[i]);
      const nowEnd = pct(isBar ? Math.max(P.start[i], Math.min(req, P.end[i])) : P.start[i]);
      if (finalEnd > 78) { dur.style.left = ""; dur.style.right = `calc(${100 - pct(P.start[i])}% + 8px)`; }
      else { dur.style.right = ""; dur.style.left = `calc(${nowEnd}% + ${isBar ? 6 : 10}px)`; }
      lab.className = entered ? "text-text" : "text-muted";
      row.style.opacity = act !== null && act !== i ? "0.3" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
    });

    // Log tail: each line types out from the moment the token enters its state.
    states.forEach((s, i) => {
      const { row, typed, ghost, msg } = logs[i];
      const entered = t >= P.enter[i];
      const k = !entered ? 0 : scrubbed ? s.log.length : Math.min(s.log.length, Math.floor((t - P.enter[i]) / CHAR_MS));
      const showCursor = !reducedMotion && entered && i === cur;
      const key = k * 2 + (showCursor ? 1 : 0);
      if (typedCache[i] !== key) {
        typedCache[i] = key;
        typed.textContent = s.log.slice(0, k);
        if (showCursor) typed.insertAdjacentHTML("beforeend", `<span class="eobs-cursor text-muted">▍</span>`);
      }
      typed.style.color = s.skipped ? "var(--muted)" : "var(--text)";
      // Hovering a state the token hasn't reached yet previews its line, ghosted.
      const preview = act === i && k < s.log.length;
      ghost.className = `[grid-area:1/1] ${preview ? "text-faint" : "invisible"}`;
      typed.style.visibility = preview ? "hidden" : "";
      msg.style.borderColor = entered ? (s.skipped ? "var(--faint)" : hue(s)) : "var(--border)";
      row.style.opacity = act !== null && act !== i ? "0.3" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
    });

    // Inspector under the automaton: the reveal for whichever state is active.
    if (act !== null) {
      const s = states[act];
      inspect.innerHTML = `<span class="text-faint">${q(act)}</span> <span class="text-text">${esc(s.label)}</span> <span class="text-faint">·</span> <span class="text-muted">${esc(durText(s, run))}</span><br><span style="color:${s.skipped ? "var(--muted)" : hue(s)}">›</span> <span class="text-text">${esc(s.log)}</span>`;
    } else {
      inspect.innerHTML = `<span class="text-faint">hover, tap or tab through the states to inspect them</span><br>&nbsp;`; // same two lines as a reveal, so nothing shifts
    }
  }

  const replay = el.querySelector("[data-replay]");
  if (replay) on(replay, "click", () => api.play());

  const ro = new ResizeObserver(() => { buildSvg(); render(curT); });
  ro.observe(svgWrap);
  buildSvg();
  render(curT);

  const api: ConsoleHandle = {
    el,
    play() {
      playing = true;
      scrubbed = false;
      curT = 0;
      typedCache.fill(-1);
      render(0);
    },
    step(dt) {
      if (!playing) return;
      curT = Math.min(curT + dt, P.endT);
      if (curT >= P.endT) playing = false;
      render(curT);
    },
    probe() {
      const panel = el.getBoundingClientRect();
      const tb = refs?.token.getBoundingClientRect();
      const ph = playhead.getBoundingClientRect();
      const cur = Math.max(0, cursor(P, curT));
      return {
        panel,
        token: tb && tb.width ? { x: tb.left + tb.width / 2, y: tb.top + tb.height / 2 } : null,
        playheadX: ph.left,
        playing,
        tone: states[cur] ? TONE[states[cur].id] : "lavender",
      };
    },
    dispose() {
      ro.disconnect();
      ac.abort();
      el.remove();
    },
  };
  return api;
}
