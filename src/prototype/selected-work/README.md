# Selected Work prototype: variant H (Split readout)

Working notes for whoever iterates on H next. These notes don't repeat:
- **What Selected Work must do:** the spec (`gh issue view 1 -R Nicolas-Saavedra/portfolio`, user stories 8–16, "Content model", "Out of Scope").
- **Vocabulary:** `CONTEXT.md` (Peer, Case Study, Selected Work, Open to Work, Signature Piece, Request Automaton).
- **Why there is no JS island here:** `docs/adr/0002-*.md`.
- **The hero above this section:** `src/prototype/request-automaton/README.md`.

This is throwaway prototype code on `prototype/selected-work`. It never merges.

## How H came about

Each round's variants are kept at a tag; check one out to see an original.

| Round | Variants | Nicolas's verdict | Tag |
| --- | --- | --- | --- |
| 1 | A ruled index, B figure cards, C career automaton, D deck | "Iterate over C, steal B's graphs, numbers should make sense. 1 INFRA ENGINEER in blinka is no real value. It should still remain in decent height." | `prototype-selected-work-round-1` |
| 2 | E (B's figure inside C's readout), F (figure on the rail side, horizontal rail on phones) | "Combine them; E for the desktop view, shifting to F on the mobile view." | `prototype-selected-work-round-3` (also has B, C) |
| 3 | H | Approved as the baseline. | this branch |
| h1 | H, first iteration: facts under the caption, more room at 1024, motion gated on view, GOLD's states labelled | | this branch |

Decided by Nicolas after round 3:
- **Reading order on phones stays.** The figure comes after the text body in the DOM (a screen reader reaches the caption after the trace) but is drawn above the panel on phones. He's fine with that; keep it.
- **GOLD's DFA states carry labels,** but never the period, which the rail and the panel header already print.

Taste rules that came out of the hero's rounds and still apply: daring in staging, calm in interaction. That means no popups or tooltips over content, no layout that depends on hover or focus, and no portfolio slop (gradients, glass, skill bars, percentages).

## Running it

- **Start:** `pnpm prototype:selected-work` serves on port 4322 and opens `/prototype/selected-work`.
- **Page:** the route (`src/pages/prototype/selected-work.astro`) is a stub of the home page. It has the real Request Automaton hero (variant G) on top, then `#variant-root` (this section), then a stub Timeline and a stub contact section.
- **Query parameters:**
  - `?variant=H` picks the variant. It's the only one left, so it's also the default. The route globs `variants/*.ts` without recursing, keyed by the filename's first letter, so helpers must stay in `variants/h/`.
  - `?otw=1` turns Open to Work on: the Timeline stub and its CV link move between the hero and Selected Work.
  - `?hero=off` skips the hero for quick iteration. Judge final work with the hero on, and look at the seam.
- **Switcher:** the floating yellow bar is harness UI, not part of the design. Its ← → keys skip events from inputs, so arrow keys on the rail's radios don't switch variants.
- **Type check:** `pnpm astro check` must end at 0 errors and 0 warnings.

## Architecture

| Module | Owns |
| --- | --- |
| `content.ts` (shared) | The four `CaseStudy` records: copy, `facts` (value + label), `technologies`, `links`, `draft`. Every fact shown comes from here. |
| `types.ts` (shared) | The `Variant` contract: `mount(root, ctx)` returns a cleanup function. |
| `switcher.ts` (harness) | The floating bar. |
| `variants/h-split-readout.ts` | The whole section: markup (`stateRow`, `caseStudy`), all CSS (`css()`, one `<style>` block), and `mount`. `mount` attaches no listeners; cleanup is `section.remove()`. |
| `variants/h/diagrams.ts` | `FIGURES[slug] = { draw, caption }`: one static SVG string per Case Study, about 300 px wide, with a single layout each. It's F's compact set, adapted from round-1 B. `pw()` sizes mono pills, and `fact(c, word)` finds a fact by a word in its label. |

### The `display: contents` grid

The core trick, so read this before moving anything.

```
section#sw-h
└─ .sw-h-grid                       the layout grid
   ├─ .sw-h-col                      rail (radios + labels) and legend
   └─ .sw-h-frame                    contents on phones; a grid from BP
      ├─ .sw-h-bg                    draws the panel frame from BP (display:none on phones)
      └─ .sw-h-stack                 always contents
         └─ article.sw-h-cs ×4       always contents; data-cs="i", --hue
            ├─ .sw-h-body            text: framed flex column on phones; contents from BP
            │  ├─ .sw-h-head  .sw-h-titles  .sw-h-trace  .sw-h-facts  .sw-h-foot
            └─ figure.sw-h-fig       plate (SVG) + figcaption
```

