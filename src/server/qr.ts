import QRCode from "qrcode";
import { fullName, formatDate } from "./format";
import type { LabProfile, Report } from "../shared/types";

/** QR code as an SVG string (encoded by the `qrcode` library; synchronous, works in browser and Node). */
export function qrSvg(text: string, color = "#000"): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  // one rectangle per horizontal run of dark modules keeps the SVG small
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; ) {
      if (!qr.modules.get(y, x)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < n && qr.modules.get(y, x + run)) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path fill="${color}" d="${d}"/></svg>`;
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
