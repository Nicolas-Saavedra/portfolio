// PROTOTYPE: throwaway. Variant B's markup as one pure function of the context: no DOM, no listeners, so the same
// string could be rendered at build time (Astro) and shipped as static HTML + CSS. Interactivity is radios + :has().
import type { TimelineEntry } from "../../data";
import type { VariantContext } from "../../types";
import { css } from "./style";

/** Future months drawn past "now": room for the now label and the Open to Work stub. */
const PAD = 5;
/** The narrowest chart the horizontal layout ever gets (container 880px − 8.5rem gutter − 1rem gap), for label rows. */
const MIN_CHART_PX = 728;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const HUE: Record<string, string> = { engineering: "var(--lavender)", teaching: "var(--peach)", education: "var(--sky)" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const mi = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};
const fmt = (ym: string) => `${MONTHS[mi(ym) % 12]} ${Math.floor(mi(ym) / 12)}`;
const word = (n: number) => WORDS[n] ?? String(n);
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

function dur(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  const ys = y ? `${y} yr${y > 1 ? "s" : ""}` : "";
  const ms = m ? `${m} mo` : "";
  return [ys, ms].filter(Boolean).join(" ") || "1 mo";
}

/** "Jan–Jun 2025", "Aug 2023 – May 2024", "Jan 2026 – now". */
function compact(start: string, end: string) {
  if (end === "present") return `${fmt(start)} – now`;
  const [ys, ye] = [start.slice(0, 4), end.slice(0, 4)];
  return ys === ye ? `${MONTHS[mi(start) % 12]}–${MONTHS[mi(end) % 12]} ${ye}` : `${fmt(start)} – ${fmt(end)}`;
}

const name = (e: TimelineEntry) => e.context ?? e.organization;

/** Rough rendered width of a hanging label (13px sans title, 11px mono name, 10.5px mono dates), in px. */
const labelPx = (lines: [string, string, string]) =>
  Math.max(lines[0].length * 6.5, lines[1].length * 6.6, lines[2].length * 6.3) + 10;

interface Placed { pos: "above" | "below"; row: number; flip: boolean }

/** Greedy label rows for one lane, in month units at the narrowest horizontal chart: above 0, below 0, above 1, … */
function placeLabels(items: { a: number; b: number; w: number }[], T: number): { placed: Placed[]; ka: number; kb: number } {
  const rows: [number, number][][] = [];
  const placed = items.map(({ a, b, w }) => {
    const flip = a + w > T;
    const span: [number, number] = flip ? [b - w, b] : [a, a + w];
    let k = 0;
    while ((rows[k] ?? []).some(([s, e]) => span[0] < e + 0.2 && s < span[1] + 0.2)) k++;
    (rows[k] ??= []).push(span);
    return { pos: k % 2 ? "below" : "above", row: Math.floor(k / 2), flip } as Placed;
  });
  const ka = Math.ceil(rows.length / 2), kb = Math.floor(rows.length / 2);
  return { placed, ka, kb };
}

