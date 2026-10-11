// PROTOTYPE: throwaway. Date helpers for variant A. Everything resolves "present" against ctx.now, never the clock.
import type { YearMonth } from "../../data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const yearOf = (ym: YearMonth) => Number(ym.slice(0, 4));
const idx = (ym: YearMonth) => yearOf(ym) * 12 + Number(ym.slice(5, 7)) - 1;

/** "2025-08" → "Aug 2025". */
export const monthYear = (ym: YearMonth) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

/** Inclusive length, as a hard count: "5 mo", "1 yr", "1 yr 2 mo". */
export function span(start: YearMonth, end: YearMonth): string {
  const n = idx(end) - idx(start) + 1;
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
}

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
