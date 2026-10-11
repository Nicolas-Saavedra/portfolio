// PROTOTYPE: throwaway. Variant A, "Graph with inline depth": Timeline D's `git log --graph` is the whole section, and
// every commit that belongs to a Case Study carries a ring and opens, in place, into Selected Work H's readout
// (problem → what I did → outcome, its figure, its facts, its /work link). One readout per Case Study, rendered once,
// under the row of its newest span, which a newest-first reader meets first:
//   - Blinka, NoEstasSolx: under their role.
//   - Teaching: under Instructor (2025). The Programming Tutor row (2023) opens the same readout from below: its label
//     targets the same checkbox, and the browser scrolls up to it. The readout's span strip names both roles.
//   - GOLD → mercury: under a trunk commit for the thesis (mercury-lib, 2025), which isn't a role and so sits on the
//     Education trunk. The Research Assistant row (2022) points up to it the same way.
// Opening is a checkbox per Case Study (+ :has()), so several can be open at once; the row's own highlights give way to
// the readout, so no count is printed twice. Open to Work adds D's green "next" row with the CV, and nothing starts
// open; otherwise the first Case Study (Blinka) starts open. No listeners: everything after `mount` is CSS.
import { caseStudyOf, roleById, type CaseStudy, type Span } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./a/diagrams";
import { GRAPH_W, NODE_Y, mi, model, openerOf, opensHere, type Entry, type Lane, type Row, type State } from "./a/graph";
import { css } from "./a/style";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const human = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const span = (n: number) => {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};

const COLOR: Record<Lane, string> = { engineering: "var(--mauve)", teaching: "var(--peach)", education: "var(--sky)" };
const LANE_NAME: Record<Lane, string> = { engineering: "Engineering", teaching: "Teaching", education: "Education" };
const STEPS = ["problem", "did", "outcome"] as const;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender";

