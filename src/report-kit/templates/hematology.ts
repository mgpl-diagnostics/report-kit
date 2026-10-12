import type { Row } from "../types";
import { COLS_CBC, COLS_STD, COLS_TWO, fieldsOf, fillRows, h, panel, t, type ReportTemplate } from "./helpers";

/* ----------------------------------------------------------------------- CBC */

const cbcRows: Row[] = [
  h("COMPLETE BLOOD COUNT", 10),
  t("hb", "Haemoglobin", "g/dL", "12.0 - 15.0", { abbr: "(HB)", rangeBySex: { male: "13.0 - 17.0", female: "12.0 - 15.0" } }),
  t("rbc", "Erythrocyte Count", "Mil/cum", "3.8 - 4.8", { abbr: "(RBC Count)", rangeBySex: { male: "4.5 - 5.5", female: "3.8 - 4.8" } }),
  t("pcv", "PCV-Packed Cell Volume", "%", "36 - 46", { abbr: "(Haematocrit, HCT)", rangeBySex: { male: "40 - 50", female: "36 - 46" } }),
  t("plt", "Platelet Count", "Lakh/Cum", "1.50 - 4.10", { abbr: "(PLT)" }),
  h("Erythrocyte Indices", 10),
  t("mcv", "Mean Corpuscular Volume", "FL", "83 - 101", { abbr: "(MCV)" }),
  t("mch", "Mean Corpuscular Haemoglobin", "pg", "27 - 32", { abbr: "(MCH)" }),
  t("mchc", "Mean Corpuscular Haemoglobin Concentration", "g/dl", "31.5 - 34.5", { abbr: "(MCHC)" }),
  t("rdw", "Red blood cell Distribution Width", "%", "11.6 - 16.0", { abbr: "(RDW-CV)" }),
  h("Total Leukocyte & Differential Count", 10),
  t("wbc", "Total Leucocyte Count", "Cells/Cumm", "4000 - 10000", { abbr: "(WBC)" }),
  t("neutrophils", "Neutrophils", "%", "40 - 80"),
  t("lymphocytes", "Lymphocytes", "%", "20 - 40"),
  t("eosinophils", "Eosinophils", "%", "01 - 06"),
  t("monocytes", "Monocytes", "%", "02 - 10"),
  t("basophils", "Basophils", "%", "<1 - 2"),
  t("esr", "Erythrocyte Sedimentation Rate", "Mm/Hour", "<20", { abbr: "(ESR)" }),
  h("Platelet Indices", 10),
  t("pdw", "Platelet Distribution Width", "%", "9.0 – 17.0", { abbr: "(PDW)" }),
  t("mpv", "Mean Platelet Volume", "%", "06.5 – 12.0", { abbr: "(MPV)" }),
  t("pct", "Plateletcrit", "%", "0.108 – 0.282", { abbr: "(PCT)" }),
];

export const cbc: ReportTemplate = {
  id: "cbc",
  name: "Complete Blood Count (CBC)",
  fields: fieldsOf(cbcRows),
  build: (r, ctx) => [
    {
      title: "HEMATOLOGY",
      wide: true,
      columns: COLS_CBC,
      rows: fillRows(cbcRows, r, false, ctx),
      style: {
        titleSize: 14,
        fontSize: 9,
        headingSize: 10,
        rowGap: 6,
        indent: 0.08,
        resultColor: "#00B0F0",
        unitBold: true,
      },
    },
  ],
  sample: {
    hb: "10.8", rbc: "4.23", pcv: "36.6", plt: "2.45", mcv: "82.03", mch: "28.24", mchc: "77.8",
    rdw: "12.7", wbc: "6700", neutrophils: "66", lymphocytes: "32", eosinophils: "01", monocytes: "01",
    basophils: "00", esr: "32", pdw: "15.0", mpv: "9.1", pct: "0.279",
  },
};

/* ------------------------------------------------------------------------ HB */

const hbRows: Row[] = [t("hb", "Haemoglobin", "gram/dl", "12 - 15", { rangeBySex: { male: "13 - 17", female: "12 - 15" } })];

export const hb: ReportTemplate = {
  id: "hb",
  name: "Haemoglobin (HB)",
  fields: fieldsOf(hbRows),
  build: (r, ctx) => [
    { title: "HEMATOLOGY", columns: COLS_STD, rows: fillRows(hbRows, r, false, ctx), style: { titleSize: 14, abnormalBold: false } },
  ],
  sample: { hb: "9.5" },
};

/* --------------------------------------------------------------- Blood group */

const bloodGroupRows: Row[] = [t("bloodGroup", "Blood Group")];

export const bloodGroup: ReportTemplate = {
  id: "blood-group",
  name: "Blood Group",
  fields: fieldsOf(bloodGroupRows),
  build: (r) => [
    { title: "HEMATOLOGY", columns: COLS_TWO, rows: fillRows(bloodGroupRows, r), style: { titleSize: 14, nameBold: true, resultBold: true } },
  ],
  sample: { bloodGroup: "O +ve (O Positive)" },
};

/* ------------------------------------------------------------------------ MP */

const mpRows: Row[] = [t("mp", "Mp By Card")];

export const mp: ReportTemplate = {
  id: "mp",
  name: "Malaria Parasite (MP) by Card",
  fields: fieldsOf(mpRows),
  build: (r) => [
    { title: "HEMATOLOGY", columns: COLS_TWO, rows: fillRows(mpRows, r), style: { titleSize: 14, nameBold: true, resultBold: true } },
  ],
  sample: { mp: "Negative" },
};

/* ----------------------------------------------------------------------- ESR */

export const esr = panel({
  id: "esr",
  name: "ESR (Westergren)",
  category: "Hematology",
  title: "HEMATOLOGY",
  rows: [t("esr", "Erythrocyte Sedimentation Rate (ESR)", "mm/1st hr", "0 - 20", { rangeBySex: { male: "0 - 15", female: "0 - 20" } })],
  style: { titleSize: 14 },
  sample: { esr: "38" },
});

/* --------------------------------------------------------------------- BT/CT */

export const btCt = panel({
  id: "bt-ct",
  name: "Bleeding Time / Clotting Time",
  category: "Hematology",
  title: "HEMATOLOGY",
  rows: [
    h("Coagulation"),
    t("bt", "Bleeding Time (BT)", "min", "1 - 5"),
    t("ct", "Clotting Time (CT)", "min", "4 - 10"),
  ],
  style: { titleSize: 14, rowGap: 10 },
  sample: { bt: "2.30", ct: "5.15" },
});

/* -------------------------------------------------------------------- PT/INR */

export const ptInr = panel({
  id: "pt-inr",
  name: "Prothrombin Time (PT / INR)",
  category: "Hematology",
  title: "HEMATOLOGY",
  rows: [
    h("Coagulation Profile"),
    t("ptTest", "Prothrombin Time (Test)", "sec", "11 - 13.5"),
    t("ptControl", "Prothrombin Time (Control)", "sec", "-"),
    t("inr", "INR", "Ratio", "0.8 - 1.2"),
  ],
  style: { titleSize: 14, rowGap: 10 },
  sample: { ptTest: "14.8", ptControl: "12.5", inr: "1.18" },
});
