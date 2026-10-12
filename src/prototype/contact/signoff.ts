// PROTOTYPE: throwaway. The sign-off every variant shares: one sentence (its verb is the mailto link), the address set
// large and selectable in one click (`user-select: all`), and two small links. Scoped under `.ct`; variants add their
// own layout around it. Static markup and CSS only.
import { esc } from "./content";
import type { VariantContext } from "./types";

const MONO = `var(--font-mono)`;

export const SIGNOFF_STYLE = `
.ct{--ct-gap:clamp(1.25rem,.9rem + 1.2vw,1.75rem)}
.ct .ct-rule{border-top:1px solid var(--border)}
.ct .ct-h{font-family:${MONO};font-size:12px;line-height:1rem;letter-spacing:.04em;color:var(--muted)}
.ct .ct-say{margin-top:1.25rem;max-width:34rem;font-size:1.0625rem;line-height:1.6;color:var(--muted);text-wrap:pretty}
.ct a{color:var(--text);text-decoration:underline;text-decoration-color:var(--border);text-decoration-thickness:1px;text-underline-offset:4px}
.ct a:hover{text-decoration-color:var(--lavender)}
.ct a:focus-visible{outline:2px solid var(--lavender);outline-offset:3px;border-radius:2px;text-decoration-color:var(--lavender)}
.ct .ct-say a{color:var(--text)}
.ct .ct-addr{margin-top:var(--ct-gap);font-family:var(--font-serif);font-size:clamp(1.3125rem,.55rem + 3.6vw,3.25rem);line-height:1.1;
  letter-spacing:-.012em;color:var(--text);overflow-wrap:anywhere}
.ct .ct-sel{user-select:all;-webkit-user-select:all;cursor:text}
.ct .ct-sel::selection,.ct .ct-sel *::selection{background:color-mix(in srgb,var(--lavender) 28%,transparent);color:var(--text)}
.ct .ct-hint{display:block;margin-top:.625rem;font-family:${MONO};font-size:12px;line-height:1rem;color:var(--faint)}
@media (pointer:coarse){.ct .ct-hint{display:none}}
.ct .ct-links{margin-top:var(--ct-gap);display:flex;flex-wrap:wrap;column-gap:1.5rem;row-gap:.5rem;font-family:${MONO};font-size:13px;line-height:1.25rem}
.ct .ct-links a{color:var(--muted)}
.ct .ct-links a:hover{color:var(--text)}
.ct .ct-arrow{margin-left:.25em;color:var(--faint)}
@media (prefers-reduced-motion:no-preference){.ct a{transition:color .15s,text-decoration-color .15s}}
`;

/** The sign-off's inner markup (heading, sentence, address, links). The caller wraps it in its own <section>. */
export function signOff(ctx: VariantContext, titleId: string): string {
  const { contact, openToWork } = ctx;
  const s = openToWork ? contact.signOffOpenToWork : contact.signOff;
  const [user, domain] = contact.email.split("@");
  const links = contact.links
    .map((l) => `<li><a href="${esc(l.href)}" rel="me">${esc(l.label)}<span class="ct-arrow" aria-hidden="true">↗</span></a></li>`)
    .join("");
  return `
    <h2 id="${titleId}" class="ct-h">Contact</h2>
    <p class="ct-say">${esc(s.before)}<a href="mailto:${esc(contact.email)}">${esc(s.cta)}</a>${esc(s.after)}</p>
    <p class="ct-addr"><span class="ct-sel">${esc(user)}<wbr>@${esc(domain)}</span><span class="ct-hint" aria-hidden="true">one click selects the whole address</span></p>
    <ul class="ct-links" aria-label="Elsewhere">${links}</ul>`;
}
