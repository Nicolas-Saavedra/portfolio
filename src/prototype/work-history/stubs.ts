// PROTOTYPE: throwaway. Static stand-in for the contact section below the fused section, so variants are judged in
// the page and not in a vacuum. The hero above is the real Request Automaton (variant G), mounted by the route.

const STUB = `<p class="font-mono text-[11px] text-faint">prototype stub</p>`;

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
