// PROTOTYPE: throwaway. Variant C, "Sticky readout": D's `git log --graph` is the main column and scrolls; H's readout
// is docked beside it (sticky) and shows the story of whichever row is crossing a marker line 45 % down the screen.
// - Every row is a named view timeline whose scrollport is inset to that 1 px line (`view-timeline-inset`), and the
//   section lifts all the names into scope (`timeline-scope`), so the dock, which isn't inside any row, can animate on
//   them. Each readout runs one animation per row that docks it; while one is active it sets `--wh-c-live: on`, and a
//   style query shows the readout. No listeners, observers or frames: `mount` writes markup and one <style> block.
// - Rows tile the list (year headers live inside the row below them), so exactly one row is ever on the line.
// - Teaching's readout is docked by both of its roles; GOLD → mercury's by its role and by a thesis commit on the
//   Education trunk (the thesis is not a role: it happened inside the degree). The readout's span path lights the
//   stretch you're on.
// - Below 1024 px the dock becomes a strip stuck to the bottom of the screen: the Case Study's facts and its link.
import { caseStudyOf, rolesOf } from "../content";
import type { CaseStudy, Role } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./c/diagrams";
import { GRAPH_W, NODE_Y, mi, model, type Lane, type Row, type State } from "./c/graph";
import { css } from "./c/style";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const human = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
const q = (i: number) => `q${String(i).split("").map((d) => SUB[+d]).join("")}`;
const dur = (n: number) => {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};

const COLOR: Record<Lane, string> = { engineering: "var(--mauve)", teaching: "var(--peach)", education: "var(--sky)" };
const STEPS = ["problem", "did", "outcome"] as const;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender";

/** A role's highlight that says the same count as one of its Case Study's facts. The fact is shown, not this. */
const covered = (h: string, cs?: CaseStudy) => !!cs && cs.facts.some((f) => h.includes(f.value));
const counted = (h: string) => /\d/.test(h);

