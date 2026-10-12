import Link from "next/link";
import { SidebarLetterhead } from "@/report-kit";
import { PrintButton } from "../PrintButton";

export const metadata = { title: "Letterhead — MGPL Report Kit" };

/** Blank Navy Sidebar letterhead: print this on plain A4 to make pre-printed report paper. */
export default function LetterheadPage() {
  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn secondary" href="/">
          ← Reports
        </Link>
        <span className="spacer" />
        <PrintButton />
        <a className="btn secondary" href="/api/letterhead-pdf" target="_blank" rel="noreferrer">
          Open PDF
        </a>
        <a className="btn" href="/api/letterhead-pdf?download=1">
          Download PDF
        </a>
        <div className="meta">Sidebar + header + footer only. Reports printed with the “Non-header” variant fit inside it.</div>
      </div>
      <div className="preview">
        <SidebarLetterhead />
      </div>
    </main>
  );
}
