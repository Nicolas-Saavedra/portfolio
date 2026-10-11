// PROTOTYPE: throwaway placeholder for variant B. Its agent replaces this file (and may rename it to b-<slug>.ts).
import type { Variant } from "../types";

const variant: Variant = {
  name: "Placeholder B",
  mount(root, { entries, education, tracks, cv, openToWork }) {
    const section = document.createElement("section");
    section.setAttribute("aria-labelledby", "timeline-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
    section.innerHTML = `
<h2 id="timeline-title" class="font-serif text-3xl text-text">Timeline</h2>
${openToWork ? '<p class="mt-2 font-mono text-sm text-green">open to roles</p>' : ""}
${tracks
  .map(
    (t) => `<h3 class="mt-8 font-mono text-xs text-faint">${t.label}</h3><ul class="mt-2 space-y-1">${entries
      .filter((e) => e.track === t.id)
      .map((e) => `<li>${e.title} · ${e.organization}${e.context ? ` (${e.context})` : ""} · ${e.start}–${e.end}</li>`)
      .join("")}</ul>`,
  )
  .join("")}
<p class="mt-8 font-mono text-xs text-faint">Education</p>
<p class="mt-2">${education.degree} · ${education.institution} · ${education.start}–${education.end}</p>
<a class="mt-6 inline-block text-lavender underline" href="${cv.href}">${cv.label}</a>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
