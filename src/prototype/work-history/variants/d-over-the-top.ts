// PROTOTYPE: throwaway. Variant D, "Branch scene": the Timeline drawn to scale as one wide scene, and the Case Studies
// as branches you check out of it.
// - The scene: time runs left to right, to scale. Education is the trunk; Engineering and Teaching fork off it and
//   run solid in a role, dotted between roles. Every Role, the thesis and the degree carry a flag (title, where, when).
//   On phones the same lane drawing is rotated by CSS (newest on top), and the flags sit in two columns beside it.
// - Checking out: every flag, and a `git checkout` row of chips, is a <label> for one radio. A Case Study's radio has a
//   label on each of its roles, so the tutor and instructor flags check out the same Teaching story, and GOLD-python and
//   the thesis check out the same GOLD → mercury story. The scene lights that story's bars and draws the branch that
//   joins them; the readout below shows H's trace, figure and facts, under a strip drawn on the scene's own time axis.
// - Staging: as the scene scrolls in, time replays: the lanes draw left to right (top to bottom on phones), the flags
//   arrive as the front passes them, and the giant years fill in turn. A scroll-driven animation of one registered
//   property; nothing is pinned or scroll-jacked.
// No client JS: `mount` writes static markup and one <style>; it attaches no listeners. Selection is radios + :has().
import { monthIndex, roleById, type CaseStudy, type Role } from "../content";
import type { Variant } from "../types";
import { FIGURES } from "./d/diagrams";
import { LANE_Y, sceneModel, type Item, type LaneId } from "./d/scene";
import { css } from "./d/style";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const human = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const time = (ym: string, now: string) => (ym === "present" ? `<time datetime="${now}">now</time>` : `<time datetime="${ym}">${human(ym)}</time>`);
const range = (a: string, b: string, now: string) =>
  b !== "present" && a.slice(0, 4) === b.slice(0, 4)
    ? `<time datetime="${a}">${MONTHS[Number(a.slice(5, 7)) - 1]}</time> – ${time(b, now)}`
    : `${time(a, now)} – ${time(b, now)}`;
const dur = (n: number) => {
  const y = Math.floor(n / 12), m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
};
const n3 = (x: number) => x.toFixed(4);

/** A small git-branch glyph: marks a flag whose role has a Case Study. */
const BRANCH = `<svg class="wd-br" viewBox="0 0 12 12" aria-hidden="true"><circle cx="3" cy="2.5" r="1.5"/><circle cx="3" cy="9.5" r="1.5"/><circle cx="9" cy="3.5" r="1.5"/><path d="M3 4v4M9 5c0 2.5-6 1.5-6 3"/></svg>`;

