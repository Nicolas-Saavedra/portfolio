// PROTOTYPE: throwaway placeholder for variant B. The agent that owns B replaces this file.
import type { Variant } from "../types";

const variant: Variant = {
  name: "Placeholder B",
  mount(root, { work }) {
    const section = document.createElement("section");
    section.id = "selected-work";
    section.setAttribute("aria-labelledby", "sw-title");
    section.className = "mx-auto w-full max-w-6xl px-4 py-20 sm:px-8";
    const h2 = document.createElement("h2");
    h2.id = "sw-title";
    h2.className = "font-serif text-3xl text-text";
    h2.textContent = "Selected Work";
    const ol = document.createElement("ol");
    ol.className = "mt-6 divide-y divide-border border-y border-border";
    for (const c of work) {
      const li = document.createElement("li");
      li.className = "py-5";
      const a = document.createElement("a");
      a.href = c.href;
      a.className = "text-lg text-text underline-offset-4 hover:underline";
      a.textContent = c.title;
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = `${c.summary} (${c.period.label})`;
      li.append(a, p);
      ol.append(li);
    }
    section.append(h2, ol);
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