- **One render per Case Study.** Each Case Study's figure and text exist once in the DOM. Because the wrappers are `display: contents`, those parts become items of whichever grid is active, and CSS alone moves the figure between two places.
- **Every Case Study's parts are placed in the same cells.** The hidden ones are `visibility: hidden`, so each cell's size is the maximum over all four Case Studies. That is the reservation; there's no measured or hard-coded height anywhere.
- **Below `BP` (F's layout).** `.sw-h-grid` has rows `[rail] [fig] [panel]`:
  - the four figures overlap in `fig`;
  - the four `.sw-h-body` columns overlap in `panel`.

  The tallest body sets the slot, and in shorter ones the slack collects above the footer (`margin-top: auto`).
- **From `BP` (E's layout).** `.sw-h-grid` is `[15rem rail | panel]`, and `.sw-h-frame` becomes its own grid:

  ```
  columns: pad | trace 1fr | 1.75rem | evidence 19rem | pad
  rows:    head / titles / main / facts / slack (1fr) / foot / end pad
  ```

  `.sw-h-body` turns into `display: contents`, so header, titles, trace, facts and footer are cells of the frame. The trace spans `main/foot` (main, facts and slack) on the left; the figure sits in `main`, with the facts under it, on the right. `.sw-h-bg` spans every cell and draws the border, since the frame itself has no box worth styling.
- **The slack row.** `slack` is the only flexible row the trace spans, and grid sizing leaves items that span a flexible track out of the auto rows. So `main` is exactly as tall as the tallest figure, `facts` as the tallest facts, and the trace's excess lands in `slack`, below the facts. Before h1 there was no `slack` (`foot` was the `1fr` row): the trace's excess was split over `main` and `facts`, which pushed the facts 20–40 px below the caption at 1440 and about 90 px at 1024. Don't give `main` or `facts` an `fr` size, and keep the trace's span ending at `foot`.
- **Selection.** Selection is pure CSS. Each state gets one rule group from `css()`: `#sw-h:has(#sw-h-rN:checked) .sw-h-cs[data-cs="N"]` sets `visibility: visible`, sets opacity 1 on its parts, and sets `--sel` (the frame tint). The motion rules (trace steps, draw-in, fades, comet) hang off the same selector, so they re-run whenever a state is selected.
- **The view gate.** q₀ is checked on load, so without a gate its motion would run while the section is still below the fold. `.sw-h-grid` runs `sw-h-gate` on a `view()` timeline (`animation-range: entry 0px entry 200px`), which flips the registered property `--sw-h-play` from `paused` to `running` once the grid's top is about 100 px into view. `@container style(--sw-h-play: paused)` then sets `animation-play-state: paused !important` on everything inside the grid, so q₀'s animations wait at their first frame (backwards fill: steps and lines hidden) until the grid shows. Once they've finished, scrolling away and back doesn't replay them; any later selection happens in view and runs at once.

## Invariants (keep these)

1. **Reserved slots, no reflow.** Switching states must not change the section's height or move anything outside the panel.
   - Reveal only with `visibility`/`opacity`/`transform`.
   - Never `display: none` a Case Study.
   - Never give one Case Study a part the others lack in a way that moves the shared rows.
   - Check by clicking all four states at each width and comparing `#variant-root` heights; they must be identical.
2. **CSS only (ADR 0002).**
   - No listeners, observers or timers.
   - Production would be a static Astro component: the same markup, with `css()` as a static stylesheet. The per-state rules are generated only because the prototype mounts from TS.
   - The `@supports not selector(:has(*))` block is the fallback: every Case Study in normal flow, each body framed and followed by its figure. Keep it working.
3. **One render per Case Study.** Don't duplicate a figure (or anything else) to get a different placement per breakpoint; place the single element with grid instead.
4. **No number printed twice in one view.** Counts live only in `facts`.
   - The trace copy in `content.ts` no longer repeats them.
   - The figures don't print them: Blinka's PR counts were removed from its figure; NoEstasSolx's figure says "students" and "services" and only *draws* the 20+ service nodes; GOLD's states carry the library names and roles instead of the years.
   - On desktop the panel header hides the period, because the rail shows it under each name.
   - Any number a figure does draw must come from `facts` via `fact()`, never be typed in.
5. **One breakpoint, `BP = 1024`, and no blend between layouts.** Everything that differs between the layouts sits in `@media (min-width: BP)`.
   - Below 1024, E's layout breaks. At 768 the trace column shrinks to about 70 px next to the 19 rem evidence column, and the section grows to about 2,700 px (round-3 measurement).
   - At 1024, E's layout keeps the whole readout on one 900 px screen. F's layout at 1024 is about 1,110 px, with trace lines of about 110 characters.
   - To compare again, change `BP` temporarily and re-measure both widths.
   - The fluid sizes between 1024 and 1152 (see "Layout" below) are `clamp()`s, not a second breakpoint: the layout is the same, only the rail, gap and trace text are a little smaller.
6. **Height budgets.** Measured on `#variant-root` with the hero off, in headless Chromium (overlay scrollbars). Budgets are fixed; the H column is as of h1 (`f0876ac` in brackets where it differs).

   | Width | Budget | H now | Set by |
   | --- | --- | --- | --- |
   | 1440 × 900 | ≤ 815, and the selected readout, figure included, fully on one screen | 815 (panel top 152, height 583) | the trace (Blinka, GOLD and NoEstasSolx tie at 347) |
   | 1024 | none set; keep the readout on one 900 px screen with margin | 873 (panel top 152, height 641, bottom at 793) [931, bottom at 851] | NoEstasSolx's trace |
   | 768 | none set | 1,133 (panel top 514, height 540) | Blinka's body (540) and the figure slot (256, NoEstasSolx and Teaching) |
   | 360 | ≤ 1,567, and the panel top ≤ 572 (where it sits in F, so a tapped readout isn't pushed further below the fold) | 1,407 (panel top 524, height 819) | GOLD → mercury's body (two-line title, two links) |

   If something doesn't fit, cut or tighten (smaller text, a shorter figure, fewer lines) rather than letting the section grow, and say what was cut.
7. **Accessibility basics.**
   - `role="radiogroup"` with real radios: arrow keys switch states, and Tab goes from the checked radio to the visible Case Study's links.
   - Hidden Case Studies are `visibility: hidden`, so they're out of the tab order and the accessibility tree.
   - Figures are `aria-hidden`; the `figcaption` carries the meaning.
   - Each "Read the Case Study" link has an `sr-only` title.
   - Every Case Study links its `href` with a real `<a>`.
8. **Reduced motion.** `prefers-reduced-motion: reduce` kills every animation and transition in `#sw-h`, and all motion rules sit inside `@media (prefers-reduced-motion: no-preference)`. The final state must be complete without them: lines whole (no dash pattern is applied outside the motion rules) and the comet invisible. The view gate sits inside the same media query; under reduced motion there's nothing to gate.

## Tuned numbers and why

### Layout
- **Rail column 15 rem, evidence column 19 rem, gutter 1.75 rem (desktop).** The rail was 17 rem in C, and was narrowed to give the panel width. 19 rem lets the about-300 px figures render at about 1:1, so SVG labels stay about 11 px; at E's original 17 rem they shrank to about 9 px.
- **Fluid from 1024 to 1152 px (h1).** Above 1152 the content width is capped by `max-w-6xl`, so everything there is as at 1440. Between 1024 and 1152 three sizes ramp linearly with `clamp()`, to widen the trace column (300 → 328 px at 1024) and shorten the readout:
  - rail column 13.75 → 15 rem (`clamp(13.75rem, 15.625vw + 3.75rem, 15rem)`). The minimum is what Blinka's "Jan 2026 – now · draft" needs on the rail without an ellipsis; 12.5 rem truncated the "draft";
  - rail-to-panel gap 2 → 2.5 rem;
  - trace text 14 → 14.5 px (line height stays 1.6).

  Section heights: 873 at 1024, 854 at 1060, 835 at 1100, 815 from 1152.
  Not used: a narrower evidence column (shrinks figure labels below 11 px) and a narrower gutter (no measurable gain).
- **`--pad` is 1 rem, and 1.5 rem from 640 px.** It's the panel's inner padding in both layouts, and the header's horizontal padding.
- **Figure and trace both start 1.125 rem below the titles (desktop),** so their top edges align.
- **Type:**
  - Trace text is 14 px / 1.55 on phones and 14.5 px / 1.6 on desktop (14 px at 1024; see above).
  - The title is 1.375 rem on phones and 1.5 rem on desktop.
  - Facts are mono `text-lg`, with the label underneath in `text-xs`.
  - Phones went down from F's 15 px to fit the 360 budget.
- **Section padding:** `py-16 sm:py-20`, tighter than round 1's `py-20/24`, for the 1440 budget.
- **Draft mark:** below 640 px it's plain peach mono on its own line in the header; from 640 px it's an inline dashed badge.

### Rail
- **Node and labels:** the node is 2.5 rem. On phones the label is a column (node over name, 12.5 px names, periods hidden); on desktop the label is a `2.75rem | text` row.
- **Edges and start arrow** are absolutely positioned from the node size and the label padding (`.4rem` on phones). Change either and the `calc()`s in the rail block need updating.
- **Desktop height:** items are `flex: 1`, so the rail stretches to the panel's height.
- **Calm focus, copied from the hero:**
  - hover gives a 6 px glow at 14 % of the hue;
  - the selected state gets 7 px at 16 %, a hue-tinted fill, and scale 1.06;
  - keyboard focus gets a lavender outline around the whole label.
- **Hues by order:** peach, mauve, green, sky (`HUES`). The colours carry no meaning.
- **Notation:** a double ring means the period is still running (`end: "present"`); a dashed ring means a draft. The legend under the rail explains this on desktop; it's screen-reader-only on phones.

### Motion (on select)
- **Trace steps:** fade up over 0.42 s, staggered 110 ms. The trace's rail draws in 0.5 s.
- **Figure lines:** draw in 0.8 s (`pathLength="1"`, `stroke-dasharray: 1`).
- **Nodes:** fade 0.45 s. Service squares and stair corners fade one by one, 45 ms apart after 0.35 s. GOLD's accept state fills at 1.9 s.
- **Comet:** runs once over 1.3 s after 0.7 s. Each comet's own offset is `--d`; Blinka's pipeline comet starts 500 ms after the request comet.
- **View gate:** q₀'s first run waits until the grid's top is 100 px into view (half of the `entry 0px entry 200px` range, where the discrete property flips). On desktop that's the panel header and title; the trace (131 px into the panel) fades up as it scrolls in. On phones the rail is in view and the figure is about to enter. A later flip would show an empty panel for a moment; an earlier one runs the trace before it's visible.

### Figures
- **Viewport widths are 272–318.** `svg()` caps the rendered width at 1.15 × the viewBox width, so figures don't balloon on wide plates.
- **`pw()` assumes 6.6 px per glyph** for 11 px mono. If the mono font changes, the pills misfit.
- **Lines** are a 60 % hue / `--faint` mix; plate borders a 28 % hue / `--border` mix; the frame border a 30 % mix of `--sel`.
- **GOLD's states (h1).** Each state holds its library's short name, split from `short` ("GOLD → mercury"), and has the role it was built in under it, split from `role` on ", then " ("research assistant", "thesis author"). The edge says "rebuilt" (it said "thesis rebuild" before; "thesis" is now under q₁). States are r = 34 (were 28), so "mercury" fits inside the accept state's inner ring (r = 29); the loops and edge meet the circles at (±16, −30) and (±30, −16). The viewBox stays 272 × 164, so the figure's height is unchanged. Labels render at 11.7 px at 1024 and 1440, 12.7 px at 768 and 12.4 px at 360. If `short` or `role` change shape, the labels fall back to "GOLD"/"mercury" and empty roles.

## Gotchas

- **Never animate `fill` between `color-mix()` values.** F found that Chromium rendered bright green and red mid-animation. H animates only `opacity` on figure nodes; the hue-mixed fills (`.svc`, `.step`, `.accept + .inner`) are static. The same goes for `stroke` and `background` built from `color-mix()`.
- **`opacity` does nothing on a `display: contents` element** (it has no box), but `visibility` is inherited.
  - That's why the selection rules set `visibility` on the article and `opacity` on `.sw-h-fig`, `.sw-h-body` and `.sw-h-body > *`.
  - If you add a part directly under the article, add it to that `:is()` list too, or it stays at opacity 0.
- **Stale Tailwind classes in the dev server.**
  - Tailwind v4 scans source for class names. A class used for the first time in a `.ts` template string, especially an arbitrary value like `text-[11px]` or `lg:grid-cols-[…]`, may not be in the served CSS yet, and the element renders unstyled.
  - Check with `getComputedStyle` before debugging layout. If the rule is missing, `touch src/styles/global.css` and hard-reload.
  - Write complete class names as literals. H keeps most of its styling in its own `<style>` block partly for this reason.
- **Measuring heights.**
  - Grid items stretch to their row, so a part's `getBoundingClientRect()` gives the row height, not its own. To see which Case Study sets a slot, inject `#sw-h .sw-h-body > *, #sw-h .sw-h-fig, #sw-h .sw-h-body { align-self: start !important }` and measure.
  - Clones appended outside `#sw-h` lose every scoped style, so don't measure clones.
  - The visible frame is `.sw-h-bg` from BP and `.sw-h-body` below it.
- **Testing the no-`:has()` fallback.** In the browser, rewrite the `<style>` text, replacing `selector(:has(*))` with an unknown selector such as `selector(:nope-x)` in both `@supports` conditions. That flips both blocks.
- **Screenshots.**
  - Wait about 2.6 s after selecting a state, or you capture the draw and comet mid-flight.
  - Use Playwright with `/usr/bin/chromium`. `playwright-core` is in the npx cache: `find ~/.npm/_npx -name playwright-core`.
  - Remove `[data-prototype-switcher]` first.
  - Set theme and motion with `page.emulateMedia({ colorScheme, reducedMotion })`.
- **Figures depend on fact labels.** `fact(c, "services")` finds NoEstasSolx's service count by a word in the label. If you rename the label in `content.ts`, the fan silently falls back to 20 nodes. Blinka's figure picks its pill names from `technologies` by substring, so `"AWS Lambda"` becomes `Lambda`.
- **Long labels on the phone rail.** "GOLD → mercury" wraps under its node. Four states fit; a fifth Case Study would need smaller labels or a different phone rail.
- **Animated custom properties can't drive `animation-*` through `var()`.** A property set by `@keyframes` is animation-tainted, so `animation-play-state: var(--sw-h-play)` silently computes to `running`. That's why the gate uses a style query instead. Check with `getComputedStyle(el).animationPlayState`, not with the property's value.
- **Never put the gate's pause rule on `.sw-h-grid` itself.** It carries the `sw-h-gate` animation; pausing it would freeze the timeline at `paused` forever. The rule targets `.sw-h-grid *` only.
- **Testing the gate.** Load with the hero on (the section starts about 1,600–2,600 px down), then read `getAnimations({ subtree: true })` on `.sw-h-cs[data-cs="0"]`: all `paused` at `currentTime` 0 before the grid is in view, `running` once its top is about 100 px in. With `?hero=off` the grid is in view on load, so motion runs at once. A screenshot taken without scrolling the section into view shows q₀'s readout half-empty (steps and lines at their first frame); scroll first, then wait about 2.6 s.

## Known issues

Fixed or decided in h1 (numbers as before h1): 1 (air above the facts), 2 (1024 tight), 4 (reading order on phones, decided), 5 (motion on load), 6 (empty DFA states). What's left of them is folded into the list below.

1. **A little air above the facts on desktop remains.** The facts now sit right under the tallest figure (NoEstasSolx/Blinka 223 px, GOLD 234, Teaching 233 at 1440), so the gap from caption to facts is 16 px for GOLD and Teaching and 27 px for Blinka and NoEstasSolx (was 37–48 at 1440, 95–106 at 1024). The 11 px difference is the figures' own heights; equalising them would mean resizing figures. Per-row reservation still costs a little: the sum of each row's maximum is at least the tallest single Case Study.
2. **1024 has about 100 px of margin, not more.** 873 px, panel bottom at 793 on a 900 px screen (107 px to spare, was 49). Measured with overlay scrollbars: with a classic 15 px scrollbar the content is 15 px narrower at the same `vw`, so expect a few px more. NoEstasSolx's trace still sets the row; re-measure 1024 whenever copy changes.
3. **The view gate needs scroll-driven animations and style queries.** Tested only in Chromium 153, which has both. In a browser missing either one, the gate does nothing and q₀'s motion runs on load as before h1. Nothing is ever left hidden: without the timeline `--sw-h-play` stays at its initial `running`, and without style queries the pause rule never applies.
4. **Accessibility of `display: contents`.** The article's role and its `aria-labelledby` name rely on the browser keeping semantics for `display: contents` elements. Current Chromium, Firefox and Safari do; older Safari dropped them. Do a real screen-reader pass, which nobody has done yet.
5. **The radiogroup pattern** is announced as "radio, 1 of 4" rather than as tabs. That's acceptable, but worth hearing in a screen reader.
