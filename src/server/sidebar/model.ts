// Display logic shared by the HTML and PDF renderers of the Navy Sidebar design.
import { formatDate, formatDateTime, formatDoctor, fullName, resolveFlag } from "../format";
import { headerCells } from "../measure";
import type { Align, Report, Section, TestRow } from "../../shared/types";
import { SB_COLORS, SB_COLS, SB_CONTENT } from "./layout";

export interface Field {
  label: string;
  value: string;
  strong?: boolean;
}

/** 3 × 3 patient grid, filled row by row. */
export function patientFields(report: Report): Field[] {
  const p = report.patient;
  const specimens = [...new Set(report.sections.map((s) => s.specimen).filter(Boolean))];
  const dash = (v?: string) => (v && v.trim() ? v : "-");
  return [
    { label: "Patient Name", value: fullName(p), strong: true },
    { label: "Age / Sex", value: `${p.age} ${p.ageUnit ?? "Year(s)"} / ${p.sex}` },
    { label: "Patient ID", value: dash(p.patientId) },
    { label: "Ref. Doctor", value: formatDoctor(p.refDoctor) },
    { label: "Sample ID", value: dash(p.sampleId) },
    { label: "Sample Type", value: dash(p.sampleType ?? (specimens.length > 1 ? "Multiple (see tests)" : specimens[0])) },
    { label: "Collected", value: formatDateTime(p.collectedAt) || formatDate(p.sampleCollectionDate) },
    { label: "Registered", value: dash(formatDateTime(p.registeredAt)) },
    { label: "Reported", value: dash(formatDateTime(p.reportedAt)) },
  ];
}

/** H / L / A pill for a test row ("" when normal). */
export function flagOf(row: TestRow): { label: "" | "H" | "L" | "A"; color: string; abnormal: boolean } {
  const f = resolveFlag(row);
  if (f === "high") return { label: "H", color: SB_COLORS.red, abnormal: true };
  if (f === "low") return { label: "L", color: SB_COLORS.blue, abnormal: true };
  if (f === "abnormal") return { label: "A", color: SB_COLORS.red, abnormal: true };
  return { label: "", color: "", abnormal: false };
}

/** Sections with only Test | Result (Blood Group, MP): the result gets the full remaining width. */
export const isTwoColumn = (s: Section) => !s.columns.some((c) => c.key === "unit" || c.key === "range");
export const TWO_COL_RESULT_W = SB_CONTENT.w - SB_COLS.name;

export const STD_COLUMNS: { key: keyof typeof SB_COLS; header: string; align: Align }[] = [
  { key: "name", header: "Test Description", align: "left" },
  { key: "result", header: "Result", align: "center" },
  { key: "flag", header: "Flag", align: "center" },
  { key: "unit", header: "Unit", align: "center" },
  { key: "range", header: "Biological Ref. Interval", align: "center" },
];

/** Grid sections (Widal, Semen…) keep their own columns, scaled to the content width. */
export function gridColumns(s: Section) {
  const total = s.columns.reduce((a, c) => a + c.width, 0);
  const k = SB_CONTENT.w / total;
  return {
    cols: s.columns.map((c) => ({ ...c, w: c.width * k, align: c.align ?? ("left" as Align) })),
    headers: headerCells(s).map((c) => ({ ...c, w: c.spanWidth * k, align: c.headerAlign ?? c.align ?? ("left" as Align) })),
  };
}

export const sectionMeta = (s: Section) =>
  [s.specimen && `Specimen: ${s.specimen}`, s.method && `Method: ${s.method}`].filter(Boolean).join("   •   ");

export const LEGEND = "H / L = above / below the biological reference interval;  A = abnormal.  Results should be correlated clinically.";
export const LEGAL = "This is an electronically verified report. Scan the QR code to confirm its details.";
