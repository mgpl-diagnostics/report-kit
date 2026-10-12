// Server-side (Node.js) PDF export — no browser involved.
// Import from "@/report-kit/pdf" only in route handlers / server actions / scripts.
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { MGPL_LAB } from "../lab";
import type { LabProfile, Report, ReportVariant } from "../types";
import { barcodeSvg } from "../barcode";
import { loadImage, registerFonts, svgToPng } from "./assets";
import { ReportPdf } from "./ReportPdf";

export { ReportPdf } from "./ReportPdf";
export { loadImage, registerFonts, svgToPng } from "./assets";

export interface RenderPdfOptions {
  report: Report;
  variant: ReportVariant;
  lab?: LabProfile;
  /** Folder that "/report-assets/…" image paths resolve against. Default: <cwd>/public */
  publicDir?: string;
  /** Folder with the report .woff fonts. Default: <publicDir>/report-fonts */
  fontDir?: string;
}

/** Renders a report to an A4 PDF (Buffer) in pure Node.js. */
export async function renderReportPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const lab = opts.lab ?? MGPL_LAB;
  const publicDir = opts.publicDir ?? join(process.cwd(), "public");
  registerFonts(opts.fontDir ?? join(publicDir, "report-fonts"));

  const header = opts.variant === "header";
  const [logo, email, phone, qc, signature] = await Promise.all([
    loadImage(lab.logoSrc, publicDir),
    loadImage(lab.icons.emailSrc, publicDir),
    loadImage(lab.icons.phoneSrc, publicDir),
    lab.qcStampSrc ? loadImage(lab.qcStampSrc, publicDir) : undefined,
    loadImage(header ? lab.signatory.signatureHeaderSrc : lab.signatory.signatureNonHeaderSrc, publicDir),
  ]);

  const id = opts.report.patient.patientId;
  const barcode = id ? barcodeSvg(id) : null;
  const images = { logo, email, phone, qc, signature, barcode: barcode ? svgToPng(barcode) : undefined };

  const doc = createElement(ReportPdf, { report: opts.report, variant: opts.variant, lab, images });
  // ReportPdf renders a <Document>; the cast bridges react-pdf's narrow element type.
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
