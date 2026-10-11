// PROTOTYPE: throwaway. Variant C, "Process table": the career in the hero's instrument vocabulary, at the scale
// of years. Tracks are services, each role is a process (running / exited 0) named by its unit, so the five
// Universidad de los Andes roles read as five different things. A segmented lifetime meter (one cell = one
// quarter) on a shared axis shows overlap and gaps; a cursor marks now. Rows are <details>, the reveal and the
// calm focus are CSS: the real site could render all of it at build time with no client JS.
import type { TrackId, YearMonth } from "../data";
import type { Variant, VariantContext } from "../types";
import { CSS } from "./c/css";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const slug = (s: string) =>
  s.replace(/\(.*?\)/g, "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const HUE: Record<TrackId | "education", string> = {
  engineering: "var(--lavender)",
  teaching: "var(--peach)",
  education: "var(--mauve)",
};

type Row = {
  hue: string;
  unit?: string;
  title: string;
  org: string;
  start: YearMonth;
  end: YearMonth | "present";
  draft?: boolean;
  detail?: string;
};

function build(ctx: VariantContext, anim: boolean): string {
  const { entries, education, tracks, cv, now, openToWork } = ctx;
  const month = (ym: YearMonth | "present") => {
    const [y, m] = (ym === "present" ? now : ym).split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const quarter = (ym: YearMonth | "present") => Math.floor(month(ym) / 3);
  const first = Math.min(month(education.start), ...entries.map((e) => month(e.start)));
  const q0 = Math.floor(first / 12) * 4; // the axis starts on the first year's January
  const cells = quarter(now) - q0 + 1;
  const y0 = Math.floor(first / 12);

  const elapsed = (r: Row) => {
    const n = month(r.end) - month(r.start) + 1;
    const y = Math.floor(n / 12), m = n % 12;
    return [y ? `${y} y` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
  };
  const time = (ym: YearMonth | "present") =>
    ym === "present" ? `<span class="text-green">now</span>` : `<time datetime="${ym}">${ym}</time>`;

  /** `[···▮▮▮····▌]`: empty quarters as faint dots, filled runs as one segmented span, the running cell as the cursor. */
  const meter = (r: Row, queued = false) => {
    const a = queued ? cells : quarter(r.start) - q0, b = queued ? cells - 1 : quarter(r.end) - q0;
    const running = r.end === "present";
    let html = `<span class="text-faint">[</span>`;
    const dots = (n: number) => (n > 0 ? `<span class="text-faint">${"·".repeat(n)}</span>` : "");
    if (queued) html += dots(cells - 1) + `<span class="tlc-queued"></span>`;
    else {
      const fill = b - a + 1 - (running ? 1 : 0);
      html += dots(a);
      if (fill > 0) html += `<span class="tlc-fill" style="--n:${fill};--hue:${r.hue}"></span>`;
      html += running ? `<span class="tlc-cur"></span>` : dots(cells - 1 - b);
    }
    return `<span class="tlc-meter font-mono text-[12px] sm:text-[13px]" aria-hidden="true">${html}<span class="text-faint">]</span></span>`;
  };

  const axis = (() => {
    let s = " ";
    for (let i = 0; i < cells; i += 4) s += `'${String((y0 + i / 4) % 100).padStart(2, "0")} `.slice(0, Math.min(4, cells - i));
    return s + " ";
  })();

  const status = (r: Row, open: boolean) => {
    const running = r.end === "present";
    return `<span class="tlc-stat flex items-center gap-2 font-mono text-[11px] leading-5">
      <span class="tlc-chev text-faint">${open ? "▸" : "&nbsp;"}</span>
      ${running ? `<span class="size-1.5 rounded-full bg-green"></span><span class="text-green">running</span>` : `<span class="size-1.5 rounded-full border border-faint"></span><span class="text-faint">exited 0</span>`}
    </span>`;
  };

  const cells5 = (r: Row, open: boolean) => `
    ${status(r, open)}
    <span class="tlc-main min-w-0">
      <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-5">
        ${r.unit ? `<span class="font-mono text-[12px]" style="color:${r.hue}">${esc(r.unit)}</span>` : ""}
        <span class="font-medium text-text">${esc(r.title)}</span>
        ${r.draft ? `<span class="rounded-sm border border-dashed border-border px-1 font-mono text-[10px] leading-4 text-faint" title="Copy pending clearance">draft</span>` : ""}
      </span>
      <span class="block text-sm text-muted">${esc(r.org)}</span>
    </span>
    <span class="tlc-when whitespace-nowrap font-mono text-[11px] leading-5 text-muted">${time(r.start)} → ${time(r.end)}</span>
    <span class="tlc-age whitespace-nowrap font-mono text-[11px] leading-5 text-faint">${elapsed(r)}</span>
    ${meter(r)}`;

  const row = (r: Row) =>
    r.detail
      ? `<li class="tlc-hov"><details><summary class="tlc-row focus-visible:outline-2 focus-visible:outline-lavender">${cells5(r, true)}</summary>${r.detail}</details></li>`
      : `<li class="tlc-hov"><div class="tlc-row">${cells5(r, false)}</div></li>`;

  const services = tracks
    .map((t) => {
      const hue = HUE[t.id];
      const mine = entries.filter((e) => e.track === t.id);
      const running = mine.filter((e) => e.end === "present").length;
      const rows = mine.map((e) => {
        const caseLink = e.caseStudy
          ? `<a href="#case-${e.caseStudy.slug}" class="text-lavender underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-lavender">→ case study: ${esc(e.caseStudy.title)}</a>`
          : "";
        const detail = `
          <div class="tlc-detail px-4 pb-4 pt-1 pl-9 lg:pl-[8.75rem]">
            <p class="max-w-prose text-sm text-text">${esc(e.summary)}</p>
            <ul class="mt-2 max-w-prose space-y-1 border-l-2 pl-3 text-sm text-muted" style="border-color:${hue}">
              ${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}
            </ul>
            <p class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-faint"><span>${esc(e.location)}</span>${caseLink}</p>
          </div>`;
        return row({
          hue,
          unit: slug(e.context ?? e.organization),
          title: e.title,
          org: e.organization,
          start: e.start,
          end: e.end,
          draft: e.draft,
          detail,
        });
      });
      return `
      <div class="border-t border-border">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-1 pt-4 font-mono text-xs">
          <h3 class="lowercase" style="color:${hue}">${esc(t.label)}</h3>
          <span class="font-sans text-[13px] text-muted">${esc(t.blurb)}</span>
          <span class="ml-auto text-faint">${mine.length} roles${running ? ` · <span class="text-green">${running} running</span>` : ""}</span>
        </div>
        <ol class="px-0 pb-2 sm:px-1">${rows.join("")}</ol>
      </div>`;
    })
    .join("");

  const edu = `
    <div class="border-t border-border">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-1 pt-4 font-mono text-xs">
        <h3 style="color:${HUE.education}">education</h3>
        <span class="font-sans text-[13px] text-muted">alongside both Tracks, not in one</span>
      </div>
      <ol class="pb-2 sm:px-1">${row({ hue: HUE.education, title: education.degree, org: `${education.institution} · ${education.location}`, start: education.start, end: education.end })}</ol>
    </div>`;

  const queued = openToWork
    ? `<div class="border-t border-border" style="background:color-mix(in srgb, var(--green) 7%, transparent)">
        <div class="tlc-row">
          <span class="tlc-stat flex items-center gap-2 font-mono text-[11px] leading-5">
            <span class="tlc-chev">&nbsp;</span><span class="size-1.5 rounded-full border border-dashed border-green"></span><span class="text-green">queued</span>
          </span>
          <span class="tlc-main min-w-0">
            <span class="flex flex-wrap items-baseline gap-x-2 leading-5"><span class="font-mono text-[12px] text-green">next</span><span class="font-medium text-text">Open to new roles</span></span>
            <span class="block text-sm text-muted">I'm looking for my next role. The <a href="${esc(cv.href)}" class="text-lavender underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-lavender">CV</a> has the full record.</span>
          </span>
          <span class="tlc-when whitespace-nowrap font-mono text-[11px] leading-5 text-muted">from <time datetime="${now}">${now}</time></span>
          <span class="tlc-age"></span>
          ${meter({ hue: "var(--green)", title: "", org: "", start: now, end: now }, true)}
        </div>
      </div>`
    : "";

  const all = entries.length;
  const running = entries.filter((e) => e.end === "present").length;

  return `
<style>${CSS}</style>
<p class="font-mono text-[11px] text-faint">timeline · roles and education</p>
<h2 id="timeline-title" class="mt-3 font-serif text-3xl text-text">What I've been running</h2>
<p class="mt-3 max-w-prose text-muted">My roles since ${esc(entries.map((e) => e.start).sort()[0])}, as a process table: the same instruments as the request trace above, on a scale of years instead of milliseconds. Open a row to see what I did there.</p>

<div class="tlc-table ${anim ? "tlc-anim" : ""} mt-8 overflow-hidden rounded-md border border-border bg-surface">
  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
    <p class="flex flex-wrap items-baseline gap-x-2.5 text-sm">
      <span class="font-mono text-text">ps --career</span>
      <span class="text-muted">my roles, as processes</span>
    </p>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px]">
      ${openToWork ? `<span class="flex items-center gap-1.5 rounded-sm border border-green/50 px-2 py-0.5 text-green"><span class="size-1.5 rounded-full bg-green"></span>open to roles</span>` : ""}
      <span class="rounded-sm border border-dashed border-border px-2 py-0.5 text-muted">years, not ms</span>
      <a href="${esc(cv.href)}" aria-label="${esc(cv.label)}" class="whitespace-nowrap rounded-sm border border-lavender/60 px-2 py-0.5 text-lavender hover:bg-lavender/10 focus-visible:outline-2 focus-visible:outline-lavender">↓ ${esc(cv.href.split("/").pop() ?? "cv")}</a>
    </div>
  </div>
  <p class="border-t border-border px-4 py-1.5 font-mono text-[11px] text-faint"><span class="text-green">${running} running</span> · ${all - running} exited · sampled <time datetime="${now}">${now}</time></p>
  ${queued}
  <div class="tlc-row border-t border-border py-2 font-mono text-[11px] text-faint" aria-hidden="true">
    <span class="tlc-stat hidden lg:block">&nbsp;&nbsp;&nbsp;status</span>
    <span class="tlc-main hidden lg:block">unit · role</span>
    <span class="tlc-when hidden lg:block">start → end</span>
    <span class="tlc-age hidden lg:block">elapsed</span>
    <span class="tlc-axis text-[12px] sm:text-[13px]">${axis}</span>
  </div>
  ${services}
  ${edu}
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 font-mono text-[11px] text-faint" aria-hidden="true">
    <span><span class="tlc-fill" style="--n:1;--hue:var(--faint)"></span> one quarter</span>
    <span><span class="tlc-cur"></span> now, ${esc(now)}</span>
    <span>▸ open a row for highlights</span>
  </div>
</div>`;
}

const variant: Variant = {
  name: "Process table",
  mount(root, ctx) {
    const section = document.createElement("section");
    section.setAttribute("aria-labelledby", "timeline-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
    section.innerHTML = build(ctx, !ctx.reducedMotion);
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
