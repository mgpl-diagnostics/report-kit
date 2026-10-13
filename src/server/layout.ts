/**
 * Single source of truth for the report geometry, shared by the HTML preview (styles.ts)
 * and the Node PDF renderer (pdf/ReportPdf.tsx). Measured from the original Word designs.
 *
 * Positions/sizes are in inches from the page's top-left corner; font sizes in pt.
 * A4 = 8.27in × 11.69in.
 */
export const PAGE = { w: 8.27, h: 11.69 };

export const COLORS = {
  navy: "#162884",
  band: "#BDD6EE",
  blue: "#00B0F0",
  red: "#FF0000",
  divider: "#A6A6A6",
  patientLine: "#808080",
  email: "#5F6368",
  phone: "#767171",
};

/** Font families. HTML and PDF load the same files from /public/report-fonts. */
export const FONTS = {
  body: "Carlito", // metric-compatible with Calibri
  title: "Archivo Black", // stands in for Arial Black
  address: "Barlow Semi Condensed", // stands in for Bahnschrift Light SemiCondensed
};

export const LETTERHEAD = {
  logo: { x: 0.41, y: 0.2, w: 3.34, h: 1.09 },
  divider: { x: 4.135, y: 0.27, h: 1.05, width: 0.75 },
  address: { x: 5.42, y: 0.5, size: 12, lineHeight: 0.2 },
  rule: { y: 1.33, width: 2.25 },
};

/** Where the body starts. Same for both variants: the non-header version is printed on
 *  paper that already carries the letterhead, so it keeps the exact same layout. */
export const BODY_TOP = 1.59;

export const TITLE_BAR = { x: 0.41, w: 7.38, h: 0.19, size: 11 };

/** Patient block: every field uses the same font size. */
export const PATIENT = {
  height: 1.42,
  size: 12,
  lineHeight: 0.22,
  name: { x: 0.5, y: 0.01 },
  age: { x: 0.5, y: 0.36 },
  sex: { x: 0.5, y: 0.77 },
  ref: { x: 0.5, y: 1.09 },
  date: { x: 4.53, y: 0.01 },
  id: { x: 5.0, y: 0.36 },
  /** Code 39 barcode of the patient ID (bwip-js) */
  barcode: { x: 5.85, y: 0.34, w: 1.03, h: 0.27 },
  /** grey line under "Ref. Doctor" (header variant) */
  line: { x: 0.08, w: 8.1, y: 1.37, width: 0.75 },
};

export const SECTION = {
  normal: { x: 1.0, w: 6.27 },
  wide: { x: 0.41, w: 7.38 },
  gapAfter: 0.18,
  border: 0.5,
  /** Word's default table cell padding */
  cellPad: 0.08,
  colHeader: { size: 11, lineHeight: 0.18 },
};

export const END = { marginTop: 0.22, size: 8 };

export const FOOTER_HEADER = {
  emailIcon: { x: 0.66, y: 10.25, s: 0.33 },
  phoneIcon: { x: 0.66, y: 10.58, s: 0.32 },
  email: { x: 1.0, y: 10.3 },
  phone: { x: 1.04, y: 10.64 },
  qc: { x: 4.11, y: 10.45, s: 0.726 },
  sign: { x: 5.52, y: 9.93, w: 1.63, h: 0.548 },
  signatory: { x: 5.0, w: 2.36, y: 10.45 },
  size: 11,
  lineHeight: 0.2,
};

/** What the "non-header" variant leaves out (because the pre-printed sheet already has it). */
export const NON_HEADER = {
  /** Logo, address, divider and thick rule are always omitted. */
  hideLetterhead: true,
  /** Also omit the email / mobile line at the bottom. */
  hideContactFooter: false,
};
