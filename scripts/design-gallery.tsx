// Design exploration: renders the same report in 6 new layouts (HTML only) so one can be
// picked before it is built into the kit (HTML + PDF).
//   npx tsx scripts/design-gallery.tsx  ->  public/designs/index.html  (/designs/index.html on the dev server)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import { barcodeSvg } from "../src/report-kit/barcode";
import { formatDoctor, fullName, resolveFlag } from "../src/report-kit/format";
import { MGPL_LAB } from "../src/report-kit/lab";
import { buildReport, TEMPLATES } from "../src/report-kit/templates";
import type { Patient, Row } from "../src/report-kit/types";

const out = join(process.cwd(), "public", "designs");
mkdirSync(out, { recursive: true });

/* ------------------------------------------------------------------ demo data */
const patient: Patient = { title: "Mrs", name: "Kavita Sharma", age: 32, sex: "Female", patientId: "MGPL1025", refDoctor: "A. K. Sharma", sampleCollectionDate: "12-10-2026" };
const meta = {
  sampleId: "S2610120398",
  sampleType: "Whole Blood (EDTA)",
  collected: "12-10-2026 08:45 AM",
  registered: "12-10-2026 09:02 AM",
  reported: "12-10-2026 01:30 PM",
  verifyUrl: "https://mgpl.example/verify/MGPL1025", // placeholder until the real verify URL exists
};
const report = buildReport(patient, [{ template: "cbc", results: TEMPLATES.cbc.sample }]);
const rows: Row[] = report.sections[0].rows;
const lab = MGPL_LAB;
const A = "../report-assets"; // relative to public/designs/

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ------------------------------------------------------------- shared markup */
async function page(n: number, opts: { sidebar?: boolean; cards?: boolean }) {
  const qr = await QRCode.toString(meta.verifyUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  const bar = barcodeSvg(patient.patientId!)!;
  const field = (k: string, v: string, strong = false) => `<div class="f"><span class="k">${k}</span><span class="v${strong ? " strong" : ""}">${esc(v)}</span></div>`;

  let body = "";
  let group = "";
  for (const r of rows) {
    if (r.kind === "heading") {
      if (group) body += `</tbody>`;
      body += `<tbody><tr class="sub"><td colspan="5">${esc(r.text)}</td></tr>`;
      group = r.text;
      continue;
    }
    if (r.kind !== "test") continue;
    const flag = resolveFlag(r);
    const ab = flag !== "normal";
    const fl = flag === "high" ? "H" : flag === "low" ? "L" : "";
    body += `<tr class="${ab ? "ab" : ""}"><td class="name">${esc(r.name)}${r.abbr ? ` <span class="abbr">${esc(r.abbr)}</span>` : ""}</td>
      <td class="res">${esc(r.result ?? "")}</td><td class="flag">${fl ? `<span class="pill ${flag}">${fl}</span>` : ""}</td>
      <td class="unit">${esc(r.unit ?? "")}</td><td class="range">${esc(Array.isArray(r.range) ? r.range.join(", ") : r.range ?? "")}</td></tr>`;
  }
  body += `</tbody>`;

  const table = `<table class="results">
      <colgroup><col class="c-name"><col class="c-res"><col class="c-flag"><col class="c-unit"><col class="c-range"></colgroup>
      <thead><tr><th class="name">Test Description</th><th class="res">Result</th><th class="flag">Flag</th><th class="unit">Unit</th><th class="range">Biological Ref. Interval</th></tr></thead>
      ${body}</table>`;

  return `<div class="page d${n}">
  ${opts.sidebar ? `<aside class="side"><span>${esc(lab.name.toUpperCase())}</span></aside>` : ""}
  <header class="lh">
    <img class="logo" src="${A}/logo.svg" alt="${esc(lab.name)}">
    <div class="contact">
      <div class="addr">${lab.addressLines.map(esc).join("<br>")}</div>
      <div class="ci"><img src="${A}/icon-phone.svg" alt="">${esc(lab.phone)}</div>
      <div class="ci"><img src="${A}/icon-email.svg" alt="">${esc(lab.email)}</div>
    </div>
  </header>
  <div class="accent"></div>
  <section class="patient">
    <div class="fields">
      ${field("Patient Name", fullName(patient), true)}
      ${field("Age / Sex", `${patient.age} Year(s) / ${patient.sex}`)}
      ${field("Patient ID", patient.patientId!)}
      ${field("Ref. Doctor", formatDoctor(patient.refDoctor))}
      ${field("Sample ID", meta.sampleId)}
      ${field("Sample Type", meta.sampleType)}
      ${field("Collected", meta.collected)}
      ${field("Registered", meta.registered)}
      ${field("Reported", meta.reported)}
    </div>
    <div class="codes">
      <div class="barcode">${bar}</div>
      <div class="qr">${qr}<span>Scan to verify</span></div>
    </div>
  </section>
  <div class="${opts.cards ? "card" : "plain"}">
    <h2 class="dept"><span>HEMATOLOGY</span></h2>
    <div class="test-title">Complete Blood Count (CBC)<small>Method: Automated Cell Counter &nbsp;•&nbsp; Specimen: ${esc(meta.sampleType)}</small></div>
    ${table}
  </div>
  <div class="notes"><b>Note:</b> Values marked <span class="pill high">H</span> / <span class="pill low">L</span> are above / below the biological reference interval. Results should be correlated clinically.</div>
  <div class="end">— End of Report —</div>
  <footer>
    <div class="signs">
      <div class="qc"><img src="${A}/qc-stamp.svg" alt="QC approved"></div>
      <div class="sign"><img src="${A}/signature-scan.jpg" alt="Signature"><b>${esc(lab.signatory.name)}</b><span>${esc(lab.signatory.designation)}</span></div>
    </div>
    <div class="legal"><span>This is an electronically verified report. Scan the QR code to confirm authenticity.</span><span>Page 1 of 1</span></div>
  </footer>
</div>`;
}

/* ---------------------------------------------------------------- base CSS */
const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#d9dce3}
body{padding:24px 0}
.page{position:relative;width:210mm;height:297mm;margin:0 auto;background:#fff;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.18);display:flex;flex-direction:column;padding:0 .45in;color:#111}
.page img{display:block}
.lh{display:flex;align-items:center;justify-content:space-between;padding-top:.3in}
.logo{height:.95in}
.contact{text-align:right;font-size:9pt;line-height:1.45}
.ci{display:flex;align-items:center;justify-content:flex-end;gap:5px}
.ci img{width:11px;height:11px}
.patient{display:flex;justify-content:space-between;gap:.2in}
.fields{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 18px;flex:1}
.f{display:flex;flex-direction:column}
.k{font-size:7pt;text-transform:uppercase;letter-spacing:.06em;opacity:.65}
.v{font-size:9.5pt}
.v.strong{font-weight:700}
.codes{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.barcode svg{width:1.45in;height:.36in;display:block}
.qr{display:flex;flex-direction:column;align-items:center;font-size:6.5pt;gap:2px}
.qr svg{width:.78in;height:.78in;display:block}
.results{width:100%;border-collapse:collapse;font-size:8.6pt}
.results col.c-name{width:45%}.results col.c-res{width:11%}.results col.c-flag{width:7%}.results col.c-unit{width:13%}.results col.c-range{width:24%}
.results td.name{white-space:nowrap}
.results th{text-align:left;font-weight:700}
.results td,.results th{padding:2.6px 6px}
.results .res,.results .flag,.results .unit,.results .range{text-align:center}
.results .abbr{font-weight:600}
.results tr.ab .res{font-weight:700}
.pill{display:inline-block;min-width:15px;padding:0 4px;border-radius:3px;font-size:7pt;font-weight:700;line-height:13px;text-align:center;color:#fff}
.pill.high{background:#d92d20}.pill.low{background:#1570ef}
.test-title{font-weight:700;font-size:10.5pt;margin:2px 0 4px}
.test-title small{display:block;font-weight:400;font-size:7.5pt;opacity:.7}
.notes{font-size:7.5pt;margin-top:8px;line-height:1.5}
.notes .pill{transform:scale(.9)}
.end{text-align:center;font-size:7.5pt;letter-spacing:.2em;margin-top:8px;opacity:.7}
footer{margin-top:auto;padding-bottom:.25in}
.signs{display:flex;justify-content:flex-end;align-items:flex-end;gap:.5in}
.qc img{width:.72in;height:.72in}
.sign{display:flex;flex-direction:column;align-items:center;font-size:9pt}
.sign img{width:1.4in;height:.47in;object-fit:contain}
.legal{display:flex;justify-content:space-between;font-size:6.8pt;margin-top:8px;padding-top:5px;border-top:1px solid #ccd;opacity:.85}
@media print{html,body{background:#fff;padding:0}.page{box-shadow:none;margin:0}}
@page{size:A4;margin:0}
`;

/* --------------------------------------------------------------- 6 designs */
interface Design {
  id: string;
  title: string;
  fonts: string;
  google: string;
  about: string;
  opts?: { sidebar?: boolean; cards?: boolean };
  css: string;
}

const designs: Design[] = [
  {
    id: "1-clinical-blue",
    title: "Clinical Blue",
    fonts: "Inter",
    google: "family=Inter:wght@400;500;600;700",
    about: "Clean hospital style. Navy accents, zebra rows, rounded patient card.",
    css: `
.d1{font-family:Inter,sans-serif}
.d1 .accent{height:4px;background:linear-gradient(90deg,#14264A,#2f5aa8);margin:.16in 0 .14in;border-radius:2px}
.d1 .contact{color:#334}
.d1 .patient{border:1px solid #d5dbe7;border-radius:8px;padding:10px 12px;background:#f7f9fc}
.d1 .k{color:#14264A}
.d1 .dept{margin:.16in 0 6px;font-size:11pt;letter-spacing:.14em;color:#14264A;border-bottom:2px solid #14264A;padding-bottom:3px}
.d1 .results thead th{background:#14264A;color:#fff;font-weight:600}
.d1 .results tbody tr:nth-child(even):not(.sub){background:#f3f6fb}
.d1 .results tr.sub td{font-weight:700;color:#14264A;padding-top:6px;background:#fff}
.d1 .results tr.ab .res{color:#d92d20}`,
  },
  {
    id: "2-heritage-serif",
    title: "Heritage Serif",
    fonts: "Lora + Source Sans 3",
    google: "family=Lora:wght@500;600;700&family=Source+Sans+3:wght@400;600;700",
    about: "Classic, authoritative. Centered letterhead, double rules, serif headings.",
    css: `
.d2{font-family:'Source Sans 3',sans-serif}
.d2 .lh{flex-direction:column;gap:6px}
.d2 .contact{text-align:center;font-family:Lora,serif;font-size:9pt}
.d2 .ci{justify-content:center;display:inline-flex;margin:0 8px}
.d2 .accent{border-top:3px double #5b3a1e;margin:.12in 0 .14in}
.d2 .patient{padding:0 0 8px;border-bottom:1px solid #c9b8a6}
.d2 .k{font-family:Lora,serif;text-transform:none;letter-spacing:0;font-style:italic;font-size:8pt}
.d2 .dept{text-align:center;font-family:Lora,serif;font-size:13pt;margin:.14in 0 4px;color:#5b3a1e;display:flex;align-items:center;gap:12px}
.d2 .dept::before,.d2 .dept::after{content:"";flex:1;border-top:1px solid #c9b8a6}
.d2 .test-title{font-family:Lora,serif;text-align:center}
.d2 .results thead th{border-top:1.5px solid #5b3a1e;border-bottom:1.5px solid #5b3a1e;font-family:Lora,serif}
.d2 .results td{border-bottom:1px dotted #e0d6cc}
.d2 .results tr.sub td{font-family:Lora,serif;font-style:italic;font-weight:600;border-bottom:none;padding-top:7px;color:#5b3a1e}
.d2 .results tr.ab .res{color:#b42318}
.d2 .pill.high{background:#b42318}.d2 .pill.low{background:#2b5797}
.d2 .end{font-family:Lora,serif;font-style:italic}`,
  },
  {
    id: "3-saffron-brand",
    title: "Saffron Brand",
    fonts: "Poppins + Nunito Sans",
    google: "family=Poppins:wght@500;600;700&family=Nunito+Sans:wght@400;600;700",
    about: "Uses the new logo's navy, saffron and gold. Warm and distinctive.",
    css: `
.d3{font-family:'Nunito Sans',sans-serif}
.d3 .accent{height:6px;margin:.14in -.45in .16in;background:linear-gradient(90deg,#14264A 0 60%,#C2410C 60% 88%,#E9A23B 88%)}
.d3 .contact{color:#14264A}
.d3 .patient{background:#fff7ed;border-left:5px solid #C2410C;padding:10px 12px;border-radius:0 8px 8px 0}
.d3 .k{color:#C2410C;font-family:Poppins,sans-serif;font-weight:600}
.d3 .dept{font-family:Poppins,sans-serif;margin:.16in 0 6px}
.d3 .dept span{display:inline-block;background:#14264A;color:#fff;font-size:10pt;padding:3px 14px;border-radius:999px;letter-spacing:.08em}
.d3 .test-title{font-family:Poppins,sans-serif;color:#14264A}
.d3 .results thead th{color:#C2410C;border-bottom:2px solid #E9A23B;font-family:Poppins,sans-serif;font-weight:600}
.d3 .results td{border-bottom:1px solid #f1e4d8}
.d3 .results tr.sub td{color:#14264A;font-weight:700;font-family:Poppins,sans-serif;padding-top:6px}
.d3 .results tr.ab .res{color:#C2410C}
.d3 .pill.high{background:#C2410C}.d3 .pill.low{background:#14264A}
.d3 .legal{border-top-color:#E9A23B}`,
  },
  {
    id: "4-navy-sidebar",
    title: "Navy Sidebar",
    fonts: "Manrope",
    google: "family=Manrope:wght@400;500;600;700;800",
    about: "Bold vertical brand strip on the left. Modern and memorable.",
    opts: { sidebar: true },
    css: `
.d4{font-family:Manrope,sans-serif;padding-left:.85in}
.d4 .side{position:absolute;left:0;top:0;bottom:0;width:.45in;background:#14264A;display:flex;align-items:center;justify-content:center}
.d4 .side span{transform:rotate(-90deg);white-space:nowrap;color:#E9A23B;font-weight:800;letter-spacing:.35em;font-size:10pt}
.d4 .accent{height:1px;background:#14264A;margin:.14in 0}
.d4 .k{color:#5a6478;font-weight:700}
.d4 .v{font-weight:600}
.d4 .dept{margin:.16in 0 4px;font-size:12pt;font-weight:800;color:#14264A;display:flex;align-items:center;gap:8px}
.d4 .dept::before{content:"";width:10px;height:10px;background:#C2410C;border-radius:2px}
.d4 .results thead th{text-transform:uppercase;font-size:7pt;letter-spacing:.08em;color:#5a6478;border-bottom:1.5px solid #14264A}
.d4 .results td{border-bottom:1px solid #eef0f4}
.d4 .results tr.sub td{font-weight:800;color:#14264A;padding-top:6px}
.d4 .results tr.ab .res{color:#d92d20}`,
  },
  {
    id: "5-mono-precision",
    title: "Mono Precision",
    fonts: "IBM Plex Sans + IBM Plex Mono",
    google: "family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600",
    about: "Black & white, printer-friendly. Results in monospace so digits line up.",
    css: `
.d5{font-family:'IBM Plex Sans',sans-serif}
.d5 .logo{filter:grayscale(1)}
.d5 .accent{border-top:2px solid #000;margin:.14in 0 .12in}
.d5 .patient{border:1px solid #000;padding:8px 10px}
.d5 .k{opacity:1;font-weight:600}
.d5 .v{font-family:'IBM Plex Mono',monospace;font-size:9pt}
.d5 .v.strong{font-family:'IBM Plex Sans',sans-serif}
.d5 .dept{margin:.14in 0 4px;font-size:10pt;letter-spacing:.3em;border-top:1px solid #000;border-bottom:1px solid #000;text-align:center;padding:3px 0}
.d5 .results thead th{border-bottom:1px solid #000;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em}
.d5 .results .res,.d5 .results .range{font-family:'IBM Plex Mono',monospace}
.d5 .results td{border-bottom:1px dashed #bbb}
.d5 .results tr.sub td{font-weight:700;border-bottom:none;padding-top:6px;text-transform:uppercase;font-size:7.5pt;letter-spacing:.08em}
.d5 .results tr.ab .res{text-decoration:underline;text-underline-offset:2px}
.d5 .pill{background:#000!important;color:#fff}
.d5 .qc img{filter:grayscale(1)}
.d5 .legal{border-top-color:#000}`,
  },
  {
    id: "6-card-modern",
    title: "Card Modern",
    fonts: "DM Sans",
    google: "family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700",
    about: "Soft cards and chips. Friendly, app-like look that suits WhatsApp/PDF sharing.",
    opts: { cards: true },
    css: `
.d6{font-family:'DM Sans',sans-serif;background:#fff}
.d6 .accent{height:.12in}
.d6 .patient{background:#f2f5ff;border-radius:12px;padding:10px 12px}
.d6 .k{color:#5b6b9a}
.d6 .card{margin-top:.14in;border:1px solid #e3e8f5;border-radius:12px;padding:8px 10px 6px;box-shadow:0 1px 0 #e3e8f5}
.d6 .dept{font-size:8pt;margin-bottom:2px}
.d6 .dept span{background:#e6ecff;color:#2b3f8f;padding:2px 10px;border-radius:999px;letter-spacing:.1em}
.d6 .test-title{color:#14264A}
.d6 .results thead th{color:#5b6b9a;font-weight:500;font-size:7.5pt;border-bottom:1px solid #e3e8f5}
.d6 .results tr.sub td{font-weight:700;color:#2b3f8f;padding-top:6px}
.d6 .results tr.ab td{background:#fff4f2}
.d6 .results tr.ab .res{color:#d92d20}
.d6 .pill{border-radius:999px}`,
  },
];

/* ------------------------------------------------------------------- output */
async function main() {
  for (const [k, d] of designs.entries()) {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Design ${k + 1} — ${d.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${d.google}&display=swap" rel="stylesheet">
<style>${BASE}${d.css}</style></head><body>${await page(k + 1, d.opts ?? {})}</body></html>`;
    writeFileSync(join(out, `${d.id}.html`), html);
    console.log(`design ${k + 1}: ${d.title}`);
  }

  const cards = designs
    .map(
      (d, k) => `<article><div class="frame"><iframe src="${d.id}.html" loading="lazy" title="${d.title}" tabindex="-1"></iframe></div>
  <h2><span>${k + 1}</span>${d.title}</h2><p class="font">${d.fonts}</p><p>${d.about}</p><a href="${d.id}.html" target="_blank">Open full size</a></article>`,
    )
    .join("\n");

  writeFileSync(
    join(out, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MGPL — Report Designs</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,'Segoe UI',sans-serif;background:#f4f5f8;color:#1c2230;padding:28px 16px}
h1{margin:0 0 4px;color:#14264A;font-size:24px}header p{margin:0 0 24px;color:#667085}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px;max-width:1180px}
article{background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.frame{position:relative;width:100%;aspect-ratio:210/297;overflow:hidden;border-radius:6px;background:#d9dce3}
.frame iframe{position:absolute;left:0;top:0;width:820px;height:1160px;border:0;transform-origin:0 0;pointer-events:none}
h2{font-size:17px;margin:12px 0 2px;display:flex;align-items:center;gap:8px}
h2 span{background:#14264A;color:#fff;border-radius:6px;font-size:13px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
p{margin:2px 0;font-size:13px;color:#475467}.font{color:#C2410C;font-weight:600}
a{display:inline-block;margin-top:8px;color:#14264A;font-weight:600;font-size:13px}
</style></head><body>
<header><h1>Report design options</h1><p>Same CBC report in 6 layouts — each with barcode + QR code. Tell me the number you like.</p></header>
<div class="grid">${cards}</div>
<script>
// scale each A4 iframe to its card width
function fit(){document.querySelectorAll('.frame').forEach(f=>{const i=f.querySelector('iframe');i.style.transform='scale('+(f.clientWidth/820)+')';});}
addEventListener('resize',fit);fit();
</script></body></html>`,
  );
  console.log("\nOpen public/designs/index.html  (or /designs/index.html on the dev server)");
}

main();
