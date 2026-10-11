# Timeline prototype: variant D ("git log --graph")

Working notes for whoever iterates on D next. These notes don't repeat:
- **What the Timeline must do:** the spec (`gh issue view 1`).
  - User stories 25–28 (scannable, two Tracks, distinct Uniandes roles, Education beside the Tracks), 34 (Open to Work) and 38–39 (content upkeep).
  - The "Timeline entries" content model and the "Home" layout.
- **The round-1 brief** (hard parts 1–9, Nicolas's taste table, calm-focus rule, file ownership, screenshot tool) is in the manager's scratchpad: `/tmp/claude-1000/-home-tweep-Programming-offline-profile-JS-portfolio-timeline/e41dcf9f-bd5a-4755-bba2-685a64105acc/scratchpad/brief-round-1.md`. It's ephemeral; if it's gone, the hard parts are restated briefly under Invariants.
- **Vocabulary:** `CONTEXT.md` (Timeline, Track, Recruiter, Peer, Open to Work, Case Study, CV).
- **The hero above:** `src/prototype/request-automaton/README.md`.

Why D is the baseline: Nicolas said "I really like D", with one ask: **a bit more compact in height**. Iteration 1 (this state) did that: about 15 % shorter on desktop, 18 % on phones and 23 % on tablets, plus the half-faded-row and year-handover fixes. See [What drives the height](#what-drives-the-height) and [Iteration 1](#iteration-1-compact-height). A, B and C (Year spine, Swimlanes, Process table) are kept at tag `prototype-timeline-round-1`.

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
| `variants/d/graph.ts` | The model, with no DOM. Month arithmetic (`mi`, `yearOf`). `state(lane, m)` gives each lane's state at a month: `active`, `idle` or `none`. `stretches(lane, hi, lo)` splits a time span into constant-state pieces as 0→1 fractions. It also builds `rows` (newest first), `tBelow(i)`, the `years` groups (every year from now down to the education start, including empty ones), and `present`. Constants `NODE_Y = 20` and `GRAPH_W = 64` (the lane coordinate space; see geometry). |
| `variants/d-git-graph.ts` | Markup. Lane x positions (in the 64-unit space, emitted as `%` by `at()`) and colours. `seg`/`node` emit the absolutely positioned graph pieces. `rowLanes` draws a real row's lanes plus the fork curve; `fillLanes` draws filler rows. `ROW` is every row's grid class. `entryCard` (with `counted`, `hl`, `dur`) and `rowHtml` handle the five row kinds (`next`, `head`, `edu`, `entry`, `root`). It also renders the year groups, the header (kicker, `h2` + CV button, intro, key) and `mount`, whose cleanup is `section.remove()`. |
| `variants/d/style.ts` | All CSS, injected as a `<style>` inside the section. It covers the graph pieces, node shapes, calm focus (`:hover`, `:focus-within` and `:has()` lane dimming), the outlined years, the highlights disclosure (`.tld-more`) and the scroll-driven staging. Every class is prefixed `tld-`. |

### Data flow

```
ctx (entries, education, tracks, cv, now, openToWork, reducedMotion)
 │
 └─ model(ctx) ─▶ rows: next? · head (now+1) · edu (end+1) · entries (start) · root (edu start), sorted by t desc
                  years: [{ year, rows }] for every year, now → edu start
                  state(lane, month), stretches(lane, hi, lo)
 │
 └─ render ─▶ <section.tld[.tld-anim]>
               header (kicker, h2 + CV button [not with otw], intro, key)
               ol > li.tld-ygroup (one per year)
                    ├─ giant sticky year (aria-hidden, lg+)
                    └─ div
                        ├─ .tld-row year header: h3, lanes via fillLanes (lg:sr-only on desktop)
                        └─ ol > li.tld-row per row
                             ├─ graph cell (aria-hidden): .tld-lanes (segments + curves), node(s)
                             └─ card: div (meta, h4 [+ draft tag], context · org, summary)
                                      ul (lead highlight; the rest only at xl)
                                      .tld-foot: details.tld-more "+N more" (below xl), case-study link
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
   - Nothing appears or disappears. Section height is identical hovered and unhovered, and with the "+N more" summary hovered or keyboard-focused (measured at 360, 768 and 1440, motion on and off).
   - The `<details>` disclosure is the one thing that changes layout, and only on an explicit click or Enter/Space. It's native, so it needs no JS.
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
   - Each meta line names its Track in words. Links and the disclosure summary use the house focus outline.
   - What phones hide visually stays for screen readers (`max-sm:sr-only`): the duration on meta lines, and the case-study title in its link ("Case study →" visually).
10. **No hard count disappears.** Below `xl` the card shows one *lead* highlight: the first one containing a digit (a hard count), else the first one. Everything else is one click away in "+N more". At `xl` every highlight shows. Never cut a highlight without a way to reach it.

## Tuned numbers and why

### Graph geometry (`d/graph.ts`, `d-git-graph.ts`)

- **`GRAPH_W` is 64**, the lane coordinate space, with lanes at 10, 32 and 54. Positions are emitted as percentages of the graph column (`at()`), so the column can change width per breakpoint without new markup.
  - From `sm`: the column is 64 px (lanes 22 px apart, enough for a 12 px node with its 3 px ring between neighbours), gap 24 px.
  - Below `sm`: the column is **48 px** (lanes 16.5 px apart, still clear of the 12 px node + ring), gap 12 px. That gives the card about 20 px more width on a 360 px phone.
  - The grid class is `ROW`: `grid-cols-[48px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-x-6`. Every row and filler row uses it.
- **`NODE_Y` is 20 px.** The card's meta line (mono `text-xs`, `leading-4`) has its centre at `pt-1` (4) + `py-2` (8) + 8 = 20. Change one, change the other.
  - The HEAD row has no meta line: its first line is the sentence (`leading-6`, 24 px) with the HEAD ref inline, so it drops `pt-1` to keep the centre at 8 + 12 = 20.
- **Segments are 2 px wide** with `margin-left: -1px`, and have **no border-radius** (see Gotchas).
- Idle (dotted) is `2px on / 5px off` at 0.8 opacity. Next (dashed green) is `4 / 4`.
- **The fork curve** is an SVG, `viewBox 0 0 64 40`, from `(laneX, 0)` through `C laneX 24, trunkX 16` to `(trunkX, 40)`, starting at `NODE_Y`. It's `width: 100%` of the graph column with `preserveAspectRatio="none"` and a non-scaling stroke, so it squeezes to 48 px on phones. 40 px fits under the node within the shortest entry row.
- **The next-row curves** use `viewBox 0 0 64 100` the same way, stretched to the column's width and the row's height.
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

- Year column `8.5rem`, `text-6xl` serif (about 60 px), outlined with a 1 px `--faint` stroke, `sticky top-24` (96 px). Kept at full size: the giant years are part of D's identity, and shrinking them saved little.
- **The fill band:** `view-timeline-inset: 100px calc(100% − 152px)` on each `.tld-ygroup` makes the group's view timeline a 52 px band, 100–152 px down the viewport, inside the sticky year's 96–156 px.
  - Two animations on the year: `tld-lit` (outline → filled) over the band's `entry` range, fill `both`; and `tld-unlit` (filled → outline) over its `exit` range, fill `forwards`, listed second so it wins while active.
  - A group's `entry` is its top crossing the band; its `exit` is its bottom crossing it. For neighbouring groups those are the same scroll positions, so at the handover the outgoing year fades out exactly as the incoming one fades in. Only one year is ever fully filled.
  - **If you move `top-24`, move the inset with it.**

### View-timeline ranges (`d/style.ts`)

Every row declares `view-timeline-name: --tld-row`; its pieces animate on it. The rule since iteration 1: **everything finishes within the bottom 150 px of the viewport**, so wherever the reader stops, every row on screen is finished; only the strip at the bottom edge is still being written. Every range starts at `cover 0%` (the row's top at the viewport's bottom edge), and any delay lives in the keyframes (see Gotchas).

| What | Range | Keyframes | Why |
| --- | --- | --- | --- |
| lanes draw | `cover 0%` → `contain 120px` | `clip-path: inset(0 0 calc(100% + 120px) 0)` → `inset(0 0 0 0)` | over that range the clip's bottom edge sits exactly 120 px above the viewport's bottom edge, so the drawing front is a fixed line there, continuous from row to row; one clip on `.tld-lanes` keeps a row's pieces drawing as one line |
| node pop (`transform: scale(.2)` and opacity) | `cover 0%` → `cover 150px` | hidden until 66 %, then lands | lands as the drawing front passes it (node top + 20 px reaches 120 px up at about 100 px) |
| card settle (`opacity`, `translateX(14px)`) | `cover 0%` → `cover 150px` | linear | fully readable once its top is 150 px above the bottom edge |
| kicker types (`width 0 → Nch`, `steps(N)`) | `entry 0%` → `cover 30%` | | `N` is the command's length, inlined as `animation-timing-function` (unchanged) |
| year fill | band above | | |

### Vertical rhythm

- Section `py-16`, matching the Selected Work and Contact stubs (was `py-20`). Header → list `mt-10` (was `mt-12`).
- Rows: `pb-5` between commits (was `pb-9`), plus the card's `pt-1` + `py-2` (12 px, kept for the hover tint). That's about 40 px between one card's text and the next meta line.
- Header: kicker, then `h2` with the CV button on the same row (`flex-wrap`, so it drops under on a narrow phone), then the intro (`lg:max-w-none`, one line on desktop), then the key, `mt-3` apart. The key is `gap-x-4` so it fits one line from 1280 px.

### Layout breakpoints

- **Below `sm` (640 px):**
  - graph column 48 px (see geometry);
  - meta lines drop the duration visually (`max-sm:sr-only`), so every one fits on one line;
  - the case-study link reads "Case study →" (the title is `max-sm:sr-only`), so it shares a line with "+N more";
  - the key drops the Track blurbs (`max-sm:hidden`); the intro sentence already names the Tracks and the degree.
- **Below `lg` (1024 px):** single column. Each year is an inline `h3` header row (28 px: `text-xl`, `pt-1.5 pb-0.5`; was 44) that carries the lanes. Empty years show just that header.
- **Below `xl` (1280 px):** one lead highlight, the rest behind "+N more" (invariant 10). The disclosure and the case-study link share `.tld-foot`, a `flex-wrap` line; an open disclosure takes the whole line (`flex-basis: 100%`) and pushes the link under it.
- **`lg`:** the giant sticky year column appears. The `h3` header rows go `lg:sr-only` (1 px). Empty years get an `h-16` spacer row with lanes (was `h-20`; 64 px still clears the 62 px sticky year).
- **`xl`:** a card is a 2 × 2 grid, `grid-rows-[auto_1fr]`. The commit message spans both rows on the left. The highlights (all of them) sit top right, level with the meta line (the old `xl:pt-6` offset is gone), with the case-study link under them. A row is as tall as the taller column; most are now left-driven.
- Section: `max-w-6xl px-4 sm:px-8 py-16`. The header grid mirrors the year column at `lg`, so the heading lines up with the cards.

## Gotchas

- **Fill mode is `forwards`, never `both`, on the row animations.** Before its range starts, an element is below the fold, and with `forwards` it shows its final style there. That's what makes full-page screenshots and no-support browsers see the finished graph. With `both`, everything below the fold renders at keyframe 0 (invisible). The year fill uses `both` on purpose: its keyframe 0 *is* the resting outline.
- **So every row range must start at `cover 0%`.** A later start (say `cover 120px`) leaves the row's top strip on screen *before* its range, showing the final state: lanes fully drawn below the drawing front, then undrawn once the range starts. Put any delay in the keyframes instead (`0%, 66% { … }`, or the lanes' `calc(100% + 120px)` inset). `clip-path: inset()` insets past 100 % are scaled down to clip everything, which is what the lanes rely on.
- **Highlights beyond the lead are in the DOM twice:** as `hidden xl:flex` items in the main list, and inside the `xl:hidden` disclosure. Only one copy is ever displayed, so screen readers read one. Change both if you change the markup. (`::details-content` could force a `<details>` open at `xl` instead, but support outside Chromium is unverified.)
- **Pop with `transform`; hover with `scale`.** A filled animation overrides normal declarations of the same property. If the pop animated `scale`, the hover `scale: 1.2` would never apply. The two properties compose.
- **No border-radius on segments.** Where two 2 px pieces meet, rounded corners leave antialiased notches, visible as faint ticks at every row boundary.
- **Lane continuity breaks on any margin.** `space-y-*`, `mt-*` on a row, `gap-y` on the list or group: any of them leaves a gap in every lane. Pad inside rows instead.
- **Named timelines are scoped to descendants.** `--tld-row` is per row and `--tld-y` per year group. A piece that moves outside its row loses its timeline and falls back to its final state.
- **The year headers are double.** The `h3` lives in the header row (visible on phones and tablets, `lg:sr-only` on desktop). The giant sticky year is an `aria-hidden` visual copy. Change both.
- **Element screenshots catch the sticky year mid-scroll.** With the hero above, an element shot of the slot scrolls, and the 2026 sticky year can land partway down its group. Take final shots with `&hero=off`.
- **Tailwind classes must be complete literals.** Arbitrary values (`grid-cols-[64px_minmax(0,1fr)]`, `lg:grid-cols-[8.5rem_minmax(0,1fr)]`) may not be in the served CSS until the dev server rescans. `touch src/styles/global.css` and hard-reload, and confirm with `getComputedStyle` before debugging layout. Lane colours are `var(--…)` in inline styles for the same reason.
- **`ctx.now` is computed at page load** in the harness (`data.ts`). On the real site it's the build date.
- **The `next` row is excluded from `tBelow` maths.** It's drawn by hand above HEAD. Making it a normal row would give it lanes above HEAD that don't exist.

## Known issues

1. **(Mostly fixed in iteration 1.) A row can still be caught mid-animation in the bottom 150 px.** The staging is a pure function of scroll position. The ranges now finish within the bottom 150 px, and the lanes' front is a fixed line 120 px above the bottom edge, so a stopped reader sees finished rows plus, at most, a fading card and undrawn lanes in that bottom strip. That reads as "still arriving" rather than broken. To remove it entirely you'd need scroll-*triggered* (time-based) animations (`animation-trigger`, `timeline-trigger`); check support first.
2. **(Fixed in iteration 1.) The sticky-year handover overlapped.** Both years used to be filled while one pushed the other out. Now it's a true cross-fade (see Sticky years). Both years are still *visible*, stacked, during the push; that's sticky positioning, not a bug.
3. **It assumes exactly two Tracks.** The lane positions are "second Track, trunk, first Track". A third Track needs a fourth lane, a wider `GRAPH_W` and a decision about which side it forks to. `TRACKS` in `data.ts` has two entries, and the spec says two.
4. **Row spacing isn't time.** Rows are commits: the Jan 2020 → Aug 2022 trunk stretch is short on screen, while a 6-month role can be 300 px tall. Only the solid/dotted split within a stretch is proportional. That's the git-graph trade-off; a proportional axis would need JS layout, or build-time card heights.
5. **Phone and tablet year headers sample state just above the next row.** If a role started or ended between the year boundary and that row, the lane change would show a few px off. This doesn't happen with the current data.
6. **The git jokes** ("HEAD", "uncommitted", the `$ git log` kicker, the `+` diff highlights) may not land with a Recruiter. The sentences beside them carry the meaning on their own.
7. **Firefox and Safari support for `animation-timeline` is unverified.** Without it they get the static graph, which is fine.
8. **The lead-highlight rule is a heuristic.** "First highlight with a digit" picks the hard count in every current entry, and it's the first highlight anyway. Blinka has no counted highlight, so its first one leads; it's long (4 lines on a phone). If the content model grew a `lead` flag, the rule could go.
9. **"+N more" doesn't change when open.** The summary turns `--text` coloured but keeps its label. Fine for a prototype; a "−" or "less" state is CSS-only if wanted.
10. **1024–1279 px:** the key wraps to two lines (only "between roles" on the second), and cards are single-column with the disclosure, like tablets.
11. **Open to Work hides the header's CV button.** The green "next" row carries the CV link instead, so the page doesn't show two CV buttons 200 px apart.

### What drives the height

Measured with `measure-d.mjs` under reduced motion (the final layout), hero off. The section includes its vertical padding.

| Width | Round 1 | Iteration 1 | Round 1, `otw=1` | Iteration 1, `otw=1` | Header (now) | List (now) |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | 3210 | **2619** (−18 %) | 3396 | **2770** (−18 %) | 194 | 2257 |
| 768 | 2842 | **2179** (−23 %) | 3009 | **2305** (−23 %) | 182 | 1829 |
| 1440 | 2071 | **1752** (−15 %) | 2238 | **1846** (−18 %) | 136 | 1448 |

Row heights in px now (round 1 in brackets), newest first:

| Row | 360 | 768 | 1440 |
| --- | --- | --- | --- |
| next (otw) | 152 (187) | 127 (167) | 94 (167) |
| HEAD | 156 (184) | 84 (132) | 84 (132) |
| Education | 156 (188) | 111 (127) | 111 (127) |
| Blinka | 304 (358) | 247 (349) | 224 (266) |
| Instructor | 272 (308) | 229 (267) | 168 (184) |
| NoEstasSolx | 269 (348) | 229 (307) | 191 (208) |
| Portafolio | 287 (293) | 229 (300) | 208 (236) |
| Tutor | 272 (308) | 229 (267) | 168 (184) |
| GOLD-python | 269 (341) | 229 (284) | 168 (185) |
| 2021 (empty) | 28 header (44) | 28 header (44) | 64 spacer (80) |
| root | 76 | 44 | 44 |
| year header rows | 7 × 28 (7 × 44) | 7 × 28 (7 × 44) | 1 px each (sr-only) |

**Desktop (1440), 1752 px:**
- **Fixed overhead: about 304 px.** `py-16` (128), the header (136) and `mt-10` (40).
- **Per-row padding: about 32 px** (`pb-5` + 12) over 9 rows.
- **Rows are mostly left-column-driven now** (meta, title, context line, a 2–3 line summary: about 130 px). Blinka and Portafolio are still right-driven (4 highlights, 2 lines each, in a ~400 px column).
- **Year groups have a floor** of the sticky year's height (about 62 px), so the root and 2020 can't shrink below that. The empty 2021 spacer is 64.

**Phone (360), 2619 px:**
- **The card column is about 268 px wide** (48 px graph + 12 px gap out of 328). Every meta line fits on one line now.
- **What's left is text:** the "where" line wraps to 2 lines on Uniandes roles, summaries take 3 lines, and the lead highlight 2–4.
- **HEAD and Education** are 156 each: the HEAD sentence takes 5 lines, the degree title and institution line 2 each.

**Tablet (768), 2179 px:** a single column with one lead highlight, like phones. The best ratio of the three now.

Levers left, for the next agent to weigh:
- the HEAD sentence on phones (5 lines): it repeats the two rows below it, so it could shorten, at a cost to the "gist in seconds";
- the "where" line could drop the organization when it equals the previous row's, but invariant 5 and the spec argue against hiding Uniandes;
- `pb-5` → `pb-4` (about 36 px), at the edge of cramped;
- a two-column card from `md` (768) instead of `xl`, which would need the highlights back at tablet width;
- the giant year at `text-5xl` would let the 2021/2020 floor shrink by about 24 px.

Whatever changes, keep `NODE_Y` matched to the meta line and keep rows margin-free (invariants 4 and the geometry above).

## Iteration 1 (compact height)

What changed from round 1, and what was tried and dropped; the sections above already describe the result.

- Rhythm: `py-20` → `py-16`, `mt-12` → `mt-10`, `pb-9` → `pb-5`.
- Header: CV button on the `h2` row, intro on one line at `lg`, key on one line from `xl`, Track blurbs hidden on phones, no header CV with Open to Work.
- HEAD row: the HEAD ref and date lead the sentence instead of a separate meta line (−24 px everywhere).
- Next row (otw): sentence and CV button share a line where they fit (−73 px at 1440).
- Cards: draft tag beside the title; duration `sr-only` on phones; xl 2 × 2 grid with no `pt-6` offset; lead highlight + "+N more" below `xl`; "Case study →" on phones.
- Graph column 48 px on phones, positions in `%`, curves scale with the column.
- Year header rows 44 → 28 px below `lg`; 2021 spacer 80 → 64 at `lg`.
- Staging: ranges finish in the bottom 150 px; the lane front is pinned 120 px above the bottom edge; year handover cross-fades.
- **Tried and dropped:**
  - case-study link in the left column at `xl`: it made every row left-driven (+28 px each), so it went back under the highlights;
  - starting the lane draw at `cover 120px`: rows before their range showed fully drawn (the fill-mode gotcha), so the delay moved into the keyframes;
  - merging the intro and key into one sentence with inline swatches: saved about one line on desktop and nothing on phones, and lost the scannable mono key.
