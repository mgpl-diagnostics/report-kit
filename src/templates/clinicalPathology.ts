import type { Rich, Row, SectionStyle } from "../types";
import { COLS_ROUTINE, COLS_SEMEN, COLS_TWO, fieldsOf, fillRows, h, t, type ReportTemplate, type Results, type ResultValue } from "./helpers";

const routineStyle: SectionStyle = { rowGap: 0, headingSize: 12, abnormalBold: false };
const HPF = "/hpf";

/* --------------------------------------------------------------------- Urine */

const urineRows: Row[] = [
  h("PHYSICAL EXAMINATION"),
  t("appearance", "Appearance"),
  t("colour", "Colour"),
  t("reaction", "Reaction (pH)"),
  t("quantity", "Quantity"),
  h("CHEMICAL EXAMINATION"),
  t("glucose", "Glucose"),
  t("albumin", "Albumin"),
  h("MICROSCOPIC EXAMINATION"),
  t("pusCells", "Pus Cells", HPF),
  t("rbc", "Red Blood Cells", HPF),
  t("epithelial", "Epithelial Cells", HPF),
  t("bacteria", "Bacteria", HPF),
  t("uricAcid", "Uric Acid Crystals", HPF),
  t("casts", "Casts", HPF),
  t("others", "Others"),
];

export const urine: ReportTemplate = {
  id: "urine",
  name: "Urine Routine & Microscopic (URM)",
  specimen: "Urine",
  fields: fieldsOf(urineRows),
  build: (r) => [{ title: "URINE ROUTINE & MICROSCOPIC", columns: COLS_ROUTINE, rows: fillRows(urineRows, r), style: routineStyle }],
  sample: {
    appearance: "Clear", colour: "Yellow", reaction: "Acidic", quantity: "25mL", glucose: "Nil", albumin: "Nil",
    pusCells: { value: "20 - 30", flag: "abnormal" }, rbc: "Nil", epithelial: "Nil",
    bacteria: { value: "Plenty", flag: "abnormal" }, uricAcid: "Nil", casts: "Nil",
  },
};

/* ---------------------------------------------------------------------- UPT */

const uptRows: Row[] = [t("upt", "Urine Pregnancy Test")];

export const upt: ReportTemplate = {
  id: "upt",
  name: "Urine Pregnancy Test (UPT)",
  specimen: "Urine",
  method: "Rapid Card Test",
  fields: fieldsOf(uptRows),
  build: (r) => [
    {
      title: "URINE ROUTINE & MICROSCOPIC",
      columns: [COLS_TWO[0], { ...COLS_TWO[1], width: 1.0, headerPadLeft: undefined, align: "center" }, { key: "unit", header: "Unit", width: 2.27, align: "center", padLeft: 0.43 }],
      rows: fillRows(uptRows, r),
      style: routineStyle,
    },
  ],
  sample: { upt: "Negative" },
};

/* --------------------------------------------------------------------- Stool */

const stoolRows: Row[] = [
  h("PHYSICAL EXAMINATION"),
  t("colour", "Colour"),
  t("consistency", "Consistency"),
  t("reaction", "Reaction (pH)"),
  t("blood", "Blood"),
  t("mucus", "Mucus"),
  h("CHEMICAL EXAMINATION"),
  t("glucose", "Glucose"),
  t("occultBlood", "Occult Blood"),
  h("MICROSCOPIC EXAMINATION"),
  t("vegCells", "Vegetables Cell", HPF),
  t("ova", "Ova", HPF),
  t("cysts", "Cysts", HPF),
  t("pusCells", "Pus Cells", HPF),
  t("rbc", "Red Blood Cells", HPF),
  t("epithelial", "Epithelial Cells", HPF),
  t("bacteria", "Bacteria", HPF),
  t("fat", "Fat Droplet"),
];