const variant: Variant = {
  name: "Graph with inline depth",
  mount(root, ctx) {
    const M = model(ctx);
    const { tracks, education: edu, cv, openToWork, reducedMotion, work } = ctx;
    const X: Record<Lane, number> = { [tracks[1].id]: 10, education: 32, [tracks[0].id]: 54 } as Record<Lane, number>;
    const LANES: Lane[] = ["engineering", "education", "teaching"];
    const label = (l: Lane) => (l === "education" ? LANE_NAME.education : (tracks.find((t) => t.id === l)?.label ?? LANE_NAME[l]));
    /** The lane a span sits on: its role's Track, or the trunk. */
    const laneOf = (s: Span): Lane => (s.role ? (roleById(s.role)!.track as Lane) : "education");
    /** The first Case Study opens by default, unless Open to Work collapses depth. */
    const startsOpen = (cs: CaseStudy) => !openToWork && cs.slug === work[0].slug;

    const at = (x: number) => `${((x / GRAPH_W) * 100).toFixed(3)}%`;
    const seg = (l: Lane, s: State | "next", top: string, bottom: string) =>
      s === "none" ? "" : `<i class="wa-seg" data-lane="${l}" data-s="${s}" style="left:${at(X[l])};top:${top};bottom:${bottom};--c:${COLOR[l]}"></i>`;
    const node = (l: Lane | "next", n: string) =>
      `<span class="wa-node" data-n="${n}" style="left:${at(l === "next" ? X.education : X[l])};top:${NODE_Y}px;--c:${l === "next" ? "var(--green)" : COLOR[l]}"></span>`;

    function rowLanes(row: Row, i: number) {
      const tNext = M.tBelow(i);
      let html = "";
      for (const l of LANES) {
        let above: State | "next" = M.state(l, row.t + 0.5);
        if (row.kind === "head" && openToWork && M.state(l, M.now + 0.5) === "active") above = "next";
        html += seg(l, above, "0", `calc(100% - ${NODE_Y}px)`);
        for (const p of M.stretches(l, row.t, tNext)) {
          html += seg(l, p.s, `calc(${NODE_Y}px + (100% - ${NODE_Y}px) * ${p.f0.toFixed(4)})`, `calc((100% - ${NODE_Y}px) * ${(1 - p.f1).toFixed(4)})`);
        }
      }
      if (row.kind === "entry" && row.fork) {
        const x = X[row.e.track];
        const tx = X.education;
        html += `<svg class="wa-curve" data-lane="${row.e.track}" style="top:${NODE_Y}px;width:100%;height:40px;stroke:${COLOR[row.e.track]}" viewBox="0 0 ${GRAPH_W} 40" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M${x} 0C${x} 24 ${tx} 16 ${tx} 40"/></svg>`;
      }
      return html;
    }
    const fillLanes = (tNext: number) => LANES.map((l) => seg(l, M.state(l, tNext + 0.5), "0", "0")).join("");
    const graphCell = (lanes: string, nodes = "") =>
      `<div class="relative" aria-hidden="true"><div class="wa-lanes absolute inset-0">${lanes}</div>${nodes}</div>`;

    const time = (ym: string, text = human(ym)) => `<time datetime="${ym}">${text}</time>`;
    const NOW = `<span style="color:var(--c)">now</span>`;
    const dur = (d: string) => `<span class="max-sm:hidden" aria-hidden="true">·</span><span class="max-sm:sr-only">${d}</span>`;
    const counted = (h: string) => /\d/.test(h);
    const hl = (h: string, cls = "") =>
      `<li class="flex gap-2${cls}"><span aria-hidden="true" style="color:var(--c)">+</span><span>${esc(h)}</span></li>`;
    const HL_LIST = "space-y-1.5 font-mono text-[12.5px] leading-snug text-muted";
    const DRAFT = `<span class="ml-1 rounded-sm border border-dashed border-peach/60 px-1 align-[3px] font-mono text-[10px] leading-4 text-peach" title="Copy pending clearance">draft</span>`;

    // ── The Case Study controls ─────────────────────────────────────────────────────────────────────────────────
    const cbId = (cs: CaseStudy) => `wa-cb-${cs.slug}`;
    /** The checkbox sits just before its toggle (tab order), but is pinned to the top of the opener row's article
     * (absolute; the article is the positioned ancestor), so a label clicked further down scrolls up to the row. */
    const checkbox = (cs: CaseStudy) =>
      `<input type="checkbox" class="wa-cb" id="${cbId(cs)}" aria-controls="wa-ro-${cs.slug}" aria-label="Case Study: ${esc(cs.title)}"${startsOpen(cs) ? " checked" : ""} />`;
    /** The opener row's toggle. Visual only: the checkbox above carries the name and state for assistive tech. */
    const toggle = (cs: CaseStudy) => `${checkbox(cs)}
      <label for="${cbId(cs)}" class="wa-tog" data-opener aria-hidden="true">
        <span class="wa-closed">▸ Case Study<span class="max-sm:hidden">: ${esc(cs.title)}</span></span>
        <span class="wa-open">▾ Close the Case Study</span>
      </label>`;
    /** An older span's row: the same checkbox, opened from below. The browser scrolls up to it on click. */
    const pointer = (cs: CaseStudy) => {
      const o = openerOf(cs);
      return `
      <label for="${cbId(cs)}" class="wa-tog wa-ptr">
        <span class="wa-closed">↑ Case Study: ${esc(cs.short)} <span class="text-faint max-sm:sr-only">· told at ${esc(o.label)}, ${o.start.slice(0, 4)}</span></span>
        <span class="wa-open">↑ ${esc(cs.short)}: open above <span class="text-faint">· close</span></span>
      </label>`;
    };

    /** The story's stretches, oldest first: how one Case Study maps onto several rows. Only for multi-span stories. */
    function spanStrip(cs: CaseStudy) {
      if (cs.spans.length < 2) return "";
      const item = (s: Span, k: number) => {
        const l = laneOf(s);
        const end = s.end === "present" ? `<time datetime="${ctx.now}">now</time>` : time(s.end);
        return `<li class="wa-span" style="--c:${COLOR[l]}">${k ? `<span class="wa-sarrow" aria-hidden="true">→</span>` : ""}<i class="wa-sdot${s.role ? "" : " wa-sdia"}" aria-hidden="true"></i><span class="text-text">${esc(s.label)}</span> <span class="whitespace-nowrap">${time(s.start)} – ${end}</span>${s.role ? "" : ` <span class="text-faint">· not a role, inside my degree</span>`}</li>`;
      };
      return `<ol class="wa-spans" aria-label="Where this story happened">${cs.spans.map(item).join("")}</ol>`;
    }

    /** H's readout, once per Case Study, inline under its opener row. */
    function readout(cs: CaseStudy) {
      const fig = FIGURES[cs.slug];
      const facts = cs.facts
        .map((f) => `<div class="min-w-0"><dt class="sr-only">${esc(f.label)}</dt><dd class="font-mono text-lg leading-none text-text">${esc(f.value)}</dd><dd class="mt-1 text-xs leading-snug text-muted">${esc(f.label)}</dd></div>`)
        .join("");
      const steps = STEPS.map(
        (key, k) => `<li class="wa-step" style="--k:${k}"><span class="wa-dot" aria-hidden="true"></span><span class="wa-steplabel">${key === "did" ? "what I did" : key}</span><p class="wa-steptext">${esc(cs[key])}</p></li>`,
      ).join("");
      return `
<div class="wa-ro" id="wa-ro-${cs.slug}" data-cs="${cs.slug}" style="--hue:${COLOR[laneOf(openerOf(cs))]}">
  <div class="wa-clip">
    <article class="wa-panel" aria-labelledby="wa-h-${cs.slug}">
      <p class="wa-head"><span style="color:var(--hue)">Case Study</span>${
        cs.draft ? `<span class="wa-draftmark">draft · ${esc(cs.draft.reason)}</span>` : ""
      }</p>
      <h5 id="wa-h-${cs.slug}" class="wa-title font-serif leading-tight text-text">${esc(cs.title)}</h5>
      ${spanStrip(cs)}
      <ol class="wa-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
      ${
        fig
          ? `<figure class="wa-fig"><div class="wa-plate">${fig.draw(cs)}</div><figcaption>${esc(fig.caption(cs))}</figcaption></figure>`
          : `<div class="wa-fig"></div>`
      }
      <dl class="wa-facts">${facts}</dl>
      <div class="wa-foot">
        <p class="wa-tech">${cs.technologies.map(esc).join(" · ")}</p>
        <div class="wa-links">
          <a href="${esc(cs.href)}" class="wa-link font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(cs.title)}</span> <span aria-hidden="true">→</span></a>
          ${cs.links.map((l) => `<a href="${esc(l.href)}" class="wa-link font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join("")}
          <label for="${cbId(cs)}" class="wa-close" aria-hidden="true">▴ close</label>
        </div>
      </div>
    </article>
  </div>
</div>`;
    }

    // ── Rows ────────────────────────────────────────────────────────────────────────────────────────────────────
    function entryCard(e: Entry) {
      const cs = caseStudyOf(e);
      const opener = opensHere(e);
      const end = e.end === "present" ? time(ctx.now, NOW) : time(e.end);
      const months = M.endX(e) - mi(e.start);
      const where = e.context
        ? `<span class="font-medium" style="color:var(--c)">${esc(e.context)}</span> · ${esc(e.organization)}`
        : `<span class="font-medium" style="color:var(--c)">${esc(e.organization)}</span>`;
      const lead = Math.max(0, e.highlights.findIndex(counted));
      const rest = e.highlights.filter((_, k) => k !== lead);
      const more = rest.length
        ? `<details class="wa-more wa-hl xl:hidden">
        <summary class="inline-block cursor-pointer rounded-sm font-mono text-xs text-faint hover:text-text ${FOCUS}">+${rest.length} more</summary>
        <ul class="mt-1.5 ${HL_LIST}">${rest.map((h) => hl(h)).join("")}</ul>
      </details>`
        : "";
      const ctl = cs ? (opener ? toggle(cs) : pointer(cs)) : "";
      return `
<article class="wa-in relative pb-5 pt-1">
  <div class="wa-card -mx-3 rounded-lg px-3 py-2 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-[auto_1fr] xl:gap-x-10">
    <div class="xl:row-span-2">
      <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
        <span style="color:var(--c)">${esc(label(e.track))}</span><span aria-hidden="true">·</span>
        <span class="wa-when">${time(e.start)} → ${end}</span>${dur(span(months))}
      </p>
      <h4 class="mt-2 text-lg leading-snug text-text">${esc(e.title)}${e.draft ? ` ${DRAFT}` : ""}</h4>
      <p class="mt-0.5 text-sm text-muted">${where}</p>
      <p class="wa-sum mt-3 max-w-prose text-sm leading-relaxed text-muted">${esc(e.summary)}</p>
    </div>
    <ul class="wa-hl mt-3 ${HL_LIST} xl:mt-0">
      ${e.highlights.map((h, k) => hl(h, k === lead ? "" : " hidden xl:flex")).join("")}
    </ul>
    ${more || ctl ? `<div class="wa-cfoot mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 xl:col-start-2 xl:mt-3 xl:self-start">${more}${ctl}</div>` : ""}
  </div>
  ${cs && opener ? readout(cs) : ""}
</article>`;
    }

    /** A Case Study span that isn't a role (the thesis): a commit on the trunk, which opens the story. */
    function spanCard(cs: CaseStudy, s: Span) {
      const idx = cs.spans.indexOf(s);
      const prev = idx > 0 ? cs.spans[idx - 1] : undefined;
      const end = s.end === "present" ? time(ctx.now, NOW) : time(s.end);
      const opener = openerOf(cs) === s;
      return `
<article class="wa-in relative pb-5 pt-1">
  <div class="wa-card -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
      <span style="color:var(--c)">Education</span><span aria-hidden="true">·</span>
      <span class="wa-when">${time(s.start)} → ${end}</span>${dur(span(mi(s.end === "present" ? ctx.now : s.end) + 1 - mi(s.start)))}
    </p>
    <h4 class="mt-2 text-lg leading-snug text-text">${esc(s.label)}</h4>
    <p class="mt-0.5 text-sm text-muted">Inside my degree, not a role${prev ? ` · <span>↓ continues ${esc(prev.label)}, ${prev.start.slice(0, 4)}</span>` : ""}</p>
    <div class="wa-cfoot mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">${opener ? toggle(cs) : pointer(cs)}</div>
  </div>
  ${opener ? readout(cs) : ""}
</article>`;
    }

    const ROW = "wa-row relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-6";

    function rowHtml(row: Row, i: number) {
      if (row.kind === "next") {
        const curves = (["engineering", "teaching"] as Lane[])
          .filter((l) => M.state(l, M.now + 0.5) === "active")
          .map((l) => `<path vector-effect="non-scaling-stroke" d="M${X.education} 0C${X.education} 55 ${X[l]} 45 ${X[l]} 100"/>`)
          .join("");
        const lanes = `<svg class="wa-curve" style="top:${NODE_Y}px;width:100%;height:calc(100% - ${NODE_Y}px);stroke:var(--green);stroke-dasharray:4 4" viewBox="0 0 ${GRAPH_W} 100" preserveAspectRatio="none">${curves}</svg>`;
        const otw = ctx.openToWorkCopy;
        return `
<li class="${ROW}" data-lane="next" style="--c:var(--green)">
  ${graphCell(lanes, node("next", "next"))}
  <div class="wa-in pb-5 pt-1"><div class="wa-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint"><span class="text-green">${esc(otw.signal)}</span> · uncommitted</p>
    <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
      <p class="text-lg leading-snug text-text">${esc(otw.sentence)} <span class="text-sm text-muted">${esc(otw.aside)}</span></p>
      <a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-green/50 px-3 py-1.5 font-mono text-xs text-green hover:bg-green/10 ${FOCUS}">↓ ${esc(cv.label)}</a>
    </div>
  </div></div>
</li>`;
      }
      if (row.kind === "head") {
        const tips = M.present.map((e) => node(e.track, "tip")).join("");
        const roles = M.present
          .map((e) => `<b class="font-medium" style="color:${COLOR[e.track]}">${esc(e.title)}</b> at ${esc(e.organization)}${e.context ? ` (${esc(e.context)})` : ""}`)
          .join(" and ");
        return `
<li class="${ROW}" data-lane="head" style="--c:var(--lavender)">
  ${graphCell(rowLanes(row, i), tips)}
  <div class="wa-in pb-5"><div class="wa-card -mx-3 rounded-lg px-3 py-2">
    <p class="max-w-prose text-base leading-6 text-muted"><span class="mr-1 whitespace-nowrap font-mono text-xs text-faint"><span class="rounded-sm bg-lavender/15 px-1 text-lavender">HEAD</span> ${time(ctx.now)}</span> Right now I'm ${roles}.</p>
  </div></div>
</li>`;
      }
      if (row.kind === "edu") {
        return `
<li class="${ROW}" data-lane="education" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "edu"))}
  <article class="wa-in pb-5 pt-1"><div class="wa-card -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
      <span style="color:var(--c)">Education</span><span aria-hidden="true">·</span>
      <span class="wa-when">${time(edu.start)} → ${time(edu.end)}</span>${dur(span(mi(edu.end) + 1 - mi(edu.start)))}
    </p>
    <h4 class="mt-2 text-lg leading-snug text-text">${esc(edu.degree)}</h4>
    <p class="mt-0.5 text-sm text-muted"><span class="font-medium" style="color:var(--c)">${esc(edu.institution)}</span> · ${esc(edu.location)}</p>
  </div></article>
