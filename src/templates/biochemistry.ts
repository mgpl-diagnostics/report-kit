import type { Row } from "../types";
import { COLS_LIPID, COLS_STD, fieldsOf, fillRows, h, panel, t, type ReportTemplate } from "./helpers";

const TITLE = "CLINICAL BIOCHEMISTRY";

/* --------------------------------------------------------------- Blood sugar */
// Only the lines that have a result are printed (F / PP / Random in any combination).

const sugarRows: Row[] = [
  t("bsf", "Blood Sugar Fasting (F)", "mg/dl", "80 - 120"),
  t("bspp", "Blood Sugar (PP)", "mg/dl", "120 - 160"),
  t("bsr", "Blood Sugar Random (R)", "mg/dl", "80 - 120"),
];

export const bloodSugar: ReportTemplate = {
  id: "blood-sugar",
  name: "Blood Sugar (F / PP / Random)",
  specimen: "Fluoride Plasma",
  fields: fieldsOf(sugarRows),
  build: (r) => [{ title: TITLE, columns: COLS_STD, rows: fillRows(sugarRows, r, true), style: { rowGap: 10 } }],
  sample: { bsf: "152.9", bspp: "192.6" },
};

/* ----------------------------------------------------------------------- LFT */

const lftRows: Row[] = [
  h("Liver Function Profile"),
  t("bilTotal", "Bilirubin Total", "Mg/dL", "0 – 1.0"),
  t("bilDirect", "Bilirubin Direct", "Mg/dL", "0 - 0.3"),
  t("bilIndirect", "Bilirubin Indirect", "Mg/dL", "<1.0"),
  t("alp", "Alkaline Phosphatase (ALP)", "U/L", "50 - 136"),
  t("alt", "Alanine Transaminase (ALT/SGPT)", "U/L", "5 - 40"),
  t("ast", "Aspartate Aminotransferase (AST/SGOT)", "U/L", "5 – 32"),
  t("ggt", "Gamma Glutamyl Transferase (GGT)", "U/L", "5 - 36"),
  t("protein", "Protein Total", "G/dl", "6.6 - 8.7"),
  t("albumin", "Albumin, Serum", "G/dl", "3.5 - 5.2"),
  t("globulin", "Globulin", "G/dl", "2.5 – 3.5"),
  t("agRatio", "Albumin / Globulin Ratio", "Ratio", "1.0 – 2.1"),
];

export const lft: ReportTemplate = {
  id: "lft",
  name: "Liver Function Test (LFT)",
  specimen: "Serum",
  fields: fieldsOf(lftRows),
  build: (r) => [
    {
      title: TITLE,
      columns: COLS_STD,
      rows: fillRows(lftRows, r),
      style: { fontSize: 10, headingSize: 11, rowGap: 9, headingGap: 12, abnormalBold: false },
    },
  ],
  sample: {
    bilTotal: "3.9", bilDirect: "2.8", bilIndirect: "1.1", alp: "70", alt: "17", ast: "16", ggt: "18",
    protein: "7.3", albumin: "3.8", globulin: "3.5", agRatio: "1.08",
  },
};

/* --------------------------------------------------------------------- Lipid */

const lipidRows: Row[] = [
  h("Lipid Profile"),
  t("cholTotal", "Cholesterol Total", "Mg/dL", ["<200 – Desirable", "200-239 - Borderline risk", ">240 - High risk"]),
  t("hdl", "Cholesterol - HDL", "Mg/dL", ["< 40: Low", "40 - 60: Optimal", "> 60: Desirable"]),
  t("tgl", "Triglycerides (TGL)", "Mg/dL", ["< 150: Normal", "150 – 199: High", "200 – 499: Hyper triglyceridemic", "> 499: Very High"]),
  t("ldl", "Cholesterol - LDL", "Mg/dL", ["< 100: Normal", "100 - 129: Desirable", "130 – 159: Borderline-High", "160 – 189: High", "> 190: Very High"]),
  t("vldl", "Cholesterol - VLDL", "Mg/dL", ["7-40"]),
  t("tcHdl", "Total Cholesterol/HDL ratio", "Ratio", ["0.0-5.0"]),
  t("ldlHdl", "LDL / HDL Ratio", "Ratio", ["0.0-3.5"]),
];

