// Server-side helpers (Node.js): render a report to a complete HTML document string.
// With `inline: true` every font and image is embedded as a data URI, so the HTML works anywhere
// (emails, file archives, backends without a static folder).
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { createElement } from "react";
import { MGPL_LAB } from "./lab";
import { LabReport } from "./LabReport";
import { assetsDir } from "./paths";
import { SidebarLetterhead } from "./sidebar/SidebarReport";
import type { LabProfile, Report, ReportDesign, ReportVariant } from "./types";

export { assetsDir, packageRoot } from "./paths";

const MIME: Record<string, string> = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff": "font/woff" };
const FONT_BASE = "__MGPL_FONTS__";

function dataUri(file: string): string {
  return `data:${MIME[extname(file).toLowerCase()] ?? "application/octet-stream"};base64,${readFileSync(file).toString("base64")}`;
}

/** Lab profile with every "/report-assets/…" path replaced by a data URI from the package assets. */
export function inlineLab(lab: LabProfile = MGPL_LAB, dir = assetsDir()): LabProfile {
  const conv = (src: string) => (src.startsWith("/") ? dataUri(join(dir, src)) : src);
  return {
    ...lab,
    logoSrc: conv(lab.logoSrc),
    qcStampSrc: lab.qcStampSrc && conv(lab.qcStampSrc),
    icons: { emailSrc: conv(lab.icons.emailSrc), phoneSrc: conv(lab.icons.phoneSrc) },
    signatory: {
      ...lab.signatory,
      signatureHeaderSrc: conv(lab.signatory.signatureHeaderSrc),
      signatureNonHeaderSrc: conv(lab.signatory.signatureNonHeaderSrc),
    },
  };
}

function inlineFonts(html: string, dir = assetsDir()): string {
  return html.replace(new RegExp(`${FONT_BASE}/([\\w.-]+\\.woff)`, "g"), (_, f: string) => dataUri(join(dir, "report-fonts", f)));
}

export interface RenderHtmlOptions {
  report: Report;
  variant: ReportVariant;
  design?: ReportDesign;
  lab?: LabProfile;
  /** Embed fonts and images (default true). When false, assets load from `fontBase` and the lab's URLs. */
  inline?: boolean;
  /** URL folder of report-fonts when inline is false (default "/report-fonts") */
  fontBase?: string;
  title?: string;
}

const wrap = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>` +
  `<style>html,body{margin:0;background:#e8eaee}body{padding:24px 0}@media print{body{padding:0;background:#fff}}</style></head><body>${body}</body></html>`;

/** Full HTML document for a report. */
export async function renderReportHtml(opts: RenderHtmlOptions): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const inline = opts.inline !== false;
  const lab = inline ? inlineLab(opts.lab) : opts.lab ?? MGPL_LAB;
  const body = renderToStaticMarkup(
    createElement(LabReport, { report: opts.report, variant: opts.variant, design: opts.design, lab, fontBase: inline ? FONT_BASE : opts.fontBase }),
  );
  const html = wrap(opts.title ?? `${opts.report.patient.name} - Lab Report`, body);
  return inline ? inlineFonts(html) : html;
}

/** Full HTML document of the blank Navy Sidebar letterhead. */
export async function renderLetterheadHtml(opts: { lab?: LabProfile; inline?: boolean; fontBase?: string } = {}): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const inline = opts.inline !== false;
  const lab = inline ? inlineLab(opts.lab) : opts.lab ?? MGPL_LAB;
  const body = renderToStaticMarkup(createElement(SidebarLetterhead, { lab, fontBase: inline ? FONT_BASE : opts.fontBase }));
  const html = wrap(`${lab.name} - Letterhead`, body);
  return inline ? inlineFonts(html) : html;
}
