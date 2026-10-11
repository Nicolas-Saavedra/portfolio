// PROTOTYPE: throwaway. Variant F, "Rail figures": round-1 C (Career automaton) with round-1 B's figures on the rail side.
// The four Case Studies are states on a rail. Selecting one opens its readout in the panel (text only), and shows its
// figure under the rail: a small static SVG of that Case Study's system or story. Readouts share one reserved slot
// (the tallest's height), and figures share another, so switching never reflows. On phones the rail turns
// horizontal (q₀ → q₁ → q₂ → q₃ in one row), which buys the room for the figure above the panel.
// Mechanics are CSS only (radio inputs + :has()): `mount` writes static markup and one <style> block, no listeners.
// Without :has() support every figure and readout is shown, stacked.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./f/diagrams";

const HUES = ["--peach", "--mauve", "--green", "--sky"];
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const q = (i: number) => `q${String(i).split("").map((d) => SUB[+d]).join("")}`;
const hueOf = (i: number) => `var(${HUES[i % HUES.length]})`;

function stateRow(c: CaseStudy, i: number, n: number): string {
  const running = c.period.end === "present";
  return `
    <div class="sw-f-item" style="--hue:${hueOf(i)}">
      ${i === 0 ? `<span class="sw-f-start" aria-hidden="true"></span>` : ""}
      <input class="sw-f-radio sr-only" type="radio" name="sw-f-state" id="sw-f-r${i}" value="${esc(c.slug)}"
        ${i === 0 ? "checked" : ""} aria-describedby="sw-f-hint" />
      <label for="sw-f-r${i}" class="sw-f-label">
        <span class="sw-f-node ${running ? "sw-f-running" : ""} ${c.draft ? "sw-f-draft" : ""}" aria-hidden="true">${q(i)}</span>
        <span class="sw-f-text">
          <span class="sw-f-title">${esc(c.short)}</span>
          <span class="sw-f-when">${esc(c.period.label)}${c.draft ? ` · <span class="text-peach">draft</span>` : ""}</span>
        </span>
      </label>
      ${i < n - 1 ? `<span class="sw-f-edge" aria-hidden="true"></span>` : ""}
    </div>`;
}

function figure(c: CaseStudy, i: number): string {
  const fig = FIGURES[c.slug];
  if (!fig) return `<div class="sw-f-fig" data-fig="${i}"></div>`;
  return `
    <figure class="sw-f-fig" data-fig="${i}" style="--hue:${hueOf(i)}">
      <div class="sw-f-plate">${fig.draw(c)}</div>
      <figcaption><span class="sw-f-fign">fig. ${q(i)}</span> ${esc(fig.caption(c))}</figcaption>
    </figure>`;
}

const STEPS: { key: "problem" | "did" | "outcome"; label: string }[] = [
  { key: "problem", label: "problem" },
  { key: "did", label: "did" },
  { key: "outcome", label: "outcome" },
];

