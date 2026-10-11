// PROTOTYPE: throwaway. Variant A, "Plain figure": a typographic hero, and the Request Automaton set as
// a quiet figure in a paper. States sit on one line (a column on phones), draw once in about a second, then stay still.
import { easeCubicOut } from "d3-ease";
import { timer, type Timer } from "d3-timer";
import type { Run, RunState } from "../model";
import type { Variant } from "../types";

const DRAW_MS = 1000;
const START_DELAY_MS = 250;
const R = 6; // state radius
const ACCEPT_R = 10; // outer ring of the accepting state
const GAP = 5; // air between a state and its arrows
const VERTICAL_BELOW = 560; // container width (px) under which the line turns into a column
const NS = "http://www.w3.org/2000/svg";

const CSS = `
.ra-a .ra-node { outline: none; }
.ra-a .ra-dot { fill: var(--bg); stroke: var(--text); stroke-width: 1.25; transition: fill .2s, stroke .2s; }
.ra-a .ra-ring { fill: none; stroke: var(--text); stroke-width: 1.25; transition: stroke .2s; }
.ra-a .ra-label { fill: var(--text); transition: fill .2s; }
.ra-a .ra-time { fill: var(--muted); font-variant-numeric: tabular-nums; }
.ra-a .ra-edge, .ra-a .ra-head { fill: none; stroke: var(--muted); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
.ra-a .ra-hit { fill: transparent; }
.ra-a .ra-focus { fill: none; stroke: var(--lavender); stroke-width: 1; opacity: 0; }
.ra-a .ra-node:focus-visible .ra-focus { opacity: .8; }
.ra-a .is-skipped .ra-dot { stroke: var(--faint); stroke-dasharray: 2 2.4; }
.ra-a .is-skipped .ra-label, .ra-a .is-skipped .ra-time { fill: var(--faint); }
.ra-a .is-lit .ra-dot { fill: var(--lavender); stroke: var(--lavender); }
.ra-a .is-lit.is-skipped .ra-dot { fill: var(--bg); }
.ra-a .is-lit .ra-ring { stroke: var(--lavender); }
.ra-a .is-shown .ra-label { fill: var(--lavender); }
`;

interface Pt {
  x: number;
  y: number;
}

interface Layout {
  vertical: boolean;
  width: number;
  height: number;
  pts: Pt[];
  /** Distance between neighbouring states along the line. */
  pitch: number;
}

interface Drawn {
  edges: { path: SVGPathElement; head: SVGPathElement; len: number }[];
  nodes: SVGGElement[];
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function el<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}

/** What goes beneath a state, in mono. Never invents a number. */
function timing(state: RunState, run: Run): string {
  if (state.skipped) return "skipped";
  if (state.durationMs !== undefined) return `${state.durationMs} ms`;
  if (state.id === "edge" && run.meta.colo) return run.meta.colo;
  return "—";
}

function spoken(state: RunState, run: Run): string {
  if (state.skipped) return "skipped";
  if (state.durationMs !== undefined) return `${state.durationMs} milliseconds`;
  if (state.id === "edge" && run.meta.colo) return `served from ${run.meta.city ?? run.meta.colo}`;
  return "not timed";
}

function caption(run: Run): string {
  const { city, colo, http, tls } = run.meta;
  const where = city && colo ? `${city} (${colo})` : (colo ?? "the edge");
  if (run.kind === "example")
    return `How this page reaches a reader, drawn as a state machine. This is an example run from ${where}${http ? ` over ${http}` : ""}; on the live site the figure is your own request, timed by your browser.`;
  if (run.states.some((s) => s.id === "cached"))
    return "How this page reached you, drawn as a state machine. Your browser already had it, so the network was never asked.";
  return `How this page reached you, drawn as a state machine: your own request, timed by your browser and answered from ${where}${http ? ` over ${http}` : ""}${tls ? ` with ${tls}` : ""}.`;
}

function layout(width: number, n: number): Layout {
  if (width < VERTICAL_BELOW) {
    const top = 42;
    const pitch = 54;
    return {
      vertical: true,
      width,
      height: top + (n - 1) * pitch + 22,
      pts: Array.from({ length: n }, (_, i) => ({ x: 22, y: top + i * pitch })),
      pitch,
    };
  }
  const lead = 40; // room for the start arrow
  const tail = 40; // room for the last label
  const pitch = n > 1 ? Math.min(168, (width - lead - tail) / (n - 1)) : 0;
  const x0 = (width - (lead + pitch * (n - 1) + tail)) / 2 + lead;
  return {
    vertical: false,
    width,
    height: 96,
    pts: Array.from({ length: n }, (_, i) => ({ x: x0 + i * pitch, y: 50 })),
    pitch,
  };
}

