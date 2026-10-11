// PROTOTYPE: throwaway. Static stand-ins for the home sections around the Timeline, so variants are judged
// in the page and not in a vacuum. Not part of the design question; Selected Work has its own prototype.
// The hero above is the real Request Automaton (variant G), mounted by the route.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const WORK = [
  ["blinka", "Running Blinka's infrastructure", "AWS, CI/CD, observability and PR review, as the only infrastructure engineer of a YC fintech."],
  ["gold-mercury", "From GOLD-python to mercury-lib", "A research line carried from a research assistant role to a thesis: automata, and how to see them."],
  ["noestassolx", "NoEstasSolx", "A platform built and shipped for more than 1,000 students."],
  ["teaching", "Teaching", "More than 150 students taught, from HTML to React."],
];

const STUB = `<p class="font-mono text-[11px] text-faint">prototype stub</p>`;

export function selectedWorkStub(): HTMLElement {
  const el = document.createElement("section");
  el.setAttribute("aria-labelledby", "stub-work-title");
  el.className = "mx-auto w-full max-w-6xl px-4 py-16 sm:px-8";
  el.innerHTML = `${STUB}
<h2 id="stub-work-title" class="mt-3 font-serif text-3xl text-text">Selected Work</h2>
<ol class="mt-6 divide-y divide-border border-y border-border">
  ${WORK.map(([slug, t, d]) => `<li id="case-${slug}" class="grid scroll-mt-8 gap-1 py-6 sm:grid-cols-[18rem_1fr] sm:gap-8"><span class="text-lg text-text">${esc(t)}</span><span class="text-muted">${esc(d)}</span></li>`).join("")}
</ol>`;
  return el;
}

export function contactStub(): HTMLElement {
  const el = document.createElement("section");
  el.setAttribute("aria-labelledby", "stub-contact-title");
  el.className = "mx-auto w-full max-w-6xl px-4 pb-48 pt-16 sm:px-8";
  el.innerHTML = `${STUB}
<h2 id="stub-contact-title" class="mt-3 font-serif text-3xl text-text">Contact</h2>
<p class="mt-4 max-w-prose text-muted">If you're working on something where development, operations and people meet, write to me.</p>
<p class="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm"><a class="text-lavender underline-offset-4 hover:underline" href="#">personal@nicolassaavedra.co</a><a class="text-lavender underline-offset-4 hover:underline" href="#">GitHub</a><a class="text-lavender underline-offset-4 hover:underline" href="#">LinkedIn</a></p>`;
  return el;
}