</li>`;
      }
      if (row.kind === "root") {
        return `
<li class="${ROW}" data-lane="education" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "root"))}
  <div class="wa-in pb-2 pt-1"><div class="wa-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint">${time(edu.start)} · the trunk starts: my Bachelor's at ${esc(edu.institution)}</p>
  </div></div>
</li>`;
      }
      if (row.kind === "span") {
        return `
<li class="${ROW}" data-lane="education" data-cs="${row.cs.slug}" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "cs"))}
  ${spanCard(row.cs, row.span)}
</li>`;
      }
      const cs = caseStudyOf(row.e);
      return `
<li class="${ROW}" data-lane="${row.e.track}"${cs ? ` data-cs="${cs.slug}"` : ""} style="--c:${COLOR[row.e.track]}">
  ${graphCell(rowLanes(row, i), node(row.e.track, cs ? "cs" : "dot"))}
  ${entryCard(row.e)}
</li>`;
    }

    const realRows = M.rows.filter((r) => r.kind !== "next");
    const tFrom = (year: number) => (realRows.find((r) => r.year <= year) ?? realRows[realRows.length - 1]).t;

    const years = M.years
      .map(({ year, rows }) => {
        const fill = fillLanes(tFrom(year));
        return `
<li class="wa-ygroup lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:gap-x-6">
  <div class="hidden lg:block" aria-hidden="true">
    <div class="wa-yr sticky top-24 pt-0.5 font-serif text-6xl leading-none">${year}</div>
  </div>
  <div>
    <div class="${ROW} lg:sr-only">
      ${graphCell(fill)}
      <h3 class="pb-0.5 pt-1.5 font-serif text-xl leading-none text-faint">${year}</h3>
    </div>
    ${
      rows.length
        ? `<ol>${rows.map(({ row, i }) => rowHtml(row, i)).join("")}</ol>`
        : `<div class="${ROW} h-16 max-lg:hidden">${graphCell(fill)}</div>`
    }
  </div>
