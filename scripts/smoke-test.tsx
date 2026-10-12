// Smoke test — renders every sample report in both designs ("sidebar", "classic") and both
// variants (header / non-header), as HTML and as a Node PDF, plus the blank letterhead, and checks:
//   - nothing throws; files are real PDFs
//   - HTML and PDF have the same number of pages as the shared page layout
//   - every patient field and result value is present in the HTML
//   - the non-header variant never prints the letterhead (logo, sidebar, address)
//   - every printed text fits its column, measured with the real fonts (react-pdf would cut it)
//   - every printed character exists in the font (a missing glyph crashes react-pdf)
//   - every lab asset and font file exists
//   npm run smoke
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import { renderToStaticMarkup } from "react-dom/server";
import {
  headerCells,
  LabReport,
  layoutPages,
  MGPL_LAB,
  sbLayoutPages,
  SidebarLetterhead,
  SIDEBAR_LAYOUT,
  type Report,
  type ReportDesign,
  type ReportVariant,
  type Rich,
  type Row,
} from "../src";
import { renderLetterheadPdf, renderReportPdf } from "../src/pdf";
import { gridColumns, isTwoColumn, LEGAL, LEGEND, patientFields, sectionMeta, TWO_COL_RESULT_W } from "../src/sidebar/model";
import { displayRows, subtitleOf } from "../src/sidebar/measure";
import { getSampleReport, SAMPLES } from "../src/samples";

const root = process.cwd();
const fontDir = join(root, "assets", "report-fonts");
const open = (f: string) => fontkit.openSync(join(fontDir, f)) as fontkit.Font;
const carlito = { 400: open("carlito-400.woff"), 700: open("carlito-700.woff") };
const manrope = { 400: open("manrope-400.woff"), 600: open("manrope-600.woff"), 700: open("manrope-700.woff"), 800: open("manrope-800.woff") };
type Weight = keyof typeof manrope;

/** inches */
const widthIn = (f: fontkit.Font, text: string, size: number, letterSpacingPt = 0) =>
  ((f.layout(text).advanceWidth / f.unitsPerEm) * size + letterSpacingPt * text.length) / 72;

const problems: string[] = [];
const warn = (m: string) => problems.push(m);
const runs = (r: Rich): { text: string; bold: boolean; size?: number }[] =>
  typeof r === "string" ? [{ text: r, bold: false }] : (Array.isArray(r) ? r : [r]).map((x) => ({ text: x.text, bold: !!x.bold, size: x.size }));

/* ---------------------------------------------------------- glyph coverage */
function checkGlyphs(where: string, text: string, fonts: fontkit.Font[]) {
  for (const ch of new Set(text)) {
    const cp = ch.codePointAt(0)!;
    if (cp < 32) continue;
    if (!fonts.every((f) => f.hasGlyphForCodePoint(cp))) warn(`${where}: character "${ch}" (U+${cp.toString(16).toUpperCase().padStart(4, "0")}) is missing from the font`);
  }
}
function allText(report: Report): string {
  const out: string[] = patientFields(report).flatMap((f) => [f.label, f.value]);
  for (const s of report.sections) {
    out.push(s.title, s.subtitle ?? "", sectionMeta(s), ...s.columns.map((c) => c.header));
    for (const r of s.rows) {
      if (r.kind === "heading") out.push(r.text);
      if (r.kind === "test") out.push(r.name, r.abbr ?? "", r.result ?? "", r.unit ?? "", ...(Array.isArray(r.range) ? r.range : [r.range ?? ""]), r.method ?? "");
      if (r.kind === "cells") out.push(...r.cells.flatMap(runs).map((x) => x.text));
      if (r.kind === "text") out.push(...runs(r.content).map((x) => x.text));
    }
  }
  return out.join(" ");
}

/* ------------------------------------------------------ fit: classic design */
function fitClassic(id: string, report: Report) {
  const w = (t: string, size: number, bold: boolean, helv: boolean) => widthIn(bold ? carlito[700] : carlito[400], t, size) * (helv ? 1.12 : 1);
  for (const s of report.sections) {
    const st = s.style ?? {};
    const f = st.fontSize ?? 11;
    const helv = /arial|helvetica/i.test(st.font ?? "");
    for (const c of headerCells(s)) {
      const need = w(c.header, 11, true, false);
      const room = c.spanWidth - (c.headerPadLeft ?? 0.08) - 0.08;
      if (need > room + 0.01) warn(`classic ${id}: header "${c.header}" needs ${need.toFixed(2)}in, has ${room.toFixed(2)}in`);
    }
    for (const row of s.rows) {
      if (row.kind !== "test" && row.kind !== "cells") continue;
      s.columns.forEach((c, k) => {
        let lines: { text: string; bold: boolean; size?: number }[][] = [];
        if (row.kind === "cells") lines = [runs(row.cells[k] ?? "")];
        else if (c.key === "name") lines = [[{ text: row.name, bold: !!st.nameBold, size: st.nameSize }, ...(row.abbr ? [{ text: " " + row.abbr, bold: true }] : [])]];
        else if (c.key === "result") lines = [[{ text: row.result ?? "", bold: true, size: st.resultSize }]];
        else if (c.key === "unit") lines = [[{ text: row.unit ?? "", bold: !!st.unitBold }]];
        else if (c.key === "range")
          lines = Array.isArray(row.range) ? row.range.map((l) => [{ text: l, bold: false, size: st.rangeSize ?? 7 }]) : [[{ text: row.range ?? "", bold: !!st.rangeBold }]];
        const need = Math.max(...lines.map((ln) => ln.reduce((a, p) => a + w(p.text, p.size ?? f, p.bold, helv), 0)));
        const room = c.width - (c.padLeft ?? 0) - (k === 0 ? st.indent ?? 0 : 0);
        if (need > room + 0.01) warn(`classic ${id}: "${lines[0].map((p) => p.text).join("")}" needs ${need.toFixed(2)}in, column "${c.key}" has ${room.toFixed(2)}in`);
      });
    }
  }
}

