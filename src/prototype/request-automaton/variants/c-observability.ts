// PROTOTYPE: throwaway. Variant C: the Request Automaton as an observability console.
// One clock drives three synced views: the automaton, a trace waterfall and a typing log tail.
import { select } from "d3-selection";
import { timer, type Timer } from "d3-timer";
import { easeCubicInOut } from "d3-ease";
import { scaleLinear } from "d3-scale";
import type { Run, RunState, StateId } from "../model";
import type { Variant } from "../types";

// Animation clock (ms of animation, not of request).
const LEAD = 500; // token rides the start arrow
const MOVE = 300; // token rides an edge
const BASE = 380; // minimum dwell in a state
const SPREAD = 2600; // extra dwell, shared by duration
const SETTLE = 400; // counter catches up to totalMs when phases don't cover it
const CHAR_MS = 12; // log typing speed

const HUE: Record<StateId, string> = {
  lookup: "sky", connect: "lavender", secure: "mauve", edge: "peach", firstByte: "peach", delivered: "green", cached: "green",
};
const SERVICE: Record<StateId, string> = {
  lookup: "dns", connect: "tcp", secure: "tls", edge: "edge", firstByte: "edge", delivered: "browser", cached: "browser",
};

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const q = (i: number) => "q" + [...String(i)].map((d) => SUB[+d]).join("");
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const hue = (s: RunState) => `var(--${HUE[s.id]})`;
const mix = (c: string, pct: number, base = "var(--surface)") => `color-mix(in srgb, ${c} ${pct}%, ${base})`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

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

/** Index of the state the token is in (or just left), -1 before the run starts. */
function cursor(p: Plan, t: number): number {
  for (let i = p.enter.length - 1; i >= 0; i--) if (t >= p.enter[i]) return i;
  return -1;
}

function durText(s: RunState, run: Run): string {
  if (s.skipped) return "skipped";
  if (s.durationMs !== undefined) return `${s.durationMs} ms`;
  if (s.id === "edge" && run.meta.colo) return run.meta.colo;
  return "no data";
}

/** Faint character grid: a dot on every other cell, a sparse plus every 16 columns × 6 rows. */
function gridText(w: number, h: number): string {
  const cols = Math.ceil(w / 7.2) + 1, rows = Math.ceil(h / 18) + 1;
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) out += c % 16 === 8 && r % 6 === 3 ? "+" : c % 2 === 0 && r % 2 === 1 ? "·" : " ";
    out += "\n";
  }
  return out;
}

const STYLE = `
@keyframes cobs-blink { 50% { opacity: 0 } }
.cobs-cursor { animation: cobs-blink 1.05s steps(1) infinite; }
.cobs-x { transition: opacity .15s ease, background-color .15s ease; }
.cobs-node { cursor: pointer; outline: none; }
.cobs-node .cobs-focus { opacity: 0; }
.cobs-node:focus-visible .cobs-focus { opacity: 1; }
.cobs-texture { mask-image: linear-gradient(to bottom, #000 0%, #000 35%, transparent 95%); }
@media (prefers-reduced-motion: reduce) { .cobs-cursor { animation: none; } .cobs-x { transition: none; } }
`;

