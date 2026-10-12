import type { NextRequest } from "next/server";
import { renderLetterheadPdf } from "@/report-kit/pdf";

export const runtime = "nodejs";

/** GET /api/letterhead-pdf[?download=1] — blank Navy Sidebar letterhead for pre-printing paper */
export async function GET(req: NextRequest) {
  const pdf = await renderLetterheadPdf();
  const download = req.nextUrl.searchParams.get("download") === "1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="mgpl-letterhead.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
