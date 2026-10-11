// PROTOTYPE: throwaway. Variant B's stylesheet. Mobile-first: the default is the vertical form (time running down
// from now, Tracks as columns); the @container rule at 900px turns it into horizontal swimlanes. Everything that
// reacts to the reader (selection, hover, focus) only touches colour, opacity, box-shadow and visibility.
const SANS = `"Inter Variable", ui-sans-serif, system-ui, sans-serif`;
const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

export const css = `
.tlb{container:tlb/inline-size;--R:3.15rem;--P:.6rem;--bar:12px;--axis:2.2rem;--pm:7px}
.tlb *{box-sizing:border-box}
.tlb p{margin:0}

/* header */
.tlb-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem 2rem}
.tlb-sub{margin-top:.6rem!important;color:var(--muted);max-width:38rem}
.tlb-cta{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1.25rem;font:13px/1.4 ${MONO}}
.tlb-otw{display:inline-flex;align-items:center;gap:.55rem;color:var(--green);padding:.25rem .75rem .25rem .6rem;border-radius:999px;
  border:1px solid color-mix(in srgb,var(--green) 45%,transparent);background:color-mix(in srgb,var(--green) 8%,transparent)}
.tlb-otw::before{content:"";width:.45rem;height:.45rem;border-radius:50%;background:var(--green);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 25%,transparent)}
.tlb-cv{color:var(--lavender);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}
.tlb-cv:hover{text-decoration-thickness:2px}
.tlb a:focus-visible{outline:2px solid var(--lavender);outline-offset:3px;border-radius:2px}

/* plot: vertical by default. Columns: axis | education | track 0 | track 1. Rows: headers | time. */
.tlb-chart{margin-top:2.25rem}
.tlb-plot{position:relative;display:grid;grid-template-columns:var(--axis) 1.35rem 1fr 1fr;
  grid-template-rows:auto calc(var(--T) * var(--pm));column-gap:4px}
.tlb-h{display:flex;flex-direction:column;justify-content:flex-end;padding:0 0 .5rem 2px;min-width:0}
.tlb-hn{font:600 13px/1.3 ${SANS};color:var(--text);display:flex;align-items:center;gap:.4rem}
.tlb-hn::before{content:"";width:.5rem;height:.5rem;border-radius:2px;background:var(--c);flex:none}
.tlb-hb,.tlb-hc{display:none;font:11px/1.45 ${MONO};color:var(--faint)}
.tlb-h0{grid-area:1/3}.tlb-h1{grid-area:1/4}.tlb-h2{grid-area:1/2;visibility:hidden}
.tlb-t0{grid-area:2/3}.tlb-t1{grid-area:2/4}.tlb-t2{grid-area:2/2}
.tlb-t{position:relative;z-index:3;border-radius:4px;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.tlb-ov{grid-area:2/1/3/-1;position:relative;pointer-events:none}

/* overlay: vertical */
.tlb-yr{position:absolute;left:0;right:0;top:calc((1 - var(--x)) * 100%);height:0}
.tlb-yr::before{content:"";position:absolute;left:var(--axis);right:0;top:0;border-top:1px dashed var(--border)}
.tlb-yr>span{position:absolute;left:0;bottom:3px;font:10.5px/1 ${MONO};color:var(--faint)}
.tlb-fut{position:absolute;left:var(--axis);right:0;top:0;height:calc((1 - var(--x)) * 100%);
  background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--border) 70%,transparent) 0 1px,transparent 1px 7px)}
.tlb-now{position:absolute;left:0;right:0;top:calc((1 - var(--x)) * 100%);height:0;z-index:2}
.tlb-now::before{content:"";position:absolute;left:var(--axis);right:-2px;top:-1px;border-top:2px solid var(--green)}
.tlb-now>span{position:absolute;left:0;bottom:3px;font:10.5px/1 ${MONO};color:var(--green);white-space:nowrap}
.tlb-now i{display:none;font-style:normal;color:var(--muted)}
.tlb-now em{display:none;font-style:normal}
.tlb-veil{display:none}

/* segments: vertical blocks, label inside */
.tlb-in{position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;margin:0;pointer-events:none}
.tlb-seg{position:absolute;left:3px;right:3px;top:calc((1 - var(--b)) * 100% + 1px);height:calc((var(--b) - var(--a)) * 100% - 2px);
  cursor:pointer;border-radius:4px;-webkit-tap-highlight-color:transparent}
.tlb-bar{position:absolute;inset:0;border-radius:4px;border-left:3px solid var(--c);
  background:color-mix(in srgb,var(--c) 16%,var(--bg));transition:background-color .15s,box-shadow .15s}
.tlb-txt{position:relative;display:flex;flex-direction:column;padding:3px 4px 3px 8px;overflow:hidden;height:100%}
.tlb-txt>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tlb-l1{font:11.5px/1.25 ${SANS};color:var(--text)}
.tlb-l2{order:-1;font:600 10.5px/1.3 ${MONO};color:var(--c)}
.tlb-l3{font:10px/1.35 ${MONO};color:var(--faint)}
.tlb-seg:not([data-tall]) .tlb-l3{display:none}
.tlb-seg[data-present] .tlb-bar::after{content:"";position:absolute;left:50%;top:-4px;width:8px;height:8px;margin-left:-4px;border-radius:50%;
  background:var(--green);box-shadow:0 0 0 2px var(--bg)}

/* education: a narrow band read bottom-up */
.tlb-edu{left:2px;right:2px}
.tlb-edu .tlb-bar{border-left:0;border-radius:3px;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c) 30%,var(--bg)) 0 2px,color-mix(in srgb,var(--c) 10%,var(--bg)) 2px 6px)}
.tlb-edu .tlb-txt{writing-mode:vertical-rl;transform:rotate(180deg);padding:6px 0;align-items:center;justify-content:flex-start}
.tlb-edu .tlb-l1{font:10.5px/1.35 ${MONO};color:var(--text)}
.tlb-edu .tlb-l3,.tlb-ei{display:none}

/* Open to Work: a dashed stub past now, in the first Track */
.tlb-next{position:absolute;left:3px;right:3px;top:1px;height:calc((1 - var(--a)) * 100% - 2px);border:1px dashed var(--green);border-radius:4px;
  background:color-mix(in srgb,var(--green) 7%,transparent)}
.tlb-next .tlb-txt{justify-content:center;align-items:center}
.tlb-next .tlb-l2{order:0;color:var(--green)}

/* selection, hover, focus: colour and glow only */
.tlb-seg:hover .tlb-bar{box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent)}
.tlb-in:checked+.tlb-seg .tlb-bar{background:color-mix(in srgb,var(--c) 34%,var(--bg));box-shadow:0 0 0 2px var(--c),0 0 14px color-mix(in srgb,var(--c) 35%,transparent)}
.tlb-in:focus-visible+.tlb-seg{outline:2px solid var(--lavender);outline-offset:3px}
.tlb-edu .tlb-bar{transition:box-shadow .15s}

.tlb-hint{margin-top:.9rem!important;font:11px/1.4 ${MONO};color:var(--faint)}

/* detail: every card sits in the same grid cell, so the cell is as tall as the tallest card, always */
.tlb-det{display:grid;margin:1.25rem 0 0;padding:0;list-style:none}
.tlb-card{grid-area:1/1;visibility:hidden;opacity:0;transition:opacity .2s,visibility 0s linear .2s;
  border-top:2px solid var(--c);padding-top:1.1rem;display:grid;gap:.9rem 2.5rem;align-content:start}
.tlb-still .tlb-card,.tlb-still .tlb-bar{transition:none!important}
.tlb-k{font:11px/1.4 ${MONO};color:var(--c);text-transform:lowercase;letter-spacing:.02em}
.tlb-draft{margin-left:.4rem;padding:0 .35rem;border:1px solid var(--border);border-radius:3px;color:var(--faint);font-size:10px}
.tlb-ti{margin:.3rem 0 0;font:400 1.35rem/1.25 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:var(--text)}
.tlb-org{margin-top:.35rem!important;font-size:.95rem;line-height:1.4}
.tlb-co{color:var(--text);font-weight:600}
.tlb-at{color:var(--muted)}
.tlb-when,.tlb-where{margin-top:.35rem!important;font:12px/1.5 ${MONO};color:var(--muted)}
.tlb-when>span{color:var(--faint)}
.tlb-pres{color:var(--green)}
.tlb-where{margin-top:0!important;color:var(--faint)}
.tlb-sum{color:var(--text);line-height:1.6;max-width:44rem}
.tlb-hl{margin:.75rem 0 0;padding:0;list-style:none;display:grid;gap:.4rem;max-width:44rem}
.tlb-hl>li{position:relative;padding-left:1.1rem;color:var(--muted);line-height:1.5;font-size:.95rem}
.tlb-hl>li::before{content:"";position:absolute;left:0;top:.62em;width:.45rem;height:2px;background:var(--c);border-radius:1px}
.tlb-case{display:inline-block;margin-top:1rem;font:13px/1.4 ${MONO};color:var(--lavender);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}
.tlb-case:hover{text-decoration-thickness:2px}

@container tlb (min-width:560px){
  .tlb{--pm:8px}
  .tlb-l1{font-size:12.5px}
  .tlb-card{grid-template-columns:15rem 1fr}
}

/* ── horizontal swimlanes ─────────────────────────────────────────────────────────────────────────────── */
@container tlb (min-width:880px){
  .tlb-plot{grid-template-columns:8.5rem 1fr;grid-template-rows:1.9rem auto auto 2.6rem 1.9rem;column-gap:1rem}
  .tlb-h{justify-content:center;padding:0;border-top:1px solid var(--border)}
  .tlb-h0{grid-area:2/1}.tlb-h1{grid-area:3/1}.tlb-h2{grid-area:4/1;visibility:visible;border-bottom:1px solid var(--border)}
  .tlb-hb,.tlb-hc{display:block}
  .tlb-h2 .tlb-hb{display:none}
  .tlb-t0{grid-area:2/2}.tlb-t1{grid-area:3/2}.tlb-t2{grid-area:4/2}
  .tlb-t{background:none;border-radius:0;border-top:1px solid var(--border);height:calc((var(--ka) + var(--kb)) * var(--R) + 2 * var(--P) + var(--bar))}
  .tlb-t2{height:auto;border-bottom:1px solid var(--border)}
  .tlb-t:not(.tlb-t2)::before{content:"";position:absolute;left:0;right:0;top:calc(var(--ka) * var(--R) + var(--P) + var(--bar) / 2);
    border-top:1px solid color-mix(in srgb,var(--border) 80%,transparent)}
  .tlb-ov{grid-area:1/2/-1/3}

  .tlb-yr{top:1.9rem;bottom:0;left:calc(var(--x) * 100%);right:auto;width:0;height:auto}
  .tlb-yr::before{left:0;right:auto;top:0;bottom:0;border-top:0;border-left:1px dashed var(--border)}
  .tlb-yr>span{left:.45rem;bottom:.55rem;font-size:11px}
  .tlb-fut{left:calc(var(--x) * 100%);right:0;top:1.9rem;bottom:1.9rem;height:auto}
  .tlb-now{left:calc(var(--x) * 100%);right:auto;top:.2rem;bottom:1.9rem;width:0;height:auto}
  .tlb-now::before{left:-1px;right:auto;top:1.5rem;bottom:0;border-top:0;border-left:2px solid var(--green)}
  .tlb-now>span{left:auto;right:-1.5rem;top:0;bottom:auto;font-size:11px}
  .tlb-now i,.tlb-now em{display:inline}
  .tlb-next .tlb-txt{display:none}

  .tlb-seg{left:calc(var(--a) * 100% + 1px);width:calc((var(--b) - var(--a)) * 100% - 2px);right:auto;
    top:calc(var(--ka) * var(--R) + var(--P));height:var(--bar);border-radius:3px}
  .tlb-bar{border-left:0;border-radius:3px;background:color-mix(in srgb,var(--c) 45%,var(--bg));border:1px solid var(--c)}
  .tlb-in:checked+.tlb-seg .tlb-bar{background:var(--c)}
  .tlb-seg[data-present] .tlb-bar::after{left:auto;right:-5px;top:50%;margin:-4px 0 0}
  .tlb-txt{position:absolute;left:0;bottom:100%;height:calc((var(--r) + 1) * var(--R) - .2rem);width:max-content;max-width:12.5rem;
    padding:0 0 0 7px;overflow:visible;border-left:1px solid color-mix(in srgb,var(--c) 55%,transparent);justify-content:flex-start}
  .tlb-txt>span{background:var(--bg);padding-right:3px}
  [data-flip] .tlb-txt>span{padding:0 0 0 3px}
  .tlb-l1{font-size:13px;line-height:1.3}
  .tlb-l2{order:0;font-weight:400;font-size:11px}
  .tlb-l3{font-size:10.5px}
  .tlb-seg:not([data-tall]) .tlb-l3{display:block}
  [data-pos="below"] .tlb-txt{bottom:auto;top:100%;justify-content:flex-end}
  [data-flip] .tlb-txt{left:auto;right:0;padding:0 7px 0 0;border-left:0;border-right:1px solid color-mix(in srgb,var(--c) 55%,transparent);align-items:flex-end;text-align:right}
  .tlb-in:checked+.tlb-seg .tlb-txt{border-color:var(--c)}
  .tlb-in:checked+.tlb-seg .tlb-l1{color:var(--text)}
  .tlb-seg:not(.tlb-edu) .tlb-l1{color:var(--muted)}
  .tlb-in:checked+.tlb-seg .tlb-l1,.tlb-seg:hover .tlb-l1{color:var(--text)}

  .tlb-edu{top:.55rem;height:calc(100% - 1.1rem)}
  .tlb-edu .tlb-bar{border:0}
  .tlb-edu .tlb-txt{position:relative;inset:auto;writing-mode:horizontal-tb;transform:none;flex-direction:row;align-items:center;justify-content:space-between;
    gap:1rem;height:100%;width:auto;max-width:none;padding:0 .7rem;border:0}
  .tlb-edu .tlb-l1{font:12.5px/1 ${SANS};min-width:0}
  .tlb-ei{display:inline;color:var(--muted)}
  .tlb-edu .tlb-txt>span{background:none;padding:0}
  .tlb-edu .tlb-l3{display:block;flex:none;font-size:11px;color:var(--muted)}

  .tlb-next{left:calc(var(--a) * 100% + 2px);right:0;top:calc(var(--ka) * var(--R) + var(--P) - 1px);height:calc(var(--bar) + 2px);border-radius:3px}

  .tlb-card{grid-template-columns:19rem 1fr;min-height:0}

  /* time unrolls left to right as the chart scrolls in; CSS only, skipped for reduced motion */
  @supports (animation-timeline:view()){
    @media (prefers-reduced-motion:no-preference){
      .tlb-plot{view-timeline:--tlb block}
      .tlb-veil{display:block;position:absolute;top:0;bottom:0;right:-2px;left:0;z-index:4;background:var(--bg);
        border-left:1px solid color-mix(in srgb,var(--green) 60%,transparent);
        animation:tlb-unroll linear both;animation-timeline:--tlb;animation-range:entry 0% entry 100%}
    }
  }
}
@keyframes tlb-unroll{0%{left:0}97%{opacity:1}100%{left:100%;opacity:0}}
`;