const variant: Variant = {
  name: "Observability console",
  mount(root, { run, copy, reducedMotion }) {
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
    const ticks = D > 0 ? scaleLinear().domain([0, D]).ticks(6) : [0];
    const tickCls = (i: number) => (i % 2 === 0 ? "" : "hidden sm:block"); // every other label on phones
    const httpish = (m.http ?? "").includes("3") ? "quic" : "tcp";
    const service = (s: RunState) => (s.id === "connect" ? httpish : SERVICE[s.id]);
    const totalLabel = P.total !== undefined ? `${P.total} ms` : "unknown";

    const summary =
      `Request automaton, ${example ? "example run" : "your request"}: ` +
      states.map((s) => `${s.label} ${durText(s, run)}`).join(", ") +
      `. Total ${totalLabel}.`;

    root.innerHTML = `
<style>${STYLE}</style>
<div class="mx-auto w-full max-w-6xl px-4 pb-28 pt-14 sm:px-8 sm:pt-24">
  <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
    <div>
      <h1 class="font-serif text-[2.75rem] leading-[1.02] tracking-tight text-text sm:text-6xl">${esc(copy.name)}</h1>
      <p class="mt-3 text-lg text-muted">${esc(copy.headline)}</p>
    </div>
    <div class="lg:pt-2">
      <p class="text-[1.05rem] leading-relaxed text-text sm:text-lg">${esc(copy.intro)}</p>
      <ol class="mt-6 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-7">
        ${copy.pillars.map((p, i) => `<li class="flex items-baseline gap-2.5 text-[15px] text-muted"><span class="font-mono text-xs text-faint">0${i + 1}</span>${esc(p)}</li>`).join("")}
      </ol>
    </div>
  </header>

  <section class="mt-14 sm:mt-20" aria-labelledby="cobs-title">
    <div data-panel class="relative overflow-hidden rounded-md border border-border bg-surface">
      <pre data-texture aria-hidden="true" class="cobs-texture pointer-events-none absolute inset-0 m-0 select-none overflow-hidden font-mono text-[12px] leading-[18px] text-faint opacity-30"></pre>
      <div class="relative">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
          <h2 id="cobs-title" class="flex items-baseline gap-2.5 text-sm">
            <span class="font-mono text-text">GET /</span>
            <span class="text-muted">${example ? "a page load, traced" : "your page load, traced"}</span>
          </h2>
          <div class="flex items-center gap-3 font-mono text-[11px]">
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

        <div aria-hidden="true" class="border-b border-border">
          <div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">trace</span><span class="text-faint">${n + 1} spans</span></div>
          <div data-wf class="relative px-4 pb-4 pt-2 [--lab:5.5rem] [--pad:3.25rem] sm:[--lab:11rem]">
            <div class="pointer-events-none absolute bottom-4 top-2" style="left:calc(1rem + var(--lab));right:calc(1rem + var(--pad))">
              ${ticks.map((v) => `<div class="absolute inset-y-0 border-l border-dashed border-border" style="left:${pct(v)}%"></div>`).join("")}
              <div data-playhead class="cobs-x absolute inset-y-0 w-px bg-text/60" style="left:0"></div>
            </div>
            <div class="grid grid-cols-[var(--lab)_1fr]">
              <div></div>
              <div class="relative mr-[var(--pad)] h-6 font-mono text-[10px] text-faint">
                ${ticks.map((v, i) => `<span class="absolute top-1 ${i === 0 ? "" : "-translate-x-1/2"} ${tickCls(i)} whitespace-nowrap" style="left:${pct(v)}%">${v}${i === 0 ? " ms" : ""}</span>`).join("")}
              </div>
            </div>
            <div data-wf-row="root" class="grid grid-cols-[var(--lab)_1fr]">
              <div class="flex items-center truncate pr-2 font-mono text-[12px] text-text">GET /</div>
              <div class="relative mr-[var(--pad)] h-7">
                <div data-bar class="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] border-l-2 border-muted bg-text/10" style="left:0;width:0"></div>
                <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 font-mono text-[11px] text-muted" style="left:0"></span>
              </div>
            </div>
            ${states
              .map(
                (s, i) => `
            <div data-wf-row="${i}" data-cobs-i="${i}" class="cobs-x grid cursor-default grid-cols-[var(--lab)_1fr] rounded-sm">
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
          </div>
        </div>

        <div aria-hidden="true">
          <div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">logs</span><span class="text-faint">tail -f</span></div>
          <div class="px-2 pb-4 pt-2 font-mono text-[12px] leading-5 sm:px-3">
            ${states
              .map(
                (s, i) => `
            <div data-log="${i}" data-cobs-i="${i}" class="cobs-x grid grid-cols-[3.5rem_1fr] gap-3 rounded-sm px-2 py-0.5">
              <span class="text-right tabular-nums text-faint">+${P.start[i]}ms</span>
              <span data-msg class="grid border-l-2 pl-3 break-words" style="border-color:var(--border)">
                <span data-ghost class="invisible [grid-area:1/1]">${esc(s.log)}</span>
                <span data-typed class="[grid-area:1/1]"></span>
              </span>
            </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`;

    const $ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector<T>(sel)!;
    const panel = $("[data-panel]");
    const texture = $("[data-texture]");
    const svgWrap = $("[data-svg]");
    const inspect = $("[data-inspect]");
    const totalEl = $("[data-total]");
    const playhead = $("[data-playhead]");
    const rootRow = $('[data-wf-row="root"]');
    const rootBar = $("[data-bar]", rootRow);
    const rootDur = $("[data-dur]", rootRow);
    const wfRows = states.map((_, i) => $(`[data-wf-row="${i}"]`));
    const logRows = states.map((_, i) => $(`[data-log="${i}"]`));
    const typedCache = states.map(() => -1);

    // ---- hover / focus / tap: one active index shared by all three views ----
    let hover: number | null = null, focused: number | null = null, pinned: number | null = null;
    const active = () => hover ?? focused ?? pinned;
    let curT = reducedMotion ? P.endT : 0;
    const repaint = () => render(curT);
    const bind = (el: Element, i: number) => {
      on(el, "pointerenter", (e) => { if (e.pointerType === "mouse") { hover = i; repaint(); } });
      on(el, "pointerleave", (e) => { if (e.pointerType === "mouse") { hover = null; repaint(); } });
      on(el, "click", () => { pinned = pinned === i ? null : i; repaint(); });
    };
    wfRows.forEach(bind);
    logRows.forEach(bind);
    on(document, "click", (e) => {
      if (pinned !== null && !(e.target as Element | null)?.closest?.("[data-cobs-i]")) { pinned = null; repaint(); }
    });

    // ---- automaton SVG, rebuilt on resize (layout flips to a 3-column snake on phones) ----
    interface SvgRefs {
      nodes: SVGGElement[]; circles: SVGCircleElement[]; rings: (SVGCircleElement | null)[];
      labels: SVGTextElement[]; arcs: SVGPathElement[]; arcLen: number[];
      edges: { path: SVGPathElement; trail: SVGPathElement; len: number }[];
      start: SVGPathElement; startLen: number; token: SVGCircleElement;
    }
    let refs: SvgRefs | null = null;

    function buildSvg() {
      const w = Math.max(280, svgWrap.clientWidth - 8);
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
      const svg = select(svgWrap).append("svg")
        .attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`)
        .attr("class", "block overflow-visible").attr("role", "group").attr("aria-label", summary);
      const defs = svg.append("defs");
      for (const [id, color] of [["cobs-arrow", "var(--border)"], ["cobs-arrow-done", "var(--muted)"]]) {
        defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
          .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
          .append("path").attr("d", "M0,1 L9,5 L0,9 z").style("fill", color);
      }

      // Entry/exit side per node (-1 left, +1 right); the token arcs over the top between them.
      const side = (i: number, j: number) => (pos[i].row === pos[j].row ? Math.sign(pos[j].x - pos[i].x) : pos[i].col === 0 ? -1 : 1);
      const entry = states.map((_, i) => (i === 0 ? -1 : pos[i - 1].row === pos[i].row ? -side(i - 1, i) : side(i - 1, i)));
      const exit = states.map((_, i) => (i < n - 1 ? side(i, i + 1) : -entry[i]));

      const gEdges = svg.append("g");
      const start = gEdges.append("path")
        .attr("d", `M${pos[0].x - R - 34},${pos[0].y} L${pos[0].x - R},${pos[0].y}`)
        .attr("marker-end", "url(#cobs-arrow-done)").style("fill", "none").style("stroke", "var(--muted)").style("stroke-width", 1.25);
      const edges = states.slice(0, -1).map((_, i) => {
        const a = pos[i], b = pos[i + 1], s = side(i, i + 1);
        const sx = a.x + exit[i] * R, ex = b.x + entry[i + 1] * R;
        const d = a.row === b.row
          ? `M${sx},${a.y} L${ex},${b.y}`
          : `M${sx},${a.y} C${sx + s * bulge},${a.y} ${ex + s * bulge},${b.y} ${ex},${b.y}`;
        const path = gEdges.append("path").attr("d", d).attr("marker-end", "url(#cobs-arrow)")
          .style("fill", "none").style("stroke", "var(--border)").style("stroke-width", 1.25);
        const trail = gEdges.append("path").attr("d", d)
          .style("fill", "none").style("stroke", "var(--muted)").style("stroke-width", 1.25);
        const len = trail.node()!.getTotalLength();
        trail.style("stroke-dasharray", `${len}`);
        return { path: path.node()!, trail: trail.node()!, len };
      });

      const nodes: SVGGElement[] = [], circles: SVGCircleElement[] = [], rings: (SVGCircleElement | null)[] = [];
      const labels: SVGTextElement[] = [], arcs: SVGPathElement[] = [], arcLen: number[] = [];
      states.forEach((s, i) => {
        const { x, y } = pos[i];
        const g = svg.append("g").attr("class", "cobs-node cobs-x").attr("tabindex", 0).attr("role", "img")
          .attr("data-cobs-i", i)
          .attr("aria-label", `${s.label}, ${durText(s, run)}. ${s.log}`);
        g.append("circle").attr("class", "cobs-focus").attr("cx", x).attr("cy", y).attr("r", R + 6)
          .style("fill", "none").style("stroke", "var(--lavender)").style("stroke-width", 1.5).style("stroke-dasharray", "2 3");
        g.append("circle").attr("cx", x).attr("cy", y + 18).attr("r", R + 14).style("fill", "transparent"); // larger hit target
        const sweep = entry[i] < exit[i] ? 1 : 0;
        const arc = g.append("path")
          .attr("d", `M${x + entry[i] * R},${y} A${R},${R} 0 0 ${sweep} ${x + exit[i] * R},${y}`)
          .style("fill", "none").style("stroke", s.skipped ? "var(--faint)" : hue(s)).style("stroke-width", 2).style("stroke-linecap", "round");
        const al = arc.node()!.getTotalLength();
        arc.style("stroke-dasharray", `${al}`);
        circles.push(g.append("circle").attr("cx", x).attr("cy", y).attr("r", r).style("stroke-width", 1.5).node()!);
        rings.push(i === n - 1 ? g.append("circle").attr("cx", x).attr("cy", y).attr("r", r - 4).style("fill", "none").style("stroke-width", 1.25).node()! : null);
        g.append("text").attr("x", x).attr("y", y).attr("dy", "0.35em").attr("text-anchor", "middle")
          .attr("class", "font-mono").style("font-size", "11px").style("fill", "var(--muted)").text(q(i));
        labels.push(g.append("text").attr("x", x).attr("y", y + r + 21).attr("text-anchor", "middle")
          .attr("class", "font-sans").style("font-size", "12.5px").text(s.label).node()!);
        g.append("text").attr("x", x).attr("y", y + r + 36).attr("text-anchor", "middle")
          .attr("class", "font-mono").style("font-size", "11px").style("fill", "var(--faint)").text(durText(s, run));
        const el = g.node()!;
        bind(el, i);
        on(el, "focus", () => { focused = i; repaint(); });
        on(el, "blur", () => { if (focused === i) { focused = null; repaint(); } });
        nodes.push(el); arcs.push(arc.node()!); arcLen.push(al);
      });

      const token = svg.append("circle").attr("r", 4.5).style("fill", "var(--text)").style("pointer-events", "none").node()!;
      refs = { nodes, circles, rings, labels, arcs, arcLen, edges, start: start.node()!, startLen: start.node()!.getTotalLength(), token };
      if (hadFocus !== null) nodes[hadFocus].focus();
    }

    function paintSvg(t: number) {
      if (!refs) return;
      const cur = cursor(P, t);
      const act = active();
      states.forEach((s, i) => {
        const entered = t >= P.enter[i];
        const current = i === cur && (t < P.leave[i] || i === n - 1);
        const c = hue(s);
        const stroke = !entered ? "var(--border)" : s.skipped ? "var(--faint)" : current ? c : mix(c, 65, "var(--border)");
        const fill = !entered || s.skipped ? "var(--surface)" : mix(c, current ? 22 : 9);
        for (const el of [refs!.circles[i], refs!.rings[i]]) {
          if (!el) continue;
          el.style.stroke = stroke;
          el.style.strokeDasharray = s.skipped ? "3 3" : "";
        }
        refs!.circles[i].style.fill = fill;
        refs!.labels[i].style.fill = !entered || s.skipped ? "var(--muted)" : "var(--text)";
        refs!.labels[i].style.fontWeight = current ? "600" : "400";
        const ap = clamp((t - P.enter[i]) / (P.leave[i] - P.enter[i]));
        refs!.arcs[i].style.strokeDashoffset = `${refs!.arcLen[i] * (1 - ap)}`;
        refs!.arcs[i].style.opacity = current ? "1" : "0.45";
        refs!.nodes[i].style.opacity = act !== null && act !== i ? "0.3" : "1";
      });
      refs.edges.forEach((e, i) => {
        const ep = clamp((t - P.leave[i]) / MOVE);
        e.trail.style.strokeDashoffset = `${e.len * (1 - ep)}`;
        e.path.setAttribute("marker-end", ep >= 1 ? "url(#cobs-arrow-done)" : "url(#cobs-arrow)");
        e.path.parentElement!.style.opacity = act !== null ? "0.45" : "1";
      });

      // Token: start arrow → arc over each state → edge → … → rests on the accepting state.
      let path: SVGPathElement, len: number, p: number;
      if (cur < 0) { path = refs.start; len = refs.startLen; p = easeCubicInOut(clamp(t / LEAD)); }
      else if (t < P.leave[cur] || cur === n - 1) { path = refs.arcs[cur]; len = refs.arcLen[cur]; p = clamp((t - P.enter[cur]) / (P.leave[cur] - P.enter[cur])); }
      else { const e = refs.edges[cur]; path = e.trail; len = e.len; p = easeCubicInOut(clamp((t - P.leave[cur]) / MOVE)); }
      const pt = path.getPointAtLength(len * p);
      refs.token.setAttribute("cx", `${pt.x}`);
      refs.token.setAttribute("cy", `${pt.y}`);
    }

    function render(t: number) {
      const req = reqAt(P, t);
      const done = t >= P.endT;
      const cur = cursor(P, t);
      const act = active();

      // Stat: ticking total, colored by a Grafana-style threshold.
      totalEl.textContent = D > 0 ? `${done && P.total !== undefined ? P.total : Math.round(req)}` : "—";
      totalEl.style.color = D === 0 ? "var(--text)" : req < 300 ? "var(--green)" : req < 1000 ? "var(--peach)" : "var(--red)";

      paintSvg(t);

      // Waterfall.
      playhead.style.left = `${pct(req)}%`;
      playhead.style.opacity = done || t === 0 ? "0" : "1";
      rootBar.style.width = `${pct(req)}%`;
      rootDur.style.left = `${pct(req)}%`;
      rootDur.textContent = t > 0 ? `${Math.round(req)} ms` : "";
      states.forEach((s, i) => {
        const row = wfRows[i];
        const bar = $("[data-bar]", row), dur = $("[data-dur]", row);
        const entered = t >= P.enter[i];
        const isBar = s.durationMs !== undefined && !s.skipped;
        bar.style.opacity = entered ? "1" : "0";
        let label = "";
        if (isBar) {
          const elapsed = Math.max(0, Math.min(req, P.end[i]) - P.start[i]);
          bar.style.width = `${pct(entered ? elapsed : 0)}%`;
          label = entered ? `${Math.round(elapsed)} ms` : "";
        } else if (entered) label = s.skipped ? "skipped" : durText(s, run) === "no data" ? "" : durText(s, run);
        dur.textContent = label;
        // Duration label sits after the span, or before it when the span ends near the axis edge.
        const finalEnd = pct(isBar ? P.end[i] : P.start[i]);
        const nowEnd = pct(isBar ? Math.max(P.start[i], Math.min(req, P.end[i])) : P.start[i]);
        if (finalEnd > 78) { dur.style.left = ""; dur.style.right = `calc(${100 - pct(P.start[i])}% + 8px)`; }
        else { dur.style.right = ""; dur.style.left = `calc(${nowEnd}% + ${isBar ? 6 : 10}px)`; }
        $("[data-lab]", row).className = entered ? "text-text" : "text-muted";
        row.style.opacity = act !== null && act !== i ? "0.3" : "1";
        row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
      });

      // Log tail: each line types out from the moment the token enters its state.
      states.forEach((s, i) => {
        const row = logRows[i];
        const entered = t >= P.enter[i];
        const k = entered ? Math.min(s.log.length, Math.floor((t - P.enter[i]) / CHAR_MS)) : 0;
        const typed = $("[data-typed]", row), ghost = $("[data-ghost]", row), msg = $("[data-msg]", row);
        const showCursor = !reducedMotion && entered && i === cur;
        const key = k * 2 + (showCursor ? 1 : 0);
        if (typedCache[i] !== key) {
          typedCache[i] = key;
          typed.textContent = s.log.slice(0, k);
          if (showCursor) typed.insertAdjacentHTML("beforeend", `<span class="cobs-cursor text-muted">▍</span>`);
        }
        typed.style.color = s.skipped ? "var(--muted)" : "var(--text)";
        // Hovering a state the token hasn't reached yet previews its line, ghosted.
        const preview = act === i && k < s.log.length;
        ghost.className = `[grid-area:1/1] ${preview ? "text-faint" : "invisible"}`;
        if (preview) typed.style.visibility = "hidden"; else typed.style.visibility = "";
        msg.style.borderColor = entered ? (s.skipped ? "var(--faint)" : hue(s)) : "var(--border)";
        row.style.opacity = act !== null && act !== i ? "0.3" : "1";
        row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
      });

      // Inspector under the automaton: the reveal for whichever state is active.
      if (act !== null) {
        const s = states[act];
        inspect.innerHTML = `<span class="text-faint">${q(act)}</span> <span class="text-text">${esc(s.label)}</span> <span class="text-faint">·</span> <span class="text-muted">${esc(durText(s, run))}</span><br><span style="color:${s.skipped ? "var(--muted)" : hue(s)}">›</span> <span class="text-text">${esc(s.log)}</span>`;
      } else {
        inspect.innerHTML = `<span class="text-faint">hover, tap or tab through the states to inspect them</span>`;
      }
    }

    // ---- clock ----
    let clock: Timer | null = null;
    function play() {
      clock?.stop();
      curT = 0;
      typedCache.fill(-1);
      render(0);
      clock = timer((elapsed) => {
        curT = Math.min(elapsed, P.endT);
        render(curT);
        if (elapsed >= P.endT) { clock?.stop(); clock = null; }
      });
    }

    const ro = new ResizeObserver(() => {
      texture.textContent = gridText(panel.clientWidth, panel.clientHeight);
      buildSvg();
      render(curT);
    });
    ro.observe(panel);

    // Start when the panel scrolls into view, so phone readers don't miss the run.
    let io: IntersectionObserver | null = null;
    if (!reducedMotion) {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io?.disconnect(); io = null; play(); }
      }, { threshold: 0.35 });
      io.observe(panel);
      const replay = root.querySelector("[data-replay]");
      if (replay) on(replay, "click", () => { io?.disconnect(); io = null; play(); });
    }

    buildSvg();
    render(curT);

    return () => {
      clock?.stop();
      io?.disconnect();
      ro.disconnect();
      ac.abort();
    };
  },
};

export default variant;
