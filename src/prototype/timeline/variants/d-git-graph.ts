// PROTOTYPE: throwaway. Variant D, "git log --graph": the Timeline as a commit graph read newest first.
// Education is the trunk down the middle; Engineering and Teaching branch off it when they start, run
// solid while I'm in a role and dotted between roles, and are still open at the top (HEAD, now). Giant
// outlined years stick beside the graph and fill in as you scroll through them; the lanes draw themselves
// as each row rises. All of it is static HTML plus CSS scroll-driven animations: no listeners, no frames.
import type { Variant } from "../types";
import { GRAPH_W, NODE_Y, mi, model, type Entry, type Lane, type Row, type State } from "./d/graph";
import { STYLE } from "./d/style";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const human = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const span = (n: number) => {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};

const COLOR: Record<Lane, string> = { engineering: "var(--mauve)", teaching: "var(--peach)", education: "var(--sky)" };
const LANE_NAME: Record<Lane, string> = { engineering: "Engineering", teaching: "Teaching", education: "Education" };

const variant: Variant = {
  name: "git log --graph",
  mount(root, ctx) {
    const M = model(ctx);
    const { tracks, education: edu, cv, openToWork, reducedMotion } = ctx;
    // Lanes, left to right: the second Track, the Education trunk, then the first Track, so Engineering sits
    // nearest the text and the Tracks fork outward from the trunk without crossing each other.
    const X: Record<Lane, number> = { [tracks[1].id]: 10, education: 32, [tracks[0].id]: 54 } as Record<Lane, number>;
    const LANES: Lane[] = ["engineering", "education", "teaching"];
    const label = (l: Lane) => (l === "education" ? LANE_NAME.education : (tracks.find((t) => t.id === l)?.label ?? LANE_NAME[l]));

    // Lanes sit at a fraction of the graph column, which is 48 px on phones and GRAPH_W from sm.
    const at = (x: number) => `${((x / GRAPH_W) * 100).toFixed(3)}%`;
    const seg = (l: Lane, s: State | "next", top: string, bottom: string) =>
      s === "none" ? "" : `<i class="tld-seg" data-lane="${l}" data-s="${s}" style="left:${at(X[l])};top:${top};bottom:${bottom};--c:${COLOR[l]}"></i>`;
    const node = (l: Lane | "next", n: string) =>
      `<span class="tld-node" data-n="${n}" style="left:${at(l === "next" ? X.education : X[l])};top:${NODE_Y}px;--c:${l === "next" ? "var(--green)" : COLOR[l]}"></span>`;

    /** A real row's lanes: above its node, the state just after its time; below, each stretch until the next row. */
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
        html += `<svg class="tld-curve" data-lane="${row.e.track}" style="top:${NODE_Y}px;width:100%;height:40px;stroke:${COLOR[row.e.track]}" viewBox="0 0 ${GRAPH_W} 40" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M${x} 0C${x} 24 ${tx} 16 ${tx} 40"/></svg>`;
      }
      return html;
    }
    /** Filler rows (year headers on phones, empty years) carry the lanes straight through. */
    const fillLanes = (tNext: number) => LANES.map((l) => seg(l, M.state(l, tNext + 0.5), "0", "0")).join("");

    const graphCell = (lanes: string, nodes = "") =>
      `<div class="relative" aria-hidden="true"><div class="tld-lanes absolute inset-0">${lanes}</div>${nodes}</div>`;

    const time = (ym: string, text = human(ym)) => `<time datetime="${ym}">${text}</time>`;
    const NOW = `<span style="color:var(--c)">now</span>`;
    // The duration is derivable from the dates beside it, so on phones it goes (screen readers keep it) and the
    // meta line fits on one line.
    const dur = (d: string) => `<span class="max-sm:hidden" aria-hidden="true">·</span><span class="max-sm:sr-only">${d}</span>`;

    /** Highlights with a number in them are the hard counts a Recruiter scans for; the rest are the softer lines. */
    const counted = (h: string) => /\d/.test(h);
    const hl = (h: string, cls = "") =>
      `<li class="flex gap-2${cls}"><span aria-hidden="true" style="color:var(--c)">+</span><span>${esc(h)}</span></li>`;
    const HL_LIST = "space-y-1.5 font-mono text-[12.5px] leading-snug text-muted";

    function entryCard(e: Entry) {
      const end = e.end === "present" ? time(ctx.now, NOW) : time(e.end);
      const months = M.endX(e) - mi(e.start);
      const where = e.context
        ? `<span class="font-medium" style="color:var(--c)">${esc(e.context)}</span> · ${esc(e.organization)}`
        : `<span class="font-medium" style="color:var(--c)">${esc(e.organization)}</span>`;
      // Below xl only the lead highlight shows (the first hard count, else the first line); the rest fold into a
      // native disclosure. At xl the right column has the room, so every highlight shows and the disclosure goes.
      // xl grid: the commit message spans both rows on the left; highlights, then the case-study link, on the right.
      const lead = Math.max(0, e.highlights.findIndex(counted));
      const rest = e.highlights.filter((_, k) => k !== lead);
      const more = rest.length
        ? `<details class="tld-more xl:hidden">
        <summary class="inline-block cursor-pointer rounded-sm font-mono text-xs text-faint hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender">+${rest.length} more</summary>
        <ul class="mt-1.5 ${HL_LIST}">${rest.map((h) => hl(h)).join("")}</ul>
      </details>`
        : "";
      const link = e.caseStudy
        ? `<a href="#case-${e.caseStudy.slug}" class="rounded-sm font-mono text-xs text-lavender underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender">Case study<span class="max-sm:sr-only">: ${esc(e.caseStudy.title)}</span> →</a>`
        : "";
      return `
<article class="tld-in pb-5 pt-1">
  <div class="tld-card -mx-3 rounded-lg px-3 py-2 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-[auto_1fr] xl:gap-x-10">
    <div class="xl:row-span-2">
      <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
        <span style="color:var(--c)">${esc(label(e.track))}</span><span aria-hidden="true">·</span>
        <span>${time(e.start)} → ${end}</span>${dur(span(months))}
      </p>
      <h4 class="mt-2 text-lg leading-snug text-text">${esc(e.title)}${
        e.draft
          ? ` <span class="ml-1 rounded-sm border border-border px-1 align-[3px] font-mono text-[10px] leading-4 text-faint" title="Copy pending clearance">draft</span>`
          : ""
      }</h4>
      <p class="mt-0.5 text-sm text-muted">${where}</p>
      <p class="mt-3 max-w-prose text-sm leading-relaxed text-muted">${esc(e.summary)}</p>
    </div>
    <ul class="mt-3 ${HL_LIST} xl:mt-0">
      ${e.highlights.map((h, k) => hl(h, k === lead ? "" : " hidden xl:flex")).join("")}
    </ul>
    ${
      more || link
        ? `<div class="tld-foot mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 xl:col-start-2 xl:mt-3 xl:self-start">${more}${link}</div>`
        : ""
    }
  </div>
</article>`;
    }

    /** Every row's grid: the graph column (48 px on phones, GRAPH_W from sm) and the card. */
    const ROW = "tld-row relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-6";

    function rowHtml(row: Row, i: number) {
      const cls = ROW;
      if (row.kind === "next") {
        const curves = (["engineering", "teaching"] as Lane[])
          .filter((l) => M.state(l, M.now + 0.5) === "active")
          .map((l) => `<path vector-effect="non-scaling-stroke" d="M${X.education} 0C${X.education} 55 ${X[l]} 45 ${X[l]} 100"/>`)
          .join("");
        const lanes = `<svg class="tld-curve" style="top:${NODE_Y}px;width:100%;height:calc(100% - ${NODE_Y}px);stroke:var(--green);stroke-dasharray:4 4" viewBox="0 0 ${GRAPH_W} 100" preserveAspectRatio="none">${curves}</svg>`;
        return `
<li class="${cls}" data-lane="next" style="--c:var(--green)">
  ${graphCell(lanes, node("next", "next"))}
  <div class="tld-in pb-5 pt-1"><div class="tld-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint"><span class="text-green">open to roles</span> · uncommitted</p>
    <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
      <p class="text-lg leading-snug text-text">I'm open to new roles. <span class="text-sm text-muted">The whole record is below, and in my CV.</span></p>
      <a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-green/50 px-3 py-1.5 font-mono text-xs text-green hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender">↓ ${esc(cv.label)}</a>
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
<li class="${cls}" data-lane="head" style="--c:var(--lavender)">
  ${graphCell(rowLanes(row, i), tips)}
  <div class="tld-in pb-5"><div class="tld-card -mx-3 rounded-lg px-3 py-2">
    <p class="max-w-prose text-base leading-6 text-muted"><span class="mr-1 whitespace-nowrap font-mono text-xs text-faint"><span class="rounded-sm bg-lavender/15 px-1 text-lavender">HEAD</span> ${time(ctx.now)}</span> Right now I'm ${roles}.</p>
  </div></div>
</li>`;
      }
      if (row.kind === "edu") {
        return `
<li class="${cls}" data-lane="education" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "edu"))}
  <article class="tld-in pb-5 pt-1"><div class="tld-card -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
      <span style="color:var(--c)">Education</span><span aria-hidden="true">·</span>
      <span>${time(edu.start)} → ${time(edu.end)}</span>${dur(span(mi(edu.end) + 1 - mi(edu.start)))}
    </p>
    <h4 class="mt-2 text-lg leading-snug text-text">${esc(edu.degree)}</h4>
    <p class="mt-0.5 text-sm text-muted"><span class="font-medium" style="color:var(--c)">${esc(edu.institution)}</span> · ${esc(edu.location)}</p>
  </div></article>
</li>`;
      }
      if (row.kind === "root") {
        return `
<li class="${cls}" data-lane="education" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "root"))}
  <div class="tld-in pb-2 pt-1"><div class="tld-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint">${time(edu.start)} · the trunk starts: my Bachelor's at ${esc(edu.institution)}</p>
  </div></div>
</li>`;
      }
      return `
<li class="${cls}" data-lane="${row.e.track}" style="--c:${COLOR[row.e.track]}">
  ${graphCell(rowLanes(row, i), node(row.e.track, "dot"))}
  ${entryCard(row.e)}
</li>`;
    }

    // The t of the first real row at or below each year group, for the filler rows' lane states.
    const realRows = M.rows.filter((r) => r.kind !== "next");
    const tFrom = (year: number) => (realRows.find((r) => r.year <= year) ?? realRows[realRows.length - 1]).t;

    const years = M.years
      .map(({ year, rows }) => {
        const fill = fillLanes(tFrom(year));
        return `
<li class="tld-ygroup lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:gap-x-6">
  <div class="hidden lg:block" aria-hidden="true">
    <div class="tld-yr sticky top-24 pt-0.5 font-serif text-6xl leading-none">${year}</div>
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
    section.setAttribute("aria-labelledby", "timeline-title");
    section.className = `tld ${reducedMotion ? "" : "tld-anim"} mx-auto w-full max-w-6xl px-4 py-16 sm:px-8`;
    section.innerHTML = `
<style>${STYLE}</style>
<header class="lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:gap-x-6">
  <div class="hidden lg:block"></div>
  <div>
    <p class="font-mono text-xs text-faint" aria-hidden="true"><span class="text-lavender">$</span> <span class="tld-cmd" style="width:${cmd.length}ch;animation-timing-function:steps(${cmd.length})">${cmd}</span> <span class="tld-caret"></span></p>
    <div class="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <h2 id="timeline-title" class="font-serif text-4xl leading-none text-text sm:text-5xl">Timeline</h2>
      ${
        openToWork
          ? "" // the "next" row carries the CV link, in green
          : `<a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text hover:border-lavender hover:text-lavender focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender">↓ ${esc(cv.label)}</a>`
      }
    </div>
    <p class="mt-3 max-w-prose text-muted lg:max-w-none">Two tracks, ${esc(tracks.map((t) => t.label).join(" and "))}, branching off my degree. Newest first${
      places.length === 1 ? `, all in ${esc(places[0])}` : ""
    }.</p>
    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs" aria-label="Key">
      ${tracks.map((t) => swatch(t.id, t.blurb)).join("")}
      ${swatch("education", "the trunk")}
      <li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5" style="background:repeating-linear-gradient(to right,var(--faint) 0 2px,transparent 2px 6px)"></i><span class="text-faint">between roles</span></li>
    </ul>
  </div>
</header>
<ol class="mt-10" aria-label="Roles and education by year, newest first">${years}</ol>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
