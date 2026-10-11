// PROTOTYPE: throwaway. Variant H, "Split readout": round-2 E on desktop, round-2 F on phones, in one markup.
// The four Case Studies are states q₀–q₃ on a rail; selecting one (radio + :has()) shows its readout. Each Case Study
// is rendered once, as an <article> with `display: contents`: its figure and its text body are placed directly on the
// layout grid, and every hidden Case Study's parts share the same cells, so each slot is as tall as the tallest
// Case Study's and switching never reflows.
// - Desktop (≥ BP): E. A vertical rail on the left; the panel is a grid with the trace on the left and the evidence
//   column (figure, caption, facts) on the right.
//   The text body is `display: contents` too, so header, titles, trace, facts and footer are cells of the panel's grid.
// - Below BP: F. A horizontal rail; the figure sits in its own slot right under the rail; then the text body as a
//   normal framed column (the panel) in the slot under it.
// No JS needed: `mount` writes static markup and one <style> block and attaches no listeners. Without :has() every
// Case Study is shown in normal flow, one after another.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./h/diagrams";

/** The one layout switch: E's layout from here up, F's below. */
const BP = 1024;

const HUES = ["--peach", "--mauve", "--green", "--sky"];
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const q = (i: number) => `q${String(i).split("").map((d) => SUB[+d]).join("")}`;
const hueOf = (i: number) => `var(${HUES[i % HUES.length]})`;

function stateRow(c: CaseStudy, i: number, n: number): string {
  const running = c.period.end === "present";
  return `
    <div class="sw-h-item" style="--hue:${hueOf(i)}">
      ${i === 0 ? `<span class="sw-h-start" aria-hidden="true"></span>` : ""}
      <input class="sw-h-radio sr-only" type="radio" name="sw-h-state" id="sw-h-r${i}" value="${esc(c.slug)}"
        ${i === 0 ? "checked" : ""} aria-describedby="sw-h-hint" />
      <label for="sw-h-r${i}" class="sw-h-label">
        <span class="sw-h-node ${running ? "sw-h-running" : ""} ${c.draft ? "sw-h-draft" : ""}" aria-hidden="true">${q(i)}</span>
        <span class="sw-h-text">
          <span class="sw-h-title">${esc(c.short)}</span>
          <span class="sw-h-when">${esc(c.period.label)}${c.draft ? ` · <span class="text-peach">draft</span>` : ""}</span>
        </span>
      </label>
      ${i < n - 1 ? `<span class="sw-h-edge" aria-hidden="true"></span>` : ""}
    </div>`;
}

const STEPS = ["problem", "did", "outcome"] as const;

