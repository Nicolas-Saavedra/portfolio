// PROTOTYPE: throwaway. Variant C's CSS: D's graph pieces and scroll staging (copied from `timeline/variants/d/style.ts`,
// prefix `wh-c-`), H's readout typography and motion (copied from `selected-work/variants/h-split-readout.ts`), and the
// dock: which readout shows is driven by the rows' view timelines, through `timeline-scope` and a style query.
// The per-row and per-readout rules are generated only because the prototype mounts from TS; on the real site they
// are a static stylesheet written at build time from the same content.

const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
/** The marker line, as a fraction of the viewport from its top. The row crossing it docks its readout. */
const LINE = 50;
const BP = 1024;

export function css(nRows: number, docks: { key: string; rows: number[] }[], spans: { slug: string; spans: number[] }[]): string {
  const R = (i: number) => `--wh-c-r${i}`;
  const all = Array.from({ length: nRows }, (_, i) => i);
  const on = (rows: number[], name: string) =>
    rows.length
      ? `animation:${rows.map(() => `${name} linear none`).join(",")};animation-timeline:${rows.map(R).join(",")};animation-range:cover 0% cover 100%`
      : "animation:none";
  /** The rest state hides while any row whose readout isn't `keep` is on the line. */
  const restOff = (keep: (k: string) => boolean) =>
    on(
      all.filter((i) => !keep(docks.find((d) => d.rows.includes(i))?.key ?? "rest")),
      "wh-c-off",
    );
  const csKeys = new Set(spans.map((s) => s.slug));

  const perDock = docks
    .filter((d) => d.key !== "rest")
    .map((d) => `#wh-c .wh-c-item[data-dock="${d.key}"]{${on(d.rows, "wh-c-on")}}`)
    .join("\n");
  // The span you're on lights up, and so does a fact its role's highlights say (Teaching: 40+ is the tutor's, 150+ the
  // instructor's). Both are paint only.
  const perSpan = spans
    .flatMap((s) => s.spans.filter((r) => r >= 0).map((r) => `#wh-c .wh-c-span[data-r="${r}"]{${on([r], "wh-c-lit")}}`))
    .join("\n");
  const perFact = all.map((r) => `#wh-c .wh-c-fact[data-rows~="${r}"]{${on([r], "wh-c-factlit")}}`).join("\n");
  const perRow = all
    .map((r) => `#wh-c .wh-c-row[data-r="${r}"]{view-timeline-name:${R(r)};view-timeline-inset:${LINE}% calc(${100 - LINE}% - 1px)}
#wh-c .wh-c-row[data-r="${r}"] > .wh-c-g:last-child .wh-c-card{${on([r], "wh-c-here")}}`)
    .join("\n");

  const D = `@media (min-width:${BP}px)`;
  const P = `@media (max-width:${BP - 0.02}px)`;
  return `
/* ── D's graph ─────────────────────────────────────────────────────────────────────────────────────────────── */
.wh-c-seg { position: absolute; width: 2px; margin-left: -1px; transition: opacity .2s ease; }
.wh-c-seg[data-s="active"] { background: var(--c); }
.wh-c-seg[data-s="idle"] { background: repeating-linear-gradient(to bottom, var(--c) 0 2px, transparent 2px 7px); opacity: .8; }
.wh-c-seg[data-s="next"] { background: repeating-linear-gradient(to bottom, var(--green) 0 4px, transparent 4px 8px); }
.wh-c-curve { position: absolute; left: 0; overflow: visible; fill: none; stroke-width: 2px; transition: opacity .2s ease; }
.wh-c-node { position: absolute; width: 12px; height: 12px; border-radius: 999px; translate: -50% -50%;
  background: var(--c); box-shadow: 0 0 0 3px var(--bg); transition: scale .2s ease, box-shadow .2s ease; }
.wh-c-node[data-n="tip"] { width: 13px; height: 13px; background: var(--bg); border: 2px solid var(--c); }
.wh-c-node[data-n="edu"] { width: 11px; height: 11px; border-radius: 2px; rotate: 45deg; }
.wh-c-node[data-n="root"] { width: 8px; height: 8px; }
.wh-c-node[data-n="span"] { width: 10px; height: 10px; background: var(--bg); border: 2px solid var(--c); }
.wh-c-node[data-n="next"] { width: 18px; height: 18px; background: var(--bg); border: 2px dashed var(--green); }
.wh-c-card { transition: background-color .2s ease; }
.wh-c-row:hover .wh-c-node, .wh-c-row:focus-within .wh-c-node {
  scale: 1.2; box-shadow: 0 0 0 3px var(--bg), 0 0 0 7px color-mix(in srgb, var(--c) 30%, transparent); }
.wh-c-row:hover .wh-c-card, .wh-c-row:focus-within .wh-c-card { background-color: color-mix(in srgb, var(--c) 7%, transparent); }
.wh-c:has(.wh-c-row[data-lane="engineering"]:hover) :is(.wh-c-seg, .wh-c-curve):not([data-lane="engineering"]),
.wh-c:has(.wh-c-row[data-lane="teaching"]:hover) :is(.wh-c-seg, .wh-c-curve):not([data-lane="teaching"]),
.wh-c:has(.wh-c-row[data-lane="education"]:hover) :is(.wh-c-seg, .wh-c-curve):not([data-lane="education"]) { opacity: .3; }
.wh-c-more > summary { list-style: none; }
.wh-c-more > summary::-webkit-details-marker { display: none; }
.wh-c-more[open] { flex-basis: 100%; }
.wh-c-more[open] > summary { color: var(--text); }
.wh-c-cmd { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; }
.wh-c-caret { display: inline-block; width: .6ch; height: 1.1em; vertical-align: -.2em; background: var(--lavender); opacity: .7; }
.wh-c-list { list-style: none; margin: 0; padding: 0; }
/* Cards settle in from 14px right; mid-settle they'd poke past a phone's edge. clip, not hidden: no scroll container,
   so the dock stays sticky. */
#wh-c { overflow-x: clip; }
/* An index link lands its row on the marker line, so the readout docks. */
.wh-c-row { scroll-margin-top: ${LINE}vh; }
${D}{ .wh-c-cslink { position: absolute; right: .75rem; top: .5rem; } }

/* ── The dock: frames and H's readout type ─────────────────────────────────────────────────────────────────── */
#wh-c .wh-c-frame { --pad: 1.5rem; border: 1px solid color-mix(in srgb, var(--hue, var(--lavender)) 30%, var(--border)); border-radius: .5rem; background: var(--surface); }
#wh-c .wh-c-head { display: flex; flex-wrap: wrap; align-items: center; column-gap: .75rem; row-gap: .25rem; padding: .625rem var(--pad);
  border-bottom: 1px solid var(--border); font-family: ${MONO}; font-size: 12px; line-height: 1.25rem; color: var(--faint); }
#wh-c .wh-c-ph { display: none; }
#wh-c .wh-c-draftmark { font-size: 11px; color: var(--peach); padding: 0 .375rem; border: 1px dashed color-mix(in srgb, var(--peach) 60%, transparent); border-radius: 4px; }
#wh-c .wh-c-titles { padding: .875rem var(--pad) 0; }
#wh-c .wh-c-titles h3 { font-size: 1.375rem; }
#wh-c .wh-c-spans { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem; margin: .625rem var(--pad) 0; padding: 0; list-style: none;
  font-family: ${MONO}; font-size: 11.5px; line-height: 1.25rem; }
#wh-c .wh-c-span { padding: 0 .5rem; border: 1px solid var(--border); border-radius: 9999px; color: var(--muted); }
#wh-c .wh-c-arrow { color: var(--faint); }
#wh-c .wh-c-norole { color: var(--sky); }
#wh-c .wh-c-trace { position: relative; list-style: none; padding: 0; margin: 1.125rem var(--pad) 0; }
#wh-c .wh-c-trace::before { content: ""; position: absolute; left: 3.25px; top: 12px; bottom: 10px; width: 1.5px;
  background: color-mix(in srgb, var(--hue) 45%, var(--border)); transform-origin: top; }
#wh-c .wh-c-step { position: relative; padding: 0 0 .75rem 1.25rem; }
#wh-c .wh-c-step:last-child { padding-bottom: 0; }
#wh-c .wh-c-dot { position: absolute; left: 0; top: 5px; width: .5rem; height: .5rem; border-radius: 9999px; background: var(--hue); }
#wh-c .wh-c-steplabel { display: block; font-family: ${MONO}; font-size: 11px; line-height: 1rem; letter-spacing: .05em; text-transform: uppercase; color: var(--faint); }
#wh-c .wh-c-steptext { margin-top: .2rem; font-size: 14px; line-height: 1.55; color: var(--text); }
#wh-c .wh-c-ev { display: grid; grid-template-columns: minmax(0, 1fr) 8.5rem; column-gap: 1.25rem; align-items: start; margin: 1.125rem var(--pad) 0; padding-bottom: 1.25rem; }
#wh-c .wh-c-facts { display: grid; row-gap: .875rem; margin: 0; padding-top: .25rem; color: var(--text); }
#wh-c .wh-c-fv { font-size: 1.125rem; color: inherit; }
#wh-c .wh-c-read { margin-left: auto; font-family: inherit; font-size: 14px; line-height: 1.25rem; }
#wh-c .wh-c-side { display: grid; row-gap: .875rem; align-content: start; }
#wh-c .wh-c-out { display: grid; row-gap: .25rem; }
#wh-c .wh-c-link { border-radius: 2px; }
#wh-c .wh-c-link:hover { text-decoration-color: var(--hue); }
#wh-c .wh-c-link:focus-visible, #wh-c .wh-c-ix:focus-visible { outline: 2px solid var(--lavender); outline-offset: 3px; }
#wh-c .wh-c-role { padding: 1.125rem var(--pad) 1.375rem; }
/* The rest state: the Case Studies as an index, like H's rail. */
#wh-c .wh-c-index { list-style: none; margin: 0; padding: .5rem calc(var(--pad) - .5rem) 0; }
#wh-c .wh-c-ix { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); column-gap: .875rem; align-items: start; padding: .625rem .5rem; border-radius: 6px; }
#wh-c .wh-c-q { position: relative; display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 9999px; font-family: ${MONO}; font-size: 12px;
  border: 1.5px solid var(--hue); color: var(--muted); background: var(--bg); transition: box-shadow .2s ease; }
#wh-c .wh-c-q.wh-c-dashed { border-style: dashed; }
#wh-c .wh-c-q.wh-c-running::after { content: ""; position: absolute; inset: 3px; border-radius: 9999px; border: 1px solid var(--hue); opacity: .7; }
#wh-c .wh-c-ix:hover .wh-c-q { box-shadow: 0 0 0 6px color-mix(in srgb, var(--hue) 14%, transparent); }
#wh-c .wh-c-ixt { display: grid; row-gap: .125rem; min-width: 0; }
#wh-c .wh-c-ixtitle { font-size: 15px; font-weight: 500; color: var(--text); }
#wh-c .wh-c-ixsum { font-size: 13px; line-height: 1.45; color: var(--muted); }
#wh-c .wh-c-hint { margin: .5rem var(--pad) 0; padding: .75rem 0 1.125rem; border-top: 1px solid var(--border); font-family: ${MONO}; font-size: 11px; line-height: 1.5; color: var(--faint); }
#wh-c .wh-c-otw { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem; padding: .5rem .75rem .5rem 1rem;
  border: 1px solid color-mix(in srgb, var(--green) 40%, var(--border)); border-radius: .5rem; background: var(--surface); }

/* ── Figures (H's) ─────────────────────────────────────────────────────────────────────────────────────────── */
#wh-c .wh-c-fig { margin: 0; display: flex; flex-direction: column; gap: .5rem; min-width: 0; --line: color-mix(in srgb, var(--hue) 60%, var(--faint)); }
#wh-c .wh-c-plate { display: grid; place-items: center; padding: .5rem .375rem; border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--hue) 28%, var(--border)); background: color-mix(in srgb, var(--surface) 55%, var(--bg)); }
#wh-c .wh-c-fig figcaption { font-family: ${MONO}; font-size: 11px; line-height: 1.5; color: var(--faint); }
#wh-c svg:not(.wh-c-curve) { display: block; width: 100%; height: auto; overflow: visible; }
#wh-c .ln { fill: none; stroke: var(--line); stroke-width: 1.25; stroke-linecap: round; }
#wh-c .dash { stroke-dasharray: 2 4; }
#wh-c .nd { fill: var(--bg); stroke: var(--line); stroke-width: 1.25; }
#wh-c .ah { fill: var(--line); }
#wh-c .dot { fill: var(--line); stroke: none; }
#wh-c .lb { font-family: ${MONO}; font-size: 11px; fill: var(--muted); }
#wh-c .lb.strong { fill: var(--text); }
#wh-c .lb.dim { fill: var(--faint); }
#wh-c .spoke { stroke-width: .75; opacity: .7; }
#wh-c :is(.svc, .step), #wh-c .accept + .inner { fill: color-mix(in srgb, var(--hue) 35%, var(--bg)); }
#wh-c .comet { fill: none; stroke: var(--hue); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: .05 2; stroke-dashoffset: .05; opacity: 0; }

/* ── Layout ─────────────────────────────────────────────────────────────────────────────────────────────────── */
/* Its column ramps from 30rem at 1024 to 33rem
   at 1152, where max-w-6xl caps the content. A dock narrower than that puts the facts under the figure (container query). */
#wh-c .wh-c-grid { padding-bottom: 4rem; }
/* Desktop: the graph scrolls on the left; the dock sticks on the right. The grid has an empty 8rem row under the list:
   sticky stays inside the grid's content box (padding doesn't count), and that row is what keeps GOLD's readout, docked
   by the second-to-last commit, whole on screen while its row is read. */
${D}{
  #wh-c .wh-c-grid { padding-bottom: 2rem; display: grid; grid-template-rows: auto 8rem; grid-template-columns: minmax(0, 1fr) minmax(0, clamp(30rem, 37.5vw + 6rem, 33rem)); column-gap: 2.5rem; align-items: start; }
  #wh-c .wh-c-list { grid-area: 1 / 1; }
  #wh-c .wh-c-dock { grid-area: 1 / 2; position: sticky; top: 1.5rem; container-type: inline-size; }
  #wh-c .wh-c-otw { margin-bottom: .75rem; }
}
@container (max-width: 29rem) {
  #wh-c .wh-c-ev { grid-template-columns: minmax(0, 1fr); row-gap: 1rem; }
  #wh-c .wh-c-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 1.25rem; padding-top: 0; }
}
/* Below BP: the dock is a strip stuck to the bottom of the screen: which Case Study, its facts, its link. The role
   readouts don't exist here (their rows carry everything, with "+N more"); on those rows the strip shows the index. */
${P}{
  /* Each readout is its own box, bottom-aligned, so a short one leaves no empty strip; with Open to Work the CV bar
     sits under it, always there. */
  #wh-c .wh-c-dock { position: sticky; bottom: .5rem; z-index: 2; margin-top: 1rem; display: flex; flex-direction: column; row-gap: .25rem; }
  #wh-c .wh-c-otw, #wh-c .wh-c-frame { border: 1px solid var(--border); border-radius: .5rem; background: var(--surface);
    box-shadow: 0 8px 24px -6px rgb(0 0 0 / .3); }
  #wh-c .wh-c-otw { order: 2; padding: .375rem .375rem .375rem .75rem; }
  #wh-c .wh-c-otw a { padding: .25rem .5rem; }
  #wh-c .wh-c-item { align-self: end; }
  #wh-c .wh-c-item[data-kind="role"] { display: none; }
  #wh-c .wh-c-frame { --pad: .75rem; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: .75rem; align-items: center;
    padding: .5rem .75rem .625rem; }
  #wh-c .wh-c-head { grid-column: 1 / -1; padding: 0; border: 0; color: var(--muted); }
  #wh-c .wh-c-dk, #wh-c :is(.wh-c-spans, .wh-c-trace, .wh-c-fig, .wh-c-hint, .wh-c-out) { display: none; }
  #wh-c .wh-c-ph { display: inline; }
  #wh-c .wh-c-titles { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; padding: 0; }
  #wh-c .wh-c-ev { grid-column: 1 / -1; display: block; margin: .25rem 0 0; padding: 0; }
  #wh-c .wh-c-facts { display: flex; flex-wrap: wrap; gap: .125rem 1rem; padding: 0; }
  #wh-c .wh-c-fact { display: flex; align-items: baseline; gap: .375rem; }
  #wh-c .wh-c-fv { font-size: 14px; }
  #wh-c .wh-c-fl { margin: 0; }
  #wh-c .wh-c-item[data-dock="rest"] .wh-c-frame { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .875rem; }
  #wh-c .wh-c-index { display: contents; }
  #wh-c .wh-c-ix { display: block; padding: 0; font-size: 14px; color: var(--text); text-decoration: underline; text-decoration-color: var(--hue); text-underline-offset: 4px; }
  #wh-c .wh-c-q, #wh-c .wh-c-ixsum { display: none; }
  #wh-c .wh-c-ixtitle { font-size: 14px; font-weight: 400; }
}

/* ── Which readout shows (needs scroll-driven animations and timeline-scope; see the fallback below) ────────── */
@property --wh-c-live { syntax: "on | off"; inherits: true; initial-value: off; }
@keyframes wh-c-on { from, to { --wh-c-live: on; } }
@keyframes wh-c-off { from, to { --wh-c-live: off; } }
@keyframes wh-c-lit { from, to { color: var(--text); border-color: var(--hue); background-color: color-mix(in srgb, var(--hue) 14%, transparent); } }
@keyframes wh-c-factlit { from, to { color: var(--hue); } }
@keyframes wh-c-here { from, to { background-color: color-mix(in srgb, var(--c) 6%, transparent); box-shadow: inset 2px 0 0 var(--c); } }
@supports (timeline-scope: --a) and (animation-timeline: view()) {
  #wh-c { timeline-scope: ${all.map(R).join(", ")}; }
  ${perRow}
  #wh-c .wh-c-stack { display: grid; }
  #wh-c .wh-c-item { grid-area: 1 / 1; min-width: 0; }
  #wh-c .wh-c-inner { visibility: hidden; opacity: 0; }
  @container style(--wh-c-live: on) { #wh-c .wh-c-inner { visibility: visible; opacity: 1; } }
  ${perDock}
  #wh-c .wh-c-item[data-dock="rest"] { --wh-c-live: on; ${restOff((k) => k === "rest")}; }
  ${P}{ #wh-c .wh-c-item[data-dock="rest"] { ${restOff((k) => !csKeys.has(k))}; } }
  ${perSpan}
  ${perFact}

  /* Motion: a docking readout fades in while the leaving one fades out (they share the cell), then H's trace steps
     rise and the figure draws once. It re-runs each time a readout docks again; the switch itself is never animated
     under reduced motion. */
  @media (prefers-reduced-motion: no-preference) {
    #wh-c .wh-c-inner { transition: opacity .25s ease, visibility .25s; }
    @container style(--wh-c-live: on) {
      #wh-c .wh-c-step { animation: wh-c-in .42s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--k) * 90ms); }
      #wh-c .wh-c-trace::before { animation: wh-c-grow .5s cubic-bezier(.2,.7,.2,1) both; }
      #wh-c .draw { stroke-dasharray: 1; animation: wh-c-draw .8s cubic-bezier(.3,.6,.2,1) both; }
      #wh-c :is(.nd, .dot, .ah, .dash, .spoke) { animation: wh-c-fade .45s ease-out both; }
      #wh-c :is(.svc, .step) { animation: wh-c-fade .3s ease-out both; animation-delay: calc(.35s + var(--i) * 45ms); }
      #wh-c .accept + .inner { animation: wh-c-fade .35s ease-out 1.9s both; }
      #wh-c .comet { animation: wh-c-comet 1.3s cubic-bezier(.45,0,.25,1) both; animation-delay: calc(.7s + var(--d, 0ms)); }
    }
  }
}
/* No scroll timelines: the dock isn't sticky, and every Case Study's readout follows the graph in normal flow. */
@supports not ((timeline-scope: --a) and (animation-timeline: view())) {
  #wh-c .wh-c-dock { position: static; }
  #wh-c .wh-c-item:not([data-kind="cs"]) { display: none; }
  #wh-c .wh-c-item + .wh-c-item { margin-top: 1rem; }
}

/* ── D's scroll staging, as rows rise (motion only) ────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .wh-c-anim .wh-c-g { view-timeline-name: --wh-c-g; }
    .wh-c-anim .wh-c-lanes { animation: wh-c-lanes linear forwards; animation-timeline: --wh-c-g; animation-range: cover 0% contain 120px; }
    .wh-c-anim .wh-c-node { animation: wh-c-pop linear forwards; animation-timeline: --wh-c-g; animation-range: cover 0% cover 150px; }
    .wh-c-anim .wh-c-in { animation: wh-c-settle linear forwards; animation-timeline: --wh-c-g; animation-range: cover 0% cover 150px; }
    .wh-c-anim .wh-c-cmd { animation: wh-c-type forwards; animation-timeline: view(); animation-range: entry 0% cover 30%; }
  }
}
@keyframes wh-c-lanes { from { clip-path: inset(0 0 calc(100% + 120px) 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes wh-c-pop { 0%, 66% { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: none; } }
@keyframes wh-c-settle { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes wh-c-type { from { width: 0; } }
@keyframes wh-c-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes wh-c-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes wh-c-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes wh-c-fade { from { opacity: 0; } }
@keyframes wh-c-comet { 0% { stroke-dashoffset: .05; opacity: 0; } 8% { opacity: 1; } 88% { opacity: 1; } 100% { stroke-dashoffset: -1; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  #wh-c .wh-c-seg, #wh-c .wh-c-curve, #wh-c .wh-c-node, #wh-c .wh-c-card, #wh-c .wh-c-inner, #wh-c .wh-c-q { transition: none; }
}

/* ── Open to Work: depth collapses to the outcome; dates and the CV come forward (the dock carries the CV). ── */
.wh-c-otwon .wh-c-step:not([data-step="outcome"]) { display: none; }
`;
}
