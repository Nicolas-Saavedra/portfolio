// PROTOTYPE: throwaway. Variant G, "Scroll-docking": the hero opens as D's full-bleed scene, and as the
// reader scrolls the machine shrinks and docks into C's instrument panel, which unfolds around it while
// the glyph field fades to a texture. Scroll position maps to a 0→1 progress; scrolling stays native.
import type { Variant } from "../types";
import { TONES } from "./g/flavor";
import { createBackdrop, type Clearing } from "./g/backdrop";
import { HUE, cursor, durText, esc, plan, q, reqAt } from "./g/clock";
import { createMachine, dockLayout, heroLayout, smooth } from "./g/machine";
import { createPanel, inspectLine } from "./g/panel";

// A halo in the page background keeps copy readable over the glyph field (as in D).
const HALO = "[text-shadow:0_0_18px_var(--bg),0_0_6px_var(--bg),0_0_2px_var(--bg)]";
const PILLAR_TONES = ["text-sky", "text-mauve", "text-green"];

const STYLE = `
@keyframes g-blink { 50% { opacity: 0 } }
.g-cursor { animation: g-blink 1.05s steps(1) infinite; }
.g-x { transition: opacity .15s ease, background-color .15s ease; }
.g-node { cursor: pointer; outline: none; pointer-events: auto; }
.g-node .g-focus { opacity: 0; }
.g-node:focus-visible .g-focus { opacity: 1; }
.g-halo { paint-order: stroke; stroke: var(--g-halo, var(--bg)); stroke-width: 4px; stroke-linejoin: round; }
@media (prefers-reduced-motion: reduce) { .g-cursor { animation: none; } .g-x { transition: none; } }
`;

const WORK = [
  ["Running Blinka's infrastructure", "AWS, CI/CD, observability and PR review, as the only infrastructure engineer of a YC fintech."],
  ["From GOLD-python to mercury-lib", "A research line carried from a research assistant role to a thesis: automata, and how to see them."],
  ["NoEstasSolx", "A platform built and shipped for more than 1,000 students."],
  ["Teaching", "More than 150 students taught, from HTML to React."],
];

