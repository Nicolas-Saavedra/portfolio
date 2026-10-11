// PROTOTYPE: throwaway. Variant A's grid geometry, as a scoped style block. Placement comes from custom
// properties set inline by the renderer (rows are years), so the same markup lays out three ways:
//   < 768   one column, the year gutter on the left (sticky inside its rows), entries in reading order
//   ≥ 768   Engineering | year spine | Teaching, one row per year; Education below
//   ≥ 1024  the same, plus Education as a fourth lane whose rule spans every year it ran
// Hover and focus only change colours (never layout), per the calm-focus rule.

export const BASE = `
.tla-grid { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); column-gap: 1rem; }
.tla-head { display: none; }
.tla-line { grid-column: 1 / -1; grid-row: var(--ml); border-top: 1px dashed var(--border); pointer-events: none; }
.tla-line[data-mobile-empty] { display: none; }
.tla-year { grid-column: 1; grid-row: var(--m1) / var(--m2); align-self: start; position: sticky; top: 1rem;
  padding-top: 1rem; transition: color .15s ease; }
.tla-year[data-mobile-empty] { display: none; }
.tla-entry { grid-column: 2; grid-row: var(--m); position: relative; padding: 1rem 0 1.75rem 1rem; }
.tla-entry::before { content: ""; position: absolute; left: 0; top: 1.45rem; bottom: 1.25rem; width: 1px;
  background: var(--border); transition: background-color .15s ease; }
.tla-entry::after { content: ""; position: absolute; left: -3px; top: 1.2rem; width: 7px; height: 7px; border-radius: 9999px;
  background: var(--bg); box-shadow: inset 0 0 0 1px var(--faint); }
.tla-entry[data-present]::before { background: var(--green); }
.tla-entry[data-present]::after { background: var(--green); box-shadow: 0 0 0 3px color-mix(in oklab, var(--green) 22%, transparent); }
.tla-entry:is(:hover, :focus-within)::before { background: var(--muted); }
.tla-entry[data-present]:is(:hover, :focus-within)::before { background: var(--green); }
.tla-entry:is(:hover, :focus-within) .tla-title { color: var(--lavender); }
.tla-title { transition: color .15s ease; }
.tla-edu { grid-column: 1 / -1; grid-row: var(--me); margin-top: 1rem; padding-top: 1.25rem; border-top: 1px solid var(--border); }
.tla-edu-head { display: none; }

@media (min-width: 768px) {
  .tla-grid { grid-template-columns: minmax(0, 1.15fr) 5.5rem minmax(0, 1fr); column-gap: 0; }
  .tla-head { display: block; grid-row: 1; padding-bottom: .75rem; }
  .tla-head[data-track="engineering"] { grid-column: 1; padding-right: 2rem; }
  .tla-head[data-track="teaching"] { grid-column: 3; padding-left: 2rem; }
  .tla-line { grid-column: 1 / 4; grid-row: var(--r); }
  .tla-line[data-mobile-empty] { display: block; }
  .tla-year { grid-column: 2; grid-row: var(--r); position: static; text-align: center; padding-top: .95rem; }
  .tla-year[data-mobile-empty] { display: block; }
  .tla-entry { grid-row: var(--r1) / var(--r2); padding: 1rem 2rem 2.25rem 0; }
  .tla-entry[data-track="engineering"] { grid-column: 1; }
  .tla-entry[data-track="teaching"] { grid-column: 3; padding: 1rem 0 2.25rem 2rem; }
  /* The span rules hug the spine from both sides, so two roles running at once read as a pair. */
  .tla-entry[data-track="engineering"]::before { left: auto; right: 0; }
  .tla-entry[data-track="engineering"]::after { left: auto; right: -3px; }
  .tla-edu { grid-row: var(--re); margin-top: 1.5rem; }
}
@media (min-width: 768px) and (max-width: 1023.98px) {
  .tla-line[data-edu-only], .tla-year[data-edu-only] { display: none; }
}

@media (min-width: 1024px) {
  .tla-grid { grid-template-columns: minmax(0, 1.15fr) 5.5rem minmax(0, 1fr) 13rem; }
  .tla-edu-head { display: block; grid-column: 4; grid-row: 1; padding: 0 0 .75rem 2.5rem; }
  .tla-edu { grid-column: 4; grid-row: 2 / var(--re); margin: 0 0 1.25rem 0; padding: 1rem 0 0 2.5rem; border-top: 0; position: relative; }
  .tla-edu::before { content: ""; position: absolute; left: 1.25rem; top: 1.45rem; bottom: 0; width: 1px; background: var(--border); }
  .tla-edu::after { content: ""; position: absolute; left: calc(1.25rem - 3px); top: 1.2rem; width: 7px; height: 7px;
    border-radius: 9999px; background: var(--bg); box-shadow: inset 0 0 0 1px var(--faint); }
  .tla-edu-label { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .tla-year, .tla-entry::before, .tla-title { transition: none; }
}
`;
