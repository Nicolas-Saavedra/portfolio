// PROTOTYPE: throwaway. Variant D's scene model: a time-proportional axis, the lanes, and where every flag goes.
// Pure data, no DOM; on the real site all of it runs at build time.
//
// The scene is drawn once, horizontally: time runs left to right in fractions of the axis (0 = the axis start,
// 1 = its end), and the three lanes sit at fixed fractions of the lane block's height. On phones CSS rotates that same
// block by -90° (newest on top, Teaching left, Engineering right, as in D), so the model never thinks about phones,
// except for the flags, which are text and can't rotate: they get a second placement (`py`, px from the top).
import { caseStudyOf, monthIndex, type CaseStudy, type Role } from "../../content";
import type { VariantContext } from "../../types";

export type LaneId = "top" | "mid" | "bot";
/** Lane positions as fractions of the lane block's height (84 px on desktop, 56 px across on phones). */
export const LANE_Y: Record<LaneId, number> = { top: 0.2, mid: 0.5, bot: 0.8 };

/** Horizontal flags: the narrowest axis they're laid out for (768 px, minus padding), and their width there. */
const H_AXIS_PX = 704;
const H_FLAG_PX = 160;
/** Phones: px per month of the vertical axis, and the narrowest flag column (360 px phone). */
export const V_PX_PER_MONTH = 12;
const V_COL_PX = 112;

export interface Piece {
  lane: LaneId;
  a: number;
  b: number;
  s: "active" | "idle";
  /** The selection key the piece lights up with (a Case Study slug, a role id, or "education"). */
  key: string;
}

/** One flag on the scene: a Role, the thesis (a span that isn't a role) or Education. */
export interface Item {
  id: string;
  kind: "role" | "thesis" | "edu";
  lane: LaneId;
  /** The bar it labels, as axis fractions (start, exclusive end). */
  a: number;
  b: number;
  /** Selection key: which readout a click checks out. */
  key: string;
  role?: Role;
  cs?: CaseStudy;
  /** Horizontal placement: side, tier (0 nearest the lanes), anchor fraction, and whether it hangs left of it. */
  side: "top" | "bot";
  tier: number;
  x: number;
  end: boolean;
  /** Phone placement: px from the scene's top, and the column. */
  py: number;
}

export interface Arc {
  key: string;
  d: string;
}

