// PROTOTYPE: throwaway. Variant A, "Year spine": the plainest acceptable Timeline. Two editorial columns,
// Engineering | Teaching, share one gutter of years down the middle, so roles that ran at once sit in the
// same row (Blinka beside Instructor). Rows are years, sized by content, not by time. Each role's rule runs
// down every year it covers and hugs the spine; a green rule means it's still running. Education is a
// fourth lane on wide screens. Static HTML + CSS: the only script here is the harness mounting it.
import type { TimelineEntry } from "../data";
import type { Variant } from "../types";
import { esc, monthYear, span, yearOf } from "./a/dates";
import { BASE } from "./a/styles";

const TRACK_TONE = { engineering: "text-lavender", teaching: "text-peach" } as const;
const TRACK_TAG = { engineering: "eng", teaching: "teaching" } as const;
const FOCUS = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender";

const variant: Variant = {
  name: "Year spine",
  mount(root, { entries, education, tracks, cv, now, openToWork }) {
    const nowYear = yearOf(now);
    const endOf = (e: TimelineEntry) => (e.end === "present" ? now : e.end);
    const minYear = Math.min(yearOf(education.start), ...entries.map((e) => yearOf(e.start)));
    const years = Array.from({ length: nowYear - minYear + 1 }, (_, i) => nowYear - i);
    const row = (y: number) => 2 + (nowYear - y); // row 1 holds the Track heads
    const trackOrder = tracks.map((t) => t.id);
    const label = Object.fromEntries(tracks.map((t) => [t.id, t.label]));

    // Reading order is row-major, as the eye reads the grid: by the year a role ended (newest first), then by Track.
    const ordered = [...entries].sort(
      (a, b) =>
        yearOf(endOf(b)) - yearOf(endOf(a)) ||
        trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track) ||
        endOf(b).localeCompare(endOf(a)),
    );
    // Phone rows: one per entry; a year label spans the entries that ended in it.
    const mobile = new Map<number, [number, number]>();
    ordered.forEach((e, i) => {
      const y = yearOf(endOf(e));
      const r = mobile.get(y);
      mobile.set(y, r ? [r[0], i + 2] : [i + 1, i + 2]);
    });

    const yearsCovered = (e: TimelineEntry) => {
      const out: number[] = [];
      for (let y = yearOf(endOf(e)); y >= yearOf(e.start); y--) out.push(y);
      return out;
    };
    // Calm focus: hovering or focusing a role lights the years it covers in the spine. Colour only.
    const lit = years
      .map((y) => {
        const ids = entries.filter((e) => yearsCovered(e).includes(y)).map((e) => `#tla-${e.id}`);
        if (!ids.length) return "";
        const has = ids.flatMap((id) => [`${id}:hover`, `${id}:focus-within`]).join(", ");
        return `.tla-grid:has(${has}) .tla-year[data-y="${y}"] { color: var(--lavender); }`;
      })
      .join("\n");

    const yearCells = years
      .map((y) => {
        const m = mobile.get(y);
        const active = entries.some((e) => yearsCovered(e).includes(y));
        const tone = y === nowYear ? "text-text" : active ? "text-muted" : "text-faint";
        // Years only Education covers (2020, 2021) earn their rows only once Education is a lane beside them.
        const empty = (m ? "" : " data-mobile-empty") + (active ? "" : " data-edu-only");
        const vars = `--r:${row(y)};--m1:${m?.[0] ?? 1};--m2:${m?.[1] ?? 2};--ml:${m?.[0] ?? 1}`;
        return `<div class="tla-line" aria-hidden="true" style="${vars}"${empty}></div>
<p class="tla-year ${tone} font-serif text-lg tabular-nums md:text-2xl" data-y="${y}" aria-hidden="true" style="${vars}"${empty}>${y}</p>`;
      })
      .join("");

    const entryHtml = (e: TimelineEntry, i: number) => {
      const end = endOf(e);
      const present = e.end === "present";
      const name = e.context ?? e.organization;
      const vars = `--r1:${row(yearOf(end))};--r2:${row(yearOf(e.start)) + 1};--m:${i + 1}`;
      const highlights = e.highlights
        .map((h, j) => `<li class="flex gap-2${j ? " max-sm:hidden" : ""}"><span aria-hidden="true" class="font-mono text-faint">–</span><span>${esc(h)}</span></li>`)
        .join("");
      return `<article id="tla-${e.id}" class="tla-entry" data-track="${e.track}"${present ? " data-present" : ""} style="${vars}" aria-labelledby="tla-${e.id}-t">
  <p class="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs text-muted">
    <span class="sr-only">${esc(label[e.track])}:</span>
    <span aria-hidden="true" class="${TRACK_TONE[e.track]} md:hidden">${TRACK_TAG[e.track]}</span>
    <span><time datetime="${e.start}">${monthYear(e.start)}</time> – ${
      present ? `<time datetime="${now}" class="text-green">now</time>` : `<time datetime="${e.end}">${monthYear(e.end as typeof now)}</time>`
    }</span>
    <span class="text-faint">· ${span(e.start, end)}</span>
    ${e.draft ? `<span class="rounded-sm border border-border px-1 text-[10px] uppercase tracking-wider text-faint" title="Copy pending clearance">draft</span>` : ""}
  </p>
  <h3 id="tla-${e.id}-t" class="tla-title mt-1.5 text-lg font-medium leading-snug text-text">${esc(e.title)}</h3>
  <p class="mt-0.5 font-serif text-[17px] leading-snug"><span class="text-text">${esc(name)}</span>${
    e.context ? `<span class="text-muted"> · ${esc(e.organization)}</span>` : ""
  }</p>
  <p class="mt-3 max-w-prose text-[15px] leading-relaxed text-muted">${esc(e.summary)}</p>
  <ul class="mt-3 max-w-prose space-y-1.5 text-sm leading-relaxed text-muted">${highlights}</ul>
  ${
    e.caseStudy
      ? `<a href="#case-${e.caseStudy.slug}" class="${FOCUS} mt-4 inline-block font-mono text-xs text-lavender underline-offset-4 hover:underline">case study: ${esc(e.caseStudy.title)} →</a>`
      : ""
  }
</article>`;
    };

    const heads = tracks
      .map(
        (t) => `<p class="tla-head" data-track="${t.id}" aria-hidden="true">
  <span class="block font-mono text-[11px] uppercase tracking-[0.18em] ${TRACK_TONE[t.id]}">${esc(t.label)}</span>
  <span class="mt-1 block text-sm text-muted">${esc(t.blurb)}</span>
</p>`,
      )
      .join("");

    const eduVars = `--me:${ordered.length + 1};--re:${row(minYear) + 1}`;
    const eduHead = `<p class="tla-edu-head" aria-hidden="true">
  <span class="block font-mono text-[11px] uppercase tracking-[0.18em] text-mauve">Education</span>
  <span class="mt-1 block text-sm text-muted">Alongside both tracks</span>
</p>`;
    const edu = `<article class="tla-edu" style="${eduVars}" aria-labelledby="tla-edu-t">
  <p class="tla-edu-label font-mono text-[11px] uppercase tracking-[0.18em] text-mauve">Education</p>
  <p class="mt-2 font-mono text-xs text-muted lg:mt-0"><time datetime="${education.start}">${monthYear(education.start)}</time> – <time datetime="${education.end}">${monthYear(education.end)}</time></p>
  <h3 id="tla-edu-t" class="mt-1.5 text-lg font-medium leading-snug text-text">${esc(education.degree)}</h3>
  <p class="mt-0.5 font-serif text-[17px] leading-snug text-text">${esc(education.institution)}</p>
  <p class="mt-2 text-sm text-muted">${esc(education.location)}</p>
</article>`;

    const otw = openToWork
      ? `<p class="flex items-center gap-2 font-mono text-sm text-green"><span aria-hidden="true" class="size-2 rounded-full bg-green shadow-[0_0_0_3px_color-mix(in_oklab,var(--green)_22%,transparent)]"></span>Open to new roles</p>`
      : "";
    const cvClass = openToWork
      ? "border-green text-text hover:bg-surface"
      : "border-border text-lavender hover:border-faint";

    const section = document.createElement("section");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
    section.setAttribute("aria-labelledby", "tla-title");
    section.innerHTML = `<style>${BASE}\n${lit}</style>
<header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <h2 id="tla-title" class="font-serif text-3xl text-text">Timeline</h2>
    <p class="mt-3 max-w-prose text-muted">I build production software and I teach. Read across a row to see what ran at the same time.</p>
  </div>
  <div class="flex shrink-0 flex-col items-start gap-2 sm:items-end">
    ${otw}
    <a href="${esc(cv.href)}" class="${FOCUS} ${cvClass} inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-sm transition-colors">${esc(cv.label)} <span aria-hidden="true">↓</span></a>
    <p class="font-mono text-[11px] text-faint">as of <time datetime="${now}">${monthYear(now)}</time></p>
  </div>
</header>
<div class="tla-grid mt-10">
  ${heads}${eduHead}
  ${yearCells}
  ${ordered.map(entryHtml).join("")}
  ${edu}
</div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
