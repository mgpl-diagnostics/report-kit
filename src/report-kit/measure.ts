/**
 * Row heights + page splitting, shared by the HTML preview and the PDF renderer.
 * Both renderers give every row exactly the height computed here, so the preview,
 * the printed page and the PDF always break pages at the same place.
 * All values are in pt (1in = 72pt).
 */
import { BODY_TOP, END, PATIENT, SECTION, TITLE_BAR } from "./layout";
import type { Column, Report, Rich, Row, Section } from "./types";

export const LINE = 1.22; // Calibri / Carlito single line spacing
const IN = 72;

/** Lowest point (inches from page top) the body may reach before the signature area. */
export const CONTENT_BOTTOM = 9.85;

export interface RowBox {
  /** Height of the main line(s), pt */
  height: number;
  /** Space after the main line(s), pt */
  gap: number;
  /** Italic method line under a test */
  method?: { gapTop: number; height: number; gap: number; size: number };
}

const richSizes = (r: Rich): number[] =>
  typeof r === "string" ? [] : (Array.isArray(r) ? r : [r]).map((x) => x.size ?? 0);

export function rowBox(row: Row, section: Section): RowBox {
  const st = section.style ?? {};
  const f = st.fontSize ?? 11;
  const gap = st.rowGap ?? 6;
  switch (row.kind) {
    case "heading":
      return { height: (row.size ?? st.headingSize ?? 11) * LINE, gap: st.headingGap ?? gap };
    case "text":
      return { height: (row.spaceBefore ?? 0) + Math.max(f, ...richSizes(row.content)) * LINE, gap };
    case "cells":
      return { height: Math.max(f, ...row.cells.flatMap(richSizes)) * LINE, gap };
    case "test": {
      let h = Math.max(f, st.nameSize ?? 0, st.resultSize ?? 0) * LINE;
      if (Array.isArray(row.range)) h = Math.max(h, row.range.length * (st.rangeSize ?? 7) * 1.2);
      if (st.rowHeight) h = Math.max(h, st.rowHeight);
      if (!row.method) return { height: h, gap };
      const size = st.methodSize ?? f;
      return { height: h, gap: 0, method: { gapTop: st.methodGap ?? 6, height: size * LINE, gap, size } };
    }
  }
}

export const rowTotal = (b: RowBox) => b.height + b.gap + (b.method ? b.method.gapTop + b.method.height + b.method.gap : 0);

/** Blue band: title line + optional column-header line, pt */
export function sectionHead(section: Section) {
  const title = (section.style?.titleSize ?? 12) * 1.3;
  const columns = section.hideColumnHeader ? 0 : SECTION.colHeader.lineHeight * IN;
  return { title, columns, total: title + columns + SECTION.border * 3 };
}

/** Column-header cells with `headerSpan` merged (width = sum of spanned columns). */
export function headerCells(section: Section): (Column & { spanWidth: number })[] {
  const out: (Column & { spanWidth: number })[] = [];
  for (let k = 0; k < section.columns.length; ) {
    const c = section.columns[k];
    const span = Math.max(1, c.headerSpan ?? 1);
    const spanWidth = section.columns.slice(k, k + span).reduce((a, x) => a + x.width, 0);
    out.push({ ...c, spanWidth });
    k += span;
  }
  return out;
}

export const END_HEIGHT = END.marginTop * IN + END.size * LINE;

/** Space for sections on one page, pt */
export function pageCapacity() {
  return (CONTENT_BOTTOM - BODY_TOP - TITLE_BAR.h - PATIENT.height) * IN;
}

/**
 * Splits the report into A4 pages. Sections that do not fit continue on the next page
 * (the blue band is repeated). Honours `section.pageBreakBefore`; keeps sub-headings
 * with the row below them; keeps "--End of Report--" with the last row.
 */
export function layoutPages(report: Report): Section[][] {
  const capacity = pageCapacity();
  const gapAfter = SECTION.gapAfter * IN;
  const pages: Section[][] = [[]];
  let used = 0;
  const newPage = () => {
    pages.push([]);
    used = 0;
  };

  report.sections.forEach((section, si) => {
    const lastSection = si === report.sections.length - 1;
    if (section.pageBreakBefore && pages[pages.length - 1].length) newPage();
    const head = sectionHead(section).total;
    const heights = section.rows.map((r) => rowTotal(rowBox(r, section)));
    // what must sit together with row i: a heading needs the next row as well
    const need = (i: number) => {
      let h = heights[i];
      if (section.rows[i].kind === "heading" && i + 1 < heights.length) h += heights[i + 1];
      if (lastSection && i === heights.length - 1) h += END_HEIGHT;
      return h;
    };

    let part: Row[] = [];
    const flush = () => {
      if (part.length || !section.rows.length) pages[pages.length - 1].push({ ...section, rows: part, pageBreakBefore: false });
      part = [];
    };

    if (!section.rows.length) {
      if (used + head > capacity && used > 0) newPage();
      flush();
      used += head + gapAfter;
      return;
    }
    if (used > 0 && used + head + need(0) > capacity) newPage();
    used += head;
    section.rows.forEach((row, i) => {
      if (part.length && used + need(i) > capacity) {
        flush();
        newPage();
        used = head;
      }
      part.push(row);
      used += heights[i];
    });
    flush();
    used += gapAfter;
  });
  return pages;
}
