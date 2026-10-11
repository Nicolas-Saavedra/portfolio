// PROTOTYPE: throwaway. Variant C, "Career automaton".
// Selected Work as a small machine: the four Case Studies are states on a vertical rail, and selecting one opens
// its readout (mono metadata plus a problem → did → outcome trace) in a panel whose height is reserved for the
// tallest Case Study, so switching never reflows the page. The mechanics are CSS only (radio inputs + :has()):
// `mount` just writes static markup and one <style> block, and attaches no listeners. Without :has() support
// every readout is shown, stacked.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";

const HUES = ["--peach", "--mauve", "--green", "--sky"];
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const q = (i: number) => `q${String(i).split("").map((d) => SUB[+d]).join("")}`;

function stateRow(c: CaseStudy, i: number, n: number): string {
  const hue = `var(${HUES[i % HUES.length]})`;
  const running = c.period.end === "present";
  return `
    <div class="sw-c-item relative lg:flex lg:flex-1 lg:items-center" style="--hue:${hue}">
      ${i === 0 ? `<span class="sw-c-start" aria-hidden="true"></span>` : ""}
      <input class="sw-c-radio sr-only" type="radio" name="sw-c-state" id="sw-c-r${i}" value="${esc(c.slug)}"
        ${i === 0 ? "checked" : ""} aria-describedby="sw-c-hint" />
      <label for="sw-c-r${i}" class="sw-c-label group grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 rounded-md py-2 pr-3">
        <span class="sw-c-node relative mx-auto grid size-10 place-items-center rounded-full font-mono text-xs ${running ? "sw-c-running" : ""} ${c.draft ? "sw-c-draft" : ""}" aria-hidden="true">${q(i)}</span>
        <span class="min-w-0">
          <span class="sw-c-title block truncate text-[15px] font-medium leading-snug">${esc(c.short)}</span>
          <span class="block truncate font-mono text-[11px] leading-5 text-faint">${esc(c.period.label)}${c.draft ? ` · <span class="text-peach">draft</span>` : ""}</span>
        </span>
      </label>
      ${i < n - 1 ? `<span class="sw-c-edge" aria-hidden="true"></span>` : ""}
    </div>`;
}

const STEPS: { key: "problem" | "did" | "outcome"; label: string }[] = [
  { key: "problem", label: "problem" },
  { key: "did", label: "did" },
  { key: "outcome", label: "outcome" },
];