export const lipid: ReportTemplate = {
  id: "lipid",
  name: "Lipid Profile",
  specimen: "Serum",
  fields: fieldsOf(lipidRows),
  build: (r) => [
    {
      title: TITLE,
      columns: COLS_LIPID,
      rows: fillRows(lipidRows, r),
      style: { fontSize: 10, headingSize: 11, rowGap: 12, headingGap: 4, rangeSize: 7, abnormalBold: false },
    },
  ],
  sample: { cholTotal: "150", hdl: "44", tgl: "69", ldl: "92.2", vldl: "13.8", tcHdl: "3.4", ldlHdl: "2.1" },
};

/* ------------------------------------------------------------ Kidney (RFT / KFT) */
// Adult reference ranges. Creatinine and uric acid switch on the patient's sex.

const creatinine = t("creatinine", "Serum Creatinine", "mg/dL", "0.6 - 1.3", { rangeBySex: { male: "0.7 - 1.3", female: "0.6 - 1.1" } });
const uricAcid = t("uricAcid", "Serum Uric Acid", "mg/dL", "2.6 - 7.2", { rangeBySex: { male: "3.5 - 7.2", female: "2.6 - 6.0" } });

const rftRows: Row[] = [
  h("Renal Function Test"),
  t("urea", "Blood Urea", "mg/dL", "15 - 45"),
  t("bun", "Blood Urea Nitrogen (BUN)", "mg/dL", "7 - 21"),
  creatinine,
  uricAcid,
  t("bunCreatRatio", "BUN / Creatinine Ratio", "Ratio", "10 - 20"),
];

const electrolyteRows: Row[] = [
  t("sodium", "Serum Sodium (Na+)", "mmol/L", "135 - 145"),
  t("potassium", "Serum Potassium (K+)", "mmol/L", "3.5 - 5.1"),
  t("chloride", "Serum Chloride (Cl-)", "mmol/L", "98 - 107"),
];

const sectionStyle = { fontSize: 10, headingSize: 11, rowGap: 9, headingGap: 12, abnormalBold: false };

export const rft = panel({
  id: "rft",
  name: "Renal Function Test (RFT)",
  specimen: "Serum",
  category: "Biochemistry",
  title: TITLE,
  rows: rftRows,
  style: sectionStyle,
  sample: { urea: "28", bun: "13.1", creatinine: "0.9", uricAcid: "5.4", bunCreatRatio: "14.6" },
});

export const kft = panel({
  id: "kft",
  name: "Kidney Function Test (KFT)",
  specimen: "Serum",
  category: "Biochemistry",
  title: TITLE,
  rows: [
    h("Kidney Function Test"),
    ...rftRows.slice(1),
    h("Serum Electrolytes"),
    ...electrolyteRows,
    t("calcium", "Serum Calcium", "mg/dL", "8.5 - 10.5"),
    t("phosphorus", "Serum Phosphorus", "mg/dL", "2.5 - 4.5"),
  ],
  style: sectionStyle,
  sample: {
    urea: "52", bun: "24.3", creatinine: "1.6", uricAcid: "6.8", bunCreatRatio: "15.2",
    sodium: "138", potassium: "4.6", chloride: "101", calcium: "9.2", phosphorus: "3.8",
  },
});

export const electrolytes = panel({
  id: "electrolytes",
  name: "Serum Electrolytes (Na / K / Cl)",
  specimen: "Serum",
  category: "Biochemistry",
  title: TITLE,
  rows: [h("Serum Electrolytes"), ...electrolyteRows],
  style: sectionStyle,
  sample: { sodium: "131", potassium: "4.2", chloride: "99" },
});

