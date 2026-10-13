import type { Column, Flag, Patient, Rich, Row, Section, SectionStyle, TestRow } from "../../shared/types";

/** What an app passes for one test line. A plain string is just the result. */
export type ResultValue =
  | string
  | {
      value?: string;
      flag?: Flag;
      /** Override the default reference range (e.g. male/female) */
      range?: string | string[];
      unit?: string;
      method?: string;
    };

/** Results for one template, keyed by the row keys listed in the template. */
export type Results = Record<string, ResultValue | string[] | undefined>;

export interface BuildContext {
  patient?: Patient;
}

export interface ReportTemplate<R extends Results = Results> {
  id: string;
  /** Display name, e.g. "Complete Blood Count (CBC)" */
  name: string;
  /** Row keys this template understands (for building entry forms) */
  /** Department, for grouping in pickers */
  category?: string;
  /** Printed under the test name (Navy Sidebar design) */
  specimen?: string;
  method?: string;
  fields: { key: string; label: string; unit?: string; range?: string | string[] }[];
  build(results: R, ctx: BuildContext): Section[];
  /** Results taken from the original Word design — used for the preview */
  sample: R;
}

/** Shorthand for a test row definition */
export const t = (
  key: string,
  name: string,
  unit?: string,
  range?: string | string[],
  extra: Partial<TestRow> = {},
): TestRow => ({ kind: "test", key, name, unit, range, ...extra });

export const h = (text: string, size?: number): Row => ({ kind: "heading", text, size });

/** Puts results into the template's test rows.
 *  onlyFilled: drop test rows that have no result (e.g. pick BSF / BSPP / RBS). */
export function fillRows(rows: Row[], results: Results, onlyFilled = false, ctx: BuildContext = {}): Row[] {
  const out: Row[] = [];
  const sex = sexOf(ctx.patient);
  for (let row of rows) {
    if (row.kind === "test" && row.rangeBySex && sex) row = { ...row, range: row.rangeBySex[sex] };
    if (row.kind !== "test" || !row.key) {
      out.push(row);
      continue;
    }
    const r = results[row.key];
    if (r === undefined || r === "") {
      if (!onlyFilled) out.push(row);
      continue;
    }
    if (typeof r === "string") out.push({ ...row, result: r });
    else if (Array.isArray(r)) out.push({ ...row, result: r.join(" ") });
    else
      out.push({
        ...row,
        result: r.value,
        flag: r.flag ?? row.flag,
        range: r.range ?? row.range,
        unit: r.unit ?? row.unit,
        method: r.method ?? row.method,
      });
  }
  // Drop headings left with nothing under them
  if (onlyFilled) {
    return out.filter((row, i) => {
      if (row.kind !== "heading") return true;
      const next = out[i + 1];
      return next && next.kind !== "heading";
    });
  }
  return out;
}

/** "male" / "female" from free-text sex ("M", "Male", "MALE", "Female", "F"…) */
export function sexOf(p?: Patient): "male" | "female" | undefined {
  const s = p?.sex?.trim().toLowerCase() ?? "";
  if (s.startsWith("f")) return "female";
  if (s.startsWith("m")) return "male";
  return undefined;
}

export const fieldsOf = (rows: Row[]) =>
  rows
    .filter((r): r is TestRow => r.kind === "test" && !!r.key)
    .map((r) => ({ key: r.key!, label: r.name + (r.abbr ? ` ${r.abbr}` : ""), unit: r.unit, range: r.range }));

/** "+ve" in red bold, "-ve" in blue — Widal styling */
export function titre(v: string): Rich {
  const pos = /^\+|pos/i.test(v.trim());
  return pos ? { text: v, bold: true, color: "#FF0000" } : { text: v, color: "#00B0F0" };
}

/* ------------------------------------------------------------------ columns */
// Widths are in inches; each preset reproduces the column positions of the Word designs.

