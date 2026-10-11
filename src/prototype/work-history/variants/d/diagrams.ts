// PROTOTYPE: throwaway. Copied as is from selected-work H (variants/h/diagrams.ts); only this header changed.
// H's figures: a copy of F's compact figures (variants/f/diagrams.ts, adapted from round-1
// B), one small static SVG per Case Study, about 300 px wide, drawn from its facts in content.ts. H renders each figure
// once and moves it with CSS grid: into the readout's evidence column on desktop, under the horizontal rail on phones.
// Change from F: Blinka's figure no longer prints the PR counts, which the facts already show.
// Classes: ln = line, nd = node, ah = arrowhead, lb = label (dim = faint), draw = drawn in when its state is selected,
// comet = the token that runs the figure once after that. Lines that draw or carry a comet use pathLength="1".
// Any number drawn here comes from `facts`, so the figure and the readout always agree.
import type { CaseStudy } from "../../content";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Pill width for a mono label at 11px (≈0.6em per glyph) plus padding. */
const pw = (s: string) => Math.round(s.length * 6.6 + 16);

function pill(x: number, cy: number, label: string, w = pw(label)) {
  return `<rect class="nd" x="${x}" y="${cy - 13}" width="${w}" height="26" rx="4"/><text class="lb" x="${x + w / 2}" y="${cy + 4}" text-anchor="middle">${esc(label)}</text>`;
}
/** Arrowhead with its tip at (x, y), pointing along angle `deg` (0 = right, 90 = down). */
function head(x: number, y: number, deg: number) {
  return `<path class="ah" d="M0 0 L-7 -3.5 L-7 3.5 Z" transform="translate(${x} ${y}) rotate(${deg})"/>`;
}
const line = (d: string, cls = "ln draw") => `<path class="${cls}" d="${d}"${cls.includes("draw") ? ' pathLength="1"' : ""}/>`;
const comet = (d: string, delay = 0) => `<path class="comet" d="${d}" pathLength="1" style="--d:${delay}ms"/>`;
const text = (x: number, y: number, s: string, cls = "lb dim", anchor = "start") =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${w} ${h}" style="max-width:${Math.round(w * 1.15)}px" aria-hidden="true" focusable="false">${body}</svg>`;
const fact = (c: CaseStudy, word: string) => c.facts.find((f) => f.label.includes(word));

/** Blinka: the request turns down at API Gateway into Lambda, then into RDS; CloudWatch watches; the pipeline ships Lambda. */
function blinka(c: CaseStudy) {
  const pick = (name: string) => c.technologies.find((t) => t.includes(name)) ?? name;
  const CF = pick("CloudFront"), GW = pick("API Gateway"), RDS = pick("RDS"), CW = pick("CloudWatch"), GHA = pick("GitHub Actions");
  const LAM = pick("Lambda").replace("AWS ", "");

  const y1 = 22, y2 = 84, y3 = 154, n = 14;
  const nCF = 26, nGW = nCF + pw(CF) + 18, nC = nGW + pw(GW) / 2;
  const nL = nC - pw(LAM) / 2, nR = nL - 22 - pw(RDS), nCW = nL + pw(LAM) + 22;
  const nG = nC - pw(GHA) / 2, nRv = nG - n - pw("review"), nPR = nRv - n - pw("PR");
  return svg(
    Math.max(304, nCW + pw(CW) + 2),
    172,
    [
      comet(`M13 ${y1} H${nC} V${y2} H${nR + pw(RDS) / 2}`, 0),
      comet(`M${nPR + 10} ${y3} H${nC} V${y2 + 13}`, 500),
      line(`M13 ${y1} H${nCF - 1}`), head(nCF, y1, 0),
      line(`M${nCF + pw(CF)} ${y1} H${nGW - 1}`), head(nGW, y1, 0),
      line(`M${nC} ${y1 + 13} V${y2 - 14}`), head(nC, y2 - 13, 90),
      line(`M${nL} ${y2} H${nR + pw(RDS) + 1}`), head(nR + pw(RDS), y2, 180),
      line(`M${nCW} ${y2} H${nL + pw(LAM)}`, "ln dash"),
      line(`M${nCW + pw(CW) / 2} ${y2 - 13} Q${nCW + pw(CW) / 2} ${y1} ${nGW + pw(GW)} ${y1}`, "ln dash"),
      line(`M${nPR + pw("PR")} ${y3} H${nRv - 1}`), head(nRv, y3, 0),
      line(`M${nRv + pw("review")} ${y3} H${nG - 1}`), head(nG, y3, 0),
      line(`M${nC} ${y3 - 13} V${y2 + 15}`), head(nC, y2 + 14, -90),
      text(nC + 6, 124, "ships"),
      `<circle class="nd dot" cx="8" cy="${y1}" r="5"/>`,
      pill(nCF, y1, CF), pill(nGW, y1, GW), pill(nL, y2, LAM), pill(nR, y2, RDS), pill(nCW, y2, CW),
      pill(nPR, y3, "PR"), pill(nRv, y3, "review"), pill(nG, y3, GHA),
    ].join(""),
  );
}

/** GOLD-python → mercury-lib as a two-state DFA; only DFAs survive the rebuild. Each state carries its library's short
 * name (from `short`, "GOLD → mercury") and, under it, the role Nicolas built it in (from `role`). No years: the rail and
 * the panel header already print the period. */
