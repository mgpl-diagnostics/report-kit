# @mgpl-diagnostics/report-kit

A4 pathology lab reports for **MGPL Diagnostics (Maa Gayatri Path Lab)**:
- React components for the HTML preview;
- a **pure Node.js PDF** export (no browser, no Word);
- self-contained HTML strings for backends.

| | |
|---|---|
| **Designs** | `sidebar` (Navy Sidebar, default) and `classic` (replica of the original Word reports) |
| **Variants** | `header` prints the letterhead. `non-header` leaves it blank, for paper with the letterhead pre-printed. |
| **Templates** | 31 tests (CBC, LFT, KFT, lipid, thyroid, HbA1c, Widal, dengue, urine …) + 7 profiles |
| **Extras** | auto H/L flags, sex-specific ranges, multi-page with *Page X of Y*, Code 39 barcode, QR code |
| **Runs in** | Next.js (server or client components), any React app, plain Node.js backends |

Patient invoices live in the sister package [`@mgpl-diagnostics/invoice-kit`](https://github.com/mgpl-diagnostics/invoice-kit).

---

## Install

The package is private to the `mgpl-diagnostics` GitHub org. There are two ways to install it.

**A. From GitHub Packages** (recommended for apps):

```ini
# .npmrc in your project
@mgpl-diagnostics:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # a token with read:packages
```

```bash
npm i @mgpl-diagnostics/report-kit react react-dom
```

**B. Straight from the repo** (the built `dist/` is committed, so nothing is compiled on install):

```bash
npm i github:mgpl-diagnostics/report-kit#v1.0.0 react react-dom
```

Requires Node ≥ 20 and React ≥ 18.

## Quick start

```ts
import { buildReport } from "@mgpl-diagnostics/report-kit";

const report = buildReport(
  { title: "Mrs", name: "Kavita Sharma", age: 32, sex: "Female",
    patientId: "MGPL1025", sampleId: "S2610120398", refDoctor: "Self",
    sampleCollectionDate: new Date(), reportedAt: new Date() },
  [
    { template: "cbc", results: { hb: "10.8", rbc: "4.23", wbc: "6700", plt: "2.45" } },
    { template: "kft", results: { urea: "28", creatinine: "0.9", sodium: "138" } },
  ],
);
```

### Next.js / React (HTML preview)

```tsx
import { LabReport } from "@mgpl-diagnostics/report-kit";

export default function Page() {
  return <LabReport report={report} variant="header" />;   // design="classic" for the Word look
}
```

The components are pure (no hooks), so they render in Server Components. They load fonts and images
from `/report-fonts` and `/report-assets`, so copy those into `public/` once:

```jsonc
// package.json of the app
"scripts": { "postinstall": "mgpl-report-assets public" }
```

Add this to `next.config.ts`:

```ts
serverExternalPackages: ["@react-pdf/renderer", "@resvg/resvg-js"]
```

### PDF (Node.js — route handler, server action, Express, worker…)

```ts
import { renderReportPdf, renderLetterheadPdf } from "@mgpl-diagnostics/report-kit/pdf";

const pdf: Buffer = await renderReportPdf({ report, variant: "header" });       // A4
const blankLetterhead: Buffer = await renderLetterheadPdf();
```

Next.js route handler:

```ts
export const runtime = "nodejs";
export async function POST(req: Request) {
  const { report, variant } = await req.json();
  const pdf = await renderReportPdf({ report, variant });
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
}
```

### Self-contained HTML (backend, email, archive)

```ts
import { renderReportHtml } from "@mgpl-diagnostics/report-kit/server";
const html = await renderReportHtml({ report, variant: "header" });  // fonts + images inlined
```

## Entry points

| Import | Environment | Contents |
|---|---|---|
| `@mgpl-diagnostics/report-kit` | browser + server | components, templates, `buildReport`, types, samples, layout constants |
| `@mgpl-diagnostics/report-kit/pdf` | Node only | `renderReportPdf`, `renderLetterheadPdf`, react-pdf documents, asset helpers |
| `@mgpl-diagnostics/report-kit/server` | Node only | `renderReportHtml`, `renderLetterheadHtml`, `inlineLab`, `assetsDir` |
| `@mgpl-diagnostics/report-kit/assets/*` | files | `report-assets/*` (logo, icons, stamp, signatures), `report-fonts/*.woff` |

The full API is in [docs/api.md](docs/api.md).

## Results and templates

```ts
import { TEMPLATES, PROFILES, buildProfileReport } from "@mgpl-diagnostics/report-kit";

TEMPLATES.lft.fields;   // [{ key: "bilTotal", label: "Bilirubin Total", unit: "Mg/dL", range: "0 – 1.0" }, …]
buildProfileReport(patient, "full-body-checkup", { cbc: {...}, lft: {...}, kft: {...} });
```

A result can be given in either of these forms:
- a plain string, e.g. `"10.8"`;
- an object, e.g. `{ value, flag?, range?, unit?, method? }`.

Numeric results are flagged **H/L** against the range automatically. Use `flag: "abnormal"` for text results such as "Positive". Ranges switch to the patient's sex where a template defines `rangeBySex`.

## Branding

Everything lab-specific is in [`src/lab.ts`](src/lab.ts) (`MGPL_LAB`):
- name, address, phone and email;
- signatory and signature images;
- sidebar text and footer lines;
- QR verify URL (`verifyBaseUrl`);
- invoice fields (`upiId`, `gstin`, `invoiceTerms`).

To change an image, replace the file in `assets/report-assets/` or pass your own `lab` object. SVG and PNG both work.

## Printing

| What | How |
|---|---|
| Letterhead stationery | `renderLetterheadPdf()`. Print **Borderless**, Actual size: the sidebar runs to the paper edge. |
| Report on plain paper | `variant: "header"`, Actual size |
| Report on pre-printed paper | `variant: "non-header"`, Actual size, paper guide snug |

## Development

This repo is developed inside a local workspace together with `invoice-kit` and `report-studio`
(the Next.js preview app). The scripts below also work on their own.

```bash
npm install
npm run assets     # fonts (Fontsource) + icons (Tabler) + QC stamp → assets/
npm run build      # tsup → dist/ (commit dist/ — it is what consumers install)
npm run typecheck
npm run smoke      # renders everything and checks it (≈4 min)
npm run examples   # HTML + PDF for every sample → examples/index.html
```

See [AGENTS.md](AGENTS.md) for the architecture, rules and gotchas. It is useful for both humans and AI agents.

## Release

1. Bump `version` in `package.json`, `npm run build`, commit (including `dist/`).
2. `git tag vX.Y.Z && git push --tags`. The GitHub Action publishes to GitHub Packages.
