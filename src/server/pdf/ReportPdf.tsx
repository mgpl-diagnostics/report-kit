import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { formatDate, formatDoctor, fullName, resolveFlag } from "../format";
import {
  BODY_TOP,
  COLORS,
  END,
  FONTS,
  FOOTER_HEADER as FH,
  LETTERHEAD as LH,
  NON_HEADER,
  PATIENT as P,
  SECTION,
  TITLE_BAR as TB,
} from "../layout";
import { LINE, headerCells, layoutPages, rowBox, sectionHead } from "../measure";
import type { Align, Column, LabProfile, Report, ReportVariant, Rich, Row, Section, TestRow } from "../../shared/types";
import type { PdfImage } from "./assets";

/** Lab images already loaded as buffers (see renderReportPdf). */
export interface PdfLabImages {
  logo: PdfImage;
  email: PdfImage;
  phone: PdfImage;
  qc?: PdfImage;
  signature: PdfImage;
  /** Patient-ID barcode (bwip-js SVG, rasterised) */
  barcode?: PdfImage;
}

const i = (n: number) => `${n}in`;
/** line-height multiplier from an absolute height in inches */
const lh = (inches: number, pt: number) => (inches * 72) / pt;
const justify = (a: Align = "left") => (a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center");
/** Map the CSS font stacks used by templates to PDF fonts */
const pdfFont = (css?: string) => (!css ? undefined : /arial|helvetica|verdana/i.test(css) ? "Helvetica" : FONTS.body);

/** Same geometry and page breaks as <ReportDocument/>, drawn with react-pdf (pure Node.js). */
export function ReportPdf(props: { report: Report; variant: ReportVariant; lab: LabProfile; images: PdfLabImages }) {
  const { report, variant, lab, images } = props;
  const pages = layoutPages(report);
  const header = variant === "header";
  return (
    <Document title={`${fullName(report.patient)} - Lab Report`} author={lab.name} creator={lab.name} producer={lab.name}>
      {pages.map((sections, n) => (
        <Page key={n} size="A4" style={{ fontFamily: FONTS.body, fontSize: 11, color: "#000" }}>
          {header && <Letterhead lab={lab} images={images} />}
          <View style={{ position: "absolute", left: 0, right: 0, top: i(BODY_TOP) }}>
            <View
              style={{
                marginLeft: i(TB.x),
                width: i(TB.w),
                height: i(TB.h),
                backgroundColor: COLORS.navy,
                borderWidth: 0.5,
                borderColor: "#000",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: 700, fontSize: TB.size, textAlign: "center", lineHeight: 1 }}>LABORATORY TEST REPORT</Text>
            </View>
            <PatientBlock report={report} barcode={images.barcode} />
            {sections.map((s, k) => (
              <SectionBlock key={k} section={s} />
            ))}
            {n === pages.length - 1 && (
              <Text style={{ textAlign: "center", fontSize: END.size, lineHeight: LINE, marginTop: i(END.marginTop) }}>
                {report.endText ?? "--End of Report--"}
              </Text>
            )}
          </View>
          <Footer lab={lab} images={images} header={header} />
        </Page>
      ))}
    </Document>
  );
}

/* ---------------------------------------------------------------- letterhead */

function Letterhead({ lab, images }: { lab: LabProfile; images: PdfLabImages }) {
  return (
    <>
      <Image
        src={images.logo}
        style={{ position: "absolute", left: i(LH.logo.x), top: i(LH.logo.y), width: i(LH.logo.w), height: i(LH.logo.h), objectFit: "contain", objectPositionX: 0 }}
      />
      <View
        style={{ position: "absolute", left: i(LH.divider.x), top: i(LH.divider.y), height: i(LH.divider.h), borderLeftWidth: LH.divider.width, borderLeftColor: COLORS.divider }}
      />
      <View style={{ position: "absolute", left: i(LH.address.x), top: i(LH.address.y) }}>
        {lab.addressLines.map((line, k) => (
          <Text key={k} style={{ fontFamily: FONTS.address, fontWeight: 300, fontSize: LH.address.size, lineHeight: lh(LH.address.lineHeight, LH.address.size) }}>
            {line}
          </Text>
        ))}
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, top: i(LH.rule.y), borderTopWidth: LH.rule.width, borderTopColor: "#000" }} />
    </>
  );
}

/* ------------------------------------------------------------------- patient */

/** One patient line. Explicit width so the flex children are never squeezed. */
const prow = (pos: { x: number; y: number }) =>
  ({ position: "absolute", left: i(pos.x), top: i(pos.y), width: i(3.6), height: i(P.lineHeight), flexDirection: "row", alignItems: "center" }) as const;

