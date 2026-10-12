import { buildReport, PROFILES, TEMPLATES, type Patient, type ProfileId, type Report, type TemplateId, type TestInput } from "@/report-kit";

/** Demo reports — results copied from the original Word designs in /Design; patient names are fictional. */
export interface Sample {
  id: string;
  /** "design" = replica of a Word file, "template" = new test, "profile" = bundle */
  group: "design" | "template" | "profile";
  label: string;
  /** Original design file(s) this reproduces */
  source: string;
  patient: Patient;
  tests: TestInput[];
}

const withSample = (id: keyof typeof TEMPLATES): TestInput => ({ template: id, results: TEMPLATES[id].sample });

const DESIGN_SAMPLES: Omit<Sample, "group">[] = [
  {
    id: "cbc",
    label: "CBC",
    source: "CBC.docx / CBC - Header.docx",
    patient: { title: "Mrs", name: "Kavita Sharma", age: 32, sex: "Female", patientId: "MGPL398", refDoctor: "Self", sampleCollectionDate: "12-10-2026" },
    tests: [withSample("cbc")],
  },
  {
    id: "hb",
    label: "Haemoglobin",
    source: "HB.docx / HB- Header .docx",
    patient: { title: "Mrs", name: "Meena Kumari", age: 43, sex: "Female", patientId: "MGPL246", refDoctor: "Self", sampleCollectionDate: "03-10-2026" },
    tests: [withSample("hb")],
  },
  {
    id: "hb-bsf",
    label: "HB + Blood Sugar",
    source: "HB,BSF,BSPP.docx",
    patient: { title: "Mr", name: "R K Mishra", age: 86, sex: "Male", patientId: "MGPL245", refDoctor: "Self", sampleCollectionDate: "22-06-2025" },
    tests: [
      { template: "hb", results: { hb: "10.1" } },
      { template: "blood-sugar", results: { bsf: "102.0" } },
    ],
  },
  {
    id: "blood-sugar",
    label: "Blood Sugar",
    source: "Blood Sugar - Header.docx / BSF.docx / BSPP.docx",
    patient: { title: "Mr", name: "S P Gupta", age: 73, sex: "Male", patientId: "MGPL250", refDoctor: "Self", sampleCollectionDate: "22-09-2026" },
    tests: [withSample("blood-sugar")],
  },
  {
    id: "blood-group",
    label: "Blood Group",
    source: "Blood Group.docx / BLOOD GROUP- Header.docx",
    patient: { title: "Master", name: "", age: 6, sex: "Male", patientId: "MGPL414", refDoctor: "Self", sampleCollectionDate: "19-05-2026" },
    tests: [withSample("blood-group")],
  },
  {
    id: "mp-widal",
    label: "MP + Widal",
    source: "MP,Widal.docx / MP WIDAL - Header.docx",
    patient: { title: "Mrs", name: "Kavita Sharma", age: 32, sex: "Female", patientId: "MGPL398", refDoctor: "Self", sampleCollectionDate: "12-10-2026" },
    tests: [withSample("mp"), withSample("widal")],
  },
  {
    id: "widal",
    label: "Widal",
    source: "widal.docx",
    patient: { title: "Master", name: "Rohan Yadav", age: 18, sex: "Male", patientId: "MGPL414", refDoctor: "Self", sampleCollectionDate: "18-09-2025" },
    tests: [withSample("widal")],
  },
  {
    id: "lft",
    label: "LFT",
    source: "LFt.docx / LFt - Header.docx",
    patient: { title: "Mr", name: "Anil Tiwari", age: 46, sex: "Male", patientId: "MGPL421", refDoctor: "P. Nair", sampleCollectionDate: "06-11-2025" },
    tests: [withSample("lft")],
  },
  {
    id: "lipid",
    label: "Lipid Profile",
    source: "Lipid Profile - Header .docx",
    patient: { title: "Mr", name: "Mohan Lal", age: 42, sex: "Male", patientId: "MGPL5552", refDoctor: "Self", sampleCollectionDate: "11-02-2026" },
    tests: [withSample("lipid")],
  },
  {
    id: "dengue",
    label: "Dengue",
    source: "DENGUE.docx / Dengue - Header.docx",
    patient: { title: "Master", name: "Aryan Patel", age: 9, sex: "Male", patientId: "MGPL149", refDoctor: "Self", sampleCollectionDate: "05-09-2024" },
    tests: [withSample("dengue")],
  },
  {
    id: "hiv-hbsag-vdrl",
    label: "HIV / HBsAg / VDRL",
    source: "HBSAG,VDRL.HIV.docx / HIV,HBaSG,VDRL - Header.docx",
    patient: { title: "Master", name: "Rohan Yadav", age: 18, sex: "Male", patientId: "MGPL414", refDoctor: "Self", sampleCollectionDate: "18-09-2025" },
    tests: [withSample("hiv-hbsag-vdrl")],
  },
  {
    id: "ra-factor",
    label: "RA Factor",
    source: "R A Factor.docx / RA Factor Header.docx",
    patient: { title: "Mr", name: "Vikas Rao", age: 31, sex: "Male", patientId: "MGPL420", refDoctor: "Self", sampleCollectionDate: "14-10-2025" },
    tests: [withSample("ra-factor")],
  },
  {
    id: "urine",
    label: "Urine (URM)",
    source: "URM.docx / URM - Header.docx / URM - Copy.docx",
    patient: { title: "Mr", name: "Deepak Singh", age: 26, sex: "Male", patientId: "MGPL246", refDoctor: "S. Mehta", sampleCollectionDate: "20-07-2026" },
    tests: [withSample("urine")],
  },
  {
    id: "upt",
    label: "Urine Pregnancy",
    source: "URM - Copy - Copy.docx",
    patient: { name: "Amit Joshi", age: 34, sex: "Male", patientId: "000761", refDoctor: "Self (M B B S)", sampleCollectionDate: "08-01-2025" },
    tests: [withSample("upt")],
  },
  {
    id: "stool",
    label: "Stool",
    source: "Stool.docx",
    patient: { title: "MR", name: "SURESH KUMAR", age: 53, sex: "Male", patientId: "LAB01", refDoctor: "R. KAPOOR (MBBS)", sampleCollectionDate: "12-01-2023" },
    tests: [withSample("stool")],
  },
  {
    id: "semen",
    label: "Semen Analysis",
    source: "Semen Analysis header.docx",
    patient: { title: "Mr", name: "RAJESH VERMA", age: 35, sex: "MALE", patientId: "MGPL5523", refDoctor: "Self", sampleCollectionDate: "18-09-2026" },
    tests: [withSample("semen")],
  },
];

