import type { Patient, Report } from "../types";
import { biochemistry, bloodSugar, electrolytes, hba1c, ironProfile, kft, lft, lipid, rft } from "./biochemistry";
import { semen, stool, upt, urine } from "./clinicalPathology";
import { bloodGroup, btCt, cbc, esr, hb, mp, ptInr } from "./hematology";
import type { ReportTemplate, Results } from "./helpers";
import { psa, thyroid, vitaminB12, vitaminD } from "./immunoassay";
import { crpAso, dengue, hivHbsagVdrl, malariaAntigen, raFactor, typhidot, widal } from "./serology";

export * from "./helpers";

/** All templates, keyed by id. */
export const TEMPLATES = {
  // Hematology
  cbc,
  hb,
  esr,
  "blood-group": bloodGroup,
  mp,
  "bt-ct": btCt,
  "pt-inr": ptInr,
  // Biochemistry
  "blood-sugar": bloodSugar,
  hba1c,
  lft,
  rft,
  kft,
  electrolytes,
  lipid,
  "iron-profile": ironProfile,
  biochemistry,
  // Immunoassay
  thyroid,
  "vitamin-d": vitaminD,
  "vitamin-b12": vitaminB12,
  psa,
  // Serology
  dengue,
  "hiv-hbsag-vdrl": hivHbsagVdrl,
  widal,
  typhidot,
  "malaria-antigen": malariaAntigen,
  "crp-aso": crpAso,
  "ra-factor": raFactor,
  // Clinical pathology
  urine,
  upt,
  stool,
  semen,
} satisfies Record<string, ReportTemplate<any>>;

export type TemplateId = keyof typeof TEMPLATES;

/** Ready-made test bundles. */
export const PROFILES: Record<string, { name: string; tests: TemplateId[] }> = {
  "fever-profile": { name: "Fever Profile", tests: ["cbc", "mp", "widal", "dengue", "typhidot"] },
  "diabetes-profile": { name: "Diabetes Profile", tests: ["blood-sugar", "hba1c", "kft", "lipid", "urine"] },
  "liver-kidney-profile": { name: "Liver & Kidney Profile", tests: ["lft", "kft"] },
  "anemia-profile": { name: "Anaemia Profile", tests: ["cbc", "iron-profile", "vitamin-b12"] },
  "antenatal-profile": { name: "Antenatal (ANC) Profile", tests: ["cbc", "blood-group", "blood-sugar", "hiv-hbsag-vdrl", "thyroid", "urine"] },
  "pre-operative-profile": { name: "Pre-operative Profile", tests: ["cbc", "bt-ct", "pt-inr", "blood-group", "blood-sugar", "kft", "hiv-hbsag-vdrl"] },
  "full-body-checkup": {
    name: "Full Body Check-up",
    tests: ["cbc", "esr", "blood-sugar", "hba1c", "lft", "kft", "lipid", "thyroid", "vitamin-d", "vitamin-b12", "urine"],
  },
};

export type ProfileId = keyof typeof PROFILES;

export interface TestInput {
  template: TemplateId | ReportTemplate<any>;
  results: Results;
}

/**
 * Build a report from one or more tests.
 *
 *   buildReport(patient, [{ template: "hb", results: { hb: "10.1" } },
 *                         { template: "blood-sugar", results: { bsf: "102.0" } }])
 */
export function buildReport(patient: Patient, tests: TestInput[], opts: { endText?: string } = {}): Report {
  return {
    patient,
    endText: opts.endText,
    sections: tests.flatMap(({ template, results }) => {
      const tpl = typeof template === "string" ? TEMPLATES[template] : template;
      if (!tpl) throw new Error(`Unknown report template "${String(template)}"`);
      return tpl
        .build(results as never, { patient })
        .map((s) => ({ ...s, subtitle: s.subtitle ?? tpl.name, specimen: s.specimen ?? tpl.specimen, method: s.method ?? tpl.method }));
    }),
  };
}

/** Build a profile report. `results` is keyed by template id, e.g. { cbc: {...}, lft: {...} }. */
export function buildProfileReport(patient: Patient, profile: ProfileId, results: Partial<Record<TemplateId, Results>>): Report {
  const p = PROFILES[profile];
  if (!p) throw new Error(`Unknown profile "${profile}"`);
  return buildReport(
    patient,
    p.tests.map((id) => ({ template: id, results: results[id] ?? {} })),
  );
}
