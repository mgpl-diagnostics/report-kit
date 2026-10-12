// Server-side (Node.js) PDF export — no browser involved.
// Import from "@/report-kit/pdf" only in route handlers / server actions / scripts.
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { barcodeSvg } from "../barcode";
import { MGPL_LAB } from "../lab";
import { qrSvg, reportQrValue } from "../qr";
import { SidebarLetterheadPdf, SidebarReportPdf } from "../sidebar/SidebarReportPdf";
import type { LabProfile, Report, ReportDesign, ReportVariant } from "../types";
import { loadImage, registerFonts, svgToPng } from "./assets";
import { ReportPdf } from "./ReportPdf";

export { ReportPdf } from "./ReportPdf";
export { SidebarLetterheadPdf, SidebarReportPdf } from "../sidebar/SidebarReportPdf";
export { loadImage, registerFonts, svgToPng } from "./assets";

export interface RenderPdfOptions {
  report: Report;
  variant: ReportVariant;
  /** "sidebar" (Navy Sidebar, default) or "classic" (replica of the Word designs) */
  design?: ReportDesign;
  lab?: LabProfile;
  /** Folder that "/report-assets/…" image paths resolve against. Default: <cwd>/public */
  publicDir?: string;
  /** Folder with the report .woff fonts. Default: <publicDir>/report-fonts */
  fontDir?: string;
}

const render = (el: ReactElement) => renderToBuffer(el as Parameters<typeof renderToBuffer>[0]);

function setup(opts: { lab?: LabProfile; publicDir?: string; fontDir?: string }) {
  const lab = opts.lab ?? MGPL_LAB;
  const publicDir = opts.publicDir ?? join(process.cwd(), "public");
  registerFonts(opts.fontDir ?? join(publicDir, "report-fonts"));
  return { lab, publicDir };
}

/** Renders a report to an A4 PDF (Buffer) in pure Node.js. */
export async function renderReportPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const { lab, publicDir } = setup(opts);
  const header = opts.variant === "header";
  const [logo, email, phone, qc, signature] = await Promise.all([
    loadImage(lab.logoSrc, publicDir),
    loadImage(lab.icons.emailSrc, publicDir),
    loadImage(lab.icons.phoneSrc, publicDir),
    lab.qcStampSrc ? loadImage(lab.qcStampSrc, publicDir) : undefined,
    loadImage(header ? lab.signatory.signatureHeaderSrc : lab.signatory.signatureNonHeaderSrc, publicDir),
  ]);
  const id = opts.report.patient.patientId;
  const bar = id ? barcodeSvg(id) : null;
  const barcode = bar ? svgToPng(bar) : undefined;

  if ((opts.design ?? "sidebar") === "classic") {
    const images = { logo, email, phone, qc, signature, barcode };
    return render(createElement(ReportPdf, { report: opts.report, variant: opts.variant, lab, images }));
  }
  const qr = svgToPng(qrSvg(reportQrValue(opts.report, lab)), 800);
  const images = { logo, email, phone, qc, signature, barcode, qr };
  return render(createElement(SidebarReportPdf, { report: opts.report, variant: opts.variant, lab, images }));
}

/** Blank A4 letterhead (Navy Sidebar: sidebar + header + footer) for printing pre-printed paper. */
export async function renderLetterheadPdf(opts: { lab?: LabProfile; publicDir?: string; fontDir?: string } = {}): Promise<Buffer> {
  const { lab, publicDir } = setup(opts);
  const [logo, email, phone] = await Promise.all([
    loadImage(lab.logoSrc, publicDir),
    loadImage(lab.icons.emailSrc, publicDir),
    loadImage(lab.icons.phoneSrc, publicDir),
  ]);
  return render(createElement(SidebarLetterheadPdf, { lab, images: { logo, email, phone } }));
}
