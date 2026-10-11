// PROTOTYPE: throwaway. Variant F's instrument strip: C's console (stat tiles, trace waterfall with
// playhead, log tail), docked along the bottom of the hero and driven by the same clock as the scene.
import type { Run, RunState } from "../../model";
import { toneOf } from "../d/flavor";
import { CHAR_MS, type Plan, cursorAt, durText, q, reqAt, ticks } from "./plan";

const SERVICE: Record<RunState["id"], string> = {
  lookup: "dns", connect: "tcp", secure: "tls", edge: "edge", firstByte: "edge", delivered: "browser", cached: "browser",
};

export const hue = (s: RunState) => `var(--${toneOf(s)})`;
const mix = (c: string, pct: number, base = "transparent") => `color-mix(in srgb, ${c} ${pct}%, ${base})`;
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const STRIP_STYLE = `
@keyframes fdock-blink { 50% { opacity: 0 } }
.fdock-cursor { animation: fdock-blink 1.05s steps(1) infinite; }
.fdock-x { transition: opacity .15s ease, background-color .15s ease; }
@media (prefers-reduced-motion: reduce) { .fdock-cursor { animation: none; } .fdock-x { transition: none; } }
`;

export interface Strip {
  el: HTMLElement;
  /** Elements that select a state on hover/tap, tagged with data-f-i. */
  rows: HTMLElement[];
  replay: HTMLButtonElement | null;
  render(t: number, active: number | null): void;
  reset(): void;
}

