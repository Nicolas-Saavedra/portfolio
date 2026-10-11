# Timeline prototype: variant D ("git log --graph")

Working notes for whoever iterates on D next. These notes don't repeat:
- **What the Timeline must do:** the spec (`gh issue view 1`).
  - User stories 25–28 (scannable, two Tracks, distinct Uniandes roles, Education beside the Tracks), 34 (Open to Work) and 38–39 (content upkeep).
  - The "Timeline entries" content model and the "Home" layout.
- **The round-1 brief** (hard parts 1–9, Nicolas's taste table, calm-focus rule, file ownership, screenshot tool) is in the manager's scratchpad: `/tmp/claude-1000/-home-tweep-Programming-offline-profile-JS-portfolio-timeline/e41dcf9f-bd5a-4755-bba2-685a64105acc/scratchpad/brief-round-1.md`. It's ephemeral; if it's gone, the hard parts are restated briefly under Invariants.
- **Vocabulary:** `CONTEXT.md` (Timeline, Track, Recruiter, Peer, Open to Work, Case Study, CV).
- **The hero above:** `src/prototype/request-automaton/README.md`.

Why D is the baseline: Nicolas said "I really like D". His one ask for the next round is that it be **a bit more compact in height**; see [What drives the height](#what-drives-the-height). A, B and C (Year spine, Swimlanes, Process table) are kept at tag `prototype-timeline-round-1`.

This is throwaway prototype code on `prototype/timeline`. It never merges.

## Running it

- `pnpm prototype:timeline` serves `/prototype/timeline` on port 4323. A dev server may already be running there; check before starting another.
- `?variant=D` picks the variant. With A–C gone it's the only one, so it's also the default. The floating switcher bar (← → keys) is harness UI, not design.
- `?otw=1` turns Open to Work on. The harness moves the Timeline slot above Selected Work, and D renders the "next" row (see Architecture).
- `?hero=docked|live|off`:
  - `docked` (the default) mounts the real Request Automaton hero (variant G) in its reduced-motion, docked form.
  - `live` runs G's full scroll-docking.
  - `off` drops the hero, for faster shots.
- The route is `src/pages/prototype/timeline.astro`. It globs `variants/*.ts` without recursing, keyed by the filename's first letter, so helpers stay in `variants/d/`.
- The stubs around the Timeline (Selected Work with `#case-<slug>` anchors, Contact) are `stubs.ts`. The content is `data.ts`, and the contract is `types.ts`.
- `pnpm astro check` must stay at 0 errors. Never run `astro build` while other agents share the worktree.

### Screenshots

The scripts are in the manager's scratchpad (`…/e41dcf9f-…/scratchpad/`). All drive `/usr/bin/chromium` through the cached `playwright-core`.

- `node shot.mjs "<url>" <out.png> <width> <dark|light> [selector]` takes a full-page or element shot and prints `scrollWidth` and console errors. `[data-timeline-slot]` captures just the section. The 404 error is the favicon.
- **Mid-animation caveat.** An element screenshot scrolls the element into view. Any row then inside the viewport is captured mid-range: half-drawn lanes and half-faded cards. That's correct for that scroll position, but it looks broken in a still. A full-page shot from scroll 0 is fine, because rows below the fold show their final state (see the fill-mode gotcha).
- To judge layout, emulate reduced motion with `shot-d.mjs`:
  - `node shot-d.mjs "<url>" <prefix> <width> <scheme> <reduce 0|1> [scrollYs]`
  - With `reduce=1` and no `scrollYs`, it shoots the slot in its complete static state.
  - With `scrollYs` (a comma list, offsets from the slot's top), it shoots the viewport at each scroll position, to see the staging.
- `node measure-d.mjs` prints the section, header, year-group and row heights at 360, 768 and 1440, with Open to Work off and on, under reduced motion. Use it before and after any compaction.

## Architecture

| Module | Owns |
| --- | --- |
| `variants/d/graph.ts` | The model, with no DOM. Month arithmetic (`mi`, `yearOf`). `state(lane, m)` gives each lane's state at a month: `active`, `idle` or `none`. `stretches(lane, hi, lo)` splits a time span into constant-state pieces as 0→1 fractions. It also builds `rows` (newest first), `tBelow(i)`, the `years` groups (every year from now down to the education start, including empty ones), and `present`. Constants `NODE_Y = 20` and `GRAPH_W = 64`. |
| `variants/d-git-graph.ts` | Markup. Lane x positions and colours. `seg`/`node` emit the absolutely positioned graph pieces. `rowLanes` draws a real row's lanes plus the fork curve; `fillLanes` draws filler rows. `entryCard` and `rowHtml` handle the five row kinds (`next`, `head`, `edu`, `entry`, `root`). It also renders the year groups, the header (kicker, `h2`, intro, CV button, key) and `mount`, whose cleanup is `section.remove()`. |
| `variants/d/style.ts` | All CSS, injected as a `<style>` inside the section. It covers the graph pieces, node shapes, calm focus (`:hover`, `:focus-within` and `:has()` lane dimming), the outlined years and the scroll-driven staging. Every class is prefixed `tld-`. |

### Data flow

```
ctx (entries, education, tracks, cv, now, openToWork, reducedMotion)
 │
 └─ model(ctx) ─▶ rows: next? · head (now+1) · edu (end+1) · entries (start) · root (edu start), sorted by t desc
                  years: [{ year, rows }] for every year, now → edu start
                  state(lane, month), stretches(lane, hi, lo)
 │
 └─ render ─▶ <section.tld[.tld-anim]>
               header (kicker, h2, intro, CV, key)
               ol > li.tld-ygroup (one per year)
                    ├─ giant sticky year (aria-hidden, lg+)
                    └─ div
                        ├─ .tld-row year header: h3, lanes via fillLanes (lg:sr-only on desktop)
                        └─ ol > li.tld-row per row
                             ├─ graph cell (aria-hidden): .tld-lanes (segments + curves), node(s)
                             └─ card: meta, h4, context · org, summary, + highlights, case-study link
```

- **One row is one commit.** A row's time `t` is the month of its event. The row's node sits at `NODE_Y` from its top.
- **The lane pieces in a row:**
  - Above the node (`0 → NODE_Y`): the state just after `t`.
  - Below the node: `stretches(lane, t, tBelow(i))`, placed with `top: calc(NODE_Y + (100% − NODE_Y) × f0)` and `bottom: calc((100% − NODE_Y) × (1 − f1))`. Percentages resolve against the row's own height, so the pieces stretch with whatever the card's height is. No measuring.
- **Filler rows** carry `state(lane, tNext + 0.5)` straight through, where `tNext` is the first real row at or below the year. Filler rows are the year header rows (phones and tablets) and the 2021-style empty-year spacer (lg+).
- **Fork rows** (the first entry of a Track) get an SVG curve from the Track's lane at the node down into the trunk, over 40 px. Below the node the Track's lane is `none`.
- **The `next` row** only exists with Open to Work. It sits on the free middle lane above HEAD. Its dashed green curves come from each Track lane that is active now, drawn by hand, not from `stretches`. The head row's above-node pieces become `next` (dashed green) for those lanes.
- **No runtime behaviour.** There are no listeners, observers, timers or frames; everything after `mount` is CSS.

## Invariants (keep these)

1. **Lanes.**
   - Left to right: the second Track (Teaching, peach) at x 10, the **Education trunk** (sky) at 32, the first Track (Engineering, mauve) at 54.
   - Engineering sits nearest the text, and both Tracks fork outward from the trunk without crossing it or each other.
   - Positions are keyed from `ctx.tracks` order, not hard-coded ids.
2. **Education is the trunk, beside the Tracks.**
   - It runs from the root (Education start) to the diamond node at the degree's end.
   - The Tracks fork *off* it but are never *in* it. Its card sits at its end date. The root is a one-line row.
3. **Gap fractions are honest.**
   - Within each row-to-row stretch, solid (in a role) and dotted (between roles) are proportional to months.
   - End months are inclusive: `endX = end + 1`, and "present" is `now + 1`.
   - Row spacing itself is *not* time-proportional (see Known issues); don't present it as if it were.
4. **Lanes are continuous.**
   - Every vertical pixel of the list is covered by some `.tld-row` that paints the lanes.
   - Rows and year groups have no margins or gaps between them; spacing is padding *inside* rows.
   - Any new element between rows must be a `.tld-row` with `fillLanes`.
5. **The same organization never becomes a heading.** Each role's own title is its `h4`. The second line leads with `context` (or the organization if there's none) in the lane colour.
6. **Hover never changes layout.**
   - Calm focus only touches `scale` and `box-shadow` (node), `background-color` (card) and `opacity` (other lanes' segments and curves).
   - Nothing appears or disappears. Section height is identical hovered and unhovered (measured).
7. **Reduced motion is the complete final state.**
   - `ctx.reducedMotion` means `.tld-anim` is never added. The CSS is also behind `prefers-reduced-motion: no-preference` and `@supports (animation-timeline: view())`.
   - Sticky years stay sticky (that isn't motion); they just never fill.
8. **No client JS on the real site (ADR 0002).**
   - Everything in `model` and the markup is build-time work for an Astro component. The staging is CSS scroll-driven animation; the dimming is `:has()`.
   - `ctx.now` becomes the build date, so present durations and HEAD are as fresh as the last build.
   - Adding a listener, observer or frame loop reopens ADR 0002; don't, without asking.
9. **Accessibility.**
   - Structure is `h2`, then an `ol` of years (`h3`), then an `ol` of rows (`h4` titles), with `<time datetime>` throughout.
   - The graph and the giant years are `aria-hidden`; the text carries every fact they draw.
   - Each meta line names its Track in words. Links use the house focus outline.

## Tuned numbers and why

### Graph geometry (`d/graph.ts`, `d-git-graph.ts`)

- **`GRAPH_W` is 64 px**, with lanes at 10, 32 and 54: 22 px apart, enough for a 12 px node with its 3 px background ring between neighbours. The column is `grid-cols-[64px_minmax(0,1fr)]`, with a gap of 16 px (24 at `sm`).
- **`NODE_Y` is 20 px.** The card's meta line (mono `text-xs`, `leading-4`) has its centre at `pt-1` (4) + `py-2` (8) + 8 = 20. Change one, change the other.
- **Segments are 2 px wide** with `margin-left: -1px`, and have **no border-radius** (see Gotchas).
- Idle (dotted) is `2px on / 5px off` at 0.8 opacity. Next (dashed green) is `4 / 4`.
- **The fork curve** is an SVG, 64 × 40, from `(laneX, 0)` through `C laneX 24, trunkX 16` to `(trunkX, 40)`, starting at `NODE_Y`. 40 px fits under the node within the shortest entry row.
- **The next-row curves** use `viewBox 0 0 64 100` with `preserveAspectRatio="none"` and `vector-effect="non-scaling-stroke"`, so they stretch to the row's height without fattening the stroke.
- **Nodes:**
  - entry: 12 px filled;
  - HEAD tip: 13 px hollow;
  - education end: an 11 px diamond (a nod to the hero's Edge diamond);
  - root: 8 px;
  - next: 18 px dashed green.
  - All have a `0 0 0 3px var(--bg)` ring that cuts the lane under them.

### Calm focus

- The node grows to `scale 1.2` with a 7 px ring at 30 % lane colour. The card tint is 7 % lane colour.
- Other lanes' segments and curves drop to 0.3 opacity. Transitions are 0.2 s and are off under reduced motion.

### Sticky years (lg+)

- Year column `8.5rem`, `text-6xl` serif (about 60 px), outlined with a 1 px `--faint` stroke, `sticky top-24` (96 px).
- **The fill band:** `view-timeline-inset: 80px calc(100% − 170px)` on each `.tld-ygroup` makes the group's view timeline a band from 80 to 170 px down the viewport, bracketing the sticky year's 96–156 px.
  - The `tld-lit` animation runs over `cover 0% → cover 100%` of that band, filling from 10 % to 90 %. So a year is filled while its group passes behind the year's own position.
  - With the full viewport as the timeline, 3–4 short years were filled at once.
  - **If you move `top-24`, move the inset with it.**

### View-timeline ranges (`d/style.ts`)

Every row declares `view-timeline-name: --tld-row`; its pieces animate on it.

| What | Range | Why |
| --- | --- | --- |
| lanes draw (`clip-path: inset(0 0 100% 0)` → none) | `entry 30%` → `cover 35%` | draws downward as the row rises from the lower viewport to about mid-screen; one clip on `.tld-lanes` keeps a row's pieces drawing as one continuous line |
| node pop (`transform: scale(.2)` and opacity) | `entry 30%` → `entry 100%` | lands before its card finishes |
| card settle (`opacity`, `translateX(14px)`) | `entry 10%` → `cover 30%` | fully readable by the time the row's top is about two thirds up a 900 px viewport |
| kicker types (`width 0 → Nch`, `steps(N)`) | `entry 0%` → `cover 30%` | `N` is the command's length, inlined as `animation-timing-function` |
| year fill | band above | |

### Layout breakpoints

- **Below `sm` (640 px):** only the first highlight shows (`max-sm:hidden`).
- **Below `lg` (1024 px):** single column. Each year is an inline `h3` header row (44 px) that carries the lanes. Empty years show just that header.
- **`lg`:** the giant sticky year column appears. The `h3` header rows go `lg:sr-only` (1 px). Empty years get an `h-20` spacer row with lanes.
- **`xl` (1280 px):** a card splits into two columns, with the commit message on the left and the highlights and case-study link on the right (`xl:pt-6` aligns them under the title).
- Section: `max-w-6xl px-4 sm:px-8 py-20`. The header grid mirrors the year column at `lg`, so the heading lines up with the cards.

## Gotchas

- **Fill mode is `forwards`, never `both`, on the row animations.** Before its range starts, an element is below the fold, and with `forwards` it shows its final style there. That's what makes full-page screenshots and no-support browsers see the finished graph. With `both`, everything below the fold renders at keyframe 0 (invisible). The year fill uses `both` on purpose: its keyframe 0 *is* the resting outline.
- **Pop with `transform`; hover with `scale`.** A filled animation overrides normal declarations of the same property. If the pop animated `scale`, the hover `scale: 1.2` would never apply. The two properties compose.
- **No border-radius on segments.** Where two 2 px pieces meet, rounded corners leave antialiased notches, visible as faint ticks at every row boundary.
- **Lane continuity breaks on any margin.** `space-y-*`, `mt-*` on a row, `gap-y` on the list or group: any of them leaves a gap in every lane. Pad inside rows instead.
- **Named timelines are scoped to descendants.** `--tld-row` is per row and `--tld-y` per year group. A piece that moves outside its row loses its timeline and falls back to its final state.
- **The year headers are double.** The `h3` lives in the header row (visible on phones and tablets, `lg:sr-only` on desktop). The giant sticky year is an `aria-hidden` visual copy. Change both.
- **Tailwind classes must be complete literals.** Arbitrary values (`grid-cols-[64px_minmax(0,1fr)]`, `lg:grid-cols-[8.5rem_minmax(0,1fr)]`) may not be in the served CSS until the dev server rescans. `touch src/styles/global.css` and hard-reload, and confirm with `getComputedStyle` before debugging layout. Lane colours are `var(--…)` in inline styles for the same reason.
- **`ctx.now` is computed at page load** in the harness (`data.ts`). On the real site it's the build date.
- **The `next` row is excluded from `tBelow` maths.** It's drawn by hand above HEAD. Making it a normal row would give it lanes above HEAD that don't exist.

## Known issues

1. **A row stays half-faded if scrolling stops mid-range.** The staging is a pure function of scroll position, so when the reader stops with a row in the lower part of the viewport, that row stays mid-animation for as long as they don't scroll:
   - lanes half-drawn;
   - the card at partial opacity, shifted a few px.

   It's honest, but it reads as unfinished at the bottom of the screen. It's most visible on tall phones and when a short page area lands at the bottom.

   **Fix directions:**
   - Shorten the ranges so they finish near the bottom edge (for example, the card over `entry 0% → entry 60%`).
   - Start the card at opacity 0.4 rather than 0.
   - Or use scroll-*triggered* (time-based) animations (`animation-trigger` and `timeline-trigger`). Check support first; that's newer than scroll-driven animations.
2. **The sticky-year handover overlaps.** While one group's year is pushed out by the next, both years sit stacked near the top, and for that moment both are filled (both groups are inside the 80–170 px band). A narrower band or a later fill start (for example 20 %) would shorten the overlap; it can't be removed without JS.
3. **It assumes exactly two Tracks.** The lane positions are "second Track, trunk, first Track". A third Track needs a fourth lane, a wider `GRAPH_W` and a decision about which side it forks to. `TRACKS` in `data.ts` has two entries, and the spec says two.
4. **Row spacing isn't time.** Rows are commits: the Jan 2020 → Aug 2022 trunk stretch is short on screen, while a 6-month role can be 300 px tall. Only the solid/dotted split within a stretch is proportional. That's the git-graph trade-off; a proportional axis would need JS layout, or build-time card heights.
5. **Phone and tablet year headers sample state just above the next row.** If a role started or ended between the year boundary and that row, the lane change would show a few px off. This doesn't happen with the current data.
6. **The git jokes** ("HEAD", "uncommitted", the `$ git log` kicker, the `+` diff highlights) may not land with a Recruiter. The sentences beside them carry the meaning on their own.
7. **Firefox and Safari support for `animation-timeline` is unverified.** Without it they get the static graph, which is fine.

### What drives the height

Measured with `measure-d.mjs` under reduced motion (the final layout), hero off. The section includes `py-20`.

| Width | Section | Section with `otw=1` | Header | List |
| --- | --- | --- | --- | --- |
| 360 | 3210 | 3396 | 290 | 2712 |
| 768 | 2842 | 3009 | 250 | 2384 |
| 1440 | 2071 | 2238 | 200 | 1663 |

Row heights in px, newest first:

| Row | 360 | 768 | 1440 |
| --- | --- | --- | --- |
| next (otw) | 187 | 167 | 167 |
| HEAD | 184 | 132 | 132 |
| Education | 188 | 127 | 127 |
| Blinka | 358 | 349 | 266 |
| Instructor | 308 | 267 | 184 |
| NoEstasSolx | 348 | 307 | 208 |
| Portafolio | 293 | 300 | 236 |
| Tutor | 308 | 267 | 184 |
| GOLD-python | 341 | 284 | 185 |
| 2021 (empty) | 44 header | 44 header | 80 spacer |
| root | 76 | 44 | 44 |
| year header rows | 7 × 44 = 308 | 7 × 44 = 308 | 1 px each (sr-only) |

**Desktop (1440), 2071 px:**
- **Fixed overhead: about 410 px.** That's `py-20` (160), the header (200) and `mt-12` (48).
- **Per-row padding: about 56 px per row**, which is 450 px over 8 content rows. It's `pt-1` + `py-2` around the card (12, kept for the hover tint) plus `pb-9` (36) between commits.
- **The tallest rows are driven by the right (highlights) column**, not the commit message. Blinka (4 highlights) and Portafolio (4) wrap to 2 lines each in a column of about 400 px, plus `xl:pt-6` (24) to sit under the title. The left column (meta, title, context line, summary) is about 150 px.
- **Year groups have a floor** of the sticky year's height (about 62 px), so the root and 2020 can't shrink below that. The empty 2021 spacer is `h-20` (80).

**Phone (360), 3210 px:**
- **Year header rows: 308 px** (7 × 44), including 2021's.
- **The card column is about 248 px wide** (the 64 px graph and 16 px gap come out of the 328 px content width), so everything wraps:
  - the meta line ("Track · dates · duration · draft") takes 2 lines;
  - summaries take 3–4 lines;
  - the single highlight, in mono 12.5 px, takes 2–3 lines;
  - case-study titles wrap to 2 lines.
- **Header: 290 px.** The intro wraps to 3 lines, the CV button sits on its own line, and the key takes 3 lines.
- **The HEAD and Education rows** are 184 and 188 px because their sentences wrap to 4 lines at that width.

**Tablet (768), 2842 px:** a single column with *all* highlights (`max-sm:hidden` only applies below 640), so rows are nearly as tall as on phones. This is the worst ratio of height to information.

Levers, for the next agent to weigh rather than decisions already made:
- `pb-9` between commits;
- `py-20` and the header's stacking;
- the year header rows below `lg` (fold the year into the first card's meta line, or into the graph column);
- highlights shown below `xl` (first highlight only up to `lg`?);
- the summary's line length;
- the 2021 spacer;
- the `xl:pt-6` offset;
- the key's three lines on phones.

Whatever changes, keep `NODE_Y` matched to the meta line and keep rows margin-free (invariants 4 and the geometry above).
