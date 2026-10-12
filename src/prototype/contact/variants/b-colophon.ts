// PROTOTYPE: throwaway. Contact B, "Sign-off + colophon": A's sign-off, then a quiet colophon in the page's footer
// saying how the site is made, where its source is, and when it was last built.
// The one idea: the page ends by showing its own seams, like the last page of a book.
import { CONTACT, esc, longDate } from "../content";
import { SIGNOFF_STYLE, signOff } from "../signoff";
import type { Variant } from "../types";

const MONO = `var(--font-mono)`;

const STYLE = `
#ct-b .ct-body{padding-top:clamp(3.5rem,2.5rem + 4vw,6rem);padding-bottom:clamp(3.5rem,2.75rem + 3vw,5rem)}
#ct-b-colo .ct-colo{display:grid;gap:1.25rem;padding-top:1.5rem;padding-bottom:clamp(3rem,2.5rem + 2vw,4rem)}
@media (min-width:768px){#ct-b-colo .ct-colo{grid-template-columns:minmax(0,30rem) minmax(0,1fr);column-gap:clamp(2rem,1rem + 4vw,5rem)}}
#ct-b-colo .ct-colo-h{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
#ct-b-colo .ct-colo-say{font-size:13.5px;line-height:1.65;color:var(--muted);text-wrap:pretty}
#ct-b-colo .ct-meta{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:1rem;row-gap:.375rem;align-content:start;
  font-family:${MONO};font-size:12px;line-height:1.25rem}
#ct-b-colo .ct-meta dt{color:var(--faint)}
#ct-b-colo .ct-meta dd{color:var(--muted);overflow-wrap:anywhere}
#ct-b-colo .ct-meta a{color:var(--muted)}
#ct-b-colo .ct-meta a:hover{color:var(--text)}
`;

const variant: Variant = {
  name: "Sign-off + colophon",
  mount(root, ctx) {
    const c = CONTACT.colophon;
    const section = document.createElement("section");
    section.id = "ct-b";
    section.className = "ct mx-auto w-full max-w-6xl px-4 sm:px-8";
    section.setAttribute("aria-labelledby", "ct-b-title");
    section.innerHTML = `<style>${SIGNOFF_STYLE}${STYLE}</style>
      <div class="ct-rule ct-body">${signOff(ctx, "ct-b-title")}</div>`;

    const footer = document.createElement("footer");
    footer.id = "ct-b-colo";
    footer.className = "ct mx-auto w-full max-w-6xl px-4 sm:px-8";
    footer.innerHTML = `
      <div class="ct-rule ct-colo">
        <h2 class="ct-colo-h">Colophon</h2>
        <p class="ct-colo-say">${esc(c.sentence)}</p>
        <dl class="ct-meta">
          <dt>source</dt><dd><a href="${esc(c.repo.href)}">${esc(c.repo.label)}<span class="ct-arrow" aria-hidden="true">↗</span></a></dd>
          <dt>built with</dt><dd>${esc(c.stack)}</dd>
          <dt>last updated</dt><dd><time datetime="${esc(ctx.builtAt)}">${esc(longDate(ctx.builtAt))}</time></dd>
          <dt>license</dt><dd>${esc(c.license)}</dd>
        </dl>
      </div>`;
    root.append(section, footer);
    return () => { section.remove(); footer.remove(); };
  },
};

export default variant;
