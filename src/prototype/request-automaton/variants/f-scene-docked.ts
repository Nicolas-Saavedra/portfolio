// PROTOTYPE: throwaway. Variant F, "Scene, docked console": D's full-bleed scene (glyph field, d3-force
// automaton, timing-paced stream, copy floating over it), tamed, with C's console docked along the bottom
// of the hero as an instrument strip. One clock drives the scene, the waterfall and the log tail.
import type { Variant } from "../types";
import { plan, durText } from "./f/plan";
import { mountScene } from "./f/scene";
import { STRIP_STYLE, buildStrip, esc } from "./f/strip";

// A halo in the page background keeps copy readable over the glyph field.
const HALO = "[text-shadow:0_0_18px_var(--bg),0_0_6px_var(--bg),0_0_2px_var(--bg)]";
const PILLAR_TONES = ["text-sky", "text-mauve", "text-green"];

const variant: Variant = {
  name: "Scene, docked console",
  mount(root, { run, copy, reducedMotion }) {
    const states = run.states;
    const n = states.length;
    const P = plan(run);
    const summary =
      `Request Automaton, ${run.kind === "example" ? "example run" : "your request"}: ` +
      states.map((s) => `${s.label} ${durText(s, run)}`).join(", then ") +
      `. Total ${P.total !== undefined ? `${P.total} ms` : "unknown"}.`;

    const hero = document.createElement("section");
    hero.className = "relative isolate flex min-h-[100svh] w-full flex-col bg-bg text-text";
    hero.setAttribute("aria-labelledby", "f-name");
    hero.style.setProperty("--orbit-min", `${Math.max(2, n) * 92 + 16}px`);
    hero.innerHTML = `
      <style>${STRIP_STYLE}</style>
      <div data-stage class="relative flex flex-1 flex-col overflow-hidden">
        <canvas aria-hidden="true" class="absolute inset-0 block h-full w-full"></canvas>
        <div class="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-y-2 px-4 pb-4 pt-12 sm:px-8 sm:pt-14 lg:grid-cols-[minmax(0,31rem)_minmax(0,1fr)] lg:gap-x-10 lg:px-14 lg:py-8">
          <header data-copy class="pointer-events-auto max-w-[34rem] self-start lg:self-center ${HALO}">
            <h1 id="f-name" class="font-serif text-[clamp(2.75rem,7vw,5rem)] leading-[0.95] tracking-[-0.02em] text-text">${esc(copy.name)}</h1>
            <p class="mt-4 text-lg font-medium text-text sm:text-xl">${esc(copy.headline)}</p>
            <p class="mt-3 max-w-[32rem] text-base leading-relaxed text-muted">${esc(copy.intro)}</p>
            <ul class="mt-5 flex flex-col gap-1.5 font-mono text-[13px] text-text">
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
          <div data-orbit role="img" aria-label="${esc(summary)}" class="mt-6 min-h-[var(--orbit-min)] sm:mt-2 sm:min-h-[20rem] lg:mt-0 lg:min-h-[22rem]"></div>
        </div>
        <div data-layer class="pointer-events-none absolute inset-0 z-20"></div>
      </div>`;

    const strip = buildStrip(run, P, reducedMotion);
    hero.append(strip.el);
    root.append(hero);

    const $ = <T extends HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
    const ac = new AbortController();
    const on = { signal: ac.signal };

    // ---- one clock, one selection, shared by the scene and the strip ----
    let t = reducedMotion ? P.endT : 0;
    let playing = false, started = false;
    let hover: number | null = null, focused: number | null = null, pinned: number | null = null;
    const active = () => hover ?? focused ?? pinned;
    let shownT = -1, shownAct: number | null | undefined;

    function repaint() {
      const act = active();
      strip.render(t, act);
      shownT = t; shownAct = act;
      if (reducedMotion) scene.still(t, act);
    }

    const select = {
      enter: (i: number) => { hover = i; repaint(); },
      leave: (i: number) => { if (hover === i) { hover = null; repaint(); } },
      focus: (i: number) => { focused = i; repaint(); },
      blur: (i: number) => { if (focused === i) { focused = null; repaint(); } },
      tap: (i: number) => { pinned = pinned === i ? null : i; repaint(); },
    };

    const scene = mountScene(
      { stage: $("[data-stage]"), canvas: $<HTMLCanvasElement>("canvas"), layer: $("[data-layer]"), copy: $("[data-copy]"), orbit: $("[data-orbit]") },
      run, P, reducedMotion, select,
    );

    for (const row of strip.rows) {
      const i = Number(row.dataset.fI);
      row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") select.enter(i); }, on);
      row.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") select.leave(i); }, on);
      row.addEventListener("click", () => select.tap(i), on);
    }
    document.addEventListener("click", (e) => {
      if (pinned !== null && !(e.target as Element | null)?.closest?.("[data-f-i]")) { pinned = null; repaint(); }
    }, on);
    hero.addEventListener("keydown", (e) => { if (e.key === "Escape" && pinned !== null) { pinned = null; repaint(); } }, on);

    // ---- loop: runs while the scene is on screen; the clock only advances while playing ----
    let raf = 0, last = 0, visible = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(50, now - last) : 16.7;
      last = now;
      if (playing) {
        t = Math.min(P.endT, t + dt);
        if (t >= P.endT) playing = false;
      }
      const act = active();
      scene.frame(dt / 1000, t, act);
      if (t !== shownT || act !== shownAct) { strip.render(t, act); shownT = t; shownAct = act; }
      schedule();
    };
    const schedule = () => { if (!raf && visible && !reducedMotion) raf = requestAnimationFrame(frame); };
    const play = () => {
      t = 0;
      playing = true;
      started = true;
      strip.reset();
      scene.reset();
      schedule();
    };

    const observers: IntersectionObserver[] = [];
    if (!reducedMotion) {
      const stageIO = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) { last = 0; schedule(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
      stageIO.observe($("[data-stage]"));
      // Start the run when the automaton itself is in view, so phone readers don't miss it.
      const startIO = new IntersectionObserver((entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) { startIO.disconnect(); play(); }
      }, { threshold: 0.3 });
      startIO.observe($("[data-orbit]"));
      observers.push(stageIO, startIO);
      strip.replay?.addEventListener("click", play, on);
      schedule();
    }
    repaint();

    return () => {
      ac.abort();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      for (const o of observers) o.disconnect();
      scene.destroy();
      hero.remove();
    };
  },
};

export default variant;
