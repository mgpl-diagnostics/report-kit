import type { NextRequest } from "next/server";
import type { Report, ReportDesign, ReportVariant } from "@/report-kit";
import { renderReportPdf } from "@/report-kit/pdf";
import { getSampleReport } from "../../samples";

export const runtime = "nodejs";

const variantOf = (v: unknown): ReportVariant => (v === "non-header" ? "non-header" : "header");
const designOf = (d: unknown): ReportDesign => (d === "classic" ? "classic" : "sidebar");

function pdfResponse(pdf: Buffer, fileName: string, download: boolean) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName.replace(/[^\w.-]+/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** GET /api/report-pdf?sample=cbc&variant=header&design=sidebar[&download=1] — demo reports */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const id = q.get("sample") ?? "cbc";
  const report = getSampleReport(id);
  if (!report) return new Response(`Unknown sample "${id}"`, { status: 404 });
  const variant = variantOf(q.get("variant"));
  const design = designOf(q.get("design"));
  const pdf = await renderReportPdf({ report, variant, design });
  return pdfResponse(pdf, `${id}-${design}-${variant}.pdf`, q.get("download") === "1");
}

/** POST /api/report-pdf  body: { report: Report, variant?: "header" | "non-header", design?: "sidebar" | "classic", fileName?: string } */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { report?: Report; variant?: ReportVariant; design?: ReportDesign; fileName?: string };
  if (!body.report?.patient || !Array.isArray(body.report.sections)) {
    return new Response("Body must be { report: { patient, sections }, variant }", { status: 400 });
  }
  const variant = variantOf(body.variant);
  const pdf = await renderReportPdf({ report: body.report, variant, design: designOf(body.design) });
  return pdfResponse(pdf, body.fileName ?? `report-${variant}.pdf`, true);
}
