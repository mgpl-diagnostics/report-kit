// Provenance of imported results (tests performed by a partner lab), shared by both designs and both
// renderers: the per-test line, how it wraps, and which partner signatory a page prints.
import type { ReportTestProvenance, ReportTestSignatory, Section } from "../shared/types";

const SEP = " · ";

const who = (s: ReportTestSignatory) => [s.name, s.qualification].filter(Boolean).join(", ") + (s.registration ? ` (${s.registration})` : "");

/**
 * "Performed at Clinova Pathlabs, Secunderabad · NABL accredited laboratory (Certificate No. MC-3860) ·
 * Reported by Dr A, MD (Reg. 123)". `text` wins when given. Whitespace is collapsed to single spaces.
 */
export function provenanceText(p: ReportTestProvenance): string {
  const parts = p.text?.trim()
    ? [p.text.trim()]
    : [
        `Performed at ${p.performedBy}${p.performedAt ? `, ${p.performedAt}` : ""}`,
        p.accreditationText?.trim() ?? "",
        p.reportedBy?.length ? `Reported by ${p.reportedBy.map(who).join("; ")}` : "",
      ].filter(Boolean);
  return parts.join(SEP).replace(/\s+/g, " ");
}

/**
 * The line wrapped to at most `maxChars` characters per line (words are never split). Pagination and
 * both renderers use the same lines, so the page breaks stay computed, not measured. `npm run smoke`
 * measures every line with the real font.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ").filter(Boolean)) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export const provenanceLines = (s: Section, maxChars: number): string[] => (s.provenance ? wrapText(provenanceText(s.provenance), maxChars) : []);

export interface PagePartner {
  provenance: ReportTestProvenance;
  signatory: ReportTestSignatory;
}

/**
 * The partner signatory a page prints: only when every test on the page comes from the same partner
 * document (`provenance.sourceId`), and then the first medical signatory all of them share.
 * Pages that mix sources (or include our own tests) print the per-test lines only.
 */
export function pagePartner(sections: Section[]): PagePartner | null {
  if (!sections.length) return null;
  const first = sections[0]!.provenance;
  if (!first?.sourceId) return null;
  if (!sections.every((s) => s.provenance?.sourceId === first.sourceId)) return null;
  const key = (x: ReportTestSignatory) => `${x.name}|${x.registration ?? ""}`;
  const common = (first.reportedBy ?? []).filter((r) => sections.every((s) => (s.provenance!.reportedBy ?? []).some((x) => key(x) === key(r))));
  const signatory = common[0];
  return signatory ? { provenance: first, signatory } : null;
}

/** The three short lines under a partner signature: name; qualification / title; registration · lab. */
export function partnerLines(p: PagePartner): [string, string, string] {
  const s = p.signatory;
  return [
    s.name,
    [s.qualification, s.title].filter(Boolean).join(", "),
    [s.registration, p.provenance.performedBy].filter(Boolean).join(SEP),
  ];
}
