// PROTOTYPE: throwaway. An unstyled dump of the fused content, used by the placeholder variants until their owners
// replace them. Also a quick check that the join (roles ↔ Case Studies ↔ spans) reads right.
import { caseStudyOf, roleById } from "./content";
import type { VariantContext } from "./types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function placeholder(root: HTMLElement, ctx: VariantContext, title: string): () => void {
  const section = document.createElement("section");
  section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
  section.setAttribute("aria-labelledby", "wh-ph-title");
  const roles = ctx.tracks
    .map((t) => {
      const rows = ctx.entries
        .filter((r) => r.track === t.id)
        .map((r) => {
          const cs = caseStudyOf(r);
          return `<li class="py-2"><span class="text-text">${esc(r.title)}</span> · <span class="text-muted">${esc(r.context ?? r.organization)}</span> <span class="font-mono text-xs text-faint">${r.start} – ${r.end}</span>${cs ? ` <a class="font-mono text-xs text-lavender" href="${cs.href}">→ ${esc(cs.short)}</a>` : ""}</li>`;
        })
        .join("");
      return `<h3 class="mt-6 font-mono text-xs text-faint">${esc(t.label)}</h3><ol>${rows}</ol>`;
    })
    .join("");
  const work = ctx.work
    .map(
      (c) =>
        `<li class="py-2"><a class="text-lavender" href="${c.href}">${esc(c.title)}</a> <span class="font-mono text-xs text-faint">${c.spans.map((s) => `${esc(s.label)}${s.role ? ` [${roleById(s.role)?.id}]` : " [no role]"}`).join(" → ")}</span></li>`,
    )
    .join("");
  section.innerHTML = `<p class="font-mono text-[11px] text-faint">placeholder · ${esc(title)}</p>
<h2 id="wh-ph-title" class="mt-3 font-serif text-3xl">Work</h2>
${ctx.openToWork ? `<p class="mt-3 font-mono text-sm text-green">● ${esc(ctx.openToWorkCopy.signal)}</p>` : ""}
<p class="mt-3"><a class="font-mono text-sm text-lavender" href="${ctx.cv.href}">${esc(ctx.cv.label)}</a></p>
${roles}
<h3 class="mt-6 font-mono text-xs text-faint">Education</h3><p class="py-2">${esc(ctx.education.degree)} · ${esc(ctx.education.institution)} <span class="font-mono text-xs text-faint">${ctx.education.start} – ${ctx.education.end}</span></p>
<h3 class="mt-6 font-mono text-xs text-faint">Case Studies</h3><ol>${work}</ol>`;
  root.append(section);
  return () => section.remove();
}
