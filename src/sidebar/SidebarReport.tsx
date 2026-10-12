import type { ReactNode } from "react";
import { barcodeSvg } from "../barcode";
import { MGPL_LAB } from "../lab";
import { qrSvg, reportQrValue } from "../qr";
import type { Align, LabProfile, Report, ReportVariant, Rich, Row, Section, TestRow } from "../types";
import { SB_CELL_PAD, SB_COLS } from "./layout";
import { isGrid, sbLayoutPages, sbRowHeight, showsTableHeader, subtitleOf, type SbPart } from "./measure";
import { flagOf, gridColumns, isTwoColumn, LEGAL, LEGEND, patientFields, sectionMeta, STD_COLUMNS, TWO_COL_RESULT_W } from "./model";
import { sidebarCss } from "./styles";

export interface SidebarReportProps {
  report: Report;
  /** "header" prints the letterhead (sidebar, header, footer); "non-header" leaves it to the pre-printed paper. */
  variant: ReportVariant;
  lab?: LabProfile;
  includeStyles?: boolean;
  /** URL folder with the font files from /public/report-fonts */
  fontBase?: string;
}

const pt = (n: number) => `${n}pt`;
const inch = (n: number) => `${n}in`;
const al = (a: Align = "left") => (a === "left" ? "l" : a === "right" ? "r" : "c");
const Svg = ({ className, svg }: { className: string; svg: string }) => <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;