const variant: Variant = {
  name: "Scroll-docking",
  mount(root, { run, copy, reducedMotion }) {
    const states = run.states;
    const n = states.length;
    const P = plan(run);
    const docked = reducedMotion; // reduced motion: skip the transition, show the docked panel directly
    const example = run.kind === "example";
    const m = run.meta;
    const where = m.city ? `${m.city} (${m.colo})` : m.colo;
    const meta = [where, m.http, m.tls, m.kex].filter(Boolean).join(" · ");
    const totalLabel = P.total !== undefined ? `${P.total} ms` : "unknown";
    const summary =
      `Request automaton, ${example ? "example run" : "your request"}: ` +
      states.map((s) => `${s.label} ${durText(s, run)}`).join(", ") +
      `. Total ${totalLabel}.`;
    const panel = createPanel(run, P, reducedMotion);
    const ac = new AbortController();
    const on = <E extends Event>(el: EventTarget, type: string, fn: (e: E) => void) =>
      el.addEventListener(type, fn as EventListener, { signal: ac.signal });

    const section = document.createElement("section");
    section.className = "relative isolate w-full overflow-clip bg-bg text-text"; // clip: the sticky field must not outlive the section
    section.setAttribute("aria-label", copy.name);
    section.innerHTML = `
<style>${STYLE}</style>
<div data-fieldbox aria-hidden="true" class="pointer-events-none sticky top-0 -mb-[100svh] h-[100svh] w-full overflow-hidden"><canvas class="block h-full w-full"></canvas></div>
<div class="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-y-6 px-4 pt-12 sm:px-8 lg:px-14 ${
      docked ? "pb-10 lg:pt-20" : "min-h-[100svh] pb-14 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:gap-x-10 xl:pt-10"
    }">
  <header data-copy class="max-w-[34rem] self-start ${docked ? "" : "xl:self-center"} ${HALO}">
    <h1 class="font-serif text-[clamp(3rem,10vw,6.5rem)] leading-[0.92] tracking-[-0.025em] text-text">${esc(copy.name)}</h1>
    <p class="mt-5 text-xl font-medium text-text sm:text-2xl">${esc(copy.headline)}</p>
    <p class="mt-4 text-base leading-relaxed text-muted sm:text-[1.0625rem]">${esc(copy.intro)}</p>
    <ul class="mt-6 flex flex-col gap-2 font-mono text-[13px] text-text">
      ${copy.pillars
        .map(
          (p, i) => `<li class="flex items-center gap-3">
        <svg aria-hidden="true" width="24" height="12" viewBox="0 0 24 12" class="${PILLAR_TONES[i % 3]} shrink-0">
          <line x1="0" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.2" />
          <path d="M8 3.5 11 6 8 8.5" fill="none" stroke="currentColor" stroke-width="1.2" />
          <circle cx="17.5" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.2" />
        </svg>${esc(p)}</li>`,
        )
        .join("")}
    </ul>
  </header>
  ${
    docked
      ? ""
      : `<div class="flex min-w-0 flex-col">
    <div data-transcript class="w-full font-mono text-[11.5px] leading-[1.65] text-muted xl:mt-6 xl:max-w-[34rem] xl:self-end ${HALO}">
      <p class="flex flex-wrap items-baseline justify-between gap-x-4 text-faint">
        <span class="flex items-center gap-2"><span aria-hidden="true" class="inline-block size-1.5 shrink-0 rounded-full ${example ? "bg-peach" : "bg-green"}"></span>${
          example ? "example run · your real request appears on the live site" : "your request, measured as this page loaded"
        }</span>
        <span class="flex items-baseline gap-3"><button data-replay type="button" class="text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-lavender" aria-label="Replay the request animation">↻ replay</button><span data-counter aria-hidden="true" class="text-[13px] tabular-nums text-text">0 ms</span></span>
      </p>
      ${meta ? `<p class="text-faint">${esc(meta)}</p>` : ""}
      <p data-hero-inspect aria-hidden="true" class="mt-2 min-h-10 border-l border-border pl-3"></p>
      <p aria-hidden="true" class="mt-1 text-faint">scroll ↓ and the machine docks into its trace</p>
    </div>
    <div data-stage class="min-h-[26rem] flex-1"></div>
  </div>`
  }
</div>
<div class="relative mx-auto w-full max-w-6xl px-4 pb-24 sm:px-8 ${docked ? "" : "pt-6 sm:pt-12"}">
  <section data-panel aria-labelledby="g-panel-title" class="relative">
    <div data-frame aria-hidden="true" class="absolute inset-0 rounded-md border border-border bg-surface"></div>
    <div class="relative">${panel.html}</div>
  </section>
  <ol class="sr-only">
    ${states.map((s) => `<li>${esc(s.label)}: ${esc(durText(s, run))}. ${esc(s.log)}</li>`).join("")}
    <li>Total: ${esc(totalLabel)}.${example ? " This is an example run; your real request appears on the live site." : ""}</li>
  </ol>
</div>`;

    // Filler below the hero so the docking has room to scroll. Not part of the design question.
    const filler = document.createElement("div");
    filler.className = "mx-auto w-full max-w-6xl px-4 pb-48 pt-8 sm:px-8";
    filler.innerHTML = `
<p class="font-mono text-[11px] text-faint">prototype filler, so the page has somewhere to scroll</p>
<h2 class="mt-3 font-serif text-3xl text-text">Selected Work</h2>
<ol class="mt-6 divide-y divide-border border-y border-border">
  ${WORK.map(([t, d]) => `<li class="grid gap-1 py-6 sm:grid-cols-[18rem_1fr] sm:gap-8"><span class="text-lg text-text">${esc(t)}</span><span class="text-muted">${esc(d)}</span></li>`).join("")}
</ol>
<h2 class="mt-20 font-serif text-3xl text-text">Timeline</h2>
<div class="mt-6 grid gap-10 sm:grid-cols-2">
  ${[["Engineering", ["Founding Engineer, Blinka (YC F26)", "Research assistant, GOLD-python", "NoEstasSolx"]], ["Teaching", ["Frontend instructor, Universidad de los Andes", "Tutoring, HTML to React"]]]
    .map(([track, rows]) => `<div><h3 class="font-mono text-xs text-faint">${track}</h3><ul class="mt-3 space-y-4">${(rows as string[]).map((r) => `<li class="border-l border-border pl-4 text-text">${esc(r)}</li>`).join("")}</ul></div>`)
    .join("")}
</div>
<div class="mt-24 h-[60svh] border-t border-dashed border-border pt-4 font-mono text-[11px] text-faint">end of filler</div>`;
    root.append(section, filler);

    const $ = <T extends Element = HTMLElement>(sel: string) => section.querySelector<T>(sel);
    const fieldBox = $("[data-fieldbox]")!;
    const canvas = $<HTMLCanvasElement>("canvas")!;
    const copyEl = $("[data-copy]")!;
    const stage = $("[data-stage]");
    const transcript = $("[data-transcript]");
    const counter = $("[data-counter]");
    const heroInspect = $("[data-hero-inspect]");
    const frameEl = $("[data-frame]")!;
    const slot = $("[data-slot]")!;
    const unfold = (k: string) => $(`[data-unfold="${k}"]`)!;
    const stages: [HTMLElement, number, number, number][] = [
      // The header, stats and label pass beneath the machine on their way up, so they appear only after it.
      [frameEl, 0.3, 0.8, 0], [unfold("head"), 0.84, 1, 0], [unfold("stats"), 0.87, 1, 0], [unfold("label"), 0.94, 1, 0],
      [unfold("inspect"), 0.9, 1, 0], [unfold("trace"), 0.72, 1, 28], [unfold("logs"), 0.8, 1, 28],
    ];

    // ---- calm focus: one active index shared by the machine, the waterfall and the log tail ----
    let hover: number | null = null, focused: number | null = null, pinned: number | null = null;
    const active = () => hover ?? focused ?? pinned;
    const bind = (el: Element, i: number) => {
      on<PointerEvent>(el, "pointerenter", (e) => { if (e.pointerType === "mouse") { hover = i; requestPaint(); } });
      on<PointerEvent>(el, "pointerleave", (e) => { if (e.pointerType === "mouse") { hover = null; requestPaint(); } });
      on(el, "click", () => { pinned = pinned === i ? null : i; requestPaint(); });
    };
    panel.attach(section, bind);
    const machine = createMachine(run, P, summary);
    section.append(machine.svg);
    machine.nodes.forEach((g, i) => {
      bind(g, i);
      on(g, "focus", () => { focused = i; requestPaint(); });
      on(g, "blur", () => { if (focused === i) { focused = null; requestPaint(); } });
      on<KeyboardEvent>(g, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pinned = pinned === i ? null : i; requestPaint(); }
      });
    });
    on<MouseEvent>(document, "click", (e) => {
      if (pinned !== null && !(e.target as Element | null)?.closest?.("[data-g-i]")) { pinned = null; requestPaint(); }
    });
    on<KeyboardEvent>(section, "keydown", (e) => { if (e.key === "Escape") { pinned = hover = null; requestPaint(); } });

    // ---- scroll → progress ----
    // Docking starts once the hero machine reaches mid-screen and ends when its panel slot arrives where
    // the machine stands; vertical position is lerped linearly in scroll, so the machine holds still on screen.
    let s0 = 0, dist = 1;
    const progress = () => (docked ? 1 : Math.max(0, Math.min(1, (-section.getBoundingClientRect().top - s0) / dist)));

    function layout() {
      const sr0 = section.getBoundingClientRect();
      if (!sr0.width) return;
      const narrow = sr0.width < 640;
      if (stage) stage.style.minHeight = narrow ? `${Math.ceil(n / 3) * 180 + 60}px` : "";
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect(), s = section.getBoundingClientRect();
        return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
      };
      slot.style.height = `${dockLayout(n, rel(slot)).h}px`;
      const dock = dockLayout(n, rel(slot));
      const hero = stage ? heroLayout(run, rel(stage), dock.row[n - 1] === 0, narrow, sr0.width >= 1200) : dock;
      const sr = section.getBoundingClientRect();
      machine.setLayouts(hero, dock, { w: sr.width, h: sr.height });
      const mean = (ys: number[]) => ys.reduce((a, b) => a + b, 0) / Math.max(1, ys.length);
      const hy = mean(hero.pos.map((p) => p.y)), dy = mean(dock.pos.map((p) => p.y));
      s0 = Math.max(0, hy - window.innerHeight * 0.5);
      dist = Math.max(1, dy - hy);
    }

    // ---- the one clock ----
    let t = docked ? P.endT : 0, playing = false, startAt = 0;
    let raf = 0, last = 0, visible = true, lastP = -1, heroHtml = "";
    const backdrop = createBackdrop(canvas);
    const toneOfState = (i: number) => (states[i].skipped ? TONES.indexOf("faint") : Math.max(0, TONES.indexOf(HUE[states[i].id] as never)));

    function applyUnfold(p: number) {
      if (p === lastP) return;
      lastP = p;
      for (const [el, a, b, lift] of stages) {
        const v = smooth(a, b, p);
        el.style.opacity = `${v}`;
        el.style.transform = lift && v < 1 ? `translateY(${((1 - v) * lift).toFixed(1)}px)` : "";
        el.style.visibility = v < 0.02 ? "hidden" : "";
      }
      if (transcript) {
        const v = 1 - smooth(0, 0.3, p);
        transcript.style.opacity = `${v}`;
        transcript.style.visibility = v < 0.02 ? "hidden" : "";
      }
      fieldBox.style.opacity = `${1 - 0.72 * smooth(0.15, 1, p)}`;
    }

    function paint(dt: number) {
      const p = progress();
      const act = active();
      machine.render(p, t, act);
      panel.paint(t, act);
      applyUnfold(p);

      const done = t >= P.endT;
      if (counter) {
        const req = reqAt(P, t);
        counter.textContent = P.domain > 0 ? `${done && P.total !== undefined ? P.total : Math.round(req)} ms` : "—";
      }
      if (heroInspect) {
        const ci = cursor(P, t);
        const html = act !== null || done || ci < 0
          ? inspectLine(run, act)
          : `<span class="text-faint">${q(ci)}</span> <span class="text-text">${esc(states[ci].log)}</span>`;
        if (html !== heroHtml) heroInspect.innerHTML = heroHtml = html;
      }

      // Backdrop: the token and a focused state warm nearby glyphs; clearings keep the copy readable.
      const sr = section.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const ox = sr.left - cr.left, oy = sr.top - cr.top;
      if (!reducedMotion) {
        backdrop.tick(dt);
        const tp = machine.token(), ci = cursor(P, t);
        if (tp && !done && p < 0.7) backdrop.warmAt(tp.x + ox, tp.y + oy, ci < 0 ? 0 : toneOfState(ci));
        if (act !== null) {
          const nd = machine.node(act);
          backdrop.warmRing(nd.x + ox, nd.y + oy, nd.r, toneOfState(act));
        }
      }
      const vp = (el: Element, grow: number, strength: number): Clearing => {
        const r = el.getBoundingClientRect();
        return { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height, grow, strength };
      };
      const clearings = [vp(copyEl, 1.45, 1)];
      if (transcript) clearings.push(vp(transcript, 1.3, 1 - smooth(0, 0.3, p)));
      backdrop.draw(clearings);
    }

    function frame(now: number) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (playing) {
        t = Math.min(now - startAt, P.endT);
        if (t >= P.endT) playing = false;
      }
      paint(dt);
      schedule();
    }
    function schedule() {
      if (!raf && visible && !reducedMotion) raf = requestAnimationFrame(frame);
    }
    function requestPaint() {
      if (reducedMotion) paint(0);
      else schedule();
    }
    function play() {
      t = 0;
      startAt = performance.now();
      playing = true;
      schedule();
    }

    const ro = new ResizeObserver(() => {
      backdrop.resize(fieldBox.clientWidth, fieldBox.clientHeight);
      layout();
      lastP = -1;
      requestPaint();
    });
    ro.observe(section);
    ro.observe(fieldBox);

    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { last = 0; schedule(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    seen.observe(section);

    // The run starts when the hero machine is on screen, so phone readers below the copy don't miss it.
    let starter: IntersectionObserver | null = null;
    if (!docked && stage) {
      starter = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { starter?.disconnect(); starter = null; play(); }
      }, { threshold: 0.35 });
      starter.observe(stage);
    }
    section.querySelectorAll("[data-replay]").forEach((b) => on(b, "click", () => { starter?.disconnect(); starter = null; play(); }));
    if (!reducedMotion) on(window, "scroll", () => schedule());

    on(matchMedia("(prefers-color-scheme: dark)"), "change", () => { backdrop.readInk(); requestPaint(); });

    backdrop.resize(fieldBox.clientWidth, fieldBox.clientHeight);
    layout();
    requestPaint();

    return () => {
      ac.abort();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      ro.disconnect();
      seen.disconnect();
      starter?.disconnect();
      section.remove();
      filler.remove();
    };
  },
};

export default variant;
