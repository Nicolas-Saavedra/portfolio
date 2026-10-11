# Request Automaton prototype: variant G (Scroll-docking)

Working notes for whoever iterates on G next. These notes don't repeat:
- **What the Request Automaton must do:** the spec (`gh issue view 1`, the "Request Automaton" section and user stories 3–7 and 20–23).
- **Why G is the baseline and what's already decided:** the prototype record, the last comment on issue #1 (`gh issue view 1 --comments`).
- **Vocabulary:** `CONTEXT.md` (Peer, Signature Piece, Request Automaton, Pillar).

The other round-1 and round-2 variants are kept at tag `prototype-round-2`; check it out if you need to see C's or D's originals.

This is throwaway prototype code on `prototype/request-automaton`. It never merges.

## Running it

- `pnpm prototype` opens `/prototype/request-automaton`.
- `?data=sample` (the default) shows the labelled example run. `?data=live` tries the reader's real request through `/cdn-cgi/trace`, which only answers behind Cloudflare.
- The harness page (`src/pages/prototype/request-automaton.astro`) globs `variants/*.ts` without recursing, keyed by the filename's first letter, so helpers must stay in `variants/g/`.
- The floating yellow switcher bar is harness UI, not part of the design.
- `pnpm astro check` must stay at 0 errors. TypeScript is pinned to 6 for that (see the tooling note in the issue's last comment).

## Architecture

| Module | Owns |
| --- | --- |
| `model.ts` (harness) | The `Run`: ordered `states` (`id`, `label`, optional `durationMs`, optional `skipped`, `log`), `meta`, `totalMs`. `EXAMPLE_RUN` and `collectRun()`. |
| `types.ts` (harness) | The `Variant` contract (`mount(root, ctx)` returns a cleanup function) and `COPY` (name, headline, intro, Pillars). |
| `variants/g-scroll-docking.ts` | The variant itself: hero and panel markup, mapping scroll to progress, staged unfolding, the frame loop and the one clock's playback, calm focus (hover/focus/pin), observers, cleanup. Also the prototype filler below the hero. |
| `variants/g/clock.ts` | The clock model, copied from round-1 C. `plan(run)` turns a run into animation timing. `reqAt(P, t)` gives request ms at animation time t. `cursor(P, t)` gives the current state index. `durText` gives the honest detail string. Also the state hues and small helpers (`hue`, `mix`, `esc`, `q`). |
| `variants/g/machine.ts` | The automaton: one SVG with two layouts (`heroLayout`, `dockLayout`). `render(p, t, act)` re-draws every state, edge, label, dwell arc and the token from a per-state blend of the two. |
| `variants/g/panel.ts` | C's instrument panel: header, stats, an empty automaton **slot** (`data-slot`) for the machine to land in, an inspect line, the trace waterfall and the log tail. `paint(t, act)` drives the waterfall and the typing logs. Each block has a `data-unfold` key. |
| `variants/g/backdrop.ts` | D's glyph field on a sticky, viewport-sized canvas, with the radial "clearings" behind the copy and the readout, and warmed glyphs near the token and the active state. |
| `variants/g/glyphs.ts`, `variants/g/flavor.ts` | Copied from round-1 D. `GlyphField` (the character grid), `TONES`, `radiusOf` (state radius from duration). Most of `flavor.ts` is now unused (sub-states, symbols, travel times). |

### Data flow

```
Run ──plan()──▶ P (enter/leave per state, request offsets, endT)
 │                │
 │   frame loop:  t = clock (performance.now − startAt, capped at P.endT)
 │                p = progress() from scroll (0 hero … 1 docked)
 │                act = hover ?? focused ?? pinned
 │                │
 ├──▶ machine.render(p, t, act)  section-space SVG overlay
 ├──▶ panel.paint(t, act)        DOM: stats, waterfall, log tail, inspect line
 ├──▶ applyUnfold(p)             opacity/translate of the panel blocks, hero readout, glyph field
 └──▶ backdrop.tick/warm/draw     canvas, viewport space (converted from section space via ox/oy)
```

- **Layout pass.** `layout()` runs on every `ResizeObserver` callback (section and field box). It:
  1. sizes the slot from `dockLayout`;
  2. computes the dock positions from the slot rect and the hero positions from the stage rect, both relative to the section;
  3. sets the SVG overlay to the section's size;
  4. recomputes `s0` and `dist` for the scroll mapping.
- **Coordinate spaces.**
  - The machine SVG is absolutely positioned at the section's (0, 0) and spans the whole section, so it lives in section space.
  - The canvas is sticky, so it lives in viewport space. `paint()` converts with `ox`/`oy` from the two bounding rects.
- **When it repaints.**
  - With motion, the loop runs while the section intersects the viewport (`seen` IntersectionObserver), plus a `scroll` listener to wake it.
  - With reduced motion there is no loop: `requestPaint()` paints synchronously on resize, interaction and colour-scheme change.

## Invariants (keep these)

1. **One clock.** Everything time-based (token, dwell arcs, edge trails, hero counter, panel total, waterfall playhead and bars, typed logs, the hero trace line) reads the same `t` and goes through `plan()`/`reqAt()`/`cursor()`. Don't give a sub-view its own timer.
   - The run starts when the stage is 35 % visible (`starter` IntersectionObserver), not on mount, so phone readers who land on the copy don't miss it.
   - Replay resets `t`.
2. **The hero layout has the docked layout's shape, so docking never crosses itself.**
   - `heroLayout(…, toRow, …)` gets `toRow = dock.row[n - 1] === 0`.
   - Docking into a single row: the hero is a zigzag with x strictly increasing state by state.
   - Docking into C's 3-column snake (panel narrower than 600 px): the hero is that same snake, scaled up.
   - Any layout whose order along x or within rows differs from the dock's will make states pass through each other mid-dock (see Gotchas).
3. **Scroll maps to progress, with the vertical hold.**
   - `progress = clamp((scrolled − s0) / dist)`, where `scrolled = −section.top`.
   - `s0 = max(0, heroMeanY − 0.5 × innerHeight)`: docking starts when the hero machine's centre reaches mid-screen.
   - `dist = dockMeanY − heroMeanY`, the section-space distance from the machine's centre to its slot's centre.
   - In `machine.render`, **y blends linearly in p** while x, radius and edge bend blend with a smoothstep of p. With y linear, the machine's on-screen y is constant through the dock (`heroY − s0`): it holds still while the copy scrolls away and the panel rises to meet it. No `position: sticky`, no scroll-jacking.
   - If you ease y, the machine drifts on screen and the slot no longer meets it exactly at p = 1.
4. **Staged unfolding.** Thresholds are `smooth(a, b, p)` ranges; the array is `stages` in `g-scroll-docking.ts:139`.

   | Block | Fades in over p | Lift | Why |
   | --- | --- | --- | --- |
   | panel frame | 0.30 → 0.80 | 0 | the frame materialises around the arriving machine |
   | header | 0.84 → 1 | 0 | header, stats and label pass *beneath* the holding machine on their way up; any earlier and their text overlaps the machine's labels |
   | stats | 0.87 → 1 | 0 | same |
   | "automaton" label | 0.94 → 1 | 0 | sits directly above the slot, so it crosses last |
   | inspect line | 0.90 → 1 | 0 | |
   | trace | 0.72 → 1 | 28 px | below the slot and never crosses, so it can rise early |
   | logs | 0.80 → 1 | 28 px | |
   | hero readout (out) | 1 → 0 over 0 → 0.30 | | |
   | glyph field opacity | 1 → 0.28 over 0.15 → 1 | | faint texture behind the docked panel |

   Unfolding only touches `opacity`, `transform` and `visibility`, never layout, so it can't move the scroll positions it's driven by.
5. **The machine is one SVG.** Hover, focus and pin state, the token and the dwell arcs carry through the dock. At p = 1 the machine is C's automaton row, pixel for pixel: `dockLayout` is C's `buildSvg` placement.
6. **Reduced motion.** `docked = reducedMotion`: no stage, no readout, p fixed at 1, `t = P.endT`, no loop, no replay, a static glyph field.
7. **Honesty details** (from C, required by the issue's round-2 rules):
   - a visible example-run label, in the hero readout and the panel header;
   - Edge shows the colo, not a time;
   - "skipped", never 0 ms;
   - "no data" when a state has no timing.

   All of these come from `durText()`.

## Tuned numbers and why

### Clock (`g/clock.ts`, from C)
- `LEAD 500` ms on the start arrow, `MOVE 300` per edge.
- Dwell per state is `BASE 380` + a share of `SPREAD 2600` proportional to its duration, so slow phases visibly take longer.
- `SETTLE 400` lets the counter catch up to `totalMs` when the phases don't cover it.
- `CHAR_MS 12` is the log typing speed.
- The example run lasts about 7 s.

### Docked layout (`dockLayout`, C's numbers)
- One row if the slot is at least 600 px wide; otherwise 3 columns.
- `r` is 22 (row) or 19 (snake). `rowH 108`, left/right padding 44/20 (row) or 36/36 (snake), span capped at 220, first row at `R + 14`.
- Slot height = `y0 + (rows − 1) × 108 + r + 44`, which leaves room for the label and detail lines.

### Hero layout (`heroLayout`)
- **Zigzag** (when docking into a row):
  - Side padding `min(90, 12 % of width)`.
  - Step `min(190, …)`.
  - Amplitude `min(95, 20 % of stage height, 0.9 × step)`. Same-row neighbours sit 2 × step apart, so labels never collide.
- **Snake** (phones): span capped at 150, row height capped at 190, a ±10 px wave.
- **Radii:** D's `radiusOf` (duration-sized) × 0.9 on phones, × 1.05 by default, × 1.25 at 1200 px and wider. Minimum 16. Capped at 0.42 × step (zigzag) or 0.3 × span (snake) so big states never touch.

### Blending (`machine.render`)
- Edge bend: D's `−min(34, len × 0.14)` in the hero, 0 when docked. Turns between rows bulge 34 px outwards in both layouts.
- Start arrow length goes from 64 to 34, but it's clamped to keep 6 px from the left edge (minimum 18). At 360 px the hero arrow otherwise started off-screen.
- Label 14 → 12.5 px, weight 600 in the hero. Label offset `r + 22 → 21`; detail offset `r + 39 → 36`.
- The halo and fill base is `color-mix(surface p %, bg)`, so text halos and empty states match the glyph field in the hero and the panel when docked.
- The pending edge colour goes from `--faint` to `--border` for the same reason.
- The hit circle is `r + 16`, shifted 14 px down so the label is part of the target.

### Calm focus
- The active state gets a hue glow at 0.16 opacity and `r + 9`, plus a 1.06 scale-up. Other states and edges dim to 0.45 (C used 0.3; 0.45 is calmer).
- Matching waterfall and log rows dim the others to 0.4 and tint the active one at 12 %.
- The glyph field warms a ring from `r + 8` to `r + 46` at heat 0.42, fading outwards.
- That's the ceiling: the round-2 rules forbid anything louder.

### Backdrop (`g/backdrop.ts`)
- Ink alpha is 0.55 (dark) or 0.7 (light); warm glyphs draw at 0.75 or 0.85.
- The field drifts 6 px/s and mutates 2 cells per frame.
- The token warms the cell under it at heat 0.9, only while `p < 0.7`.
- `devicePixelRatio` is capped at 2, and the canvas at 5.2 M device pixels.
- Clearing gradient stops are 0.94 and 0.86 of the background colour. The copy's clearing grows 1.45×; the readout's grows 1.3× and fades with it.
- The copy also has D's `text-shadow` halo (`HALO`). Together these keep real contrast over the field in both colour schemes; don't drop either without re-checking light mode.

### Layout breakpoints
- Below 640 px counts as narrow (phone radii; stage min-height `ceil(n/3) × 180 + 60` px).
- The split hero (copy left, machine right) starts at `xl` (1280 px), because a six-state zigzag needs about 600 px. Below that the hero stacks: copy, readout, machine.
- Desktop stage min-height is 26 rem.

### Waterfall (`g/panel.ts`)
- `niceTicks(D, 6)` replaces `d3-scale` (1, 2 or 5 × 10ⁿ steps). Keeping `d3-scale` out keeps the bundle at about 12.5 KB gzipped.
- A span's duration label goes *before* the bar only when the bar ends past 78 % of the axis **and** starts after 22 %. Otherwise, on phones, the label landed on the row name. C still has that bug.

## Gotchas

- **Snake versus zigzag crossing.** The first G used D's two-row snake in the hero (row 2 runs right to left) and docked into C's single row. Mid-dock, q₅ had to travel from the far left to the far right through q₄ and q₃, and the states visibly overlapped. Fix: invariant 2. If you change either layout, scrub the dock at about p = 0.35 and look for overlapping states.
- **Things passing under the holding machine.** Because of the vertical hold, anything in the hero *below* the machine, and anything in the panel *above* the slot, slides beneath the machine during the dock.
  - That's why the readout sits *above* the stage (it used to be below, and overlapped the machine on phones).
  - It's also why the header, stats and label fade in late (invariant 4).
  - Adding content below the stage or above the slot brings this back.
- **The sticky field outlived the section.** The field box is `sticky top-0 h-[100svh] -mb-[100svh]` so it takes no space. Because of the negative margin, it kept sticking for a further 100svh past the section's end, painting glyphs behind the filler. The section needs `overflow-clip` (`clip`, not `hidden`, so it doesn't become a scroll container and break `sticky`).
- **Stale Tailwind CSS in the dev server.** Tailwind v4 (via `@tailwindcss/vite`) generates utilities by scanning source files for class names. A class that appears for the first time in a `.ts` template string, especially an arbitrary value like `-mb-[100svh]`, `min-h-[100svh]` or `xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]`, may not be in the served CSS until the dev server picks it up. The element then renders unstyled even though the markup is right.
  - Before debugging layout, confirm the rule exists, for example with `getComputedStyle` on the element.
  - If it doesn't, restart the dev server (or touch `src/styles/global.css`) and hard-reload.
  - Always write complete class names as literals; never build them by concatenation (`bg-${x}`), which the scanner can't see. For per-state colours use `var(--…)` in inline styles, as the panel does.
  - Separately, Vite sometimes logs `504 (Outdated Optimize Dep)` after files change; a reload clears it.
- **Headless screenshots don't advance `requestAnimationFrame`.** `chromium --headless --screenshot` with a virtual time budget captures the first frame, so the run looks stuck at `t = 0`. Use Playwright: no project dependency, but `playwright-core` exists in the npx cache (`find ~/.npm/_npx -name playwright-core`), driving `/usr/bin/chromium`. Remove `[data-prototype-switcher]` before screenshots.
- **Measuring the bundle.** There's no esbuild; Astro 7 runs Vite 8 on rolldown. To check the size, bundle `variants/g-scroll-docking.ts` with `rolldown` from `node_modules/.pnpm/rolldown@*/…/dist/index.mjs` (`generate({ format: "esm", minify: true })`) and gzip the output. Don't run `astro build` for this.
- **Hover isn't tracked for touch.** `pointerenter`/`pointerleave` only count `pointerType === "mouse"`; touch uses click-to-pin. A click outside any `[data-g-i]` element clears the pin, and so does Escape.

## Known issues

1. **Hover feedback loop ("the page vibrates").** Reported by Nicolas: hovering around Lookup and the trace, the log line appears and pushes the layout down. The pointer then leaves the target, the hover clears, the layout shrinks back, the target slides back under the pointer, it re-hovers, and the cycle repeats.

   **Likely mechanism** (from reading the code; not yet reproduced, so confirm first):
   - Both inspect lines sit *above* their hover targets and only reserve a minimum height.
     - The hero's `[data-hero-inspect]` (`g-scroll-docking.ts:92`, `min-h-10`) is in the readout, above the stage.
     - The panel's `[data-inspect]` (`g/panel.ts:78`, `min-h-10`) is above the trace waterfall.
   - `inspectLine()` renders two lines: `q₀ Lookup · 14 ms`, then the log. `min-h-10` (40 px) fits exactly two 20 px lines, so any wrap grows it. Lookup's log (`[dns] resolved nicolassaavedra.com in 14 ms`) and Secure's are long enough to wrap on narrow widths. The idle hint is also two lines on phones.
   - **Panel:** the trace rows move down, and the hovered row leaves the pointer.
   - **Hero:** the stage moves down, the `ResizeObserver` fires `layout()`, and the hero positions are recomputed from the new stage rect. q₀ moves off the pointer, and `s0`/`dist` shift as well.

   **Fix directions:**
   - Give both inspect lines a fixed height that fits the longest log at the narrowest width (or clamp lines), or position them absolutely so they never reflow.
   - Or move them below their targets.
   - A small hover-leave delay would mask the loop but doesn't fix it.
   - After fixing, test at 360, 768 and 1440 px by hovering q₀ and the first waterfall rows.
2. **The machine floats over a bare frame mid-dock.** From about p = 0.4 to 0.85 the machine is over the panel's empty frame before the header and stats appear. It's readable but a little empty. One idea: move the stats row below the automaton.
3. **1024–1280 px stacks the hero**, leaving the copy alone on the left over empty glyph field. A tighter zigzag or a narrower copy column could bring the split layout down to 1024 px.
4. **A fast flick skips the morph.** Progress is a pure function of scroll position, so one large scroll can jump from hero to docked in a frame. Nothing breaks, but the dock is never seen. On tall phones docking only starts once the machine reaches mid-screen, so this is most noticeable there.
5. **Per-frame cost while visible.** The glyph field redraws and mutates every frame while the section is on screen (paused offscreen), and the panel's waterfall and log DOM is painted every frame during the run, even when folded away. `panel.paint` skips unchanged `(t, act)` pairs, but nothing skips when its unfold opacity is 0. Measure on a low-end phone. Options: freeze the drift once docked, and skip panel painting while it's invisible.
6. **Unused copied code.** `flavor.ts` still carries D's sub-states, transition symbols and travel times. Trim before measuring the final budget.
