// PROTOTYPE: throwaway. Variant E, "Figure readout": round-1 C (career automaton) with B's figures inside the readout.
// The four Case Studies are states q₀–q₃ on a vertical rail; selecting one (radio + :has()) opens its readout in a
// panel whose height is reserved for the tallest Case Study, so switching never reflows. Inside the panel, the trace
// (problem → did → outcome) and the figure sit side by side once the panel is wide enough (a container query), with the
// facts under the figure. Selecting a state draws its figure in and runs its comet once. No JS needed: `mount` writes
// static markup and one <style> block and attaches no listeners. Without :has() every readout is shown, stacked.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./e/diagrams";

const HUES = ["--peach", "--mauve", "--green", "--sky"];
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const q = (i: number) => `q${String(i).split("").map((d) => SUB[+d]).join("")}`;

function stateRow(c: CaseStudy, i: number, n: number): string {
  const hue = `var(${HUES[i % HUES.length]})`;
  const running = c.period.end === "present";
  return `
    <div class="sw-e-item relative lg:flex lg:flex-1 lg:items-center" style="--hue:${hue}">
      ${i === 0 ? `<span class="sw-e-start" aria-hidden="true"></span>` : ""}
      <input class="sw-e-radio sr-only" type="radio" name="sw-e-state" id="sw-e-r${i}" value="${esc(c.slug)}"
        ${i === 0 ? "checked" : ""} aria-describedby="sw-e-hint" />
      <label for="sw-e-r${i}" class="sw-e-label grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 rounded-md py-1.5 pr-3 lg:py-2">
        <span class="sw-e-node relative mx-auto grid size-9 place-items-center rounded-full font-mono text-xs lg:size-10 ${running ? "sw-e-running" : ""} ${c.draft ? "sw-e-draft" : ""}" aria-hidden="true">${q(i)}</span>
        <span class="min-w-0">
          <span class="sw-e-title block truncate text-[15px] font-medium leading-snug">${esc(c.short)}</span>
          <span class="block truncate font-mono text-[11px] leading-5 text-faint">${esc(c.period.label)}${c.draft ? ` · <span class="text-peach">draft</span>` : ""}</span>
        </span>
      </label>
      ${i < n - 1 ? `<span class="sw-e-edge" aria-hidden="true"></span>` : ""}
    </div>`;
}

const STEPS = ["problem", "did", "outcome"] as const;

