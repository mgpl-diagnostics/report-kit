import type { Row, SectionStyle } from "../types";
import { COLS_RA, COLS_SEROLOGY, COLS_STD, COLS_WIDAL, fieldsOf, fillRows, h, panel, t, titre, type ReportTemplate, type Results } from "./helpers";

const RAPID = "(Performed on Jmitra Rapid test.)";
const NR = "Non- Reactive";

const rapidStyle: SectionStyle = {
  font: "Arial, Helvetica, sans-serif",
  fontSize: 12,
  nameBold: true,
  resultBold: true,
  resultSize: 13,
  resultColor: "#00B0F0",
  headingSize: 10,
  headingGap: 12,
  methodSize: 12,
  methodGap: 9,
};

/* -------------------------------------------------------------------- Dengue */

const dengueRows: Row[] = [
  h("Dengue Rapid Screening"),
  t("igg", "Dengue IgG", undefined, NR, { method: RAPID }),
  t("igm", "Dengue IgM", undefined, NR, { method: RAPID }),
  t("ns1", "Dengue NS1 Rapid", undefined, NR, { method: RAPID }),
];

export const dengue: ReportTemplate = {
  id: "dengue",
  name: "Dengue (IgG / IgM / NS1)",
  specimen: "Serum",
  method: "Rapid Card Test",
  fields: fieldsOf(dengueRows),
  build: (r) => [
    { title: "IMMUNOLOGY/ SEROLOGY", columns: COLS_SEROLOGY, rows: fillRows(dengueRows, r), style: { ...rapidStyle, rowGap: 24 } },
  ],
  sample: { igg: "Non - Reactive", igm: "Non - Reactive", ns1: "Non - Reactive" },
};

/* --------------------------------------------------------- HIV / HBsAg / VDRL */
// Only the tests that have a result are printed.

const viralRows: Row[] = [
  t("hiv", "HIV 1&2", undefined, NR, { method: "(Performed on HIV Tridot Jmitra Make card test.)" }),
  t("hbsag", "HBsAg", undefined, NR, { method: RAPID }),
  t("vdrl", "VDRL", undefined, NR, { method: RAPID }),
  t("hcv", "HCV (Hepatitis C)", undefined, NR, { method: "(Performed on Rapid card test.)" }),
];

export const hivHbsagVdrl: ReportTemplate = {
  id: "hiv-hbsag-vdrl",
  name: "HIV / HBsAg / VDRL",
  specimen: "Serum",
  fields: fieldsOf(viralRows),
  build: (r) => [
    {
      title: "IMMUNOLOGY/ SEROLOGY",
      columns: COLS_SEROLOGY,
      rows: fillRows(viralRows, r, true),
      style: { ...rapidStyle, methodSize: 11, methodGap: 9, rowGap: 14 },
    },
  ],
  sample: { hiv: "Non - Reactive", hbsag: "Non - Reactive" },
};

/* --------------------------------------------------------------------- Widal */

type Titres = [string, string, string, string, string];
export interface WidalResults extends Results {
  typhiO?: Titres;
  typhiH?: Titres;
  paraAH?: Titres;
  paraBH?: Titres;
  /** e.g. "Reactive" / "Non-Reactive" */
  impression?: string;
  note?: string;
}

const antigens: [keyof WidalResults, string, string][] = [
  ["typhiO", "Typhi", "‘O’"],
  ["typhiH", "Typhi", "‘H’"],
  ["paraAH", "Para-Typhi", "‘AH’"],
  ["paraBH", "Para-Typhi", "‘BH’"],
];

