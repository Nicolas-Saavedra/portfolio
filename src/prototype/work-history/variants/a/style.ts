// PROTOTYPE: throwaway. Variant A's CSS, injected as one <style> inside the section. Three parts:
//   1. Timeline D's graph (timeline/variants/d/style.ts, `tld-` renamed `wa-`): lanes, nodes, calm focus, sticky years,
//      the "+N more" disclosure and the scroll-driven staging. Unchanged but for the Case Study ring on nodes.
//   2. Selected Work H's readout (h-split-readout.ts), reflowed for an inline panel: a container query, not a
//      breakpoint, picks trace | evidence or a single column, since the card column's width varies by layout.
//   3. Opening. One checkbox per Case Study; `#wh-a:has(#wa-cb-<slug>:checked)` opens its readout (grid rows
//      0fr → 1fr, visibility), flips the toggles' wording and hides the highlights of every row of that Case Study, so a
//      count is never printed in both. In production these per-slug rules are static: four Case Studies, four groups.

const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

const GRAPH = `
#wh-a .wa-seg { position: absolute; width: 2px; margin-left: -1px; transition: opacity .2s ease; }
#wh-a .wa-seg[data-s="active"] { background: var(--c); }
#wh-a .wa-seg[data-s="idle"] { background: repeating-linear-gradient(to bottom, var(--c) 0 2px, transparent 2px 7px); opacity: .8; }
#wh-a .wa-seg[data-s="next"] { background: repeating-linear-gradient(to bottom, var(--green) 0 4px, transparent 4px 8px); }
#wh-a .wa-curve { position: absolute; left: 0; overflow: visible; fill: none; stroke-width: 2px; transition: opacity .2s ease; }

#wh-a .wa-node { position: absolute; width: 12px; height: 12px; border-radius: 999px; translate: -50% -50%;
  background: var(--c); box-shadow: 0 0 0 3px var(--bg); transition: scale .2s ease, box-shadow .2s ease; }
#wh-a .wa-node[data-n="tip"] { width: 13px; height: 13px; background: var(--bg); border: 2px solid var(--c); }
#wh-a .wa-node[data-n="edu"] { width: 11px; height: 11px; border-radius: 2px; rotate: 45deg; }
#wh-a .wa-node[data-n="root"] { width: 8px; height: 8px; }
#wh-a .wa-node[data-n="next"] { width: 18px; height: 18px; background: var(--bg); border: 2px dashed var(--green); }
/* A commit with a Case Study wears a ring: the dot, a gap, then a thin ring in its lane colour. */
#wh-a .wa-node[data-n="cs"] { width: 10px; height: 10px; box-shadow: 0 0 0 2.5px var(--bg), 0 0 0 4px var(--c), 0 0 0 6px var(--bg); }
#wh-a .wa-keyring { display: inline-block; width: 8px; height: 8px; margin: 0 5px; vertical-align: 0; border-radius: 999px; background: var(--faint);
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.25px var(--faint); }

/* Calm focus: the hovered or focused row's node glows, its card tints, and the other lanes step back. */
#wh-a .wa-card { transition: background-color .2s ease; }
#wh-a .wa-row:hover .wa-node, #wh-a .wa-row:focus-within .wa-node {
  scale: 1.2; box-shadow: 0 0 0 3px var(--bg), 0 0 0 7px color-mix(in srgb, var(--c) 30%, transparent); }
#wh-a .wa-row:hover .wa-node[data-n="cs"], #wh-a .wa-row:focus-within .wa-node[data-n="cs"] {
  box-shadow: 0 0 0 2.5px var(--bg), 0 0 0 4px var(--c), 0 0 0 8px color-mix(in srgb, var(--c) 28%, transparent); }
#wh-a .wa-row:hover > article > .wa-card, #wh-a .wa-row:focus-within > article > .wa-card,
#wh-a .wa-row:hover > div > .wa-card { background: color-mix(in srgb, var(--c) 7%, transparent); }
#wh-a:has(.wa-row[data-lane="engineering"]:hover) :is(.wa-seg, .wa-curve):not([data-lane="engineering"]),
#wh-a:has(.wa-row[data-lane="teaching"]:hover) :is(.wa-seg, .wa-curve):not([data-lane="teaching"]),
#wh-a:has(.wa-row[data-lane="education"]:hover) :is(.wa-seg, .wa-curve):not([data-lane="education"]) { opacity: .3; }

#wh-a .wa-yr { color: transparent; -webkit-text-stroke: 1px var(--faint); font-variant-numeric: lining-nums tabular-nums; }
#wh-a .wa-more > summary { list-style: none; }
#wh-a .wa-more > summary::-webkit-details-marker { display: none; }
#wh-a .wa-more[open] { flex-basis: 100%; }
#wh-a .wa-more[open] > summary { color: var(--text); }

#wh-a .wa-cmd { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; }
#wh-a .wa-caret { display: inline-block; width: .6ch; height: 1.1em; vertical-align: -.2em; background: var(--lavender); opacity: .7; }

/* Open to Work: dates step up from faint to text, for the scan. */
#wh-a.wa-otw .wa-when { color: var(--text); }
`;