function readout(c: CaseStudy, i: number): string {
  const hue = `var(${HUES[i % HUES.length]})`;
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
      <li class="sw-e-step relative pl-5 pb-4 last:pb-0" style="--k:${k}">
        <span class="sw-e-dot absolute left-0 top-[5px] size-2 rounded-full" aria-hidden="true"></span>
        <span class="block font-mono text-[11px] uppercase leading-4 tracking-wider text-faint">${key}</span>
        <p class="mt-1 text-[14px] leading-[1.55] text-text sm:text-[14.5px] sm:leading-[1.6]">${esc(c[key])}</p>
      </li>`,
  ).join("");
  return `
    <article class="sw-e-panel flex min-w-0 flex-col" data-panel="${i}" aria-labelledby="sw-e-h${i}" style="--hue:${hue}">
      <header class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-2.5 font-mono text-xs text-faint sm:px-6">
        <span><span style="color:${hue}">${q(i)}</span> · ${esc(c.slug)}</span>
        ${c.draft ? `<span class="sw-e-draftmark text-[11px] leading-5 text-peach max-sm:order-last max-sm:w-full sm:rounded sm:border sm:border-dashed sm:px-1.5">draft · ${esc(c.draft.reason)}</span>` : ""}
        <span class="ml-auto">${esc(c.period.label)}</span>
      </header>
      <div class="flex flex-1 flex-col px-4 pt-4 pb-5 sm:px-6">
        <h3 id="sw-e-h${i}" class="font-serif text-[1.375rem] leading-tight text-text sm:text-2xl">${esc(c.title)}</h3>
        <p class="mt-1 text-sm text-muted">${esc(c.org)} · ${esc(c.role)}</p>
        <div class="sw-e-cols mt-5">
          <ol class="sw-e-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
          <div class="sw-e-evidence min-w-0">
            ${
              fig
                ? `<figure class="sw-e-fig m-0"><div class="sw-e-plate">${fig.draw(c)}</div>
                     <figcaption class="mt-2 font-mono text-[11px] leading-[1.5] text-faint"><span style="color:${hue}">fig. ${i + 1}</span> ${esc(fig.caption(c))}</figcaption></figure>`
                : ""
            }
            <dl class="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">${facts}</dl>
          </div>
        </div>
        <div class="mt-auto pt-4">
          <div class="border-t border-border pt-3">
            <p class="font-mono text-[11px] leading-5 text-faint max-sm:hidden">${c.technologies.map(esc).join(" · ")}</p>
            <div class="flex flex-wrap items-center gap-x-6 sm:mt-2 gap-y-1.5">
              <a href="${esc(c.href)}" class="sw-e-link rounded-sm font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>
              ${c.links
                .map((l) => `<a href="${esc(l.href)}" class="sw-e-link rounded-sm font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </article>`;
}

function css(n: number): string {
  // Per state: show its readout, run its trace, draw its figure, tint the frame. Static CSS in production.
  const sel = (i: number) => `#sw-e:has(#sw-e-r${i}:checked) .sw-e-panel[data-panel="${i}"]`;
  const per = Array.from({ length: n }, (_, i) =>
    [
      `${sel(i)}{visibility:visible;opacity:1}`,
      `${sel(i)} .sw-e-step{animation:sw-e-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms)}`,
      `${sel(i)} .sw-e-trace::before{animation:sw-e-scale .5s cubic-bezier(.2,.7,.2,1) both}`,
      `${sel(i)} .draw{stroke-dasharray:1;animation:sw-e-draw .9s cubic-bezier(.3,.6,.2,1) both .1s}`,
      `${sel(i)} :is(.nd,.dot,.ah,.dash,.spoke){animation:sw-e-fade .6s ease both .15s}`,
      `${sel(i)} .comet{animation:sw-e-comet 1.5s cubic-bezier(.45,0,.25,1) both .9s}`,
      `#sw-e:has(#sw-e-r${i}:checked) .sw-e-frame{--hue:var(${HUES[i % HUES.length]})}`,
    ].join("\n"),
  ).join("\n");
  return `
    #sw-e{--gap:.25rem}
    @media (min-width:1024px){#sw-e{--gap:0px}}
    #sw-e .sw-e-rail{gap:var(--gap)}
    #sw-e .sw-e-node{border:1.5px solid var(--hue);color:var(--muted);background:var(--bg);transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
    #sw-e .sw-e-node.sw-e-draft{border-style:dashed}
    #sw-e .sw-e-node.sw-e-running::after{content:"";position:absolute;inset:3px;border-radius:9999px;border:1px solid var(--hue);opacity:.7}
    #sw-e .sw-e-title{color:var(--muted);transition:color .2s ease}
    #sw-e .sw-e-label:hover .sw-e-node{box-shadow:0 0 0 6px color-mix(in srgb,var(--hue) 14%,transparent)}
    #sw-e .sw-e-label:hover .sw-e-title{color:var(--text)}
    #sw-e .sw-e-radio:checked + .sw-e-label .sw-e-node{color:var(--text);background:color-mix(in srgb,var(--hue) 18%,var(--bg));box-shadow:0 0 0 7px color-mix(in srgb,var(--hue) 16%,transparent);transform:scale(1.06)}
    #sw-e .sw-e-radio:checked + .sw-e-label .sw-e-title{color:var(--text)}
    #sw-e .sw-e-radio:focus-visible + .sw-e-label{outline:2px solid var(--lavender);outline-offset:2px}
    #sw-e .sw-e-edge{position:absolute;left:calc(1.375rem - .75px);top:calc(50% + var(--r) + 3px);height:calc(100% + var(--gap) - 2 * var(--r) - 6px);width:1.5px;background:var(--border)}
    #sw-e .sw-e-item{--r:1.125rem}
    @media (min-width:1024px){#sw-e .sw-e-item{--r:1.25rem}}
    #sw-e .sw-e-edge::after,#sw-e .sw-e-start::after{content:"";position:absolute;bottom:-1px;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}
    #sw-e .sw-e-start{position:absolute;left:calc(1.375rem - .75px);top:calc(50% - var(--r) - 1.25rem);height:calc(1.25rem - 3px);width:1.5px;background:var(--faint)}
    #sw-e .sw-e-frame{border-color:color-mix(in srgb,var(--hue) 30%,var(--border));transition:border-color .3s ease}
    #sw-e .sw-e-dot{background:var(--hue)}
    #sw-e .sw-e-trace{position:relative}
    #sw-e .sw-e-trace::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
    #sw-e .sw-e-draftmark{border-color:color-mix(in srgb,var(--peach) 60%,transparent)}
    #sw-e .sw-e-link:hover{text-decoration-color:var(--hue)}
    #sw-e .sw-e-link:focus-visible{outline:2px solid var(--lavender);outline-offset:3px}
    #sw-e .sw-e-stack{display:grid}
    #sw-e .sw-e-stack > *{grid-area:1/1}

    /* Inside the readout: stacked on phones, trace | figure from 600 px of panel width. */
    #sw-e .sw-e-panel{container:sw-e-panel/inline-size}
    #sw-e .sw-e-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:1.25rem}
    @container sw-e-panel (min-width:600px){
      #sw-e .sw-e-cols{grid-template-columns:minmax(0,1fr) minmax(0,19rem);gap:1.75rem}
    }
    #sw-e .sw-e-evidence{container-type:inline-size}

    /* B's figures, re-skinned to the selected state's hue. */
    #sw-e .sw-e-plate{display:grid;place-items:center;padding:.5rem .375rem;border-radius:4px;background:color-mix(in srgb,var(--bg) 70%,transparent);border:1px solid color-mix(in srgb,var(--border) 60%,transparent)}
    #sw-e .sw-e-panel{--accent:var(--hue);--line:color-mix(in oklab,var(--hue) 55%,var(--faint))}
    #sw-e svg{display:block;width:100%;height:auto;overflow:visible}
    #sw-e .fig-narrow{display:none}
    @container (max-width:470px){#sw-e .fig-wide{display:none} #sw-e .fig-narrow{display:block} #sw-e .fig-solo .lb{font-size:12.5px}}
    #sw-e .ln{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round}
    #sw-e .dash{stroke-dasharray:2 4}
    #sw-e .nd{fill:var(--bg);stroke:var(--line);stroke-width:1.25}
    #sw-e .ah{fill:var(--line)}
    #sw-e .dot{fill:var(--line);stroke:none}
    #sw-e .lb{font-family:var(--font-mono);font-size:11px;fill:var(--muted)}
    #sw-e .lb.strong{fill:var(--text)}
    #sw-e .lb.dim{fill:var(--faint)}
    #sw-e .accept + .inner,#sw-e .step,#sw-e .svc{fill:color-mix(in oklab,var(--hue) 30%,var(--bg))}
    #sw-e .spoke{stroke-width:.75;opacity:.7}
    #sw-e .comet{fill:none;stroke:var(--hue);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:.05 2;stroke-dashoffset:.05;opacity:0}

    @supports selector(:has(*)){
      #sw-e .sw-e-panel{visibility:hidden;opacity:0;transition:opacity .25s ease}
      ${per}
    }
    @supports not selector(:has(*)){
      #sw-e .sw-e-stack{display:flex;flex-direction:column}
      #sw-e .sw-e-stack > * + *{border-top:1px solid var(--border)}
      #sw-e .sw-e-hint{display:none}
    }
    @keyframes sw-e-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes sw-e-scale{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes sw-e-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    @keyframes sw-e-fade{from{opacity:0}}
    @keyframes sw-e-comet{0%{stroke-dashoffset:.05;opacity:0}8%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:-1;opacity:0}}
    @media (prefers-reduced-motion:reduce){
      #sw-e *,#sw-e *::before,#sw-e *::after{animation:none!important;transition:none!important}
    }`;
}

const variant: Variant = {
  name: "Figure readout",
  mount(root, { work }) {
    const n = work.length;
    const section = document.createElement("section");
    section.id = "sw-e";
    section.setAttribute("aria-labelledby", "sw-e-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-20";
    section.innerHTML = `
      <style>${css(n)}</style>
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="sw-e-title" class="font-serif text-3xl text-text sm:text-4xl">Selected Work</h2>
        <p class="font-mono text-xs text-faint">${n} Case Studies · problem → did → outcome</p>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
        <div class="lg:flex lg:flex-col">
          <div role="radiogroup" aria-label="Case Studies" class="sw-e-rail mt-5 flex flex-col lg:flex-1">
            ${work.map((c, i) => stateRow(c, i, n)).join("")}
          </div>
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] leading-5 text-faint lg:mt-6 lg:block">
            <p id="sw-e-hint" class="sw-e-hint">select a state to read its trace</p>
            <p class="flex flex-wrap gap-x-4 gap-y-1 lg:mt-3" aria-hidden="true">
              <span class="inline-flex items-center gap-1.5"><span class="relative inline-block size-3 rounded-full border border-faint after:absolute after:inset-[2px] after:rounded-full after:border after:border-faint"></span>still running</span>
              <span class="inline-flex items-center gap-1.5"><span class="inline-block size-3 rounded-full border border-dashed border-faint"></span>draft</span>
            </p>
          </div>
        </div>
        <div class="sw-e-frame min-w-0 rounded-lg border bg-surface">
          <div class="sw-e-stack">${work.map(readout).join("")}</div>
        </div>
      </div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
