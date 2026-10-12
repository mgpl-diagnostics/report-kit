import type { CSSProperties, ReactNode } from "react";
import { barcodeSvg } from "./barcode";
import { formatDate, formatDoctor, fullName, resolveFlag } from "./format";
import { MGPL_LAB } from "./lab";
import { NON_HEADER, SECTION } from "./layout";
import { headerCells, layoutPages, rowBox, sectionHead } from "./measure";
import { reportCss } from "./styles";
import type { Align, Column, LabProfile, Report, ReportVariant, Rich, Row, Section, TestRow } from "./types";

export interface ReportDocumentProps {
  report: Report;
  variant: ReportVariant;
  /** Lab details and image URLs. Defaults to Maa Gayatri Path Lab. */
  lab?: LabProfile;
  /** Set false if you already injected reportCss() yourself (e.g. several reports on one page). */
  includeStyles?: boolean;
  /** URL folder with the font files from /public/report-fonts. Default "/report-fonts". */
  fontBase?: string;
}

const pt = (n: number) => `${n}pt`;
const inch = (n: number) => `${n}in`;
const justify = (a: Align = "left") => (a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center");

/**
 * A4 lab report (HTML). Pure component (no hooks): works in Server Components,
 * Client Components and renderToStaticMarkup. Pages split exactly like the PDF.
 */
export function ReportDocument({ report, variant, lab = MGPL_LAB, includeStyles = true, fontBase }: ReportDocumentProps) {
  const pages = layoutPages(report);
  const header = variant === "header";
  return (
    <div className="mg-doc">
      {includeStyles && <style dangerouslySetInnerHTML={{ __html: reportCss(fontBase) }} />}
      {pages.map((sections, n) => (
        <div key={n} className={`mg-page ${header ? "mg-header" : "mg-nonheader"}`}>
          {header && <Letterhead lab={lab} />}
          <div className="mg-body">
            <div className="mg-titlebar">LABORATORY TEST REPORT</div>
            <PatientBlock report={report} />
            {sections.map((s, k) => (
              <SectionBlock key={k} section={s} />
            ))}
            {n === pages.length - 1 && <div className="mg-end">{report.endText ?? "--End of Report--"}</div>}
          </div>
          <Footer lab={lab} variant={variant} />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- letterhead */

function Letterhead({ lab }: { lab: LabProfile }) {
  return (
    <>
      <img className="mg-logo" src={lab.logoSrc} alt={lab.name} />
      <div className="mg-divider" />
      <div className="mg-address">
        {lab.addressLines.map((line, k) => (
          <div key={k}>{line}</div>
        ))}
      </div>
      <div className="mg-rule" />
    </>
  );
}

/* ------------------------------------------------------------------- patient */

function PatientBlock({ report }: { report: Report }) {
  const p = report.patient;
  return (
    <div className="mg-patient">
      <div className="mg-prow mg-p-name">
        Patient Name: <b>{fullName(p)}</b>
      </div>
      <div className="mg-prow mg-p-date">Sample Collection Date: {formatDate(p.sampleCollectionDate)}</div>
      <div className="mg-prow mg-p-age">
        Age: <b>{p.age}</b> {p.ageUnit ?? "Year(s)"}
      </div>
      {p.patientId && <div className="mg-prow mg-p-id">Patient ID:</div>}
      {p.patientId && <Barcode value={p.patientId} />}
      <div className="mg-prow mg-p-sex">
        Sex: <b>{p.sex}</b>
      </div>
      <div className="mg-prow mg-p-ref">
        Ref. Doctor: <b>{formatDoctor(p.refDoctor)}</b>
      </div>
      <div className="mg-pline" />
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const svg = barcodeSvg(value);
  if (!svg) return <div className="mg-barcode">{value}</div>;
  return <div className="mg-barcode" dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg preserveAspectRatio="xMinYMid meet" ') }} />;
}

/* ------------------------------------------------------------------ sections */

function SectionBlock({ section }: { section: Section }) {
  const st = section.style ?? {};
  const { x, w } = section.wide ? SECTION.wide : SECTION.normal;
  const head = sectionHead(section);
  return (
    <div className="mg-section" style={{ marginLeft: inch(x), width: inch(w) }}>
      <div className="mg-sec-head">
        <div
          className="mg-sec-title"
          style={{
            fontSize: pt(st.titleSize ?? 12),
            height: pt(head.title),
            lineHeight: pt(head.title),
            letterSpacing: st.titleSpacing ? pt(st.titleSpacing) : undefined,
          }}
        >
          {section.title}
        </div>
        {!section.hideColumnHeader && (
          <div className="mg-colhead" style={{ height: pt(head.columns) }}>
            {headerCells(section).map((c) => (
              <div
                key={c.key}
                style={{
                  width: inch(c.spanWidth),
                  justifyContent: justify(c.headerAlign ?? c.align),
                  paddingLeft: inch(c.headerPadLeft ?? SECTION.cellPad),
                }}
              >
                {c.header}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mg-rows" style={{ fontSize: pt(st.fontSize ?? 11), fontFamily: st.font }}>
        {section.rows.map((row, k) => (
          <RowView key={k} row={row} section={section} />
        ))}
      </div>
    </div>
  );
}

function RowView({ row, section }: { row: Row; section: Section }) {
  const st = section.style ?? {};
  const box = rowBox(row, section);
  const indent = st.indent ?? 0;
  const line: CSSProperties = { height: pt(box.height), marginBottom: pt(box.gap) };

  switch (row.kind) {
    case "heading":
      return (
        <div className="mg-line mg-heading" style={{ ...line, fontSize: pt(row.size ?? st.headingSize ?? 11), color: row.color, paddingLeft: inch(indent) }}>
          {row.text}
        </div>
      );
    case "text":
      return (
        <div className="mg-line" style={{ ...line, paddingLeft: inch(row.indent ?? indent), paddingTop: pt(row.spaceBefore ?? 0) }}>
          <span>
            <RichText value={row.content} />
          </span>
        </div>
      );
    case "cells":
      return (
        <div className="mg-line" style={line}>
          {section.columns.map((c, k) => (
            <Cell key={c.key} c={c} index={k} indent={indent}>
              <RichText value={row.cells[k] ?? ""} />
            </Cell>
          ))}
        </div>
      );
    case "test":
      return <TestRowView row={row} section={section} />;
  }
}

function Cell({ c, index, indent, children }: { c: Column; index: number; indent: number; children: ReactNode }) {
  return (
    <div
      className="mg-cell"
      style={{ width: inch(c.width), justifyContent: justify(c.align), paddingLeft: inch((c.padLeft ?? 0) + (index === 0 ? indent : 0)) }}
    >
      {children}
    </div>
  );
}

function TestRowView({ row, section }: { row: TestRow; section: Section }) {
  const st = section.style ?? {};
  const box = rowBox(row, section);
  const indent = st.indent ?? 0;
  const abnormal = resolveFlag(row) !== "normal";

  const content = (c: Column): ReactNode => {
    switch (c.key) {
      case "name":
        return (
          <span style={{ fontWeight: st.nameBold ? 700 : undefined, fontSize: st.nameSize ? pt(st.nameSize) : undefined }}>
            {row.name}
            {row.abbr && <b>{` ${row.abbr}`}</b>}
          </span>
        );
      case "result":
        return (
          <span
            style={{
              color: row.resultColor ?? (abnormal ? st.abnormalColor ?? "#FF0000" : st.resultColor),
              fontWeight: (abnormal && st.abnormalBold !== false) || st.resultBold ? 700 : undefined,
              fontSize: st.resultSize ? pt(st.resultSize) : undefined,
            }}
          >
            {row.result ?? ""}
          </span>
        );
      case "unit":
        return <span style={{ fontWeight: st.unitBold ? 700 : undefined }}>{row.unit ?? ""}</span>;
      case "range":
        if (Array.isArray(row.range)) {
          return (
            <span className="mg-range-lines" style={{ fontSize: pt(st.rangeSize ?? 7), fontFamily: st.rangeFont }}>
              {row.range.map((l, k) => (
                <span key={k}>{l}</span>
              ))}
            </span>
          );
        }
        return <span style={{ fontFamily: st.rangeFont, fontWeight: st.rangeBold ? 700 : undefined }}>{row.range ?? ""}</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mg-line" style={{ height: pt(box.height), marginBottom: pt(box.gap) }}>
        {section.columns.map((c, k) => (
          <Cell key={c.key} c={c} index={k} indent={indent}>
            {content(c)}
          </Cell>
        ))}
      </div>
      {box.method && (
        <div
          className="mg-line mg-method"
          style={{
            height: pt(box.method.height),
            marginTop: pt(box.method.gapTop),
            marginBottom: pt(box.method.gap),
            fontSize: pt(box.method.size),
            paddingLeft: inch(indent),
          }}
        >
          {row.method}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------- footer */

/** Same positions in both variants; only the signature image (and optionally contacts) differ. */
function Footer({ lab, variant }: { lab: LabProfile; variant: ReportVariant }) {
  const header = variant === "header";
  const src = header ? lab.signatory.signatureHeaderSrc : lab.signatory.signatureNonHeaderSrc;
  return (
    <>
      {(header || !NON_HEADER.hideContactFooter) && (
        <>
          <img className="mg-f-email-icon" src={lab.icons.emailSrc} alt="" />
          <div className="mg-f-text mg-f-email">
            Email: <span>{lab.email}</span>
          </div>
          <img className="mg-f-phone-icon" src={lab.icons.phoneSrc} alt="" />
          <div className="mg-f-text mg-f-phone">
            Mobile No: <span>{lab.phone}</span>
          </div>
        </>
      )}
      {lab.qcStampSrc && <img className="mg-f-qc" src={lab.qcStampSrc} alt="Quality Control Approved" />}
      <img className="mg-f-sign" src={src} alt="Signature" />
      <div className="mg-f-signatory">
        <div>{lab.signatory.name}</div>
        <div>{lab.signatory.designation}</div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- rich */

function RichText({ value }: { value: Rich }) {
  if (typeof value === "string") return <>{value}</>;
  const runs = Array.isArray(value) ? value : [value];
  return (
    <>
      {runs.map((r, k) => (
        <span
          key={k}
          style={{
            fontWeight: r.bold ? 700 : undefined,
            fontStyle: r.italic ? "italic" : undefined,
            color: r.color,
            fontSize: r.size ? pt(r.size) : undefined,
            fontFamily: r.font,
          }}
        >
          {r.text}
        </span>
      ))}
    </>
  );
}
