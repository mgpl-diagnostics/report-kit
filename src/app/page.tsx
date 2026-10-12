import Link from "next/link";
import { LabReport, type ReportDesign, type ReportVariant } from "@/report-kit";
import { PrintButton } from "./PrintButton";
import { getSampleReport, SAMPLES, type Sample } from "./samples";

type Search = Promise<{ report?: string; variant?: string; design?: string }>;

const GROUPS: { key: Sample["group"]; label: string }[] = [
  { key: "design", label: "From the Word designs" },
  { key: "template", label: "More tests" },
  { key: "profile", label: "Profiles" },
];

export default async function PreviewPage({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const sample = SAMPLES.find((s) => s.id === q.report) ?? SAMPLES[0];
  const variant: ReportVariant = q.variant === "non-header" ? "non-header" : "header";
  const design: ReportDesign = q.design === "classic" ? "classic" : "sidebar";
  const report = getSampleReport(sample.id)!;
  const href = (o: { id?: string; v?: ReportVariant; d?: ReportDesign }) =>
    `/?report=${o.id ?? sample.id}&variant=${o.v ?? variant}&design=${o.d ?? design}`;
  const pdf = `/api/report-pdf?sample=${sample.id}&variant=${variant}&design=${design}`;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>MGPL Report Kit</h1>
        <p>
          <Link href="/letterhead">Letterhead stationery →</Link>
        </p>
        {GROUPS.map((g) => (
          <nav key={g.key} aria-label={g.label}>
            <h2>{g.label}</h2>
            {SAMPLES.filter((s) => s.group === g.key).map((s) => (
              <Link key={s.id} href={href({ id: s.id })} aria-current={s.id === sample.id ? "page" : undefined}>
                {s.label}
              </Link>
            ))}
          </nav>
        ))}
      </aside>

      <main className="main">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Design">
            <Link href={href({ d: "sidebar" })} aria-current={design === "sidebar"}>
              Navy Sidebar
            </Link>
            <Link href={href({ d: "classic" })} aria-current={design === "classic"}>
              Classic
            </Link>
          </div>
          <div className="seg" role="group" aria-label="Variant">
            <Link href={href({ v: "header" })} aria-current={variant === "header"}>
              Header
            </Link>
            <Link href={href({ v: "non-header" })} aria-current={variant === "non-header"}>
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
          <div className="meta">
            {sample.label} · {sample.source}
            {variant === "non-header" && design === "sidebar" && " · prints only the report, for paper with the letterhead pre-printed"}
          </div>
        </div>

        <div className="preview">
          <LabReport design={design} report={report} variant={variant} />
        </div>
      </main>
    </div>
  );
}