// Templates added beyond the Word designs, shown with a demo patient
const DEMO_MALE: Patient = { title: "Mr", name: "Ramesh Kumar Verma", age: 45, sex: "Male", patientId: "MGPL1024", refDoctor: "A. K. Sharma", sampleCollectionDate: "12-10-2026" };
const DEMO_FEMALE: Patient = { title: "Mrs", name: "Sunita Devi Patel", age: 38, sex: "Female", patientId: "MGPL1025", refDoctor: "Self", sampleCollectionDate: "12-10-2026" };
const NEW_TEMPLATES: TemplateId[] = [
  "rft", "kft", "electrolytes", "hba1c", "iron-profile", "biochemistry", "thyroid", "vitamin-d", "vitamin-b12", "psa",
  "esr", "bt-ct", "pt-inr", "typhidot", "malaria-antigen", "crp-aso",
];
const FEMALE_FIRST = new Set<TemplateId>(["iron-profile", "thyroid", "vitamin-b12"]);

export const SAMPLES: Sample[] = [
  ...DESIGN_SAMPLES.map((s) => ({ ...s, group: "design" as const })),
  ...NEW_TEMPLATES.map((id) => ({
    id,
    group: "template" as const,
    label: TEMPLATES[id].name,
    source: "New template",
    patient: FEMALE_FIRST.has(id) ? DEMO_FEMALE : DEMO_MALE,
    tests: [withSample(id)],
  })),
  ...(Object.keys(PROFILES) as ProfileId[]).map((id) => ({
    id,
    group: "profile" as const,
    label: PROFILES[id].name,
    source: `Profile: ${PROFILES[id].tests.join(", ")}`,
    patient: id === "antenatal-profile" || id === "anemia-profile" ? DEMO_FEMALE : DEMO_MALE,
    tests: PROFILES[id].tests.map(withSample),
  })),
];

/** Demo sample metadata derived from the collection date (DD-MM-YYYY). */
function withSampleMeta(p: Patient): Patient {
  const date = typeof p.sampleCollectionDate === "string" ? p.sampleCollectionDate : "12-10-2026";
  const [d, m, y] = date.split("-");
  return {
    sampleId: `S${y?.slice(2)}${m}${d}${(p.patientId ?? "0").replace(/\D/g, "").padStart(4, "0")}`,
    collectedAt: `${date} 08:45 AM`,
    registeredAt: `${date} 09:02 AM`,
    reportedAt: `${date} 01:30 PM`,
    ...p,
  };
}

export function getSampleReport(id: string): Report | undefined {
  const s = SAMPLES.find((x) => x.id === id);
  return s && buildReport(withSampleMeta(s.patient), s.tests);
}