function PatientBlock({ report, barcode }: { report: Report; barcode?: PdfImage }) {
  const p = report.patient;
  const t = { fontSize: P.size, lineHeight: 1 } as const;
  const b = { ...t, fontWeight: 700 } as const;
  return (
    <View style={{ position: "relative", height: i(P.height) }}>
      <View style={prow(P.name)}>
        <Text style={t}>Patient Name: </Text>
        <Text style={b}>{fullName(p)}</Text>
      </View>
      <View style={prow(P.date)}>
        <Text style={t}>Sample Collection Date: {formatDate(p.sampleCollectionDate)}</Text>
      </View>
      <View style={prow(P.age)}>
        <Text style={t}>Age: </Text>
        <Text style={b}>{`${p.age} `}</Text>
        <Text style={t}>{p.ageUnit ?? "Year(s)"}</Text>
      </View>
      {p.patientId && (
        <View style={prow(P.id)}>
          <Text style={t}>{barcode ? "Patient ID:" : "Patient ID: "}</Text>
          {!barcode && <Text style={b}>{p.patientId}</Text>}
        </View>
      )}
      {barcode && (
        <Image
          src={barcode}
          style={{ position: "absolute", left: i(P.barcode.x), top: i(P.barcode.y), width: i(P.barcode.w), height: i(P.barcode.h), objectFit: "contain", objectPositionX: 0 }}
        />
      )}
      <View style={prow(P.sex)}>
        <Text style={t}>Sex: </Text>
        <Text style={b}>{p.sex}</Text>
      </View>
      <View style={prow(P.ref)}>
        <Text style={t}>Ref. Doctor: </Text>
        <Text style={b}>{formatDoctor(p.refDoctor)}</Text>
      </View>
      <View style={{ position: "absolute", left: i(P.line.x), width: i(P.line.w), top: i(P.line.y), borderTopWidth: P.line.width, borderTopColor: COLORS.patientLine }} />
    </View>
  );
}

/* ------------------------------------------------------------------ sections */

