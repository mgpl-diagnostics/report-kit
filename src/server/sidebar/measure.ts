import type { Report, Rich, Row, Section, TestRow } from "../../shared/types";
import { provenanceLines } from "../provenance";
import { SB_BODY, SB_CELL_PAD, SB_COLS, SB_CONTENT, SB_PROVENANCE, SB_ROWS as R } from "./layout";

/* ---------------------------------------------------------- content-aware heights
 * Both renderers wrap text inside fixed-height rows, so a row must reserve the height its wrapped
 * content needs, or the text spills into the next row. Line counts are estimated from Manrope's
 * average advance width (conservative: a little extra space beats an overlap). */
const EM = 0.56;
const LINE_GAP = 1.3;

/** Lines `text` wraps to in a box `widthIn` inches wide at `sizePt` (explicit "\n" breaks kept). */
export function wrapCount(text: string, widthIn: number, sizePt: number): number {
  const per = Math.max(6, Math.floor((widthIn * 72) / (sizePt * EM)));
  let total = 0;
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      total += 1;
      continue;
    }
    let lines = 1, len = 0;
    for (const w of words) {
      if (len === 0) {
        lines += Math.floor((w.length - 1) / per);
        len = ((w.length - 1) % per) + 1;
      } else if (len + 1 + w.length <= per) len += 1 + w.length;
      else {
        lines += 1 + Math.floor((w.length - 1) / per);
        len = ((w.length - 1) % per) + 1;
      }
    }
    total += lines;
  }
  return total;
}

/**
 * Font size (pt) at which `text` fits one line `widthIn` inches wide: `maxPt`, or smaller for long values
 * (a sample type like "Cell-Free DNA (cfDNA) Preservative Tube"), never below `minPt`. Header fields have a
 * fixed height, so a wrapped value would run into the field below.
 */
export function fitSize(text: string, widthIn: number, maxPt: number, minPt = 6.5, bold = false): number {
  const em = text.length * EM * (bold ? 1.08 : 1);
  if (!em) return maxPt;
  return Math.max(minPt, Math.min(maxPt, Math.floor(((widthIn * 72) / em) * 10) / 10));
}

/** A range as printed lines: a list, or text with line breaks; null for a one-line range. */
export const rangeLines = (row: TestRow): string[] | null =>
  Array.isArray(row.range)
    ? row.range
    : typeof row.range === "string" && row.range.includes("\n")
      ? row.range.split("\n").map((l) => l.trim()).filter(Boolean)
      : null;

const plain = (r: Rich): string => (typeof r === "string" ? r : (Array.isArray(r) ? r : [r]).map((x) => x.text).join(""));
const richSize = (r: Rich): number => (typeof r === "string" ? 0 : Math.max(0, ...(Array.isArray(r) ? r : [r]).map((x) => x.size ?? 0)));
const inner = (w: number) => w - 2 * SB_CELL_PAD;

function testRowHeight(row: TestRow): number {
  const f = R.fontSize;
  const nameH = wrapCount(`${row.name}${row.abbr ? ` ${row.abbr}` : ""}`, inner(SB_COLS.name), f) * f * LINE_GAP + 4;
  const resultH = wrapCount(String(row.result ?? ""), inner(SB_COLS.result), f) * f * LINE_GAP + 4;
  const lines = rangeLines(row);
  const rangeH = lines
    ? lines.reduce((n, l) => n + wrapCount(l, inner(SB_COLS.range), 7), 0) * R.rangeLine + 6
    : wrapCount(String(row.range ?? ""), inner(SB_COLS.range), f) * f * LINE_GAP + 4;
  return Math.max(R.test, nameH, resultH, rangeH);
}

/** A slice of a section placed on one page. */
export interface SbPart {
  section: Section;
  rows: Row[];
  /** true when this slice continues a section from the previous page */
  continued: boolean;
  /** true when this slice ends the section (its provenance line prints here) */
  end: boolean;
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
    case "text": {
      const size = richSize(row.content) || R.fontSize;
      const lines = wrapCount(plain(row.content), SB_CONTENT.w - 2 * SB_CELL_PAD - (row.indent ?? 0), size);
      return Math.max(R.text, lines * size * LINE_GAP + 6) + (row.spaceBefore ? 8 : 0);
    }
    case "test": {
      let h = testRowHeight(row);
      if (row.method) h += R.method;
      return h;
    }
  }
}

export function sbSectionHead(s: Section): number {
  return R.dept + (subtitleOf(s) ? R.title : 0) + (hasMeta(s) ? R.meta : 0) + (showsTableHeader(s) ? R.tableHeader : 0);
}

/** Provenance line(s) under an imported test, as printed. */
export const sbProvenanceLines = (s: Section) => provenanceLines(s, SB_PROVENANCE.maxChars);

/** Height of the provenance block under a section (0 when the test is our own), pt. */
export function sbSectionFoot(s: Section): number {
  const n = sbProvenanceLines(s).length;
  return n ? R.provenancePad + n * R.provenanceLine : 0;
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
    const foot = sbSectionFoot(section);
    const rows = displayRows(section);
    const hs = rows.map(sbRowHeight);
    const need = (i: number) => {
      let h = hs[i];
      if (rows[i].kind === "heading" && i + 1 < hs.length) h += hs[i + 1];
      // the provenance line stays with the last row (and the end legend with both)
      if (i === hs.length - 1) h += foot + (last ? R.end : 0);
      return h;
    };

    let part: Row[] = [];
    let continued = false;
    const flush = (end: boolean) => {
      pages[pages.length - 1].push({ section, rows: part, continued, end });
      part = [];
    };

    if (used > 0 && used + head + (hs.length ? need(0) : foot) > SB_CAPACITY) newPage();
    used += head;
    rows.forEach((row, i) => {
      if (part.length && used + need(i) > SB_CAPACITY) {
        flush(false);
        newPage();
        continued = true;
        used = head;
      }
      part.push(row);
      used += hs[i];
    });
    flush(true);
    used += foot + R.sectionGap;
  });

  return pages.map((parts, i) => ({ parts, isLast: i === pages.length - 1 }));
}
