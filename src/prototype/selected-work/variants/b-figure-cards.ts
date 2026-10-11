// PROTOTYPE: throwaway. Variant B, "Figure cards": each Case Study is a card carrying a small hand-built figure of its own
// system or story (variants/b/diagrams.ts). Uneven rhythm on purpose: Blinka is a wide feature, GOLD and NoEstasSolx a
// staggered 5/7 pair, Teaching a mirrored strip. Everything after mount is CSS: lines draw in on scroll
// (animation-timeline: view), a card glows in its own hue on hover/focus and a comet runs its figure once. No JS needed.
import type { CaseStudy } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./b/diagrams";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const HUE: Record<string, string> = { blinka: "peach", "gold-to-mercury": "mauve", noestassolx: "green", teaching: "sky" };
const SHAPE: Record<string, string> = { blinka: "c-feature", "gold-to-mercury": "c-tall", noestassolx: "c-wide", teaching: "c-strip" };

const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`;

const CSS = `
#selected-work.swb { --pad: 1.25rem; }
.swb-head { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:.5rem 2rem; }
.swb-head h2 { font-family:${SERIF}; font-size:clamp(2rem,4vw,2.75rem); line-height:1.05; letter-spacing:-.01em; color:var(--text); }
.swb-head p { font-family:${MONO}; font-size:11.5px; color:var(--faint); }
.swb-head p b { font-weight:400; color:var(--muted); }
.swb-grid { list-style:none; margin:2.25rem 0 0; padding:0; display:grid; grid-template-columns:minmax(0,1fr); gap:1.25rem; }

.swb-card { position:relative; container-type:inline-size; display:flex; flex-direction:column; gap:1.25rem;
  padding:var(--pad); border:1px solid var(--border); border-radius:6px;
  background:color-mix(in oklab, var(--surface) 65%, var(--bg));
  --line:color-mix(in oklab, var(--accent) 38%, var(--faint));
  transition:border-color .3s, box-shadow .3s, background-color .3s; }
.swb-card:hover, .swb-card:focus-within {
  --line:var(--accent);
  border-color:color-mix(in oklab, var(--accent) 60%, var(--border));
  background:color-mix(in oklab, var(--accent) 4%, color-mix(in oklab, var(--surface) 65%, var(--bg)));
  box-shadow:0 0 0 3px color-mix(in oklab, var(--accent) 13%, transparent), 0 14px 34px -22px color-mix(in oklab, var(--accent) 70%, transparent); }
.swb-card:has(.swb-link:focus-visible) { outline:2px solid var(--accent); outline-offset:4px; }

.swb-meta { display:flex; flex-wrap:wrap; align-items:center; gap:.35rem .75rem; font-family:${MONO}; font-size:11px; color:var(--faint); }
.swb-meta .n { color:var(--accent); }
.swb-draft { display:inline-flex; gap:.4rem; align-items:center; padding:.1rem .5rem; border:1px dashed color-mix(in oklab, var(--accent) 70%, var(--border));
  border-radius:3px; color:var(--muted); }
.swb-draft b { font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); }
.swb-title { margin-top:.6rem; font-family:${SERIF}; font-size:1.55rem; line-height:1.15; color:var(--text); text-wrap:balance; }
.c-feature .swb-title { font-size:clamp(1.75rem,3.2vw,2.35rem); }
.swb-link { color:inherit; text-decoration:none; outline:none; }
.swb-link::after { content:""; position:absolute; inset:0; border-radius:inherit; z-index:1; }
.swb-role { margin-top:.35rem; font-size:.875rem; color:var(--muted); }
.swb-sum { margin-top:.9rem; color:var(--text); line-height:1.55; max-width:40rem; }
.swb-facts { display:flex; flex-wrap:wrap; gap:.75rem 1.75rem; margin-top:1.1rem; padding:0; list-style:none; }
.swb-facts li { display:flex; flex-direction:column; gap:.1rem; min-width:6rem; max-width:13rem; }
.swb-facts .v { font-family:${MONO}; font-size:1.2rem; color:var(--text); }
.swb-facts .l { font-size:.78rem; line-height:1.35; color:var(--muted); }
.swb-body { display:flex; flex-direction:column; flex:1; }
.swb-foot { display:flex; flex-wrap:wrap; gap:.5rem 1.25rem; align-items:center; margin-top:auto; padding-top:1.25rem; font-family:${MONO}; font-size:12px; }
.swb-go { color:var(--text); }
.swb-go i { display:inline-block; font-style:normal; color:var(--accent); transition:transform .3s; }
.swb-card:hover .swb-go i, .swb-card:focus-within .swb-go i { transform:translateX(4px); }
.swb-ext { position:relative; z-index:2; color:var(--muted); text-decoration:underline; text-underline-offset:3px; text-decoration-color:var(--border); }
.swb-ext:hover { color:var(--text); text-decoration-color:var(--accent); }
.swb-ext:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:2px; }

.swb-fig { margin:0; display:flex; flex-direction:column; gap:.6rem; }
.swb-fig .plate { display:grid; place-items:center; padding:1rem .5rem; border-radius:4px;
  background:color-mix(in oklab, var(--bg) 70%, transparent); border:1px solid color-mix(in oklab, var(--border) 60%, transparent); }
.swb-fig figcaption { font-family:${MONO}; font-size:11px; line-height:1.5; color:var(--faint); }
.swb-fig figcaption span { color:var(--accent); }
.swb svg { display:block; width:100%; height:auto; overflow:visible; }
.swb .fig-narrow { display:none; }
@container (max-width: 470px) { .swb .fig-wide { display:none; } .swb .fig-narrow { display:block; } .swb .fig-solo .lb { font-size:12.5px; } }

