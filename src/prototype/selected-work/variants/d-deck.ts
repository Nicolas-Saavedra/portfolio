// PROTOTYPE: throwaway. Variant D, "The deck": each Case Study takes over the viewport in turn, and the ones you've
// read fold up into labelled tabs at the top, like a stack of case files. Pure CSS in production: position: sticky for
// the stacking, scroll-driven animations (named view timelines + timeline-scope) for the fold, the dim and the
// problem → did → outcome reveal. The JS here only builds the markup, as the harness requires.
// Stacking needs ≥ 1024 px wide and ≥ 720 px tall, motion allowed; otherwise it's a calm static list of the same cards.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";

const HUE: Record<string, string> = { blinka: "sky", "gold-to-mercury": "mauve", noestassolx: "peach", teaching: "green" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const pad = (n: number) => String(n).padStart(2, "0");

const STYLE = `
.swd { --tab: 2.875rem; --edge: .75rem; }
.swd-deck { list-style: none; margin: 0; padding: 0; timeline-scope: --swd-0, --swd-1, --swd-2, --swd-3; }
.swd-card {
  position: relative; overflow: clip; border: 1px solid var(--border); border-radius: 12px;
  background: var(--surface); transition: border-color .2s, box-shadow .2s;
}
.swd-card + .swd-card { margin-top: 1.5rem; }
.swd-card::before { content: ""; position: absolute; inset: 0 0 auto; height: 3px; background: var(--hue); }
.swd-card:hover { border-color: color-mix(in srgb, var(--hue) 55%, var(--border)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hue) 35%, transparent), 0 10px 40px -18px color-mix(in srgb, var(--hue) 60%, transparent); }
.swd-card:has(.swd-link:focus-visible) { outline: 2px solid var(--hue); outline-offset: 3px; }
.swd-link { color: var(--text); text-decoration: none; }
.swd-link:focus-visible { outline: none; }
.swd-link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.swd-ext { position: relative; z-index: 2; }
.swd-ext:focus-visible { outline: 2px solid var(--hue); outline-offset: 2px; border-radius: 3px; }
.swd-go { display: inline-block; transition: transform .2s; }
.swd-card:hover .swd-go, .swd-card:has(.swd-link:focus-visible) .swd-go { transform: translateX(4px); color: var(--hue); }
.swd-tab { min-height: var(--tab); }
/* The chapter numeral only fills whatever height the card has left over; with none, it's clipped away. */
.swd-void { display: none; }
.swd-num {
  display: block; pointer-events: none; user-select: none; margin-right: -.04em;
  font: 700 min(18rem, 118cqh)/.8 var(--font-serif); color: transparent;
  -webkit-text-stroke: 1.5px color-mix(in srgb, var(--hue) 38%, transparent);
}
.swd-body { position: relative; display: flex; flex-direction: column; }
.swd-node { width: .7rem; height: .7rem; border-radius: 999px; border: 1.5px solid var(--hue); background: var(--hue); flex: none; }
.swd-step:first-child .swd-node { background: transparent; }
.swd-wire { height: 1.5px; flex: 1; background: color-mix(in srgb, var(--hue) 55%, var(--border)); transform-origin: left; }
.swd-arrow { width: 0; height: 0; border-block: 4px solid transparent; border-left: 6px solid color-mix(in srgb, var(--hue) 55%, var(--border)); }
.swd-step:last-child .swd-wire, .swd-step:last-child .swd-arrow { display: none; }

@media (min-width: 1024px) and (min-height: 720px) and (prefers-reduced-motion: no-preference) {
  .swd:not(.swd-still) .swd-card {
    position: sticky; top: calc(var(--edge) + var(--i) * var(--tab));
    min-height: calc(100svh - 2 * var(--edge) - var(--i) * var(--tab));
    display: flex; flex-direction: column;
  }
  .swd:not(.swd-still) .swd-card + .swd-card { margin-top: 38svh; }
  /* Room for the last card to hold before the whole stack scrolls away together. */
  .swd:not(.swd-still) .swd-deck::after { content: ""; display: block; height: 30svh; }
  .swd:not(.swd-still) .swd-body { flex: 1; }
  .swd:not(.swd-still) .swd-void {
    display: flex; flex: 1 1 0; min-height: 1.75rem; overflow: clip; align-items: flex-end; justify-content: flex-end;
    container-type: size; padding-bottom: 1.25rem;
  }
  @supports (animation-timeline: view()) {
    .swd:not(.swd-still) .swd-card { view-timeline-name: var(--self); }
    /* The card being covered: its body sinks and dims while its tab stays crisp. */
    .swd:not(.swd-still) .swd-body {
      animation: swd-sink linear both; animation-timeline: var(--next); animation-range: entry 0% entry 100%;
      transform-origin: 50% 0;
    }
    .swd:not(.swd-still) .swd-card:last-child .swd-body { animation: none; }
    /* The card arriving: its three states light up in order, done before it settles. */
    .swd:not(.swd-still) .swd-step { animation: swd-in linear both; animation-timeline: var(--self); }
    .swd:not(.swd-still) .swd-wire { animation: swd-draw linear both; animation-timeline: var(--self); }
    .swd:not(.swd-still) .swd-step:nth-child(1), .swd:not(.swd-still) .swd-step:nth-child(1) .swd-wire { animation-range: entry 30% entry 60%; }
    .swd:not(.swd-still) .swd-step:nth-child(2), .swd:not(.swd-still) .swd-step:nth-child(2) .swd-wire { animation-range: entry 45% entry 75%; }
    .swd:not(.swd-still) .swd-step:nth-child(3) { animation-range: entry 60% entry 90%; }
    .swd:not(.swd-still) .swd-num { animation: swd-rise linear both; animation-timeline: var(--self); animation-range: entry 0% entry 100%; }
  }
}
@container (max-height: 110px) { .swd-num { display: none; } }
@keyframes swd-sink { to { opacity: .18; transform: scale(.975); filter: saturate(.4); } }
@keyframes swd-in { from { opacity: 0; transform: translateY(14px); } }
@keyframes swd-draw { from { transform: scaleX(0); } }
@keyframes swd-rise { from { transform: translateY(35%); opacity: 0; } }
`;

function card(c: CaseStudy, i: number, n: number) {
  const hue = `var(--${HUE[c.slug] ?? "lavender"})`;
  const next = i + 1 < n ? `--swd-${i + 1}` : "none";
  const draft = c.draft
    ? `<span class="rounded border border-dashed border-faint px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-muted">draft</span>`
    : "";
  const steps = (
    [
      ["q₀", "problem", c.problem],
      ["q₁", "what I did", c.did],
      ["q₂", "outcome", c.outcome],
    ] as const
  )
    .map(
      ([q, label, text]) => `
      <li class="swd-step flex flex-col">
        <div class="flex items-center gap-2" aria-hidden="true">
          <span class="swd-node"></span><span class="swd-wire"></span><span class="swd-arrow"></span>
        </div>
        <h4 class="mt-3 font-mono text-[11px] uppercase tracking-wider" style="color:${hue}"><span class="normal-case" aria-hidden="true">${q} · </span>${label}</h4>
        <p class="mt-1.5 text-sm leading-[1.55] text-muted">${esc(text)}</p>
      </li>`,
    )
    .join("");
  const facts = c.facts
    .map(
      (f) => `
      <div class="flex flex-row-reverse items-baseline justify-end gap-3 md:flex-col-reverse md:items-start md:gap-1">
        <dt class="text-sm text-muted">${esc(f.label)}</dt>
        <dd class="font-serif text-3xl leading-none md:text-5xl" style="color:${hue}">${esc(f.value)}</dd>
      </div>`,
    )
    .join("");
  const ext = c.external
    ? `<a class="swd-ext font-mono text-[11px] text-text underline decoration-faint underline-offset-4 hover:decoration-current" href="${esc(c.external.href)}" rel="noopener">${esc(c.external.label)} <span aria-hidden="true">↗</span></a>`
    : "";

  return `
  <li class="swd-card" style="--i:${i};--hue:${hue};--self:--swd-${i};--next:${next}">
    <div class="swd-tab relative z-[2] flex items-start gap-4 border-b border-border px-5 py-2.5 sm:px-6 lg:items-center">
      <span class="pt-0.5 font-mono text-xs lg:pt-0" style="color:${hue}">${pad(i + 1)}<span class="text-faint">/${pad(n)}</span></span>
      <div class="flex min-w-0 flex-1 flex-col gap-1 lg:flex-row lg:items-center lg:gap-4">
        <h3 class="min-w-0 flex-1 text-[15px] font-medium leading-snug sm:text-base">
          <a class="swd-link" href="${esc(c.href)}">${esc(c.title)}</a>
        </h3>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="font-mono text-[11px] text-faint">${esc(c.org)} · ${esc(c.period.label)}</span>
          ${draft}
          ${ext}
        </div>
      </div>
      <span class="swd-go font-mono text-sm text-muted" aria-hidden="true">→</span>
    </div>
    <div class="swd-body px-5 pb-5 pt-6 sm:px-6 lg:pt-7">
      <div class="grid gap-6 md:grid-cols-[1fr_13rem] md:gap-10 lg:grid-cols-[1fr_15rem]">
        <p class="max-w-[40rem] font-serif text-[1.6rem] leading-snug text-text md:text-[clamp(1.75rem,2.6vw,2.4rem)] md:leading-[1.2]">${esc(c.summary)}</p>
        <dl class="flex flex-col gap-4 md:gap-5">${facts}</dl>
      </div>
      <div class="swd-void" aria-hidden="true"><span class="swd-num">${pad(i + 1)}</span></div>
      <ol class="mt-8 grid gap-6 md:grid-cols-3 md:gap-6 lg:mt-0" aria-label="How it went">${steps}</ol>
      <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3.5 font-mono text-[11px] text-faint">
        <span>${esc(c.role)}</span>
        <span class="text-muted">${c.technologies.map(esc).join(" · ")}</span>
        ${c.draft ? `<span>draft: ${esc(c.draft.reason)}</span>` : ""}
      </div>
    </div>
  </li>`;
}

const variant: Variant = {
  name: "The deck",
  mount(root, { work, reducedMotion }) {
    const section = document.createElement("section");
    section.id = "selected-work";
    section.setAttribute("aria-labelledby", "sw-title");
    section.className = `swd${reducedMotion ? " swd-still" : ""} mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-8 md:pt-28`;
    section.innerHTML = `
      <style>${STYLE}</style>
      <header class="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:mb-14">
        <h2 id="sw-title" class="font-serif text-4xl text-text md:text-5xl">Selected Work</h2>
        <p class="font-mono text-xs text-faint">${work.length} case studies · each one: problem <span aria-hidden="true">→</span><span class="sr-only">then</span> what I did <span aria-hidden="true">→</span><span class="sr-only">then</span> outcome</p>
      </header>
      <ol class="swd-deck">${work.map((c, i) => card(c, i, work.length)).join("")}</ol>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
