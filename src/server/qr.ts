import QRCode from "qrcode";
import { fullName, formatDate } from "./format";
import type { LabProfile, Report } from "../shared/types";

export interface QrOptions {
  /** Error correction: "M" (default) recovers ~15% damage, "H" ~30% (use it when a logo covers the centre). */
  ecc?: "L" | "M" | "Q" | "H";
  /**
   * Leave a blank square in the centre for a logo, as a fraction of the code's width (0 to 0.3).
   * Rounded to whole modules, odd so it stays centred. Needs `ecc: "H"`; the logo is drawn on top by
   * the caller, inside `qrHoleBox(hole)` of the code's box.
   */
  hole?: number;
}

/** Largest centre hole: about 9% of the area, well inside what level H corrects. */
export const QR_MAX_HOLE = 0.3;

/** QR code as an SVG string (encoded by the `qrcode` library; synchronous, works in browser and Node). */
export function qrSvg(text: string, color = "#000", opts: QrOptions = {}): string {
  const hole = Math.min(QR_MAX_HOLE, Math.max(0, opts.hole ?? 0));
  if (hole > 0 && opts.ecc !== "H") throw new Error("qrSvg: a centre hole needs ecc \"H\"");
  const qr = QRCode.create(text, { errorCorrectionLevel: opts.ecc ?? "M" });
  const n = qr.modules.size;
  let k = Math.round(n * hole);
  if (k > 0 && k % 2 !== n % 2) k += 1;
  const h0 = (n - k) / 2;
  const inHole = (x: number, y: number) => k > 0 && x >= h0 && x < h0 + k && y >= h0 && y < h0 + k;
  // one rectangle per horizontal run of dark modules keeps the SVG small
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; ) {
      if (!qr.modules.get(y, x) || inHole(x, y)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < n && qr.modules.get(y, x + run) && !inHole(x + run, y)) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path fill="${color}" d="${d}"/></svg>`;
}

/**
 * Where the logo goes on a QR drawn with `hole`: offset and size as fractions of the code's width, a
 * little inside the blank square so the logo never touches a module. Both renderers use this.
 */
export function qrHoleBox(hole: number): { offset: number; size: number } {
  const size = Math.min(QR_MAX_HOLE, Math.max(0, hole)) * 0.8;
  return { offset: (1 - size) / 2, size };
}

/** What the report's QR code encodes: a verify URL when the lab has one, else a text summary. */
export function reportQrValue(report: Report, lab: LabProfile): string {
  if (report.qrValue) return report.qrValue;
  const p = report.patient;
  const id = p.sampleId ?? p.patientId;
  if (lab.verifyBaseUrl && id) return `${lab.verifyBaseUrl}${encodeURIComponent(id)}`;
  return [
    lab.name,
    `Patient: ${fullName(p)}`,
    `Age/Sex: ${p.age} / ${p.sex}`,
    p.patientId && `Patient ID: ${p.patientId}`,
    p.sampleId && `Sample ID: ${p.sampleId}`,
    `Date: ${formatDate(p.sampleCollectionDate)}`,
    `Tests: ${[...new Set(report.sections.map((s) => s.subtitle ?? s.title))].join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}
