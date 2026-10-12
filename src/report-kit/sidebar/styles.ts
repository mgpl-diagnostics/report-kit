import {
  SB_BODY,
  SB_CELL_PAD,
  SB_COLORS as C,
  SB_CONTENT,
  SB_FONT,
  SB_FOOTER,
  SB_HEADER,
  SB_LEGAL,
  SB_PATIENT,
  SB_RIGHT,
  SB_ROWS as R,
  SB_SIDEBAR,
  SB_SIGN,
} from "./layout";

const i = (n: number) => `${n}in`;

/** Stylesheet for the Navy Sidebar HTML renderer. @param fontBase URL folder of /public/report-fonts */
export function sidebarCss(fontBase = "/report-fonts"): string {
  const face = (w: number) =>
    `@font-face{font-family:"${SB_FONT}";src:url("${fontBase}/manrope-${w}.woff") format("woff");font-weight:${w};font-style:normal;font-display:block;}`;
  return `
${[400, 500, 600, 700, 800].map(face).join("\n")}
@page { size: A4; margin: 0; }
.sb-doc { display:flex; flex-direction:column; align-items:center; gap:24px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sb-doc *, .sb-doc *::before, .sb-doc *::after { box-sizing:border-box; margin:0; padding:0; }
.sb-page { position:relative; width:210mm; height:297mm; overflow:hidden; background:#fff; color:${C.ink};
  font-family:"${SB_FONT}", "Segoe UI", Arial, sans-serif; font-size:${R.fontSize}pt; line-height:1.25; box-shadow:0 2px 14px rgba(0,0,0,.18); }
.sb-page img { position:absolute; display:block; object-fit:contain; }
.sb-abs { position:absolute; }

/* ----- letterhead ----- */
.sb-side { position:absolute; left:0; top:0; bottom:0; width:${i(SB_SIDEBAR.w)}; background:${C.navy}; }
.sb-side span { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) rotate(-90deg); white-space:nowrap;
  color:${C.gold}; font-weight:800; font-size:${SB_SIDEBAR.textSize}pt; letter-spacing:${SB_SIDEBAR.letterSpacing}pt; }
.sb-logo { left:${i(SB_HEADER.logo.x)}; top:${i(SB_HEADER.logo.y)}; width:${i(SB_HEADER.logo.w)}; height:${i(SB_HEADER.logo.h)}; object-position:left center; }
.sb-contact { position:absolute; right:${i(8.27 - SB_RIGHT)}; top:${i(SB_HEADER.contact.y)}; text-align:right; font-size:${SB_HEADER.contact.size}pt; line-height:${i(SB_HEADER.contact.lineHeight)}; color:${C.ink}; }
.sb-contact div { display:flex; justify-content:flex-end; align-items:center; gap:5px; height:${i(SB_HEADER.contact.lineHeight)}; white-space:nowrap; }
.sb-contact img { position:static; width:${i(SB_HEADER.contact.icon)}; height:${i(SB_HEADER.contact.icon)}; }
.sb-hrule { position:absolute; left:${i(SB_CONTENT.x)}; width:${i(SB_CONTENT.w)}; top:${i(SB_HEADER.rule.y)}; border-top:${SB_HEADER.rule.width}pt solid ${C.navy}; }
.sb-frule { position:absolute; left:${i(SB_CONTENT.x)}; width:${i(SB_CONTENT.w)}; top:${i(SB_FOOTER.rule.y)}; border-top:${SB_FOOTER.rule.width}pt solid ${C.navy}; }
.sb-flines { position:absolute; left:${i(SB_CONTENT.x)}; width:${i(SB_CONTENT.w)}; top:${i(SB_FOOTER.lines.y)}; text-align:center; font-size:${SB_FOOTER.lines.size}pt; color:${C.muted}; }
.sb-flines div { height:${i(SB_FOOTER.lines.lineHeight)}; line-height:${i(SB_FOOTER.lines.lineHeight)}; white-space:pre; }
.sb-flines div:first-child { color:${C.saffron}; font-weight:700; letter-spacing:.04em; }

/* ----- patient block ----- */
.sb-patient { position:absolute; left:${i(SB_CONTENT.x)}; top:${i(SB_PATIENT.y)}; display:grid; grid-template-columns:repeat(3, ${i(SB_PATIENT.grid.colW)}); grid-auto-rows:${i(SB_PATIENT.grid.rowH)}; }
.sb-f-label { display:block; font-size:${SB_PATIENT.grid.labelSize}pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:${C.muted}; line-height:1.3; }
.sb-f-value { display:block; font-size:${SB_PATIENT.grid.valueSize}pt; font-weight:600; line-height:1.35; white-space:nowrap; }
.sb-f-value.strong { font-weight:800; }
.sb-barcode { position:absolute; left:${i(SB_RIGHT - SB_PATIENT.barcode.w)}; top:${i(SB_PATIENT.y)}; width:${i(SB_PATIENT.barcode.w)}; height:${i(SB_PATIENT.barcode.h)}; }
.sb-qr { position:absolute; left:${i(SB_RIGHT - SB_PATIENT.barcode.w / 2 - SB_PATIENT.qr.s / 2)}; top:${i(SB_PATIENT.y + SB_PATIENT.barcode.h + 0.07)}; width:${i(SB_PATIENT.qr.s)}; height:${i(SB_PATIENT.qr.s)}; }
.sb-barcode svg, .sb-qr svg { display:block; width:100%; height:100%; }
.sb-qr-label { position:absolute; left:${i(SB_RIGHT - SB_PATIENT.barcode.w)}; width:${i(SB_PATIENT.barcode.w)}; top:${i(SB_PATIENT.y + SB_PATIENT.barcode.h + 0.09 + SB_PATIENT.qr.s)}; text-align:center; font-size:${SB_PATIENT.qr.labelSize}pt; color:${C.muted}; }

/* ----- results ----- */
.sb-body { position:absolute; left:${i(SB_CONTENT.x)}; width:${i(SB_CONTENT.w)}; top:${i(SB_BODY.top)}; }
.sb-sec { margin-bottom:${R.sectionGap}pt; }
.sb-dept { height:${R.dept}pt; display:flex; align-items:center; gap:7px; font-size:11.5pt; font-weight:800; color:${C.navy}; letter-spacing:.02em; }
.sb-dept::before { content:""; width:9px; height:9px; background:${C.saffron}; border-radius:2px; }
.sb-title { height:${R.title}pt; display:flex; align-items:flex-end; font-size:10pt; font-weight:700; color:${C.ink}; }
.sb-meta { height:${R.meta}pt; font-size:7pt; color:${C.muted}; display:flex; align-items:center; }
.sb-row { display:flex; align-items:center; border-bottom:0.5pt solid ${C.line}; }
.sb-th { height:${R.tableHeader}pt; border-bottom:1.2pt solid ${C.navy}; font-size:7pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:${C.muted}; }
.sb-cell { flex:none; display:flex; flex-direction:column; justify-content:center; padding:0 ${i(SB_CELL_PAD)}; height:100%; white-space:nowrap; }
.sb-cell.l { align-items:flex-start; } .sb-cell.c { align-items:center; } .sb-cell.r { align-items:flex-end; }
.sb-sub { height:${R.heading}pt; font-weight:800; color:${C.navy}; padding-left:${i(SB_CELL_PAD)}; display:flex; align-items:flex-end; padding-bottom:2pt; border-bottom:0.5pt solid ${C.line}; }
.sb-abbr { font-weight:700; }
.sb-method { font-size:6.8pt; color:${C.muted}; }
.sb-res-ab { color:${C.red}; font-weight:800; }
.sb-pill { display:inline-block; min-width:15px; padding:0 4px; border-radius:3px; color:#fff; font-size:6.8pt; font-weight:800; line-height:12px; text-align:center; }
.sb-range-lines { font-size:7pt; line-height:9pt; align-self:stretch; display:flex; flex-direction:column; justify-content:center; }
.sb-text { display:flex; align-items:flex-end; padding:0 ${i(SB_CELL_PAD)} 3pt; }
.sb-end { height:${R.end}pt; display:flex; flex-direction:column; justify-content:center; gap:5pt; }
.sb-legend { font-size:6.8pt; color:${C.muted}; }
.sb-endtext { text-align:center; font-size:7pt; letter-spacing:.2em; color:${C.muted}; }

/* ----- signature & legal ----- */
.sb-qc { left:${i(SB_SIGN.qc.x)}; top:${i(SB_SIGN.qc.y)}; width:${i(SB_SIGN.qc.s)}; height:${i(SB_SIGN.qc.s)}; }
.sb-signimg { left:${i(SB_SIGN.centerX - SB_SIGN.sign.w / 2)}; top:${i(SB_SIGN.sign.y)}; width:${i(SB_SIGN.sign.w)}; height:${i(SB_SIGN.sign.h)}; }
.sb-signname { position:absolute; left:${i(SB_SIGN.centerX - 1.3)}; width:${i(2.6)}; top:${i(SB_SIGN.nameY)}; text-align:center; }
.sb-signname b { display:block; font-size:${SB_SIGN.nameSize}pt; font-weight:800; }
.sb-signname span { display:block; font-size:${SB_SIGN.roleSize}pt; color:${C.muted}; }
.sb-legal { position:absolute; left:${i(SB_CONTENT.x)}; width:${i(SB_CONTENT.w)}; top:${i(SB_LEGAL.y)}; display:flex; justify-content:space-between; font-size:${SB_LEGAL.size}pt; color:${C.muted}; border-top:0.5pt solid ${C.line}; padding-top:3pt; }

@media print {
  html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
  .sb-doc { display:block; gap:0; }
  .sb-page { box-shadow:none; break-after:page; page-break-after:always; }
  .sb-page:last-child { break-after:auto; page-break-after:auto; }
}
`;
}
