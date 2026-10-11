// PROTOTYPE: throwaway. Variant C's scoped stylesheet: the responsive row grid, the segmented lifetime meter,
// calm focus (dim the other meters, glow the hovered one) and the blinking now-cursor. On the real site this
// is an Astro component's <style>; nothing here needs JavaScript.

export const CSS = `
.tlc-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "stat stat when" "main main main" "meter meter age";
  column-gap: .75rem; row-gap: .3rem;
  padding: .7rem 1rem;
  border-radius: 2px;
  transition: background-color 150ms;
}
@media (min-width: 1024px) {
  .tlc-row {
    grid-template-columns: 7rem minmax(0, 1fr) 10rem 5rem auto;
    grid-template-areas: "stat main when age meter";
    align-items: start;
  }
}
.tlc-stat { grid-area: stat; } .tlc-main { grid-area: main; } .tlc-when { grid-area: when; }
.tlc-age { grid-area: age; } .tlc-axis, .tlc-meter { grid-area: meter; }
@media (max-width: 1023.98px) { .tlc-when, .tlc-age { text-align: right; } }

summary.tlc-row { list-style: none; cursor: pointer; }
summary.tlc-row::-webkit-details-marker { display: none; }
.tlc-chev { display: inline-block; width: 1ch; transition: transform 150ms; }
details[open] > summary .tlc-chev { transform: rotate(90deg); }
summary.tlc-row:hover, details[open] > summary.tlc-row { background: color-mix(in srgb, var(--text) 5%, transparent); }

.tlc-meter, .tlc-axis { white-space: pre; line-height: 1.25rem; transition: opacity 150ms; }
.tlc-fill {
  display: inline-block; width: calc(var(--n) * 1ch); height: .72em; vertical-align: -.04em;
  background: repeating-linear-gradient(90deg, transparent 0 1px, var(--hue) 1px calc(1ch - 1px), transparent calc(1ch - 1px) 1ch);
  transition: filter 150ms;
}
.tlc-cur {
  display: inline-block; width: 1ch; height: .95em; vertical-align: -.16em;
  background: var(--green);
}
.tlc-queued {
  display: inline-block; width: 1ch; height: .95em; vertical-align: -.16em;
  outline: 1px dashed var(--green); outline-offset: -2px;
}

/* Calm focus: the hovered row's meter glows, the others dim. Colour and opacity only, never layout. */
.tlc-table:has(.tlc-hov:hover) .tlc-hov:not(:hover) .tlc-meter { opacity: .45; }
.tlc-hov:hover .tlc-fill { filter: drop-shadow(0 0 3px var(--hue)); }

@media (prefers-reduced-motion: no-preference) {
  .tlc-anim .tlc-cur { animation: tlc-blink 1.2s steps(1, end) infinite; }
}
@keyframes tlc-blink { 50% { opacity: .3; } }
`;
