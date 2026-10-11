// PROTOTYPE: throwaway. Variant E, "Panel in the scene": C's instrument panel as the hero object,
// set on D's full-bleed glyph field. One frame loop drives the run and the field, and the field
// warms where the token and the playhead meet the panel's edges.
import type { Variant } from "../types";
import { esc, mountConsole } from "./e/console";
import { mountField, type Heat } from "./e/field";

// A halo in the page background keeps copy readable over the glyph field (as in D).
const HALO = "[text-shadow:0_0_18px_var(--bg),0_0_6px_var(--bg),0_0_2px_var(--bg)]";
const PILLAR_TONES = ["text-sky", "text-mauve", "text-green"];

// Layout that only this variant uses lives here rather than in new Tailwind arbitrary classes.
const STYLE = `
.escene-name { font-size: clamp(3.25rem, 10vw, 6.5rem); line-height: .92; }
.escene-pillars li { padding: .875rem 0; }
.escene-pillars li:last-child { border-bottom: 1px solid var(--border); }
@media (min-width: 80rem) {
  .escene-grid { grid-template-columns: minmax(0, 30rem) minmax(0, 1fr); column-gap: 4rem; padding: 3rem 3.5rem 6rem; }
  .escene-pillars { margin-top: auto; padding-top: 3rem; }
  .escene-slot { padding-top: 6rem; }
}
`;

const variant: Variant = {
  name: "Panel in the scene",
  mount(root, { run, copy, reducedMotion }) {
    const hero = document.createElement("section");
    hero.className = "relative isolate min-h-[100svh] w-full overflow-hidden bg-bg text-text";
    hero.setAttribute("aria-labelledby", "e-name");
    hero.innerHTML = `
      <style>${STYLE}</style>
      <canvas aria-hidden="true" class="pointer-events-none absolute inset-0 block h-full w-full"></canvas>
      <div class="escene-grid relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1600px] grid-cols-1 gap-y-12 px-4 pb-28 pt-12 sm:px-8">
        <div class="flex flex-col">
          <header data-copy class="${HALO}">
            <h1 id="e-name" class="escene-name font-serif tracking-[-0.025em] text-text">${esc(copy.name)}</h1>
            <p class="mt-6 text-xl font-medium text-text sm:text-2xl">${esc(copy.headline)}</p>
            <p class="mt-4 max-w-[32rem] text-base leading-relaxed text-muted sm:text-[1.0625rem]">${esc(copy.intro)}</p>
          </header>
          <ol data-pillars aria-label="Focus" class="escene-pillars mt-10 ${HALO}">
            ${copy.pillars
              .map(
                (p, i) => `<li class="flex items-center gap-4 border-t border-border">
                  <svg aria-hidden="true" width="28" height="14" viewBox="0 0 28 14" class="${PILLAR_TONES[i % 3]} shrink-0">
                    <line x1="0" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.2" />
                    <path d="M9.5 4 13 7 9.5 10" fill="none" stroke="currentColor" stroke-width="1.2" />
                    <circle cx="20.5" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="1.2" />
                  </svg>
                  <span class="flex-1 text-lg text-text">${esc(p)}</span>
                  <span class="font-mono text-xs text-faint">0${i + 1}</span>
                </li>`,
              )
              .join("")}
          </ol>
        </div>
        <div data-slot class="escene-slot min-w-0"></div>
      </div>`;
    root.append(hero);

    const $ = <T extends HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
    const copyEl = $("[data-copy]"), pillarsEl = $("[data-pillars]");
    const field = mountField(hero, $<HTMLCanvasElement>("canvas"), () => [copyEl, pillarsEl]);

    // Heat: where the token (above the panel) and the playhead (below it) meet the panel's edges.
    let scrubbedAt = -1e9;
    const heats = (): Heat[] => {
      const p = con.probe(), hb = hero.getBoundingClientRect();
      const recent = performance.now() - scrubbedAt < 600;
      const k = p.playing || recent ? 0.9 : 0.3; // a resting ember once the run is over
      const out: Heat[] = [{ x: p.playheadX - hb.left, y: p.panel.bottom - hb.top, r: 84, k, tone: p.tone }];
      if (p.token) out.push({ x: p.token.x - hb.left, y: p.panel.top - hb.top, r: 96, k, tone: p.tone });
      return out;
    };

    const con = mountConsole($("[data-slot]"), run, reducedMotion, () => {
      scrubbedAt = performance.now();
      if (reducedMotion) field.still(heats());
    });

    // ---- the one frame loop: the run and the field advance together ----
    let raf = 0, last = 0, visible = true;
    const frame = () => {
      raf = 0;
      const now = performance.now();
      const dt = last ? Math.min(50, now - last) : 16;
      last = now;
      con.step(dt);
      field.step(dt / 1000, heats());
      schedule();
    };
    const schedule = () => { if (!raf && visible && !reducedMotion) raf = requestAnimationFrame(frame); };

    const ro = new ResizeObserver(() => {
      field.resize();
      if (reducedMotion) field.still(heats());
    });
    ro.observe(hero);

    const observers: IntersectionObserver[] = [];
    if (!reducedMotion) {
      // Pause the loop while the hero is off screen.
      const seen = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) { last = 0; schedule(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
      seen.observe(hero);
      // Start the run when the panel is in view, so phone readers who scroll don't miss it.
      const start = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { start.disconnect(); con.play(); }
      }, { threshold: 0.35 });
      start.observe(con.el);
      observers.push(seen, start);
    }
    field.still(heats());

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      observers.forEach((o) => o.disconnect());
      ro.disconnect();
      field.dispose();
      con.dispose();
      hero.remove();
    };
  },
};

export default variant;