const variant: Variant = {
  name: "Branch scene",
  mount(root, ctx) {
    const S = sceneModel(ctx);
    const { tracks, education: edu, cv, openToWork: otw, openToWorkCopy: copy, now } = ctx;

    // ── Colours: lanes by Track (D's), a Case Study takes its first role's Track colour. ──
    const LANE_C: Record<LaneId, string> = { top: "var(--peach)", mid: "var(--sky)", bot: "var(--mauve)" };
    const laneC = (r: Role) => LANE_C[S.laneOf[r.track]];
    const csHue = (cs: CaseStudy) => {
      const r = cs.spans.find((s) => s.role);
      return r ? laneC(roleById(r.role!)!) : LANE_C.mid;
    };
    const trackLabel = (r: Role) => tracks.find((t) => t.id === r.track)!.label;

    // ── States: one radio each. Case Studies first (the Peer's way in), then roles with no Case Study, Education, and
    // the whole record on one line each. ──
    type State = { key: string; chip: string; hue: string; kind: "cs" | "role" | "edu" | "all"; label: string };
    const states: State[] = [
      ...ctx.work.map((c): State => ({ key: c.slug, chip: c.short, hue: csHue(c), kind: "cs", label: `Case Study: ${c.title}` })),
      ...ctx.entries
        .filter((r) => !r.caseStudy)
        .map((r): State => ({ key: r.id, chip: r.context ?? r.organization, hue: laneC(r), kind: "role", label: `${r.title}, ${r.context ?? r.organization}` })),
      { key: "education", chip: "Education", hue: LANE_C.mid, kind: "edu", label: edu.degree },
      { key: "all", chip: "Every role", hue: "var(--lavender)", kind: "all", label: "Every role, one line each" },
    ];
    // Open to Work collapses depth: the record is checked out first, the Case Studies one click away.
    const initial = otw ? "all" : ctx.work[0].slug;
    const rid = (k: string) => `wd-r-${k}`;

    // ── The scene. ──
    const pos = (a: number, b: number, l: LaneId) => `--a:${n3(a)};--b:${n3(b)};--y:${LANE_Y[l]}`;
    const segs = S.pieces
      .map((p) => `<i class="wd-seg" data-s="${p.s}"${p.key ? ` data-k="${p.key}"` : ""} style="${pos(p.a, p.b, p.lane)};--c:${LANE_C[p.lane]}"></i>`)
      .join("");
    const grid = S.years.filter((y) => y.a > 0.001).map((y) => `<i class="wd-grid" style="--a:${n3(y.a)}"></i>`).join("");
    const nodes = [
      ...S.items
        .filter((it) => it.kind === "role")
        .map((it) => `<i class="wd-node" data-k="${it.key}" style="${pos(it.a, it.b, it.lane)};--c:${LANE_C[it.lane]}"></i>`),
      ...S.items
        .filter((it) => it.kind === "thesis")
        .map((it) => `<i class="wd-thesis" data-k="${it.key}" style="${pos(it.a, it.b, it.lane)};--c:${LANE_C.mid}"></i>`),
      `<i class="wd-node" data-n="edu" data-k="education" style="--a:${n3(S.eduEnd)};--y:${LANE_Y.mid};--c:${LANE_C.mid}"></i>`,
      S.offScale ? `<i class="wd-off" style="--c:${LANE_C.mid}"></i>` : "",
      ...S.tips.map((l) => `<i class="wd-node" data-n="tip" style="--a:${n3(S.xNow)};--y:${LANE_Y[l]};--c:${LANE_C[l]}"></i>`),
      otw ? `<i class="wd-node" data-n="next" style="--a:${n3(S.xNext)};--y:${LANE_Y.mid};--c:var(--green)"></i>` : "",
    ].join("");
    const SVG = (cls: string, body: string, style = "") =>
      `<svg class="${cls}" viewBox="0 0 1000 100" preserveAspectRatio="none" style="${style}" aria-hidden="true" focusable="false">${body}</svg>`;
    const path = (d: string, cls = "") => `<path${cls ? ` class="${cls}"` : ""} vector-effect="non-scaling-stroke" d="${d}"/>`;
    const forks = SVG("wd-svg wd-forks", S.forks.map((d, i) => path(d, i === 0 ? "eng" : "tea")).join(""));
    // One svg per arc, so each can sweep in by itself (clip-path) when its story is checked out.
    const arcs = S.arcs
      .map((arc) => {
        const xs = arc.d.match(/M([\d.]+)/)!, xe = arc.d.match(/([\d.]+) [\d.]+$/)!;
        return SVG("wd-svg wd-arc", path(arc.d), `--a:${n3(+xs[1] / 1000)};--b:${n3(+xe[1] / 1000)}`).replace("<svg", `<svg data-k="${arc.key}"`);
      })
      .join("");
    const next = otw ? SVG("wd-svg wd-next", S.next.map((d) => path(d)).join("")) : "";

    const flag = (it: Item) => {
      const style = `--a:${n3(it.a)};--b:${n3(it.b)};--x:${n3(it.x)};--e:${it.end ? 1 : 0};--tier:${it.tier};--py:${it.py}px;--c:${LANE_C[it.lane]}`;
      const attrs = `class="wd-flag" for="${rid(it.key)}" data-k="${it.key}" data-kind="${it.kind}"${it.end ? " data-end" : ""} style="${style}"`;
      if (it.kind === "edu")
        return `<li><label ${attrs}>
          <span class="wd-fd"><span class="sr-only">Education: </span>${range(edu.start, edu.end, now)}</span>
          <span class="wd-ft">${esc(edu.degree)}</span>
          <span class="wd-fo">${esc(edu.institution)}</span>
        </label></li>`;
      if (it.kind === "thesis") {
        const s = it.cs!.spans.find((x) => !x.role)!;
        return `<li><label ${attrs}>
          <span class="wd-fd"><span class="sr-only">Inside the degree: </span>${range(s.start, s.end, now)} ${BRANCH}</span>
          <span class="wd-ft">${esc(s.label)}</span>
          <span class="wd-fo">inside my degree</span>
        </label></li>`;
      }
      const r = it.role!;
      return `<li><label ${attrs}>
        <span class="wd-fd"><span class="sr-only">${esc(trackLabel(r))}: </span>${range(r.start, r.end, now)}${r.draft ? ` <span class="wd-draft" title="Copy pending clearance">draft</span>` : ""}${it.cs ? ` ${BRANCH}<span class="sr-only">, Case Study: ${esc(it.cs.title)}</span>` : ""}</span>
        <span class="wd-ft">${esc(r.title)}</span>
        ${r.context ? `<span class="wd-fc">${esc(r.context)}</span>` : ""}
        <span class="${r.context ? "wd-fo" : "wd-fc"}">${esc(r.organization)}</span>
      </label></li>`;
    };
    const topItems = S.items.filter((i) => i.side === "top").sort((p, q) => q.b - p.b || q.a - p.a);
    const botItems = S.items.filter((i) => i.side === "bot");
    const years = S.years
      .map(
        (y) =>
          `<span class="wd-yr" style="--a:${n3(y.a)};--b:${n3(y.b)}"${y.b > 1 ? " data-now" : ""}><span class="wd-yr-o">${y.year}</span><span class="wd-yr-f">${y.year}</span></span>`,
      )
      .join("");
    const scene = `
      <div class="wd-scene" style="--tt:${S.tiers("top")};--tb:${S.tiers("bot")};--len:${S.len}px;--sceneV:${S.sceneV}px">
        <div class="wd-axis" aria-hidden="true">
          ${years}
          <span class="wd-now" style="--a:${n3(S.xNow)}">now</span>
          ${otw ? `<span class="wd-nextlabel" style="--a:${n3(S.xNext)}">next</span>` : ""}
        </div>
        <ul class="wd-flags wd-flags-top" aria-label="${esc(tracks[1].label)} and Education, newest first">${topItems.map(flag).join("")}</ul>
        <div class="wd-lanebox" aria-hidden="true">
          <div class="wd-lanes">${grid}${segs}${forks}${arcs}${next}${nodes}</div>
        </div>
        <ul class="wd-flags wd-flags-bot" aria-label="${esc(tracks[0].label)}, newest first">${botItems.map(flag).join("")}</ul>
      </div>`;

    // ── The readouts: one per state, all in one grid cell, so the panel is as tall as the tallest and never reflows. ──
    /** The story strip: the readout's spans on the scene's own axis, so the panel lines up under the scene. */
    const strip = (spans: { a: number; b: number; lane?: LaneId }[]) => {
      const segsS = spans.map((s, i) => `<i class="wd-sseg" style="--a:${n3(s.a)};--b:${n3(s.b)};--i:${i}"></i>`).join("");
      const gaps = spans
        .slice(1)
        .map((s, i) => `<i class="wd-sgap" style="--a:${n3(spans[i].b)};--b:${n3(s.a)};--i:${i}"></i>`)
        .join("");
      return `<div class="wd-strip" aria-hidden="true"><i class="wd-sbase"></i><i class="wd-snow" style="--a:${n3(S.xNow)}"></i>${gaps}${segsS}</div>`;
    };
    const head = (left: string, right: string, extra = "") =>
      `<header class="wd-ro-head"><span>${left}</span>${extra}<span class="wd-period">${right}</span></header>`;

    const STEPS = ["problem", "did", "outcome"] as const;
    function csReadout(c: CaseStudy, st: State) {
      const fig = FIGURES[c.slug];
      const spans = c.spans.map((s) => ({ a: S.f(monthIndex(s.start)), b: S.f(S.endX(s.end)) }));
      const spanList = c.spans
        .map((s, i) => {
          const prev = c.spans[i - 1];
          const gap = prev ? monthIndex(s.start) - S.endX(prev.end) : 0;
          return `${gap > 0 ? `<li class="wd-gap">${dur(gap)} later</li>` : ""}
            <li><i class="wd-sw" aria-hidden="true"></i><span class="text-text">${esc(s.label)}</span> ${range(s.start, s.end, now)}${
              s.role ? "" : `<span class="wd-notrole"> · inside my degree</span>`
            }</li>`;
        })
        .join("");
      const facts = c.facts
        .map(
          (f) => `<div class="min-w-0"><dt class="sr-only">${esc(f.label)}</dt><dd class="font-mono text-lg leading-none text-text">${esc(f.value)}</dd><dd class="mt-1 text-xs leading-snug text-muted">${esc(f.label)}</dd></div>`,
        )
        .join("");
      const steps = STEPS.map(
        (key, k) => `<li class="wd-step" style="--k:${k}"><span class="wd-dot" aria-hidden="true"></span><span class="wd-steplabel">${key}</span><p class="wd-steptext">${esc(c[key])}</p></li>`,
      ).join("");
      return `
        <article class="wd-ro" data-key="${c.slug}" aria-labelledby="wd-h-${c.slug}" style="--hue:${st.hue}">
          ${head(
            `<span style="color:var(--hue)">${BRANCH}</span> ${esc(c.slug)} <span class="wd-faint">· Case Study</span>`,
            esc(c.period.label),
            c.draft ? `<span class="wd-draftmark">draft · ${esc(c.draft.reason)}</span>` : "",
          )}
          ${strip(spans)}
          ${c.spans.length > 1 ? `<ol class="wd-spans" aria-label="Where this story happened">${spanList}</ol>` : ""}
          <div class="wd-main">
            <div class="wd-titles">
              <h3 id="wd-h-${c.slug}" class="font-serif leading-tight text-text">${esc(c.title)}</h3>
              <p class="mt-1 text-sm text-muted">${esc(c.org)} · ${esc(c.role)}</p>
            </div>
            <ol class="wd-trace" aria-label="Problem, what I did, outcome">${steps}</ol>
            <dl class="wd-facts">${facts}</dl>
            <div class="wd-foot">
              <p class="wd-tech">${c.technologies.map(esc).join(" · ")}</p>
              <div class="wd-links">
                <a href="${esc(c.href)}" class="wd-link font-medium text-text underline decoration-1 underline-offset-4">Read the Case Study<span class="sr-only">: ${esc(c.title)}</span> <span aria-hidden="true">→</span></a>
                ${c.links.map((l) => `<a href="${esc(l.href)}" class="wd-link font-mono text-xs text-muted underline decoration-1 underline-offset-4" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join("")}
              </div>
            </div>
            ${
              fig
                ? `<figure class="wd-fig"><div class="wd-plate">${fig.draw(c)}</div><figcaption><span class="wd-fign">fig.</span> ${esc(fig.caption(c))}</figcaption></figure>`
                : `<div class="wd-fig"></div>`
            }
          </div>
        </article>`;
    }

    const hl = (h: string) => `<li><span aria-hidden="true" style="color:var(--hue)">+</span><span>${esc(h)}</span></li>`;
    const metaRow = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
    function roleReadout(r: Role, st: State) {
      const months = S.endX(r.end) - monthIndex(r.start);
      return `
        <article class="wd-ro" data-key="${r.id}" aria-labelledby="wd-h-${r.id}" style="--hue:${st.hue}">
          ${head(`<span style="color:var(--hue)">●</span> ${esc(r.id)} <span class="wd-faint">· role, no Case Study</span>`, range(r.start, r.end, now))}
          ${strip([{ a: S.f(monthIndex(r.start)), b: S.f(S.endX(r.end)) }])}
          <div class="wd-main wd-main-role">
            <div class="wd-titles">
              <h3 id="wd-h-${r.id}" class="font-serif leading-tight text-text">${esc(r.title)}</h3>
              <p class="mt-1 text-sm text-muted"><span style="color:var(--hue)">${esc(r.context ?? r.organization)}</span>${r.context ? ` · ${esc(r.organization)}` : ""}</p>
            </div>
            <div class="wd-trace wd-rolebody">
              <p class="wd-steptext">${esc(r.summary)}</p>
              <ul class="wd-hl">${r.highlights.map(hl).join("")}</ul>
            </div>
            <dl class="wd-meta">
              ${metaRow("track", esc(trackLabel(r)))}${metaRow("when", `${range(r.start, r.end, now)} · ${dur(months)}`)}${metaRow("where", esc(r.location))}
            </dl>
          </div>
        </article>`;
    }

    function eduReadout(st: State) {
      const inside = ctx.work.flatMap((c) => c.spans.filter((s) => !s.role).map((s) => ({ c, s })));
      const months = monthIndex(edu.end) + 1 - monthIndex(edu.start);
      return `
        <article class="wd-ro" data-key="education" aria-labelledby="wd-h-education" style="--hue:${st.hue}">
          ${head(`<span style="color:var(--hue)">◆</span> education <span class="wd-faint">· the trunk</span>`, range(edu.start, edu.end, now))}
          ${strip([{ a: S.f(Math.max(monthIndex(edu.start), S.t0)), b: S.eduEnd }])}
          <div class="wd-main wd-main-role">
            <div class="wd-titles">
              <h3 id="wd-h-education" class="font-serif leading-tight text-text">${esc(edu.degree)}</h3>
              <p class="mt-1 text-sm text-muted"><span style="color:var(--hue)">${esc(edu.institution)}</span> · ${esc(edu.location)}</p>
            </div>
            <div class="wd-trace wd-rolebody">
              <p class="wd-steptext">Both Tracks fork off it: ${tracks.map((t) => esc(t.label)).join(" and ")} started while I studied.${S.offScale ? ` The scene above starts in ${human(`${Math.floor(S.t0 / 12)}-${String((S.t0 % 12) + 1).padStart(2, "0")}`)}; the degree runs further back, to ${human(edu.start)}.` : ""}</p>
              ${inside
                .map(
                  ({ c, s }) =>
                    `<p class="wd-steptext mt-3">Inside it: ${esc(s.label)}, ${range(s.start, s.end, now)}. It's where <label for="${rid(c.slug)}" class="wd-inlink" style="--c:${csHue(c)}">${esc(c.short)}</label> ends.</p>`,
                )
                .join("")}
            </div>
            <dl class="wd-meta">${metaRow("when", `${range(edu.start, edu.end, now)} · ${dur(months)}`)}${metaRow("where", esc(edu.location))}</dl>
          </div>
        </article>`;
    }

    function allReadout(st: State) {
      const lead = (r: Role) => r.highlights.find((h) => /\d/.test(h)) ?? r.highlights[0];
      const row = (r: Role) => `
        <li class="wd-lrow" style="--c:${laneC(r)}">
          <span class="wd-ld">${range(r.start, r.end, now)}</span>
          <span class="wd-lt"><span class="text-text">${esc(r.title)}</span>${r.draft ? ` <span class="wd-draft">draft</span>` : ""} <span class="wd-lc">${esc(r.context ?? r.organization)}</span>${r.context ? `<span class="text-faint"> · ${esc(r.organization)}</span>` : ""}</span>
          <span class="wd-lh"><span aria-hidden="true" style="color:var(--c)">+</span> ${esc(lead(r))}</span>
        </li>`;
      const groups = tracks
        .map((t) => `<li><h4 class="wd-lg" style="--c:${LANE_C[S.laneOf[t.id]]}">${esc(t.label)}</h4><ol>${ctx.entries.filter((r) => r.track === t.id).map(row).join("")}</ol></li>`)
        .join("");
      return `
        <article class="wd-ro" data-key="all" aria-labelledby="wd-h-all" style="--hue:${st.hue}">
          ${head(`<span style="color:var(--hue)">$</span> git log --oneline <span class="wd-faint">· every role</span>`, `${human(edu.start)} – now`)}
          <div class="wd-main wd-main-all">
            <h3 id="wd-h-all" class="sr-only">Every role, one line each</h3>
            <ol class="wd-ledger">${groups}
              <li><h4 class="wd-lg" style="--c:${LANE_C.mid}">Education</h4><ol><li class="wd-lrow" style="--c:${LANE_C.mid}">
                <span class="wd-ld">${range(edu.start, edu.end, now)}</span>
                <span class="wd-lt"><span class="text-text">${esc(edu.degree)}</span> <span class="wd-lc">${esc(edu.institution)}</span></span>
                <span class="wd-lh"></span>
              </li></ol></li>
            </ol>
          </div>
        </article>`;
    }

    const readouts = states
      .map((st) => {
        if (st.kind === "cs") return csReadout(ctx.work.find((c) => c.slug === st.key)!, st);
        if (st.kind === "role") return roleReadout(ctx.entries.find((r) => r.id === st.key)!, st);
        if (st.kind === "edu") return eduReadout(st);
        return allReadout(st);
      })
      .join("");

    const radios = states
      .map((st) => `<input class="wd-radio" type="radio" name="wd-story" id="${rid(st.key)}" value="${st.key}" aria-label="${esc(st.label)}"${st.key === initial ? " checked" : ""} />`)
      .join("");
    const chips = states
      .map(
        (st, i) =>
          `${i === ctx.work.length ? `<span class="wd-sep" aria-hidden="true"></span>` : ""}<label class="wd-chip" for="${rid(st.key)}" data-kind="${st.kind}" style="--c:${st.hue}" aria-hidden="true">${
            st.kind === "cs" ? BRANCH : ""
          }${esc(st.chip)}</label>`,
      )
      .join("");

    // ── Header: D's kicker and key, H's restraint. One CV link, green with Open to Work. ──
    const cvLink = `<a href="${esc(cv.href)}" class="wd-cv${otw ? " wd-cv-otw" : ""}">↓ ${esc(cv.label)}</a>`;
    const cmd = "git log --graph --all";
    const swatch = (c: string, label: string, blurb: string) =>
      `<li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5 rounded-full" style="background:${c}"></i><span class="text-text">${esc(label)}</span><span class="text-faint max-md:hidden">${esc(blurb)}</span></li>`;

    const section = document.createElement("section");
    section.id = "wd";
    section.setAttribute("aria-labelledby", "wd-title");
    section.className = `${ctx.reducedMotion ? "" : "wd-anim"} mx-auto w-full max-w-6xl px-4 py-16 sm:px-8`;
    section.innerHTML = `
      <style>${css(states.map((s) => ({ key: s.key, hue: s.hue })))}</style>
      <header>
        <p class="font-mono text-xs text-faint" aria-hidden="true"><span class="text-lavender">$</span> <span class="wd-cmd" style="width:${cmd.length}ch;animation-timing-function:steps(${cmd.length})">${cmd}</span> <span class="wd-caret"></span></p>
        <div class="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 id="wd-title" class="font-serif text-4xl leading-none text-text sm:text-5xl">Work</h2>
          ${cvLink}
        </div>
        ${
          otw
            ? `<p class="wd-otw"><span class="wd-otw-sig"><i aria-hidden="true"></i>${esc(copy.signal)}</span> <span class="text-text">${esc(copy.sentence)}</span> <span class="text-muted">${esc(copy.aside)}</span></p>`
            : ""
        }
        <p class="mt-3 max-w-prose text-muted md:max-w-none">Every role to scale, on ${esc(tracks.map((t) => t.label).join(" and "))} branching off my degree. Select any of them to check out its story.</p>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs" aria-label="Key">
          ${swatch(LANE_C.bot, tracks[0].label, tracks[0].blurb)}${swatch(LANE_C.top, tracks[1].label, tracks[1].blurb)}${swatch(LANE_C.mid, "Education", "the trunk")}
          <li class="flex items-center gap-2"><i class="inline-block h-0.5 w-5" style="background:repeating-linear-gradient(to right,var(--faint) 0 2px,transparent 2px 7px)"></i><span class="text-faint">between roles</span></li>
          <li class="flex items-center gap-2 text-faint">${BRANCH.replace('class="wd-br"', 'class="wd-br wd-br-key"')}<span>has a Case Study</span></li>
        </ul>
      </header>
      ${scene}
      <fieldset class="wd-checkout">
        <legend class="sr-only">Check out a story</legend>
        <span class="wd-prompt" aria-hidden="true"><span class="text-lavender">$</span> git checkout</span>
        ${radios}${chips}
      </fieldset>
      <div class="wd-panel">${readouts}</div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