</li>`;
      })
      .join("");

    const places = [...new Set([...ctx.entries.map((e) => e.location), edu.location])];
    const swatch = (l: Lane, blurb: string) =>
      `<li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5 rounded-full" style="background:${COLOR[l]}"></i><span class="text-text">${esc(label(l))}</span><span class="text-faint max-sm:hidden">${esc(blurb)}</span></li>`;

    const cmd = "git log --graph --all";
    const section = document.createElement("section");
    section.id = "wh-a";
    section.setAttribute("aria-labelledby", "wa-title");
    section.className = `${reducedMotion ? "" : "wa-anim"} ${openToWork ? "wa-otw" : ""} mx-auto w-full max-w-6xl px-4 py-16 sm:px-8`;
    section.innerHTML = `
<style>${css(work.map((c) => c.slug))}</style>
<header class="lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:gap-x-6">
  <div class="hidden lg:block"></div>
  <div>
    <p class="font-mono text-xs text-faint" aria-hidden="true"><span class="text-lavender">$</span> <span class="wa-cmd" style="width:${cmd.length}ch;animation-timing-function:steps(${cmd.length})">${cmd}</span> <span class="wa-caret"></span></p>
    <div class="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <h2 id="wa-title" class="font-serif text-4xl leading-none text-text sm:text-5xl">Work</h2>
      ${
        openToWork
          ? "" // the green "next" row carries the CV link
          : `<a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text hover:border-lavender hover:text-lavender ${FOCUS}">↓ ${esc(cv.label)}</a>`
      }
    </div>
    <p class="mt-3 max-w-prose text-muted lg:max-w-none">Two tracks, ${esc(tracks.map((t) => t.label).join(" and "))}, branching off my degree, newest first${
      places.length === 1 ? `, all in ${esc(places[0])}` : ""
    }. A ringed commit <i class="wa-keyring" aria-hidden="true"></i> opens its Case Study.</p>
    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs" aria-label="Key">
      ${tracks.map((t) => swatch(t.id, t.blurb)).join("")}
      ${swatch("education", "the trunk")}
      <li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5" style="background:repeating-linear-gradient(to right,var(--faint) 0 2px,transparent 2px 6px)"></i><span class="text-faint">between roles</span></li>
    </ul>
  </div>
</header>
<ol class="mt-10" aria-label="Roles, education and Case Studies by year, newest first">${years}</ol>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
