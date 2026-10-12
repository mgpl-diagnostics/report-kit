import {
  BODY_TOP,
  COLORS,
  END,
  FONTS,
  FOOTER_HEADER as FH,
  LETTERHEAD as LH,
  PATIENT as P,
  SECTION,
  TITLE_BAR as TB,
} from "./layout";

const i = (n: number) => `${n}in`;
const box = (b: { x: number; y: number; w?: number; h?: number; s?: number }): string =>
  `left:${i(b.x)};top:${i(b.y)};width:${i(b.w ?? b.s!)};height:${i(b.h ?? b.s!)};`;

/**
 * Report stylesheet for the HTML preview. Injected by <ReportDocument/>, so it works in any
 * page with no global CSS import. Geometry comes from layout.ts (shared with the PDF renderer).
 *
 * @param fontBase URL folder holding the files from /public/report-fonts
 */
export function reportCss(fontBase = "/report-fonts"): string {
  const face = (family: string, file: string, weight = 400, style = "normal") =>
    `@font-face{font-family:"${family}";src:url("${fontBase}/${file}") format("woff");font-weight:${weight};font-style:${style};font-display:block;}`;

  return `
${face(FONTS.body, "carlito-400.woff")}
${face(FONTS.body, "carlito-700.woff", 700)}
${face(FONTS.body, "carlito-400-italic.woff", 400, "italic")}
${face(FONTS.body, "carlito-700-italic.woff", 700, "italic")}
${face(FONTS.title, "archivo-black-400.woff")}
${face(FONTS.address, "barlow-semi-condensed-300.woff", 300)}

@page { size: A4; margin: 0; }

.mg-doc {
  --mg-font: "${FONTS.body}", Calibri, "Segoe UI", Arial, sans-serif;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.mg-doc *, .mg-doc *::before, .mg-doc *::after { box-sizing: border-box; }

.mg-page {
  position: relative; width: 210mm; height: 297mm; overflow: hidden;
  background: #fff; color: #000;
  font-family: var(--mg-font); font-size: 11pt; line-height: 1.22;
  box-shadow: 0 2px 14px rgba(0,0,0,.18);
}
.mg-page img { position: absolute; display: block; max-width: none; object-fit: contain; }

/* Letterhead */
.mg-logo { ${box(LH.logo)} object-position: left center; }
.mg-divider { position:absolute; left:${i(LH.divider.x)}; top:${i(LH.divider.y)}; height:${i(LH.divider.h)}; border-left:${LH.divider.width}pt solid ${COLORS.divider}; }
.mg-address { position:absolute; left:${i(LH.address.x)}; top:${i(LH.address.y)}; font-family:"${FONTS.address}",sans-serif; font-weight:300; font-size:${LH.address.size}pt; line-height:${i(LH.address.lineHeight)}; white-space:nowrap; }
.mg-rule { position:absolute; left:0; right:0; top:${i(LH.rule.y)}; border-top:${LH.rule.width}pt solid #000; }

/* Body */
.mg-body { position:absolute; left:0; right:0; top:${i(BODY_TOP)}; }

.mg-titlebar {
  margin-left:${i(TB.x)}; width:${i(TB.w)}; height:${i(TB.h)};
  background:${COLORS.navy}; color:#fff; border:0.5pt solid #000;
  font-weight:700; font-size:${TB.size}pt; line-height:${i(TB.h - 0.01)}; text-align:center;
}

.mg-patient { position:relative; height:${i(P.height)}; font-size:${P.size}pt; }
.mg-prow { position:absolute; line-height:${i(P.lineHeight)}; white-space:nowrap; }
.mg-p-name { left:${i(P.name.x)}; top:${i(P.name.y)}; }
.mg-p-age { left:${i(P.age.x)}; top:${i(P.age.y)}; }
.mg-p-sex { left:${i(P.sex.x)}; top:${i(P.sex.y)}; }
.mg-p-ref { left:${i(P.ref.x)}; top:${i(P.ref.y)}; }
.mg-p-date { left:${i(P.date.x)}; top:${i(P.date.y)}; }
.mg-p-id { left:${i(P.id.x)}; top:${i(P.id.y)}; }
.mg-barcode { position:absolute; ${box(P.barcode)} }
.mg-barcode svg { display:block; width:100%; height:100%; }
.mg-pline { position:absolute; left:${i(P.line.x)}; width:${i(P.line.w)}; top:${i(P.line.y)}; border-top:${P.line.width}pt solid ${COLORS.patientLine}; }

/* Sections — every row gets an exact height from measure.ts (same as the PDF) */
.mg-section { margin-bottom:${i(SECTION.gapAfter)}; }
.mg-sec-head { background:${COLORS.band}; border:${SECTION.border}pt solid #000; }
.mg-sec-title { font-family:"${FONTS.title}",sans-serif; text-align:center; white-space:nowrap; }
.mg-colhead { display:flex; border-top:${SECTION.border}pt solid #000; font-weight:700; font-size:${SECTION.colHeader.size}pt; }
.mg-colhead > div { flex:none; display:flex; align-items:center; padding-right:${i(SECTION.cellPad)}; white-space:nowrap; }
.mg-line { display:flex; align-items:center; white-space:nowrap; }
.mg-cell { flex:none; display:flex; align-items:center; height:100%; }
.mg-heading { font-weight:700; font-family:var(--mg-font); }
.mg-method { font-style:italic; }
.mg-range-lines { display:flex; flex-direction:column; line-height:1.2; }

.mg-end { text-align:center; font-size:${END.size}pt; margin-top:${i(END.marginTop)}; }

/* Footer (same position in both variants) */
.mg-f-email-icon { ${box(FH.emailIcon)} }
.mg-f-phone-icon { ${box(FH.phoneIcon)} }
.mg-f-text { position:absolute; font-weight:700; font-size:${FH.size}pt; line-height:${i(FH.lineHeight)}; white-space:nowrap; }
.mg-f-email { left:${i(FH.email.x)}; top:${i(FH.email.y)}; }
.mg-f-email span { color:${COLORS.email}; }
.mg-f-phone { left:${i(FH.phone.x)}; top:${i(FH.phone.y)}; }
.mg-f-phone span { color:${COLORS.phone}; }
.mg-f-qc { ${box(FH.qc)} }
.mg-f-sign { ${box(FH.sign)} }
.mg-f-signatory { position:absolute; left:${i(FH.signatory.x)}; width:${i(FH.signatory.w)}; top:${i(FH.signatory.y)}; text-align:center; font-weight:700; font-size:${FH.size}pt; line-height:${i(FH.lineHeight)}; white-space:nowrap; }

@media print {
  html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
  .mg-doc { display:block; gap:0; }
  .mg-page { box-shadow:none; break-after:page; page-break-after:always; }
  .mg-page:last-child { break-after:auto; page-break-after:auto; }
}
`;
}
