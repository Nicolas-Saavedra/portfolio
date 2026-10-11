// PROTOTYPE: throwaway. Variant D's own CSS: the graph pieces, calm focus, and the scroll-driven staging.
// Everything moving is CSS (`animation-timeline`), behind `prefers-reduced-motion: no-preference` and
// `@supports`; elsewhere the graph is simply drawn. Fill mode is `forwards`, never `both`: before its range
// starts an element is below the fold and shows its final state, so full-page screenshots and no-support
// browsers both see the finished graph.

export const STYLE = `
.tld-seg { position: absolute; width: 2px; margin-left: -1px; transition: opacity .2s ease; }
.tld-seg[data-s="active"] { background: var(--c); }
.tld-seg[data-s="idle"] { background: repeating-linear-gradient(to bottom, var(--c) 0 2px, transparent 2px 7px); opacity: .8; }
.tld-seg[data-s="next"] { background: repeating-linear-gradient(to bottom, var(--green) 0 4px, transparent 4px 8px); }
.tld-curve { position: absolute; left: 0; overflow: visible; fill: none; stroke-width: 2px; transition: opacity .2s ease; }

.tld-node { position: absolute; width: 12px; height: 12px; border-radius: 999px; translate: -50% -50%;
  background: var(--c); box-shadow: 0 0 0 3px var(--bg); transition: scale .2s ease, box-shadow .2s ease; }
.tld-node[data-n="tip"] { width: 13px; height: 13px; background: var(--bg); border: 2px solid var(--c); }
.tld-node[data-n="edu"] { width: 11px; height: 11px; border-radius: 2px; rotate: 45deg; }
.tld-node[data-n="root"] { width: 8px; height: 8px; }
.tld-node[data-n="next"] { width: 18px; height: 18px; background: var(--bg); border: 2px dashed var(--green); }

/* Calm focus: the hovered or focused row's node glows, its card tints, and the other lanes step back. */
.tld-card { transition: background-color .2s ease; }
.tld-row:hover .tld-node, .tld-row:focus-within .tld-node {
  scale: 1.2; box-shadow: 0 0 0 3px var(--bg), 0 0 0 7px color-mix(in srgb, var(--c) 30%, transparent); }
.tld-row:hover .tld-card, .tld-row:focus-within .tld-card { background: color-mix(in srgb, var(--c) 7%, transparent); }
.tld:has(.tld-row[data-lane="engineering"]:hover) :is(.tld-seg, .tld-curve):not([data-lane="engineering"]),
.tld:has(.tld-row[data-lane="teaching"]:hover) :is(.tld-seg, .tld-curve):not([data-lane="teaching"]),
.tld:has(.tld-row[data-lane="education"]:hover) :is(.tld-seg, .tld-curve):not([data-lane="education"]) { opacity: .3; }

/* The giant years: outlined; the one being read fills in as you scroll (below). */
.tld-yr { color: transparent; -webkit-text-stroke: 1px var(--faint); font-variant-numeric: lining-nums tabular-nums; }
.tld-cmd { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; }
.tld-caret { display: inline-block; width: .6ch; height: 1.1em; vertical-align: -.2em; background: var(--lavender); opacity: .7; }

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .tld-anim .tld-row { view-timeline-name: --tld-row; }
    .tld-anim .tld-ygroup { view-timeline-name: --tld-y; view-timeline-inset: 80px calc(100% - 170px); } /* a band around the sticky year (top-24) */

    /* The lanes draw downward (back in time) as each row rises to meet the reader. */
    .tld-anim .tld-lanes { animation: tld-draw linear forwards; animation-timeline: --tld-row; animation-range: entry 30% cover 35%; }
    @keyframes tld-draw { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }

    /* Nodes land, cards settle beside them. transform, so the calm-focus scale (the scale property) still works. */
    .tld-anim .tld-node { animation: tld-pop linear forwards; animation-timeline: --tld-row; animation-range: entry 30% entry 100%; }
    @keyframes tld-pop { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: none; } }
    .tld-anim .tld-in { animation: tld-in linear forwards; animation-timeline: --tld-row; animation-range: entry 10% cover 30%; }
    @keyframes tld-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }

    /* The year you're in (the group crossing the sticky year's band) fills; the others stay outlines. */
    .tld-anim .tld-yr { animation: tld-lit linear both; animation-timeline: --tld-y; animation-range: cover 0% cover 100%; }
    @keyframes tld-lit {
      0%, 100% { color: transparent; -webkit-text-stroke-color: var(--faint); }
      10%, 90% { color: var(--text); -webkit-text-stroke-color: var(--text); }
    }

    /* The command types itself out as the heading scrolls in. */
    .tld-anim .tld-cmd { animation: tld-type forwards; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    @keyframes tld-type { from { width: 0; } }
  }
}
@media (prefers-reduced-motion: reduce) {
  .tld-seg, .tld-curve, .tld-node, .tld-card { transition: none; }
}
`;
