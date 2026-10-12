/** "header"     = full letterhead (logo, address, email/mobile footer) — for plain paper / PDF.
 *  "non-header" = top left blank for pre-printed letterhead paper; only QC stamp + signature. */
export type ReportVariant = "header" | "non-header";

/** "sidebar" = Navy Sidebar design (default); "classic" = replica of the original Word designs. */
export type ReportDesign = "sidebar" | "classic";

export interface Patient {
  /** Salutation before the name, e.g. "Mr", "Mrs", "Master", "Ku" */
  title?: string;
  name: string;
  /** e.g. 32 or "6 Month" */
  age: number | string;
  /** Default "Year(s)" */
  ageUnit?: string;
  sex: string;
  /** e.g. "MGPL398" — printed as a scannable Code 39 barcode (bwip-js) */
  patientId?: string;
  /** e.g. "Self", "A. Verma". "Dr. " is added unless it already starts with "Dr". */
  refDoctor?: string;
  /** Date or preformatted string; printed DD-MM-YYYY. Defaults to today. */
  sampleCollectionDate?: Date | string;
  /** Lab sample / accession number */
  sampleId?: string;
  /** Used on invoices */
  phone?: string;
  address?: string;
  /** e.g. "Whole Blood (EDTA)". Defaults to the specimens of the tests on the report. */
  sampleType?: string;
  /** Date or preformatted "12-10-2026 08:45 AM". Falls back to sampleCollectionDate. */
  collectedAt?: Date | string;
  registeredAt?: Date | string;
  reportedAt?: Date | string;
}

/** A piece of text with optional formatting. */
export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** CSS colour, e.g. "#FF0000" */
  color?: string;
  /** Font size in pt */
  size?: number;
  font?: string;
}

export type Rich = string | TextRun | TextRun[];

export type Align = "left" | "center" | "right";

/** "auto" (default) compares a numeric result with the reference range. */
export type Flag = "auto" | "normal" | "high" | "low" | "abnormal";

export interface Column {
  /** "name" | "result" | "unit" | "range" for test rows; anything for `cells` rows */
  key: string;
  header: string;
  /** Width in inches */
  width: number;
  /** Alignment of the values */
  align?: Align;
  /** Alignment of the header text (defaults to `align`) */
  headerAlign?: Align;
  /** Extra left padding of values, inches */
  padLeft?: number;
  /** Extra left padding of the header text, inches (default 0.08 = Word cell margin) */
  headerPadLeft?: number;
  /** Header cell spans this many columns (e.g. "WIDAL TEST" over two columns) */
  headerSpan?: number;
}

/** Sub-heading inside a section, e.g. "COMPLETE BLOOD COUNT", "PHYSICAL EXAMINATION". */
export interface HeadingRow {
  kind: "heading";
  text: string;
  size?: number;
  color?: string;
}

/** Normal test line: name | result | unit | range */
export interface TestRow {
  kind: "test";
  /** Key used to fill results, e.g. "hb" */
  key?: string;
  name: string;
  /** Bold suffix after the name, e.g. "(HB)" */
  abbr?: string;
  result?: string;
  unit?: string;
  /** One line, or several lines (Lipid profile risk bands) */
  range?: string | string[];
  /** Sex-specific ranges; picked from the patient's sex when the report is built */
  rangeBySex?: { male: string; female: string };
  flag?: Flag;
  /** Override result colour */
  resultColor?: string;
  /** Italic method line under the test, e.g. "(Performed on Jmitra Rapid test.)" */
  method?: string;
}

/** Free cells, for grids like the Widal titre table and Semen analysis. */
export interface CellsRow {
  kind: "cells";
  cells: Rich[];
}

/** Full-width paragraph, e.g. "IMPRESSION – Reactive". */
export interface TextRow {
  kind: "text";
  content: Rich;
  /** Left indent, inches */
  indent?: number;
  /** Space before, pt */
  spaceBefore?: number;
}

