// PROTOTYPE: throwaway. Variant C's instrument panel, adapted for G: the automaton row is an empty
// slot the docking machine lands in, and each block carries a data-unfold key so scroll can reveal it.
// The trace ends in E's scrubber; the clock it scrubs lives in the variant.
import type { Run, RunState } from "../../model";
import { type Plan, CHAR_MS, cursor, durText, esc, hue, mix, q, reqAt } from "./clock";

type On = <E extends Event>(el: EventTarget, type: string, fn: (e: E) => void) => void;

const SERVICE: Record<string, string> = {
  lookup: "dns", connect: "tcp", secure: "tls", edge: "edge", firstByte: "edge", delivered: "browser", cached: "browser",
};

/** Round tick values from 0 to max (1, 2 or 5 × 10ⁿ steps), like d3's linear ticks, without d3-scale. */
function niceTicks(max: number, count: number): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw)), r = raw / mag;
  const step = (r >= 7.07 ? 10 : r >= 3.16 ? 5 : r >= 1.41 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

export interface Panel {
  html: string;
  /**
   * Finds its elements under `root`. `bind` wires hover/tap on the waterfall and log rows; `scrub` gets the
   * request time (ms) the reader dragged or keyed the scrubber to; `on` adds listeners the caller can abort.
   */
  attach(root: HTMLElement, wire: { bind: (el: Element, i: number) => void; scrub: (reqMs: number) => void; on: On }): void;
  /** `scrubbed`: the run is paused on a scrubbed frame, so every reached log line shows in full. */
  paint(t: number, active: number | null, scrubbed: boolean): void;
}

/**
 * A text slot whose height never depends on what it shows: every possible content is stacked invisibly
 * in one grid cell, so the cell is always as tall as the tallest of them at the current width, and the
 * live content (`data-live`) is painted over them. Hover and focus must never move layout.
 */
export function reserved(variants: string[], live: string): string {
  return `${variants.map((v) => `<span aria-hidden="true" class="invisible [grid-area:1/1]">${v}</span>`).join("")}<span ${live} class="[grid-area:1/1]"></span>`;
}

export function createPanel(run: Run, P: Plan, reducedMotion: boolean): Panel {
  const states = run.states;
  const n = states.length;
  const D = P.domain;
  const pct = (v: number) => (D > 0 ? (v / D) * 100 : 0);
  const example = run.kind === "example";
  const m = run.meta;
  const where = m.city && m.colo ? `${m.city} · ${m.colo}` : (m.colo ?? "—");
  const ticks = niceTicks(D, 6);
  const tickCls = (i: number) => (i % 2 === 0 ? "" : "hidden sm:block");
  const httpish = (m.http ?? "").includes("3") ? "quic" : "tcp";
  const service = (s: RunState) => (s.id === "connect" ? httpish : SERVICE[s.id] ?? "");

  const html = `
<div data-unfold="head" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
  <h2 id="g-panel-title" class="flex items-baseline gap-2.5 text-sm">
    <span class="font-mono text-text">GET /</span>
    <span class="text-muted">${example ? "a page load, traced" : "your page load, traced"}</span>
  </h2>
  <div class="flex items-center gap-3 font-mono text-[11px]">
    ${
      example
        ? `<span class="rounded-sm border border-dashed border-border px-2 py-0.5 text-muted">example run<span class="hidden text-faint sm:inline"> · your real request appears on the live site</span></span>`
        : `<span class="flex items-center gap-1.5 text-muted"><span class="size-1.5 rounded-full bg-green"></span>live · your request</span>`
    }
    ${reducedMotion ? "" : `<button data-replay type="button" class="whitespace-nowrap rounded-sm border border-border px-2 py-0.5 text-muted hover:border-faint hover:text-text focus-visible:outline-2 focus-visible:outline-lavender" aria-label="Replay the request animation">↻ replay</button>`}
  </div>
</div>

<div class="border-b border-border">
  <div data-unfold="label" aria-hidden="true" class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">automaton</span><span class="text-faint">${q(0)} → ${q(n - 1)}</span></div>
  <div data-slot class="mx-1 mt-1"></div>
  <div data-unfold="inspect" aria-hidden="true" class="grid px-4 pb-3 font-mono text-xs leading-5">${reserved(
    [null, ...states.keys()].map((a) => inspectLine(run, a)),
    "data-inspect",
  )}</div>
</div>

<div data-unfold="stats" aria-hidden="true" class="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-[1.1fr_1fr_0.8fr_1.3fr]">
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">total</div>
    <div class="mt-0.5 flex items-baseline gap-1 font-mono tabular-nums"><span data-total class="text-3xl leading-none">0</span><span class="text-xs text-muted">ms</span></div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">edge</div>
    <div class="mt-1.5 truncate font-mono text-sm text-text">${esc(where)}${m.edgeCache ? ` <span class="text-faint">· ${m.edgeCache}</span>` : ""}</div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">protocol</div>
    <div class="mt-1.5 truncate font-mono text-sm text-text">${esc(m.http ?? "—")}</div>
  </div>
  <div class="bg-surface px-4 py-3">
    <div class="font-mono text-[11px] text-faint">tls</div>
    <div class="mt-1.5 font-mono text-sm text-text">${esc(m.tls ?? "—")}</div>${m.kex ? `<div class="truncate font-mono text-[11px] text-faint">${esc(m.kex)}</div>` : ""}
  </div>
</div>

<div data-unfold="trace" class="border-b border-border">
  <div aria-hidden="true" class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">trace</span><span class="text-faint">${n + 1} spans</span></div>
  <div class="relative px-4 ${D > 0 ? "pb-3" : "pb-4"} pt-2 [--lab:5.5rem] [--pad:3.25rem] sm:[--lab:11rem]">
    <div aria-hidden="true" class="pointer-events-none absolute top-2" style="bottom:${D > 0 ? "1.625rem" : "1rem"};left:calc(1rem + var(--lab));right:calc(1rem + var(--pad))">
      ${ticks.map((v) => `<div class="absolute inset-y-0 border-l border-dashed border-border" style="left:${pct(v)}%"></div>`).join("")}
      <div data-playhead class="g-x absolute inset-y-0 w-px bg-text/60" style="left:0"></div>
    </div>
    <div aria-hidden="true" class="grid grid-cols-[var(--lab)_1fr]">
      <div></div>
      <div class="relative mr-[var(--pad)] h-6 font-mono text-[10px] text-faint">
        ${ticks.map((v, i) => `<span class="absolute top-1 ${i === 0 ? "" : "-translate-x-1/2"} ${tickCls(i)} whitespace-nowrap" style="left:${pct(v)}%">${v}${i === 0 ? " ms" : ""}</span>`).join("")}
      </div>
    </div>
    <div data-wf-row="root" aria-hidden="true" class="grid grid-cols-[var(--lab)_1fr]">
      <div class="flex items-center truncate pr-2 font-mono text-[12px] text-text">GET /</div>
      <div class="relative mr-[var(--pad)] h-7">
        <div data-bar class="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] border-l-2 border-muted bg-text/10" style="left:0;width:0"></div>
        <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 font-mono text-[11px] text-muted" style="left:0"></span>
      </div>
    </div>
    ${states
      .map(
        (s, i) => `
    <div data-wf-row="${i}" data-g-i="${i}" aria-hidden="true" class="g-x grid cursor-default grid-cols-[var(--lab)_1fr] rounded-sm">
      <div class="flex items-center gap-2 truncate pl-2 pr-2 text-[13px] sm:pl-4"><span class="hidden w-12 font-mono text-[11px] text-faint sm:inline">${service(s)}</span><span data-lab class="text-muted">${esc(s.label)}</span></div>
      <div class="relative mr-[var(--pad)] h-7">
        ${
          s.durationMs !== undefined && !s.skipped
            ? `<div data-bar class="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] border-l-2" style="left:${pct(P.start[i])}%;width:0;border-color:${hue(s)};background:${mix(hue(s), 40, "transparent")}"></div>`
            : `<div data-bar class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${s.skipped ? "border-dashed" : ""}" style="left:${pct(P.start[i])}%;border-color:${s.skipped ? "var(--faint)" : hue(s)};background:${s.skipped ? "transparent" : mix(hue(s), 50, "transparent")}"></div>`
        }
        <span data-dur class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] text-muted"></span>
      </div>
    </div>`,
      )
      .join("")}
    ${
      D > 0
        ? `<div class="grid grid-cols-[var(--lab)_1fr]">
      <div aria-hidden="true" class="flex items-center pl-2 font-mono text-[10px] text-faint sm:pl-4">scrub<span class="hidden sm:inline">&nbsp;the run</span></div>
      <div data-rail class="relative mr-[var(--pad)] h-7 cursor-ew-resize touch-none select-none">
        <div aria-hidden="true" class="absolute inset-x-0 top-1/2 h-px bg-border"></div>
        <div data-knob role="slider" tabindex="0" aria-label="Scrub the request timeline" aria-valuemin="0" aria-valuemax="${Math.round(D)}" aria-valuenow="0" aria-valuetext="0 ms"
          class="absolute top-1/2 cursor-grab whitespace-nowrap rounded-sm border border-faint bg-surface px-1.5 py-px font-mono text-[10px] tabular-nums text-text focus-visible:outline-2 focus-visible:outline-lavender" style="left:0;transform:translate(0,-50%)">0 ms</div>
      </div>
    </div>`
        : ""
    }
  </div>
</div>

<div data-unfold="logs" aria-hidden="true">
  <div class="flex items-baseline justify-between px-4 pt-3 font-mono text-xs"><span class="text-muted">logs</span><span class="text-faint">tail -f</span></div>
  <div class="px-2 pb-4 pt-2 font-mono text-[12px] leading-5 sm:px-3">
    ${states
      .map(
        (s, i) => `
    <div data-log="${i}" data-g-i="${i}" class="g-x grid grid-cols-[3.5rem_1fr] gap-3 rounded-sm px-2 py-0.5">
      <span class="text-right tabular-nums text-faint">+${P.start[i]}ms</span>
      <span data-msg class="grid border-l-2 pl-3 break-words" style="border-color:var(--border)">
        <span data-ghost class="invisible [grid-area:1/1]">${esc(s.log)}<span class="invisible">▍</span></span>
        <span data-typed class="[grid-area:1/1]"></span>
      </span>
    </div>`,
      )
      .join("")}
  </div>
</div>`;

  let el: {
    inspect: HTMLElement; total: HTMLElement; playhead: HTMLElement; rootBar: HTMLElement; rootDur: HTMLElement;
    knob: HTMLElement | null;
    wf: { row: HTMLElement; bar: HTMLElement; dur: HTMLElement; lab: HTMLElement }[];
    logs: { row: HTMLElement; typed: HTMLElement; ghost: HTMLElement; msg: HTMLElement }[];
  } | null = null;
  const typedCache = states.map(() => -1);
  let lastKey = "", lastKnob = "", req = 0;

  function attach(root: HTMLElement, { bind, scrub, on }: Parameters<Panel["attach"]>[1]) {
    const $ = (sel: string, from: ParentNode = root) => from.querySelector<HTMLElement>(sel)!;
    const rootRow = $('[data-wf-row="root"]');
    el = {
      inspect: $("[data-inspect]"), total: $("[data-total]"), playhead: $("[data-playhead]"),
      rootBar: $("[data-bar]", rootRow), rootDur: $("[data-dur]", rootRow), knob: root.querySelector<HTMLElement>("[data-knob]"),
      wf: states.map((_, i) => {
        const row = $(`[data-wf-row="${i}"]`);
        return { row, bar: $("[data-bar]", row), dur: $("[data-dur]", row), lab: $("[data-lab]", row) };
      }),
      logs: states.map((_, i) => {
        const row = $(`[data-log="${i}"]`);
        return { row, typed: $("[data-typed]", row), ghost: $("[data-ghost]", row), msg: $("[data-msg]", row) };
      }),
    };
    el.wf.forEach((w, i) => bind(w.row, i));
    el.logs.forEach((l, i) => bind(l.row, i));
    typedCache.fill(-1);
    lastKey = "";
    lastKnob = "";

    // E's scrubber: drag anywhere on the rail (touch-action: none on the rail only), or key the knob.
    const knob = el.knob, rail = root.querySelector<HTMLElement>("[data-rail]");
    if (!knob || !rail) return;
    const fromX = (x: number) => {
      const b = rail.getBoundingClientRect();
      return Math.max(0, Math.min(1, (x - b.left) / (b.width || 1))) * D;
    };
    on<PointerEvent>(rail, "pointerdown", (e) => {
      e.preventDefault(); // keeps focus on the knob (the rail itself isn't focusable) and stops text selection
      rail.setPointerCapture(e.pointerId);
      knob.focus({ preventScroll: true });
      scrub(fromX(e.clientX));
    });
    on<PointerEvent>(rail, "pointermove", (e) => { if (rail.hasPointerCapture(e.pointerId)) scrub(fromX(e.clientX)); });
    on<KeyboardEvent>(knob, "keydown", (e) => {
      const big = Math.max(1, Math.round(D / 10));
      const to =
        e.key === "ArrowRight" || e.key === "ArrowUp" ? req + (e.shiftKey ? big : 1)
        : e.key === "ArrowLeft" || e.key === "ArrowDown" ? req - (e.shiftKey ? big : 1)
        : e.key === "PageUp" ? req + big : e.key === "PageDown" ? req - big
        : e.key === "Home" ? 0 : e.key === "End" ? D : null;
      if (to === null) return;
      e.preventDefault();
      e.stopPropagation(); // the slider owns its keys (the harness switcher listens for ← → on window)
      scrub(Math.max(0, Math.min(D, Math.round(to))));
    });
  }

  function paint(t: number, act: number | null, scrubbed: boolean) {
    if (!el) return;
    const key = `${Math.round(t)}|${act}|${scrubbed}`;
    if (key === lastKey) return;
    lastKey = key;
    req = reqAt(P, t);
    const done = t >= P.endT;
    const cur = cursor(P, t);

    el.total.textContent = D > 0 ? `${done && P.total !== undefined ? P.total : Math.round(req)}` : "—";
    el.total.style.color = D === 0 ? "var(--text)" : req < 300 ? "var(--green)" : req < 1000 ? "var(--peach)" : "var(--red)";

    el.playhead.style.left = `${pct(req)}%`;
    el.playhead.style.opacity = done || t === 0 ? "0" : "1";
    el.rootBar.style.width = `${pct(req)}%`;
    el.rootDur.style.left = `${pct(req)}%`;
    el.rootDur.textContent = t > 0 ? `${Math.round(req)} ms` : "";
    if (el.knob) {
      el.knob.style.left = `${pct(req)}%`;
      el.knob.style.transform = `translate(-${pct(req)}%, -50%)`; // stays inside the rail at both ends
      const r = Math.round(req);
      if (`${r}|${cur}` !== lastKnob) {
        lastKnob = `${r}|${cur}`;
        el.knob.textContent = `${r} ms`;
        el.knob.setAttribute("aria-valuenow", `${r}`);
        el.knob.setAttribute("aria-valuetext", `${r} ms${cur >= 0 ? `, ${states[cur].label}` : ""}`);
      }
    }
    states.forEach((s, i) => {
      const { row, bar, dur, lab } = el!.wf[i];
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
      const finalEnd = pct(isBar ? P.end[i] : P.start[i]);
      const nowEnd = pct(isBar ? Math.max(P.start[i], Math.min(req, P.end[i])) : P.start[i]);
      // Label before the span when it ends near the axis edge, unless that would land on the row's name.
      if (finalEnd > 78 && pct(P.start[i]) > 22) { dur.style.left = ""; dur.style.right = `calc(${100 - pct(P.start[i])}% + 8px)`; }
      else { dur.style.right = ""; dur.style.left = `calc(${nowEnd}% + ${isBar ? 6 : 10}px)`; }
      lab.className = entered ? "text-text" : "text-muted";
      row.style.opacity = act !== null && act !== i ? "0.4" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
    });

    states.forEach((s, i) => {
      const { row, typed, ghost, msg } = el!.logs[i];
      const entered = t >= P.enter[i];
      const k = !entered ? 0 : scrubbed ? s.log.length : Math.min(s.log.length, Math.floor((t - P.enter[i]) / CHAR_MS));
      const showCursor = !reducedMotion && entered && i === cur && !done;
      const ck = k * 2 + (showCursor ? 1 : 0);
      if (typedCache[i] !== ck) {
        typedCache[i] = ck;
        typed.textContent = s.log.slice(0, k);
        if (showCursor) typed.insertAdjacentHTML("beforeend", `<span class="g-cursor text-muted">▍</span>`);
      }
      typed.style.color = s.skipped ? "var(--muted)" : "var(--text)";
      const preview = act === i && k < s.log.length;
      ghost.className = `[grid-area:1/1] ${preview ? "text-faint" : "invisible"}`;
      typed.style.visibility = preview ? "hidden" : "";
      msg.style.borderColor = entered ? (s.skipped ? "var(--faint)" : hue(s)) : "var(--border)";
      row.style.opacity = act !== null && act !== i ? "0.4" : "1";
      row.style.backgroundColor = act === i ? mix(hue(s), 12, "transparent") : "";
    });

    el.inspect.innerHTML = inspectLine(run, act);
  }

  return { html, attach, paint };
}

/** The one-line reveal for the active state, shared by the hero transcript and the panel. */
export function inspectLine(run: Run, act: number | null): string {
  if (act === null) return `<span class="text-faint">hover, tap or tab through the states to inspect them</span>`;
  const s = run.states[act];
  return `<span class="text-faint">${q(act)}</span> <span class="text-text">${esc(s.label)}</span> <span class="text-faint">·</span> <span class="text-muted">${esc(durText(s, run))}</span><br><span style="color:${s.skipped ? "var(--muted)" : hue(s)}">›</span> <span class="text-text">${esc(s.log)}</span>`;
}
