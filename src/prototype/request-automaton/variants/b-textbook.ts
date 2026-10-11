// PROTOTYPE: throwaway. Variant B, "Textbook DFA": the Request Automaton drawn in mercury-lib's notation.
// States are circles (q₀…qₙ), the accepting state is a double circle, edges carry the time spent in the
// state they leave, skipped states are dashed. A token walks the machine in time proportional to the run.
import { easeQuadInOut } from "d3-ease";
import type { RunState } from "../model";
import type { Variant } from "../types";
import { R, layout, rowWidth, rim, selfLoop, startArrow, transition, type EdgeGeom, type Layout, type Pt } from "./b/geometry";

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number) => [...String(n)].map((d) => SUBS[+d]).join("");
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi"];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const TARGET_MS = 3200, START_MS = 380, DWELL_MS = 110, UNTIMED_MS = 200, MIN_LEG_MS = 160;

const STYLE = `
.vb-fig { background-image: radial-gradient(color-mix(in srgb, var(--border) 85%, transparent) 1px, transparent 1.3px); background-size: 18px 18px; background-position: center; }
.vb-edge { fill: none; stroke: var(--muted); stroke-width: 1.25; }
.vb-head { fill: var(--muted); }
.vb-ov { fill: none; stroke: var(--lavender); stroke-width: 2; stroke-linecap: round; }
.vb-ovhead { fill: var(--lavender); }
.vb-dashed .vb-edge, .vb-dashed .vb-ov { stroke-dasharray: 4 4; }
.vb-elabel { fill: var(--muted); font-size: 13px; }
.vb-elabel.vb-eps { font-size: 16px; }
.vb-state { cursor: pointer; outline: none; }
.vb-circle { fill: var(--bg); stroke: var(--text); stroke-width: 1.5; transition: fill .25s, stroke .25s; }
.vb-inner { fill: none; }
.vb-skipped .vb-circle { stroke-dasharray: 4 3; stroke: var(--faint); }
.vb-state[data-st="done"] .vb-circle:not(.vb-inner) { fill: var(--surface); }
.vb-state[data-st="current"] .vb-circle { stroke: var(--lavender); stroke-width: 2; }
.vb-state[data-st="current"] .vb-circle:not(.vb-inner) { fill: color-mix(in srgb, var(--lavender) 22%, var(--bg)); }
.vb-state[data-st="accepted"] .vb-circle { stroke: var(--green); stroke-width: 2; }
.vb-state[data-st="accepted"] .vb-circle:not(.vb-inner) { fill: color-mix(in srgb, var(--green) 16%, var(--bg)); }
.vb-halo { fill: transparent; stroke: transparent; stroke-width: 1.25; stroke-dasharray: 2 3; }
.vb-state:hover .vb-halo, .vb-state:focus-visible .vb-halo, .vb-pinned .vb-halo { stroke: var(--lavender); }
.vb-qid { fill: var(--text); font-size: 18px; font-style: italic; }
.vb-name { fill: var(--muted); font-size: 13.5px; }
.vb-skipped .vb-qid, .vb-skipped .vb-name { fill: var(--faint); }
.vb-start { fill: var(--muted); font-size: 13px; font-style: italic; }
.vb-token { fill: var(--peach); }
.vb-snake .vb-elabel { font-size: 14px; } .vb-snake .vb-elabel.vb-eps { font-size: 17px; } .vb-snake .vb-name { font-size: 14px; }
`;

type Seg =
  | { kind: "leg"; leg: number; t0: number; dur: number; cur: number; drawn: number; realBefore: number; real: number }
  | { kind: "dwell"; state: number; t0: number; dur: number; cur: number; drawn: number; realBefore: number; from: Pt; to: Pt };

interface Leg { geom: EdgeGeom; real: number; anim: number; dashed: boolean }

function edgeLabel(s: RunState): { text: string; eps: boolean } {
  if (s.skipped) return { text: "0 ms", eps: false };
  if (s.durationMs !== undefined) return { text: `${s.durationMs} ms`, eps: false };
  return { text: "ε", eps: true };
}