/* ------------------------------------------------------ fit: sidebar design */
function fitSidebar(id: string, report: Report) {
  const { SB_COLS, SB_CELL_PAD, SB_ROWS, SB_PATIENT, SB_CONTENT } = SIDEBAR_LAYOUT;
  const fs = SB_ROWS.fontSize;
  const pad = 2 * SB_CELL_PAD;
  const check = (what: string, need: number, room: number) => {
    if (need > room + 0.005) warn(`sidebar ${id}: ${what} needs ${need.toFixed(2)}in, has ${room.toFixed(2)}in`);
  };
  patientFields(report).forEach((f) =>
    check(`patient "${f.label}" = "${f.value}"`, widthIn(manrope[f.strong ? 800 : 600], f.value, SB_PATIENT.grid.valueSize), SB_PATIENT.grid.colW - 0.08),
  );
  for (const s of report.sections) {
    check(`title "${s.title}"`, widthIn(manrope[800], s.title, 11.5), SB_CONTENT.w);
    const sub = subtitleOf(s);
    if (sub) check(`subtitle "${sub}"`, widthIn(manrope[700], sub, 10), SB_CONTENT.w);
    const grid = s.rows.some((r) => r.kind === "cells");
    if (grid) {
      const { cols, headers } = gridColumns(s);
      headers.forEach((h) => check(`header "${h.header}"`, widthIn(manrope[700], h.header.toUpperCase(), 7, 0.5), h.w - pad));
      for (const r of displayRows(s)) {
        if (r.kind !== "cells") continue;
        cols.forEach((c, k) => {
          const need = runs(r.cells[k] ?? "").reduce((a, p) => a + widthIn(manrope[p.bold ? 800 : 400], p.text, p.size ?? fs), 0);
          check(`cell "${runs(r.cells[k] ?? "").map((p) => p.text).join("")}"`, need, c.w - pad);
        });
      }
      continue;
    }
    const twoCol = isTwoColumn(s);
    for (const r of displayRows(s) as Row[]) {
      if (r.kind !== "test") continue;
      const name = widthIn(manrope[400], r.name, fs) + (r.abbr ? widthIn(manrope[700], " " + r.abbr, fs) : 0);
      check(`name "${r.name}${r.abbr ? " " + r.abbr : ""}"`, name, SB_COLS.name - pad);
      if (r.method) check(`method "${r.method}"`, widthIn(manrope[400], r.method, 6.8), SB_COLS.name - pad);
      if (twoCol) {
        check(`result "${r.result ?? ""}"`, widthIn(manrope[800], r.result ?? "", fs), TWO_COL_RESULT_W - pad);
        continue;
      }
      check(`result "${r.result ?? ""}"`, widthIn(manrope[800], r.result ?? "", fs), SB_COLS.result - pad);
      check(`unit "${r.unit ?? ""}"`, widthIn(manrope[400], r.unit ?? "", fs), SB_COLS.unit - pad);
      for (const line of Array.isArray(r.range) ? r.range : [r.range ?? ""])
        check(`range "${line}"`, widthIn(manrope[400], line, Array.isArray(r.range) ? 7 : fs), SB_COLS.range - pad);
    }
  }
}

function expectedValues(report: Report): string[] {
  const p = report.patient;
  const out = [p.name, String(p.age), p.sex];
  for (const s of report.sections) for (const r of s.rows) if (r.kind === "test" && r.result) out.push(r.result);
  return out.filter(Boolean);
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** All text in a PDF (Mozilla pdf.js), whitespace removed — used to prove values were really drawn. */
async function pdfText(buf: Buffer): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(buf), disableFontFace: true, verbosity: 0 });
  const doc = await task.promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    out += c.items.map((i) => ("str" in i ? i.str : "")).join("");
  }
  await task.destroy();
  if (out.trim().length < 50) throw new Error("PDF text extraction returned almost nothing");
  return out.replace(/\s+/g, "");
}
const squash = (s: string) => s.replace(/\s+/g, "");
const pdfPageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;