/** Test | Result | Unit | Biological Reference Ranges — normal width (LFT, HB, Blood sugar) */
export const COLS_STD: Column[] = [
  { key: "name", header: "Test Description", width: 2.35, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 0.9, align: "center" },
  { key: "unit", header: "Unit", width: 1.05, align: "center" },
  { key: "range", header: "Biological Reference Ranges", width: 1.97, align: "center" },
];

/** CBC — full width table */
export const COLS_CBC: Column[] = [
  { key: "name", header: "Test Description", width: 3.49, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 0.9, align: "center" },
  { key: "unit", header: "Unit", width: 1.05, align: "center" },
  { key: "range", header: "Biological Reference Ranges", width: 1.94, align: "center" },
];

/** Lipid profile — multi-line ranges, left aligned */
export const COLS_LIPID: Column[] = [
  { key: "name", header: "Test Description", width: 2.4, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 0.9, align: "center" },
  { key: "unit", header: "Unit", width: 1.0, align: "center" },
  { key: "range", header: "Biological Reference Ranges", width: 1.97, align: "left", headerAlign: "center", padLeft: 0.6 },
];

/** Test | Result | Reference Range — serology (Dengue, HIV, HBsAg, VDRL) */
export const COLS_SEROLOGY: Column[] = [
  { key: "name", header: "Test Description", width: 2.4, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 1.7, align: "center" },
  { key: "range", header: "Reference Range", width: 2.17, align: "left", headerAlign: "center", padLeft: 0.48 },
];

/** Test | Result — Blood group, MP */
export const COLS_TWO: Column[] = [
  { key: "name", header: "Test Description", width: 3.0, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 3.27, headerPadLeft: 0.08 },
];

/** Test | Result | Biological Reference Ranges — RA factor */
export const COLS_RA: Column[] = [
  { key: "name", header: "Test Description", width: 2.4, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 0.9, align: "center" },
  { key: "range", header: "Biological Reference Ranges", width: 2.67, align: "center" },
];

/** Test | Result | Unit — Urine / Stool routine */
export const COLS_ROUTINE: Column[] = [
  { key: "name", header: "Test Description", width: 2.6, headerPadLeft: 0.08 },
  { key: "result", header: "Result", width: 1.42, align: "center" },
  { key: "unit", header: "Unit", width: 2.25, align: "center", padLeft: 0.43 },
];

/** Widal titre grid */
export const COLS_WIDAL: Column[] = [
  { key: "c0", header: "WIDAL TEST", width: 0.9, padLeft: 0.14, headerPadLeft: 0.08, headerSpan: 2 },
  { key: "c1", header: "", width: 0.93 },
  { key: "t40", header: "1:40", width: 0.8, align: "center" },
  { key: "t80", header: "1:80", width: 0.84, align: "center" },
  { key: "t160", header: "1:160", width: 0.82, align: "center" },
  { key: "t320", header: "1:320", width: 1.0, align: "center" },
  { key: "t640", header: "1:640", width: 0.58, align: "center" },
];

/** Label | Value | Extra — Semen analysis (no column header) */
export const COLS_SEMEN: Column[] = [
  { key: "c0", header: "", width: 1.5 },
  { key: "c1", header: "", width: 1.0 },
  { key: "c2", header: "", width: 3.77 },
];

/** Builds a standard one-section template (Test | Result | Unit | Range). */
export function panel(def: {
  id: string;
  name: string;
  category: string;
  title: string;
  rows: Row[];
  columns?: Column[];
  /** Only print the rows that have a result (à-la-carte panels) */
  onlyFilled?: boolean;
  style?: SectionStyle;
  wide?: boolean;
  specimen?: string;
  method?: string;
  sample: Results;
}): ReportTemplate {
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    specimen: def.specimen,
    method: def.method,
    fields: fieldsOf(def.rows),
    build: (r, ctx) => [
      { title: def.title, columns: def.columns ?? COLS_STD, wide: def.wide, rows: fillRows(def.rows, r, def.onlyFilled, ctx), style: def.style },
    ],
    sample: def.sample,
  };
}
