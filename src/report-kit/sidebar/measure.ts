import type { Report, Row, Section } from "../types";
import { SB_BODY, SB_ROWS as R } from "./layout";

/** A slice of a section placed on one page. */
export interface SbPart {
  section: Section;
  rows: Row[];
  /** true when this slice continues a section from the previous page */
  continued: boolean;
}
export interface SbPage {
  parts: SbPart[];
  isLast: boolean;
}

/** Sections whose rows are all plain tests use the standard 5-column results table. */
export const isGrid = (s: Section) => s.rows.some((r) => r.kind === "cells");
const hasMeta = (s: Section) => !!(s.specimen || s.method);
export const showsTableHeader = (s: Section) => !(isGrid(s) && s.hideColumnHeader);

const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
/** Test-name line, unless it just repeats the department title ("SEMEN ANALYSIS" / "Semen Analysis"). */
export const subtitleOf = (s: Section): string | undefined => (s.subtitle && !same(s.subtitle, s.title) ? s.subtitle : undefined);
/** Rows as printed: a sub-heading that repeats the test name ("Lipid Profile") is dropped. */
export const displayRows = (s: Section): Row[] => s.rows.filter((r) => !(r.kind === "heading" && (same(r.text, s.subtitle) || same(r.text, s.title))));

export function sbRowHeight(row: Row): number {
  switch (row.kind) {
    case "heading":
      return R.heading;
    case "cells":
      return R.cells;
    case "text":
      return R.text + (row.spaceBefore ? 8 : 0);
    case "test": {
      let h = R.test;
      if (Array.isArray(row.range)) h = Math.max(h, row.range.length * R.rangeLine + 6);
      if (row.method) h += R.method;
      return h;
    }
  }
}

export function sbSectionHead(s: Section): number {
  return R.dept + (subtitleOf(s) ? R.title : 0) + (hasMeta(s) ? R.meta : 0) + (showsTableHeader(s) ? R.tableHeader : 0);
}

export const SB_CAPACITY = (SB_BODY.bottom - SB_BODY.top) * 72;

/** Splits the report into A4 pages for the Navy Sidebar design. */
export function sbLayoutPages(report: Report): SbPage[] {
  const pages: SbPart[][] = [[]];
  let used = 0;
  const newPage = () => {
    pages.push([]);
    used = 0;
  };

  report.sections.forEach((section, si) => {
    const last = si === report.sections.length - 1;
    if (section.pageBreakBefore && pages[pages.length - 1].length) newPage();
    const head = sbSectionHead(section);
    const rows = displayRows(section);
    const hs = rows.map(sbRowHeight);
    const need = (i: number) => {
      let h = hs[i];
      if (rows[i].kind === "heading" && i + 1 < hs.length) h += hs[i + 1];
      if (last && i === hs.length - 1) h += R.end;
      return h;
    };

    let part: Row[] = [];
    let continued = false;
    const flush = () => {
      pages[pages.length - 1].push({ section, rows: part, continued });
      part = [];
    };

    if (used > 0 && used + head + (hs.length ? need(0) : 0) > SB_CAPACITY) newPage();
    used += head;
    rows.forEach((row, i) => {
      if (part.length && used + need(i) > SB_CAPACITY) {
        flush();
        newPage();
        continued = true;
        used = head;
      }
      part.push(row);
      used += hs[i];
    });
    flush();
    used += R.sectionGap;
  });

  return pages.map((parts, i) => ({ parts, isLast: i === pages.length - 1 }));
}