function readout(c: CaseStudy, i: number): string {
  const hue = `var(${HUES[i % HUES.length]})`;
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
      <li class="sw-c-step relative grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 pb-5 last:pb-0 max-sm:grid-cols-1" style="--k:${k}">
        <span class="sw-c-steplabel relative flex items-start gap-2 pt-[3px] font-mono text-[11px] uppercase tracking-wider text-faint max-sm:pb-1">
          <span class="sw-c-dot mt-[3px] size-2 shrink-0 rounded-full" aria-hidden="true"></span>${s.label}
        </span>
        <p class="text-[15px] leading-relaxed text-text">${esc(c[s.key])}</p>
      </li>`,
  ).join("");
  return `
    <article class="sw-c-panel flex min-w-0 flex-col" data-panel="${i}" aria-labelledby="sw-c-h${i}" style="--hue:${hue}">
      <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3 font-mono text-xs text-faint sm:px-6">
        <span><span style="color:${hue}">${q(i)}</span> · ${esc(c.slug)}</span>
        <span>${esc(c.period.label)}</span>
      </header>
      <div class="flex flex-1 flex-col px-5 pt-5 pb-6 sm:px-6">
        ${
          c.draft
            ? `<p class="sw-c-draftmark mb-4 self-start rounded border border-dashed px-2 py-0.5 font-mono text-[11px] text-peach">draft · ${esc(c.draft.reason)}</p>`
            : ""
        }
        <h3 id="sw-c-h${i}" class="font-serif text-2xl leading-tight text-text sm:text-[1.75rem]">${esc(c.title)}</h3>
        <p class="mt-1.5 text-sm text-muted">${esc(c.org)} · ${esc(c.role)}</p>
        <ol class="sw-c-trace mt-6" aria-label="Problem, what I did, outcome">${steps}</ol>
        <dl class="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-3">${facts}</dl>
        <p class="mt-5 font-mono text-[11px] leading-5 text-faint">${c.technologies.map(esc).join(" · ")}</p>
        <div class="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
          <a href="${esc(c.href)}" class="sw-c-link rounded-sm font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>
          ${c.links
            .map((l) => `<a href="${esc(l.href)}" class="sw-c-link rounded-sm font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
            .join("")}
        </div>
      </div>
    </article>`;
}

function css(n: number): string {
  // One rule pair per state: show the matching readout, mark the matching node. Static CSS in production.
  const per = Array.from({ length: n }, (_, i) =>
    [
      `#sw-c:has(#sw-c-r${i}:checked) .sw-c-panel[data-panel="${i}"]{visibility:visible;opacity:1}`,
      `#sw-c:has(#sw-c-r${i}:checked) .sw-c-panel[data-panel="${i}"] .sw-c-step{animation:sw-c-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms)}`,
      `#sw-c:has(#sw-c-r${i}:checked) .sw-c-panel[data-panel="${i}"] .sw-c-trace::before{animation:sw-c-draw .5s cubic-bezier(.2,.7,.2,1) both}`,
      `#sw-c:has(#sw-c-r${i}:checked) .sw-c-frame{--hue:var(${HUES[i % HUES.length]})}`,
    ].join("\n"),
  ).join("\n");
  return `
    #sw-c{--gap:.75rem}
    @media (min-width:1024px){#sw-c{--gap:0px}}
    #sw-c .sw-c-rail{gap:var(--gap)}
    #sw-c .sw-c-node{border:1.5px solid var(--hue);color:var(--muted);background:var(--bg);transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
    #sw-c .sw-c-node.sw-c-draft{border-style:dashed}
    #sw-c .sw-c-node.sw-c-running::after{content:"";position:absolute;inset:3px;border-radius:9999px;border:1px solid var(--hue);opacity:.7}
    #sw-c .sw-c-title{color:var(--muted);transition:color .2s ease}
    #sw-c .sw-c-label:hover .sw-c-node{box-shadow:0 0 0 6px color-mix(in srgb,var(--hue) 14%,transparent)}
    #sw-c .sw-c-label:hover .sw-c-title{color:var(--text)}
    #sw-c .sw-c-radio:checked + .sw-c-label .sw-c-node{color:var(--text);background:color-mix(in srgb,var(--hue) 18%,var(--bg));box-shadow:0 0 0 7px color-mix(in srgb,var(--hue) 16%,transparent);transform:scale(1.06)}
    #sw-c .sw-c-radio:checked + .sw-c-label .sw-c-title{color:var(--text)}
    #sw-c .sw-c-radio:focus-visible + .sw-c-label{outline:2px solid var(--lavender);outline-offset:2px}
    #sw-c .sw-c-edge{position:absolute;left:calc(1.375rem - .75px);top:calc(50% + 1.25rem + 3px);height:calc(100% + var(--gap) - 2.5rem - 6px);width:1.5px;background:var(--border)}
    #sw-c .sw-c-edge::after{content:"";position:absolute;bottom:-1px;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}
    #sw-c .sw-c-start{position:absolute;left:calc(1.375rem - .75px);top:calc(50% - 1.25rem - 1.5rem);height:calc(1.5rem - 3px);width:1.5px;background:var(--faint)}
    #sw-c .sw-c-start::after{content:"";position:absolute;bottom:-1px;left:50%;translate:-50% 0;border:4px solid transparent;border-top:5px solid var(--faint);border-bottom:0}
    #sw-c .sw-c-frame{border-color:color-mix(in srgb,var(--hue) 30%,var(--border));transition:border-color .3s ease}
    #sw-c .sw-c-dot{background:var(--hue)}
    #sw-c .sw-c-trace{position:relative}
    #sw-c .sw-c-trace::before{content:"";position:absolute;left:3.25px;top:12px;bottom:10px;width:1.5px;background:color-mix(in srgb,var(--hue) 45%,var(--border));transform-origin:top}
    @media (max-width:639.98px){#sw-c .sw-c-trace::before{display:none}}
    #sw-c .sw-c-draftmark{border-color:color-mix(in srgb,var(--peach) 60%,transparent)}
    #sw-c .sw-c-link:hover{text-decoration-color:var(--hue)}
    #sw-c .sw-c-link:focus-visible{outline:2px solid var(--lavender);outline-offset:3px}
    #sw-c .sw-c-stack{display:grid}
    #sw-c .sw-c-stack > *{grid-area:1/1}
    @supports selector(:has(*)){
      #sw-c .sw-c-panel{visibility:hidden;opacity:0;transition:opacity .25s ease}
      ${per}
    }
    @supports not selector(:has(*)){
      #sw-c .sw-c-stack{display:flex;flex-direction:column;gap:0}
      #sw-c .sw-c-stack > * + *{border-top:1px solid var(--border)}
      #sw-c .sw-c-hint{display:none}
    }
    @keyframes sw-c-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    @keyframes sw-c-draw{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @media (prefers-reduced-motion:reduce){
      #sw-c *,#sw-c *::before,#sw-c *::after{animation:none!important;transition:none!important}
    }`;
}

const variant: Variant = {
  name: "Career automaton",
  mount(root, { work }) {
    const n = work.length;
    const section = document.createElement("section");
    section.id = "sw-c";
    section.setAttribute("aria-labelledby", "sw-c-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-24";
    section.innerHTML = `
      <style>${css(n)}</style>
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="sw-c-title" class="font-serif text-3xl text-text sm:text-4xl">Selected Work</h2>
        <p class="font-mono text-xs text-faint">${n} Case Studies · problem → did → outcome</p>
      </div>
      <div class="mt-10 grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
        <div class="lg:flex lg:flex-col">
          <div role="radiogroup" aria-label="Case Studies" class="sw-c-rail mt-5 flex flex-col lg:flex-1">
            ${work.map((c, i) => stateRow(c, i, n)).join("")}
          </div>
          <p id="sw-c-hint" class="sw-c-hint mt-6 font-mono text-[11px] leading-5 text-faint">select a state to read its trace</p>
          <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] leading-5 text-faint" aria-hidden="true">
            <span class="inline-flex items-center gap-1.5"><span class="relative inline-block size-3 rounded-full border border-faint after:absolute after:inset-[2px] after:rounded-full after:border after:border-faint"></span>still running</span>
            <span class="inline-flex items-center gap-1.5"><span class="inline-block size-3 rounded-full border border-dashed border-faint"></span>draft</span>
          </p>
        </div>
        <div class="sw-c-frame min-w-0 rounded-lg border bg-surface">
          <div class="sw-c-stack">${work.map(readout).join("")}</div>
        </div>
      </div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
