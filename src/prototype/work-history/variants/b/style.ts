// PROTOTYPE: throwaway. Variant B's static CSS: D's graph pieces and scroll-driven staging (as `b-`), the rail rows,
// and H's readout grid. The per-commit selection rules are generated in b-split-graph-rail.ts (`css()`), as H's were;
// on the real site both would be one static stylesheet.
//
// The readout frame is one grid at every width, so every readout's parts land in the same cells (H's reservation):
//   below 640:  pad | body | pad
//               rows head / titles / fig / main / facts / slack (1fr) / foot / end
//   from 640:   pad | figure 20rem | 1.5rem | facts 1fr | pad
//               rows head / titles / main / fig / slack (1fr) / foot / end
// (H's trace | evidence split from 1280 is gone since iteration 1: with the wider rail, the section's 1,088 px content
// width leaves the frame 656 px at most, and the split squeezed the trace to about 276 px.)
// A Case Study (or the degree) puts its figure in `fig`, its trace in `main` and its facts in `facts`. A role readout's
// text (`.b-rwrap`) spans fig → slack instead (main → foot from 640), and its excess lands in `slack`.
const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
/** Rail beside the readout from here. */
const MD = "@media (min-width:1024px)";

export const STYLE = `
/* --ny: where a rail row's node sits (graph.ts, NODE_Y): the label's top padding + half the 22 px title line. */
#b{--pad:1rem;--sel:var(--mauve);--ny:19px}
@media (min-width:640px){#b{--pad:1.5rem;--ny:21px}}

/* ── Header ── */
#b .b-kicker{font-family:${MONO};font-size:12px;line-height:1rem;color:var(--faint)}
#b .b-h2row{display:flex;flex-wrap:wrap;align-items:flex-end;column-gap:1rem;row-gap:.75rem;margin-top:.5rem}
#b .b-cv{margin-left:auto;display:inline-flex;align-items:center;gap:.5rem;border-radius:.375rem;border:1px solid var(--border);padding:.375rem .75rem;
  font-family:${MONO};font-size:12px;line-height:1rem;color:var(--text);transition:border-color .2s ease,color .2s ease,background-color .2s ease}
#b .b-cv:hover{border-color:var(--lavender);color:var(--lavender)}
#b .b-cv:focus-visible{outline:2px solid var(--lavender);outline-offset:2px}
#b.b-otw .b-cv{border-color:color-mix(in srgb,var(--green) 55%,transparent);color:var(--green);background:color-mix(in srgb,var(--green) 8%,transparent)}
#b.b-otw .b-cv:hover{background:color-mix(in srgb,var(--green) 16%,transparent)}
#b .b-signal{align-self:center;font-family:${MONO};font-size:12px;line-height:1rem;color:var(--green);padding:.125rem .5rem;border:1px dashed color-mix(in srgb,var(--green) 60%,transparent);border-radius:9999px}
#b .b-intro{margin-top:.75rem;color:var(--muted);font-size:15px;line-height:1.5}

/* ── Layout: rail, then readout; side by side from MD. ── */
#b .b-grid{display:grid;grid-template-columns:minmax(0,1fr);row-gap:1.75rem;margin-top:1.75rem}
#b .b-col{min-width:0}
${MD}{
  /* The frame stretches to the rail, but never past one 900 px screen (the readout's own content is shorter). */
  #b .b-frame{max-height:56.25rem}
  #b .b-grid{grid-template-columns:minmax(0,clamp(22rem,2rem + 29vw,24.5rem)) minmax(0,1fr);column-gap:clamp(1.75rem,3.2vw - .5rem,2.5rem);margin-top:2rem}
}

/* ── The rail: D's graph, compact rows. Rows have no margins: every pixel is a row that paints the lanes. ── */
#b .b-rail{list-style:none;margin:0;padding:0}
#b .b-row{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr);column-gap:10px;--on:0;--story:0}
#b .b-g{position:relative}
#b .b-lanes{position:absolute;inset:0}
#b .b-lab{display:block;padding:8px 12px 10px;border-radius:6px;cursor:pointer;
  background:color-mix(in srgb,var(--c) calc(var(--on) * 11%),transparent);
  box-shadow:inset 2px 0 0 color-mix(in srgb,var(--c) calc(var(--story) * 100%),transparent);
  transition:background-color .2s ease,box-shadow .2s ease}
#b .b-row:hover .b-lab{background:color-mix(in srgb,var(--c) calc(7% + var(--on) * 4%),transparent)}
#b .b-l1{display:block}
#b .b-title{font-size:15px;line-height:22px;font-weight:500;color:var(--text)}
#b .b-l2{display:block;margin-top:1px;font-size:13px;line-height:19px;color:var(--muted)}
/* "context · organization" breaks only between the two, never inside either. */
#b .b-l2 :is(.b-ctx,.b-org){white-space:nowrap}
#b .b-ctx{color:var(--c);font-weight:500}
#b .b-l3{display:flex;flex-wrap:wrap;justify-content:space-between;column-gap:.75rem;margin-top:4px;font-family:${MONO};font-size:12px;line-height:20px;color:var(--faint)}
/* A date range never breaks; when the tag doesn't fit beside it (phones), the tag takes its own line, right-aligned. */
#b .b-when{white-space:nowrap}
#b.b-otw .b-when{color:var(--text)}
#b .b-tag{flex:none;margin-left:auto;font-size:11px;color:color-mix(in srgb,var(--c) calc(var(--story) * 100%),var(--faint));white-space:nowrap;transition:color .2s ease}
#b .b-drafttag{margin-left:.375rem;vertical-align:2px;font-family:${MONO};font-size:10px;line-height:14px;padding:0 4px;border:1px dashed color-mix(in srgb,var(--peach) 60%,transparent);border-radius:3px;color:var(--peach)}
#b .b-headline{padding:10px 12px 8px;font-family:${MONO};font-size:11px;line-height:18px;color:var(--faint)}
#b .b-headref{border-radius:2px;padding:0 4px;background:color-mix(in srgb,var(--lavender) 15%,transparent);color:var(--lavender)}
#b .b-row[data-lane="education"] .b-headline{padding-bottom:6px}

#b .b-seg{position:absolute;width:2px;margin-left:-1px;transition:opacity .2s ease}
#b .b-seg[data-s="active"]{background:var(--c)}
#b .b-seg[data-s="idle"]{background:repeating-linear-gradient(to bottom,var(--c) 0 2px,transparent 2px 7px);opacity:.8}
#b .b-seg[data-s="next"]{background:repeating-linear-gradient(to bottom,var(--green) 0 4px,transparent 4px 8px)}
#b .b-curve{position:absolute;left:0;width:100%;overflow:visible;fill:none;stroke-width:2px;transition:opacity .2s ease}
#b .b-node{position:absolute;width:12px;height:12px;border-radius:999px;translate:-50% -50%;background:var(--c);
  box-shadow:0 0 0 3px var(--bg),0 0 0 calc(3px + var(--on) * 5px) color-mix(in srgb,var(--c) calc(var(--on) * 30%),transparent);
  scale:calc(1 + var(--on) * .25);transition:scale .2s ease,box-shadow .2s ease}
#b .b-node[data-n="tip"]{width:13px;height:13px;background:var(--bg);border:2px solid var(--c)}
#b .b-node[data-n="edu"]{width:11px;height:11px;border-radius:2px;rotate:45deg}
#b .b-node[data-n="span"]{width:11px;height:11px;background:var(--bg);border:2px solid var(--c)}
#b .b-node[data-n="root"]{width:8px;height:8px}
#b .b-node[data-n="next"]{width:18px;height:18px;background:var(--bg);border:2px dashed var(--green)}
/* Calm focus: the hovered row's node glows and the other lanes step back. Nothing moves. */
#b .b-row:hover .b-node{scale:1.2;box-shadow:0 0 0 3px var(--bg),0 0 0 7px color-mix(in srgb,var(--c) 30%,transparent)}
#b:has(.b-row[data-lane="engineering"]:hover) :is(.b-seg,.b-curve):not([data-lane="engineering"]),
#b:has(.b-row[data-lane="teaching"]:hover) :is(.b-seg,.b-curve):not([data-lane="teaching"]),
#b:has(.b-row[data-lane="education"]:hover) :is(.b-seg,.b-curve):not([data-lane="education"]){opacity:.3}

#b .b-key{display:flex;flex-wrap:wrap;column-gap:1rem;row-gap:.25rem;margin-top:.625rem;list-style:none;
  font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
#b .b-key li{display:inline-flex;align-items:center;gap:.4rem}
#b .b-sw{display:inline-block;width:1.1rem;height:2px;border-radius:2px}
#b .b-sw-idle{background:repeating-linear-gradient(to right,var(--faint) 0 2px,transparent 2px 6px)}

/* ── The radios: invisible, at the top of the readout slot on phones (a tapped row focuses its radio, and the browser
   scrolls the readout into view: the box is nearly a viewport tall so "centre if needed" lands its top near the top),
   fixed in the viewport from MD (always in view, so focusing never scrolls). ── */
#b .b-radios{position:absolute;left:0;top:-.75rem;width:1px;height:calc(100svh - 1.5rem);overflow:hidden;opacity:0;pointer-events:none}
#b .b-radio{position:absolute;inset:0;width:1px;height:100%;margin:0;appearance:none}
${MD}{#b .b-radios{position:fixed;top:50%;height:1px}}

/* ── The readout frame (H's): one column below 640, then trace over figure + facts. ── */
#b .b-frame{position:relative;display:grid;min-width:0;
  grid-template-columns:var(--pad) minmax(0,1fr) var(--pad);
  grid-template-rows:[head] auto [titles] auto [fig] auto [main] auto [facts] auto [slack] 1fr [foot] auto [end] 1.25rem [stop]}
#b .b-ro,#b .b-body{display:contents}
#b .b-bg{grid-column:1/-1;grid-row:head/stop;border:1px solid color-mix(in srgb,var(--sel) 30%,var(--border));border-radius:.5rem;background:var(--surface);transition:border-color .3s ease}
#b .b-head{grid-column:1/-1;grid-row:head;display:flex;flex-wrap:wrap;align-items:center;column-gap:.75rem;row-gap:.25rem;padding:.625rem var(--pad);
  border-bottom:1px solid var(--border);font-family:${MONO};font-size:12px;line-height:1.25rem;color:var(--faint)}
#b .b-draftmark{font-size:11px;color:var(--peach)}
@media (min-width:640px){#b .b-draftmark{padding:0 .375rem;border:1px dashed color-mix(in srgb,var(--peach) 60%,transparent);border-radius:4px}}
#b .b-titles{grid-column:2;grid-row:titles;margin-top:1rem;min-width:0}
#b .b-h3{font-family:var(--font-serif);font-size:1.375rem;line-height:1.25;color:var(--text)}
#b .b-sub{margin-top:.25rem;font-size:14px;line-height:1.45;color:var(--muted)}
#b .b-meta{margin-top:.5rem;font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
#b .b-spans{display:flex;flex-wrap:wrap;align-items:center;gap:.375rem;margin:.625rem 0 0;padding:0;list-style:none;font-family:${MONO};font-size:11px;line-height:1.25rem}
#b .b-chip{--lit:0;padding:0 .4rem;border-radius:4px;border:1px solid color-mix(in srgb,var(--hue) calc(var(--lit) * 70%),var(--border));
  background:color-mix(in srgb,var(--hue) calc(var(--lit) * 12%),transparent);color:color-mix(in srgb,var(--text) calc(var(--lit) * 100%),var(--muted))}
#b .b-chip-loose{border-style:dashed}
#b .b-chip-n{margin-left:.4rem;color:var(--faint)}
#b .b-chip-n::before{content:"· "}
#b .b-chipsep{color:var(--faint)}
#b .b-dt{white-space:nowrap}
#b .b-dt-any{font-family:${MONO};font-size:12px;color:var(--faint)}
@media (max-width:639.98px){#b .b-spans{flex-direction:column;align-items:flex-start}#b .b-chipsep{display:none}}
#b .b-chip .b-dt{color:var(--faint)}

#b .b-fig{grid-column:2;grid-row:fig;margin:1.125rem 0 0;display:flex;flex-direction:column;gap:.5rem;min-width:0;--line:color-mix(in srgb,var(--hue) 60%,var(--faint))}
#b .b-trace{grid-column:2;grid-row:main;position:relative;list-style:none;padding:0;margin:1.25rem 0 0}
#b .b-facts{grid-column:2;grid-row:facts;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:1.25rem;row-gap:.75rem;margin:1.25rem 0 0;padding-top:1rem;border-top:1px solid var(--border)}
#b .b-rwrap{grid-column:2;grid-row:fig/foot;display:flex;flex-direction:column;gap:1.25rem;margin-top:1.25rem;min-width:0}
/* The foot sits at the bottom of its row: a footer without outside links (or without a page link) still ends the frame. */
#b .b-foot{grid-column:2;grid-row:foot;align-self:end;margin-top:1.25rem;padding-top:.75rem;border-top:1px solid var(--border)}

#b .b-step{position:relative;padding:0 0 1rem 1.25rem}
#b .b-step:last-child{padding-bottom:0}
#b .b-dot{position:absolute;left:0;top:5px;width:.5rem;height:.5rem;border-radius:9999px;background:var(--hue)}
#b .b-steplabel{display:block;font-family:${MONO};font-size:11px;line-height:1rem;letter-spacing:.05em;text-transform:uppercase;color:var(--faint)}
#b .b-steptext{margin-top:.25rem;font-size:14px;line-height:1.55;color:var(--text)}
#b .b-trace::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
#b .b-fv{font-family:${MONO};font-size:1.125rem;line-height:1;color:var(--text)}
#b .b-fl{margin-top:.25rem;font-size:12px;line-height:1.35;color:var(--muted)}
#b .b-prose{font-size:14.5px;line-height:1.6;color:var(--text)}
#b .b-prose p + p{margin-top:.75rem}
#b .b-hl{list-style:none;margin:0;padding:0;font-family:${MONO};font-size:12.5px;line-height:1.4;color:var(--muted)}
#b .b-hl li{display:flex;gap:.5rem}
#b .b-hl li + li{margin-top:.5rem}
#b .b-list{list-style:none;margin:.375rem 0 0;padding:0;font-size:14.5px;line-height:1.55;color:var(--text)}
#b .b-list li + li{margin-top:.25rem}
#b .b-faint{font-family:${MONO};font-size:11.5px;color:var(--faint);white-space:nowrap}
#b .b-tech{font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
#b .b-cite{font-style:normal;color:var(--muted)}
#b .b-links{display:flex;flex-wrap:wrap;align-items:center;column-gap:1.5rem;row-gap:.375rem;margin-top:.5rem}
#b .b-foot-thin .b-links{margin-top:0}
#b .b-link{border-radius:2px;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
#b .b-link:hover{text-decoration-color:var(--hue)}
#b .b-link:focus-visible{outline:2px solid var(--lavender);outline-offset:3px}
#b .b-read{font-weight:500;color:var(--text)}
#b .b-out{font-family:${MONO};font-size:12px;color:var(--muted)}
#b .b-back{font-family:${MONO};font-size:12px;color:var(--faint);text-decoration:none}
#b .b-inl{color:var(--text)}
/* The degree's "inside it" list: each line is a label for that commit's radio. */
#b .b-helds{list-style:none;margin:.375rem 0 0;padding:0;display:grid;row-gap:.3rem;font-size:14px;line-height:1.45}
@media (min-width:640px){#b .b-helds{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(var(--rows),auto);grid-auto-flow:column;column-gap:1.5rem}}
#b .b-held{cursor:pointer;color:var(--text);text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;transition:text-decoration-color .2s ease}
#b .b-held:hover{text-decoration-color:var(--c)}
#b .b-held-dot{display:inline-block;width:7px;height:7px;margin-right:.5rem;vertical-align:1px;border-radius:9999px;background:var(--c)}
#b .b-held-t,#b .b-held-w{white-space:nowrap}
#b .b-held-w{color:var(--muted)}

/* Figures (H's). */
#b .b-plate{display:grid;place-items:center;padding:.6rem .5rem;border-radius:6px;border:1px solid color-mix(in srgb,var(--hue) 28%,var(--border));background:color-mix(in srgb,var(--surface) 55%,var(--bg))}
#b .b-fig figcaption{font-family:${MONO};font-size:11px;line-height:1.5;color:var(--faint)}
#b svg{display:block;width:100%;height:auto;overflow:visible}
#b .ln{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round}
#b .dash{stroke-dasharray:2 4}
#b .nd{fill:var(--bg);stroke:var(--line);stroke-width:1.25}
#b .ah{fill:var(--line)}
#b .dot{fill:var(--line);stroke:none}
#b .lb{font-family:${MONO};font-size:11px;fill:var(--muted)}
#b .lb.strong{fill:var(--text)}
#b .lb.dim{fill:var(--faint)}
#b .spoke{stroke-width:.75;opacity:.7}
#b :is(.svc,.step),#b .accept + .inner{fill:color-mix(in srgb,var(--hue) 35%,var(--bg))}
#b .comet{fill:none;stroke:var(--hue);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:.05 2;stroke-dashoffset:.05;opacity:0}

${MD}{
  /* The rail beside the readout already prints every date. */
  #b .b-dt{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  #b .b-back{display:none}
  /* Only "↑ all roles" lives in a thin footer, so from MD it would be an empty rule. */
  #b .b-foot-thin{border-top:0;padding-top:0}
  #b .b-h3{font-size:1.5rem}
}
/* From 640: the trace first, then the figure with the facts beside it (no facts row of their own). */
@media (min-width:640px){
  #b .b-lab{padding:10px 12px 12px}
  #b .b-headline{padding-top:12px}
  #b .b-frame{grid-template-columns:var(--pad) minmax(0,20rem) 1.5rem minmax(0,1fr) var(--pad);
    grid-template-rows:[head] auto [titles] auto [main] auto [fig] auto [slack] 1fr [foot] auto [end] 1.25rem [stop]}
  #b .b-titles,#b .b-trace,#b .b-rwrap,#b .b-foot{grid-column:2/5}
  #b .b-rwrap{grid-row:main/foot}
  #b .b-fig{grid-column:2;grid-row:fig;margin-top:1.5rem}
  #b .b-facts{grid-column:4;grid-row:fig;grid-template-columns:minmax(0,1fr);align-self:start;margin-top:1.5rem;padding-top:0;border-top:0}
}
/* No :has(): every readout in normal flow, each framed; the rail is a plain list. */
@supports not selector(:has(*)){
  #b .b-frame{display:block}
  #b .b-bg,#b .b-radios{display:none}
  #b .b-ro{display:block;margin-top:1.5rem;padding-bottom:1.25rem;border:1px solid var(--border);border-radius:.5rem;background:var(--surface)}
  #b .b-body{display:block}
  #b .b-body > :not(.b-head),#b .b-fig{margin-inline:var(--pad)}
}

/* ── Motion. Readouts: H's (generated per commit). The graph: D's scroll-driven staging. ── */
@property --b-play{syntax:"running | paused";inherits:true;initial-value:running}
@keyframes b-gate{from{--b-play:paused}to{--b-play:running}}
@keyframes b-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes b-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes b-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes b-fade{from{opacity:0}}
@keyframes b-comet{0%{stroke-dashoffset:.05;opacity:0}8%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:-1;opacity:0}}
@media (prefers-reduced-motion:no-preference){
  @supports (animation-timeline:view()){
    #b.b-anim .b-row{view-timeline-name:--b-row}
    #b.b-anim .b-lanes{animation:b-lanes linear forwards;animation-timeline:--b-row;animation-range:cover 0% contain 120px}
    @keyframes b-lanes{from{clip-path:inset(0 0 calc(100% + 120px) 0)}to{clip-path:inset(0 0 0 0)}}
    #b.b-anim .b-node{animation:b-pop linear forwards;animation-timeline:--b-row;animation-range:cover 0% cover 150px}
    @keyframes b-pop{0%,66%{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}
  }
}
@media (prefers-reduced-motion:reduce){
  #b *,#b *::before,#b *::after{animation:none!important;transition:none!important}
}
`;