export type Row = HeadingRow | TestRow | CellsRow | TextRow;

/** Typography + colour knobs for one section (each template sets these to match its design). */
export interface SectionStyle {
  /** Title size in pt (Arial Black). Default 12 */
  titleSize?: number;
  /** Title letter spacing in pt */
  titleSpacing?: number;
  /** Row font size in pt. Default 11 */
  fontSize?: number;
  /** Row font family override (Dengue / HIV use Arial) */
  font?: string;
  /** Heading row size in pt. Default 11 */
  headingSize?: number;
  /** Space after each row, pt. Default 6 */
  rowGap?: number;
  /** Min height of each row, pt */
  rowHeight?: number;
  nameBold?: boolean;
  nameSize?: number;
  /** Colour of in-range results. Default black. CBC uses "#00B0F0". */
  resultColor?: string;
  resultBold?: boolean;
  resultSize?: number;
  unitBold?: boolean;
  /** Font size for multi-line ranges, pt */
  rangeSize?: number;
  rangeFont?: string;
  rangeBold?: boolean;
  /** Abnormal results colour. Default "#FF0000" */
  abnormalColor?: string;
  /** Abnormal results bold. Default true */
  abnormalBold?: boolean;
  /** Method line size, pt */
  methodSize?: number;
  /** Space between a test and its method line, pt. Default 6 */
  methodGap?: number;
  /** Space after heading rows, pt (default = rowGap) */
  headingGap?: number;
  /** Row content left indent, inches */
  indent?: number;
}

export interface Section {
  /** Department title in the blue band, e.g. "HEMATOLOGY" */
  title: string;
  /** Test / panel name, e.g. "Complete Blood Count (CBC)". Set from the template. */
  subtitle?: string;
  /** e.g. "Whole Blood (EDTA)" */
  specimen?: string;
  /** e.g. "Automated Cell Counter" */
  method?: string;
  columns: Column[];
  /** Hide the column header row (Semen Analysis) */
  hideColumnHeader?: boolean;
  rows: Row[];
  /** Full report width like the title bar (CBC). Default = within page margins. */
  wide?: boolean;
  style?: SectionStyle;
  /** Start this section on a new A4 page */
  pageBreakBefore?: boolean;
}

/** Every image is just a URL: "/report-assets/logo.svg", "https://…", or a data: URI.
 *  Swap them in one place (lab.ts) — SVG and PNG both work. */
export interface LabProfile {
  name: string;
  logoSrc: string;
  addressLines: string[];
  email: string;
  phone: string;
  signatory: {
    name: string;
    designation: string;
    /** Signature on the header (letterhead) variant */
    signatureHeaderSrc: string;
    /** Signature on the non-header variant */
    signatureNonHeaderSrc: string;
  };
  qcStampSrc?: string;
  icons: { emailSrc: string; phoneSrc: string };
  /** Vertical text in the sidebar (Navy Sidebar design). Defaults to the lab name in capitals. */
  sidebarText?: string;
  /** Lines printed in the letterhead footer (Navy Sidebar design) */
  footerLines?: string[];
  /** If set, the QR code links to `${verifyBaseUrl}${sampleId ?? patientId}`; otherwise it
   *  encodes a plain-text summary of the report. */
  verifyBaseUrl?: string;
  /* ---- billing (invoice kit) ---- */
  /** UPI ID (VPA) for the "scan to pay" QR on invoices, e.g. "mgpl@okaxis" */
  upiId?: string;
  /** Printed on invoices when the lab is GST registered */
  gstin?: string;
  /** Clinical establishment / lab registration number */
  registrationNo?: string;
  /** Terms printed at the bottom of invoices */
  invoiceTerms?: string[];
}

export interface Report {
  patient: Patient;
  sections: Section[];
  /** Defaults to "--End of Report--" */
  endText?: string;
  /** Override what the QR code encodes */
  qrValue?: string;
}
