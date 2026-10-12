// PROTOTYPE: throwaway. Variant B, "Split, graph as rail": H's split readout, with D's `git log --graph` as the rail.
// Every commit on the graph (each Role, the degree, and the mercury-lib thesis, which is a commit on the Education trunk
// rather than a branch, since it happened inside the degree) is a radio. Selecting one fills the readout beside it:
// the full Case Study where the commit belongs to one, a compact role readout where it doesn't (Portafolio, Education).
// Teaching's two rows open the one Teaching story, and GOLD's two commits (the research role, the thesis) open the one
// GOLD → mercury story; the readout's span strip lights the stretch you came in on, and the rail lights the story's
// other rows.
// - H's reserved slot: every readout is rendered once and every readout's parts sit in the same grid cells
//   (`visibility: hidden` for the unselected), so the slot is as tall as the tallest readout and switching never reflows.
// - Desktop (≥ 1024): rail | readout. The readout is the trace, then the figure with the facts beside it.
// - Phones and tablets: the rail (the whole record, scannable), then the readout slot. The radios live at the top of
//   the readout slot, so tapping a row focuses its radio and the browser scrolls the readout into view, without JS.
// - No JS after mount: radios + :has() for selection, scroll-driven animations for the graph's staging.
import { caseStudyBySlug, caseStudyOf, educationFacts, insideDegree, rolesOf, type CaseStudy, type Fact, type Role, type Span } from "../content";
import type { Variant } from "../types";
import { DEGREE_CAPTION, FIGURES, degree } from "./b/diagrams";
import { GRAPH_W, mi, model, type Lane, type Row, type State } from "./b/graph";
import { STYLE } from "./b/style";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const human = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
/** "Aug – Dec 2022", "Aug 2023 – May 2024", "Aug 2025 – now", each date in a <time>. */
const range = (start: string, end: string, now: string) => {
  const t = (ym: string, text: string) => `<time datetime="${ym}">${text}</time>`;
  if (end === "present") return `${t(start, human(start))} – ${t(now, "now")}`;
  return start.slice(0, 4) === end.slice(0, 4)
    ? `${t(start, human(start).slice(0, 3))} – ${t(end, human(end))}`
    : `${t(start, human(start))} – ${t(end, human(end))}`;
};
const dur = (n: number) => {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};

const COLOR: Record<Lane, string> = { engineering: "var(--mauve)", teaching: "var(--peach)", education: "var(--sky)" };
const STEPS = ["problem", "did", "outcome"] as const;

/** A selectable commit: its radio key, the readout it opens, its colour, and the story it belongs to (a Case Study's
 * slug, or "edu" for the degree), whose rail rows light together. */
interface Pick {
  k: string;
  ro: string;
  hue: string;
  story?: string;
}
/** The readouts that get the full Case Study frame and motion: every Case Study, and the degree. */
const isFull = (ro: string) => ro.startsWith("cs-") || ro === "edu";

