# Work section prototype: variant B (Split, graph as rail)

Working notes for whoever iterates on B next. B fuses two sections that were prototyped separately: **Selected Work** (Case Studies in depth, for Peers) and the **Timeline** (every role briefly, for Recruiters). These notes don't repeat:
- **The two baselines B is built from.** Read both before touching anything; B copies their code and most of their rules. Neither is imported, so B stays self-contained when the old harnesses are pruned.
  - `src/prototype/selected-work/README.md` is **H, "Split readout"**: the readout, its reserved-slot grid, the figures, the view gate.
  - `src/prototype/timeline/README.md` is **D, "git log --graph"**: the lane model, lane continuity, scroll-driven staging.
- **Vocabulary:** `CONTEXT.md` (Case Study, Selected Work, Timeline, Track, Peer, Recruiter, Open to Work, CV). "work-history" is only a file and branch name; never use it in copy.
- **What the site must do:** the spec (`gh issue view 1 -R Nicolas-Saavedra/portfolio`).
- **Why there's no JS island:** `docs/adr/0002-astro-with-a-single-island.md`.
- **The hero above this section:** `src/prototype/request-automaton/README.md` (variant G, scroll-docking).
- **The round-1 brief** (the eight points every fusion variant had to answer, the taste table, the rules of engagement) is in the manager's scratchpad: `/tmp/claude-1000/-home-tweep-Programming-offline-profile-JS-portfolio-work-history/a75a805b-8a90-4d68-a904-5c201378a063/scratchpad/brief-round-1.md`, with each variant's report beside it (`report-b.md` is B's). It's ephemeral. If it's gone, the eight points are restated under [Invariants](#invariants-keep-these).

This is throwaway prototype code on `prototype/work-history`. It never merges.

## How B came about

| Round | Variants | Nicolas's verdict | Tag |
| --- | --- | --- | --- |
| 1 | A "Graph with inline depth" (D's graph is the whole section; Case Study rows open H's readout inline), **B "Split, graph as rail"**, C "Sticky readout" (D's graph scrolls; a sticky readout follows the row crossing a line, CSS `view-timeline` + `timeline-scope`), D "Branch scene" (the Timeline to scale as a wide scene; Case Studies as branches you check out) | "B feels nice. I'd give it the left bit more room to breathe, it's a lot of text, but I like the idea of it. I am also unsure if I will be doing detail pages for every single as a case study. Also the bachelor's feels a little incomplete compared to the rest of the page." | `prototype-work-history-round-1` (all four) |
| baseline | B alone | | this branch (`f8c133c`) |

The verdict's three asks are **not implemented yet**; see [Next](#next).

Lessons that still stand from the earlier rounds:
- **From the hero:** daring in staging, calm in interaction. No popups or tooltips over content, no layout that depends on hover or focus, and no portfolio slop (gradients, glass, skill bars, percentages).
- **From H:** "numbers should make sense", and the section should stay at a decent height.
- **From D:** "a little bit more compact in height".

**Height matters most.** B replaces two sections, so it has to be clearly shorter than H + D stacked (see [Heights](#heights)).

## Running it

- **Start:** `pnpm prototype:work-history` serves on port 4324 and opens `/prototype/work-history`. A dev server may already be running there; check before starting another.
- **Page:** the route is `src/pages/prototype/work-history.astro`. It's a stub of the home page:
  - the real Request Automaton hero (G) on top;
  - then `#variant-root` (`[data-work-history-slot]`), which is this section;
  - then a contact stub (`stubs.ts`).
- **Query parameters:**
  - `?variant=B` picks the variant. It's the only one left, so it's also the default. The route globs `variants/*.ts` without recursing and keys each variant by its filename's first letter, so helpers stay in `variants/b/`.
  - `?otw=1` turns Open to Work on. The harness reorders nothing; B changes its own emphasis (see invariant 9).
  - `?hero=docked|live|off`:
    - `docked` (the default) mounts G in its reduced-motion, docked form;
    - `live` runs G's full scroll-docking;
    - `off` skips the hero for quick iteration.
    Judge final work with the hero on, and look at the seam.
- **Switcher:** the floating bar is harness UI, not design. Its ← → keys skip events from inputs, so arrow keys on B's radios don't switch variants.
- **Type check:** `pnpm astro check` must end at 0 errors and 0 warnings. **Never run `astro build`** while other agents share the worktree.

### Measuring and screenshots

Use Playwright with `/usr/bin/chromium`. `playwright-core` is in the npx cache: `find ~/.npm/_npx -name playwright-core`.
- Remove `[data-prototype-switcher]` before shooting.
- Set theme and motion with `emulateMedia` or the `newPage` options (`colorScheme`, `reducedMotion`).

The round-1 scripts are in the scratchpad above (ephemeral):
- `shot.mjs <url> <out> <width> <dark|light> [selector]`: a full-page or element shot.
- `b-measure.mjs [widths]`: section, rail and frame heights per width with Open to Work off and on. It also checks every radio, one by one, and prints the set of section heights; that set must have one value per width (invariant 1).
- `b-rows.mjs <width>`: which readout sets each frame row. It injects `align-self:start` on the readout parts and prints each part's natural height per readout.
- `b-click.mjs <w> <scheme> <rowKey> <out> [otw] [touch]`: scrolls a row to the centre, clicks or taps it, and reports `scrollY` before and after plus the readout's top. Use it to test the tap-to-readout trick.
- `b-kbd.mjs`: the Tab order, arrow keys, the focus outline, and a hover sweep over every row (heights must not change).
- `b-motion.mjs`: the view gate; with the hero on, the readout's animations must be `paused` before the section is in view and `running` after.
- `b-fallback.mjs`: the no-`:has()` fallback (see Gotchas).
- `b-rowh.mjs`: each rail row's height and the radio count.

If they're gone, the core of the measure is short. In the page, under `reducedMotion: "reduce"`, for each `#b .b-radio`: set `checked = true`, await a frame, and read `[data-work-history-slot]`'s height.

## Architecture

| Module | Owns |
| --- | --- |
| `content.ts` (shared, harness) | The fused content: `ROLES` (D's field names, as `ctx.entries`), `CASE_STUDIES` (H's, as `ctx.work`), `EDUCATION`, `TRACKS`, `CV`, `OPEN_TO_WORK`, `NOW`, plus the join helpers `caseStudyOf(role)`, `rolesOf(cs)`, `roleById`, `caseStudyBySlug`, `monthIndex`. Read its header comment: a Role may point at one Case Study (`caseStudy`, a slug), and a Case Study lists its `spans`, each either a Role or not a role at all (the thesis). Don't edit it from a variant; say what's missing instead. |
| `types.ts` (harness) | The `Variant` contract: `mount(root, ctx)` returns a cleanup function. |
| `switcher.ts`, `stubs.ts` (harness) | The floating bar and the contact stub. |
| `variants/b-split-graph-rail.ts` | The whole section:<br>• the rail markup (`rowLanes`, `label`, `rowHtml`);<br>• the readouts (`csReadout`, `roleReadout`, `eduReadout`, `otwReadout`);<br>• the hidden radios and the default selection;<br>• `css(picks)`, which generates one selection rule group per commit;<br>• `mount`. `mount` attaches no listeners; cleanup is `section.remove()`. |
| `variants/b/graph.ts` | D's model, copied: month arithmetic (`mi`), lane `state(lane, m)`, `stretches(lane, hi, lo)`, `rows` (newest first), `tBelow(i)`, `present`, `endX`. Two changes from D:<br>• a `span` row kind for a story span that isn't a role;<br>• `NODE_Y` is 17, not 20.<br>No year groups: B has no sticky years. |
| `variants/b/style.ts` | All static CSS: the header, the layout grid, the rail rows and graph pieces, the radios, the readout frame, the figure styles, the fallback, motion. Everything is scoped under `#b`, and classes are prefixed `b-`. |
| `variants/b/diagrams.ts` | H's figures, copied unchanged: one static SVG per Case Study slug (`FIGURES[slug] = { draw, caption }`). |

### Data flow

```
ctx ──model(ctx)──▶ rows: next? · head (now+1) · edu (end+1) · entry per Role (start) · span per non-role Case Study span (start) · root
 │                  state(lane, m), stretches(lane, hi, lo), tBelow(i)
 │
 ├─ rowHtml ─▶ <ol#b-rail> one <li.b-row> per row: [graph cell (aria-hidden) | <label for=b-r-K> or a thin mono line]
 │              every <label> pushes a Pick { k, ro, hue, cs? } as a side effect, in rail order
 ├─ readouts ─▶ article.b-ro[data-ro] ×: otw? · cs-<slug> per Case Study · role-<id> per Role without one · edu
 ├─ radios ──▶ <input#b-r-K name="b-commit"> per Pick, all inside .b-radios at the top of .b-frame
 └─ css(picks) ─▶ per Pick: show its readout, tint its row, light its story's rows and its span chip, outline on focus,
                   and the readout's motion (H's), all keyed on #b:has(#b-r-K:checked)
```

### Commits, picks and readouts

**One row is one commit**, as in D. The selectable rows (`Pick`) are:

| Row | Pick key `k` | Opens readout `ro` | Hue |
| --- | --- | --- | --- |
| next (Open to Work only) | `next` | `otw` | green |
| Education (at its end) | `edu` | `edu` | sky |
| Role with a Case Study | role id | `cs-<slug>` | its Track's lane |
| Role without one (Portafolio) | role id | `role-<id>` | its Track's lane |
| Non-role span (the thesis) | `<slug>-s<i>` (index in `cs.spans`) | `cs-<slug>` | the Case Study's first role's Track |

HEAD and the root are thin, non-selectable lines.

**Colour means Track everywhere.** Engineering is mauve, Teaching peach, Education sky. A Case Study's readout takes its first role's Track colour: Blinka, GOLD → mercury and NoEstasSolx are mauve, and Teaching is peach. H's per-order hues (peach, mauve, green, sky) are gone.

**Many radios, one readout.** Several picks can open the same readout:
- Teaching opens from tutor and from instructor;
- GOLD → mercury opens from research and from the thesis (`gold-to-mercury-s1`).

The readout is rendered once (H's "one render per Case Study"). What differs per pick:
- **The span strip.** It's an `ol.b-spans` under the readout's title, with one chip per `cs.spans` entry. The chip whose `data-k` matches the checked radio is lit (`--lit:1`). A span without a role gets a dashed chip and "· not a role". Chips carry their dates; those dates are screen-reader-only from 1024 (invariant 7).
- **The story rows.** Every rail row whose `data-cs` matches the Case Study gets `--story:1`: a 2 px lane-coloured inset bar on the label and a lit `↳` tag. So selecting the tutor row also marks the instructor row as part of the same story.

### The layout

```
section#b
├─ <style>  STYLE + css(picks)
├─ .b-top               kicker, h2 + [otw signal] + CV button, intro (#b-hint), key
└─ .b-grid              one column below 1024; [rail 21rem | readout] from 1024
   ├─ .b-col
   │  └─ ol#b-rail.b-rail   li.b-row ×N: .b-g (lanes + node, aria-hidden) | label.b-lab or p.b-headline
   └─ .b-frame          the readout slot: a grid at every width
      ├─ .b-radios      the hidden radiogroup (see below)
      ├─ .b-bg          draws the frame (spans every cell)
      └─ article.b-ro ×M    display:contents; data-ro; --hue
         ├─ .b-body         display:contents
         │  ├─ .b-head  .b-titles  [.b-trace  .b-facts | .b-rwrap > .b-rmain, .b-rside]  .b-foot
         └─ figure.b-fig    (an empty div.b-fig for non-Case-Study readouts)
```

The readout is H's `display: contents` grid. Every readout's parts become items of the one `.b-frame` grid. Every readout puts its parts in the same cells, and the unselected ones are `visibility: hidden`, so each cell is as tall as the tallest readout's part. That is the reservation; no height is measured or hard-coded. The frame has three templates:

| Width | Columns | Rows |
| --- | --- | --- |
| < 640 | `pad │ body │ pad` | head / titles / **fig** / main / facts / slack (1fr) / foot / end |
| 640 – 1279 | `pad │ 20rem │ 1.5rem │ 1fr │ pad` | head / titles / main / **fig** / slack (1fr) / foot / end |
| ≥ 1280 (H's E layout) | `pad │ trace 1fr │ 1.75rem │ evidence 19rem │ pad` | head / titles / main / facts / slack (1fr) / foot / end |

Where each readout's parts go, by width:
- **Below 640:**
  - the figure sits above the trace, as in H's phone layout;
  - the facts get a row of their own;
  - the span chips stack, one per line.
- **From 640:**
  - the trace comes first, spanning the full width;
  - the figure (plate, then caption) sits in the 20 rem column, with the facts stacked in one column beside it in the same row. That saved the facts row at 768 and 1024.
- **From 1280 (H's E layout):**
  - the trace spans main → slack on the left;
  - the figure sits in `main` on the right, with the facts under it in `facts`;
  - `.b-rwrap` becomes `display: contents`. `.b-rmain` goes left (spanning main → slack) and `.b-rside` right. If `.b-rmain` is the only child (Education), it spans both columns.
- **Readouts without a Case Study** (Portafolio, Education, Open to Work): their `.b-rwrap` spans from the figure's row (or `main` from 640) down to `foot`. It starts where a Case Study's figure or trace would. Because the span includes the flexible `slack` row, it can't inflate the auto rows; its excess lands in `slack`.
- **`slack`** is the only flexible row, as in H after h1. Don't give `main`, `fig` or `facts` an `fr` size, and keep spanning items ending at `foot`.

From 1024 the outer `.b-grid` is `[minmax(0,21rem) | minmax(0,1fr)]`. Both columns stretch to the taller one, so the frame is at least as tall as the rail. At 1440 they balance (both 714 px). At 1024 the readout is taller (848).

### Selection

Selection is pure CSS: radios + `:has()`, one rule group per pick, generated by `css(picks)`.
- **Shown:** `#b:has(#b-r-K:checked) .b-ro[data-ro="RO"]` gets `visibility: visible`, and its `.b-fig`, `.b-body > *` and `.b-rwrap > *` get opacity 1. Opacity goes on the parts because `display: contents` elements have no box.
- **Rail:** the selected row gets `--on:1` (label tint 11 % of its lane colour, node `scale: 1.25` with a ring). The Case Study's rows get `--story:1`, and the matching chip gets `--lit:1`.
- **Focus:** `:has(#b-r-K:focus-visible)` draws the lavender outline on that row's label.
- **Frame tint:** `--sel` is set to the pick's hue.
- **Motion:** H's motion rules (trace steps, figure draw-in, comet) hang off the same `:checked` selector for Case Study readouts. Other readouts get a plain fade-up.
- **Default:** the first Case Study pick in rail order (Blinka) is `checked`; with Open to Work, `next` is.

On the real site, `css()` becomes one static stylesheet; it's generated only because the prototype mounts from TS.

### The radios, and the phone tap-to-readout trick

The radios are **not** next to their labels. They all sit in `.b-radios`, the first child of `.b-frame`. Each one is named by `aria-labelledby` = its row's title and "where" spans; the labels reach them with `for`.

**Why:** on phones the readout slot is below a rail about 700 px tall, so tapping a row would change a readout the reader can't see. Instead:
- **Below 1024:** `.b-radios` is absolutely positioned at the top of the frame (`top: -.75rem`), and each radio is a 1 px wide box `calc(100svh - 1.5rem)` tall, opacity 0, `pointer-events: none`. Tapping a `<label for>` focuses its radio. The browser then scrolls the focused element into view "if needed", centring it. Because the box is nearly a viewport tall, centring it puts the frame's top about 1 rem below the viewport top. Measured in Chromium with touch emulation: after tapping the tutor row, the frame's top lands 36 px from the viewport top. Each readout's footer has an "↑ all roles" link (`href="#b-rail"`) back to the rail, below 1024 only.
- **From 1024:** `.b-radios` is `position: fixed; top: 50%`, so the radio is always in the viewport and focusing it never scrolls the desktop page. The readout is beside the rail anyway.
- **Keyboard:** Tab goes from the CV button to the checked radio, then to the readout's links. Arrow keys walk the radios in DOM order, which is rail order (newest first).

### No runtime behaviour

There are no listeners, observers, timers or frames. Everything after `mount` is CSS:
- radios + `:has()` for selection;
- `view-timeline` for D's lane draw and node pop;
- H's view gate for the readout motion;
- `<a>` for navigation.

## Invariants (keep these)

### Carried over from H (Selected Work)

1. **Reserved slot, no reflow.** Switching commits must not change the section's height or move anything outside the readout.
   - Reveal only with `visibility`, `opacity` or `transform`.
   - Never `display: none` a readout.
   - Every readout's parts go in the shared cells.
   - **Check:** select every radio at 360, 768, 1024 and 1440, with Open to Work off and on; `[data-work-history-slot]` must have one height per width (`b-measure.mjs`).
2. **One render per Case Study.** Each Case Study's figure and text exist once in the DOM, however many commits open it. Don't duplicate anything to get a different placement per breakpoint; place the single element with grid.
3. **CSS only (ADR 0002).** See "No runtime behaviour" above. Adding a listener, observer or frame loop reopens ADR 0002; don't, without asking. The `@supports not selector(:has(*))` fallback must keep working: every readout in normal flow, each framed.
4. **No number printed twice in one view.** Counts live in `facts` for Case Studies and in `highlights` for roles without one.
   - The rail prints **no counts** at all, only dates.
   - The figures draw counts but never print them, as in H: any number a figure uses comes from `facts` via `fact()`.
   - Only Portafolio's readout shows role highlights. Blinka's, NoEstasSolx's, the tutor's, the instructor's and research's highlights aren't shown anywhere in B. The Teaching facts (150+, 40+) and the GOLD fact (200+) say the same counts, so showing both would print them twice. See Known issues.
5. **The selected readout fits one screen on desktop.** At 1440 and 1024 the whole readout, figure included, is under 900 px (714 and 848). If something doesn't fit, cut or tighten; don't let the frame grow.
6. **Reduced motion is the complete final state.**
   - `ctx.reducedMotion` means `.b-anim` is never added.
   - All motion sits inside `@media (prefers-reduced-motion: no-preference)`, and `reduce` kills every animation and transition in `#b`.
   - Lines are whole and comets invisible without motion; no dash pattern is applied outside the motion rules.
   - Rows are fully drawn.

### Carried over from D (Timeline)

7. **Lanes.**
   - Left to right: the second Track (Teaching, peach) at x 10, the **Education trunk** (sky) at 32, the first Track (Engineering, mauve) at 54, in a 64-unit space emitted as `%` of the graph column.
   - Positions are keyed from `ctx.tracks` order.
   - The Tracks fork *off* the trunk and are never *in* it.
8. **Gap fractions are honest; row spacing is not time.** Within each row-to-row stretch, solid (in a role) and dotted (between roles) are proportional to months. End months are inclusive (`endX = end + 1`; "present" is `now + 1`).
9. **Lanes are continuous.**
   - Every vertical pixel of `#b-rail` is a `.b-row` that paints the lanes.
   - Rows have no margins and the list has no gap; spacing is padding inside the label (`6px 10px 7px`) or the thin line (`8px 10px 6px`).
   - Any new element in the rail must be a `.b-row` with lanes.
10. **The same organization never becomes a heading.** A row's line 1 is its own title. Line 2 leads with `context` (or the organization if there's none) in the lane colour, then the organization.
11. **Hover never changes layout.**
    - Calm focus only touches `background-color` (label), `scale` and `box-shadow` (node), and `opacity` (other lanes).
    - **Check:** hover every row at 360 and 1440; the section and rail heights must not change (`b-kbd.mjs`).
12. **Fill mode `forwards` and ranges from `cover 0%`** on the rail's scroll-driven animations (D's gotchas apply unchanged).

### B's own

13. **Every Role, the degree and every non-role span is a commit in the rail, scannable without a click.** That's the Recruiter's half: a phone reader sees the whole record in the rail (714 px at 360) before any readout.
14. **A span without a role is a commit on the Education trunk**, never a branch and never a Role. It is derived from `cs.spans` entries without `role` (`graph.ts`, `loose`), not hard-coded. Its node is hollow sky, and its line 2 is "inside the degree · not a role".
15. **A Case Study with several commits reads as one story.**
    - All its commits open the one readout.
    - The span strip shows every span in time order, with the entered one lit.
    - The rail marks all its rows (`--story`) while any of them is selected.
    - Never two readouts of one story, and never a story hanging off one row while its other row is orphaned.
16. **Open to Work changes emphasis only inside the section**, and the readout slot keeps its size. Exactly what it does:
    - a green dashed `next` commit appears above HEAD (D's curves into the lanes that are active now), and **it is selected by default instead of the newest Case Study**, so depth is one click away;
    - its readout is a Recruiter summary: `openToWorkCopy.sentence`, "right now" (present roles, with start dates), the degree with "finished Mar 2026", and "the record" (each Track's role count and first start, derived from `ctx`);
    - the header gains a green "● open to roles" pill beside the h2, and the CV button turns green;
    - the rail's dates go from `--faint` to `--text`.
17. **One CV button,** on the h2 row, in both modes. Never a second one near it (D learned that). The Open to Work readout doesn't repeat it.
18. **Draft copy is marked unobtrusively.** In the rail it's a small dashed peach "draft" tag after the title (`role.draft`). In the readout it's H's draft mark with `cs.draft.reason`.
19. **Accessibility.**
    - Structure:
      - an `h2`;
      - the rail as an `ol` (aria-label "Roles and education, newest first") of labels with `<time datetime>`;
      - a `role="radiogroup"` of real radios;
      - each readout an `article` labelled by its `h3`.
    - What's hidden from sight stays for screen readers:
      - the graph cells are `aria-hidden`;
      - the rail's durations are `sr-only`;
      - each Track is named in words on its rows;
      - the readout dates are `sr-only` from 1024.
    - Hidden readouts are `visibility: hidden`, so they're out of the tab order and the accessibility tree.

### What changed from H and D

| From | Was | In B |
| --- | --- | --- |
| H | One radio per Case Study, a q₀–q₃ rail of four states | One radio per **commit** (8, or 9 with Open to Work); several radios can open one readout |
| H | Rail and radio interleaved (`input + label`) | All radios together at the top of the readout slot; labels reach them with `for` (the phone trick) |
| H | One breakpoint (1024), no blend | Three frame templates (< 640, 640–1279, ≥ 1280) plus the outer split at 1024 |
| H | Hues by order (peach, mauve, green, sky) | Colour means Track (mauve, peach, sky, plus green for Open to Work) |
| H | Panel header hides the period on desktop | The same rule, as `.b-dt`: readout dates are `sr-only` from 1024 |
| H | Phones: horizontal rail on top, figure slot, panel | Phones: the full vertical graph, then one readout slot below it, reached by the focus-scroll trick |
| D | Year groups with giant sticky outlined years (lg+), `h3` per year | No year groups and no sticky years; every row prints its own dates |
| D | Each row a full card (meta, title, where, summary, lead highlight, "+N more", case-study link) | Each row a three-line label: title, where, dates + `↳ Case Study` tag. Summaries and highlights moved into the readout (or dropped; invariant 4) |
| D | `NODE_Y` 20, centred on the meta line | `NODE_Y` 17, centred on the title (`6px` padding + 22 px line ÷ 2) |
| D | Graph column 64 px from `sm` | 48 px at every width (D's phone geometry) |
| D | Durations shown from `sm` | Durations `sr-only` everywhere in the rail |
| D | The `next` row carries the CV link | The `next` row is a selectable commit; the CV stays in the header |
| D | `$ git log --graph --all` kicker types itself out | Static kicker |

## Tuned numbers and why

### Layout
- **Rail column 21 rem (336 px) from 1024.** The text column is then about 258 px (336 − 48 graph − 10 gap − 20 label padding).
  - At 20 rem, "GOLD-python · Universidad de los Andes" wrapped.
  - Line 2 still wraps on Instructor ("Continuing Education · Universidad de los Andes") and Programming Tutor at any width under about 22.5 rem.
  - Nicolas wants this column to breathe more; see [Next](#next).
- **Gap between rail and readout** is `clamp(1.75rem, 3.2vw − .5rem, 2.5rem)`.
- **Frame's evidence column** is 19 rem from 1280. That's H's number: the about-300 px figures render at about 1:1, so SVG labels stay about 11 px.
- **The figure column from 640 to 1279 is 20 rem,** with the facts beside it in `1fr`. The facts are a single column there, because two side by side in about 200 px wrapped their labels.
- **The split readout starts at 1280, not 1024.** With the 21 rem rail, the panel at 1024 is about 593 px. H's trace | evidence split there would leave the trace about 213 px wide.
- **`--pad`** is 1 rem below 640 and 1.5 rem from 640.
- **Section padding** is `py-14 sm:py-16`, and the header-to-grid gap is 1.75 rem, 2 rem from 1024.

### Rail rows
- **Label:**
  - padding `6px 10px 7px`;
  - title 15 px / 22 px, weight 500;
  - "where" 13 px / 18 px;
  - dates line mono 11 px / 18 px, with the `↳` tag right-aligned on the same line.
- **The tag and the dates share line 3.** On line 1, the tag squeezed the titles to two lines; on line 3 with the durations, it wrapped. Dropping the durations to `sr-only` is what made line 3 fit.
- **Typical row heights:** 74 px (three lines), 92 px (line 2 wraps), 98 px (Education, whose degree title takes two lines). Thin rows (HEAD, root) are about 32 px.
- **`NODE_Y = 17`:** the 6 px top padding plus half the 22 px title line. Thin rows use `padding-top: 8px` with an 18 px line, which also centres at 17. Change one, change the other.
- **Selected row:** label tint 11 % of the lane colour (13 % read heavy in light mode). The node goes to `scale 1.25` with a ring of `3px + 5px` at 30 %.
- **Hover:** label tint 7 % (11 % on the selected row); node `scale 1.2` with a 7 px ring at 30 %; other lanes' segments and curves drop to 0.3 opacity.
- **Story bar:** a 2 px inset `box-shadow` on the label's left edge, in the lane colour, at `--story` × 100 %.
- **Nodes:**
  - entry: 12 px filled;
  - HEAD tip: 13 px hollow;
  - Education: an 11 px diamond;
  - span: an 11 px hollow ring, with a 2 px sky border;
  - root: 8 px;
  - next: 18 px dashed green.
  - All have a 3 px `--bg` ring that cuts the lane.
- **The fork curve** is 34 px tall (D's was 40), `viewBox 0 0 64 34`, so it ends well inside the shortest (74 px) row.

### Readout
- Mostly H's type: trace 14 px / 1.55 (14.5 / 1.6 from 1280); title 1.375 rem (1.5 rem from 1024); facts mono 1.125 rem with labels at 12 px.
- **Span chips:** mono 11 px; lit at 70 % hue border and 12 % hue fill.
- **Chip dates:** `range()` gives "Aug – Dec 2022" within a year, "Aug 2023 – May 2024" across years, "Aug 2025 – now" for the present; each date sits in a `<time>`.

### Motion
- **Readout:** H's numbers, unchanged.
  - Trace steps fade up over 0.42 s, staggered 110 ms; the trace rail grows over 0.5 s.
  - Figure lines draw in 0.8 s; nodes fade 0.45 s; services and steps fade 45 ms apart after 0.35 s.
  - The comet runs over 1.3 s after 0.7 s.
  - Non-Case-Study readouts get only the 0.42 s fade-up.
- **View gate (H's):**
  - `.b-frame` runs `b-gate` on `view()` over `entry 0px entry 200px`, flipping the registered `--b-play` from `paused` to `running`.
  - `@container style(--b-play: paused)` pauses everything inside the frame until then.
  - Verified with the hero on: `paused` before the section is in view, `running` after.
- **Rail (D's):**
  - lanes draw over `cover 0%` → `contain 120px`, with the clip front pinned 120 px above the viewport's bottom edge;
  - nodes pop over `cover 0%` → `cover 150px`.
  - D's card settle and kicker typing were dropped.

## Heights

Measured on `[data-work-history-slot]`, hero off, headless Chromium (overlay scrollbars), reduced motion. Every commit gives the same height (invariant 1). "H + D" is the two baselines stacked, as they stood before the fusion (H at h1, D at iteration 1).

| Width | B | B, `otw=1` | Rail | Readout frame | H + D | B as share |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | **2,307** | 2,423 | 714 (788 otw) | 1,230 | 1,407 + 2,619 = 4,026 | 57 % |
| 768 | **1,806** | 1,880 | 654 (728) | 832 | 1,133 + 2,179 = 3,312 | 55 % |
| 1024 | **1,145** | 1,145 | 714 (788) | 848 | 873 + not measured | |
| 1440 | **1,011** | 1,085 | 714 (788) | 714 (788; set by the rail) | 815 + 1,752 = 2,567 | 39 % |

What sets each row (from `b-rows.mjs`):
- **1440:** the readout's natural height is about 685, so the rail (714) sets the frame and the trace's excess goes to `slack`. The trace column is about 332 px wide, so the Case Study traces are 370–417 px tall. With Open to Work, the rail grows by the `next` row (74 px) and sets the frame at 788.
- **1024:** the readout sets the frame (848), made up of:
  - head 43;
  - titles 107 (Teaching's three-line role line and two chips);
  - trace 266;
  - figure 244 (GOLD), with the facts beside it;
  - foot 89 (GOLD's two outside links);
  - plus margins and the 20 px end row.
- **360:** the frame is 1,230, made up of:
  - head 85 (Blinka's draft mark wraps to a second line);
  - titles 200 (GOLD and Teaching: a two-line `h3`, a two-to-three-line role line, two stacked chips);
  - figure 230;
  - trace 417;
  - facts 71;
  - foot 113 (GOLD);
  - plus margins.
  The rail is 714. Portafolio's and Education's readouts are far shorter but reserve the same space.

**Levers left:**
- Blinka's phone draft header could fit on one line (−20 px at 360). H shows the reason in full, though.
- Shorter `role` lines in `content.ts` would cut the titles row (Teaching's "Instructor, Continuing Education; before that, programming tutor" is three lines on phones). That's a content edit, not a variant edit.
- A two-column rail at 768 would roughly halve the rail there.
- Widening the rail (Nicolas's ask) pushes the other way. At 1440, every rem added to the rail takes 16 px from the trace column, and the trace sets the readout at 1280+.

## Gotchas

- **H's and D's gotchas apply unchanged:**
  - never animate `fill`, `stroke` or `background` between `color-mix()` values;
  - `opacity` does nothing on a `display: contents` element;
  - animated custom properties can't drive `animation-*` through `var()`, which is why the gate uses a style query;
  - never pause `.b-frame` itself, only `.b-frame *`;
  - fill mode `forwards` and ranges from `cover 0%` on the rail;
  - no border-radius on lane segments;
  - any margin in the rail breaks lane continuity;
  - named timelines are scoped to descendants;
  - grid items stretch to their row, so measure with `align-self: start` injected (`b-rows.mjs`);
  - clones appended outside `#b` lose every scoped style, so don't measure clones.
- **Adding a part under a readout:**
  - **`.b-ro` or `.b-body`:** add it to the `:is(.b-fig, .b-body > *, .b-rwrap > *)` list in `css()`, or it stays at opacity 0.
  - **`.b-rwrap`:** it's a flex column below 1280 and `display: contents` from 1280. Its children must have a grid placement in the XL block.
- **Picks are collected as a side effect of rendering the rail.** `label()` pushes each `Pick` while `rowHtml` runs, so `radios` and `css(picks)` must be built after `rail`. The radios' DOM order (arrow-key order) is the rail's order.
- **Pick keys must match chip keys.** A chip's `data-k` is `spanKey(cs, span)`: the role id, or `<slug>-s<index>`. That's the same function that keys the span row's radio. If you change one, change the other, or the lit chip silently disappears.
- **Don't put the radios back next to their labels** without replacing the phone trick. On phones the tap would then change a readout 700 px below the fold with no sign of it.
- **`position: fixed` on the radios (from 1024)** assumes no ancestor with a `transform`, `filter`, `contain` or `will-change: transform`. With one, `fixed` becomes relative to that ancestor, the radio can sit off screen, and every desktop click scrolls the page. The harness has none; the real site's layout must keep it that way.
- **The tap-scroll trick relies on the browser focusing a radio on a label tap, then scrolling it into view.** Chromium does both. iOS Safari is **unverified**; Safari doesn't focus some controls on click. If it doesn't, the readout still changes, but nothing scrolls. See Known issues.
- **`color-mix()` with `calc()` percentages** (`calc(var(--on) * 11%)`) drives the row, chip and tag states. It works in current Chromium. If a browser rejects it, the declaration is dropped, so the state shows no tint, but nothing breaks.
- **Testing the no-`:has()` fallback.** In the page, rewrite `#b style`'s text, replacing `selector(:has(*))` with `selector(:nope-x)` (`b-fallback.mjs`). Every readout must show in flow and framed. The rail rows then select nothing.
- **Other agents' files can break the page.** The route loads every variant's name before mounting, so a broken file elsewhere in `variants/` fails the whole page. Dev-server HMR reloads also reset scripted clicks mid-test. Retry before debugging B.
- **Stale Tailwind classes in the dev server.** B keeps almost all styling in its own `<style>` for this reason; the few Tailwind classes (`sr-only`, `mt-3`, `mt-4`, `text-lavender`, `text-text`, the section padding) are common. If you add an arbitrary-value class in a `.ts` template, `touch src/styles/global.css`, hard-reload, and check `getComputedStyle`.
- **`ctx.now` is the page-load month** in the harness. On the real site it's the build date, so HEAD and "now" are as fresh as the last build.
- **Screenshots with motion on:** the rail's bottom rows are mid-draw in the bottom 150 px of the viewport. Use `reducedMotion: "reduce"` for layout stills, and wait about 2.8 s after a selection for H's draw and comet.

## Known issues

1. **Reservation leaves blank space in short readouts.**
   - Portafolio, Education and the Open to Work summary are much shorter than a Case Study, but they reserve the same slot.
   - It's worst on a phone with Open to Work: the default readout is a short summary in a frame about 1,230 px tall.
   - Options: don't reserve for non-Case-Study readouts on phones (this breaks invariant 1 there), or drop the Open to Work readout on phones, since the header pill and the `next` row already say it.
2. **The titles row reserves for the tallest title block** (Teaching's role line plus two chips). That leaves a 20–40 px gap between a single-chip readout's chip and its trace at 1024 and 1440.
3. **Line 2 wraps on Uniandes rows** (Instructor, Programming Tutor, and Research Assistant below 21 rem). The organization is kept (invariant 10) rather than truncated.
4. **Role highlights are mostly unreachable.**
   - Only Portafolio's readout shows its highlights.
   - The other roles' highlights aren't shown anywhere: the Case Study readout shows the story and `facts` instead (invariant 4).
   - Several of those highlights are soft lines a Recruiter might want, for example "Review and approve every PR the team ships". Count-free ones could appear in the Case Study readout without breaking the no-number-twice rule.
5. **The Education readout is thin.** It has the degree, the institution, "Beside the Tracks", one line about the trunk, where each Track forks, and the thesis pointer. Nicolas noticed (see Next).
6. **Screen readers hear each role twice.** The rail list reads as text, and each radio is named by the same row's title and "where" (`aria-labelledby`). Nobody has done a real screen-reader pass. `display: contents` semantics on `article.b-ro` rely on current browsers, as in H.
7. **The phone tap-to-readout scroll is unverified outside Chromium.** If iOS Safari doesn't focus radios on label taps, the fix is one `change` listener calling `scrollIntoView` on the frame below 1024, about 150 bytes gzipped. That would reopen ADR 0002; ask first.
8. **Copy that isn't from `content.ts`** (UI words, not facts):
   - the intro "Every role and my degree, newest first. Select a commit to read its story.";
   - "inside the degree · not a role";
   - "Beside the Tracks", "The trunk of the graph. Both Tracks branch off it; neither is part of it.";
   - "Inside it: … a commit on the trunk, not a role. It's the second half of …";
   - the Open to Work line "Every role and my degree are on the graph. Select one for its story; the CV has all of it.";
   - "no Case Study";
   - "↑ all roles".
   `openToWorkCopy.aside` ("The whole record is below…") isn't used: in B the record is beside the readout on desktop and above it on phones.
9. **The git jokes** (HEAD, "uncommitted", the `$ git log` kicker, "commit") are D's. They may not land with a Recruiter; the plain words beside them carry the meaning.
10. **Firefox and Safari support** for `animation-timeline`, style queries and `calc()` inside `color-mix()` is unverified. Without them, the rail is simply drawn, the readout motion runs on load, and the state tints may vanish. Nothing is left hidden.
11. **Two Tracks are assumed** (D's known issue 3). The lane positions are "second Track, trunk, first Track".

## Next

Nicolas's asks from the round-1 verdict, not yet done:

1. **"Give the left bit more room to breathe, it's a lot of text."** The rail is dense: three lines per row, 13 px "where" lines that wrap, and a mono dates line with a tag. Levers:
   - widen the rail (each rem costs the trace 16 px at 1440, and the trace sets the readout from 1280; re-measure 1024 and 1440);
   - more padding between rows (padding only: invariant 9);
   - fewer words per row, e.g. the organization once per run of same-org rows. Invariant 10 and D's README argue against hiding Uniandes; ask.
   - Keep the rail and the readout balanced at 1440 (today both are 714).
2. **"Unsure if I will be doing detail pages for every single as a case study."** Today every Case Study links `cs.href` (`/work/<slug>`), and the readout is built as a teaser for that page. If some Case Studies get no page, the readout has to stand alone for them. Options:
   - drop the "Read the Case Study →" link per Case Study, based on a flag the content would need (ask; don't edit `content.ts` from the variant);
   - let the readout carry more of the story (the readout already has problem → did → outcome, facts and outside links);
   - reconsider what "Case Study" means in `CONTEXT.md` with Nicolas (a domain decision).
3. **"The bachelor's feels a little incomplete compared to the rest of the page."** The Education readout is the thinnest (Known issue 5), and the rail's Education row has no summary. The data has only `institution`, `degree`, `start`, `end` and `location`. Anything richer (coursework, the thesis title, honours) needs content from Nicolas. Derivable now:
   - the thesis as a proper chip;
   - which roles ran during the degree;
   - the two forks drawn as a small figure, like the Case Studies.
   Ask before inventing.