/** Navy Sidebar report (HTML). Pure component — Server/Client Components and renderToStaticMarkup. */
export function SidebarReport({ report, variant, lab = MGPL_LAB, includeStyles = true, fontBase }: SidebarReportProps) {
  const pages = sbLayoutPages(report);
  const bar = report.patient.patientId ? barcodeSvg(report.patient.patientId) : null;
  const qr = qrSvg(reportQrValue(report, lab));
  const signature = variant === "header" ? lab.signatory.signatureHeaderSrc : lab.signatory.signatureNonHeaderSrc;
  return (
    <div className="sb-doc">
      {includeStyles && <style dangerouslySetInnerHTML={{ __html: sidebarCss(fontBase) }} />}
      {pages.map((page, n) => (
        <div key={n} className="sb-page">
          {variant === "header" && <SbLetterhead lab={lab} />}
          <PatientBlock report={report} />
          {bar && <Svg className="sb-barcode" svg={bar} />}
          <Svg className="sb-qr" svg={qr} />
          <div className="sb-qr-label">Scan to verify</div>
          <div className="sb-body">
            {page.parts.map((part, k) => (
              <SectionPart key={k} part={part} />
            ))}
            {page.isLast && (
              <div className="sb-end">
                <div className="sb-legend">{LEGEND}</div>
                <div className="sb-endtext">— {(report.endText ?? "End of Report").replace(/^-+|-+$/g, "")} —</div>
              </div>
            )}
          </div>
          {lab.qcStampSrc && <img className="sb-qc" src={lab.qcStampSrc} alt="Quality Control Approved" />}
          <img className="sb-signimg" src={signature} alt="Signature" />
          <div className="sb-signname">
            <b>{lab.signatory.name}</b>
            <span>{lab.signatory.designation}</span>
          </div>
          <div className="sb-legal">
            <span>{LEGAL}</span>
            <span>
              Page {n + 1} of {pages.length}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Blank A4 letterhead (sidebar + header + footer only) — print this to make pre-printed paper. */
export function SidebarLetterhead({ lab = MGPL_LAB, includeStyles = true, fontBase }: { lab?: LabProfile; includeStyles?: boolean; fontBase?: string }) {
  return (
    <div className="sb-doc">
      {includeStyles && <style dangerouslySetInnerHTML={{ __html: sidebarCss(fontBase) }} />}
      <div className="sb-page">
        <SbLetterhead lab={lab} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- letterhead */

/** Letterhead layer (sidebar + header + footer), shared with the invoice kit. */
export function SbLetterhead({ lab }: { lab: LabProfile }) {
  return (
    <>
      <div className="sb-side">
        <span>{lab.sidebarText ?? lab.name.toUpperCase()}</span>
      </div>
      <img className="sb-logo" src={lab.logoSrc} alt={lab.name} />
      <div className="sb-contact">
        {lab.addressLines.map((l, k) => (
          <div key={k}>{l}</div>
        ))}
        <div>
          <img src={lab.icons.phoneSrc} alt="" />
          {lab.phone}
        </div>
        <div>
          <img src={lab.icons.emailSrc} alt="" />
          {lab.email}
        </div>
      </div>
      <div className="sb-hrule" />
      <div className="sb-frule" />
      <div className="sb-flines">
        {(lab.footerLines ?? []).map((l, k) => (
          <div key={k}>{l}</div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------- patient */

function PatientBlock({ report }: { report: Report }) {
  return (
    <div className="sb-patient">
      {patientFields(report).map((f) => (
        <div key={f.label}>
          <span className="sb-f-label">{f.label}</span>
          <span className={`sb-f-value${f.strong ? " strong" : ""}`}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ sections */

function SectionPart({ part }: { part: SbPart }) {
  const s = part.section;
  const meta = sectionMeta(s);
  return (
    <div className="sb-sec">
      <div className="sb-dept">
        {s.title}
        {part.continued && !subtitleOf(s) ? " (contd.)" : ""}
      </div>
      {subtitleOf(s) && (
        <div className="sb-title">
          {subtitleOf(s)}
          {part.continued ? " (contd.)" : ""}
        </div>
      )}
      {meta && <div className="sb-meta">{meta}</div>}
      {showsTableHeader(s) && <TableHeader section={s} />}
      {part.rows.map((row, k) => (
        <RowView key={k} row={row} section={s} />
      ))}
    </div>
  );
}

function TableHeader({ section }: { section: Section }) {
  if (isGrid(section)) {
    return (
      <div className="sb-row sb-th">
        {gridColumns(section).headers.map((c) => (
          <div key={c.key} className={`sb-cell ${al(c.align)}`} style={{ width: inch(c.w) }}>
            {c.header}
          </div>
        ))}
      </div>
    );
  }
  if (isTwoColumn(section)) {
    return (
      <div className="sb-row sb-th">
        <div className="sb-cell l" style={{ width: inch(SB_COLS.name) }}>{STD_COLUMNS[0].header}</div>
        <div className="sb-cell l" style={{ width: inch(TWO_COL_RESULT_W) }}>{STD_COLUMNS[1].header}</div>
      </div>
    );
  }
  return (
    <div className="sb-row sb-th">
      {STD_COLUMNS.map((c) => (
        <div key={c.key} className={`sb-cell ${al(c.align)}`} style={{ width: inch(SB_COLS[c.key]) }}>
          {c.header}
        </div>
      ))}
    </div>
  );
}

function RowView({ row, section }: { row: Row; section: Section }) {
  const h = pt(sbRowHeight(row));
  switch (row.kind) {
    case "heading":
      return <div className="sb-sub">{row.text}</div>;
    case "text":
      return (
        <div className="sb-text" style={{ height: h }}>
          <span>
            <RichText value={row.content} />
          </span>
        </div>
      );
    case "cells": {
      const { cols } = gridColumns(section);
      return (
        <div className="sb-row" style={{ height: h }}>
          {cols.map((c, k) => (
            <div key={c.key} className={`sb-cell ${al(c.align)}`} style={{ width: inch(c.w) }}>
              <span>
                <RichText value={row.cells[k] ?? ""} />
              </span>
            </div>
          ))}
        </div>
      );
    }
    case "test":
      return <TestRowView row={row} height={h} twoColumn={isTwoColumn(section)} />;
  }
}

function TestRowView({ row, height, twoColumn }: { row: TestRow; height: string; twoColumn: boolean }) {
  const f = flagOf(row);
  const cell = (key: keyof typeof SB_COLS, align: Align, children: ReactNode) => (
    <div className={`sb-cell ${al(align)}`} style={{ width: inch(SB_COLS[key]) }}>
      {children}
    </div>
  );
  const name = cell(
    "name",
    "left",
    <>
      <span>
        {row.name}
        {row.abbr && <span className="sb-abbr">{` ${row.abbr}`}</span>}
      </span>
      {row.method && <span className="sb-method">{row.method}</span>}
    </>,
  );
  if (twoColumn) {
    return (
      <div className="sb-row" style={{ height }}>
        {name}
        <div className="sb-cell l" style={{ width: inch(TWO_COL_RESULT_W) }}>
          <span className={f.abnormal ? "sb-res-ab" : undefined} style={{ fontWeight: 700 }}>{row.result ?? ""}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="sb-row" style={{ height }}>
      {name}
      {cell("result", "center", <span className={f.abnormal ? "sb-res-ab" : undefined}>{row.result ?? ""}</span>)}
      {cell("flag", "center", f.label ? <span className="sb-pill" style={{ background: f.color }}>{f.label}</span> : null)}
      {cell("unit", "center", <span>{row.unit ?? ""}</span>)}
      {Array.isArray(row.range) ? (
        <div className="sb-cell l" style={{ width: inch(SB_COLS.range), paddingLeft: inch(SB_CELL_PAD) }}>
          <div className="sb-range-lines">
            {row.range.map((l, k) => (
              <span key={k}>{l}</span>
            ))}
          </div>
        </div>
      ) : (
        cell("range", "center", <span>{row.range ?? ""}</span>)
      )}
    </div>
  );
}

function RichText({ value }: { value: Rich }) {
  if (typeof value === "string") return <>{value}</>;
  const runs = Array.isArray(value) ? value : [value];
  return (
    <>
      {runs.map((r, k) => (
        <span key={k} style={{ fontWeight: r.bold ? 800 : undefined, color: r.color, fontSize: r.size ? pt(r.size) : undefined }}>
          {r.text}
        </span>
      ))}
    </>
  );
}

