// Generates /examples: a standalone HTML preview + an A4 PDF for every sample report,
// in both variants, plus examples/index.html to browse them.
//   npm run examples
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { MGPL_LAB, ReportDocument, type LabProfile, type ReportVariant } from "../src/report-kit";
import { renderReportPdf } from "../src/report-kit/pdf";
import { getSampleReport, SAMPLES } from "../src/app/samples";

const root = process.cwd();
const out = join(root, "examples");
const variants: ReportVariant[] = ["header", "non-header"];

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "html"), { recursive: true });
mkdirSync(join(out, "pdf"), { recursive: true });
// Self-contained: copy images + fonts next to the HTML files
cpSync(join(root, "public", "report-assets"), join(out, "report-assets"), { recursive: true });
cpSync(join(root, "public", "report-fonts"), join(out, "report-fonts"), { recursive: true });

// Same lab, but image paths relative to examples/html/
const rel = (src: string) => (src.startsWith("/") ? ".." + src : src);
const htmlLab: LabProfile = {
  ...MGPL_LAB,
  logoSrc: rel(MGPL_LAB.logoSrc),
  qcStampSrc: MGPL_LAB.qcStampSrc && rel(MGPL_LAB.qcStampSrc),
  icons: { emailSrc: rel(MGPL_LAB.icons.emailSrc), phoneSrc: rel(MGPL_LAB.icons.phoneSrc) },
  signatory: {
    ...MGPL_LAB.signatory,
    signatureHeaderSrc: rel(MGPL_LAB.signatory.signatureHeaderSrc),
    signatureNonHeaderSrc: rel(MGPL_LAB.signatory.signatureNonHeaderSrc),
  },
};

const page = (title: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>html,body{margin:0;background:#e8eaee}body{padding:24px 0}@media print{body{padding:0;background:#fff}}</style>
</head><body>${body}</body></html>`;

async function main() {
const rows: string[] = [];
for (const s of SAMPLES) {
  const report = getSampleReport(s.id)!;
  const links: string[] = [];
  for (const v of variants) {
    const name = `${s.id}-${v}`;
    const markup = renderToStaticMarkup(<ReportDocument report={report} variant={v} lab={htmlLab} fontBase="../report-fonts" />);
    writeFileSync(join(out, "html", `${name}.html`), page(`${s.label} — ${v}`, markup));
    const t0 = Date.now();
    writeFileSync(join(out, "pdf", `${name}.pdf`), await renderReportPdf({ report, variant: v }));
    console.log(`${name.padEnd(28)} html + pdf (${Date.now() - t0} ms)`);
    links.push(`<td><a href="html/${name}.html">HTML</a> · <a href="pdf/${name}.pdf">PDF</a></td>`);
  }
  rows.push(`<tr><td><b>${s.label}</b><br><small>${s.source}</small></td>${links.join("")}</tr>`);
}

writeFileSync(
  join(out, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MGPL Report Examples</title>
<style>
body{font-family:system-ui,Segoe UI,sans-serif;margin:0;padding:24px 16px;background:#f5f6f8;color:#1c2230}
h1{color:#162884;font-size:22px;margin:0 0 4px}p{color:#667085;margin:0 0 20px}
table{border-collapse:collapse;background:#fff;width:100%;max-width:900px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
th,td{padding:10px 14px;border-bottom:1px solid #e4e7ec;text-align:left;font-size:14px;vertical-align:top}
th{background:#162884;color:#fff;font-weight:600}small{color:#667085}a{color:#162884}
</style></head><body>
<h1>MGPL Report Examples</h1><p>${SAMPLES.length} reports × 2 variants. HTML = preview markup, PDF = Node.js render (A4).</p>
<table><thead><tr><th>Report</th><th>Header</th><th>Non-header</th></tr></thead><tbody>
${rows.join("\n")}
</tbody></table></body></html>`,
);
console.log(`\nWrote ${SAMPLES.length * 2} HTML + ${SAMPLES.length * 2} PDF files to examples/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