/** A straight arrow from a to b, stopping short of both circles, with an open chevron head. */
function arrow(g: SVGGElement, a: Pt, ra: number, b: Pt, rb: number): Drawn["edges"][number] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const p1 = { x: a.x + ux * (ra ? ra + GAP : 0), y: a.y + uy * (ra ? ra + GAP : 0) };
  const p2 = { x: b.x - ux * (rb + GAP), y: b.y - uy * (rb + GAP) };
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const path = el(g, "path", { class: "ra-edge", d: `M${p1.x},${p1.y}L${p2.x},${p2.y}` });
  const bx = p2.x - ux * 5;
  const by = p2.y - uy * 5;
  const head = el(g, "path", {
    class: "ra-head",
    d: `M${bx - uy * 3.2},${by + ux * 3.2}L${p2.x},${p2.y}L${bx + uy * 3.2},${by - ux * 3.2}`,
  });
  return { path, head, len };
}

function draw(svg: SVGSVGElement, run: Run, L: Layout): Drawn {
  svg.replaceChildren();
  svg.setAttribute("width", String(L.width));
  svg.setAttribute("height", String(L.height));
  svg.setAttribute("viewBox", `0 0 ${L.width} ${L.height}`);

  const last = run.states.length - 1;
  const radius = (i: number) => (i === last ? ACCEPT_R : R);
  const edgesG = el(svg, "g", { "aria-hidden": "true" });
  const nodesG = el(svg, "g");

  // Edge 0 is the start arrow, coming in from nowhere, as automata are drawn.
  const p0 = L.pts[0];
  const start = L.vertical ? { x: p0.x, y: 6 } : { x: p0.x - 36, y: p0.y };
  const edges = [arrow(edgesG, start, 0, p0, radius(0))];
  for (let i = 1; i <= last; i++) edges.push(arrow(edgesG, L.pts[i - 1], radius(i - 1), L.pts[i], radius(i)));

  const nodes = run.states.map((state, i) => {
    const { x, y } = L.pts[i];
    const g = el(nodesG, "g", {
      class: `ra-node${state.skipped ? " is-skipped" : ""}`,
      tabindex: 0,
      role: "img",
      "aria-label": `${state.label}, ${spoken(state, run)}${i === last ? ", accepting state" : ""}. ${state.log}`,
    });
    const box = L.vertical
      ? { x: x - 16, y: y - L.pitch / 2 + 3, w: L.width - x + 16, h: L.pitch - 6 }
      : { x: x - Math.min(L.pitch, 108) / 2 + 2, y: 6, w: Math.min(L.pitch, 108) - 4, h: L.height - 12 };
    el(g, "rect", { class: "ra-hit", x: box.x, y: box.y, width: box.w, height: box.h });
    el(g, "rect", { class: "ra-focus", x: box.x + 0.5, y: box.y + 0.5, width: box.w - 1, height: box.h - 1, rx: 4 });
    if (i === last) el(g, "circle", { class: "ra-ring", cx: x, cy: y, r: ACCEPT_R });
    el(g, "circle", { class: "ra-dot", cx: x, cy: y, r: R });
    if (L.vertical) {
      el(g, "text", { class: "ra-label font-sans", x: x + 26, y: y + 4.5, "font-size": 14 }, state.label);
      el(g, "text", { class: "ra-time font-mono", x: L.width - 2, y: y + 4, "font-size": 12, "text-anchor": "end" }, timing(state, run));
    } else {
      el(g, "text", { class: "ra-label font-sans", x, y: y - 22, "font-size": 13, "text-anchor": "middle" }, state.label);
      el(g, "text", { class: "ra-time font-mono", x, y: y + 31, "font-size": 11.5, "text-anchor": "middle" }, timing(state, run));
    }
    return g;
  });

  return { edges, nodes };
}

