import Link from "next/link";
import { ReportDocument, type ReportVariant } from "@/report-kit";
import { PrintButton } from "./PrintButton";
import { getSampleReport, SAMPLES } from "./samples";

type Search = Promise<{ report?: string; variant?: string }>;

export default async function PreviewPage({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const sample = SAMPLES.find((s) => s.id === q.report) ?? SAMPLES[0];
  const variant: ReportVariant = q.variant === "non-header" ? "non-header" : "header";
  const report = getSampleReport(sample.id)!;
  const href = (id: string, v: ReportVariant) => `/?report=${id}&variant=${v}`;
  const pdf = `/api/report-pdf?sample=${sample.id}&variant=${variant}`;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>MGPL Report Kit</h1>
        <p>Replica of the Word designs in /Design</p>
        <nav>
          {SAMPLES.map((s) => (
            <Link key={s.id} href={href(s.id, variant)} aria-current={s.id === sample.id ? "page" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Variant">
            <Link href={href(sample.id, "header")} aria-current={variant === "header"}>
              Header
            </Link>
            <Link href={href(sample.id, "non-header")} aria-current={variant === "non-header"}>
              Non-header
            </Link>
          </div>
          <span className="spacer" />
          <PrintButton />
          <a className="btn secondary" href={pdf} target="_blank" rel="noreferrer">
            Open PDF
          </a>
          <a className="btn" href={`${pdf}&download=1`}>
            Download PDF
          </a>
          <div className="meta">Design source: {sample.source}</div>
        </div>

        <div className="preview">
          <ReportDocument report={report} variant={variant} />
        </div>
      </main>
    </div>
  );
}