/* -------------------------------------------------------------------- HbA1c */

export const hba1c: ReportTemplate = {
  id: "hba1c",
  name: "Glycated Haemoglobin (HbA1c)",
  specimen: "Whole Blood (EDTA)",
  category: "Biochemistry",
  fields: [
    { key: "hba1c", label: "HbA1c", unit: "%" },
    { key: "eag", label: "Estimated Average Glucose (leave empty to calculate)", unit: "mg/dL" },
  ],
  build: (r) => {
    const v = typeof r.hba1c === "string" ? r.hba1c : (r.hba1c as { value?: string } | undefined)?.value;
    const a1c = parseFloat(v ?? "");
    // ADA: eAG (mg/dL) = 28.7 × HbA1c − 46.7
    const eag = (r.eag as string | undefined) ?? (Number.isFinite(a1c) ? (28.7 * a1c - 46.7).toFixed(1) : undefined);
    const flag = !Number.isFinite(a1c) ? "normal" : a1c >= 5.7 ? "high" : "normal";
    const rows: Row[] = [
      h("Glycated Haemoglobin"),
      t("hba1c", "HbA1c", "%", ["< 5.7 : Non-diabetic", "5.7 - 6.4 : Pre-diabetic", ">= 6.5 : Diabetic"], { flag }),
      t("eag", "Estimated Average Glucose (eAG)", "mg/dL", "-"),
    ];
    return [{ title: TITLE, columns: COLS_LIPID, rows: fillRows(rows, { ...r, eag }), style: { ...sectionStyle, rowGap: 12, headingGap: 4, rangeSize: 8 } }];
  },
  sample: { hba1c: "7.2" },
};

/* -------------------------------------------------------------- Iron profile */

export const ironProfile = panel({
  id: "iron-profile",
  name: "Iron Profile",
  specimen: "Serum",
  category: "Biochemistry",
  title: TITLE,
  rows: [
    h("Iron Studies"),
    t("iron", "Serum Iron", "µg/dL", "50 - 170", { rangeBySex: { male: "65 - 175", female: "50 - 170" } }),
    t("tibc", "Total Iron Binding Capacity (TIBC)", "µg/dL", "250 - 450"),
    t("tsat", "Transferrin Saturation", "%", "20 - 50"),
    t("ferritin", "Serum Ferritin", "ng/mL", "13 - 400", { rangeBySex: { male: "30 - 400", female: "13 - 150" } }),
  ],
  style: sectionStyle,
  sample: { iron: "38", tibc: "472", tsat: "8", ferritin: "9" },
});

/* -------------------------------------------- Biochemistry tests (à la carte) */
// One template for single orders: only the tests with a result are printed.

export const biochemistry = panel({
  id: "biochemistry",
  name: "Biochemistry — single tests",
  specimen: "Serum",
  category: "Biochemistry",
  title: TITLE,
  onlyFilled: true,
  rows: [
    t("urea", "Blood Urea", "mg/dL", "15 - 45"),
    creatinine,
    uricAcid,
    t("calcium", "Serum Calcium", "mg/dL", "8.5 - 10.5"),
    t("cholTotal", "Serum Cholesterol (Total)", "mg/dL", "< 200"),
    t("tgl", "Serum Triglycerides", "mg/dL", "< 150"),
    t("bilTotal", "Serum Bilirubin (Total)", "mg/dL", "0 - 1.0"),
    t("sgpt", "SGPT (ALT)", "U/L", "5 - 40"),
    t("sgot", "SGOT (AST)", "U/L", "5 - 40"),
    t("amylase", "Serum Amylase", "U/L", "28 - 100"),
    t("lipase", "Serum Lipase", "U/L", "13 - 60"),
    t("protein", "Serum Total Protein", "g/dL", "6.6 - 8.7"),
  ],
  style: { rowGap: 10 },
  sample: { urea: "34", creatinine: "1.0", uricAcid: "8.1", sgpt: "56" },
});