export function render(ctx: VariantContext): string {
  const { entries, education, tracks, cv, now, openToWork, reducedMotion } = ctx;
  const m0Raw = Math.min(mi(education.start), ...entries.map((e) => mi(e.start)));
  const m0 = m0Raw - (m0Raw % 12); // start the axis on a January
  const nowI = mi(now);
  const T = nowI - m0 + 1 + PAD;
  const xNow = (nowI - m0 + 0.5) / T;
  const pxPerMonth = MIN_CHART_PX / T;
  const x = (ym: string) => (mi(ym) - m0) / T;
  const xEnd = (end: string) => (end === "present" ? xNow : (mi(end) + 1 - m0) / T);
  const months = (e: { start: string; end: string }) => (e.end === "present" ? nowI : mi(e.end)) - mi(e.start) + 1;
  const startYear = Math.floor(m0 / 12);

  // ── lanes ──────────────────────────────────────────────────────────────────────────────────────────────
  const lane = (t: (typeof tracks)[number], i: number) => {
    const list = entries.filter((e) => e.track === t.id);
    const c = HUE[t.id] ?? "var(--mauve)";
    const lines = (e: TimelineEntry): [string, string, string] => [e.title, name(e), compact(e.start, e.end)];
    const items = list.map((e) => ({ a: x(e.start) * T, b: xEnd(e.end) * T, w: labelPx(lines(e)) / pxPerMonth }));
    const otwText = "open to roles";
    const withOtw = openToWork && i === 0;
    const { placed, ka, kb } = placeLabels(items, T);

    const segs = list
      .map((e, j) => {
        const p = placed[j];
        const [l1, l2, l3] = lines(e);
        const sr = `${e.title}, ${e.context ? `${e.context}, ` : ""}${e.organization}, ${fmt(e.start)} to ${e.end === "present" ? "present" : fmt(e.end)}${e.draft ? " (draft copy)" : ""}`;
        return `<input class="tlb-in" type="radio" name="tlb-pick" id="tlb-r-${e.id}" value="${e.id}"${j === 0 && i === 0 ? " checked" : ""}>
<label class="tlb-seg" for="tlb-r-${e.id}" data-pos="${p.pos}"${p.flip ? " data-flip" : ""}${e.end === "present" ? " data-present" : ""}${months(e) >= 7 ? " data-tall" : ""} style="--a:${r4(x(e.start))};--b:${r4(xEnd(e.end))};--r:${p.row};--c:${c}">
  <span class="tlb-bar" aria-hidden="true"></span>
  <span class="tlb-txt"><span class="sr-only">${esc(sr)}</span><span class="tlb-l1" aria-hidden="true">${esc(l1)}</span><span class="tlb-l2" aria-hidden="true">${esc(l2)}</span><span class="tlb-l3" aria-hidden="true">${esc(l3)}</span></span>
</label>`;
      })
      .join("");

    // Open to Work: a dashed, empty stretch past now. Its words sit in the now label on the horizontal layout.
    const otw = withOtw
      ? `<span class="tlb-next" aria-hidden="true" style="--a:${r4(xNow)}"><span class="tlb-txt"><span class="tlb-l2">${otwText}</span></span></span>`
      : "";

    return `<div class="tlb-h tlb-h${i}" style="--c:${c}"><span class="tlb-hn">${esc(t.label)}</span><span class="tlb-hb">${esc(t.blurb)}</span><span class="tlb-hc">${list.length} role${list.length === 1 ? "" : "s"}</span></div>
<div class="tlb-t tlb-t${i}" style="--ka:${ka};--kb:${kb}">${segs}${otw}</div>`;
  };

  // Education: its own band, beside the Tracks.
  const eduMonths = months(education);
  const edu = `<div class="tlb-h tlb-h2" style="--c:${HUE.education}"><span class="tlb-hn">Education</span><span class="tlb-hb">${esc(education.institution)}</span></div>
<div class="tlb-t tlb-t2">
<input class="tlb-in" type="radio" name="tlb-pick" id="tlb-r-edu" value="edu">
<label class="tlb-seg tlb-edu" for="tlb-r-edu" style="--a:${r4(x(education.start))};--b:${r4(xEnd(education.end))};--c:${HUE.education}">
  <span class="tlb-bar" aria-hidden="true"></span>
  <span class="tlb-txt"><span class="sr-only">${esc(`${education.degree}, ${education.institution}, ${fmt(education.start)} to ${fmt(education.end)}`)}</span><span class="tlb-l1" aria-hidden="true">${esc(education.degree)}<span class="tlb-ei"> · ${esc(education.institution)}</span></span><span class="tlb-l3" aria-hidden="true">${esc(compact(education.start, education.end))}</span></span>
</label>
</div>`;

  // ── grid overlay: year lines, future zone, now ────────────────────────────────────────────────────────
  const years: string[] = [];
  for (let y = startYear; y * 12 < m0 + T; y++) {
    const xy = (y * 12 - m0) / T;
    years.push(`<span class="tlb-yr" style="--x:${r4(xy)}">${y * 12 <= nowI ? `<span>${y}</span>` : ""}</span>`);
  }
  const overlay = `<div class="tlb-ov" aria-hidden="true">
${years.join("")}
<span class="tlb-fut" style="--x:${r4(xNow)}"></span>
<span class="tlb-now" style="--x:${r4(xNow)}"><span>${openToWork ? `<em>open to roles ·</em> ` : ""}<b>now</b> <i>${fmt(now)}</i></span></span>
${reducedMotion ? "" : `<span class="tlb-veil"></span>`}
</div>`;

  // ── detail cards: one per entry, stacked in one grid cell (reserved space; never pushes layout) ──────
  const card = (e: TimelineEntry) => {
    const t = tracks.find((t) => t.id === e.track);
    const c = HUE[e.track] ?? "var(--mauve)";
    const org = e.context
      ? `<span class="tlb-co">${esc(e.context)}</span> <span class="tlb-at">at ${esc(e.organization)}</span>`
      : `<span class="tlb-co">${esc(e.organization)}</span>`;
    const end = e.end === "present" ? `<span class="tlb-pres">present</span>` : `<time datetime="${e.end}">${fmt(e.end)}</time>`;
    return `<li class="tlb-card" id="tlb-d-${e.id}" style="--c:${c}">
  <div class="tlb-meta">
    <p class="tlb-k">${esc(t?.label ?? e.track)}${e.draft ? ` <span class="tlb-draft" title="Copy pending clearance">draft</span>` : ""}</p>
    <h3 class="tlb-ti">${esc(e.title)}</h3>
    <p class="tlb-org">${org}</p>
    <p class="tlb-when"><time datetime="${e.start}">${fmt(e.start)}</time> – ${end} <span>· ${dur(months(e))}</span></p>
    <p class="tlb-where">${esc(e.location)}</p>
  </div>
  <div class="tlb-body">
    <p class="tlb-sum">${esc(e.summary)}</p>
    <ul class="tlb-hl">${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
    ${e.caseStudy ? `<a class="tlb-case" href="#case-${e.caseStudy.slug}">Case study: ${esc(e.caseStudy.title)} <span aria-hidden="true">→</span></a>` : ""}
  </div>
</li>`;
  };
  const eduCard = `<li class="tlb-card" id="tlb-d-edu" style="--c:${HUE.education}">
  <div class="tlb-meta">
    <p class="tlb-k">Education</p>
    <h3 class="tlb-ti">${esc(education.degree)}</h3>
    <p class="tlb-org"><span class="tlb-co">${esc(education.institution)}</span></p>
    <p class="tlb-when"><time datetime="${education.start}">${fmt(education.start)}</time> – <time datetime="${education.end}">${fmt(education.end)}</time> <span>· ${dur(eduMonths)}</span></p>
    <p class="tlb-where">${esc(education.location)}</p>
  </div>
  <div class="tlb-body"></div>
</li>`;

  const ids = [...entries.map((e) => e.id), "edu"];
  const pickCss = ids
    .map((id) => `.tlb:has(#tlb-r-${id}:checked) #tlb-d-${id}{visibility:visible;opacity:1;transition:opacity .2s}`)
    .join("\n");

  const total = entries.length;
  const trackWords = tracks.map((t) => t.label.toLowerCase()).join(" and ");
  const sub = `${word(total)[0].toUpperCase()}${word(total).slice(1)} roles across ${trackWords} since ${startYear}, with my degree running alongside.`;

  return `<style>${css}
${pickCss}</style>
<div class="tlb${reducedMotion ? " tlb-still" : ""}">
  <header class="tlb-head">
    <div>
      <h2 id="tlb-title" class="font-serif text-3xl text-text">Timeline</h2>
      <p class="tlb-sub">${esc(sub)}</p>
    </div>
    <div class="tlb-cta">
      ${openToWork ? `<p class="tlb-otw">Open to roles</p>` : ""}
      <a class="tlb-cv" href="${esc(cv.href)}">${esc(cv.label)} <span aria-hidden="true">↓</span></a>
    </div>
  </header>
  <div class="tlb-chart" role="group" aria-labelledby="tlb-cap">
    <p id="tlb-cap" class="sr-only">Roles and education on a time axis from ${fmt(`${startYear}-01`)} to now, ${fmt(now)}. Choose one to read its details below.</p>
    <div class="tlb-plot" style="--T:${T}">
      ${overlay}
      ${tracks.map(lane).join("\n")}
      ${edu}
    </div>
  </div>
  <p class="tlb-hint" aria-hidden="true">click or tap a role to read it below · arrow keys step through</p>
  <ol class="tlb-det" aria-label="Role details">
    ${entries.map(card).join("\n")}
    ${eduCard}
  </ol>
</div>`;
}