const READOUT = `
#wh-a { --pad: .875rem; }
@media (min-width: 640px) { #wh-a { --pad: 1.5rem; } }

/* The checkbox: visually hidden at the top of its opener row, so a label clicked further down scrolls up to it. */
#wh-a .wa-cb { position: absolute; top: 0; left: 0; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; scroll-margin-top: 1.5rem; }

/* Toggles. Mono, lavender like D's case-study link; the wording swaps when open. Reserved: both wordings are one line. */
#wh-a .wa-tog { cursor: pointer; border-radius: 2px; font-family: ${MONO}; font-size: 12px; line-height: 1rem; color: var(--lavender); }
#wh-a .wa-tog:hover { text-decoration: underline; text-underline-offset: 4px; }
#wh-a .wa-tog .wa-open { display: none; }
#wh-a .wa-row:has(.wa-cb:focus-visible) .wa-tog[data-opener] { outline: 2px solid var(--lavender); outline-offset: 3px; }
#wh-a .wa-close { cursor: pointer; margin-left: auto; border-radius: 2px; font-family: ${MONO}; font-size: 12px; color: var(--faint); }
#wh-a .wa-close:hover { color: var(--text); }

/* The readout's slot: collapsed to nothing until its checkbox is checked. visibility keeps it out of the tab order and
   the accessibility tree while closed. */
#wh-a .wa-ro { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .35s cubic-bezier(.2,.7,.2,1), visibility 0s linear .35s; }
#wh-a .wa-clip { min-height: 0; overflow: hidden; container-type: inline-size; }
#wh-a .wa-panel { margin: .875rem 0 .25rem; display: grid; grid-template-columns: minmax(0, 1fr); padding-bottom: 1.125rem;
  border: 1px solid color-mix(in srgb, var(--hue) 35%, var(--border)); border-radius: .5rem; background: var(--surface); }
#wh-a .wa-panel > * { margin-inline: var(--pad); }
#wh-a .wa-head { display: flex; flex-wrap: wrap; align-items: center; column-gap: .75rem; row-gap: .25rem; margin-top: .875rem;
  font-family: ${MONO}; font-size: 11.5px; line-height: 1.25rem; color: var(--faint); }
#wh-a .wa-draftmark { font-size: 11px; color: var(--peach); }
@media (min-width: 640px) { #wh-a .wa-draftmark { padding: 0 .375rem; border: 1px dashed color-mix(in srgb, var(--peach) 60%, transparent); border-radius: 4px; } }
#wh-a .wa-title { margin-top: .25rem; font-size: 1.3rem; }

/* The span strip: one Case Study across several rows (Teaching: two roles; GOLD → mercury: a role, then the thesis). */
#wh-a .wa-spans { list-style: none; margin-top: .5rem; padding: 0; display: flex; flex-wrap: wrap; align-items: baseline; column-gap: .5rem; row-gap: .25rem;
  font-family: ${MONO}; font-size: 11.5px; line-height: 1.25rem; color: var(--muted); }
#wh-a .wa-span { display: inline; }
#wh-a .wa-sdot { display: inline-block; width: 7px; height: 7px; margin-right: .4rem; border-radius: 999px; background: var(--c); vertical-align: 1px; }
#wh-a .wa-sdot.wa-sdia { border-radius: 1px; rotate: 45deg; }
#wh-a .wa-sarrow { color: var(--faint); margin-right: .5rem; }

#wh-a .wa-trace { position: relative; list-style: none; padding: 0; margin-top: 1rem; }
#wh-a .wa-trace::before { content: ""; position: absolute; left: 3.25px; top: 12px; bottom: 10px; width: 1.5px;
  background: color-mix(in srgb, var(--hue) 45%, var(--border)); transform-origin: top; }
#wh-a .wa-step { position: relative; padding: 0 0 .875rem 1.25rem; }
#wh-a .wa-step:last-child { padding-bottom: 0; }
#wh-a .wa-dot { position: absolute; left: 0; top: 5px; width: .5rem; height: .5rem; border-radius: 9999px; background: var(--hue); }
#wh-a .wa-steplabel { display: block; font-family: ${MONO}; font-size: 11px; line-height: 1rem; letter-spacing: .05em; text-transform: uppercase; color: var(--faint); }
#wh-a .wa-steptext { margin-top: .2rem; font-size: 14px; line-height: 1.55; color: var(--text); }

#wh-a .wa-fig { margin-top: 1.125rem; margin-bottom: 0; display: flex; flex-direction: column; gap: .5rem; min-width: 0;
  --line: color-mix(in srgb, var(--hue) 60%, var(--faint)); }
#wh-a .wa-plate { display: grid; place-items: center; padding: .6rem .5rem; border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--hue) 28%, var(--border)); background: color-mix(in srgb, var(--surface) 55%, var(--bg)); }
#wh-a .wa-fig figcaption { font-family: ${MONO}; font-size: 11px; line-height: 1.5; color: var(--faint); }
#wh-a .wa-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 1.25rem; row-gap: .75rem; margin-top: 1rem; }
#wh-a .wa-foot { margin-top: 1.125rem; padding-top: .75rem; border-top: 1px solid var(--border); }
#wh-a .wa-tech { font-family: ${MONO}; font-size: 11px; line-height: 1.25rem; color: var(--faint); }
#wh-a .wa-links { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 1.5rem; row-gap: .375rem; margin-top: .5rem; }
#wh-a .wa-link { border-radius: 2px; }
#wh-a .wa-link:hover { text-decoration-color: var(--hue); }
#wh-a .wa-link:focus-visible { outline: 2px solid var(--lavender); outline-offset: 3px; }

/* Figures (H's classes). */
#wh-a svg:not(.wa-curve) { display: block; width: 100%; height: auto; overflow: visible; }
#wh-a .ln { fill: none; stroke: var(--line); stroke-width: 1.25; stroke-linecap: round; }
#wh-a .dash { stroke-dasharray: 2 4; }
#wh-a .nd { fill: var(--bg); stroke: var(--line); stroke-width: 1.25; }
#wh-a .ah { fill: var(--line); }
#wh-a .dot { fill: var(--line); stroke: none; }
#wh-a .lb { font-family: ${MONO}; font-size: 11px; fill: var(--muted); }
#wh-a .lb.strong { fill: var(--text); }
#wh-a .lb.dim { fill: var(--faint); }
#wh-a .spoke { stroke-width: .75; opacity: .7; }
#wh-a :is(.svc, .step), #wh-a .accept + .inner { fill: color-mix(in srgb, var(--hue) 35%, var(--bg)); }
#wh-a .comet { fill: none; stroke: var(--hue); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: .05 2; stroke-dashoffset: .05; opacity: 0; }

/* Wide panel (the card column is 680 px or more: lg and up): H's desktop grid,
   trace | evidence, with the slack row so the facts sit right under the figure. */
@container (min-width: 680px) {
  #wh-a .wa-panel { grid-template-columns: var(--pad) minmax(0, 1fr) 1.75rem minmax(0, 18rem) var(--pad);
    grid-template-rows: [head] auto [title] auto [spans] auto [main] auto [facts] auto [slack] 1fr [foot] auto; }
  #wh-a .wa-panel > * { margin-inline: 0; }
  #wh-a .wa-head { grid-column: 2 / 5; grid-row: head; }
  #wh-a .wa-title { grid-column: 2 / 5; grid-row: title; }
  #wh-a .wa-spans { grid-column: 2 / 5; grid-row: spans; }
  #wh-a .wa-trace { grid-column: 2; grid-row: main / foot; }
  #wh-a .wa-fig { grid-column: 4; grid-row: main; margin-top: 1rem; }
  #wh-a .wa-plate { padding: .5rem .375rem; }
  #wh-a .wa-facts { grid-column: 4; grid-row: facts; }
  #wh-a .wa-foot { grid-column: 2 / 5; grid-row: foot; }
}
/* Mid panel: figure and facts side by side under the trace. */
@container (min-width: 440px) and (max-width: 679.98px) {
  #wh-a .wa-panel { grid-template-columns: minmax(0, 1fr) minmax(0, 11rem); column-gap: 1.25rem; }
  #wh-a .wa-panel > :is(.wa-head, .wa-title, .wa-spans, .wa-trace, .wa-foot) { grid-column: 1 / -1; }
  #wh-a .wa-facts { grid-template-columns: minmax(0, 1fr); align-content: start; margin-top: 1.125rem; }
}

/* Phones: the open panel takes the row's full width, over the graph column; the lanes pass behind it. */
@media (max-width: 639.98px) {
  #wh-a .wa-ro { margin-left: calc(-48px - .75rem); }
}
`;