function readout(c: CaseStudy, i: number): string {
  const hue = hueOf(i);
  const facts = c.facts
    .map(
      (f) => `
        <div class="min-w-0">
          <dt class="sr-only">${esc(f.label)}</dt>
          <dd class="font-mono text-xl leading-none text-text">${esc(f.value)}</dd>
          <dd class="mt-1.5 text-xs leading-snug text-muted">${esc(f.label)}</dd>
        </div>`,
    )
    .join("");
  const steps = STEPS.map(
    (s, k) => `
      <li class="sw-f-step relative grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 pb-4 last:pb-0 max-sm:grid-cols-1" style="--k:${k}">
        <span class="relative flex items-start gap-2 pt-[3px] font-mono text-[11px] uppercase tracking-wider text-faint max-sm:pb-1">
          <span class="sw-f-dot mt-[3px] size-2 shrink-0 rounded-full" aria-hidden="true"></span>${s.label}
        </span>
        <p class="text-[15px] leading-relaxed text-text">${esc(c[s.key])}</p>
      </li>`,
  ).join("");
  return `
    <article class="sw-f-panel flex min-w-0 flex-col" data-panel="${i}" aria-labelledby="sw-f-h${i}" style="--hue:${hue}">
      <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3 font-mono text-xs text-faint sm:px-6">
        <span><span style="color:${hue}">${q(i)}</span> · ${esc(c.slug)}</span>
        <span>${esc(c.period.label)}</span>
      </header>
      <div class="flex flex-1 flex-col px-5 pt-5 pb-6 sm:px-6">
        ${
          c.draft
            ? `<p class="sw-f-draftmark mb-4 self-start rounded border border-dashed px-2 py-0.5 font-mono text-[11px] text-peach">draft · ${esc(c.draft.reason)}</p>`
            : ""
        }
        <h3 id="sw-f-h${i}" class="font-serif text-2xl leading-tight text-text sm:text-[1.75rem]">${esc(c.title)}</h3>
        <p class="mt-1.5 text-sm text-muted">${esc(c.org)} · ${esc(c.role)}</p>
        <ol class="sw-f-trace mt-5" aria-label="Problem, what I did, outcome">${steps}</ol>
        <dl class="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">${facts}</dl>
        <p class="sw-f-tech mt-4 font-mono text-[11px] leading-5 text-faint">${c.technologies.map(esc).join(" · ")}</p>
        <div class="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-5">
          <a href="${esc(c.href)}" class="sw-f-link rounded-sm font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>
          ${c.links
            .map((l) => `<a href="${esc(l.href)}" class="sw-f-link rounded-sm font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
            .join("")}
        </div>
      </div>
    </article>`;
}

const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;

function css(n: number): string {
  // One rule group per state: show its readout and figure, mark its node, draw its figure. Static CSS in production.
  const per = Array.from({ length: n }, (_, i) => {
    const sel = `#sw-f:has(#sw-f-r${i}:checked)`;
    const fig = `${sel} .sw-f-fig[data-fig="${i}"]`;
    return {
      show: [
        `${sel} .sw-f-panel[data-panel="${i}"], ${fig}{visibility:visible;opacity:1}`,
        `${sel} .sw-f-frame{--hue:${hueOf(i)}}`,
      ].join("\n"),
      motion: [
        `${sel} .sw-f-panel[data-panel="${i}"] .sw-f-step{animation:sw-f-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms)}`,
        `${sel} .sw-f-panel[data-panel="${i}"] .sw-f-trace::before{animation:sw-f-grow .5s cubic-bezier(.2,.7,.2,1) both}`,
        `${fig} .draw{stroke-dasharray:1;animation:sw-f-draw .8s cubic-bezier(.3,.6,.2,1) both}`,
        `${fig} :is(.nd,.dot,.ah,.dash,.spoke){animation:sw-f-fade .45s ease-out both}`,
        `${fig} :is(.svc,.step){animation:sw-f-fade .3s ease-out both;animation-delay:calc(.35s + var(--i) * 45ms)}`,
        `${fig} .accept + .inner{animation:sw-f-fade .35s ease-out 1.9s both}`,
        `${fig} .comet{animation:sw-f-comet 1.3s cubic-bezier(.45,0,.25,1) both;animation-delay:calc(.7s + var(--d, 0ms))}`,
      ].join("\n"),
    };
  });
  return `
    #sw-f{--gap:.75rem}
    #sw-f .sw-f-rail{display:flex;flex-direction:column;gap:var(--gap)}
    #sw-f .sw-f-item{position:relative}
    #sw-f .sw-f-label{display:grid;grid-template-columns:2.75rem minmax(0,1fr);align-items:center;column-gap:1rem;padding:.3rem .75rem .3rem 0;border-radius:6px;cursor:pointer;width:100%}
    #sw-f .sw-f-node{position:relative;display:grid;place-items:center;width:2.5rem;height:2.5rem;margin:0 auto;border-radius:9999px;font-family:${MONO};font-size:12px;
      border:1.5px solid var(--hue);color:var(--muted);background:var(--bg);transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
    #sw-f .sw-f-node.sw-f-draft{border-style:dashed}
    #sw-f .sw-f-node.sw-f-running::after{content:"";position:absolute;inset:3px;border-radius:9999px;border:1px solid var(--hue);opacity:.7}
    #sw-f .sw-f-text{min-width:0;display:block}
    #sw-f .sw-f-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:500;line-height:1.35;color:var(--muted);transition:color .2s ease}
    #sw-f .sw-f-when{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:${MONO};font-size:11px;line-height:1.25rem;color:var(--faint)}
    #sw-f .sw-f-label:hover .sw-f-node{box-shadow:0 0 0 6px color-mix(in srgb,var(--hue) 14%,transparent)}
    #sw-f .sw-f-label:hover .sw-f-title{color:var(--text)}
    #sw-f .sw-f-radio:checked + .sw-f-label .sw-f-node{color:var(--text);background:color-mix(in srgb,var(--hue) 18%,var(--bg));box-shadow:0 0 0 7px color-mix(in srgb,var(--hue) 16%,transparent);transform:scale(1.06)}
    #sw-f .sw-f-radio:checked + .sw-f-label .sw-f-title{color:var(--text)}
    #sw-f .sw-f-radio:focus-visible + .sw-f-label{outline:2px solid var(--lavender);outline-offset:2px}
    #sw-f .sw-f-edge{position:absolute;left:calc(1.375rem - .75px);top:calc(50% + 1.25rem + 3px);height:calc(100% + var(--gap) - 2.5rem - 6px);width:1.5px;background:var(--border)}
    #sw-f .sw-f-edge::after{content:"";position:absolute;bottom:-1px;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}
    #sw-f .sw-f-start{position:absolute;left:calc(1.375rem - .75px);top:calc(50% - 1.25rem - 1.25rem);height:calc(1.25rem - 3px);width:1.5px;background:var(--faint)}
    #sw-f .sw-f-start::after{content:"";position:absolute;bottom:-1px;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}

    /* Phones and tablets: the rail runs left to right, names under the nodes, periods left to the panel. The legend
       goes (the panel shows draft and period in words); the hint stays for screen readers. */
    @media (max-width:1023.98px){
      #sw-f .sw-f-col{gap:.875rem}
      #sw-f .sw-f-plate{padding:.7rem .6rem}
      #sw-f .sw-f-legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      #sw-f .sw-f-rail{flex-direction:row;gap:0}
      #sw-f .sw-f-item{flex:1 1 0;min-width:0}
      #sw-f .sw-f-label{grid-template-columns:minmax(0,1fr);justify-items:center;row-gap:.45rem;padding:.4rem .15rem;text-align:center}
      #sw-f .sw-f-title{white-space:normal;font-size:12.5px;line-height:1.25}
      #sw-f .sw-f-when{display:none}
      #sw-f .sw-f-edge{top:calc(.4rem + 1.25rem - .75px);left:calc(50% + 1.25rem + 5px);width:calc(100% - 2.5rem - 10px);height:1.5px}
      #sw-f .sw-f-edge::after{bottom:auto;top:50%;left:auto;right:-1px;translate:0 -50%;border:4px solid transparent;border-left:5px solid var(--faint);border-right:0}
      #sw-f .sw-f-start{top:calc(.4rem + 1.25rem - .75px);left:calc(50% - 1.25rem - 1rem);width:calc(1rem - 4px);height:1.5px}
      #sw-f .sw-f-start::after{bottom:auto;top:50%;left:auto;right:-1px;translate:0 -50%;border:4px solid transparent;border-left:5px solid var(--faint);border-right:0}
    }

    #sw-f .sw-f-figs{display:grid}
    #sw-f .sw-f-figs > *{grid-area:1/1;min-width:0}
    #sw-f .sw-f-fig{margin:0;display:flex;flex-direction:column;gap:.5rem}
    #sw-f .sw-f-plate{display:grid;place-items:center;padding:.9rem .75rem;border-radius:6px;
      border:1px solid color-mix(in srgb,var(--hue) 28%,var(--border));background:color-mix(in srgb,var(--surface) 55%,var(--bg))}
    #sw-f .sw-f-fig figcaption{font-family:${MONO};font-size:11px;line-height:1.5;color:var(--faint)}
    #sw-f .sw-f-fign{color:var(--hue)}
    #sw-f svg{display:block;width:100%;height:auto;overflow:visible}
    #sw-f .sw-f-fig{--line:color-mix(in srgb,var(--hue) 60%,var(--faint))}
    #sw-f .ln{fill:none;stroke:var(--line);stroke-width:1.25;stroke-linecap:round}
    #sw-f .dash{stroke-dasharray:2 4}
    #sw-f .nd{fill:var(--bg);stroke:var(--line);stroke-width:1.25}
    #sw-f .ah{fill:var(--line)}
    #sw-f .dot{fill:var(--line);stroke:none}
    #sw-f .lb{font-family:${MONO};font-size:11px;fill:var(--muted)}
    #sw-f .lb.strong{fill:var(--text)}
    #sw-f .lb.dim{fill:var(--faint)}
    #sw-f .spoke{stroke-width:.75;opacity:.7}
    #sw-f :is(.svc,.step),#sw-f .accept + .inner{fill:color-mix(in srgb,var(--hue) 35%,var(--bg))}
    #sw-f .comet{fill:none;stroke:var(--hue);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:.05 2;stroke-dashoffset:.05;opacity:0}

    #sw-f .sw-f-frame{border-color:color-mix(in srgb,var(--hue) 30%,var(--border));transition:border-color .3s ease}
    #sw-f .sw-f-dot{background:var(--hue)}
    #sw-f .sw-f-trace{position:relative}
    #sw-f .sw-f-trace::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
    @media (max-width:639.98px){#sw-f .sw-f-trace::before{display:none}}
    #sw-f .sw-f-draftmark{border-color:color-mix(in srgb,var(--peach) 60%,transparent)}
    #sw-f .sw-f-link:hover{text-decoration-color:var(--hue)}
    #sw-f .sw-f-link:focus-visible{outline:2px solid var(--lavender);outline-offset:3px}
    #sw-f .sw-f-stack{display:grid}
    #sw-f .sw-f-stack > *{grid-area:1/1}
    @supports selector(:has(*)){
      #sw-f .sw-f-panel,#sw-f .sw-f-fig{visibility:hidden;opacity:0;transition:opacity .25s ease}
      ${per.map((p) => p.show).join("\n")}
      @media (prefers-reduced-motion:no-preference){
        ${per.map((p) => p.motion).join("\n")}
      }
    }
    @supports not selector(:has(*)){
      #sw-f .sw-f-stack,#sw-f .sw-f-figs{display:flex;flex-direction:column;gap:1rem}
      #sw-f .sw-f-stack > * + *{border-top:1px solid var(--border)}
      #sw-f .sw-f-hint{display:none}
    }
    @keyframes sw-f-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes sw-f-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes sw-f-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    @keyframes sw-f-fade{from{opacity:0}}
    @keyframes sw-f-comet{0%{stroke-dashoffset:.05;opacity:0}8%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:-1;opacity:0}}
    @media (prefers-reduced-motion:reduce){
      #sw-f *,#sw-f *::before,#sw-f *::after{animation:none!important;transition:none!important}
    }`;
}