function SectionBlock({ section }: { section: Section }) {
  const st = section.style ?? {};
  const { x, w } = section.wide ? SECTION.wide : SECTION.normal;
  const head = sectionHead(section);
  const f = st.fontSize ?? 11;
  return (
    <View style={{ marginLeft: i(x), width: i(w), marginBottom: i(SECTION.gapAfter) }}>
      <View style={{ backgroundColor: COLORS.band, borderWidth: SECTION.border, borderColor: "#000" }}>
        <View style={{ height: head.title, justifyContent: "center" }}>
          <Text style={{ fontFamily: FONTS.title, fontSize: st.titleSize ?? 12, textAlign: "center", lineHeight: 1, letterSpacing: st.titleSpacing }}>
            {section.title}
          </Text>
        </View>
        {!section.hideColumnHeader && (
          <View style={{ flexDirection: "row", borderTopWidth: SECTION.border, borderTopColor: "#000", height: head.columns }}>
            {headerCells(section).map((c) => (
              <View
                key={c.key}
                style={{
                  width: i(c.spanWidth),
                  paddingLeft: i(c.headerPadLeft ?? SECTION.cellPad),
                  paddingRight: i(SECTION.cellPad),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: justify(c.headerAlign ?? c.align),
                }}
              >
                <Text style={{ fontWeight: 700, fontSize: SECTION.colHeader.size, lineHeight: 1 }}>{c.header}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ fontSize: f, fontFamily: pdfFont(st.font) }}>
        {section.rows.map((row, k) => (
          <RowView key={k} row={row} section={section} />
        ))}
      </View>
    </View>
  );
}

function RowView({ row, section }: { row: Row; section: Section }) {
  const st = section.style ?? {};
  const box = rowBox(row, section);
  const indent = st.indent ?? 0;
  const f = st.fontSize ?? 11;
  const line = { height: box.height, marginBottom: box.gap, flexDirection: "row", alignItems: "center" } as const;

  switch (row.kind) {
    case "heading":
      return (
        <View style={{ ...line, paddingLeft: i(indent) }}>
          <Text style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: row.size ?? st.headingSize ?? 11, color: row.color, lineHeight: 1 }}>{row.text}</Text>
        </View>
      );
    case "text":
      return (
        <View style={{ ...line, paddingLeft: i(row.indent ?? indent), paddingTop: row.spaceBefore ?? 0 }}>
          <Text style={{ fontSize: f, lineHeight: 1 }}>
            <RichText value={row.content} />
          </Text>
        </View>
      );
    case "cells":
      return (
        <View style={line}>
          {section.columns.map((c, k) => (
            <Cell key={c.key} c={c} index={k} indent={indent}>
              <Text style={{ fontSize: f, lineHeight: 1 }}>
                <RichText value={row.cells[k] ?? ""} />
              </Text>
            </Cell>
          ))}
        </View>
      );
    case "test":
      return <TestRowView row={row} section={section} />;
  }
}

function Cell({ c, index, indent, children }: { c: Column; index: number; indent: number; children: ReactNode }) {
  return (
    <View
      style={{
        width: i(c.width),
        height: "100%",
        paddingLeft: i((c.padLeft ?? 0) + (index === 0 ? indent : 0)),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: justify(c.align),
      }}
    >
      {children}
    </View>
  );
}

function TestRowView({ row, section }: { row: TestRow; section: Section }) {
  const st = section.style ?? {};
  const box = rowBox(row, section);
  const indent = st.indent ?? 0;
  const f = st.fontSize ?? 11;
  const abnormal = resolveFlag(row) !== "normal";

  const content = (c: Column): ReactNode => {
    switch (c.key) {
      case "name":
        return (
          <Text style={{ fontSize: st.nameSize ?? f, fontWeight: st.nameBold ? 700 : 400, lineHeight: 1 }}>
            {row.name}
            {row.abbr && <Text style={{ fontWeight: 700 }}>{` ${row.abbr}`}</Text>}
          </Text>
        );
      case "result":
        return (
          <Text
            style={{
              fontSize: st.resultSize ?? f,
              lineHeight: 1,
              color: row.resultColor ?? (abnormal ? st.abnormalColor ?? COLORS.red : st.resultColor ?? "#000"),
              fontWeight: (abnormal && st.abnormalBold !== false) || st.resultBold ? 700 : 400,
            }}
          >
            {row.result ?? ""}
          </Text>
        );
      case "unit":
        return <Text style={{ fontSize: f, lineHeight: 1, fontWeight: st.unitBold ? 700 : 400 }}>{row.unit ?? ""}</Text>;
      case "range":
        if (Array.isArray(row.range)) {
          return (
            <View>
              {row.range.map((l, k) => (
                <Text key={k} style={{ fontSize: st.rangeSize ?? 7, lineHeight: 1.2, fontFamily: pdfFont(st.rangeFont) }}>
                  {l}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <Text style={{ fontSize: f, lineHeight: 1, fontWeight: st.rangeBold ? 700 : 400, fontFamily: pdfFont(st.rangeFont) }}>{row.range ?? ""}</Text>
        );
      default:
        return null;
    }
  };

  return (
    <View>
      <View style={{ height: box.height, marginBottom: box.gap, flexDirection: "row", alignItems: "center" }}>
        {section.columns.map((c, k) => (
          <Cell key={c.key} c={c} index={k} indent={indent}>
            {content(c)}
          </Cell>
        ))}
      </View>
      {box.method && (
        <View
          style={{
            height: box.method.height,
            marginTop: box.method.gapTop,
            marginBottom: box.method.gap,
            paddingLeft: i(indent),
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontStyle: "italic", fontWeight: 400, fontSize: box.method.size, lineHeight: 1 }}>{row.method}</Text>
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------- footer */

const abs = (b: { x: number; y: number; w?: number; h?: number; s?: number }) =>
  ({ position: "absolute", left: i(b.x), top: i(b.y), width: i(b.w ?? b.s!), height: i(b.h ?? b.s!), objectFit: "contain" }) as const;

/** Same positions in both variants; only the signature image (and optionally contacts) differ. */
function Footer({ lab, images, header }: { lab: LabProfile; images: PdfLabImages; header: boolean }) {
  const text = (pos: { x: number; y: number }) =>
    ({ position: "absolute", left: i(pos.x), top: i(pos.y), fontWeight: 700, fontSize: FH.size, lineHeight: lh(FH.lineHeight, FH.size) }) as const;
  const s = { fontWeight: 700, fontSize: FH.size, lineHeight: lh(FH.lineHeight, FH.size), textAlign: "center" } as const;
  return (
    <>
      {(header || !NON_HEADER.hideContactFooter) && (
        <>
          <Image src={images.email} style={abs(FH.emailIcon)} />
          <Text style={text(FH.email)}>
            Email: <Text style={{ color: COLORS.email }}>{lab.email}</Text>
          </Text>
          <Image src={images.phone} style={abs(FH.phoneIcon)} />
          <Text style={text(FH.phone)}>
            Mobile No: <Text style={{ color: COLORS.phone }}>{lab.phone}</Text>
          </Text>
        </>
      )}
      {images.qc && <Image src={images.qc} style={abs(FH.qc)} />}
      <Image src={images.signature} style={abs(FH.sign)} />
      <View style={{ position: "absolute", left: i(FH.signatory.x), width: i(FH.signatory.w), top: i(FH.signatory.y) }}>
        <Text style={s}>{lab.signatory.name}</Text>
        <Text style={s}>{lab.signatory.designation}</Text>
      </View>
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
        <Text
          key={k}
          style={{
            fontWeight: r.bold ? 700 : 400,
            fontStyle: r.italic ? "italic" : "normal",
            color: r.color,
            fontSize: r.size,
            fontFamily: pdfFont(r.font),
          }}
        >
          {r.text}
        </Text>
      ))}
    </>
  );
}
