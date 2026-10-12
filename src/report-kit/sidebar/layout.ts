/**
 * "Navy Sidebar" design — geometry shared by the HTML preview and the Node PDF renderer.
 * Inches from the page's top-left corner (A4 = 8.27 × 11.69in); font sizes in pt.
 *
 * The page has two layers:
 *   LETTERHEAD (stationery) — sidebar, header, footer. Printed only in the "header" variant
 *                             (or pre-printed on the paper for the "non-header" variant).
 *   REPORT                  — patient block, results, signature, page number. Always printed,
 *                             at exactly the same place in both variants.
 */
export const SB_PAGE = { w: 8.27, h: 11.69 };

export const SB_COLORS = {
  navy: "#14264A",
  saffron: "#C2410C",
  gold: "#E9A23B",
  ink: "#111827",
  muted: "#5A6478",
  line: "#E4E7EC",
  zebra: "#F6F8FB",
  red: "#D92D20",
  blue: "#1570EF",
};

export const SB_FONT = "Manrope";

/** Content column (everything except the sidebar) */
export const SB_CONTENT = { x: 0.85, w: 6.97 };
export const SB_RIGHT = SB_CONTENT.x + SB_CONTENT.w; // 7.82in

/* ---------------------------------------------------------------- letterhead */
export const SB_SIDEBAR = { w: 0.45, textSize: 10, letterSpacing: 3.6 };
export const SB_HEADER = {
  logo: { x: SB_CONTENT.x, y: 0.3, w: 2.6, h: 0.95 },
  contact: { y: 0.36, size: 9, lineHeight: 0.2, icon: 0.12 },
  rule: { y: 1.42, width: 0.75 },
};
export const SB_FOOTER = {
  rule: { y: 10.98, width: 1 },
  lines: { y: 11.06, size: 7.5, lineHeight: 0.18 },
};

/* -------------------------------------------------------------------- report */
export const SB_PATIENT = {
  y: 1.58,
  /** 3 × 3 grid of label/value fields */
  grid: { colW: 1.75, rowH: 0.37, labelSize: 6.5, valueSize: 9.5 },
  barcode: { w: 1.45, h: 0.34 },
  qr: { s: 0.68, labelSize: 6 },
};
/** Result area (between patient block and signature zone) */
export const SB_BODY = { top: 2.92, bottom: 9.55 };

export const SB_SIGN = {
  qc: { x: 4.95, y: 9.7, s: 0.72 },
  sign: { w: 1.45, h: 0.47, y: 9.66 },
  /** signature block is centred on this x (keeps the 1.9in-wide name inside the margin) */
  centerX: SB_RIGHT - 1.15,
  nameY: 10.16,
  nameSize: 9,
  roleSize: 8.5,
};
export const SB_LEGAL = { y: 10.64, size: 6.8 };

/* ------------------------------------------------------------- result table */
/** Standard columns (inches, sum = content width). Sized from measured Manrope text widths:
 *  name fits "Mean Corpuscular Haemoglobin Concentration (MCHC)", result fits a bold "Non - Reactive",
 *  range fits "200 – 499: Hyper triglyceridemic". `npm run smoke` re-checks every template. */
export const SB_COLS = { name: 3.2, result: 0.98, flag: 0.39, unit: 0.8, range: 1.6 };
export const SB_CELL_PAD = 0.06;

/** Row heights (pt). Both renderers use exactly these, so pages break identically. */
export const SB_ROWS = {
  fontSize: 8.6,
  dept: 24, // department title (HEMATOLOGY …)
  title: 15, // test name line
  meta: 10, // specimen / method line
  tableHeader: 17,
  heading: 17, // sub-heading inside a table
  test: 15.5,
  method: 9.5, // extra for a method line under a test
  rangeLine: 9, // per line of a multi-line range
  cells: 18,
  text: 17,
  sectionGap: 10,
  end: 34, // legend + "End of Report"
};