.swb .ln { fill:none; stroke:var(--line); stroke-width:1.25; stroke-linecap:round; transition:stroke .35s; }
.swb .dash { stroke-dasharray:2 4; }
.swb .nd { fill:var(--bg); stroke:var(--line); stroke-width:1.25; transition:stroke .35s, fill .35s; }
.swb .ah { fill:var(--line); transition:fill .35s; }
.swb .dot { fill:var(--line); stroke:none; transition:fill .35s; }
.swb .lb { font-family:${MONO}; font-size:11px; fill:var(--muted); transition:fill .35s; }
.swb .lb.strong { fill:var(--text); }
.swb .lb.dim { fill:var(--faint); }
.swb-card:hover .lb.dim, .swb-card:focus-within .lb.dim { fill:var(--muted); }
.swb-card:hover .accept + .inner, .swb-card:focus-within .accept + .inner,
.swb-card:hover .step, .swb-card:focus-within .step,
.swb-card:hover .svc, .swb-card:focus-within .svc { fill:color-mix(in oklab, var(--accent) 35%, var(--bg)); }
.swb .spoke { stroke-width:.75; opacity:.7; }
.swb .comet { fill:none; stroke:var(--accent); stroke-width:3.5; stroke-linecap:round; stroke-dasharray:.05 2; stroke-dashoffset:.05; opacity:0; }

@media (min-width: 900px) {
  #selected-work.swb { --pad: 1.75rem; }
  .swb-grid { grid-template-columns:repeat(12,minmax(0,1fr)); gap:1.5rem; }
  .c-feature { grid-column:1 / -1; display:grid; grid-template-columns:5fr 7fr; gap:2.5rem; align-items:center; padding:2.25rem; }
  .c-tall { grid-column:1 / span 5; }
  .c-wide { grid-column:6 / -1; margin-top:3.5rem; }
  .c-strip { grid-column:1 / -1; display:grid; grid-template-columns:7fr 5fr; gap:2.5rem; align-items:center; }
  .c-strip .swb-fig { order:-1; }
}
.c-tall .swb-fig { order:-1; }

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .swb-card { view-timeline:--swb-card block; }
    .swb .draw { stroke-dasharray:1; animation:swb-draw linear both; animation-timeline:--swb-card; animation-range:cover 0px cover 40vh; }
    .swb .nd, .swb .dot, .swb .ah, .swb .dash, .swb .spoke { animation:swb-fade linear both; animation-timeline:--swb-card; animation-range:cover 0px cover 30vh; }
  }
  .swb-card:hover .comet, .swb-card:focus-within .comet { animation:swb-comet 1.5s cubic-bezier(.45,0,.25,1) both; }
}
@media (prefers-reduced-motion: reduce) { .swb * { transition:none !important; } }
@keyframes swb-draw { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
@keyframes swb-fade { from { opacity:0; } }
@keyframes swb-comet { 0% { stroke-dashoffset:.05; opacity:0; } 8% { opacity:1; } 88% { opacity:1; } 100% { stroke-dashoffset:-1; opacity:0; } }
`;

function card(c: CaseStudy, i: number) {
  const fig = FIGURES[c.slug];
  const n = String(i + 1).padStart(2, "0");
  const draft = c.draft
    ? `<span class="swb-draft"><b>draft</b>${esc(c.draft.reason)}</span>`
    : "";
  const facts = c.facts.map((f) => `<li><span class="v">${esc(f.value)}</span><span class="l">${esc(f.label)}</span></li>`).join("");
  const ext = c.external ? `<a class="swb-ext" href="${esc(c.external.href)}" rel="noopener">${esc(c.external.label)} ↗</a>` : "";
  return `<li class="swb-card ${SHAPE[c.slug] ?? ""}" style="--accent:var(--${HUE[c.slug] ?? "lavender"})">
  <div class="swb-body">
    <p class="swb-meta"><span class="n">${n}</span><span>${esc(c.org)} · ${esc(c.period.label)}</span>${draft}</p>
    <h3 class="swb-title"><a class="swb-link" href="${esc(c.href)}">${esc(c.title)}</a></h3>
    <p class="swb-role">${esc(c.role)}</p>
    <p class="swb-sum">${esc(c.summary)}</p>
    <ul class="swb-facts" aria-label="In numbers">${facts}</ul>
    <p class="swb-foot"><span class="swb-go" aria-hidden="true">case study <i>→</i></span>${ext}</p>
  </div>
  ${fig ? `<figure class="swb-fig"><div class="plate">${fig.draw(c)}</div><figcaption><span>fig. ${i + 1}</span> ${esc(fig.caption(c))}</figcaption></figure>` : ""}
</li>`;
}

const variant: Variant = {
  name: "Figure cards",
  mount(root, { work }) {
    const section = document.createElement("section");
    section.id = "selected-work";
    section.className = "swb mx-auto w-full max-w-6xl px-4 py-24 sm:px-8";
    section.setAttribute("aria-labelledby", "sw-title");
    section.innerHTML = `<style>${CSS}</style>
<header class="swb-head">
  <h2 id="sw-title">Selected Work</h2>
  <p><b>${work.length} case studies</b> · each told as problem → what I did → outcome</p>
</header>
<ol class="swb-grid">${work.map(card).join("")}</ol>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
