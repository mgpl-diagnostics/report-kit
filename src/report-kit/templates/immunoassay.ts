import { COLS_LIPID, h, panel, t } from "./helpers";

const TITLE = "IMMUNOASSAY";
const style = { fontSize: 10, headingSize: 11, rowGap: 9, headingGap: 12, abnormalBold: false };

/* ------------------------------------------------------------------- Thyroid */
// Only filled rows print, so the same template covers T3/T4/TSH, TSH alone, or FT3/FT4.

export const thyroid = panel({
  id: "thyroid",
  name: "Thyroid Profile (T3 / T4 / TSH)",
  category: "Immunoassay",
  title: TITLE,
  onlyFilled: true,
  rows: [
    h("Thyroid Function Test"),
    t("t3", "Total T3 (Triiodothyronine)", "ng/mL", "0.8 - 2.0"),
    t("t4", "Total T4 (Thyroxine)", "µg/dL", "5.1 - 14.1"),
    t("ft3", "Free T3", "pg/mL", "2.0 - 4.4"),
    t("ft4", "Free T4", "ng/dL", "0.93 - 1.7"),
    t("tsh", "TSH (Thyroid Stimulating Hormone)", "µIU/mL", "0.27 - 4.2"),
  ],
  style,
  sample: { t3: "1.12", t4: "8.6", tsh: "6.85" },
});

/* ------------------------------------------------------------------ Vitamins */

export const vitaminD = panel({
  id: "vitamin-d",
  name: "Vitamin D (25-OH)",
  category: "Immunoassay",
  title: TITLE,
  columns: COLS_LIPID,
  rows: [t("vitD", "25-Hydroxy Vitamin D", "ng/mL", ["< 20 : Deficient", "20 - 29 : Insufficient", "30 - 100 : Sufficient", "> 100 : Toxicity"])],
  style: { ...style, rangeSize: 8, rowGap: 12 },
  sample: { vitD: { value: "14.2", flag: "low" } },
});

export const vitaminB12 = panel({
  id: "vitamin-b12",
  name: "Vitamin B12",
  category: "Immunoassay",
  title: TITLE,
  rows: [t("b12", "Vitamin B12 (Cyanocobalamin)", "pg/mL", "211 - 911")],
  style,
  sample: { b12: "184" },
});

/* ----------------------------------------------------------------------- PSA */

export const psa = panel({
  id: "psa",
  name: "PSA (Prostate Specific Antigen)",
  category: "Immunoassay",
  title: TITLE,
  rows: [t("psa", "PSA - Total", "ng/mL", "0 - 4.0")],
  style,
  sample: { psa: "1.6" },
});
