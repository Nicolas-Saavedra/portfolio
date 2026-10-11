// PROTOTYPE: throwaway. Variant D's CSS, one <style> block. Static in production; only the per-state rule groups are
// generated here because the prototype mounts from TS.
//
// Layouts: phones (< MD) get the scene rotated (newest on top) with flags in two columns; from MD the scene is
// horizontal with flags in tiers above and below the lanes. The readout splits trace | evidence from MD.
// Motion: all behind prefers-reduced-motion: no-preference. The time-lapse needs scroll-driven animations; without
// them the scene is simply drawn (its driving property's initial value is the finished state).

const MD = 768;
const LG = 1024;
const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

export function css(states: { key: string; hue: string }[]): string {
  const per = states.map(({ key, hue }) => {
    const sel = `#wd:has(#wd-r-${key}:checked)`;
    const ro = `${sel} .wd-ro[data-key="${key}"]`;
    return {
      show: [
        `${ro}{visibility:visible}`,
        `${ro} :is(.wd-ro-head,.wd-strip,.wd-spans,.wd-main){opacity:1}`,
        `${sel}{--sel:${hue}}`,
        // The story in the scene: its bars thicken and glow, its nodes ring, its flags tint, its branch shows.
        `${sel} .wd-lanes [data-k="${key}"]{--on:1}`,
        `${sel} .wd-flag[data-k="${key}"]{background:color-mix(in srgb,var(--c) 13%,transparent)}`,
        `${sel} .wd-flag[data-k="${key}"] .wd-ft{color:var(--text)}`,
        `${sel} .wd-arc[data-k="${key}"]{opacity:1}`,
        `${sel} .wd-chip[for="wd-r-${key}"]{color:var(--text);border-color:var(--c);background:color-mix(in srgb,var(--c) 16%,var(--bg))}`,
        `#wd:has(#wd-r-${key}:focus-visible) .wd-chip[for="wd-r-${key}"]{outline:2px solid var(--lavender);outline-offset:2px}`,
        // Calm focus: hovering a flag (or its chip) glows that story's bars; nothing moves.
        `#wd:has(:is(.wd-flag,.wd-chip)[for="wd-r-${key}"]:hover) .wd-lanes [data-k="${key}"]{--hov:1}`,
      ].join("\n"),
      motion: [
        `${ro} .wd-step{animation:wd-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms + 120ms)}`,
        `${ro} .wd-trace::before{animation:wd-grow .5s cubic-bezier(.2,.7,.2,1) .12s both}`,
        `${ro} :is(.wd-sseg,.wd-sgap){animation:wd-sweep .55s cubic-bezier(.3,.6,.2,1) both;animation-delay:calc(var(--i) * 260ms)}`,
        `${ro} .draw{stroke-dasharray:1;animation:wd-draw .8s cubic-bezier(.3,.6,.2,1) .2s both}`,
        `${ro} :is(.nd,.dot,.ah,.dash,.spoke){animation:wd-fade .45s ease-out .2s both}`,
        `${ro} :is(.svc,.step){animation:wd-fade .3s ease-out both;animation-delay:calc(.55s + var(--i) * 45ms)}`,
        `${ro} .accept + .inner{animation:wd-fade .35s ease-out 2.1s both}`,
        `${ro} .comet{animation:wd-comet 1.3s cubic-bezier(.45,0,.25,1) both;animation-delay:calc(.9s + var(--d, 0ms))}`,
        `${ro} .wd-hl li{animation:wd-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k, 0) * 80ms + 200ms)}`,
        `${sel} .wd-arc[data-k="${key}"]{animation:wd-arc .9s cubic-bezier(.4,0,.2,1) .15s both}`,
      ].join("\n"),
    };
  });
  const md = `@media (min-width:${MD}px)`;
  return `
#wd{--pad:1rem;--sel:var(--lavender);--tierH:4.75rem;--fw:10rem;--th:3.5rem}
@media (min-width:640px){#wd{--pad:1.5rem}}
${md}{#wd{--th:5.25rem}}
@media (min-width:${LG}px){#wd{--fw:11rem}}

/* ── Header ── */
#wd .wd-cmd{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom}
#wd .wd-caret{display:inline-block;width:.6ch;height:1.1em;vertical-align:-.2em;background:var(--lavender);opacity:.7}
#wd .wd-cv{display:inline-flex;align-items:center;gap:.5rem;border-radius:.375rem;border:1px solid var(--border);padding:.375rem .75rem;font-family:${MONO};font-size:12px;color:var(--text);transition:border-color .2s,color .2s,background-color .2s}
#wd .wd-cv:hover{border-color:var(--lavender);color:var(--lavender)}
#wd .wd-cv-otw{border-color:color-mix(in srgb,var(--green) 60%,transparent);color:var(--green);background:color-mix(in srgb,var(--green) 10%,transparent)}
#wd .wd-cv-otw:hover{border-color:var(--green);color:var(--green);background:color-mix(in srgb,var(--green) 16%,transparent)}
#wd .wd-cv:focus-visible,#wd .wd-link:focus-visible,#wd .wd-inlink:focus-visible{outline:2px solid var(--lavender);outline-offset:2px}
#wd .wd-otw{margin-top:.875rem;font-size:1rem;line-height:1.5}
#wd .wd-otw-sig{display:inline-flex;align-items:center;gap:.4rem;margin-right:.25rem;font-family:${MONO};font-size:12px;color:var(--green)}
#wd .wd-otw-sig i{width:8px;height:8px;border-radius:9999px;background:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 22%,transparent)}
#wd .wd-br{display:inline-block;width:11px;height:11px;vertical-align:-1px;fill:none;stroke:currentColor;stroke-width:1.3}
#wd .wd-br circle{fill:var(--bg)}
#wd .wd-br-key{color:var(--muted)}

/* ── The scene, phones first: the lane block rotated -90°, flags in two columns beside it. ── */
#wd .wd-scene{position:relative;display:grid;grid-template-columns:minmax(0,1fr) var(--th) minmax(0,1fr);column-gap:.375rem;height:var(--sceneV);margin-top:2rem}
#wd .wd-flags{position:relative;list-style:none;margin:0;padding:0;grid-row:1;min-width:0}
#wd .wd-flags-top{grid-column:1}
#wd .wd-flags-bot{grid-column:3}
#wd .wd-lanebox{position:relative;grid-column:2;grid-row:1;height:var(--len)}
#wd .wd-lanes{position:absolute;left:0;top:0;width:var(--len);height:var(--th);transform-origin:0 0;transform:translateY(var(--len)) rotate(-90deg)}
#wd .wd-axis{position:relative;grid-column:2;grid-row:1;z-index:2;pointer-events:none;height:var(--len)}

/* Lane pieces, in the block's own (horizontal) coordinates: x = time fraction, y = lane fraction. */
#wd .wd-lanes > *{position:absolute}
#wd .wd-grid{left:calc(var(--a) * 100%);top:4%;bottom:4%;width:1px;background:color-mix(in srgb,var(--border) 70%,transparent)}
#wd .wd-seg{--on:0;--hov:0;left:calc(var(--a) * 100%);width:calc((var(--b) - var(--a)) * 100%);top:calc(var(--y) * 100%);height:2px;margin-top:-1px;background:var(--c);
  transition:transform .25s ease,box-shadow .25s ease}
#wd .wd-seg[data-s="active"]{height:3px;margin-top:-1.5px;transform:scaleY(calc(1 + var(--on) * .8));
  box-shadow:0 0 calc(max(var(--on),var(--hov)) * 8px) color-mix(in srgb,var(--c) 70%,transparent)}
#wd .wd-seg[data-s="idle"]{background:repeating-linear-gradient(to right,var(--c) 0 2px,transparent 2px 7px);opacity:.8}
#wd .wd-node{--on:0;--hov:0;left:calc(var(--a) * 100%);top:calc(var(--y) * 100%);width:10px;height:10px;translate:-50% -50%;border-radius:9999px;background:var(--c);
  box-shadow:0 0 0 3px var(--bg),0 0 0 calc(3px + max(var(--on),var(--hov)) * 4px) color-mix(in srgb,var(--c) 30%,transparent);transition:box-shadow .25s ease,scale .25s ease;scale:calc(1 + var(--on) * .2)}
#wd .wd-node[data-n="tip"]{width:11px;height:11px;background:var(--bg);border:2px solid var(--c)}
#wd .wd-node[data-n="edu"]{width:10px;height:10px;border-radius:2px;rotate:45deg}
#wd .wd-node[data-n="next"]{width:15px;height:15px;background:var(--bg);border:2px dashed var(--green)}
#wd .wd-thesis{--on:0;--hov:0;left:calc(var(--a) * 100%);width:calc((var(--b) - var(--a)) * 100%);top:calc(var(--y) * 100%);height:9px;margin-top:-4.5px;border-radius:9999px;
  border:1.5px solid var(--c);background:var(--bg);box-shadow:0 0 0 2px var(--bg),0 0 calc(max(var(--on),var(--hov)) * 8px) color-mix(in srgb,var(--mauve) 70%,transparent);
  transition:box-shadow .25s ease,border-color .25s ease}
#wd .wd-thesis{border-color:color-mix(in srgb,var(--mauve) calc(var(--on) * 100%),var(--c))}
#wd .wd-off{left:0;top:50%;width:0;height:0;translate:-100% -50%;border:4px solid transparent;border-right:6px solid var(--c);border-left:0}
#wd .wd-svg{inset:0;width:100%;height:100%;overflow:visible;fill:none;stroke-width:2px;stroke-linecap:round}
#wd .wd-forks .eng{stroke:var(--mauve)}
#wd .wd-forks .tea{stroke:var(--peach)}
#wd .wd-arc{opacity:0;stroke:color-mix(in srgb,var(--sel) 85%,var(--text));stroke-width:2px;stroke-dasharray:5 4}
#wd .wd-next{stroke:var(--green);stroke-dasharray:4 4}

/* Axis on phones: small year pills on the trunk, and "now" on top. */
#wd .wd-yr,#wd .wd-now,#wd .wd-nextlabel{position:absolute;left:50%;translate:-50% -50%;font-family:${MONO};font-size:10px;line-height:14px;padding:0 3px;border-radius:3px;background:var(--bg);color:var(--faint)}
#wd .wd-yr{top:calc((1 - var(--a)) * var(--len))}
#wd .wd-yr-f{display:none}
#wd .wd-now{top:calc((1 - var(--a)) * var(--len) - 14px);color:var(--muted)}
#wd .wd-nextlabel{top:calc((1 - var(--a)) * var(--len) - 16px);color:var(--green)}

/* Flags on phones: at --py, text toward the lanes. */
#wd .wd-flag{--fwi:var(--fw);position:absolute;top:var(--py);left:0;right:0;display:flex;flex-direction:column;padding:.0625rem .5rem .25rem;cursor:pointer;
  border-left:2px solid var(--c);border-radius:0 4px 4px 0;transition:background-color .2s ease}
#wd .wd-flags-top .wd-flag{align-items:flex-end;text-align:right;border-left:0;border-right:2px solid var(--c);border-radius:4px 0 0 4px}
#wd .wd-flag:hover{background:color-mix(in srgb,var(--c) 8%,transparent)}
#wd .wd-fd{font-family:${MONO};font-size:10px;line-height:1rem;color:var(--faint)}
#wd .wd-fd time{white-space:nowrap}
#wd .wd-fd .wd-br{color:var(--c);margin-left:.15rem}
#wd .wd-ft{font-size:13.5px;line-height:1.15rem;font-weight:500;color:color-mix(in srgb,var(--text) 88%,var(--muted));transition:color .2s ease}
#wd .wd-fc{font-size:12px;line-height:1rem;color:var(--c)}
#wd .wd-fo{font-size:12px;line-height:1rem;color:var(--muted)}
#wd .wd-flag[data-kind="thesis"] .wd-fo{font-family:${MONO};font-size:10.5px;color:var(--faint)}
#wd .wd-draft{display:inline-block;margin-left:.2rem;padding:0 .25rem;border:1px dashed color-mix(in srgb,var(--peach) 60%,transparent);border-radius:3px;font-family:${MONO};font-size:10px;line-height:.95rem;font-weight:400;color:var(--peach);vertical-align:1px}

/* ── From MD: the scene horizontal. Rows: giant years, top flags, lanes, bottom flags. ── */
${md}{
  #wd .wd-scene{grid-template-columns:minmax(0,1fr);grid-template-rows:3.25rem calc(var(--tt) * var(--tierH)) var(--th) calc(var(--tb) * var(--tierH));column-gap:0;height:auto;margin-top:2.25rem}
  #wd .wd-axis{grid-column:1;grid-row:1;height:auto}
  #wd .wd-flags-top{grid-column:1;grid-row:2}
  #wd .wd-lanebox{grid-column:1;grid-row:3;height:auto}
  #wd .wd-flags-bot{grid-column:1;grid-row:4}
  #wd .wd-lanes{width:100%;height:100%;transform:none}

  #wd .wd-yr,#wd .wd-now,#wd .wd-nextlabel{top:auto;left:calc(var(--a) * 100%);translate:none;background:none;padding:0;border-radius:0}
  #wd .wd-yr{bottom:.125rem;font-family:var(--font-serif);font-size:2.25rem;line-height:1;font-variant-numeric:lining-nums tabular-nums;display:grid;margin-left:.375rem}
  #wd .wd-yr > span{grid-area:1/1}
  #wd .wd-yr-o{color:transparent;-webkit-text-stroke:1px var(--faint)}
  #wd .wd-yr-f{display:block;color:var(--text);opacity:0}
  #wd .wd-yr[data-now] .wd-yr-f{opacity:1}
  #wd .wd-now,#wd .wd-nextlabel{bottom:.25rem;translate:-100% 0;padding-right:.375rem;font-size:11px}
  #wd .wd-nextlabel{translate:-50% 0;padding:0}

  #wd .wd-flag,#wd .wd-flags-top .wd-flag{top:auto;right:auto;left:calc(var(--x) * 100% - var(--e) * var(--fwi));width:var(--fwi);align-items:flex-start;text-align:left;
    border-left:2px solid var(--c);border-right:0;border-radius:0 4px 4px 0;padding:.125rem .5rem .25rem}
  #wd .wd-flags-top .wd-flag{bottom:calc(var(--tier) * var(--tierH) + .375rem)}
  #wd .wd-flags-bot .wd-flag{top:calc(var(--tier) * var(--tierH) + .375rem)}
  #wd .wd-flag[data-end]{align-items:flex-end;text-align:right;border-left:0;border-right:2px solid var(--c);border-radius:4px 0 0 4px}
  #wd .wd-flag[data-kind="edu"]{--fwi:calc(var(--fw) * 1.5)}
  #wd .wd-fd{font-size:10.5px;white-space:nowrap}
  #wd .wd-fo{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-size:11.5px}
  #wd .wd-flag,#wd .wd-flags-top .wd-flag{padding-right:.375rem}
  #wd .wd-flag[data-end]{padding-left:.375rem}
  #wd .wd-flag[data-kind="edu"] .wd-ft{max-width:15rem}
}
@media (min-width:${LG}px){#wd .wd-yr{font-size:2.75rem}}

/* ── Checkout row ── */
#wd .wd-checkout{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .4rem;margin:1.75rem 0 0;padding:0;border:0;min-width:0}
#wd .wd-radio{position:absolute;top:0;left:0;width:1px;height:1px;margin:0;opacity:0;pointer-events:none}
#wd .wd-prompt{margin-right:.35rem;font-family:${MONO};font-size:12px;color:var(--faint)}
#wd .wd-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .625rem;border:1px solid var(--border);border-radius:9999px;cursor:pointer;
  font-family:${MONO};font-size:12px;line-height:1.1rem;color:var(--muted);transition:color .2s ease,border-color .2s ease,background-color .2s ease,box-shadow .2s ease}
#wd .wd-chip .wd-br{color:var(--c)}
#wd .wd-chip[data-kind="role"],#wd .wd-chip[data-kind="edu"],#wd .wd-chip[data-kind="all"]{border-style:dashed}
#wd .wd-chip:hover{color:var(--text);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 14%,transparent)}
#wd .wd-sep{width:1px;height:1rem;margin:0 .25rem;background:var(--border)}

/* ── Panel: every readout in one cell, so it's as tall as the tallest and switching never reflows. ── */
#wd .wd-panel{display:grid;margin-top:.75rem;border:1px solid color-mix(in srgb,var(--sel) 32%,var(--border));border-radius:.5rem;background:var(--surface);transition:border-color .3s ease}
#wd .wd-ro{grid-area:1/1;display:flex;flex-direction:column;min-width:0}
#wd .wd-ro-head{display:flex;flex-wrap:wrap;align-items:center;column-gap:.75rem;row-gap:.25rem;padding:.625rem var(--pad);border-bottom:1px solid var(--border);
  font-family:${MONO};font-size:12px;line-height:1.25rem;color:var(--muted)}
#wd .wd-faint{color:var(--faint)}
#wd .wd-period{margin-left:auto;color:var(--faint)}
#wd .wd-draftmark{order:9;width:100%;font-size:11px;color:var(--peach)}
@media (min-width:640px){#wd .wd-draftmark{order:0;width:auto;padding:0 .375rem;border:1px dashed color-mix(in srgb,var(--peach) 60%,transparent);border-radius:4px}}

/* The story strip: the readout's spans on the scene's axis (the panel spans the scene's width). */
#wd .wd-ro-head:has(+ .wd-strip){border-bottom-color:transparent}
#wd .wd-strip{position:relative;height:1.25rem;margin-top:-.625rem}
#wd .wd-strip > i{position:absolute;top:50%}
#wd .wd-sbase{left:0;right:0;height:1px;background:var(--border)}
#wd .wd-snow{left:calc(var(--a) * 100%);width:1px;height:.75rem;translate:0 -50%;background:var(--faint)}
#wd .wd-sseg{left:calc(var(--a) * 100%);width:calc((var(--b) - var(--a)) * 100%);height:5px;margin-top:-2.5px;border-radius:9999px;background:var(--hue);transform-origin:left}
#wd .wd-sgap{left:calc(var(--a) * 100%);width:calc((var(--b) - var(--a)) * 100%);height:2px;margin-top:-1px;background:repeating-linear-gradient(to right,var(--hue) 0 3px,transparent 3px 7px);opacity:.75;transform-origin:left}
#wd .wd-spans{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem 1rem;margin:0;padding:.25rem var(--pad) 0;list-style:none;font-family:${MONO};font-size:11.5px;line-height:1.25rem;color:var(--faint)}
#wd .wd-spans li{display:inline-flex;flex-wrap:wrap;align-items:center;column-gap:.4rem}
#wd .wd-sw{display:inline-block;width:14px;height:5px;border-radius:9999px;background:var(--hue)}
#wd .wd-gap::before,#wd .wd-gap::after{content:"";display:inline-block;width:18px;height:2px;margin:0 .35rem;vertical-align:middle;background:repeating-linear-gradient(to right,var(--hue) 0 3px,transparent 3px 7px)}
#wd .wd-notrole{color:var(--faint)}

/* Readout body, phones: titles, figure, trace, facts, footer. */
#wd .wd-main{display:flex;flex-direction:column;flex:1;padding:0 var(--pad) 1.25rem}
#wd .wd-titles{order:0;margin-top:.875rem}
#wd .wd-titles h3{font-size:1.375rem}
#wd .wd-fig{order:1;margin:1rem 0 0;display:flex;flex-direction:column;gap:.5rem;min-width:0;--line:color-mix(in srgb,var(--hue) 60%,var(--faint))}
#wd .wd-trace{order:2;position:relative;list-style:none;padding:0;margin:1.25rem 0 0}
#wd .wd-facts{order:3;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:1.25rem;row-gap:.75rem;margin:1.25rem 0 0;padding-top:1rem;border-top:1px solid var(--border)}
#wd .wd-meta{order:3;display:grid;row-gap:.5rem;margin:1.25rem 0 0;padding-top:1rem;border-top:1px solid var(--border);font-size:13px}
#wd .wd-meta dt{font-family:${MONO};font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint)}
#wd .wd-meta dd{margin:0;color:var(--text)}
#wd .wd-foot{order:4;margin-top:auto;padding-top:1rem}
#wd .wd-trace.wd-rolebody{margin-top:1rem}
#wd .wd-step{position:relative;padding:0 0 1rem 1.25rem}
#wd .wd-step:last-child{padding-bottom:0}
#wd .wd-dot{position:absolute;left:0;top:5px;width:.5rem;height:.5rem;border-radius:9999px;background:var(--hue)}
#wd .wd-steplabel{display:block;font-family:${MONO};font-size:11px;line-height:1rem;letter-spacing:.05em;text-transform:uppercase;color:var(--faint)}
#wd .wd-steptext{margin-top:.25rem;font-size:14px;line-height:1.55;color:var(--text)}
#wd .wd-trace:not(.wd-rolebody)::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
#wd .wd-hl{list-style:none;margin:.875rem 0 0;padding:0;display:grid;row-gap:.375rem;font-family:${MONO};font-size:12.5px;line-height:1.4;color:var(--muted)}
#wd .wd-hl li{display:flex;gap:.5rem}
#wd .wd-tech{font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
#wd .wd-links{display:flex;flex-wrap:wrap;align-items:center;column-gap:1.5rem;row-gap:.375rem;margin-top:.5rem}
#wd .wd-link{border-radius:2px}
#wd .wd-link:hover{text-decoration-color:var(--hue)}
#wd .wd-inlink{cursor:pointer;color:var(--c);text-decoration:underline;text-underline-offset:3px;border-radius:2px}

/* Figures (H's), about 300 px wide. */
#wd .wd-plate{display:grid;place-items:center;padding:.6rem .5rem;border-radius:6px;border:1px solid color-mix(in srgb,var(--hue) 28%,var(--border));background:color-mix(in srgb,var(--surface) 55%,var(--bg))}
#wd .wd-fig figcaption{font-family:${MONO};font-size:11px;line-height:1.5;color:var(--faint)}
#wd .wd-fign{color:var(--hue)}
#wd .wd-fig svg{display:block;width:100%;height:auto;overflow:visible}
#wd .ln{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round}
#wd .dash{stroke-dasharray:2 4}
#wd .nd{fill:var(--bg);stroke:var(--line);stroke-width:1.25}
#wd .ah{fill:var(--line)}
#wd .dot{fill:var(--line);stroke:none}
#wd .lb{font-family:${MONO};font-size:11px;fill:var(--muted)}
#wd .lb.strong{fill:var(--text)}
#wd .lb.dim{fill:var(--faint)}
#wd .spoke{stroke-width:.75;opacity:.7}
#wd :is(.svc,.step),#wd .accept + .inner{fill:color-mix(in srgb,var(--hue) 35%,var(--bg))}
#wd .comet{fill:none;stroke:var(--hue);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:.05 2;stroke-dashoffset:.05;opacity:0}

/* The record, one line per role. */
#wd .wd-main-all{padding-top:.25rem}
#wd .wd-ledger{list-style:none;margin:0;padding:0}
#wd .wd-ledger ol{list-style:none;margin:0;padding:0}
#wd .wd-lg{margin-top:1rem;font-family:${MONO};font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--c)}
#wd .wd-lrow{display:grid;grid-template-columns:minmax(0,1fr);row-gap:.125rem;padding:.5rem 0 .5rem .75rem;border-left:2px solid var(--c);margin-top:.375rem}
#wd .wd-ld{font-family:${MONO};font-size:11px;line-height:1rem;color:var(--faint)}
#wd .wd-lt{font-size:14px;line-height:1.35}
#wd .wd-lc{color:var(--c)}
#wd .wd-lh{font-family:${MONO};font-size:12px;line-height:1.35;color:var(--muted)}

/* ── From MD: readout split, trace | evidence (H's E layout, without the rail). ── */
${md}{
  #wd .wd-main{display:grid;grid-template-columns:minmax(0,1fr) 1.75rem minmax(0,19rem);
    grid-template-rows:[titles] auto [main] auto [facts] auto [slack] 1fr [foot] auto;padding-bottom:1.25rem}
  #wd .wd-titles{grid-column:1/-1;grid-row:titles}
  #wd .wd-titles h3{font-size:1.5rem}
  #wd .wd-trace{grid-column:1;grid-row:main/foot;margin-top:1.125rem}
  #wd .wd-trace.wd-rolebody{margin-top:1.125rem}
  #wd .wd-fig{grid-column:3;grid-row:main;margin-top:1.125rem}
  #wd .wd-plate{padding:.5rem .375rem}
  #wd .wd-facts,#wd .wd-meta{grid-column:3;grid-row:facts;margin-top:1rem;padding-top:0;border-top:0}
  #wd .wd-main-role .wd-meta{grid-row:main;margin-top:1.125rem;padding-top:.875rem;border-top:1px solid var(--border)}
  #wd .wd-foot{grid-column:1/-1;grid-row:foot;align-self:end;margin-top:1.25rem;padding-top:.75rem;border-top:1px solid var(--border)}
  #wd .wd-steptext{font-size:14.5px;line-height:1.6}
  #wd .wd-main-all{display:block}
  #wd .wd-ledger{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:2rem}
  #wd .wd-ledger > li:last-child{grid-column:1/-1}
}
@media (min-width:${LG}px){
  #wd .wd-ledger{grid-template-columns:minmax(0,1fr)}
  #wd .wd-ledger > li:last-child{grid-column:auto}
  #wd .wd-lrow{grid-template-columns:11.5rem minmax(0,1fr) minmax(0,1fr);column-gap:1.5rem;align-items:baseline;padding:.3rem 0 .3rem .75rem;margin-top:.25rem}
}

@supports selector(:has(*)){
  #wd .wd-ro{visibility:hidden}
  #wd .wd-ro :is(.wd-ro-head,.wd-strip,.wd-spans,.wd-main){opacity:0;transition:opacity .25s ease}
  ${per.map((p) => p.show).join("\n  ")}
  @media (prefers-reduced-motion:no-preference){
    ${per.map((p) => p.motion).join("\n    ")}
    /* H's view gate: the first checked story's motion waits until the panel is about 100 px into view. */
    @supports (animation-timeline:view()){
      #wd .wd-panel{animation:wd-gate linear both;animation-timeline:view();animation-range:entry 0px entry 200px}
      @container style(--wd-play:paused){
        #wd .wd-panel *,#wd .wd-panel *::before,#wd .wd-scene .wd-arc{animation-play-state:paused!important}
      }
    }
  }
}
/* No :has(): every readout in flow, one after another. */
@supports not selector(:has(*)){
  #wd .wd-panel{display:block}
  #wd .wd-ro + .wd-ro{border-top:1px solid var(--border)}
  #wd .wd-arc{opacity:1}
}

/* ── The time-lapse: one registered number, --wd-front, runs from before 0 to 1 as the scene scrolls in. The lanes are
   clipped at the front, the flags arrive as it passes their bars, the giant year it's in fills. Its initial value
   is 1, so before the range, without support, or with reduced motion, the scene is simply drawn. Every range starts
   at cover 0% (D's gotcha): the scene's top is then still at the viewport's bottom edge. ── */
@property --wd-front{syntax:"<number>";inherits:true;initial-value:1}
@property --wd-play{syntax:"running | paused";inherits:true;initial-value:running}
@media (prefers-reduced-motion:no-preference){
  @supports (animation-timeline:view()){
    #wd.wd-anim .wd-scene{animation:wd-gate linear both,wd-front linear forwards;animation-timeline:view(),view();animation-range:entry 0px entry 200px,cover 0% cover 40%}
    #wd.wd-anim .wd-lanes{clip-path:inset(-12px -12px -12px calc((1 - var(--wd-front)) * 100%))}
    #wd.wd-anim .wd-flag{--fa:calc(1 - var(--b));opacity:clamp(0,(var(--wd-front) - var(--fa)) * 14,1);translate:0 calc((1 - clamp(0,(var(--wd-front) - var(--fa)) * 14,1)) * 8px)}
    #wd.wd-anim .wd-yr,#wd.wd-anim .wd-now{opacity:clamp(0,(var(--wd-front) - (1 - var(--a))) * 20,1)}
    #wd.wd-anim .wd-cmd{animation:wd-type forwards;animation-timeline:view();animation-range:entry 0% cover 30%}
    ${md}{
      #wd.wd-anim .wd-scene{animation-range:entry 0px entry 200px,cover 0% cover 34%}
      #wd.wd-anim .wd-lanes{clip-path:inset(-12px calc((1 - var(--wd-front)) * 100%) -12px -12px)}
      #wd.wd-anim .wd-flag{--fa:var(--a);translate:calc((1 - clamp(0,(var(--wd-front) - var(--fa)) * 14,1)) * -10px) 0}
      #wd.wd-anim .wd-yr,#wd.wd-anim .wd-now{opacity:1}
      #wd.wd-anim .wd-axis .wd-yr .wd-yr-f{opacity:clamp(0,min((var(--wd-front) - var(--a)) * 24,(var(--b) - var(--wd-front)) * 24),1)}
      #wd.wd-anim .wd-yr-o{opacity:calc(.45 + .55 * clamp(0,(var(--wd-front) - var(--a)) * 24,1))}
    }
  }
}
@keyframes wd-front{from{--wd-front:-.15}to{--wd-front:1}}
@keyframes wd-gate{from{--wd-play:paused}to{--wd-play:running}}
@keyframes wd-type{from{width:0}}
@keyframes wd-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes wd-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes wd-sweep{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes wd-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes wd-fade{from{opacity:0}}
@keyframes wd-comet{0%{stroke-dashoffset:.05;opacity:0}8%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:-1;opacity:0}}
@keyframes wd-arc{from{clip-path:inset(-12px calc((1 - var(--a)) * 100%) -12px -12px)}to{clip-path:inset(-12px calc((1 - var(--b)) * 100%) -12px -12px)}}
@media (prefers-reduced-motion:reduce){
  #wd *,#wd *::before,#wd *::after{animation:none!important;transition:none!important}
}`;
}
