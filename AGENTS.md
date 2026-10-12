# AGENTS.md — @mgpl-diagnostics/report-kit

Instructions for AI coding agents (and humans) working on this repo. Read this before you change anything.

## What this is

A TypeScript library that renders A4 pathology reports for MGPL Diagnostics in **two renderers that
must look identical**:

1. **HTML**: React components (`src/ReportDocument.tsx`, `src/sidebar/SidebarReport.tsx`)
2. **PDF**: react-pdf documents (`src/pdf/ReportPdf.tsx`, `src/sidebar/SidebarReportPdf.tsx`), pure Node.js, no browser

There are two designs (`sidebar` = Navy Sidebar, the default; `classic` = replica of the lab's old Word
files) and two variants (`header` prints the letterhead; `non-header` omits it for pre-printed paper,
**same positions for everything else**).

## Map

```
src/
  index.ts              browser-safe entry (components, templates, types, samples)
  types.ts              Patient, Report, Section, Row (heading | test | cells | text), LabProfile
  lab.ts                MGPL_LAB — all lab branding + asset URLs
  templates/            31 test templates + PROFILES + buildReport/buildProfileReport
    helpers.ts          t()/h() row builders, fillRows, panel(), column presets
  format.ts             dates, doctor name, resolveFlag (H/L from numeric ranges)
  barcode.ts qr.ts      bwip-js Code 39/128 SVG, qrcode SVG (sync, isomorphic)
  samples.ts            demo reports (fictional names) used by preview/smoke/examples
  # classic design
  layout.ts measure.ts styles.ts ReportDocument.tsx pdf/ReportPdf.tsx
  # Navy Sidebar design
  sidebar/layout.ts     geometry (inches/pt) — single source of truth
  sidebar/measure.ts    row heights + page splitting (sbLayoutPages)
  sidebar/model.ts      display logic shared by both renderers
  sidebar/styles.ts     CSS for the HTML renderer (generated from layout.ts)
  sidebar/SidebarReport.tsx / SidebarReportPdf.tsx
  LabReport.tsx         <LabReport design=…> switch
  pdf/index.ts          Node: renderReportPdf, renderLetterheadPdf (+ assets.ts: fonts, SVG→PNG)
  server.ts             Node: renderReportHtml (self-contained, data-URI fonts/images)
  paths.ts              Node: finds the package's assets/ folder at runtime
assets/report-assets/   logo.svg, icons, qc-stamp.svg, signatures (shipped in the package)
assets/report-fonts/    *.woff (Carlito, Archivo Black, Barlow SC, Manrope) — same files for HTML + PDF
scripts/                sync-assets.mjs, smoke-test.tsx, generate-examples.tsx
dist/                   built output — COMMITTED (consumers install from git/GitHub Packages)
```

## Commands

```bash
npm run typecheck   # must pass
npm run build       # tsup → dist/. Re-run and commit dist/ after any src change
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
4. **Browser entry stays browser-safe.** Nothing reachable from `src/index.ts` may import `node:*`,
   `@resvg/resvg-js` or `react-dom/server`. Node-only code goes in `src/pdf/`, `src/server.ts` or `src/paths.ts`.
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
- Only `.woff`/`.ttf` fonts; they are registered in `src/pdf/assets.ts`.

## How to…

**Add a test template**: add it in the right `templates/*.ts` with `panel({...})` (standard
Test/Result/Unit/Range) or a custom `build()`. Give it `specimen`, `sample` results and (if
needed) `rangeBySex`. Register it in `templates/index.ts` → `TEMPLATES`. Then run `npm run smoke`.
The fit check will tell you if a name/unit/range is too wide for a column.

**Change the Navy Sidebar layout**: edit `sidebar/layout.ts`. If row content changes, update
`sidebar/measure.ts`. Run smoke and `npm run examples` and look at the PDFs (render them to PNG to inspect).

**Change branding**: edit `src/lab.ts` and/or replace files in `assets/report-assets/`.

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

## Privacy

Never commit real patient data. The lab's original Word files (with real patients) live outside
this repo on purpose. `samples.ts` uses fictional names.