const variant: Variant = {
  name: "Split, graph as rail",
  mount(root, ctx) {
    const M = model(ctx);
    const { tracks, education: edu, cv, openToWork, reducedMotion } = ctx;
    const X: Record<Lane, number> = { [tracks[1].id]: 10, education: 32, [tracks[0].id]: 54 } as Record<Lane, number>;
    const LANES: Lane[] = ["engineering", "education", "teaching"];
    const trackLabel = (l: Lane) => (l === "education" ? "Education" : (tracks.find((t) => t.id === l)?.label ?? l));
    const time = (ym: string, text = human(ym)) => `<time datetime="${ym}">${text}</time>`;
    const until = (end: string) => (end === "present" ? time(ctx.now, "now") : time(end));
    const months = (start: string, end: string) => M.endX({ end }) - mi(start);
    /** The rail drops durations visually (they're derivable from the dates); screen readers keep them. */
    const srDur = (start: string, end: string) => `<span class="sr-only">, ${dur(months(start, end))}</span>`;
    const spanKey = (cs: CaseStudy, s: Span) => s.role ?? `${cs.slug}-s${cs.spans.indexOf(s)}`;
    const csHue = (cs: CaseStudy) => COLOR[rolesOf(cs)[0]?.track ?? "engineering"];

    // ── The graph pieces (D's, at a fraction of the graph column) ─────────────────────────────────────────────
    const at = (x: number) => `${((x / GRAPH_W) * 100).toFixed(3)}%`;
    const seg = (l: Lane, s: State | "next", top: string, bottom: string) =>
      s === "none" ? "" : `<i class="b-seg" data-lane="${l}" data-s="${s}" style="left:${at(X[l])};top:${top};bottom:${bottom};--c:${COLOR[l]}"></i>`;
    const node = (l: Lane | "next", n: string) =>
      `<span class="b-node" data-n="${n}" style="left:${at(l === "next" ? X.education : X[l])};top:var(--ny);--c:${l === "next" ? "var(--green)" : COLOR[l]}"></span>`;

    function rowLanes(row: Row, i: number) {
      const tNext = M.tBelow(i);
      let html = "";
      for (const l of LANES) {
        let above: State | "next" = M.state(l, row.t + 0.5);
        if (row.kind === "head" && openToWork && M.state(l, M.now + 0.5) === "active") above = "next";
        html += seg(l, above, "0", `calc(100% - var(--ny))`);
        for (const p of M.stretches(l, row.t, tNext))
          html += seg(l, p.s, `calc(var(--ny) + (100% - var(--ny)) * ${p.f0.toFixed(4)})`, `calc((100% - var(--ny)) * ${(1 - p.f1).toFixed(4)})`);
      }
      if (row.kind === "entry" && row.fork) {
        const x = X[row.e.track], tx = X.education;
        html += `<svg class="b-curve" data-lane="${row.e.track}" style="top:var(--ny);height:34px;stroke:${COLOR[row.e.track]}" viewBox="0 0 ${GRAPH_W} 34" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M${x} 0C${x} 20 ${tx} 14 ${tx} 34"/></svg>`;
      }
      if (row.kind === "next") {
        const curves = (["engineering", "teaching"] as Lane[])
          .filter((l) => M.state(l, M.now + 0.5) === "active")
          .map((l) => `<path vector-effect="non-scaling-stroke" d="M${X.education} 0C${X.education} 55 ${X[l]} 45 ${X[l]} 100"/>`)
          .join("");
        html = `<svg class="b-curve" style="top:var(--ny);height:calc(100% - var(--ny));stroke:var(--green);stroke-dasharray:4 4" viewBox="0 0 ${GRAPH_W} 100" preserveAspectRatio="none">${curves}</svg>`;
      }
      return html;
    }
    const graphCell = (lanes: string, nodes: string) =>
      `<div class="b-g" aria-hidden="true"><div class="b-lanes">${lanes}</div>${nodes}</div>`;

    // ── The rail: one row per commit. Selectable rows are <label>s for radios that live in the readout slot. ───────
    const picks: Pick[] = [];
    const draftTag = `<span class="b-drafttag">draft</span>`;
    /** The "↳" tag on line 3: which full readout the row opens (a Case Study's short name, or "Education"). */
    const tagOf = (p: Pick) => {
      if (p.story === "edu") return `<span class="sr-only">Opens: </span>Education`;
      const cs = p.story ? caseStudyBySlug(p.story) : undefined;
      return cs ? `<span class="sr-only">Case Study: </span>${esc(cs.short)}` : "";
    };
    function label(p: Pick, lane: string, title: string, where: string, when: string, extra = "") {
      picks.push(p);
      const tag = tagOf(p);
      return `<label for="b-r-${p.k}" class="b-lab">
        <span class="b-l1"><span id="b-t-${p.k}" class="b-title">${title}</span>${extra}</span>
        <span id="b-w-${p.k}" class="b-l2" style="--c:${lane}">${where}</span>
        <span class="b-l3"><span class="b-when">${when}</span>${tag ? `<span class="b-tag"><span aria-hidden="true">↳ </span>${tag}</span>` : ""}</span>
      </label>`;
    }
    /** "context · organization", breaking only before the organization when it doesn't fit on one line. */
    const where = (ctxText: string, org?: string) =>
      `<span class="b-ctx">${esc(ctxText)}</span>${org ? ` <span class="b-org">· ${esc(org)}</span>` : ""}`;
    const whereOf = (r: Role) => where(r.context ?? r.organization, r.context ? r.organization : undefined);

    function rowHtml(row: Row, i: number): string {
      const lanes = rowLanes(row, i);
      if (row.kind === "head") {
        const tips = M.present.map((e) => node(e.track, "tip")).join("");
        return `<li class="b-row b-thin" data-lane="head">${graphCell(lanes, tips)}
          <p class="b-headline"><span class="b-headref">HEAD</span> ${time(ctx.now)}</p></li>`;
      }
      if (row.kind === "root") {
        return `<li class="b-row b-thin" data-lane="education" style="--c:${COLOR.education}">${graphCell(lanes, node("education", "root"))}
          <p class="b-headline">${time(edu.start)} · the trunk starts</p></li>`;
      }
      if (row.kind === "next") {
        const p = { k: "next", ro: "otw", hue: "var(--green)" };
        return `<li class="b-row" data-k="next" data-lane="next" style="--c:var(--green)">${graphCell(lanes, node("next", "next"))}
          ${label(p, "var(--green)", esc(ctx.openToWorkCopy.signal), `<span class="b-ctx">${esc(ctx.openToWorkCopy.sentence)}</span>`, "uncommitted")}</li>`;
      }
      if (row.kind === "edu") {
        const p = { k: "edu", ro: "edu", hue: COLOR.education, story: "edu" };
        return `<li class="b-row" data-k="edu" data-story="edu" data-lane="education" style="--c:${COLOR.education}">${graphCell(lanes, node("education", "edu"))}
          ${label(p, COLOR.education, esc(edu.field), where(edu.level, edu.institution), `<span class="sr-only">Education, </span>${time(edu.start)} → ${time(edu.end)}${srDur(edu.start, edu.end)}`)}</li>`;
      }
      if (row.kind === "span") {
        const cs = caseStudyBySlug(row.cs)!;
        const p = { k: spanKey(cs, row.s), ro: `cs-${cs.slug}`, hue: csHue(cs), story: cs.slug };
        return `<li class="b-row" data-k="${p.k}" data-story="${cs.slug}" data-lane="education" style="--c:${COLOR.education}">${graphCell(lanes, node("education", "span"))}
          ${label(p, COLOR.education, esc(row.s.label), where("inside the degree", "not a role"), `${time(row.s.start)} → ${until(row.s.end)}${srDur(row.s.start, row.s.end)}`)}</li>`;
      }
      const e = row.e;
      const cs = caseStudyOf(e);
      const p = { k: e.id, ro: cs ? `cs-${cs.slug}` : `role-${e.id}`, hue: COLOR[e.track], story: cs?.slug };
      return `<li class="b-row" data-k="${e.id}" ${cs ? `data-story="${cs.slug}"` : ""} data-lane="${e.track}" style="--c:${COLOR[e.track]}">${graphCell(lanes, node(e.track, "dot"))}
        ${label(p, COLOR[e.track], esc(e.title), whereOf(e), `<span class="sr-only">${esc(trackLabel(e.track))}, </span>${time(e.start)} → ${until(e.end)}${srDur(e.start, e.end)}`, e.draft ? draftTag : "")}</li>`;
    }
    const rail = M.rows.map(rowHtml).join("");

    // ── Readouts: one per Case Study, one per role without one, Education, and (Open to Work) the "next" commit. ───
    const head = (left: string, right = "") => `<header class="b-head"><span>${left}</span>${right}</header>`;
    const bg = `<div class="b-fig" aria-hidden="true"></div>`;

    const factsHtml = (fs: Fact[]) =>
      fs.map((f) => `<div class="min-w-0"><dt class="sr-only">${esc(f.label)}</dt><dd class="b-fv">${esc(f.value)}</dd><dd class="b-fl">${esc(f.label)}</dd></div>`).join("");
    const step = (label: string, j: number, body: string) =>
      `<li class="b-step" style="--k:${j}"><span class="b-dot" aria-hidden="true"></span><span class="b-steplabel">${label}</span>${body}</li>`;

    function csReadout(c: CaseStudy): string {
      const fig = FIGURES[c.slug];
      const chips = c.spans
        .map((s, j) => {
          const k = spanKey(c, s);
          return `${j ? `<li class="b-chipsep" aria-hidden="true">→</li>` : ""}<li class="b-chip${s.role ? "" : " b-chip-loose"}" data-k="${k}">
            <span class="b-chip-l">${esc(s.label)}</span>${s.role ? "" : `<span class="b-chip-n">not a role</span>`}<span class="b-dt"> ${range(s.start, s.end, ctx.now)}</span></li>`;
        })
        .join("");
      const steps = STEPS.map((key, j) => step(key, j, `<p class="b-steptext">${esc(c[key])}</p>`)).join("");
      return `
      <article class="b-ro" data-ro="cs-${c.slug}" aria-labelledby="b-h-${c.slug}" style="--hue:${csHue(c)}">
        <div class="b-body">
          ${head(`case study · <span style="color:var(--hue)">${esc(c.slug)}</span>`, c.draft ? `<span class="b-draftmark">draft · ${esc(c.draft.reason)}</span>` : "")}
          <div class="b-titles">
            <h3 id="b-h-${c.slug}" class="b-h3">${esc(c.title)}</h3>
            <p class="b-sub">${esc(c.org)} · ${esc(c.role)}</p>
            <ol class="b-spans" aria-label="The story's stretches">${chips}</ol>
          </div>
          <ol class="b-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
          <dl class="b-facts">${factsHtml(c.facts)}</dl>
          <div class="b-foot">
            <p class="b-tech"><span class="sr-only">Technologies: </span>${c.technologies.map(esc).join(" · ")}</p>
            <div class="b-links">
              ${c.page ? `<a href="${esc(c.href)}" class="b-link b-read">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>` : ""}
              ${c.links.map((l) => `<a href="${esc(l.href)}" class="b-link b-out" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join("")}
              <a href="#b-rail" class="b-link b-back">↑ all roles</a>
            </div>
          </div>
        </div>
        ${fig ? `<figure class="b-fig"><div class="b-plate">${fig.draw(c)}</div><figcaption>${esc(fig.caption(c))}</figcaption></figure>` : bg}
      </article>`;
    }

    const hl = (h: string) => `<li><span aria-hidden="true" style="color:var(--hue)">+</span><span>${esc(h)}</span></li>`;
    const back = `<div class="b-foot b-foot-thin"><div class="b-links"><a href="#b-rail" class="b-link b-back">↑ all roles</a></div></div>`;

    function roleReadout(r: Role): string {
      return `
      <article class="b-ro" data-ro="role-${r.id}" aria-labelledby="b-h-${r.id}" style="--hue:${COLOR[r.track]}">
        <div class="b-body">
          ${head(`role · <span style="color:var(--hue)">${esc(r.id)}</span>`, r.draft ? `<span class="b-draftmark">draft</span>` : "")}
          <div class="b-titles">
            <h3 id="b-h-${r.id}" class="b-h3">${esc(r.title)}</h3>
            <p class="b-sub"><span style="color:var(--hue)">${esc(r.context ?? r.organization)}</span>${r.context ? ` · ${esc(r.organization)}` : ""} · ${esc(r.location)}</p>
            <p class="b-meta">${esc(trackLabel(r.track))} Track<span class="b-dt"> · ${time(r.start)} → ${until(r.end)} · ${dur(months(r.start, r.end))}</span> · no Case Study</p>
          </div>
          <div class="b-rwrap">
            <p class="b-rmain b-prose">${esc(r.summary)}</p>
            <ul class="b-rside b-hl" aria-label="Highlights">${r.highlights.map(hl).join("")}</ul>
          </div>
          ${back}
        </div>
        ${bg}
      </article>`;
    }

    /** The degree, in the Case Study frame: the story with what it held (each one a label for that commit's radio, so the
     * trunk links to its stories without retelling them), derived facts, and the trunk figure. Not a Case Study. */
    function eduReadout(): string {
      const { roles, spans } = insideDegree(edu);
      const held = [
        ...roles.map((r) => ({ k: r.id, start: r.start, end: r.end, c: COLOR[r.track], t: esc(r.title), w: esc(r.context ?? r.organization) })),
        ...spans.map(({ cs, span }) => ({
          k: spanKey(cs, span), start: span.start, end: span.end, c: COLOR.education,
          t: esc(span.label) + (edu.thesisTitle ? `: <cite>${esc(edu.thesisTitle)}</cite>` : ""), w: "not a role",
        })),
      ].sort((a, b) => mi(a.start) - mi(b.start));
      const list = held
        .map((h) => `<li><label for="b-r-${h.k}" class="b-held" style="--c:${h.c}"><span class="b-held-dot" aria-hidden="true"></span><span class="b-held-t">${h.t}</span> <span class="b-held-w">· ${h.w}</span></label><span class="sr-only">, ${range(h.start, h.end, ctx.now)}</span></li>`)
        .join("");
      const forks = tracks.flatMap((t, i) => {
        const at = roles.filter((r) => r.track === t.id).map((r) => mi(r.start)).sort((a, b) => a - b);
        return at.length ? [{ label: t.label, color: COLOR[t.id], up: i === 0, at }] : [];
      });
      const fig = degree({
        start: mi(edu.start), end: mi(edu.end) + 1, forks, trunk: edu.level,
        loose: spans.map(({ span }) => ({ label: span.label.split(",").pop()!.trim(), at: mi(span.start) })),
      });
      const st = edu.story;
      return `
      <article class="b-ro" data-ro="edu" aria-labelledby="b-h-edu" style="--hue:${COLOR.education}">
        <div class="b-body">
          ${head(`education · <span style="color:var(--hue)">${esc(edu.level.toLowerCase())}</span>`, `<span>beside the Tracks, not in one</span>`)}
          <div class="b-titles">
            <h3 id="b-h-edu" class="b-h3">${esc(edu.degree)}</h3>
            <p class="b-sub">${esc(edu.institution)} · ${esc(edu.location)}${edu.focus ? ` · ${esc(edu.focus)}` : ""}</p>
            <ol class="b-spans" aria-label="The degree's dates"><li class="b-chip" style="--lit:1"><span class="b-chip-l">${esc(edu.level)}</span><span class="b-dt"> ${range(edu.start, edu.end, ctx.now)}</span></li></ol>
          </div>
          <ol class="b-trace" aria-label="The degree, what it held, after it">
            ${step("the degree", 0, `<p class="b-steptext">${esc(st.degree)}</p>`)}
            ${step("inside it", 1, `<ul class="b-helds" style="--rows:${Math.ceil(held.length / 2)}" aria-label="Held during the degree, oldest first">${list}</ul>`)}
            ${step("after it", 2, `<p class="b-steptext">${esc(st.after)}</p>`)}
          </ol>
          <dl class="b-facts">${factsHtml(educationFacts(edu))}</dl>
          ${back}
        </div>
        <figure class="b-fig"><div class="b-plate">${fig}</div><figcaption>${esc(DEGREE_CAPTION)}</figcaption></figure>
      </article>`;
    }

    function otwReadout(): string {
      const o = ctx.openToWorkCopy;
      const now = M.present
        .map((e) => `<li><span style="color:${COLOR[e.track]}">${esc(e.title)}</span> · ${esc(e.context ?? e.organization)}${e.context ? `, ${esc(e.organization)}` : ""} <span class="b-faint">since ${time(e.start)}</span></li>`)
        .join("");
      const since = tracks
        .map((t) => {
          const rs = ctx.entries.filter((e) => e.track === t.id);
          const first = rs.map((e) => e.start).sort()[0];
          return `<li><span style="color:${COLOR[t.id]}">${esc(t.label)}</span> · ${rs.length} role${rs.length === 1 ? "" : "s"} <span class="b-faint">since ${time(first)}</span></li>`;
        })
        .join("");
      const done = mi(edu.end) < M.now;
      return `
      <article class="b-ro" data-ro="otw" aria-labelledby="b-h-otw" style="--hue:var(--green)">
        <div class="b-body">
          ${head(`<span style="color:var(--hue)">${esc(o.signal)}</span> · uncommitted`)}
          <div class="b-titles">
            <h3 id="b-h-otw" class="b-h3">${esc(o.sentence)}</h3>
            <p class="b-sub">Every role and my degree are on the graph. Select one for its story; the CV has all of it.</p>
          </div>
          <div class="b-rwrap">
            <div class="b-rmain">
              <p class="b-steplabel">right now</p>
              <ul class="b-list">${now}</ul>
              <p class="b-steplabel mt-4">education</p>
              <ul class="b-list"><li><span style="color:${COLOR.education}">${esc(edu.degree)}</span> <span class="b-faint">${done ? "finished" : "until"} ${time(edu.end)}</span></li></ul>
            </div>
            <div class="b-rside">
              <p class="b-steplabel">the record</p>
              <ul class="b-list">${since}</ul>
            </div>
          </div>
          ${back}
        </div>
        ${bg}
      </article>`;
    }

    const readouts = [
      ...(openToWork ? [otwReadout()] : []),
      ...ctx.work.map(csReadout),
      ...ctx.entries.filter((r) => !caseStudyOf(r)).map(roleReadout),
      eduReadout(),
    ].join("");

    // The default selection: the newest Case Study commit; with Open to Work, the "next" commit.
    const first = openToWork ? picks.find((p) => p.k === "next")! : picks.find((p) => p.ro.startsWith("cs-"))!;
    const radios = picks
      .map(
        (p) =>
          `<input class="b-radio" type="radio" name="b-commit" id="b-r-${p.k}" value="${p.k}" aria-labelledby="b-t-${p.k} b-w-${p.k}"${p === first ? " checked" : ""} aria-describedby="b-hint" />`,
      )
      .join("");

    const swatch = (l: Lane, text: string) =>
      `<li><i class="b-sw" style="background:${COLOR[l]}"></i>${esc(text)}</li>`;
    const section = document.createElement("section");
    section.id = "b";
    section.setAttribute("aria-labelledby", "b-title");
    section.className = `${reducedMotion ? "" : "b-anim"} ${openToWork ? "b-otw" : ""} mx-auto w-full max-w-6xl px-4 py-14 sm:px-8 sm:py-16`;
    section.innerHTML = `
      <style>${STYLE}${css(picks)}</style>
      <div class="b-top">
        <p class="b-kicker" aria-hidden="true"><span class="text-lavender">$</span> git log --graph --all</p>
        <div class="b-h2row">
          <h2 id="b-title" class="font-serif text-4xl leading-none text-text sm:text-5xl">Work</h2>
          ${openToWork ? `<p class="b-signal"><span aria-hidden="true">●</span> ${esc(ctx.openToWorkCopy.signal)}</p>` : ""}
          <a href="${esc(cv.href)}" class="b-cv">↓ ${esc(cv.label)}</a>
        </div>
        <p id="b-hint" class="b-intro">Every role and my degree, newest first. Select a commit to read its story.</p>
        <ul class="b-key" aria-hidden="true">
          ${tracks.map((t) => swatch(t.id, t.label)).join("")}
          ${swatch("education", "Education, the trunk")}
          <li><i class="b-sw b-sw-idle"></i>between roles</li>
          <li><span class="text-text">↳</span> opens in depth</li>
        </ul>
      </div>
      <div class="b-grid">
        <div class="b-col">
          <ol id="b-rail" class="b-rail" aria-label="Roles and education, newest first">${rail}</ol>
        </div>
        <div class="b-frame">
          <div class="b-radios" role="radiogroup" aria-label="Commits">${radios}</div>
          <div class="b-bg" aria-hidden="true"></div>
          ${readouts}
        </div>
      </div>`;
    root.append(section);
    return () => section.remove();
  },
};

/** One rule group per selectable commit: show its readout, light its row, its story's other rows and its span chip. */
function css(picks: Pick[]): string {
  const per = picks.map((p) => {
    const sel = `#b:has(#b-r-${p.k}:checked)`;
    const ro = `${sel} .b-ro[data-ro="${p.ro}"]`;
    return {
      show: [
        `${ro}{visibility:visible}`,
        `${ro} :is(.b-fig,.b-body > *,.b-rwrap > *){opacity:1}`,
        `${sel}{--sel:${p.hue}}`,
        `${sel} .b-row[data-k="${p.k}"]{--on:1}`,
        p.story ? `${sel} .b-row[data-story="${p.story}"]{--story:1}` : "",
        `${sel} .b-chip[data-k="${p.k}"]{--lit:1}`,
        `#b:has(#b-r-${p.k}:focus-visible) .b-row[data-k="${p.k}"] .b-lab{outline:2px solid var(--lavender);outline-offset:2px}`,
      ].join("\n"),
      motion: isFull(p.ro)
        ? [
            `${ro} .b-step{animation:b-in .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--k) * 110ms)}`,
            `${ro} .b-trace::before{animation:b-grow .5s cubic-bezier(.2,.7,.2,1) both}`,
            `${ro} .draw{stroke-dasharray:1;animation:b-draw .8s cubic-bezier(.3,.6,.2,1) both}`,
            `${ro} :is(.nd,.dot,.ah,.dash,.spoke){animation:b-fade .45s ease-out both}`,
            `${ro} :is(.svc,.step){animation:b-fade .3s ease-out both;animation-delay:calc(.35s + var(--i) * 45ms)}`,
            `${ro} .accept + .inner{animation:b-fade .35s ease-out 1.9s both}`,
            `${ro} .comet{animation:b-comet 1.3s cubic-bezier(.45,0,.25,1) both;animation-delay:calc(.7s + var(--d, 0ms))}`,
          ].join("\n")
        : `${ro} :is(.b-rwrap > *, .b-titles){animation:b-in .42s cubic-bezier(.2,.7,.2,1) both}`,
    };
  });
  return `
    @supports selector(:has(*)){
      #b .b-ro{visibility:hidden}
      #b .b-ro :is(.b-fig,.b-body > *,.b-rwrap > *){opacity:0;transition:opacity .25s ease}
      ${per.map((p) => p.show).join("\n")}
      @media (prefers-reduced-motion:no-preference){
        ${per.map((p) => p.motion).join("\n")}
        @supports (animation-timeline:view()){
          #b .b-frame{animation:b-gate linear both;animation-timeline:view();animation-range:entry 0px entry 200px}
          @container style(--b-play:paused){
            #b .b-frame *,#b .b-frame *::before{animation-play-state:paused!important}
          }
        }
      }
    }`;
}

export default variant;
