// PROTOTYPE: throwaway. Variant D, "Over the top": the Request Automaton is the hero.
// A full-bleed d3-force machine on canvas (see ./d/scene.ts), with the copy floating over it.
import type { Variant } from "../types";
import { detailOf } from "./d/flavor";
import { mountScene } from "./d/scene";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// A halo in the page background keeps copy readable over the glyph field and the stream.
const HALO = "[text-shadow:0_0_18px_var(--bg),0_0_6px_var(--bg),0_0_2px_var(--bg)]";
const PILLAR_TONES = ["text-sky", "text-mauve", "text-green"];

const variant: Variant = {
  name: "Over the top",
  mount(root, { run, copy, reducedMotion }) {
    const n = run.states.length;
    const totalMs = run.totalMs ?? run.states.reduce((a, s) => a + (s.durationMs ?? 0), 0);
    const where = run.meta.city ? `${run.meta.city} (${run.meta.colo})` : run.meta.colo;
    const meta = [where, run.meta.http, run.meta.tls, run.meta.kex].filter(Boolean).join(" · ");
    const summary =
      `Request Automaton, ${run.kind === "example" ? "example run" : "your request"}: ` +
      run.states.map((s) => `${s.label} ${detailOf(s, run)}`).join(", then ") +
      `. Total ${totalMs} ms.`;
    const fine = matchMedia("(pointer: fine)").matches;
    const hint = reducedMotion
      ? "hover or focus a state to read its log"
      : fine
        ? "hover a state to zoom in · drag it · hold anywhere for a gravity well"
        : "tap a state to zoom in · drag it around";

    const hero = document.createElement("section");
    hero.className = "relative isolate min-h-[100svh] w-full overflow-hidden bg-bg text-text";
    hero.setAttribute("aria-labelledby", "d-name");
    hero.style.setProperty("--orbit-min", `${Math.ceil(n / 2) * 10 + 4}rem`);
    hero.innerHTML = `
      <canvas aria-hidden="true" class="absolute inset-0 block h-full w-full touch-pan-y"></canvas>
      <div class="pointer-events-none relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1600px] grid-cols-1 gap-y-4 px-4 pb-28 pt-12 sm:px-8 lg:grid-cols-[minmax(0,33rem)_minmax(0,1fr)] lg:gap-x-10 lg:px-14 lg:pb-16 lg:pt-10">
        <header data-copy class="pointer-events-auto max-w-[34rem] self-start lg:self-center ${HALO}">
          <h1 id="d-name" class="font-serif text-[clamp(3.25rem,10vw,7rem)] leading-[0.9] tracking-[-0.025em] text-text">${esc(copy.name)}</h1>
          <p class="mt-6 text-xl font-medium text-text sm:text-2xl">${esc(copy.headline)}</p>
          <p class="mt-4 max-w-[32rem] text-base leading-relaxed text-muted sm:text-[1.0625rem]">${esc(copy.intro)}</p>
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
          <p class="mt-8 font-mono text-[11px] text-faint">${esc(hint)}</p>
        </header>
        <div class="flex min-w-0 flex-col">
          <div data-orbit role="img" aria-label="${esc(summary)}" class="min-h-[var(--orbit-min)] flex-1 lg:min-h-[26rem]"></div>
          <div data-transcript class="pointer-events-auto w-full font-mono text-[11.5px] leading-[1.65] text-muted lg:max-w-[31rem] lg:self-end ${HALO}">
            <p class="flex flex-wrap items-baseline justify-between gap-x-4 text-faint">
              <span class="flex items-center gap-2">
                <span aria-hidden="true" class="inline-block h-1.5 w-1.5 rounded-full ${run.kind === "example" ? "bg-peach" : "bg-green"}"></span>
                ${run.kind === "example" ? "example run · your real request appears on the live site" : "your request, measured as this page loaded"}
              </span>
              <span data-counter aria-hidden="true" class="text-[13px] tabular-nums text-text">0 ms</span>
            </p>
            ${meta ? `<p class="text-faint">${esc(meta)}</p>` : ""}
            <ol aria-hidden="true" class="mt-2 border-l border-border pl-3">
              ${run.states
                .map(
                  (s, i) =>
                    `<li data-line class="text-muted opacity-0 transition-[opacity,color] duration-300 motion-reduce:transition-none"><span class="text-faint">q${i}</span>&ensp;${esc(s.log)}</li>`,
                )
                .join("")}
            </ol>
            <p data-accept aria-hidden="true" class="mt-1 text-faint opacity-0 transition-opacity duration-500 motion-reduce:transition-none">accept · page ready in ${totalMs} ms</p>
          </div>
        </div>
      </div>
      <div data-layer class="pointer-events-none absolute inset-0 z-20"></div>
      <div data-tip aria-hidden="true" class="pointer-events-none absolute left-0 top-0 z-30 max-w-[min(24rem,calc(100vw-2rem))] rounded-sm border border-border bg-bg px-2.5 py-1.5 font-mono text-[12px] leading-snug text-text opacity-0 transition-opacity duration-200"></div>
      <ol class="sr-only">
        ${run.states.map((s) => `<li>${esc(s.label)}: ${esc(detailOf(s, run))}. ${esc(s.log)}</li>`).join("")}
        <li>Total: ${totalMs} ms${run.kind === "example" ? " (example run, not your request)" : ""}.</li>
      </ol>`;
    root.append(hero);

    const $ = <T extends HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
    const lines = [...hero.querySelectorAll<HTMLElement>("[data-line]")];
    const counter = $("[data-counter]");
    const acceptLine = $("[data-accept]");
    const show = (el: HTMLElement) => el.classList.replace("opacity-0", "opacity-100");

    const dispose = mountScene(
      {
        root: hero, canvas: $<HTMLCanvasElement>("canvas"), layer: $("[data-layer]"), tip: $("[data-tip]"),
        copy: $("[data-copy]"), orbit: $("[data-orbit]"), transcript: $("[data-transcript]"),
      },
      run,
      reducedMotion,
      {
        onReveal: (i) => lines[i] && show(lines[i]),
        onCount: (ms) => (counter.textContent = `${ms} ms`),
        onAccept: () => show(acceptLine),
        onActive: (i) =>
          lines.forEach((li, k) => {
            const on = k === i;
            li.classList.toggle("text-text", on);
            li.classList.toggle("text-muted", !on);
          }),
      },
    );

    return () => {
      dispose();
      hero.remove();
    };
  },
};

export default variant;
