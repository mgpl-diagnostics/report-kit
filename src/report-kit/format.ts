import type { Flag, Patient, Section, TestRow } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** DD-MM-YYYY, like the original reports. Strings are printed as-is. */
export function formatDate(value: Date | string | undefined): string {
  if (typeof value === "string") return value;
  const d = value ?? new Date();
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function formatDoctor(ref: string | undefined): string {
  const v = (ref ?? "Self").trim();
  return /^dr\b/i.test(v) ? v : `Dr. ${v}`;
}

const num = (s: string) => {
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
};

/**
 * Works out whether a result is outside its reference range.
 * Understands "12.0 - 15.0", "9.0 – 17.0", "<20", "< 1.0", ">40", "<1 - 2".
 * Non-numeric results (Nil, Negative…) are treated as normal unless flagged.
 */
export function resolveFlag(row: TestRow): Exclude<Flag, "auto"> {
  if (row.flag && row.flag !== "auto") return row.flag;
  const result = row.result?.trim();
  const range = Array.isArray(row.range) ? undefined : row.range?.trim();
  if (!result || !range) return "normal";
  const value = num(result);
  if (Number.isNaN(value) || !/^\s*-?\d/.test(result)) return "normal";

  const between = range.match(/^<?\s*(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/);
  if (between) {
    const lo = parseFloat(between[1]);
    const hi = parseFloat(between[2]);
    if (value < lo) return "low";
    if (value > hi) return "high";
    return "normal";
  }
  const lt = range.match(/^<\s*=?\s*(-?\d+(?:\.\d+)?)$/);
  if (lt) return value >= parseFloat(lt[1]) ? "high" : "normal";
  const gt = range.match(/^>\s*=?\s*(-?\d+(?:\.\d+)?)$/);
  if (gt) return value <= parseFloat(gt[1]) ? "low" : "normal";
  return "normal";
}

export const fullName = (p: Patient) => [p.title, p.name].filter(Boolean).join(" ");

/** Splits sections into A4 pages at `pageBreakBefore`. */
export function paginate(sections: Section[]): Section[][] {
  const pages: Section[][] = [[]];
  for (const s of sections) {
    if (s.pageBreakBefore && pages[pages.length - 1].length) pages.push([]);
    pages[pages.length - 1].push(s);
  }
  return pages;
}
