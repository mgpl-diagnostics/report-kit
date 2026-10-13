# AGENTS.md — @mgpl-diagnostics/report-kit

Instructions for AI coding agents (and humans) working on this repo. Read this before you change anything.

## What this is

The **backend** library (Node.js ≥ 20) that renders A4 pathology reports for MGPL Diagnostics. It has
**two renderers that must look identical**:

1. **HTML**: React components (`src/server/ReportDocument.tsx`, `src/server/sidebar/SidebarReport.tsx`)
2. **PDF**: react-pdf documents (`src/server/pdf/ReportPdf.tsx`, `src/server/sidebar/SidebarReportPdf.tsx`), pure Node.js

They are exposed over HTTP by `createReportApi()`, a standard `(Request) => Response` handler, with
adapters for Fastify (`/fastify` entry) and Express/node:http (`toNodeHandler`).

There are two designs (`sidebar` = Navy Sidebar, the default; `classic` = replica of the lab's old Word
files) and two variants (`header` prints the letterhead; `non-header` omits it for pre-printed paper,
**same positions for everything else**).

**There is no browser code here.** Frontends use `@mgpl-diagnostics/client`, a separate zero-dependency
repo. Do not add browser entry points, hooks or CSS-in-app UI to this package.

## Map

```
src/shared/            types.ts (data model) + api.ts (HTTP contract) — no runtime logic
src/server/index.ts    the package entry ("@mgpl-diagnostics/report-kit")
src/server/fastify.ts  the "/fastify" entry (Fastify plugin; fastify is an optional peer)
src/server/
  api.ts               createReportApi: routes, validation, CORS, asset serving, errors
  node.ts              toNodeHandler for Express / node:http
  signatures.ts        real signatures from MGPL_SIGNATURE_* env files (never committed); defaultLab()
  lab.ts               MGPL_LAB branding (placeholder signature)
  templates/           31 test templates + PROFILES + buildReport/buildProfileReport
  format.ts barcode.ts qr.ts samples.ts paths.ts html.ts
  layout.ts measure.ts styles.ts ReportDocument.tsx pdf/      classic design + PDF pipeline
  sidebar/             Navy Sidebar: layout.ts (geometry), measure.ts (pagination), model.ts, styles.ts, renderers
assets/report-assets/  logo.svg, icons, qc-stamp.svg, signature-placeholder.svg, icon licence
assets/report-fonts/   *.woff + LICENSES/ (OFL) — the same files for HTML and PDF
scripts/               sync-assets.mjs, smoke-test.tsx, generate-examples.tsx
dist/                  build output — git-ignored; built by `prepare` and in CI
```

## Commands

```bash
npm run typecheck   # must pass
npm run build       # tsup → dist/ (git-ignored; also runs on install via "prepare")
npm run smoke       # REQUIRED before committing layout/template/renderer changes (~4 min)
npm run examples    # HTML + PDF for every sample → examples/ (git-ignored); look at them
npm run assets      # only when fonts/icons/stamp change
```

## Invariants: do not break these

1. **HTML and PDF must match.** Every position comes from `layout.ts` / `sidebar/layout.ts`, and every
   row height from `measure.ts` / `sidebar/measure.ts`. Never hard-code a size in one renderer only.
   If you add a visual element, add it to *both* renderers and to the layout constants.
2. **Pagination is computed, not measured.** `layoutPages` / `sbLayoutPages` decide page breaks from
   the row-height model. Both renderers set explicit heights from it. If you change a row's content,
   update its height function.
3. **Non-header = header minus letterhead.** Only the letterhead layer (sidebar, header, footer, and
   for classic the logo/address/rule) is conditional. Body, signature, page number: identical positions.
4. **Backend only, but the HTTP contract is shared.** Request/response shapes live in
   `src/shared/api.ts` and are mirrored in `@mgpl-diagnostics/client`; report-studio's
   `contract-check.ts` fails the build if they drift. Change both together.
5. **Components are pure** (no hooks, no `"use client"`), so they work in React Server Components and
   `renderToStaticMarkup`.

## react-pdf gotchas (each one has bitten this project)

- **Text that doesn't fit its box is silently dropped or truncated with "…".** It is not shown as
  overflow like in HTML. Size columns from measured text widths (the smoke test measures every
  string with fontkit) and give fixed-height rows `lineHeight: 1`.
- **A Text after another Text in a flex row can get zero width.** Give rows/cells explicit widths.
- **Missing glyph = crash** (e.g. a non-breaking space U+00A0 or `≥` crashed it). The smoke test
  checks that every printed character exists in the font. Write `>=`, not `≥`. There is no `₹` in
  Manrope, so money uses `Rs.`
- **No SVG images.** SVGs are rasterised with resvg (`svgToPng`) before going into `<Image>`.
- **Leading spaces in a `<Text>` are trimmed.** Put spaces at the end of the previous run.
- Only `.woff`/`.ttf` fonts; they are registered in `src/server/pdf/assets.ts`.

## How to…

**Add a test template**: add it in the right `src/server/templates/*.ts` with `panel({...})` (standard
Test/Result/Unit/Range) or a custom `build()`. Give it `specimen`, `sample` results and (if
needed) `rangeBySex`. Register it in `src/server/templates/index.ts` → `TEMPLATES`, and give it a `category`. Then run `npm run smoke`.
The fit check will tell you if a name/unit/range is too wide for a column.

**Change the Navy Sidebar layout**: edit `src/server/sidebar/layout.ts`. If row content changes, update
`src/server/sidebar/measure.ts`. Run smoke and `npm run examples` and look at the PDFs (render them to PNG to inspect).

**Change branding**: edit `src/server/lab.ts` and/or replace files in `assets/report-assets/`.
The contact email lives only there; update it in one place.

**Signatures**: never commit a real signature image. The package ships `signature-placeholder.svg`;
servers set `MGPL_SIGNATURE_FILE` (or `_HEADER_` / `_NONHEADER_`) to a private file, and `defaultLab()`
loads it as a data URI.

**Add an API route**: add it in `src/server/api.ts` (and `ROUTES` in `src/shared/api.ts`), mirror the
types and method in the client repo, and extend invoice-kit's `scripts/api-test.ts`.

**Reference ranges**: the classic templates copy the lab's Word files. Ranges of the newer tests are
standard adult values awaiting the pathologist's sign-off. Don't invent new medical ranges silently;
call them out.

## Testing standard

`npm run smoke` renders 39 samples × 2 designs × 2 variants as HTML **and** PDF, plus the letterhead,
and fails on any of these:
- page-count mismatch;
- a value missing from the HTML **or from the PDF text** (extracted with pdf.js);
- text not fitting its column;
- a missing glyph;
- a missing asset.

Keep it green. When you fix a rendering bug, add a check that would have caught it.

## Privacy and licence

Never commit real patient data or real signatures. The lab's original Word files and the signature
images live outside every repo on purpose. `samples.ts` uses fictional names. The code is "All rights
reserved" (see LICENSE). Bundled fonts and icons keep their own licences (THIRD_PARTY_NOTICES.md).