function caseStudy(c: CaseStudy, i: number): string {
  const hue = hueOf(i);
  const fig = FIGURES[c.slug];
  const facts = c.facts
    .map(
      (f) => `
        <div class="min-w-0">
          <dt class="sr-only">${esc(f.label)}</dt>
          <dd class="font-mono text-lg leading-none text-text">${esc(f.value)}</dd>
          <dd class="mt-1 text-xs leading-snug text-muted">${esc(f.label)}</dd>
        </div>`,
    )
    .join("");
  const steps = STEPS.map(
    (key, k) => `
      <li class="sw-h-step" style="--k:${k}">
        <span class="sw-h-dot" aria-hidden="true"></span>
        <span class="sw-h-steplabel">${key}</span>
        <p class="sw-h-steptext">${esc(c[key])}</p>
      </li>`,
  ).join("");
  // Text parts in reading order, then the figure. Their places come from the CSS, per layout.
  return `
    <article class="sw-h-cs" data-cs="${i}" aria-labelledby="sw-h-h${i}" style="--hue:${hue}">
      <div class="sw-h-body">
        <header class="sw-h-head">
          <span><span style="color:${hue}">${q(i)}</span> · ${esc(c.slug)}</span>
          ${c.draft ? `<span class="sw-h-draftmark">draft · ${esc(c.draft.reason)}</span>` : ""}
          <span class="sw-h-period">${esc(c.period.label)}</span>
        </header>
        <div class="sw-h-titles">
          <h3 id="sw-h-h${i}" class="font-serif leading-tight text-text">${esc(c.title)}</h3>
          <p class="mt-1 text-sm text-muted">${esc(c.org)} · ${esc(c.role)}</p>
        </div>
        <ol class="sw-h-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
        <dl class="sw-h-facts">${facts}</dl>
        <div class="sw-h-foot">
          <p class="sw-h-tech">${c.technologies.map(esc).join(" · ")}</p>
          <div class="sw-h-links">
            <a href="${esc(c.href)}" class="sw-h-link font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>
            ${c.links
              .map((l) => `<a href="${esc(l.href)}" class="sw-h-link font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
              .join("")}
          </div>
        </div>
      </div>
      ${
        fig
          ? `<figure class="sw-h-fig"><div class="sw-h-plate">${fig.draw(c)}</div>
               <figcaption><span class="sw-h-fign">fig. ${i + 1}</span> ${esc(fig.caption(c))}</figcaption></figure>`
          : `<div class="sw-h-fig"></div>`
      }
    </article>`;
}

function css(n: number): string {
  // One rule group per state: show its Case Study, tint the frame, run its trace and figure. Static CSS in production.
  const per = Array.from({ length: n }, (_, i) => {
    const sel = `#sw-h:has(#sw-h-r${i}:checked)`;
    const cs = `${sel} .sw-h-cs[data-cs="${i}"]`;
    return {
      show: [`${cs}{visibility:visible}`, `${cs} :is(.sw-h-fig,.sw-h-body,.sw-h-body > *){opacity:1}`, `${sel}{--sel:${hueOf(i)}}`].join("\n"),
      motion: [
        `${cs} .sw-h-step{animation:sw-h-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms)}`,
        `${cs} .sw-h-trace::before{animation:sw-h-grow .5s cubic-bezier(.2,.7,.2,1) both}`,
        `${cs} .draw{stroke-dasharray:1;animation:sw-h-draw .8s cubic-bezier(.3,.6,.2,1) both}`,
        `${cs} :is(.nd,.dot,.ah,.dash,.spoke){animation:sw-h-fade .45s ease-out both}`,
        `${cs} :is(.svc,.step){animation:sw-h-fade .3s ease-out both;animation-delay:calc(.35s + var(--i) * 45ms)}`,
        `${cs} .accept + .inner{animation:sw-h-fade .35s ease-out 1.9s both}`,
        `${cs} .comet{animation:sw-h-comet 1.3s cubic-bezier(.45,0,.25,1) both;animation-delay:calc(.7s + var(--d, 0ms))}`,
      ].join("\n"),
    };
  });
  const D = `@media (min-width:${BP}px)`;
  return `
    #sw-h{--pad:1rem;--sel:var(--peach)}
    @media (min-width:640px){#sw-h{--pad:1.5rem}}

    /* ── Rail. Below BP it runs left to right (F); from BP it's vertical and stretches to the panel's height (E). ── */
    #sw-h .sw-h-col{display:flex;flex-direction:column;min-width:0}
    #sw-h .sw-h-rail{display:flex;flex-direction:row}
    #sw-h .sw-h-item{position:relative;flex:1 1 0;min-width:0}
    #sw-h .sw-h-label{display:grid;grid-template-columns:minmax(0,1fr);justify-items:center;row-gap:.45rem;padding:.4rem .15rem;text-align:center;border-radius:6px;cursor:pointer;width:100%}
    #sw-h .sw-h-node{position:relative;display:grid;place-items:center;width:2.5rem;height:2.5rem;margin:0 auto;border-radius:9999px;font-family:${MONO};font-size:12px;
      border:1.5px solid var(--hue);color:var(--muted);background:var(--bg);transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
    #sw-h .sw-h-node.sw-h-draft{border-style:dashed}
    #sw-h .sw-h-node.sw-h-running::after{content:"";position:absolute;inset:3px;border-radius:9999px;border:1px solid var(--hue);opacity:.7}
    #sw-h .sw-h-text{min-width:0;display:block}
    #sw-h .sw-h-title{display:block;font-size:12.5px;font-weight:500;line-height:1.25;color:var(--muted);transition:color .2s ease}
    #sw-h .sw-h-when{display:none}
    #sw-h .sw-h-label:hover .sw-h-node{box-shadow:0 0 0 6px color-mix(in srgb,var(--hue) 14%,transparent)}
    #sw-h .sw-h-label:hover .sw-h-title{color:var(--text)}
    #sw-h .sw-h-radio:checked + .sw-h-label .sw-h-node{color:var(--text);background:color-mix(in srgb,var(--hue) 18%,var(--bg));box-shadow:0 0 0 7px color-mix(in srgb,var(--hue) 16%,transparent);transform:scale(1.06)}
    #sw-h .sw-h-radio:checked + .sw-h-label .sw-h-title{color:var(--text)}
    #sw-h .sw-h-radio:focus-visible + .sw-h-label{outline:2px solid var(--lavender);outline-offset:2px}
    #sw-h .sw-h-edge,#sw-h .sw-h-start{position:absolute;height:1.5px;top:calc(.4rem + 1.25rem - .75px)}
    #sw-h .sw-h-edge{left:calc(50% + 1.25rem + 5px);width:calc(100% - 2.5rem - 10px);background:var(--border)}
    #sw-h .sw-h-start{left:calc(50% - 1.25rem - 1rem);width:calc(1rem - 4px);background:var(--faint)}
    #sw-h .sw-h-edge::after,#sw-h .sw-h-start::after{content:"";position:absolute;top:50%;right:-1px;translate:0 -50%;border:4px solid transparent;border-left:5px solid var(--faint);border-right:0}
    /* Below BP the legend is read by screen readers only: the panel says draft and the period in words. */
    #sw-h .sw-h-legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    ${D}{
      #sw-h .sw-h-rail{flex-direction:column;flex:1;margin-top:1.25rem}
      #sw-h .sw-h-item{display:flex;align-items:center}
      #sw-h .sw-h-label{grid-template-columns:2.75rem minmax(0,1fr);justify-items:stretch;align-items:center;column-gap:1rem;padding:.5rem .75rem .5rem 0;text-align:left}
      #sw-h .sw-h-title,#sw-h .sw-h-when{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #sw-h .sw-h-title{font-size:15px;line-height:1.35}
      #sw-h .sw-h-when{display:block;font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
      #sw-h .sw-h-edge,#sw-h .sw-h-start{width:1.5px;left:calc(1.375rem - .75px)}
      #sw-h .sw-h-edge{top:calc(50% + 1.25rem + 3px);height:calc(100% - 2.5rem - 6px)}
      #sw-h .sw-h-start{top:calc(50% - 1.25rem - 1.25rem);height:calc(1.25rem - 3px)}
      #sw-h .sw-h-edge::after,#sw-h .sw-h-start::after{top:auto;bottom:-1px;right:auto;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}
      #sw-h .sw-h-legend{position:static;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal;margin-top:1.5rem}
    }

    /* ── Case Study parts. Each article is display:contents, so its parts sit on the grid directly. ── */
    #sw-h .sw-h-frame,#sw-h .sw-h-stack,#sw-h .sw-h-cs{display:contents}
    #sw-h .sw-h-bg{border:1px solid color-mix(in srgb,var(--sel) 30%,var(--border));border-radius:.5rem;background:var(--surface);transition:border-color .3s ease}
    #sw-h .sw-h-head{display:flex;flex-wrap:wrap;align-items:center;column-gap:.75rem;row-gap:.25rem;padding:.625rem var(--pad);border-bottom:1px solid var(--border);
      font-family:${MONO};font-size:12px;line-height:1.25rem;color:var(--faint)}
    #sw-h .sw-h-period{margin-left:auto}
    #sw-h .sw-h-draftmark{font-size:11px;color:var(--peach);order:9;width:100%}
    #sw-h .sw-h-titles h3{font-size:1.375rem}
    #sw-h .sw-h-step{position:relative;padding:0 0 1rem 1.25rem}
    #sw-h .sw-h-step:last-child{padding-bottom:0}
    #sw-h .sw-h-dot{position:absolute;left:0;top:5px;width:.5rem;height:.5rem;border-radius:9999px;background:var(--hue)}
    #sw-h .sw-h-steplabel{display:block;font-family:${MONO};font-size:11px;line-height:1rem;letter-spacing:.05em;text-transform:uppercase;color:var(--faint)}
    #sw-h .sw-h-steptext{margin-top:.25rem;font-size:14px;line-height:1.55;color:var(--text)}
    #sw-h .sw-h-trace{position:relative;list-style:none;padding:0;margin:0}
    #sw-h .sw-h-trace::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
    #sw-h .sw-h-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:1.25rem;row-gap:.75rem;margin:0}
    #sw-h .sw-h-tech{font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
    #sw-h .sw-h-links{display:flex;flex-wrap:wrap;align-items:center;column-gap:1.5rem;row-gap:.375rem;margin-top:.5rem}
    #sw-h .sw-h-link{border-radius:2px}
    #sw-h .sw-h-link:hover{text-decoration-color:var(--hue)}
    #sw-h .sw-h-link:focus-visible{outline:2px solid var(--lavender);outline-offset:3px}

    /* ── Figures (F's compact layouts, about 300 px, so labels render near 1:1). ── */
    #sw-h .sw-h-fig{margin:0;display:flex;flex-direction:column;gap:.5rem;min-width:0;--line:color-mix(in srgb,var(--hue) 60%,var(--faint))}
    #sw-h .sw-h-plate{display:grid;place-items:center;padding:.7rem .6rem;border-radius:6px;
      border:1px solid color-mix(in srgb,var(--hue) 28%,var(--border));background:color-mix(in srgb,var(--surface) 55%,var(--bg))}
    #sw-h .sw-h-fig figcaption{font-family:${MONO};font-size:11px;line-height:1.5;color:var(--faint)}
    #sw-h .sw-h-fign{color:var(--hue)}
    #sw-h svg{display:block;width:100%;height:auto;overflow:visible}
    #sw-h .ln{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round}
    #sw-h .dash{stroke-dasharray:2 4}
    #sw-h .nd{fill:var(--bg);stroke:var(--line);stroke-width:1.25}
    #sw-h .ah{fill:var(--line)}
    #sw-h .dot{fill:var(--line);stroke:none}
    #sw-h .lb{font-family:${MONO};font-size:11px;fill:var(--muted)}
    #sw-h .lb.strong{fill:var(--text)}
    #sw-h .lb.dim{fill:var(--faint)}
    #sw-h .spoke{stroke-width:.75;opacity:.7}
    #sw-h :is(.svc,.step),#sw-h .accept + .inner{fill:color-mix(in srgb,var(--hue) 35%,var(--bg))}
    #sw-h .comet{fill:none;stroke:var(--hue);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:.05 2;stroke-dashoffset:.05;opacity:0}

    /* ── Below BP (F): rail / figure slot / panel slot. Each body is a framed column; the tallest sets the slot. ── */
    #sw-h .sw-h-grid{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:[rail] auto [fig] auto [panel] auto}
    #sw-h .sw-h-col{grid-column:1;grid-row:rail}
    #sw-h .sw-h-fig{grid-column:1;grid-row:fig;margin:.875rem 0 1rem}
    #sw-h .sw-h-bg{display:none}
    #sw-h .sw-h-body{grid-column:1;grid-row:panel;display:flex;flex-direction:column;min-width:0;padding-bottom:1.25rem;
      border:1px solid color-mix(in srgb,var(--hue) 30%,var(--border));border-radius:.5rem;background:var(--surface)}
    #sw-h .sw-h-body > :not(.sw-h-head){margin-inline:var(--pad)}
    #sw-h .sw-h-titles{margin-top:1rem}
    #sw-h .sw-h-trace{margin-top:1.25rem}
    #sw-h .sw-h-facts{margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)}
    #sw-h .sw-h-foot{margin-top:auto;padding-top:1rem}
    @media (min-width:640px){
      #sw-h .sw-h-draftmark{order:0;width:auto;padding:0 .375rem;border:1px dashed color-mix(in srgb,var(--peach) 60%,transparent);border-radius:4px}
    }

    /* ── From BP (E): rail | panel, and inside the panel trace | evidence. ──
       Rail, gap and trace text ramp from compact at BP to full size at 1152 px, where max-w-6xl caps the content width,
       so 1024 gets about 30 px more trace column and 1152 up is unchanged. The rail's minimum is what
       Blinka's "Jan 2026 – now · draft" needs without an ellipsis. Sizes only; the layout is the same. */
    ${D}{
      #sw-h .sw-h-grid{grid-template-columns:minmax(0,clamp(13.75rem,15.625vw + 3.75rem,15rem)) minmax(0,1fr);grid-template-rows:none;column-gap:clamp(2rem,6.25vw - 2rem,2.5rem)}
      #sw-h .sw-h-col{grid-column:1;grid-row:1}
      #sw-h .sw-h-frame{display:grid;grid-column:2;grid-row:1;
        grid-template-columns:var(--pad) minmax(0,1fr) 1.75rem minmax(0,19rem) var(--pad);
        grid-template-rows:[head] auto [titles] auto [main] auto [facts] auto [slack] 1fr [foot] auto [end] 1.25rem [stop]}
      /* The trace spans main, facts and slack. Because slack is the only flexible row it spans, the trace's excess goes
         there, so main and facts stay as tall as the tallest figure and facts, and the facts sit right under the caption. */
      #sw-h .sw-h-bg{display:block;grid-column:1/-1;grid-row:head/stop}
      #sw-h .sw-h-body{display:contents}
      #sw-h .sw-h-body > :not(.sw-h-head){margin-inline:0}
      #sw-h .sw-h-head{grid-column:1/-1;grid-row:head}
      /* The rail already shows each period. */
      #sw-h .sw-h-period{display:none}
      #sw-h .sw-h-titles{grid-column:2/5;grid-row:titles;margin-top:1rem}
      #sw-h .sw-h-titles h3{font-size:1.5rem}
      #sw-h .sw-h-trace{grid-column:2;grid-row:main/foot;margin-top:1.125rem}
      #sw-h .sw-h-steptext{font-size:clamp(14px,.390625vw + 10px,14.5px);line-height:1.6}
      #sw-h .sw-h-fig{grid-column:4;grid-row:main;margin:1.125rem 0 0}
      #sw-h .sw-h-plate{padding:.5rem .375rem}
      #sw-h .sw-h-facts{grid-column:4;grid-row:facts;margin-top:1rem;padding-top:0;border-top:0}
      #sw-h .sw-h-foot{grid-column:2/5;grid-row:foot;align-self:end;margin-top:1.25rem;padding-top:.75rem;border-top:1px solid var(--border)}
    }

    @supports selector(:has(*)){
      #sw-h .sw-h-cs{visibility:hidden}
      #sw-h :is(.sw-h-fig,.sw-h-body,.sw-h-body > *){opacity:0;transition:opacity .25s ease}
      ${per.map((p) => p.show).join("\n")}
      @media (prefers-reduced-motion:no-preference){
        ${per.map((p) => p.motion).join("\n")}
        /* Gate: q₀ is checked on load, so its motion would run off screen. A view timeline on the grid flips --sw-h-play
           from paused to running once the grid's top is about 100 px into view; until then every animation inside waits
           at its first frame. Once running, motion finishes even if scrolled away; later selections happen in view.
           A style query, not var(): a property set by @keyframes is animation-tainted, so var() in animation-play-state
           would fall back to running. Without scroll-driven animations or style queries, motion runs on load, as before. */
        @supports (animation-timeline:view()){
          #sw-h .sw-h-grid{animation:sw-h-gate linear both;animation-timeline:view();animation-range:entry 0px entry 200px}
          @container style(--sw-h-play:paused){
            #sw-h .sw-h-grid *,#sw-h .sw-h-grid *::before{animation-play-state:paused!important}
          }
        }
      }
    }
    /* No :has(): every Case Study in normal flow, each in its own frame, figure under its trace. */
    @supports not selector(:has(*)){
      #sw-h .sw-h-grid{display:block}
      #sw-h .sw-h-frame,#sw-h .sw-h-stack{display:block;margin-top:1.5rem}
      #sw-h .sw-h-cs{display:block;margin-top:1.5rem}
      #sw-h .sw-h-body{display:flex}
      #sw-h .sw-h-body > :not(.sw-h-head){margin-inline:var(--pad)}
      #sw-h .sw-h-fig{margin:.75rem 0 0}
      #sw-h .sw-h-bg,#sw-h .sw-h-hint{display:none}
      #sw-h .sw-h-period{display:inline}
    }
    @property --sw-h-play{syntax:"running | paused";inherits:true;initial-value:running}
    @keyframes sw-h-gate{from{--sw-h-play:paused}to{--sw-h-play:running}}
    @keyframes sw-h-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes sw-h-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes sw-h-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    @keyframes sw-h-fade{from{opacity:0}}
    @keyframes sw-h-comet{0%{stroke-dashoffset:.05;opacity:0}8%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:-1;opacity:0}}
    @media (prefers-reduced-motion:reduce){
      #sw-h *,#sw-h *::before,#sw-h *::after{animation:none!important;transition:none!important}
    }`;
}