/** Rules for one Case Study: what checking its box opens, and the motion that plays when it does. */
function perCaseStudy(slug: string) {
  const on = `#wh-a:has(#wa-cb-${slug}:checked)`;
  const rows = `${on} .wa-row[data-cs="${slug}"]`;
  const ro = `${on} .wa-ro[data-cs="${slug}"]`;
  return {
    open: `
${ro} { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows .35s cubic-bezier(.2,.7,.2,1), visibility 0s; }
${rows} .wa-hl { display: none; }
${rows} .wa-tog .wa-closed { display: none; }
${rows} .wa-tog .wa-open { display: inline; }
${rows} .wa-card { display: block; }
${on} .wa-row[data-cs="${slug}"]:has(.wa-cb) .wa-sum { display: none; }
${rows} .wa-node[data-n="cs"] { box-shadow: 0 0 0 2.5px var(--bg), 0 0 0 4px var(--c), 0 0 0 9px color-mix(in srgb, var(--c) 22%, transparent); }`,
    motion: `
${ro} .wa-step { animation: wa-up .42s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(.12s + var(--k) * 110ms); }
${ro} .wa-trace::before { animation: wa-grow .5s cubic-bezier(.2,.7,.2,1) .12s both; }
${ro} .draw { stroke-dasharray: 1; animation: wa-draw .8s cubic-bezier(.3,.6,.2,1) .2s both; }
${ro} :is(.nd, .dot, .ah, .dash, .spoke) { animation: wa-fade .45s ease-out .2s both; }
${ro} :is(.svc, .step) { animation: wa-fade .3s ease-out both; animation-delay: calc(.55s + var(--i) * 45ms); }
${ro} .accept + .inner { animation: wa-fade .35s ease-out 2.1s both; }
${ro} .comet { animation: wa-comet 1.3s cubic-bezier(.45,0,.25,1) both; animation-delay: calc(.9s + var(--d, 0ms)); }`,
  };
}

