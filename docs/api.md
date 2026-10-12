# API reference — @mgpl-diagnostics/report-kit

All positions are inches on A4 (8.27 × 11.69 in); font sizes are pt.

## Main entry `@mgpl-diagnostics/report-kit` (browser + server)

### Building a report

```ts
buildReport(patient: Patient, tests: TestInput[], opts?: { endText?: string }): Report
buildProfileReport(patient: Patient, profile: ProfileId, results: Partial<Record<TemplateId, Results>>): Report

interface TestInput { template: TemplateId | ReportTemplate; results: Results }
type Results = Record<string, ResultValue | string[] | undefined>
type ResultValue = string | { value?: string; flag?: Flag; range?: string | string[]; unit?: string; method?: string }
type Flag = "auto" | "normal" | "high" | "low" | "abnormal"
```

`TEMPLATES` (keyed by `TemplateId`) and `PROFILES`:

| Category | Template ids |
|---|---|
| Hematology | `cbc` `hb` `esr` `blood-group` `mp` `bt-ct` `pt-inr` |
| Biochemistry | `blood-sugar` `hba1c` `lft` `rft` `kft` `electrolytes` `lipid` `iron-profile` `biochemistry` (à la carte) |
| Immunoassay | `thyroid` `vitamin-d` `vitamin-b12` `psa` |
| Serology | `dengue` `hiv-hbsag-vdrl` `widal` `typhidot` `malaria-antigen` `crp-aso` `ra-factor` |
| Clinical pathology | `urine` `upt` `stool` `semen` |

Profiles: `fever-profile`, `diabetes-profile`, `liver-kidney-profile`, `anemia-profile`,
`antenatal-profile`, `pre-operative-profile`, `full-body-checkup`.

Each `ReportTemplate` has `id`, `name`, `category`, `specimen`, `method`, `fields`
(`{ key, label, unit?, range? }[]`, useful for result-entry forms), `build(results, { patient })`
and `sample`. Templates marked "only filled rows" (blood sugar, thyroid, HIV/HBsAg/VDRL/HCV,
CRP/ASO, `biochemistry`) print just the tests you give results for.

### Types

```ts
interface Patient {
  title?: string; name: string; age: number | string; ageUnit?: string; sex: string;
  patientId?: string; refDoctor?: string; sampleCollectionDate?: Date | string;
  sampleId?: string; sampleType?: string; phone?: string; address?: string;
  collectedAt?: Date | string; registeredAt?: Date | string; reportedAt?: Date | string;
}
interface Report { patient: Patient; sections: Section[]; endText?: string; qrValue?: string }
type ReportVariant = "header" | "non-header"
type ReportDesign = "sidebar" | "classic"
interface Section { title; subtitle?; specimen?; method?; columns: Column[]; rows: Row[]; hideColumnHeader?; wide?; style?: SectionStyle; pageBreakBefore? }
type Row = HeadingRow | TestRow | CellsRow | TextRow
interface TestRow { kind: "test"; key?; name; abbr?; result?; unit?; range?: string | string[]; rangeBySex?: { male; female }; flag?; resultColor?; method? }
interface LabProfile {
  name; logoSrc; addressLines: string[]; email; phone;
  signatory: { name; designation; signatureHeaderSrc; signatureNonHeaderSrc };
  qcStampSrc?; icons: { emailSrc; phoneSrc };
  sidebarText?; footerLines?: string[]; verifyBaseUrl?;           // Navy Sidebar
  upiId?; gstin?; registrationNo?; invoiceTerms?: string[];       // invoices
}
```

### Components (pure, no hooks)

```tsx
<LabReport report variant design?="sidebar"|"classic" lab? fontBase? />
<SidebarReport report variant lab? includeStyles? fontBase? />
<ReportDocument report variant lab? includeStyles? fontBase? />   // classic
<SidebarLetterhead lab? includeStyles? fontBase? />               // blank stationery page
<SbLetterhead lab />                                              // letterhead layer only (used by invoice-kit)
```

`fontBase` is the URL folder of the `.woff` files (default `/report-fonts`). Image URLs come from
`lab` (default `/report-assets/...`). Copy both with `npx mgpl-report-assets public`.

### Helpers

| Export | Purpose |
|---|---|
| `MGPL_LAB` | default lab profile |
| `resolveFlag(row)` | `"normal" \| "high" \| "low" \| "abnormal"` from result vs range |
| `formatDate`, `formatDateTime`, `formatDoctor`, `fullName` | display formatting (DD-MM-YYYY) |
| `barcodeSvg(text, "code39" \| "code128")` | barcode SVG string (bwip-js) |
| `qrSvg(text)`, `reportQrValue(report, lab)` | QR SVG string; what a report's QR encodes |
| `sbLayoutPages(report)`, `layoutPages(report)` | page split for sidebar / classic |
| `sidebarCss(fontBase)`, `reportCss(fontBase)` | the stylesheets (injected automatically) |
| `SIDEBAR_LAYOUT`, `LAYOUT` | geometry constants |
| `SAMPLES`, `getSampleReport(id)` | demo reports (fictional patients) |

## `@mgpl-diagnostics/report-kit/pdf` (Node only)

```ts
renderReportPdf(opts: { report: Report; variant: ReportVariant; design?: ReportDesign; lab?: LabProfile;
                        publicDir?: string; fontDir?: string }): Promise<Buffer>
renderLetterheadPdf(opts?: { lab?; publicDir?; fontDir? }): Promise<Buffer>

// building blocks (used by invoice-kit)
SidebarReportPdf, ReportPdf, SidebarLetterheadPdf, SbLetterheadPdf
loadImage(src, publicDir): Promise<{ data: Buffer; format: "png" | "jpg" }>   // URL, data URI or /path; SVG → PNG
svgToPng(svg, width?)                                                         // resvg
registerFonts(fontDir)
assetsDir(), packageRoot()
```

`publicDir` defaults to the package's own `assets/` folder, so it works with no setup.

## `@mgpl-diagnostics/report-kit/server` (Node only)

```ts
renderReportHtml(opts: { report; variant; design?; lab?; inline?: boolean /* default true */; fontBase?; title? }): Promise<string>
renderLetterheadHtml(opts?: { lab?; inline?; fontBase? }): Promise<string>
inlineLab(lab?, dir?): LabProfile     // lab with every /report-assets path turned into a data URI
assetsDir(), packageRoot()
```

## CLI

`npx mgpl-report-assets [dest=public]` copies `report-assets/` and `report-fonts/` into `dest/`.