export function sceneModel(ctx: VariantContext) {
  const now = monthIndex(ctx.now);
  const roles = ctx.entries;
  const endX = (end: string) => (end === "present" ? now + 1 : monthIndex(end) + 1); // exclusive: June covers June
  const t0 = Math.min(...roles.map((r) => monthIndex(r.start))) - 2;
  // With Open to Work the axis runs three months past now, for the "next" stub.
  const t1 = now + 1 + (ctx.openToWork ? 3 : 0);
  const months = t1 - t0;
  const f = (m: number) => (m - t0) / months;

  const laneOf: Record<string, LaneId> = { [ctx.tracks[0].id]: "bot", [ctx.tracks[1].id]: "top" };
  const keyOfRole = (r: Role) => r.caseStudy ?? r.id;
  const eduS = monthIndex(ctx.education.start);
  const eduE = monthIndex(ctx.education.end) + 1;

  // ── Lanes: each Track solid in a role, dotted between roles; Education the trunk. ──
  const pieces: Piece[] = [];
  for (const t of ctx.tracks) {
    const rs = roles.filter((r) => r.track === t.id).sort((p, q) => monthIndex(p.start) - monthIndex(q.start));
    rs.forEach((r, i) => {
      const s = monthIndex(r.start), e = endX(r.end);
      pieces.push({ lane: laneOf[t.id], a: f(s), b: f(e), s: "active", key: keyOfRole(r) });
      const next = rs[i + 1];
      if (next && monthIndex(next.start) > e) pieces.push({ lane: laneOf[t.id], a: f(e), b: f(monthIndex(next.start)), s: "idle", key: "" });
    });
  }
  const offScale = eduS < t0; // the degree starts before the axis: the trunk comes in from the left edge
  pieces.push({ lane: "mid", a: f(Math.max(eduS, t0)), b: f(eduE), s: "active", key: "education" });

  // ── Forks: each Track leaves the trunk just before its first role. ──
  const X = (fr: number) => (fr * 1000).toFixed(1);
  const Y = (l: LaneId) => LANE_Y[l] * 100;
  const K = 14; // curve run, in viewBox units (1000 = the axis)
  const forks = ctx.tracks.map((t) => {
    const x = f(Math.min(...roles.filter((r) => r.track === t.id).map((r) => monthIndex(r.start)))) * 1000;
    const y = Y(laneOf[t.id]);
    return `M${(x - 2 * K).toFixed(1)} 50 C${(x - K).toFixed(1)} 50 ${(x - K).toFixed(1)} ${y} ${x.toFixed(1)} ${y}`;
  });

  // ── Story arcs: a Case Study whose spans are apart gets a line from each span's end to the next span's start.
  // Same lane (Teaching): a bridge that dips toward the trunk under the gap. Different lanes (GOLD → mercury): the
  // line leaves the role's lane, runs between the lanes, and climbs into the thesis on the trunk. ──
  const spanLane = (cs: CaseStudy, i: number): LaneId => {
    const s = cs.spans[i];
    if (!s.role) return "mid"; // not a role: it happened inside the degree
    return laneOf[roles.find((r) => r.id === s.role)!.track];
  };
  const arcs: Arc[] = [];
  for (const cs of ctx.work) {
    for (let i = 0; i < cs.spans.length - 1; i++) {
      const x1 = f(endX(cs.spans[i].end)) * 1000, x2 = f(monthIndex(cs.spans[i + 1].start)) * 1000;
      const l1 = spanLane(cs, i), l2 = spanLane(cs, i + 1);
      const y1 = Y(l1), y2 = Y(l2);
      const ym = l1 === l2 ? y1 + 13 : (y1 + y2) / 2;
      arcs.push({
        key: cs.slug,
        d: `M${x1.toFixed(1)} ${y1} C${(x1 + K).toFixed(1)} ${y1} ${(x1 + K).toFixed(1)} ${ym} ${(x1 + 2 * K).toFixed(1)} ${ym} L${(x2 - 2 * K).toFixed(1)} ${ym} C${(x2 - K).toFixed(1)} ${ym} ${(x2 - K).toFixed(1)} ${y2} ${x2.toFixed(1)} ${y2}`,
      });
    }
  }

  // ── Open to Work: dashed stubs from each Track still running now into one "next" node on the middle lane. ──
  const running = ctx.tracks.filter((t) => roles.some((r) => r.track === t.id && r.end === "present")).map((t) => laneOf[t.id]);
  const xNow = f(now + 1);
  const xNext = f(now + 3);
  const next = ctx.openToWork
    ? running.map((l) => `M${X(xNow)} ${Y(l)} C${X(xNow + (xNext - xNow) * 0.6)} ${Y(l)} ${X(xNext - (xNext - xNow) * 0.5)} 50 ${X(xNext)} 50`)
    : [];

  // ── Items (flags). Newest first within each group, which is also their reading order. ──
  const items: Item[] = [];
  const blank = { side: "top" as const, tier: 0, x: 0, end: false, py: 0 };
  for (const t of ctx.tracks)
    for (const r of roles.filter((q) => q.track === t.id))
      items.push({ ...blank, id: r.id, kind: "role", lane: laneOf[t.id], a: f(monthIndex(r.start)), b: f(endX(r.end)), key: keyOfRole(r), role: r, cs: caseStudyOf(r) });
  for (const cs of ctx.work)
    for (const s of cs.spans)
      if (!s.role)
        items.push({ ...blank, id: `${cs.slug}-thesis`, kind: "thesis", lane: "mid", a: f(monthIndex(s.start)), b: f(endX(s.end)), key: cs.slug, cs });
  items.push({ ...blank, id: "education", kind: "edu", lane: "mid", a: f(Math.max(eduS, t0)), b: f(eduE), key: "education" });

  // Horizontal: Engineering below the lanes; Teaching, the thesis and Education above. Each flag hangs right of its
  // bar's start, or left of its end if it would run off the axis. Tiers are first-fit, laid out for the narrowest
  // horizontal axis, so wider screens only gain air.
  const w = H_FLAG_PX / H_AXIS_PX;
  for (const side of ["top", "bot"] as const) {
    const placed: { tier: number; l: number; r: number }[] = [];
    for (const it of items.filter((i) => (side === "bot") === (i.lane === "bot")).sort((p, q) => p.a - q.a)) {
      const wi = it.kind === "edu" ? w * 1.5 : w;
      it.side = side;
      it.end = it.a + wi > 1;
      it.x = it.end ? it.b : it.a;
      const l = it.end ? it.b - wi : it.a, r = l + wi;
      let tier = 0;
      while (placed.some((p) => p.tier === tier && p.l < r + 0.01 && l < p.r + 0.01)) tier++;
      it.tier = tier;
      placed.push({ tier, l, r });
    }
  }
  const tiers = (side: "top" | "bot") => Math.max(0, ...items.filter((i) => i.side === side).map((i) => i.tier + 1));

  // Phones: Teaching, thesis and Education in the left column, Engineering in the right, each flag's top level with
  // its bar's newest end, pushed down when the one above is still there. Heights are estimates from character
  // counts at the narrowest column; generous, so a real overlap is unlikely.
  const len = months * V_PX_PER_MONTH;
  const lines = (s: string, px: number) => Math.max(1, Math.ceil((s.length * px) / V_COL_PX));
  // The dates line wraps when it's long ("Aug 2023 – May 2024", or a draft tag); 6 px per mono glyph at 10 px.
  const dates = (it: Item, extra = 0) => {
    const s = it.kind === "edu" ? ctx.education : it.kind === "thesis" ? it.cs!.spans.find((x) => !x.role)! : it.role!;
    const same = s.end !== "present" && s.start.slice(0, 4) === s.end.slice(0, 4);
    return lines("x".repeat((same ? 14 : 19) + extra), 6) * 16;
  };
  const estimate = (it: Item) => {
    if (it.kind === "edu") return dates(it) + lines(ctx.education.degree, 7.6) * 18.4 + lines(ctx.education.institution, 6.6) * 16 + 4;
    if (it.kind === "thesis") return dates(it, 3) + lines(it.cs!.spans.find((x) => !x.role)!.label, 7.6) * 18.4 + 16 + 4;
    const r = it.role!;
    return dates(it, (it.cs ? 3 : 0) + (r.draft ? 7 : 0)) + lines(r.title, 7.6) * 18.4 + (r.context ? lines(r.context, 6.6) * 16 : 0) + lines(r.organization, 6.6) * 16 + 4;
  };
  let sceneV = len;
  for (const col of [true, false]) {
    let bottom = -Infinity;
    for (const it of items.filter((i) => (i.lane === "bot") !== col).sort((p, q) => p.b - q.b).reverse()) {
      it.py = Math.round(Math.max((1 - it.b) * len, bottom + 10));
      bottom = it.py + estimate(it);
      sceneV = Math.max(sceneV, bottom);
    }
  }

  // Years: a tick at each January inside the axis, plus the axis start's own year if there's room before the first.
  const years: { year: number; a: number; b: number }[] = [];
  const y0 = Math.floor(t0 / 12), yN = Math.floor(now / 12);
  for (let y = y0; y <= yN; y++) {
    const a = f(Math.max(y * 12, t0));
    if (y === y0 && f((y + 1) * 12) - a < 0.15) continue;
    years.push({ year: y, a, b: y === yN ? 2 : f((y + 1) * 12) });
  }

  // Each Track's tip now, if it's still running there.
  const tips = running;

  return {
    now, t0, t1, months, f, xNow, xNext, pieces, forks, arcs, next, items, tiers, years, tips, len,
    sceneV: Math.ceil(sceneV + 8),
    offScale,
    eduEnd: f(eduE),
    endX,
    laneOf,
  };
}
export type Scene = ReturnType<typeof sceneModel>;