function gold(c: CaseStudy) {
  const [nameA = "GOLD", nameB = "mercury"] = c.short.split(" → ");
  const [roleA = "", roleB = ""] = c.role.split(/,\s*then\s*/i).map((s) => s.toLowerCase());
  const q0 = { x: 84, y: 98 }, q1 = { x: 222, y: 98 }, r = 34;
  // Loops and edges meet the circle at (±16, -30) and (±30, -16), both on r = 34.
  const loop = (x: number) => `M${x - 16} ${q0.y - 30} C${x - 32} ${q0.y - 80} ${x + 32} ${q0.y - 80} ${x + 16} ${q0.y - 30}`;
  const edge = `M${q0.x + 30} ${q0.y - 16} Q${(q0.x + q1.x) / 2} ${q0.y - 52} ${q1.x - 30} ${q1.y - 16}`;
  return svg(
    272,
    164,
    [
      comet(edge, 0),
      line(`M8 ${q0.y} H${q0.x - r - 1}`), head(q0.x - r, q0.y, 0),
      text(8, q0.y - 8, "start"),
      line(edge), head(q1.x - 30, q1.y - 16, 35),
      text((q0.x + q1.x) / 2, q0.y - 40, "rebuilt", "lb", "middle"),
      line(loop(q0.x)), head(q0.x + 16, q0.y - 30, 108),
      text(q0.x, q0.y - 78, "DFA, NFA, ε-NFA", "lb dim", "middle"),
      line(loop(q1.x)), head(q1.x + 16, q1.y - 30, 108),
      text(q1.x, q1.y - 78, "DFA + d3", "lb dim", "middle"),
      `<circle class="nd" cx="${q0.x}" cy="${q0.y}" r="${r}"/>`,
      `<circle class="nd accept" cx="${q1.x}" cy="${q1.y}" r="${r}"/><circle class="nd inner" cx="${q1.x}" cy="${q1.y}" r="${r - 5}"/>`,
      text(q0.x, q0.y + 4, nameA, "lb strong", "middle"),
      text(q1.x, q1.y + 4, nameB, "lb strong", "middle"),
      text(q0.x, q0.y + 58, roleA, "lb", "middle"),
      text(q1.x, q1.y + 58, roleB, "lb", "middle"),
    ].join(""),
  );
}

/** NoEstasSolx: a field of students, one hub, a fan of services. The service count sets the fan; the numbers themselves
 * stay in the readout's facts, so no number is printed twice. */
function noes(c: CaseStudy) {
  const services = fact(c, "services")?.value ?? "";
  const nServices = parseInt(services.replace(/\D/g, ""), 10) || 20;
  const hub = { x: 140, y: 92 }, hw = pw(c.short);
  const dots: string[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 9; j++) {
      const jx = ((i * 7 + j * 13) % 5) - 2, jy = ((i * 11 + j * 5) % 5) - 2;
      dots.push(`<circle class="dot" cx="${10 + i * 11 + jx}" cy="${36 + j * 13 + jy}" r="1.7"/>`);
    }
  const feeds = [48, 70, 92, 114, 136].map((yy, i) => line(`M62 ${yy} Q${hub.x - 62} ${yy} ${hub.x - hw / 2 - 1} ${hub.y + (i - 2) * 4}`));
  const spokes: string[] = [], nodes: string[] = [];
  for (let i = 0; i < nServices; i++) {
    const a = ((-40 + (80 * i) / (nServices - 1)) * Math.PI) / 180;
    const x = hub.x + 112 * Math.cos(a), yy = hub.y + 112 * Math.sin(a);
    spokes.push(`<path class="ln spoke" d="M${hub.x} ${hub.y} L${x.toFixed(1)} ${yy.toFixed(1)}"/>`);
    nodes.push(`<rect class="nd svc" style="--i:${i}" x="${(x - 3).toFixed(1)}" y="${(yy - 3).toFixed(1)}" width="6" height="6" rx="1"/>`);
  }
  return svg(
    318,
    180,
    [
      ...spokes,
      ...feeds,
      comet(`M62 ${hub.y} H${hub.x}`, 0),
      ...dots,
      ...nodes,
      `<rect class="nd hub" x="${hub.x - hw / 2}" y="${hub.y - 15}" width="${hw}" height="30" rx="4"/>`,
      text(hub.x, hub.y + 4, c.short, "lb strong", "middle"),
      text(4, 172, "students", "lb", "start"),
      text(262, 96, "services", "lb", "start"),
    ].join(""),
  );
}

/** Teaching: the course as a staircase, one tread per technology in the order it is taught. */
function teaching(c: CaseStudy) {
  const steps = c.technologies;
  const x0 = 8, y0 = 168, run = 34, rise = 28;
  let d = `M${x0} ${y0}`;
  steps.forEach((_, i) => (d += `${i ? ` V${y0 - i * rise}` : ""} H${x0 + (i + 1) * run}`));
  return svg(
    300,
    180,
    [
      comet(d, 0),
      line(d),
      head(x0 + steps.length * run + 6, y0 - (steps.length - 1) * rise, 0),
      ...steps.map((_, i) => `<circle class="nd step" style="--i:${i}" cx="${x0 + i * run}" cy="${y0 - i * rise}" r="3.5"/>`),
      ...steps.map((s, i) => text(x0 + (i + 1) * run + 6, y0 - i * rise + 4, s, "lb")),
    ].join(""),
  );
}

/** The figure and its caption for each Case Study, keyed by slug. Captions only restate facts from content.ts. */
export const FIGURES: Record<string, { draw: (c: CaseStudy) => string; caption: (c: CaseStudy) => string }> = {
  blinka: { draw: blinka, caption: () => "A request through Blinka's AWS stack, and the pipeline that ships it." },
  "gold-to-mercury": { draw: gold, caption: () => "Two libraries as a two-state DFA. Only DFAs survived the rebuild." },
  noestassolx: {
    draw: noes,
    caption: () => "First-semester students reach their services through one hub.",
  },
  teaching: { draw: teaching, caption: () => "The course, one step at a time, from the first HTML tag to React." },
};
