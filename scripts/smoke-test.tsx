// Smoke test: renders every sample report in both variants (HTML + Node PDF) and checks
//   - nothing throws
//   - HTML and PDF have the same number of pages as the shared page layout
//   - every patient field and result value is present in the HTML
//   - every cell's text fits its column (measured with the real fonts) — react-pdf would
//     otherwise truncate it with "…"
//   - every lab asset file exists
//   npm run smoke
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import { renderToStaticMarkup } from "react-dom/server";
import { headerCells, layoutPages, MGPL_LAB, ReportDocument, type Report, type ReportVariant, type Rich } from "../src/report-kit";
import { renderReportPdf } from "../src/report-kit/pdf";
import { getSampleReport, SAMPLES } from "../src/app/samples";

const root = process.cwd();
const fontDir = join(root, "public", "report-fonts");
const fonts = {
  regular: fontkit.openSync(join(fontDir, "carlito-400.woff")) as fontkit.Font,
  bold: fontkit.openSync(join(fontDir, "carlito-700.woff")) as fontkit.Font,
  title: fontkit.openSync(join(fontDir, "archivo-black-400.woff")) as fontkit.Font,
};
/** Width in inches. Arial/Helvetica is ~8% wider than Carlito — approximate it. */
function textWidth(text: string, size: number, bold = false, helvetica = false) {
  const f = bold ? fonts.bold : fonts.regular;
  const w = (f.layout(text).advanceWidth / f.unitsPerEm) * size;
  return ((helvetica ? w * 1.12 : w) / 72);
}
const richText = (r: Rich): { text: string; bold: boolean; size?: number }[] =>
  typeof r === "string" ? [{ text: r, bold: false }] : (Array.isArray(r) ? r : [r]).map((x) => ({ text: x.text, bold: !!x.bold, size: x.size }));

const problems: string[] = [];
const warn = (m: string) => problems.push(m);

function checkFit(id: string, report: Report) {
  for (const s of report.sections) {
    const st = s.style ?? {};
    const f = st.fontSize ?? 11;
    const helv = /arial|helvetica/i.test(st.font ?? "");
    for (const c of headerCells(s)) {
      const w = textWidth(c.header, 11, true);
      const room = c.spanWidth - (c.headerPadLeft ?? 0.08) - 0.08;
      if (w > room + 0.01) warn(`${id}: header "${c.header}" needs ${w.toFixed(2)}in, column has ${room.toFixed(2)}in`);
    }
    for (const row of s.rows) {
      if (row.kind !== "test" && row.kind !== "cells") continue;
      s.columns.forEach((c, k) => {
        let parts: { text: string; bold: boolean; size?: number }[] = [];
        if (row.kind === "cells") parts = richText(row.cells[k] ?? "");
        else if (c.key === "name") parts = [{ text: row.name, bold: !!st.nameBold, size: st.nameSize }, ...(row.abbr ? [{ text: " " + row.abbr, bold: true }] : [])];
        // measured bold: abnormal results are printed bold
        else if (c.key === "result") parts = [{ text: row.result ?? "", bold: true, size: st.resultSize }];
        else if (c.key === "unit") parts = [{ text: row.unit ?? "", bold: !!st.unitBold }];
        else if (c.key === "range")
          parts = Array.isArray(row.range)
            ? row.range.map((l) => ({ text: l, bold: false, size: st.rangeSize ?? 7 }))
            : [{ text: row.range ?? "", bold: !!st.rangeBold }];
        const widths = Array.isArray((row as { range?: unknown }).range) && c.key === "range"
          ? parts.map((p) => textWidth(p.text, p.size ?? f, p.bold, helv))
          : [parts.reduce((a, p) => a + textWidth(p.text, p.size ?? f, p.bold, helv), 0)];
        const room = c.width - (c.padLeft ?? 0) - (k === 0 ? st.indent ?? 0 : 0);
        const need = Math.max(...widths);
        if (need > room + 0.01) warn(`${id}: "${parts.map((p) => p.text).join("")}" needs ${need.toFixed(2)}in, column "${c.key}" has ${room.toFixed(2)}in`);
      });
    }
  }
}

function expectedValues(report: Report): string[] {
  const p = report.patient;
  const out = [p.name, String(p.age), p.sex];
  for (const s of report.sections)
    for (const r of s.rows) if (r.kind === "test" && r.result) out.push(r.result);
  return out.filter(Boolean);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function main() {
  // assets
  const srcs = [MGPL_LAB.logoSrc, MGPL_LAB.qcStampSrc!, MGPL_LAB.icons.emailSrc, MGPL_LAB.icons.phoneSrc, MGPL_LAB.signatory.signatureHeaderSrc, MGPL_LAB.signatory.signatureNonHeaderSrc];
  for (const s of srcs) if (!existsSync(join(root, "public", s))) warn(`missing asset public${s}`);
  for (const f of ["carlito-400.woff", "carlito-700.woff", "carlito-400-italic.woff", "carlito-700-italic.woff", "archivo-black-400.woff", "barlow-semi-condensed-300.woff"])
    if (!existsSync(join(fontDir, f))) warn(`missing font ${f}`);

  let ok = 0;
  const variants: ReportVariant[] = ["header", "non-header"];
  for (const sample of SAMPLES) {
    const report = getSampleReport(sample.id)!;
    checkFit(sample.id, report);
    const pages = layoutPages(report).length;
    for (const v of variants) {
      const tag = `${sample.id}/${v}`;
      try {
        const html = renderToStaticMarkup(<ReportDocument report={report} variant={v} />);
        const htmlPages = html.split('class="mg-page ').length - 1;
        if (htmlPages !== pages) warn(`${tag}: HTML has ${htmlPages} pages, layout says ${pages}`);
        for (const val of expectedValues(report)) if (!html.includes(esc(val))) warn(`${tag}: HTML is missing "${val}"`);
        if (v === "header" && !html.includes(MGPL_LAB.logoSrc)) warn(`${tag}: logo missing`);
        if (v === "non-header" && html.includes('class="mg-logo"')) warn(`${tag}: non-header must not print the logo`);

        const pdf = await renderReportPdf({ report, variant: v });
        if (pdf.subarray(0, 5).toString() !== "%PDF-") warn(`${tag}: not a PDF`);
        const pdfPages = (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
        if (pdfPages !== pages) warn(`${tag}: PDF has ${pdfPages} pages, layout says ${pages}`);
        ok++;
        console.log(`ok   ${tag.padEnd(36)} ${pages} page(s)  ${(pdf.length / 1024).toFixed(0)} KB`);
      } catch (e) {
        warn(`${tag}: threw ${(e as Error).stack}`);
      }
    }
  }

  console.log(`\n${ok}/${SAMPLES.length * 2} renders passed, ${SAMPLES.length} samples.`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log("  - " + p);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main();
