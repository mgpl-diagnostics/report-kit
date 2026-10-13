# API reference: @mgpl-diagnostics/report-kit (v2)

Backend only (Node.js ≥ 20). Positions are inches on A4 (8.27 × 11.69 in); font sizes are pt.
Browsers use [`@mgpl-diagnostics/client`](https://github.com/mgpl-diagnostics/client).

Entry points:

| Import | Contents |
|---|---|
| `@mgpl-diagnostics/report-kit` | everything below except the Fastify plugin |
| `@mgpl-diagnostics/report-kit/fastify` | `mgplFastify` plugin (needs `fastify` ≥ 4 installed) |
| `@mgpl-diagnostics/report-kit/assets/*` | `report-assets/*` images, `report-fonts/*.woff` |

## HTTP API

```ts
createReportApi(opts?: ApiOptions): (req: Request) => Promise<Response>

interface ApiOptions {
  basePath?: string;      // default "/api/mgpl"
  lab?: LabProfile;       // default defaultLab(): MGPL_LAB + MGPL_SIGNATURE_* env files
  samples?: boolean;      // expose GET /samples and { sample } requests (default false)
  cors?: string;          // Access-Control-Allow-Origin, e.g. "https://app.example.com" or "*"
  maxBodyBytes?: number;  // default 1_000_000
  publicUrl?: string;     // public URL of the API behind a proxy (used for asset links in HTML)
}
```

| Route | Notes |
|---|---|
| `GET /health` | `{ ok: true, service: "report-kit" }` |
| `GET /templates` | `TemplateCatalog`: `{ templates: TemplateInfo[], profiles }` |
| `GET /samples` | `SampleInfo[]` (only with `samples: true`, else 404) |
| `POST /report` | body `ReportRequest` → `application/pdf` (default) or `text/html` (`format: "html"`) |
| `GET /letterhead?format=pdf\|html&download=1` | blank stationery |
| `GET /assets/report-assets/<file>` · `/assets/report-fonts/<file>` | immutable, cacheable. HTML output links here. |
| `OPTIONS *` | 204 with CORS headers when `cors` is set |

Errors: JSON `{ error }` with 400 (validation), 404, 405, 413, 500.

```ts
interface ReportRequest {
  patient?: Patient;
  tests?: { template: TemplateId; results: Results }[];
  profile?: { id: ProfileId; results: Partial<Record<TemplateId, Results>> };
  report?: Report;          // an already built report
  sample?: string;          // demo id (samples: true)
  variant?: "header" | "non-header";   // default "header"
  design?: "sidebar" | "classic";      // default "sidebar"
  format?: "pdf" | "html";             // default "pdf"
  fileName?: string; download?: boolean;
}
```

### Mounting

```ts
// Next.js route handler: app/api/mgpl/[...path]/route.ts
const api = createReportApi({ basePath: "/api/mgpl" });
export { api as GET, api as POST, api as OPTIONS };  export const runtime = "nodejs";

// Fastify
import { mgplFastify } from "@mgpl-diagnostics/report-kit/fastify";
await app.register(mgplFastify, { prefix: "/api/mgpl", cors: "*" });   // + any ApiOptions, or { handler }

// Express / Koa / node:http (mount before body parsers)
app.use("/api/mgpl", toNodeHandler(createReportApi()));

// Hono / Bun / Deno
app.all("/api/mgpl/*", (c) => api(c.req.raw));
```

Building blocks, for composing your own routes: `templateCatalog()`, `reportFromRequest(body, opts)`,
`labWithAssetUrls(lab, base)`, `serveAsset(path, cors?)`, `apiBaseUrl(req, opts)`, `json()`,
`pdfResponse()`, `htmlResponse()`, `readJson()`, `withCors()`, `HttpError`.

## Building reports

```ts
buildReport(patient: Patient, tests: TestInput[], opts?: { endText?: string }): Report
buildProfileReport(patient, profileId, results: Partial<Record<TemplateId, Results>>): Report

type Results = Record<string, ResultValue | string[] | undefined>
type ResultValue = string | { value?: string; flag?: Flag; range?: string | string[]; unit?: string; method?: string }
type Flag = "auto" | "normal" | "high" | "low" | "abnormal"
```

`TEMPLATES` (by id) and `PROFILES`:

| Category | Template ids |
|---|---|
| Hematology | `cbc` `hb` `esr` `blood-group` `mp` `bt-ct` `pt-inr` |
| Biochemistry | `blood-sugar` `hba1c` `lft` `rft` `kft` `electrolytes` `lipid` `iron-profile` `biochemistry` |
| Immunoassay | `thyroid` `vitamin-d` `vitamin-b12` `psa` |
| Serology | `dengue` `hiv-hbsag-vdrl` `widal` `typhidot` `malaria-antigen` `crp-aso` `ra-factor` |
| Clinical Pathology | `urine` `upt` `stool` `semen` |

Profiles: `fever-profile` `diabetes-profile` `liver-kidney-profile` `anemia-profile` `antenatal-profile`
`pre-operative-profile` `full-body-checkup`.

A `ReportTemplate` has `id`, `name`, `category`, `specimen`, `method`, `fields`, `build(results, { patient })`, `sample`.
"Only filled rows" templates (`blood-sugar`, `thyroid`, `hiv-hbsag-vdrl`, `crp-aso`, `biochemistry`)
print just the tests that have results.

## Rendering

```ts
renderReportPdf({ report, variant, design?, lab?, publicDir?, fontDir? }): Promise<Buffer>
renderLetterheadPdf({ lab?, publicDir?, fontDir? }?): Promise<Buffer>
renderReportHtml({ report, variant, design?, lab?, inline? = true, fontBase?, title? }): Promise<string>
renderLetterheadHtml({ lab?, inline?, fontBase? }?): Promise<string>
inlineLab(lab?, dir?): LabProfile   // /report-assets/* → data URIs
```

React documents (rendered on the server): `LabReport`, `SidebarReport`, `ReportDocument` (classic),
`SidebarLetterhead`, `SbLetterhead`; react-pdf: `SidebarReportPdf`, `ReportPdf`, `SidebarLetterheadPdf`, `SbLetterheadPdf`.
Helpers: `loadImage`, `svgToPng`, `registerFonts`, `assetsDir()`, `packageRoot()`.

## Lab profile and signatures

```ts
interface LabProfile {
  name; logoSrc; addressLines: string[]; email; phone;
  signatory: { name; designation; signatureHeaderSrc; signatureNonHeaderSrc };
  qcStampSrc?; icons: { emailSrc; phoneSrc };
  sidebarText?; footerLines?: string[]; verifyBaseUrl?;
  upiId?; gstin?; registrationNo?; invoiceTerms?: string[];   // used by invoice-kit
}

MGPL_LAB                      // the lab's branding, with a placeholder signature
defaultLab()                  // MGPL_LAB + real signatures from the environment
labFromEnv(lab?, env?)        // reads MGPL_SIGNATURE_FILE / _HEADER_FILE / _NONHEADER_FILE
withSignatureFiles(lab, { header?, nonHeader? })
imageFileToDataUri(path)
```

## Other exports

`resolveFlag(row)`, `formatDate`, `formatDateTime`, `formatDoctor`, `fullName`, `barcodeSvg(text, "code39" | "code128")`,
`qrSvg(text)`, `reportQrValue(report, lab)`, `sbLayoutPages`, `layoutPages`, `SIDEBAR_LAYOUT`, `LAYOUT`,
`sidebarCss`, `reportCss`, `SAMPLES`, `getSampleReport(id)`, and all types (`Patient`, `Report`, `Section`, `Row`, …).

## CLI

`npx mgpl-report-assets [dest=public]` copies `report-assets/` and `report-fonts/` into a static folder,
for apps that render the React documents themselves instead of using the API's `/assets` route.