const variant: Variant = {
  name: "Rail figures",
  mount(root, { work }) {
    const n = work.length;
    const section = document.createElement("section");
    section.id = "sw-f";
    section.setAttribute("aria-labelledby", "sw-f-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-20 sm:px-8";
    section.innerHTML = `
      <style>${css(n)}</style>
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="sw-f-title" class="font-serif text-3xl text-text sm:text-4xl">Selected Work</h2>
        <p class="font-mono text-xs text-faint">${n} Case Studies · problem → did → outcome</p>
      </div>
      <div class="sw-f-grid mt-10 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
        <div class="sw-f-col flex min-w-0 flex-col gap-5">
          <div role="radiogroup" aria-label="Case Studies" class="sw-f-rail">
            ${work.map((c, i) => stateRow(c, i, n)).join("")}
          </div>
          <div class="sw-f-figs">${work.map(figure).join("")}</div>
          <p class="sw-f-legend mt-auto flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] leading-5 text-faint">
            <span id="sw-f-hint" class="sw-f-hint">select a state to read its trace</span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true"><span class="relative inline-block size-3 rounded-full border border-faint after:absolute after:inset-[2px] after:rounded-full after:border after:border-faint"></span>still running</span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true"><span class="inline-block size-3 rounded-full border border-dashed border-faint"></span>draft</span>
          </p>
        </div>
        <div class="sw-f-frame min-w-0 rounded-lg border bg-surface">
          <div class="sw-f-stack">${work.map(readout).join("")}</div>
        </div>
      </div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