export const widal: ReportTemplate<WidalResults> = {
  id: "widal",
  name: "Widal Test",
  specimen: "Serum",
  fields: [
    ...antigens.map(([key, a, b]) => ({ key: key as string, label: `${a} ${b} (1:40 … 1:640)` })),
    { key: "impression", label: "Impression" },
  ],
  build: (r) => {
    const rows: Row[] = antigens.map(([key, a, b]) => {
      const v = (r[key] as Titres | undefined) ?? ["-ve", "-ve", "-ve", "-ve", "-ve"];
      return { kind: "cells", cells: [{ text: a, bold: true }, { text: b, bold: true }, ...v.map(titre)] };
    });
    const impression = r.impression ?? "Non-Reactive";
    const reactive = /^reactive/i.test(impression.trim());
    rows.push(
      {
        kind: "text",
        indent: 0.14,
        spaceBefore: 26,
        content: [
          { text: "IMPRESSION – ", bold: true },
          { text: impression, bold: true, color: reactive ? "#FF0000" : undefined },
        ],
      },
      {
        kind: "text",
        indent: 0.14,
        spaceBefore: 4,
        content: [{ text: "Note: ", bold: true }, { text: r.note ?? "A diagnostic titre of 1:80 suggests positive reaction." }],
      },
    );
    return [{ title: "SEROLOGY", columns: COLS_WIDAL, rows, style: { rowGap: 11 } }];
  },
  sample: {
    typhiO: ["+ve", "+ve", "+ve", "-ve", "-ve"],
    typhiH: ["+ve", "+ve", "+ve", "-ve", "-ve"],
    paraAH: ["-ve", "-ve", "-ve", "-ve", "-ve"],
    paraBH: ["-ve", "-ve", "-ve", "-ve", "-ve"],
    impression: "Reactive",
  },
};

/* ----------------------------------------------------------------- RA factor */

const raRows: Row[] = [t("ra", "RA Factor", undefined, "Negative")];

export const raFactor: ReportTemplate = {
  id: "ra-factor",
  name: "RA Factor",
  specimen: "Serum",
  fields: fieldsOf(raRows),
  build: (r) => [
    {
      title: "RA FACTOR",
      columns: COLS_RA,
      rows: fillRows(raRows, r),
      style: { titleSpacing: 1.5, nameBold: true, resultBold: true, rangeBold: true },
    },
  ],
  sample: { ra: "Negative" },
};

/* ------------------------------------------------------------------ Typhidot */

export const typhidot = panel({
  id: "typhidot",
  name: "Typhidot (IgM / IgG)",
  specimen: "Serum",
  method: "Rapid Card Test",
  category: "Serology",
  title: "IMMUNOLOGY/ SEROLOGY",
  columns: COLS_SEROLOGY,
  rows: [
    h("Salmonella Typhi Antibody"),
    t("igm", "Typhidot IgM", undefined, "Negative", { method: "(Performed on Rapid card test.)" }),
    t("igg", "Typhidot IgG", undefined, "Negative", { method: "(Performed on Rapid card test.)" }),
  ],
  style: { ...rapidStyle, rowGap: 18 },
  sample: { igm: { value: "Positive", flag: "abnormal" }, igg: "Negative" },
});

/* ----------------------------------------------------------- Malaria antigen */

export const malariaAntigen = panel({
  id: "malaria-antigen",
  name: "Malaria Antigen (Pf / Pv)",
  specimen: "Whole Blood (EDTA)",
  method: "Rapid Card Test",
  category: "Serology",
  title: "IMMUNOLOGY/ SEROLOGY",
  columns: COLS_SEROLOGY,
  rows: [
    h("Malaria Antigen (Rapid Card)"),
    t("pf", "Plasmodium falciparum (Pf)", undefined, "Negative"),
    t("pv", "Plasmodium vivax (Pv)", undefined, "Negative"),
  ],
  style: { ...rapidStyle, rowGap: 14 },
  sample: { pf: "Negative", pv: "Negative" },
});

/* ---------------------------------------------------------------- CRP / ASO */

export const crpAso = panel({
  id: "crp-aso",
  name: "CRP / ASO (quantitative)",
  specimen: "Serum",
  category: "Serology",
  title: "IMMUNOLOGY/ SEROLOGY",
  columns: COLS_STD,
  onlyFilled: true,
  rows: [
    t("crp", "C-Reactive Protein (CRP)", "mg/L", "< 6"),
    t("aso", "Anti Streptolysin O (ASO)", "IU/mL", "< 200"),
  ],
  style: { rowGap: 10 },
  sample: { crp: "18.4", aso: "120" },
});