const variant: Variant = {
  name: "Textbook DFA",
  mount(root, { run, copy, reducedMotion }) {
    const states = run.states;
    const n = states.length, last = n - 1;
    const hasLoop = n > 0 && states[last].durationMs !== undefined && !states[last].skipped;
    const total = run.totalMs ?? states.reduce((a, s) => a + (s.durationMs ?? 0), 0);
    const where = run.meta.city ? `${run.meta.city} (${run.meta.colo})` : run.meta.colo;
    const metaBits = [where, run.meta.http, run.meta.tls, run.meta.edgeCache && `edge cache ${run.meta.edgeCache}`].filter(Boolean).join(" · ");
    const anyEps = states.slice(0, hasLoop ? n : last).some((s) => edgeLabel(s).eps);
    const anySkipped = states.some((s) => s.skipped);

    const pillars = copy.pillars
      .map((p, i) => `<span class="font-serif italic text-faint">(${ROMAN[i] ?? i + 1})</span>&nbsp;${esc(p)}`)
      .reduce((acc, p, i, all) => acc + (i === 0 ? "" : i === all.length - 1 ? ", and " : ", ") + p, "");

    const srItem = (s: RunState, i: number) =>
      `<li>q${i} ${esc(s.label)}${i === 0 ? " (start)" : ""}${i === last ? " (accepting)" : ""}: ${
        s.skipped ? "skipped" : s.durationMs !== undefined ? `${s.durationMs} ms` : "no timing"
      }. ${esc(s.log)}</li>`;

    root.innerHTML = `
<style>${STYLE}</style>
<section class="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:py-28">
  <div class="max-w-xl">
    <h1 class="font-serif text-4xl leading-tight text-text sm:text-5xl">${esc(copy.name)}</h1>
    <p class="mt-3 text-lg text-muted">${esc(copy.headline)}</p>
    <p class="mt-8 text-base leading-relaxed text-text">${esc(copy.intro)}</p>
    <p class="mt-5 text-base leading-relaxed text-muted">My focus, in three parts: ${pillars}.</p>
  </div>
  <figure class="min-w-0 border-y border-border py-5">
    <div class="flex items-baseline justify-between gap-4 font-mono text-xs">
      <span class="text-muted"><span class="font-serif text-sm italic text-text">Fig. 1</span>${run.kind === "example" ? ` <span class="text-faint">· example run</span>` : ""}</span>
      <span class="flex items-baseline gap-4">
        <span data-status class="tabular-nums text-muted" aria-hidden="true"></span>
        <button type="button" data-replay class="cursor-pointer rounded-sm text-lavender underline decoration-dotted underline-offset-4 hover:text-mauve focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender${reducedMotion ? " hidden" : ""}">↻ replay</button>
      </span>
    </div>
    <div data-stage class="vb-fig mt-4 flex justify-center"></div>
    <ol class="sr-only">${states.map(srItem).join("")}</ol>
    <p data-log class="mt-4 min-h-[2.75rem] break-words font-mono text-xs leading-relaxed text-muted sm:min-h-[1.5rem]"></p>
    <figcaption class="mt-4 font-serif text-sm leading-relaxed text-muted">
      <span class="italic text-text">Figure 1.</span> Your page load as a deterministic automaton
      <span class="italic">M</span> = (<span class="italic">Q</span>, Σ, δ, <span class="italic">q</span>₀, <span class="italic">F</span>),
      with <span class="italic">F</span> = {<span class="italic">q</span>${sub(last)}}. Each edge carries the time spent in the state it leaves${
        anyEps ? `; <span class="italic">ε</span> marks a step the browser doesn't time` : ""
      }${anySkipped ? `; dashed states were skipped because the connection was reused` : ""}.
      Notation after mercury-lib, the automata library I wrote for my thesis.
      <span class="mt-2 block font-mono text-xs text-faint">${
        run.kind === "example"
          ? `example run: a typical visit${where ? ` from ${esc(where)}` : ""}. Your real request appears on the live site.`
          : `your request${metaBits ? `: ${esc(metaBits)}` : ""}`
      }</span>
    </figcaption>
  </figure>
</section>`;

    const stage = root.querySelector<HTMLElement>("[data-stage]")!;
    const statusEl = root.querySelector<HTMLElement>("[data-status]")!;
    const logEl = root.querySelector<HTMLElement>("[data-log]")!;
    const replay = root.querySelector<HTMLButtonElement>("[data-replay]")!;
    const life = new AbortController();

    // Per-layout state, rebuilt whenever the stage folds between one row and the snake.
    let L: Layout | null = null;
    let stateEls: SVGGElement[] = [];
    let legs: Leg[] = [];
    let legEls: { ov: SVGPathElement; head: SVGPathElement; len: number }[] = [];
    let token: SVGCircleElement | null = null;
    let segs: Seg[] = [];
    let built: AbortController | null = null;

    let phase: "idle" | "running" | "done" = "idle";
    let raf = 0, startAt = 0, startTimer = 0;
    let cur = -1, hover: number | null = null, pinned: number | null = null;

    function buildLegs(L: Layout): Leg[] {
      const raw: { geom: EdgeGeom; real: number; dashed: boolean; timed: boolean }[] = [{ geom: startArrow(L), real: 0, dashed: false, timed: false }];
      for (let i = 0; i < last; i++) {
        const s = states[i];
        raw.push({ geom: transition(L, i), real: s.durationMs ?? 0, dashed: !!s.skipped || !!states[i + 1].skipped, timed: s.durationMs !== undefined && !s.skipped });
      }
      if (hasLoop) raw.push({ geom: selfLoop(L, last), real: states[last].durationMs!, dashed: false, timed: true });
      const timedReal = raw.reduce((a, l) => a + (l.timed ? l.real : 0), 0);
      const untimed = raw.filter((l, k) => k > 0 && !l.timed).length;
      const budget = Math.max(900, TARGET_MS - START_MS - n * DWELL_MS - untimed * UNTIMED_MS);
      const scale = timedReal > 0 ? budget / timedReal : 0;
      return raw.map((l, k) => ({
        geom: l.geom, real: l.real, dashed: l.dashed,
        anim: k === 0 ? START_MS : l.timed ? Math.max(MIN_LEG_MS, l.real * scale) : UNTIMED_MS,
      }));
    }

    function buildSegs(): Seg[] {
      const out: Seg[] = [];
      let t = 0, real = 0;
      const pushLeg = (leg: number, curState: number) => {
        out.push({ kind: "leg", leg, t0: t, dur: legs[leg].anim, cur: curState, drawn: leg, realBefore: real, real: legs[leg].real });
        t += legs[leg].anim; real += legs[leg].real;
      };
      pushLeg(0, -1);
      for (let i = 0; i < n; i++) {
        const into = legs[i].geom.end; // leg i ends in state i (leg 0 is the start arrow)
        const outLeg = i < last ? i + 1 : hasLoop ? n : -1;
        const from = into, to = outLeg >= 0 ? legs[outLeg].geom.start : into;
        out.push({ kind: "dwell", state: i, t0: t, dur: DWELL_MS, cur: i, drawn: outLeg >= 0 ? outLeg : legs.length, realBefore: real, from, to });
        t += DWELL_MS;
        if (outLeg >= 0) pushLeg(outLeg, i);
      }
      return out;
    }

    function svgFor(L: Layout): string {
      const legSvg = legs
        .map((leg, k) => {
          const g = leg.geom;
          let label = "";
          if (k === 0) label = `<text class="vb-start font-serif" x="${g.label.x}" y="${g.label.y}" text-anchor="middle">start</text>`;
          else {
            const lab = edgeLabel(states[k - 1]); // leg k leaves state k-1; the self-loop (k = n) leaves the last state
            label = `<text class="vb-elabel ${lab.eps ? "vb-eps font-serif italic" : "font-mono"}" x="${g.label.x.toFixed(1)}" y="${g.label.y.toFixed(1)}" text-anchor="${g.label.anchor}">${lab.text}</text>`;
          }
          return `<g class="${leg.dashed ? "vb-dashed" : ""}">
  <path class="vb-edge" d="${g.d}"/><path class="vb-head" d="${g.head}"/>
  <path data-ov class="vb-ov" d="${g.d}"/><path data-ovhead class="vb-ovhead" d="${g.head}"/>${label}</g>`;
        })
        .join("");
      const stateSvg = states
        .map((s, i) => {
          const p = L.pos[i];
          const timing = s.skipped ? "skipped" : s.durationMs !== undefined ? `${s.durationMs} ms` : "no timing";
          return `<g class="vb-state${s.skipped ? " vb-skipped" : ""}" data-i="${i}" data-st="idle" tabindex="0" role="button"
  aria-label="${esc(`q${i}, ${s.label}${i === last ? ", accepting" : ""}: ${timing}. ${s.log}`)}">
  <circle class="vb-halo" cx="${p.x}" cy="${p.y}" r="${R + 7}"/>
  <circle class="vb-circle" cx="${p.x}" cy="${p.y}" r="${R}"/>
  ${i === last ? `<circle class="vb-circle vb-inner" cx="${p.x}" cy="${p.y}" r="${R - 4.5}"/>` : ""}
  <text class="vb-qid font-serif" x="${p.x}" y="${p.y + 5.5}" text-anchor="middle">q${sub(i)}</text>
  <text class="vb-name font-sans" x="${p.x}" y="${p.y + R + 19}" text-anchor="middle">${esc(s.label)}</text></g>`;
        })
        .join("");
      const label = `Request Automaton${run.kind === "example" ? " (example run)" : ""}: ${n} states from ${states[0].label} to ${states[last].label}, ${total} ms in total.`;
      return `<svg class="${L.snake ? "vb-snake " : ""}block h-auto w-full overflow-visible" viewBox="0 0 ${L.w} ${L.h}" style="max-width:${Math.round(L.w * 1.08)}px"
  role="group" aria-label="${esc(label)}">${legSvg}${stateSvg}<circle class="vb-token" r="5" cx="-20" cy="-20" opacity="0"/></svg>`;
    }

    function setLeg(k: number, p: number) {
      const el = legEls[k];
      if (legs[k].dashed) el.ov.style.opacity = String(p);
      else el.ov.style.strokeDashoffset = String(el.len * (1 - p));
      el.head.style.opacity = p >= 1 ? "1" : "0";
    }

    function setStates(current: number, accepted: boolean) {
      stateEls.forEach((g, i) => {
        g.dataset.st = accepted ? (i === last ? "accepted" : "done") : i < current ? "done" : i === current ? "current" : "idle";
      });
    }

    function showLog() {
      const i = hover ?? pinned ?? (phase === "running" && cur >= 0 ? cur : null);
      const html =
        i === null
          ? `<span class="text-faint">hover, focus or tap a state to read its log</span>`
          : `<span class="font-serif italic text-faint">q${sub(i)}</span> <span class="text-text">${esc(states[i].log)}</span>`;
      if (logEl.innerHTML !== html) logEl.innerHTML = html;
      stateEls.forEach((g, k) => g.classList.toggle("vb-pinned", k === pinned));
    }

    function setStatus(text: string) {
      if (statusEl.textContent !== text) statusEl.textContent = text;
    }

    function paintFinal() {
      phase = "done";
      cur = last;
      legs.forEach((_, k) => setLeg(k, 1));
      setStates(last, true);
      token?.setAttribute("opacity", "0");
      setStatus(`accepted · ${total} ms ∎`);
      showLog();
    }

    function paintAt(elapsed: number) {
      const seg = segs.find((s) => elapsed < s.t0 + s.dur);
      if (!seg) return false;
      const p = (elapsed - seg.t0) / seg.dur;
      legs.forEach((_, k) => setLeg(k, k < seg.drawn ? 1 : seg.kind === "leg" && k === seg.leg ? easeQuadInOut(p) : 0));
      if (cur !== seg.cur) { cur = seg.cur; showLog(); }
      setStates(cur, false);
      let pt: Pt;
      if (seg.kind === "leg") {
        const el = legEls[seg.leg];
        const q = el.ov.getPointAtLength(el.len * easeQuadInOut(p));
        pt = { x: q.x, y: q.y };
        setStatus(`t = ${Math.round(seg.realBefore + seg.real * p)} ms`);
      } else {
        pt = rim(L!.pos[seg.state], seg.from, seg.to, easeQuadInOut(p));
        setStatus(`t = ${seg.realBefore} ms`);
      }
      token!.setAttribute("cx", pt.x.toFixed(1));
      token!.setAttribute("cy", pt.y.toFixed(1));
      token!.setAttribute("opacity", "1");
      return true;
    }

    function frame(now: number) {
      if (paintAt(now - startAt)) raf = requestAnimationFrame(frame);
      else { raf = 0; paintFinal(); }
    }

    function play() {
      cancelAnimationFrame(raf);
      clearTimeout(startTimer);
      if (reducedMotion) return paintFinal();
      phase = "running";
      pinned = null;
      cur = -1;
      paintAt(0);
      showLog();
      startAt = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function build(snake: boolean) {
      built?.abort();
      built = new AbortController();
      const signal = built.signal;
      L = layout(n, snake);
      legs = buildLegs(L);
      segs = buildSegs();
      stage.innerHTML = svgFor(L);
      const svg = stage.querySelector("svg")!;
      token = svg.querySelector(".vb-token");
      const ovs = [...svg.querySelectorAll<SVGPathElement>("[data-ov]")];
      const heads = [...svg.querySelectorAll<SVGPathElement>("[data-ovhead]")];
      legEls = ovs.map((ov, k) => {
        const len = ov.getTotalLength();
        if (!legs[k].dashed) ov.style.strokeDasharray = `${len} ${len}`;
        return { ov, head: heads[k], len };
      });
      stateEls = [...svg.querySelectorAll<SVGGElement>(".vb-state")];
      stateEls.forEach((g, i) => {
        g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = i; showLog(); } }, { signal });
        g.addEventListener("pointerleave", () => { if (hover === i) { hover = null; showLog(); } }, { signal });
        g.addEventListener("focus", () => { hover = i; showLog(); }, { signal });
        g.addEventListener("blur", () => { if (hover === i) { hover = null; showLog(); } }, { signal });
        g.addEventListener("click", () => { pinned = pinned === i ? null : i; showLog(); }, { signal });
        g.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pinned = pinned === i ? null : i; showLog(); }
        }, { signal });
      });
    }

    if (n === 0) {
      stage.innerHTML = "";
      return () => life.abort();
    }

    const wantsSnake = () => n > 3 && stage.clientWidth < rowWidth(n) * 0.72;
    let snake = wantsSnake();
    build(snake);
    if (reducedMotion) paintFinal();
    else {
      setStates(-1, false);
      legs.forEach((_, k) => setLeg(k, 0));
      setStatus("t = 0 ms");
      showLog();
      startTimer = window.setTimeout(play, 350);
    }

    const ro = new ResizeObserver(() => {
      const next = wantsSnake();
      if (next === snake) return;
      snake = next;
      const wasRunning = phase === "running" || phase === "idle";
      cancelAnimationFrame(raf);
      build(snake);
      if (wasRunning && !reducedMotion) play();
      else paintFinal();
    });
    ro.observe(stage);

    replay.addEventListener("click", play, { signal: life.signal });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(startTimer);
      ro.disconnect();
      built?.abort();
      life.abort();
    };
  },
};

export default variant;
