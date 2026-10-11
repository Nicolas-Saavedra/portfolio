// PROTOTYPE: throwaway. Variant A, "Ruled index": the four Case Studies as a large editorial index whose row
// dividers are their periods, drawn on one shared year ruler. Everything here is static markup plus CSS; the
// mount only builds what an Astro component would render at build time ("now" would be the build date).
import type { CaseStudy } from "../content";
import type { Variant } from "../types";

const HUES: Record<string, string> = { blinka: "var(--peach)", "gold-to-mercury": "var(--mauve)", noestassolx: "var(--green)", teaching: "var(--sky)" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Months since Jan of `y0`. `endOfMonth` counts the whole month, so a one-month span has width 1. */
const month = (ym: string, y0: number, endOfMonth = false) => {
  const [y, m] = ym.split("-").map(Number);
  return (y - y0) * 12 + (m - 1) + (endOfMonth ? 1 : 0);
};

function render(work: CaseStudy[], now: Date) {
  const nowYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const y0 = Math.min(...work.map((c) => Number(c.period.start.slice(0, 4))));
  const y1 = now.getFullYear();
  const span = (y1 - y0 + 1) * 12; // the ruler runs Jan y0 → Dec of this year
  const pct = (m: number) => `${((m / span) * 100).toFixed(3)}%`;
  const nowAt = month(nowYm, y0, true);

  const ticks = Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
  const ruler = `
    <div class="swa-ruler" aria-hidden="true">
      ${ticks.map((y) => `<span class="swa-tick" style="left:${pct((y - y0) * 12)}"><span class="swa-long">${y}</span><span class="swa-short">’${String(y).slice(2)}</span></span>`).join("")}
      <span class="swa-tick swa-now" style="left:${pct(nowAt)}">now</span>
    </div>`;
  
  const rows = work
    .map((c, i) => {
      const a = month(c.period.start, y0);
      const b = c.period.end === "present" ? nowAt : month(c.period.end, y0, true);
      const late = a / span > 0.6; // a span that starts late hangs its label off its end, so it can't run off the column
      const cls = ["swa-row", c.draft && "is-draft", c.period.end === "present" && "is-open"].filter(Boolean).join(" ");
      return `
      <li class="${cls}" style="--hue:${HUES[c.slug] ?? "var(--lavender)"}">
        <span class="swa-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <div class="swa-head">
          <p class="swa-meta">${esc(c.org)}</p>
          <h3 class="swa-title"><a href="${esc(c.href)}">${esc(c.title).replace(/(\w)-(\w)/g, "$1\u2011$2")}</a>${
            c.draft ? ` <span class="swa-draft" title="${esc(c.draft.reason)}">draft<span class="sr-only">, ${esc(c.draft.reason)}</span></span>` : ""
          }</h3>
          <p class="swa-role">${esc(c.role)}</p>
        </div>
        <div class="swa-body">
          <p class="swa-summary">${esc(c.summary)}</p>
          <p class="swa-links">
            ${c.external ? `<a class="swa-ext" href="${esc(c.external.href)}" rel="noopener">${esc(c.external.label)} ↗</a>` : ""}
            <span class="swa-read" aria-hidden="true">read the case study →</span>
          </p>
        </div>
        <div class="swa-track">
          <span class="swa-when${late ? " is-late" : ""}" style="${late ? `right:calc(100% - ${pct(b)})` : `left:${pct(a)}`}">${esc(c.period.label)}</span>
          <span class="swa-bar" aria-hidden="true" style="left:${pct(a)};width:${pct(b - a)}"></span>
        </div>
      </li>`;
    })
    .join("");

  return `
  <section id="selected-work" aria-labelledby="sw-title" style="--yr:${pct(12)}" class="swa mx-auto w-full max-w-6xl px-4 py-24 sm:px-8">
    <style>${CSS}</style>
    <header class="swa-top">
      <h2 id="sw-title" class="swa-h2">Selected Work</h2>
      <p class="swa-kicker">${work.length} Case Studies · ${y0} – now</p>
    </header>
    ${ruler}
    <ol class="swa-list">${rows}</ol>
  </section>`;
}

const variant: Variant = {
  name: "Ruled index",
  mount(root, { work }) {
    root.insertAdjacentHTML("beforeend", render(work, new Date()));
    const section = root.lastElementChild!;
    return () => section.remove();
  },
};

export default variant;

const CSS = /* css */ `
.swa { --rule: color-mix(in oklab, var(--border) 70%, transparent); }
.swa-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .25rem 1.5rem; }
.swa-h2 { font-family: var(--font-serif); font-size: clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem); line-height: 1; letter-spacing: -.01em; color: var(--text); }
.swa-kicker { font-family: var(--font-mono); font-size: 12px; color: var(--faint); }

/* The ruler: year ticks over the full column. Its grid lines run down through every row. */
.swa-ruler { position: relative; height: 1.75rem; margin-top: 2.5rem; border-bottom: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 11px; color: var(--faint); }
.swa-tick { position: absolute; bottom: .4rem; transform: translateX(-50%); white-space: nowrap; }
.swa-tick:first-child { transform: none; }
.swa-tick::after { content: ""; position: absolute; left: 50%; bottom: -.4rem; height: 5px; border-left: 1px solid var(--border); }
.swa-tick:first-child::after { left: 0; }
.swa-now { color: var(--text); }
.swa-now::before { content: ""; display: inline-block; width: 5px; height: 5px; margin-right: 4px; border-radius: 50%; background: currentColor; vertical-align: 1px; }
.swa-short { display: none; }
@media (max-width: 520px) { .swa-long { display: none; } .swa-short { display: inline; } }

/* One row: number, head, body; its track (the divider) is its period on the ruler. */
.swa-row { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); padding-top: 2.25rem; }
@media (min-width: 900px) { .swa-row { grid-template-columns: 3.5rem minmax(0, 3fr) minmax(0, 2fr); column-gap: 3rem; padding-top: 2.75rem; } }
.swa-num { position: absolute; top: 2.25rem; right: 0; font-family: var(--font-mono); font-size: 11px; color: var(--faint); transition: color .2s; }
@media (min-width: 900px) { .swa-num { position: static; font-size: 13px; padding-top: .35rem; } }
.swa-meta { font-family: var(--font-mono); font-size: 11px; letter-spacing: .02em; color: var(--faint); }
.swa-title { margin-top: .4rem; font-family: var(--font-serif); font-size: clamp(1.6rem, 1.15rem + 1.9vw, 2.6rem); line-height: 1.08; letter-spacing: -.01em; color: var(--text); text-wrap: balance; }
.swa-title a { color: inherit; text-decoration: none; transition: color .2s; }
/* The title link covers the whole row, so the row is one target. */
.swa-title a::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.swa-title a:focus-visible { outline: none; }
.swa-role { margin-top: .6rem; font-size: 14px; color: var(--muted); }
.swa-body { margin-top: 1rem; }
@media (min-width: 900px) { .swa-body { grid-column: 3; margin-top: 1.55rem; } }
.swa-summary { font-size: 15px; line-height: 1.6; color: var(--muted); max-width: 46ch; }
.swa-links { display: flex; flex-wrap: wrap; gap: .25rem 1.25rem; margin-top: .75rem; font-family: var(--font-mono); font-size: 12px; }
.swa-read { margin-left: auto; color: var(--hue); opacity: 0; transition: opacity .2s; }
@media (hover: none) { .swa-read { display: none; } }
@media (hover: hover) { .swa-links { min-height: 1.25rem; } }
.swa-ext { position: relative; z-index: 2; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--border); }
.swa-ext:hover { color: var(--text); }
.swa-ext:focus-visible { outline: 2px solid var(--hue); outline-offset: 3px; border-radius: 2px; }

.swa-draft { display: inline-block; vertical-align: .55em; margin-left: .35rem; padding: .1rem .45rem; border: 1px dashed var(--peach); border-radius: 3px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .04em; color: var(--peach); line-height: 1.4; }

.swa-track { grid-column: 1 / -1; position: relative; height: 2.5rem; margin-top: 1.25rem; border-bottom: 1px solid var(--border);
  /* Year ticks, repeated from the ruler at the foot of every track, so the spans read against one scale. */
  background: linear-gradient(to right, var(--border) 1px, transparent 1px) 0 100% / var(--yr) 40% repeat-x; }
.swa-when { position: absolute; bottom: .7rem; white-space: nowrap; font-family: var(--font-mono); font-size: 11px; color: var(--hue); }
.swa-bar { position: absolute; bottom: -3px; height: 6px; border-radius: 3px; background: var(--hue); transform-origin: left center;
  transition: scale .25s, box-shadow .25s; }
/* Still running: the span fades into "now" instead of stopping at it. */
.swa-row.is-open .swa-bar { border-radius: 3px 0 0 3px; background: linear-gradient(90deg, var(--hue) 70%, color-mix(in oklab, var(--hue) 25%, transparent)); }
/* Not cleared yet: the span is drawn dashed, like the mark on its title. */
.swa-row.is-draft .swa-bar { background: repeating-linear-gradient(90deg, var(--hue) 0 7px, transparent 7px 11px); }

/* Calm focus: the row's span lifts and glows, the title takes its hue, the "read" cue fades in. No layout moves. */
.swa-row:hover .swa-bar, .swa-row:has(.swa-title a:focus-visible) .swa-bar { scale: 1 1.6; box-shadow: 0 0 14px color-mix(in oklab, var(--hue) 55%, transparent); }
.swa-row:hover .swa-title a, .swa-row:has(.swa-title a:focus-visible) .swa-title a { color: var(--hue); }
.swa-row:hover .swa-num, .swa-row:has(.swa-title a:focus-visible) .swa-num { color: var(--hue); }
.swa-row:hover .swa-read, .swa-row:has(.swa-title a:focus-visible) .swa-read { opacity: 1; }
/* The focus ring sits inside the row's own box (a row starts flush under the previous row's track). */
.swa-row::before { content: ""; position: absolute; inset: .75rem -.75rem -.5rem; border: 2px solid var(--hue); border-radius: 6px; opacity: 0; pointer-events: none; }
.swa-row:has(.swa-title a:focus-visible)::before { opacity: 1; }

/* Scroll-driven, CSS only: each span draws itself in as its row enters. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .swa-bar { animation: swa-draw linear both; animation-timeline: view(); animation-range: entry 0% cover 12%; }
    .swa-when { animation: swa-fade linear both; animation-timeline: view(); animation-range: entry 0% cover 12%; }
  }
}
@media (prefers-reduced-motion: reduce) { .swa * { transition: none !important; } }
@keyframes swa-draw { from { clip-path: inset(-24px 100% -24px -24px); } to { clip-path: inset(-24px -24px -24px -24px); } }
@keyframes swa-fade { from { opacity: 0; } to { opacity: 1; } }
`;
