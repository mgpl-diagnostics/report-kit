// Generates /examples: standalone HTML + A4 PDF for every sample report, in both designs
// ("sidebar" = Navy Sidebar, "classic" = Word replica) and both variants, plus the blank
// Navy Sidebar letterhead. Open examples/index.html to browse.
//   npm run examples
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { LabReport, MGPL_LAB, SidebarLetterhead, type LabProfile, type ReportDesign, type ReportVariant } from "../src/server";
import { renderLetterheadPdf, renderReportPdf } from "../src/server";
import { getSampleReport, SAMPLES } from "../src/server";

const root = process.cwd();
const out = join(root, "examples");
const variants: ReportVariant[] = ["header", "non-header"];
const designs: ReportDesign[] = ["sidebar", "classic"];

// Same lab, but image paths relative to examples/<design>/html/
const rel = (src: string) => (src.startsWith("/") ? "../.." + src : src);
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
  rmSync(out, { recursive: true, force: true });
  for (const d of designs) {
    mkdirSync(join(out, d, "html"), { recursive: true });
    mkdirSync(join(out, d, "pdf"), { recursive: true });
  }
  // Self-contained: copy images + fonts next to the HTML files
  cpSync(join(root, "assets", "report-assets"), join(out, "report-assets"), { recursive: true });
  cpSync(join(root, "assets", "report-fonts"), join(out, "report-fonts"), { recursive: true });

  // Letterhead stationery
  mkdirSync(join(out, "letterhead"), { recursive: true });
  const lhLab = { ...htmlLab, logoSrc: "../report-assets/logo.svg", icons: { emailSrc: "../report-assets/icon-email.svg", phoneSrc: "../report-assets/icon-phone.svg" } };
  writeFileSync(join(out, "letterhead", "letterhead.html"), page("Letterhead", renderToStaticMarkup(<SidebarLetterhead lab={lhLab} fontBase="../report-fonts" />)));
  writeFileSync(join(out, "letterhead", "letterhead.pdf"), await renderLetterheadPdf());
  console.log("letterhead                     html + pdf");

  const rows: string[] = [];
  for (const s of SAMPLES) {
    const report = getSampleReport(s.id)!;
    const cells: string[] = [];
    for (const d of designs) {
      for (const v of variants) {
        const name = `${s.id}-${v}`;
        const markup = renderToStaticMarkup(<LabReport design={d} report={report} variant={v} lab={htmlLab} fontBase="../../report-fonts" />);
        writeFileSync(join(out, d, "html", `${name}.html`), page(`${s.label} — ${d} — ${v}`, markup));
        writeFileSync(join(out, d, "pdf", `${name}.pdf`), await renderReportPdf({ report, variant: v, design: d }));
        cells.push(`<td><a href="${d}/html/${name}.html">HTML</a> · <a href="${d}/pdf/${name}.pdf">PDF</a></td>`);
      }
    }
    console.log(`${s.id.padEnd(30)} 2 designs × 2 variants`);
    rows.push(`<tr><td><b>${s.label}</b><br><small>${s.source}</small></td>${cells.join("")}</tr>`);
  }

  writeFileSync(
    join(out, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MGPL Report Examples</title>
<style>
body{font-family:system-ui,Segoe UI,sans-serif;margin:0;padding:24px 16px;background:#f5f6f8;color:#1c2230}
h1{color:#14264A;font-size:22px;margin:0 0 4px}p{color:#667085;margin:0 0 16px}
table{border-collapse:collapse;background:#fff;width:100%;max-width:1100px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
th,td{padding:9px 12px;border-bottom:1px solid #e4e7ec;text-align:left;font-size:13px;vertical-align:top}
th{background:#14264A;color:#fff;font-weight:600}small{color:#667085}a{color:#14264A}
.lh{margin:0 0 18px;font-size:14px}
</style></head><body>
<h1>MGPL Report Examples</h1><p>${SAMPLES.length} reports × 2 designs × 2 variants. HTML = preview markup, PDF = Node.js render (A4).</p>
<p class="lh"><b>Letterhead stationery</b> (print on blank paper, then use the non-header Navy Sidebar reports):
<a href="letterhead/letterhead.html">HTML</a> · <a href="letterhead/letterhead.pdf">PDF</a></p>
<table><thead><tr><th>Report</th><th>Navy Sidebar · header</th><th>Navy Sidebar · non-header</th><th>Classic · header</th><th>Classic · non-header</th></tr></thead><tbody>
${rows.join("\n")}
</tbody></table></body></html>`,
  );
  console.log(`\nWrote ${SAMPLES.length * 4} HTML + ${SAMPLES.length * 4} PDF files + letterhead to examples/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