export function buildStrip(run: Run, P: Plan, reducedMotion: boolean): Strip {
  const states = run.states;
  const n = states.length;
  const D = P.domain;
  const pct = (v: number) => (D > 0 ? (v / D) * 100 : 0);
  const example = run.kind === "example";
  const m = run.meta;
  const where = m.city && m.colo ? `${m.city} · ${m.colo}` : (m.colo ?? "—");
  const tk = ticks(D);
  const service = (s: RunState) => (s.id === "connect" ? ((m.http ?? "").includes("3") ? "quic" : "tcp") : SERVICE[s.id]);
  const totalLabel = P.total !== undefined ? `${P.total} ms` : "unknown";
  const tile = "bg-surface px-4 py-2.5 sm:px-8 lg:py-2 lg:pl-14 lg:pr-4";
  const head = (a: string, b: string) =>
    `<div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs sm:px-8 lg:px-5"><span class="text-muted">${a}</span><span class="text-faint">${b}</span></div>`;

  const el = document.createElement("div");
  el.className = "relative z-10 border-t border-border bg-surface";
  el.innerHTML = `
<div class="mx-auto w-full max-w-[1600px]">
  <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-4 py-2.5 sm:px-8 lg:flex-nowrap lg:px-14">
    <h2 id="f-console" class="flex shrink-0 items-baseline gap-2.5 text-sm"><span class="font-mono text-text">GET /</span><span class="text-muted">${example ? "a page load, traced" : "your page load, traced"}</span></h2>
    <p data-inspect aria-hidden="true" class="order-last -mx-4 min-h-[3.25rem] w-[calc(100%+2rem)] border-t border-border px-4 pt-2 font-mono text-xs leading-[18px] sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 lg:order-none lg:mx-0 lg:min-h-0 lg:w-auto lg:min-w-0 lg:flex-1 lg:truncate lg:border-0 lg:p-0"></p>
    <div class="flex min-w-0 items-center gap-3 font-mono text-[11px] lg:shrink-0">
      ${
        example
          ? `<span class="rounded-sm border border-dashed border-border px-2 py-0.5 text-muted">example run<span class="text-faint"> · your real request appears on the live site</span></span>`
          : `<span class="flex items-center gap-1.5 text-muted"><span class="size-1.5 rounded-full bg-green"></span>live · your request</span>`
      }
      ${reducedMotion ? "" : `<button data-replay type="button" class="whitespace-nowrap rounded-sm border border-border px-2 py-0.5 text-muted hover:border-faint hover:text-text focus-visible:outline-2 focus-visible:outline-lavender" aria-label="Replay the request animation">↻ replay</button>`}
    </div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1.15fr)_minmax(0,1fr)]">
    <div aria-hidden="true" class="grid grid-cols-2 content-start gap-px border-b border-border bg-border lg:grid-cols-1 lg:border-b-0 lg:border-r">
      <div class="${tile}">
        <div class="font-mono text-[11px] text-faint">total</div>
        <div class="mt-0.5 flex items-baseline gap-1 font-mono tabular-nums"><span data-total class="text-3xl leading-none">0</span><span class="text-xs text-muted">ms</span></div>
      </div>
      <div class="${tile}">
        <div class="font-mono text-[11px] text-faint">edge</div>
        <div class="mt-1 truncate font-mono text-sm text-text">${esc(where)}${m.edgeCache ? ` <span class="text-faint">· ${m.edgeCache}</span>` : ""}</div>
      </div>
      <div class="${tile}">
        <div class="font-mono text-[11px] text-faint">protocol</div>
        <div class="mt-1 truncate font-mono text-sm text-text">${esc(m.http ?? "—")}</div>
      </div>
      <div class="${tile}">
        <div class="font-mono text-[11px] text-faint">tls</div>
        <div class="mt-1 truncate font-mono text-sm text-text">${esc(m.tls ?? "—")}</div>${m.kex ? `<div class="truncate font-mono text-[11px] text-faint">${esc(m.kex)}</div>` : ""}
      </div>
    </div>

    <div aria-hidden="true" class="min-w-0 border-b border-border lg:border-b-0">
      ${head("trace", `${n + 1} spans`)}
      <div class="relative px-4 pb-4 pt-1 [--lab:5.5rem] [--pad:3.25rem] sm:px-8 sm:[--lab:9.5rem] lg:px-5">
        <div class="pointer-events-none absolute bottom-4 top-1 left-[calc(1rem+var(--lab))] right-[calc(1rem+var(--pad))] sm:left-[calc(2rem+var(--lab))] sm:right-[calc(2rem+var(--pad))] lg:left-[calc(1.25rem+var(--lab))] lg:right-[calc(1.25rem+var(--pad))]">
          ${tk.map((v) => `<div class="absolute inset-y-0 border-l border-dashed border-border" style="left:${pct(v)}%"></div>`).join("")}
          <div data-playhead class="fdock-x absolute inset-y-0 w-px bg-text/60" style="left:0"></div>
        </div>
        <div class="grid grid-cols-[var(--lab)_1fr]">
          <div></div>
          <div class="relative mr-[var(--pad)] h-6 font-mono text-[10px] text-faint">
            ${tk.map((v, i) => `<span class="absolute top-1 ${i === 0 ? "" : "-translate-x-1/2"} ${i % 2 ? "hidden sm:block" : ""} whitespace-nowrap" style="left:${pct(v)}%">${v}${i === 0 ? " ms" : ""}</span>`).join("")}
          </div>
        </div>
        <div data-wf-root class="grid grid-cols-[var(--lab)_1fr]">
          <div class="flex items-center truncate pr-2 font-mono text-[12px] text-text">GET /</div>
          <div class="relative mr-[var(--pad)] h-6">
            <div data-bar class="absolute top-1/2 h-2 -translate-y-1/2 rounded-[2px] border-l-2 border-muted bg-text/10" style="left:0;width:0"></div>
            <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 font-mono text-[11px] text-muted" style="left:0"></span>
          </div>
        </div>
        ${states
          .map(
            (s, i) => `
        <div data-wf="${i}" data-f-i="${i}" class="fdock-x grid cursor-default grid-cols-[var(--lab)_1fr] rounded-sm">
          <div class="flex items-center gap-2 truncate pl-2 pr-2 text-[13px] sm:pl-3"><span class="hidden w-12 font-mono text-[11px] text-faint sm:inline">${service(s)}</span><span data-lab class="text-muted">${esc(s.label)}</span></div>
          <div class="relative mr-[var(--pad)] h-6">
            ${
              s.durationMs !== undefined && !s.skipped
                ? `<div data-bar class="absolute top-1/2 h-2 -translate-y-1/2 rounded-[2px] border-l-2" style="left:${pct(P.start[i])}%;width:0;border-color:${hue(s)};background:${mix(hue(s), 40)}"></div>`
                : `<div data-bar class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${s.skipped ? "border-dashed" : ""}" style="left:${pct(P.start[i])}%;border-color:${hue(s)};background:${s.skipped ? "transparent" : mix(hue(s), 50)}"></div>`
            }
            <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] text-muted"></span>
          </div>
        </div>`,
          )
          .join("")}
      </div>
    </div>

    <div aria-hidden="true" class="min-w-0 lg:border-l lg:border-border">
      ${head("logs", "tail -f")}
      <div class="px-2 pb-4 pt-2 font-mono text-[12px] leading-5 sm:px-6 lg:px-3">
        ${states
          .map(
            (s, i) => `
        <div data-log="${i}" data-f-i="${i}" class="fdock-x grid cursor-default grid-cols-[3.25rem_1fr] gap-3 rounded-sm px-2 py-0.5">
          <span class="text-right tabular-nums text-faint">+${P.start[i]}ms</span>
          <span data-msg class="grid border-l-2 pl-3 break-words" style="border-color:var(--border)">
            <span data-ghost class="invisible [grid-area:1/1]">${esc(s.log)}</span>
            <span data-typed class="[grid-area:1/1]"></span>
          </span>
        </div>`,
          )
          .join("")}
      </div>
    </div>
  </div>
  <ol class="sr-only">
    ${states.map((s) => `<li>${esc(s.label)}: ${esc(durText(s, run))}. ${esc(s.log)}</li>`).join("")}
    <li>Total: ${esc(totalLabel)}.${example ? " This is an example run; your real request appears on the live site." : ""}</li>
  </ol>
</div>`;

  const $ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = el) => from.querySelector<T>(sel)!;
  const inspect = $("[data-inspect]");
  const totalEl = $("[data-total]");
  const playhead = $("[data-playhead]");
  const rootRow = $("[data-wf-root]");
  const rootBar = $("[data-bar]", rootRow), rootDur = $("[data-dur]", rootRow);
  const wf = states.map((_, i) => {
    const row = $(`[data-wf="${i}"]`);
    return { row, bar: $("[data-bar]", row), dur: $("[data-dur]", row), lab: $("[data-lab]", row) };
  });
  const logs = states.map((_, i) => {
    const row = $(`[data-log="${i}"]`);
    return { row, typed: $("[data-typed]", row), ghost: $("[data-ghost]", row), msg: $("[data-msg]", row) };
  });
  const typedCache = states.map(() => -1);
  let lastInspect = "";

  function render(t: number, act: number | null) {
    const req = reqAt(P, t);
    const done = t >= P.endT;
    const cur = cursorAt(P, t);

    // Stat: ticking total, colored by a Grafana-style threshold.
    totalEl.textContent = D > 0 ? `${done && P.total !== undefined ? P.total : Math.round(req)}` : "—";
    totalEl.style.color = D === 0 ? "var(--text)" : req < 300 ? "var(--green)" : req < 1000 ? "var(--peach)" : "var(--red)";

    // Waterfall.
    playhead.style.left = `${pct(req)}%`;
    playhead.style.opacity = done || t === 0 ? "0" : "1";
    rootBar.style.width = `${pct(req)}%`;
    rootDur.style.left = `${pct(req)}%`;
    rootDur.textContent = t > 0 ? `${Math.round(req)} ms` : "";
    states.forEach((s, i) => {
      const { row, bar, dur, lab } = wf[i];
      const entered = t >= P.enter[i];
      const isBar = s.durationMs !== undefined && !s.skipped;
      bar.style.opacity = entered ? "1" : "0";
      let label = "";
      if (isBar) {
        const elapsed = Math.max(0, Math.min(req, P.end[i]) - P.start[i]);
        bar.style.width = `${pct(entered ? elapsed : 0)}%`;
        label = entered ? `${Math.round(elapsed)} ms` : "";
      } else if (entered) label = durText(s, run) === "no data" ? "" : durText(s, run);
      dur.textContent = label;
      // Duration label sits after the span, or before it when the span ends near the axis edge.
      const finalEnd = pct(isBar ? P.end[i] : P.start[i]);
      const nowEnd = pct(isBar ? Math.max(P.start[i], Math.min(req, P.end[i])) : P.start[i]);
      // A long span that starts near the axis origin carries its label inside its own right end.
      const inside = finalEnd > 78 && isBar && pct(P.start[i]) < 25;
      if (inside) { dur.style.left = ""; dur.style.right = `calc(${100 - nowEnd}% + 6px)`; }
      else if (finalEnd > 78) { dur.style.left = ""; dur.style.right = `calc(${100 - pct(P.start[i])}% + 8px)`; }
      else { dur.style.right = ""; dur.style.left = `calc(${nowEnd}% + ${isBar ? 6 : 10}px)`; }
      dur.style.color = inside ? "var(--text)" : "";
      lab.className = entered ? "text-text" : "text-muted";
      row.style.opacity = act !== null && act !== i ? "0.35" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 14) : "";
    });

    // Log tail: each line types out from the moment the token enters its state.
    states.forEach((s, i) => {
      const { row, typed, ghost, msg } = logs[i];
      const entered = t >= P.enter[i];
      const k = entered ? Math.min(s.log.length, Math.floor((t - P.enter[i]) / CHAR_MS)) : 0;
      const showCursor = !reducedMotion && entered && i === cur && !done;
      const key = k * 2 + (showCursor ? 1 : 0);
      if (typedCache[i] !== key) {
        typedCache[i] = key;
        typed.textContent = s.log.slice(0, k);
        if (showCursor) typed.insertAdjacentHTML("beforeend", `<span class="fdock-cursor text-muted">▍</span>`);
      }
      typed.style.color = s.skipped ? "var(--muted)" : "var(--text)";
      // Selecting a state the token hasn't reached yet previews its line, ghosted.
      const preview = act === i && k < s.log.length;
      ghost.className = `[grid-area:1/1] ${preview ? "text-faint" : "invisible"}`;
      typed.style.visibility = preview ? "hidden" : "";
      msg.style.borderColor = entered ? hue(s) : "var(--border)";
      row.style.opacity = act !== null && act !== i ? "0.35" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 14) : "";
    });

    // Inspector: the log line of whichever state is selected.
    const html =
      act !== null
        ? `<span class="text-faint">${q(act)}</span> <span class="text-text">${esc(states[act].label)}</span> <span class="text-faint">·</span> <span class="text-muted">${esc(durText(states[act], run))}</span><br class="lg:hidden"><span class="hidden lg:inline"> </span><span style="color:${hue(states[act])}">›</span> <span class="text-text">${esc(states[act].log)}</span>`
        : `<span class="text-faint">hover, tap or tab through the states to inspect them</span>`;
    if (html !== lastInspect) inspect.innerHTML = lastInspect = html;
  }

  return {
    el,
    rows: [...wf.map((w) => w.row), ...logs.map((l) => l.row)],
    replay: el.querySelector<HTMLButtonElement>("[data-replay]"),
    render,
    reset: () => typedCache.fill(-1),
  };
}