const STAGING = `
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .wa-anim .wa-row { view-timeline-name: --wa-row; }
    .wa-anim .wa-ygroup { view-timeline-name: --wa-y; view-timeline-inset: 100px calc(100% - 152px); }
    .wa-anim .wa-lanes { animation: wa-drawl linear forwards; animation-timeline: --wa-row; animation-range: cover 0% contain 120px; }
    @keyframes wa-drawl { from { clip-path: inset(0 0 calc(100% + 120px) 0); } to { clip-path: inset(0 0 0 0); } }
    .wa-anim .wa-node { animation: wa-pop linear forwards; animation-timeline: --wa-row; animation-range: cover 0% cover 150px; }
    @keyframes wa-pop { 0%, 66% { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: none; } }
    .wa-anim .wa-in { animation: wa-in linear forwards; animation-timeline: --wa-row; animation-range: cover 0% cover 150px; }
    @keyframes wa-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
    .wa-anim .wa-yr {
      animation: wa-lit linear both, wa-unlit linear forwards;
      animation-timeline: --wa-y, --wa-y;
      animation-range: entry 0% entry 100%, exit 0% exit 100%;
    }
    @keyframes wa-lit { from { color: transparent; -webkit-text-stroke-color: var(--faint); } to { color: var(--text); -webkit-text-stroke-color: var(--text); } }
    @keyframes wa-unlit { from { color: var(--text); -webkit-text-stroke-color: var(--text); } to { color: transparent; -webkit-text-stroke-color: var(--faint); } }
    .wa-anim .wa-cmd { animation: wa-type forwards; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    @keyframes wa-type { from { width: 0; } }

    /* H's view gate, per Case Study row: a readout that starts open (Blinka) waits at its first frame until its row's
       top is about 60 px into view, so its trace and figure play where the reader sees them. Later openings happen in
       view and run at once. A style query, because var() in animation-play-state is animation-tainted. */
    .wa-anim .wa-row[data-cs] { animation: wa-gate linear both; animation-timeline: view(); animation-range: entry 0px entry 120px; }
    @container style(--wa-play: paused) { .wa-anim .wa-panel * , .wa-anim .wa-panel *::before { animation-play-state: paused !important; } }
  }
}
@property --wa-play { syntax: "running | paused"; inherits: true; initial-value: running; }
@keyframes wa-gate { from { --wa-play: paused; } to { --wa-play: running; } }
@keyframes wa-up { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes wa-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes wa-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes wa-fade { from { opacity: 0; } }
@keyframes wa-comet { 0% { stroke-dashoffset: .05; opacity: 0; } 8% { opacity: 1; } 88% { opacity: 1; } 100% { stroke-dashoffset: -1; opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  #wh-a *, #wh-a *::before, #wh-a *::after { animation: none !important; transition: none !important; }
}
`;

export function css(slugs: string[]): string {
  const per = slugs.map(perCaseStudy);
  return `${GRAPH}${READOUT}
${per.map((p) => p.open).join("\n")}
@media (prefers-reduced-motion: no-preference) {
${per.map((p) => p.motion).join("\n")}
}
${STAGING}`;
}
