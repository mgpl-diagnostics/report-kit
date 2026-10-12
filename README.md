# MGPL Report Kit

A4 lab reports for **Maa Gayatri Path Lab** as React components (HTML preview) plus a pure Node.js
PDF export. No browser and no Word are needed at runtime.

- **Two designs.**
  - `sidebar` (Navy Sidebar, the default)
  - `classic` (replica of the original Word files)
- **Two variants.**
  - `header` prints the full letterhead.
  - `non-header` prints only the report, positioned for paper that already has the letterhead printed on it.
- **Letterhead stationery.** A blank A4 page with only the sidebar, header and footer. Print it to make the pre-printed paper.
- **31 test templates and 7 profiles**, with automatic H/L flags, sex-specific ranges and multi-page reports.
- **Scannable codes.** The Code 39 barcode comes from bwip-js; the QR code comes from the `qrcode` library.

## Run

```bash
npm install
npm run assets      # copy fonts (Fontsource) + icons (Tabler) into /public, build the QC stamp
npm run dev         # http://localhost:3000  — preview, design/variant switch, PDF download
```

| Script | What it does |
|---|---|
| `npm run dev` | Preview app: `/` reports, `/letterhead` stationery, `/designs/index.html` design options |
| `npm run examples` | Writes HTML + PDF for every sample (both designs, both variants) and the letterhead to `examples/` |
| `npm run smoke` | Renders everything and checks page counts, values, text fit, glyph coverage and assets |
| `npm run typecheck` | `tsc --noEmit` |

## Use it in another Next.js app

1. Copy the following into the other app:
   - `src/report-kit/`
   - `public/report-assets/`
   - `public/report-fonts/`
2. Install the dependencies:
   `npm i @react-pdf/renderer @resvg/resvg-js bwip-js qrcode`
3. Add this to `next.config.ts`:
   `serverExternalPackages: ["@react-pdf/renderer", "@resvg/resvg-js"]`

```tsx
// Preview (Server or Client Component)
import { buildReport, LabReport } from "@/report-kit";

const report = buildReport(
  { title: "Mrs", name: "Kavita Sharma", age: 32, sex: "Female", patientId: "MGPL1025",
    refDoctor: "Self", sampleId: "S2610120398", sampleCollectionDate: new Date(),
    registeredAt: new Date(), reportedAt: new Date() },
  [
    { template: "cbc", results: { hb: "10.8", rbc: "4.23", wbc: "6700" /* … */ } },
    { template: "kft", results: { urea: "28", creatinine: "0.9" } },
  ],
);

<LabReport report={report} variant="header" />            // Navy Sidebar
<LabReport report={report} variant="non-header" />        // for pre-printed paper
<LabReport report={report} variant="header" design="classic" />
```

```ts
// PDF (route handler / server action — Node runtime)
import { renderReportPdf, renderLetterheadPdf } from "@/report-kit/pdf";

const pdf = await renderReportPdf({ report, variant: "header" });  // Buffer, A4
const stationery = await renderLetterheadPdf();
```

The demo API is `POST /api/report-pdf` with `{ report, variant, design }`. It returns the PDF.

### Results

`buildReport(patient, tests)` takes one or more `{ template, results }` entries. Each template's `fields`
lists the result keys it accepts, which you can use to build an entry form:

```ts
import { TEMPLATES, PROFILES, buildProfileReport } from "@/report-kit";
TEMPLATES.lft.fields;      // [{ key: "bilTotal", label: "Bilirubin Total", unit: "Mg/dL", range: "0 – 1.0" }, …]
buildProfileReport(patient, "full-body-checkup", { cbc: {...}, lft: {...}, kft: {...} });
```

A result can be given in either of these forms:
- a plain string, e.g. `"10.8"`;
- an object, e.g. `{ value: "Positive", flag: "abnormal" }` or `{ value: "5.2", range: "4 - 6" }`.

Numeric results are flagged H/L automatically against the reference range.

## Change the branding

Everything lab-specific is in `src/report-kit/lab.ts`:
- name, address, phone and email;
- signatory;
- sidebar text and footer lines;
- QR verify URL (`verifyBaseUrl`).

Images are plain URLs in `/public/report-assets`; SVG and PNG both work. Layout positions are in
`src/report-kit/sidebar/layout.ts` (Navy Sidebar) and `src/report-kit/layout.ts` (classic). The HTML
and PDF renderers share these files and the row-height model in `measure.ts`, so they break pages in
exactly the same places.

## Notes

- The classic design's reference ranges come from the original Word files.
- Ranges on the added tests (RFT, KFT, thyroid, vitamins, coagulation…) are standard adult values. Have the pathologist confirm them before use.
- Until `verifyBaseUrl` is set, the QR code encodes a plain-text summary (lab, patient, IDs, date, tests).
- `Design/` holds the original Word files. It is not in git, because those files contain real patient data.