const variant: Variant = {
  name: "Split readout",
  mount(root, { work }) {
    const n = work.length;
    const section = document.createElement("section");
    section.id = "sw-h";
    section.setAttribute("aria-labelledby", "sw-h-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-20";
    section.innerHTML = `
      <style>${css(n)}</style>
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="sw-h-title" class="font-serif text-3xl text-text sm:text-4xl">Selected Work</h2>
        <p class="font-mono text-xs text-faint">${n} Case Studies · problem → did → outcome</p>
      </div>
      <div class="sw-h-grid mt-8">
        <div class="sw-h-col">
          <div role="radiogroup" aria-label="Case Studies" class="sw-h-rail">
            ${work.map((c, i) => stateRow(c, i, n)).join("")}
          </div>
          <p class="sw-h-legend flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] leading-5 text-faint">
            <span id="sw-h-hint" class="sw-h-hint">select a state to read its trace</span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true"><span class="relative inline-block size-3 rounded-full border border-faint after:absolute after:inset-[2px] after:rounded-full after:border after:border-faint"></span>still running</span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true"><span class="inline-block size-3 rounded-full border border-dashed border-faint"></span>draft</span>
          </p>
        </div>
        <div class="sw-h-frame">
          <div class="sw-h-bg" aria-hidden="true"></div>
          <div class="sw-h-stack">${work.map(caseStudy).join("")}</div>
        </div>
      </div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
