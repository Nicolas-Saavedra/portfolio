// PROTOTYPE: throwaway. Contact C, "The accept state": A's sign-off beside one small static figure in the Request
// Automaton's vocabulary. The hero's last state, Delivered, takes one more transition, "get in touch", into a final
// double-circled accepting state, q₆, labelled ∎.
// The one idea: the page ends where the Request Automaton ends. No animation, no script; the SVG is plain markup.
import { SIGNOFF_STYLE, signOff } from "../signoff";
import type { Variant } from "../types";

const MONO = `var(--font-mono)`;

const STYLE = `
#ct-c .ct-body{display:grid;row-gap:2.75rem;padding-top:clamp(3.5rem,2.5rem + 4vw,6rem);padding-bottom:clamp(5rem,4rem + 5vw,8rem)}
@media (min-width:1024px){#ct-c .ct-body{grid-template-columns:minmax(0,1fr) auto;column-gap:clamp(2rem,1rem + 3vw,4rem);align-items:end}}
#ct-c .ct-fig{width:17.5rem;max-width:100%;height:auto;overflow:visible}
@media (min-width:1024px){#ct-c .ct-fig{margin-bottom:.25rem}}
#ct-c .ct-fig .m{font-family:${MONO}}
#ct-c .ct-fig .s{font-family:var(--font-sans)}
`;

// Geometry follows the docked hero (C's automaton row): r 22, 1.3 px edges, the accept ring 4 px inside, the label
// 21 px under the rim at 12.5 px, the q-id at 11 px mono. The accept state is the current one, so it carries the
// active hue at full stroke, a 22 % fill and the focus glow; Delivered is "entered, not current". Its label is ∎,
// drawn as a rect so it doesn't depend on a font having the glyph. No dwell arc or token: three rings read busy.
const G = "var(--green)";
const mix = (pct: number, base: string) => `color-mix(in srgb,${G} ${pct}%,${base})`;
const head = (x: number, y: number) => `M${x},${y}l-7,-3.5v7z`;

function figure(): string {
  const y = 46, q5 = 76, acc = 214, r = 22;
  const e0 = q5 + r, e1 = acc - r - 2;
  return `<svg class="ct-fig" viewBox="0 0 280 92" aria-hidden="true" focusable="false">
    <path d="M2,${y}H22" fill="none" stroke="var(--border)" stroke-width="1.3" stroke-dasharray="2 4"/>
    <path d="M22,${y}H${q5 - r - 1}" fill="none" stroke="var(--muted)" stroke-width="1.3"/>
    <path d="${head(q5 - r - 1, y)}" fill="var(--muted)"/>
    <circle cx="${q5}" cy="${y}" r="${r}" fill="${mix(10, "var(--bg)")}" stroke="${mix(65, "var(--border)")}" stroke-width="1.5"/>
    <text class="m" x="${q5}" y="${y}" dy=".35em" text-anchor="middle" font-size="11" fill="var(--muted)">q₅</text>
    <text class="s" x="${q5}" y="${y + r + 21}" text-anchor="middle" font-size="12.5" fill="var(--text)">Delivered</text>
    <path d="M${e0},${y}H${e1}" fill="none" stroke="var(--muted)" stroke-width="1.3"/>
    <path d="${head(e1, y)}" fill="var(--muted)"/>
    <text class="m" x="${(e0 + e1) / 2}" y="${y - 9}" text-anchor="middle" font-size="11" fill="var(--muted)">get in touch</text>
    <circle cx="${acc}" cy="${y}" r="${r + 9}" fill="${G}" opacity=".12"/>
    <circle cx="${acc}" cy="${y}" r="${r}" fill="${mix(22, "var(--bg)")}" stroke="${G}" stroke-width="1.5"/>
    <circle cx="${acc}" cy="${y}" r="${r - 4}" fill="none" stroke="${G}" stroke-width="1.25"/>
    <text class="m" x="${acc}" y="${y}" dy=".35em" text-anchor="middle" font-size="11" fill="var(--muted)">q₆</text>
    <rect x="${acc - 3.5}" y="${y + r + 12}" width="7" height="9" fill="var(--text)"/>
  </svg>`;
}

const variant: Variant = {
  name: "The accept state",
  mount(root, ctx) {
    const section = document.createElement("section");
    section.id = "ct-c";
    section.className = "ct mx-auto w-full max-w-6xl px-4 sm:px-8";
    section.setAttribute("aria-labelledby", "ct-c-title");
    section.innerHTML = `<style>${SIGNOFF_STYLE}${STYLE}</style>
      <div class="ct-rule ct-body"><div>${signOff(ctx, "ct-c-title")}</div>${figure()}</div>`;
    root.append(section);
    return () => section.remove();
  },
};

export default variant;