export const stool: ReportTemplate = {
  id: "stool",
  name: "Stool Routine & Microscopic",
  specimen: "Stool",
  fields: fieldsOf(stoolRows),
  build: (r) => [{ title: "STOOL ROUTINE & MICROSCOPIC", columns: COLS_ROUTINE, rows: fillRows(stoolRows, r), style: routineStyle }],
  sample: {
    colour: "Yellow", consistency: "Semi Solid", reaction: "Alkaline", blood: "Absent", mucus: "Present (+)",
    glucose: "Absent", occultBlood: "Absent", vegCells: "Few", ova: "Absent", cysts: "Absent", pusCells: "0 - 2",
    rbc: "Nil", epithelial: "Nil", bacteria: "Few", fat: "Nil",
  },
};

/* --------------------------------------------------------------------- Semen */

export interface SemenResults extends Results {
  volume?: ResultValue;
  liquefaction?: ResultValue;
  ph?: ResultValue;
  /** million/ml — printed red when below 60 */
  spermCount?: ResultValue;
  motility?: ResultValue;
  morphology?: ResultValue;
  pusCells?: ResultValue;
  rbc?: ResultValue;
  result?: ResultValue;
}

const val = (v: ResultValue | undefined): { text: string; abnormal: boolean } => {
  if (v === undefined) return { text: "", abnormal: false };
  if (typeof v === "string") return { text: v, abnormal: false };
  return { text: v.value ?? "", abnormal: !!v.flag && v.flag !== "normal" && v.flag !== "auto" };
};

const red = (v: ResultValue | undefined): Rich => {
  const { text, abnormal } = val(v);
  return abnormal ? { text, color: "#FF0000" } : text;
};

export const semen: ReportTemplate<SemenResults> = {
  id: "semen",
  name: "Semen Analysis",
  specimen: "Semen",
  fields: [
    { key: "volume", label: "Volume" },
    { key: "liquefaction", label: "Liquefaction Time" },
    { key: "ph", label: "pH" },
    { key: "spermCount", label: "Sperm Count", unit: "million/ml", range: "60 – 150" },
    { key: "motility", label: "Motility" },
    { key: "morphology", label: "Morphology" },
    { key: "pusCells", label: "Pus Cells", unit: HPF },
    { key: "rbc", label: "RBC's", unit: HPF },
    { key: "result", label: "Result" },
  ],
  build: (r) => {
    const count = val(r.spermCount);
    const low = count.abnormal || (parseFloat(count.text) < 60 && !Number.isNaN(parseFloat(count.text)));
    const rows: Row[] = [
      h("Gross Examination"),
      { kind: "cells", cells: ["Volume:", red(r.volume)] },
      { kind: "cells", cells: ["Liquefaction Time:", red(r.liquefaction)] },
      { kind: "cells", cells: ["pH:", red(r.ph)] },
      h("Microscopic Examination"),
      {
        kind: "cells",
        cells: [
          "Sperm Count:",
          [{ text: count.text, color: low ? "#FF0000" : undefined }, { text: "million/ml" }],
          "(Normal Range 60 – 150 million/mL)",
        ],
      },
      { kind: "cells", cells: ["Motility:", red(r.motility)] },
      { kind: "cells", cells: ["Morphology:", red(r.morphology)] },
      { kind: "cells", cells: ["Pus Cells:", red(r.pusCells), HPF] },
      { kind: "cells", cells: ["RBC’s:", red(r.rbc), HPF] },
      { kind: "cells", cells: ["Result:", red(r.result)] },
    ];
    return [{ title: "SEMEN ANALYSIS", columns: COLS_SEMEN, hideColumnHeader: true, rows, style: { titleSize: 13, rowGap: 11, headingGap: 11 } }];
  },
  sample: {
    volume: "2ml",
    liquefaction: "30 Minutes",
    ph: "Alkaline (7.5)",
    spermCount: "35",
    motility: "50%",
    morphology: "Normal",
    pusCells: { value: "0 - 2", flag: "abnormal" },
    rbc: { value: "0 – 2", flag: "abnormal" },
    result: { value: "Oligospermic", flag: "abnormal" },
  },
};