const variant: Variant = {
  name: "Sticky readout",
  mount(root, ctx) {
    const M = model(ctx);
    const { tracks, education: edu, cv, openToWork, reducedMotion, work } = ctx;
    const X: Record<Lane, number> = { [tracks[1].id]: 10, education: 32, [tracks[0].id]: 54 } as Record<Lane, number>;
    const LANES: Lane[] = ["engineering", "education", "teaching"];
    const trackLabel = (l: Lane) => (l === "education" ? "Education" : (tracks.find((t) => t.id === l)?.label ?? l));
    const hueOf = (cs: CaseStudy) => COLOR[rolesOf(cs)[0]?.track ?? "education"];
    const csIndex = (cs: CaseStudy) => work.indexOf(cs);

    // ── Rows and the readouts they dock ──────────────────────────────────────────────────────────────────────────
    const rowId = (r: Row) =>
      r.kind === "entry" ? `wh-c-row-${r.e.id}` : r.kind === "thesis" ? `wh-c-row-${r.cs.slug}-thesis` : `wh-c-row-${r.kind}`;
    /** Readout keys in DOM order: rest, the Case Studies, then the role readouts (desktop only). */
    const docks = ["rest", ...work.map((c) => c.slug), "edu", ...ctx.entries.filter((e) => !caseStudyOf(e)).map((e) => `role:${e.id}`)];
    const rowsOf = (key: string) => M.rows.map((r, i) => ({ r, i })).filter(({ r }) => r.dock === key).map(({ i }) => i);
    const rowOfRole = (id: string) => M.rows.findIndex((r) => r.kind === "entry" && r.e.id === id);

    // ── Graph pieces (D's, positions as % of the graph column) ─────────────────────────────────────────────────────
    const at = (x: number) => `${((x / GRAPH_W) * 100).toFixed(3)}%`;
    const seg = (l: Lane, s: State | "next", top: string, bottom: string) =>
      s === "none" ? "" : `<i class="wh-c-seg" data-lane="${l}" data-s="${s}" style="left:${at(X[l])};top:${top};bottom:${bottom};--c:${COLOR[l]}"></i>`;
    const node = (l: Lane | "next", n: string) =>
      `<span class="wh-c-node" data-n="${n}" style="left:${at(l === "next" ? X.education : X[l])};top:${NODE_Y}px;--c:${l === "next" ? "var(--green)" : COLOR[l]}"></span>`;

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
        html += `<svg class="wh-c-curve" data-lane="${row.e.track}" style="top:${NODE_Y}px;width:100%;height:40px;stroke:${COLOR[row.e.track]}" viewBox="0 0 ${GRAPH_W} 40" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M${x} 0C${x} 24 ${tx} 16 ${tx} 40"/></svg>`;
      }
      return html;
    }
    const fillLanes = (t: number) => LANES.map((l) => seg(l, M.state(l, t + 0.5), "0", "0")).join("");
    const graphCell = (lanes: string, nodes = "") =>
      `<div class="relative" aria-hidden="true"><div class="wh-c-lanes absolute inset-0">${lanes}</div>${nodes}</div>`;
    const G = "wh-c-g relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-6";

    const time = (ym: string, text = human(ym)) => `<time datetime="${ym}">${text}</time>`;
    const NOW = `<span style="color:var(--c)">now</span>`;
    // The duration is derivable from the dates beside it, so phones drop it, except with Open to Work, which surfaces dates.
    const durHtml = (d: string) =>
      openToWork
        ? `<span aria-hidden="true">·</span><span>${d}</span>`
        : `<span class="max-sm:hidden" aria-hidden="true">·</span><span class="max-sm:sr-only">${d}</span>`;
    const hl = (h: string) =>
      `<li class="flex gap-2"><span aria-hidden="true" style="color:var(--c)">+</span><span>${esc(h)}</span></li>`;
    const HL = "space-y-1.5 font-mono text-[12.5px] leading-snug text-muted";

    /** A role's card. A role with a Case Study shows only the highlights its facts don't already say (the readout
     * shows the facts); one without shows its lead count, the rest on phones behind "+N more", on desktop in the dock. */
    function entryCard(e: Role, cs?: CaseStudy) {
      const end = e.end === "present" ? time(ctx.now, NOW) : time(e.end);
      const months = M.endX(e) - mi(e.start);
      const where = e.context
        ? `<span class="font-medium" style="color:var(--c)">${esc(e.context)}</span> · ${esc(e.organization)}`
        : `<span class="font-medium" style="color:var(--c)">${esc(e.organization)}</span>`;
      const shown = e.highlights.filter((h) => !covered(h, cs));
      const lead = Math.max(0, shown.findIndex(counted));
      const rest = shown.filter((_, k) => k !== lead);
      const more = rest.length
        ? `<details class="wh-c-more lg:hidden">
        <summary class="inline-block cursor-pointer rounded-sm font-mono text-xs text-faint hover:text-text ${FOCUS}">+${rest.length} more</summary>
        <ul class="mt-1.5 ${HL}">${rest.map(hl).join("")}</ul>
      </details>`
        : "";
      const link = cs
        ? `<a href="${esc(cs.href)}" class="wh-c-cslink rounded-sm font-mono text-xs text-lavender underline-offset-4 hover:underline ${FOCUS}">Case study<span class="sr-only">: ${esc(cs.title)}</span> →</a>`
        : "";
      return `
<article class="wh-c-in pb-4 pt-1">
  <div class="wh-c-card relative -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint lg:pr-24">
      <span style="color:var(--c)">${esc(trackLabel(e.track))}</span><span aria-hidden="true">·</span>
      <span>${time(e.start)} → ${end}</span>${durHtml(dur(months))}
    </p>
    <h4 class="mt-2 text-lg leading-snug text-text">${esc(e.title)}${
      e.draft
        ? ` <span class="ml-1 rounded-sm border border-border px-1 align-[3px] font-mono text-[10px] leading-4 text-faint" title="Copy pending clearance">draft</span>`
        : ""
    }</h4>
    <p class="mt-0.5 text-sm text-muted">${where}</p>
    ${shown.length ? `<ul class="mt-2.5 ${HL}">${hl(shown[lead])}</ul>` : ""}
    ${more || link ? `<div class="wh-c-foot mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 lg:mt-0">${more}${link}</div>` : ""}
  </div>
</article>`;
    }

    function commit(row: Row, i: number) {
      if (row.kind === "next") {
        const curves = (["engineering", "teaching"] as Lane[])
          .filter((l) => M.state(l, M.now + 0.5) === "active")
          .map((l) => `<path vector-effect="non-scaling-stroke" d="M${X.education} 0C${X.education} 55 ${X[l]} 45 ${X[l]} 100"/>`)
          .join("");
        const lanes = `<svg class="wh-c-curve" style="top:${NODE_Y}px;width:100%;height:calc(100% - ${NODE_Y}px);stroke:var(--green);stroke-dasharray:4 4" viewBox="0 0 ${GRAPH_W} 100" preserveAspectRatio="none">${curves}</svg>`;
        return `
<div class="${G}" style="--c:var(--green)">
  ${graphCell(lanes, node("next", "next"))}
  <div class="wh-c-in pb-4 pt-1"><div class="wh-c-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint"><span class="text-green">next</span> · uncommitted</p>
    <p class="mt-2 text-lg leading-snug text-text">${esc(ctx.openToWorkCopy.sentence)} <span class="text-sm text-muted">${esc(ctx.openToWorkCopy.aside)}</span></p>
  </div></div>
</div>`;
      }
      if (row.kind === "head") {
        const tips = M.present.map((e) => node(e.track, "tip")).join("");
        const roles = M.present
          .map((e) => `<b class="font-medium" style="color:${COLOR[e.track]}">${esc(e.title)}</b> at ${esc(e.organization)}${e.context ? ` (${esc(e.context)})` : ""}`)
          .join(" and ");
        return `
<div class="${G}" style="--c:var(--lavender)">
  ${graphCell(rowLanes(row, i), tips)}
  <div class="wh-c-in pb-4"><div class="wh-c-card -mx-3 rounded-lg px-3 py-2">
    <p class="max-w-prose text-base leading-6 text-muted"><span class="mr-1 whitespace-nowrap font-mono text-xs text-faint"><span class="rounded-sm bg-lavender/15 px-1 text-lavender">HEAD</span> ${time(ctx.now)}</span> Right now I'm ${roles}.</p>
  </div></div>
</div>`;
      }
      if (row.kind === "edu") {
        return `
<div class="${G}" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "edu"))}
  <article class="wh-c-in pb-4 pt-1"><div class="wh-c-card -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint">
      <span style="color:var(--c)">Education</span><span aria-hidden="true">·</span>
      <span>${time(edu.start)} → ${time(edu.end)}</span>${durHtml(dur(mi(edu.end) + 1 - mi(edu.start)))}
    </p>
    <h4 class="mt-2 text-lg leading-snug text-text">${esc(edu.degree)}</h4>
    <p class="mt-0.5 text-sm text-muted"><span class="font-medium" style="color:var(--c)">${esc(edu.institution)}</span> · ${esc(edu.location)}</p>
  </div></article>
</div>`;
      }
      if (row.kind === "thesis") {
        const [name, what = ""] = row.span.label.split(/,\s*/);
        const before = row.cs.spans[row.cs.spans.indexOf(row.span) - 1];
        const beforeName = before?.label.split(/,\s*/)[0];
        return `
<div class="${G}" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "span"))}
  <article class="wh-c-in pb-4 pt-1"><div class="wh-c-card relative -mx-3 rounded-lg px-3 py-2">
    <p class="flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 text-faint lg:pr-24">
      <span style="color:var(--c)">Inside the degree</span><span aria-hidden="true">·</span>
      <span>${time(row.span.start)} → ${time(row.span.end)}</span>
    </p>
    <h4 class="mt-1.5 text-base leading-snug text-text"><span class="font-medium">${esc(name)}</span>, my ${esc(what)}${
      beforeName ? `<span class="text-muted">: ${esc(beforeName)}, rebuilt</span>` : ""
    }</h4>
    <div class="wh-c-foot mt-1.5 lg:mt-0"><a href="${esc(row.cs.href)}" class="wh-c-cslink rounded-sm font-mono text-xs text-lavender underline-offset-4 hover:underline ${FOCUS}">Case study<span class="sr-only">: ${esc(row.cs.title)}</span> →</a></div>
  </div></article>
</div>`;
      }
      if (row.kind === "root") {
        return `
<div class="${G}" style="--c:${COLOR.education}">
  ${graphCell(rowLanes(row, i), node("education", "root"))}
  <div class="wh-c-in pb-2 pt-1"><div class="wh-c-card -mx-3 rounded-lg px-3 py-2">
    <p class="font-mono text-xs leading-4 text-faint">${time(edu.start)} · the trunk starts: my Bachelor's at ${esc(edu.institution)}</p>
  </div></div>
</div>`;
      }
      return `
<div class="${G}" style="--c:${COLOR[row.e.track]}">
  ${graphCell(rowLanes(row, i), node(row.e.track, "dot"))}
  ${entryCard(row.e, row.cs)}
</div>`;
    }

    const rowsHtml = M.rows
      .map((row, i) => {
        const yrs = row.years
          .map(
            (y) => `
<div class="${G}">
  ${graphCell(fillLanes(row.t))}
  <h3 class="pb-0.5 pt-1.5 font-serif text-xl leading-none text-faint">${y}</h3>
</div>`,
          )
          .join("");
        const lane = row.kind === "entry" ? row.e.track : row.kind === "next" ? "next" : row.kind === "head" ? "head" : "education";
        return `<li class="wh-c-row" id="${rowId(row)}" data-lane="${lane}" data-r="${i}">${yrs}${commit(row, i)}</li>`;
      })
      .join("");

    // ── The dock: one readout per Case Study, one per role without one, and the rest state ─────────────────────────
    const factRows = (cs: CaseStudy, value: string) =>
      cs.spans.length > 1 ? rolesOf(cs).filter((r) => r.highlights.some((h) => h.includes(value))).map((r) => rowOfRole(r.id)) : [];
    const spanRow = (cs: CaseStudy, k: number) => {
      const s = cs.spans[k];
      return s.role ? rowOfRole(s.role) : M.rows.findIndex((r) => r.kind === "thesis" && r.span === s);
    };
    const yrs = (s: { start: string; end: string }) => {
      const a = s.start.slice(0, 4);
      const b = s.end === "present" ? "now" : s.end.slice(0, 4);
      return a === b ? a : `${a}–${b === "now" ? b : b.slice(2)}`;
    };

    function csReadout(cs: CaseStudy) {
      const i = csIndex(cs);
      const fig = FIGURES[cs.slug];
      const spans = cs.spans
        .map(
          (s, k) => `${k ? `<li class="wh-c-arrow" aria-hidden="true">→</li>` : ""}
          <li class="wh-c-span" data-r="${spanRow(cs, k)}">${esc(s.label.split(/,\s*/)[0])} <span class="text-faint">${yrs(s)}</span>${s.role ? "" : ` <span class="wh-c-norole">· not a role</span>`}</li>`,
        )
        .join("");
      const facts = cs.facts
        .map(
          (f) => `
        <div class="wh-c-fact min-w-0" data-rows="${factRows(cs, f.value).join(" ")}">
          <dt class="sr-only">${esc(f.label)}</dt>
          <dd class="wh-c-fv font-mono leading-none text-text">${esc(f.value)}</dd>
          <dd class="wh-c-fl mt-1 text-xs leading-snug text-muted">${esc(f.label)}</dd>
        </div>`,
        )
        .join("");
      const steps = STEPS.map(
        (key, k) => `
      <li class="wh-c-step" data-step="${key}" style="--k:${k}">
        <span class="wh-c-dot" aria-hidden="true"></span>
        <span class="wh-c-steplabel">${key}</span>
        <p class="wh-c-steptext">${esc(cs[key])}</p>
      </li>`,
      ).join("");
      return `
<article class="wh-c-item" data-dock="${cs.slug}" data-kind="cs" aria-labelledby="wh-c-h-${cs.slug}" style="--hue:${hueOf(cs)}">
  <div class="wh-c-inner wh-c-frame">
    <header class="wh-c-head">
      <span><span style="color:var(--hue)">${q(i)}</span><span class="wh-c-dk"> · ${esc(cs.slug)}</span><span class="wh-c-ph text-text"> ${esc(cs.short)}</span></span>
      ${cs.draft ? `<span class="wh-c-draftmark" title="${esc(cs.draft.reason)}">draft<span class="sr-only">: ${esc(cs.draft.reason)}</span></span>` : ""}
      <a href="${esc(cs.href)}" class="wh-c-link wh-c-read font-medium text-text underline decoration-1 underline-offset-4"><span class="wh-c-dk">Read the </span>Case Study<span class="sr-only">: ${esc(cs.title)}</span> <span aria-hidden="true">→</span></a>
    </header>
    <div class="wh-c-titles">
      <h3 id="wh-c-h-${cs.slug}" class="font-serif leading-tight text-text">${esc(cs.title)}</h3>
    </div>
    <ol class="wh-c-spans" aria-label="The story's stretches">${spans}</ol>
    <ol class="wh-c-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
    <div class="wh-c-ev">
      ${
        fig
          ? `<figure class="wh-c-fig"><div class="wh-c-plate">${fig.draw(cs)}</div><figcaption><span style="color:var(--hue)">fig. ${i + 1}</span> ${esc(fig.caption(cs))}</figcaption></figure>`
          : ""
      }
      <div class="wh-c-side">
        <dl class="wh-c-facts">${facts}</dl>
        ${
          cs.links.length
            ? `<p class="wh-c-out">${cs.links.map((l) => `<a href="${esc(l.href)}" class="wh-c-link font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${l.label.replace(/^(.*?)( on GitHub)?$/, (_, a: string, b?: string) => `${esc(a)}${b ? `<span class="sr-only">${b}</span>` : ""}`)} <span aria-hidden="true">↗</span></a>`).join("")}</p>`
            : ""
        }
      </div>
    </div>
  </div>
</article>`;
    }

    const restReadout = `
<div class="wh-c-item" data-dock="rest" data-kind="rest">
  <div class="wh-c-inner wh-c-frame">
    <header class="wh-c-head"><span>${work.length} Case Studies<span class="wh-c-dk"> · problem → did → outcome</span></span></header>
    <ol class="wh-c-index" aria-label="Case Studies">
      ${work
        .map((cs, i) => {
          const first = M.rows.find((r) => r.dock === cs.slug)!;
          const running = cs.period.end === "present";
          return `<li><a href="#${rowId(first)}" class="wh-c-ix" style="--hue:${hueOf(cs)}">
            <span class="wh-c-q ${running ? "wh-c-running" : ""} ${cs.draft ? "wh-c-dashed" : ""}" aria-hidden="true">${q(i)}</span>
            <span class="wh-c-ixt"><span class="wh-c-ixtitle">${esc(cs.short)}</span><span class="wh-c-ixsum">${esc(cs.summary)}</span></span>
          </a></li>`;
        })
        .join("")}
    </ol>
    <p class="wh-c-hint">Scroll the graph: the row crossing the middle of the screen docks its story here.</p>
  </div>
</div>`;

    const eduReadout = (() => {
      const forks = tracks
        .map((t) => {
          const first = ctx.entries.filter((e) => e.track === t.id).sort((a, b) => mi(a.start) - mi(b.start))[0];
          return first
            ? `<li><span style="color:${COLOR[t.id]}">${esc(t.label)}</span> branched off in ${time(first.start)}, with ${esc(first.context ?? first.organization)}</li>`
            : "";
        })
        .join("");
      const inside = M.rows
        .filter((r): r is Extract<Row, { kind: "thesis" }> => r.kind === "thesis")
        .map(
          (r) =>
            `<li><a href="#${rowId(r)}" class="rounded-sm text-text underline decoration-1 underline-offset-4 ${FOCUS}">${esc(r.span.label)}</a>, ${time(r.span.start)} → ${time(r.span.end)}: part of ${esc(r.cs.title)}</li>`,
        )
        .join("");
      return `
<div class="wh-c-item" data-dock="edu" data-kind="role" style="--hue:${COLOR.education}">
  <div class="wh-c-inner wh-c-frame">
    <header class="wh-c-head"><span><span style="color:var(--hue)">education</span> · the trunk · no Case Study</span></header>
    <div class="wh-c-role">
      <p class="text-sm text-muted">Both Tracks fork off my degree, and stay beside it, not in it:</p>
      <ul class="mt-2 space-y-1 text-sm text-text">${forks}</ul>
      ${inside ? `<p class="mt-4 text-sm text-muted">Inside it, and not a role:</p><ul class="mt-2 space-y-1 text-sm text-text">${inside}</ul>` : ""}
    </div>
  </div>
</div>`;
    })();

    const roleReadout = (e: Role) => {
      const shown = e.highlights;
      const lead = Math.max(0, shown.findIndex(counted));
      const rest = shown.filter((_, k) => k !== lead);
      return `
<div class="wh-c-item" data-dock="role:${e.id}" data-kind="role" style="--hue:${COLOR[e.track]};--c:${COLOR[e.track]}">
  <div class="wh-c-inner wh-c-frame">
    <header class="wh-c-head"><span><span style="color:var(--hue)">role</span> · ${esc((e.context ?? e.organization).toLowerCase())} · no Case Study</span></header>
    <div class="wh-c-role">
      <p class="font-serif text-xl leading-tight text-text">${esc(e.context ?? e.organization)}</p>
      <p class="mt-3 text-[14.5px] leading-relaxed text-text">${esc(e.summary)}</p>
      ${rest.length ? `<ul class="mt-4 ${HL}">${rest.map(hl).join("")}</ul>` : ""}
    </div>
  </div>
</div>`;
    };

    const otwBar = openToWork
      ? `<div class="wh-c-otw">
    <span class="font-mono text-xs text-green"><span aria-hidden="true">●</span> ${esc(ctx.openToWorkCopy.signal)}</span>
    <a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-green/50 px-3 py-1.5 font-mono text-xs text-green hover:bg-green/10 ${FOCUS}">↓ ${esc(cv.label)}</a>
  </div>`
      : "";

    const dock = `
<aside class="wh-c-dock" aria-label="Readout of the row in view">
  ${otwBar}
  <div class="wh-c-stack">
    ${restReadout}
    ${work.map(csReadout).join("")}
    ${eduReadout}
    ${ctx.entries.filter((e) => !caseStudyOf(e)).map(roleReadout).join("")}
  </div>
</aside>`;

    // ── Header (D's, with H's line under it) ──────────────────────────────────────────────────────────────────────
    const swatch = (l: Lane, text: string) =>
      `<li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5 rounded-full" style="background:${COLOR[l]}"></i><span class="text-text">${esc(text)}</span></li>`;
    const cmd = "git log --graph --all";
    const section = document.createElement("section");
    section.id = "wh-c";
    section.setAttribute("aria-labelledby", "wh-c-title");
    section.className = `wh-c ${reducedMotion ? "" : "wh-c-anim"} ${openToWork ? "wh-c-otwon" : ""} mx-auto w-full max-w-6xl px-4 pt-16 sm:px-8`;
    section.innerHTML = `
<style>${css(M.rows.length, docks.map((k) => ({ key: k, rows: rowsOf(k) })), work.map((cs) => ({ slug: cs.slug, spans: cs.spans.map((_, k) => spanRow(cs, k)) })))}</style>
<header>
  <p class="font-mono text-xs text-faint" aria-hidden="true"><span class="text-lavender">$</span> <span class="wh-c-cmd" style="width:${cmd.length}ch;animation-timing-function:steps(${cmd.length})">${cmd}</span> <span class="wh-c-caret"></span></p>
  <div class="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
    <h2 id="wh-c-title" class="font-serif text-4xl leading-none text-text sm:text-5xl">Work</h2>
    ${
      openToWork
        ? "" // the dock carries the CV link, and it follows the reader down the graph
        : `<a href="${esc(cv.href)}" class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text hover:border-lavender hover:text-lavender ${FOCUS}">↓ ${esc(cv.label)}</a>`
    }
  </div>
  <p class="mt-3 max-w-prose text-muted lg:max-w-none">Every role, on two Tracks branching off my degree, newest first. Where there's a Case Study, its story follows you <span class="lg:hidden">at the bottom of the screen</span><span class="max-lg:hidden">on the right</span>.</p>
  <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs" aria-label="Key">
    ${tracks.map((t) => swatch(t.id, t.label)).join("")}
    ${swatch("education", "Education, the trunk")}
    <li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5" style="background:repeating-linear-gradient(to right,var(--faint) 0 2px,transparent 2px 6px)"></i><span class="text-faint">between roles</span></li>
  </ul>
</header>
<div class="wh-c-grid mt-8">
  <ol class="wh-c-list" aria-label="Roles and education, newest first">${rowsHtml}</ol>
  ${dock}
</div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