const variant: Variant = {
  name: "Plain figure",
  mount(root, { run, copy, reducedMotion }) {
    const ac = new AbortController();
    const on = { signal: ac.signal };
    const states = run.states;
    const last = states.length - 1;
    const total = run.totalMs !== undefined ? ` · ${run.totalMs} ms total` : "";
    const hint = "hover, focus or tap a state to read its log line";

    root.innerHTML = `
      <style>${CSS}</style>
      <article class="ra-a mx-auto w-full max-w-[66rem] px-4 pt-14 pb-24 sm:px-10 sm:pt-24 lg:pt-32">
        <p class="font-mono text-[0.6875rem] tracking-[0.06em] text-faint">nicolassaavedra.com</p>
        <div class="mt-6 grid gap-y-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-24">
          <div>
            <h1 class="font-serif text-[2.625rem] leading-[1.04] font-normal tracking-[-0.015em] text-text sm:text-[4.5rem]">${esc(copy.name)}</h1>
            <p class="mt-4 font-sans text-[0.9375rem] text-muted sm:text-lg">${esc(copy.headline)}</p>
            <p class="mt-10 max-w-[34em] font-serif text-[1.1875rem] leading-[1.6] text-text sm:text-[1.3125rem]">${esc(copy.intro)}</p>
          </div>
          <aside class="self-end">
            <h2 class="font-mono text-[0.6875rem] tracking-[0.06em] text-faint">focus</h2>
            <ol class="mt-3 border-b border-border">
              ${copy.pillars
                .map(
                  (p, i) => `<li class="flex items-baseline gap-4 border-t border-border py-2.5 font-sans text-[0.9375rem] text-text">
                    <span class="font-mono text-[0.6875rem] text-faint">${String(i + 1).padStart(2, "0")}</span><span>${esc(p)}</span>
                  </li>`,
                )
                .join("")}
            </ol>
          </aside>
        </div>

        <figure class="mt-20 sm:mt-28">
          <div class="flex items-baseline justify-between gap-4 border-t border-border pt-3 font-mono text-[0.6875rem] tracking-[0.04em] text-faint">
            <span>fig. 1</span>
            <span>${run.kind === "example" ? "example run" : "your request"}${total}</span>
          </div>
          <div data-chart class="mt-8 sm:mt-10"></div>
          <p data-log aria-hidden="true" class="mt-5 min-h-[3.2em] font-mono text-[0.8125rem] leading-[1.6] sm:mt-7 sm:min-h-[1.6em] sm:text-center"></p>
          <figcaption class="mt-8 max-w-[38rem] font-serif text-[0.9375rem] leading-[1.55] text-muted italic">${esc(caption(run))}</figcaption>
        </figure>

        <div class="sr-only">
          <p>Request Automaton, ${run.kind === "example" ? "example run" : "your request"}${run.totalMs !== undefined ? `, ${run.totalMs} milliseconds in total` : ""}.</p>
          <ol>${states.map((s) => `<li>${esc(s.label)}: ${esc(spoken(s, run))}. ${esc(s.log)}</li>`).join("")}</ol>
        </div>
      </article>`;

    const chart = root.querySelector<HTMLDivElement>("[data-chart]")!;
    const logLine = root.querySelector<HTMLParagraphElement>("[data-log]")!;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "block overflow-visible");
    svg.setAttribute("role", "group");
    svg.setAttribute(
      "aria-label",
      `Request Automaton: ${states.map((s) => `${s.label} ${timing(s, run)}`).join(", then ")}${total ? `. Total ${run.totalMs} ms` : ""}.`,
    );
    chart.appendChild(svg);

    let drawn: Drawn;
    let width = 0;
    let elapsed = reducedMotion ? Infinity : 0;
    let hovered: number | null = null;
    let focused: number | null = null;
    let t: Timer | undefined;

    const done = () => elapsed >= DRAW_MS;

    function refresh() {
      const shown = hovered ?? focused;
      const step = DRAW_MS / states.length;
      // While drawing, the lavender walks the line; once drawn it rests on the accepting state.
      const current = done() ? last : Math.min(last, Math.floor((elapsed - step * 0.55) / step));
      drawn.nodes.forEach((g, i) => {
        g.classList.toggle("is-lit", i === shown || i === current || (done() && i === last));
        g.classList.toggle("is-shown", i === shown);
      });
      logLine.textContent = shown === null ? hint : states[shown].log;
      logLine.classList.toggle("text-faint", shown === null);
      logLine.classList.toggle("text-text", shown !== null);
    }

    function frame() {
      const step = DRAW_MS / states.length;
      drawn.edges.forEach((e, i) => {
        if (done()) {
          e.path.style.strokeDasharray = "";
          e.path.style.strokeDashoffset = "";
          e.head.style.opacity = "";
          return;
        }
        const p = easeCubicOut(clamp01((elapsed - i * step) / (step * 0.7)));
        e.path.style.strokeDasharray = `${e.len}`;
        e.path.style.strokeDashoffset = `${e.len * (1 - p)}`;
        e.head.style.opacity = `${clamp01((p - 0.85) / 0.15)}`;
      });
      drawn.nodes.forEach((g, i) => {
        g.style.opacity = done() ? "" : `${clamp01((elapsed - i * step - step * 0.55) / (step * 0.45))}`;
      });
      refresh();
    }

    function render(w: number) {
      width = w;
      const keep = focused;
      drawn = draw(svg, run, layout(w, states.length));
      drawn.nodes.forEach((g, i) => {
        g.addEventListener("mouseenter", () => ((hovered = i), refresh()), on);
        g.addEventListener("mouseleave", () => ((hovered = null), refresh()), on);
        g.addEventListener("focus", () => ((focused = i), refresh()), on);
        g.addEventListener("blur", () => ((focused = null), refresh()), on);
        // Taps don't reliably focus SVG on mobile Safari.
        g.addEventListener("click", () => g.focus({ preventScroll: true }), on);
      });
      frame();
      if (keep !== null) drawn.nodes[keep]?.focus({ preventScroll: true });
    }

    render(Math.round(chart.clientWidth));

    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0 && w !== width) render(w);
    });
    ro.observe(chart);

    if (!reducedMotion) {
      t = timer((ms) => {
        elapsed = ms;
        frame();
        if (done()) t?.stop();
      }, START_DELAY_MS);
    }

    return () => {
      t?.stop();
      ro.disconnect();
      ac.abort();
      root.replaceChildren();
    };
  },
};

export default variant;