async function main() {
  const t0 = Date.now();
  /* assets */
  const lab = MGPL_LAB;
  for (const s of [lab.logoSrc, lab.qcStampSrc!, lab.icons.emailSrc, lab.icons.phoneSrc, lab.signatory.signatureHeaderSrc, lab.signatory.signatureNonHeaderSrc])
    if (!existsSync(join(root, "assets", s))) warn(`missing asset public${s}`);
  for (const f of ["carlito-400.woff", "carlito-700.woff", "carlito-400-italic.woff", "carlito-700-italic.woff", "archivo-black-400.woff", "barlow-semi-condensed-300.woff", ...[400, 500, 600, 700, 800].map((w) => `manrope-${w}.woff`)])
    if (!existsSync(join(fontDir, f))) warn(`missing font ${f}`);

  /* letterhead text + glyphs + fit */
  const lhText = [lab.sidebarText ?? "", ...lab.addressLines, lab.phone, lab.email, ...(lab.footerLines ?? []), LEGEND, LEGAL, lab.signatory.name, lab.signatory.designation].join(" ");
  checkGlyphs("letterhead", lhText, [manrope[400], manrope[800]]);
  (lab.footerLines ?? []).forEach((l, k) =>
    widthIn(manrope[k === 0 ? 700 : 400], l, SIDEBAR_LAYOUT.SB_FOOTER.lines.size) > SIDEBAR_LAYOUT.SB_CONTENT.w && warn(`footer line ${k + 1} is wider than the page content`),
  );

  /* letterhead render */
  try {
    const html = renderToStaticMarkup(<SidebarLetterhead />);
    if (!html.includes("sb-side") || !html.includes(lab.logoSrc)) warn("letterhead HTML is missing the sidebar or logo");
    const pdf = await renderLetterheadPdf();
    if (pdfPageCount(pdf) !== 1) warn("letterhead PDF must be exactly 1 page");
    console.log(`ok   letterhead                                     1 page`);
  } catch (e) {
    warn(`letterhead threw ${(e as Error).stack}`);
  }

  /* reports */
  const designs: ReportDesign[] = ["sidebar", "classic"];
  const variants: ReportVariant[] = ["header", "non-header"];
  let ok = 0;
  for (const sample of SAMPLES) {
    const report = getSampleReport(sample.id)!;
    const text = allText(report);
    checkGlyphs(`sidebar ${sample.id}`, text, [manrope[400], manrope[800]]);
    checkGlyphs(`classic ${sample.id}`, text, [carlito[400], carlito[700]]);
    fitSidebar(sample.id, report);
    fitClassic(sample.id, report);

    for (const d of designs) {
      const pages = d === "sidebar" ? sbLayoutPages(report).length : layoutPages(report).length;
      for (const v of variants) {
        const tag = `${d}/${sample.id}/${v}`;
        try {
          const html = renderToStaticMarkup(<LabReport design={d} report={report} variant={v} />);
          const htmlPages = html.split(d === "sidebar" ? 'class="sb-page"' : 'class="mg-page ').length - 1;
          if (htmlPages !== pages) warn(`${tag}: HTML has ${htmlPages} pages, layout says ${pages}`);
          for (const val of expectedValues(report)) if (!html.includes(esc(val))) warn(`${tag}: HTML is missing "${val}"`);
          const printsLetterhead = html.includes(lab.logoSrc) || html.includes('class="sb-side"') || html.includes(esc(lab.addressLines[0]));
          if (v === "header" && !printsLetterhead) warn(`${tag}: letterhead missing`);
          if (v === "non-header" && printsLetterhead) warn(`${tag}: non-header must not print the letterhead`);

          const pdf = await renderReportPdf({ report, variant: v, design: d });
          if (pdf.subarray(0, 5).toString() !== "%PDF-") warn(`${tag}: not a PDF`);
          if (pdfPageCount(pdf) !== pages) warn(`${tag}: PDF has ${pdfPageCount(pdf)} pages, layout says ${pages}`);
          const text = await pdfText(pdf);
          for (const val of expectedValues(report)) if (!text.includes(squash(val))) warn(`${tag}: PDF is missing "${val}"`);
          ok++;
          console.log(`ok   ${tag.padEnd(46)} ${pages} page(s)  ${(pdf.length / 1024).toFixed(0)} KB`);
        } catch (e) {
          warn(`${tag}: threw ${(e as Error).stack}`);
        }
      }
    }
  }

  const total = SAMPLES.length * designs.length * variants.length;
  console.log(`\n${ok}/${total} report renders passed (${SAMPLES.length} samples × 2 designs × 2 variants) + letterhead, in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of [...new Set(problems)]) console.log("  - " + p);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main();
