import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { PdfImage } from "../pdf/assets";
import type { Align, LabProfile, Report, ReportVariant, Rich, Row, Section, TestRow } from "../types";
import {
  SB_BODY,
  SB_CELL_PAD,
  SB_COLORS as C,
  SB_COLS,
  SB_CONTENT,
  SB_FONT,
  SB_FOOTER,
  SB_HEADER,
  SB_LEGAL,
  SB_PAGE,
  SB_PATIENT,
  SB_RIGHT,
  SB_ROWS as R,
  SB_SIDEBAR,
  SB_SIGN,
} from "./layout";
import { isGrid, sbLayoutPages, sbRowHeight, showsTableHeader, subtitleOf, type SbPart } from "./measure";
import { flagOf, gridColumns, isTwoColumn, LEGAL, LEGEND, patientFields, sectionMeta, STD_COLUMNS, TWO_COL_RESULT_W } from "./model";

/** Images pre-loaded as PNG/JPG buffers (see renderSidebarPdf). */
export interface SbPdfImages {
  logo: PdfImage;
  email: PdfImage;
  phone: PdfImage;
  qc?: PdfImage;
  signature: PdfImage;
  barcode?: PdfImage;
  qr: PdfImage;
}

const i = (n: number) => `${n}in`;
const justify = (a: Align = "left") => (a === "left" ? "flex-start" : a === "right" ? "flex-end" : "center");
const pageStyle = { fontFamily: SB_FONT, fontSize: R.fontSize, color: C.ink } as const;

/** Navy Sidebar report as a react-pdf Document — same geometry and page breaks as <SidebarReport/>. */
export function SidebarReportPdf({ report, variant, lab, images }: { report: Report; variant: ReportVariant; lab: LabProfile; images: SbPdfImages }) {
  const pages = sbLayoutPages(report);
  const p = SB_PATIENT;
  const qrX = SB_RIGHT - p.barcode.w / 2 - p.qr.s / 2;
  return (
    <Document title={`${report.patient.name} - Lab Report`} author={lab.name} creator={lab.name} producer={lab.name}>
      {pages.map((page, n) => (
        <Page key={n} size="A4" style={pageStyle}>
          {variant === "header" && <Letterhead lab={lab} images={images} />}
          <PatientBlock report={report} />
          {images.barcode && (
            <Image src={images.barcode} style={{ position: "absolute", left: i(SB_RIGHT - p.barcode.w), top: i(p.y), width: i(p.barcode.w), height: i(p.barcode.h), objectFit: "fill" }} />
          )}
          <Image src={images.qr} style={{ position: "absolute", left: i(qrX), top: i(p.y + p.barcode.h + 0.07), width: i(p.qr.s), height: i(p.qr.s) }} />
          <Text
            style={{
              position: "absolute",
              left: i(SB_RIGHT - p.barcode.w),
              width: i(p.barcode.w),
              top: i(p.y + p.barcode.h + 0.09 + p.qr.s),
              textAlign: "center",
              fontSize: p.qr.labelSize,
              color: C.muted,
            }}
          >
            Scan to verify
          </Text>

          <View style={{ position: "absolute", left: i(SB_CONTENT.x), width: i(SB_CONTENT.w), top: i(SB_BODY.top) }}>
            {page.parts.map((part, k) => (
              <SectionPart key={k} part={part} />
            ))}
            {page.isLast && (
              <View style={{ height: R.end, justifyContent: "center" }}>
                <Text style={{ fontSize: 6.8, color: C.muted, marginBottom: 5 }}>{LEGEND}</Text>
                <Text style={{ fontSize: 7, color: C.muted, textAlign: "center", letterSpacing: 1.4 }}>
                  {`— ${(report.endText ?? "End of Report").replace(/^-+|-+$/g, "")} —`}
                </Text>
              </View>
            )}
          </View>

          <Signature lab={lab} images={images} />
          <View
            style={{
              position: "absolute",
              left: i(SB_CONTENT.x),
              width: i(SB_CONTENT.w),
              top: i(SB_LEGAL.y),
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: 0.5,
              borderTopColor: C.line,
              paddingTop: 3,
              fontSize: SB_LEGAL.size,
              color: C.muted,
            }}
          >
            <Text>{LEGAL}</Text>
            <Text>{`Page ${n + 1} of ${pages.length}`}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}

/** Blank A4 letterhead (sidebar + header + footer only). */
export function SidebarLetterheadPdf({ lab, images }: { lab: LabProfile; images: Pick<SbPdfImages, "logo" | "email" | "phone"> }) {
  return (
    <Document title={`${lab.name} - Letterhead`} author={lab.name} creator={lab.name} producer={lab.name}>
      <Page size="A4" style={pageStyle}>
        <Letterhead lab={lab} images={images} />
      </Page>
    </Document>
  );
}

/* ---------------------------------------------------------------- letterhead */

function Letterhead({ lab, images }: { lab: LabProfile; images: Pick<SbPdfImages, "logo" | "email" | "phone"> }) {
  const H = SB_HEADER;
  const lineH = H.contact.lineHeight;
  const contactRow = (children: ReactNode, k: number, icon?: PdfImage) => (
    <View key={k} style={{ height: i(lineH), flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
      {icon && <Image src={icon} style={{ width: i(H.contact.icon), height: i(H.contact.icon), marginRight: 4 }} />}
      <Text style={{ fontSize: H.contact.size }}>{children}</Text>
    </View>
  );
  const sideText = lab.sidebarText ?? lab.name.toUpperCase();
  const textBox = 6; // inches; wide enough for the rotated label
  return (
    <>
      <View style={{ position: "absolute", left: 0, top: 0, width: i(SB_SIDEBAR.w), height: i(SB_PAGE.h), backgroundColor: C.navy }} />
      <Text
        style={{
          position: "absolute",
          left: i(SB_SIDEBAR.w / 2 - textBox / 2),
          top: i(SB_PAGE.h / 2) ,
          width: i(textBox),
          marginTop: -SB_SIDEBAR.textSize / 2,
          textAlign: "center",
          color: C.gold,
          fontWeight: 800,
          fontSize: SB_SIDEBAR.textSize,
          letterSpacing: SB_SIDEBAR.letterSpacing,
          lineHeight: 1,
          transform: "rotate(-90deg)",
        }}
      >
        {sideText}
      </Text>
      <Image
        src={images.logo}
        style={{ position: "absolute", left: i(H.logo.x), top: i(H.logo.y), width: i(H.logo.w), height: i(H.logo.h), objectFit: "contain", objectPositionX: 0 }}
      />
      <View style={{ position: "absolute", right: i(SB_PAGE.w - SB_RIGHT), top: i(H.contact.y), width: i(3.4) }}>
        {lab.addressLines.map((l, k) => contactRow(l, k))}
        {contactRow(lab.phone, 90, images.phone)}
        {contactRow(lab.email, 91, images.email)}
      </View>
      <View style={{ position: "absolute", left: i(SB_CONTENT.x), width: i(SB_CONTENT.w), top: i(H.rule.y), borderTopWidth: H.rule.width, borderTopColor: C.navy }} />
      <View style={{ position: "absolute", left: i(SB_CONTENT.x), width: i(SB_CONTENT.w), top: i(SB_FOOTER.rule.y), borderTopWidth: SB_FOOTER.rule.width, borderTopColor: C.navy }} />
      <View style={{ position: "absolute", left: i(SB_CONTENT.x), width: i(SB_CONTENT.w), top: i(SB_FOOTER.lines.y) }}>
        {(lab.footerLines ?? []).map((l, k) => (
          <View key={k} style={{ height: i(SB_FOOTER.lines.lineHeight), justifyContent: "center" }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: SB_FOOTER.lines.size,
                color: k === 0 ? C.saffron : C.muted,
                fontWeight: k === 0 ? 700 : 400,
                letterSpacing: k === 0 ? 0.3 : 0,
              }}
            >
              {l}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

/* ------------------------------------------------------------------- patient */

function PatientBlock({ report }: { report: Report }) {
  const g = SB_PATIENT.grid;
  return (
    <View style={{ position: "absolute", left: i(SB_CONTENT.x), top: i(SB_PATIENT.y), width: i(g.colW * 3), flexDirection: "row", flexWrap: "wrap" }}>
      {patientFields(report).map((f) => (
        <View key={f.label} style={{ width: i(g.colW), height: i(g.rowH) }}>
          <Text style={{ fontSize: g.labelSize, fontWeight: 700, letterSpacing: 0.4, color: C.muted, lineHeight: 1.3 }}>{f.label.toUpperCase()}</Text>
          <Text style={{ fontSize: g.valueSize, fontWeight: f.strong ? 800 : 600, lineHeight: 1.35 }}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ sections */

function SectionPart({ part }: { part: SbPart }) {
  const s = part.section;
  const meta = sectionMeta(s);
  return (
    <View style={{ marginBottom: R.sectionGap }}>
      <View style={{ height: R.dept, flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 6.75, height: 6.75, backgroundColor: C.saffron, borderRadius: 1.5, marginRight: 5.25 }} />
        <Text style={{ fontSize: 11.5, fontWeight: 800, color: C.navy, letterSpacing: 0.25 }}>
          {`${s.title}${part.continued && !subtitleOf(s) ? " (contd.)" : ""}`}
        </Text>
      </View>
      {subtitleOf(s) ? (
        <View style={{ height: R.title, justifyContent: "flex-end" }}>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>{`${subtitleOf(s)}${part.continued ? " (contd.)" : ""}`}</Text>
        </View>
      ) : null}
      {meta ? (
        <View style={{ height: R.meta, justifyContent: "center" }}>
          <Text style={{ fontSize: 7, color: C.muted }}>{meta}</Text>
        </View>
      ) : null}
      {showsTableHeader(s) && <TableHeader section={s} />}
      {part.rows.map((row, k) => (
        <RowView key={k} row={row} section={s} />
      ))}
    </View>
  );
}

const rowBox = (height: number) => ({ height, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: C.line }) as const;

function Cell({ w, align = "left", padLeft, children }: { w: number; align?: Align; padLeft?: number; children: ReactNode }) {
  return (
    <View
      style={{
        width: i(w),
        height: "100%",
        paddingLeft: i(padLeft ?? SB_CELL_PAD),
        paddingRight: i(SB_CELL_PAD),
        justifyContent: "center",
        alignItems: justify(align),
      }}
    >
      {children}
    </View>
  );
}

function TableHeader({ section }: { section: Section }) {
  const th = { fontSize: 7, fontWeight: 700, letterSpacing: 0.5, color: C.muted } as const;
  const cols = isGrid(section)
    ? gridColumns(section).headers.map((c) => ({ key: c.key, w: c.w, align: c.align, header: c.header }))
    : isTwoColumn(section)
      ? [
          { key: "name", w: SB_COLS.name, align: "left" as Align, header: STD_COLUMNS[0].header },
          { key: "result", w: TWO_COL_RESULT_W, align: "left" as Align, header: STD_COLUMNS[1].header },
        ]
      : STD_COLUMNS.map((c) => ({ key: c.key, w: SB_COLS[c.key], align: c.align, header: c.header }));
  return (
    <View style={{ ...rowBox(R.tableHeader), borderBottomWidth: 1.2, borderBottomColor: C.navy }}>
      {cols.map((c) => (
        <Cell key={c.key} w={c.w} align={c.align}>
          <Text style={th}>{c.header.toUpperCase()}</Text>
        </Cell>
      ))}
    </View>
  );
}

function RowView({ row, section }: { row: Row; section: Section }) {
  const h = sbRowHeight(row);
  switch (row.kind) {
    case "heading":
      return (
        <View style={{ ...rowBox(h), alignItems: "flex-end", paddingLeft: i(SB_CELL_PAD), paddingBottom: 2 }}>
          <Text style={{ fontWeight: 800, color: C.navy }}>{row.text}</Text>
        </View>
      );
    case "text":
      return (
        <View style={{ height: h, flexDirection: "row", alignItems: "flex-end", paddingLeft: i(SB_CELL_PAD), paddingBottom: 3 }}>
          <Text>
            <RichText value={row.content} />
          </Text>
        </View>
      );
    case "cells": {
      const { cols } = gridColumns(section);
      return (
        <View style={rowBox(h)}>
          {cols.map((c, k) => (
            <Cell key={c.key} w={c.w} align={c.align}>
              <Text>
                <RichText value={row.cells[k] ?? ""} />
              </Text>
            </Cell>
          ))}
        </View>
      );
    }
    case "test":
      return <TestRowView row={row} height={h} twoColumn={isTwoColumn(section)} />;
  }
}

function TestRowView({ row, height, twoColumn }: { row: TestRow; height: number; twoColumn: boolean }) {
  const f = flagOf(row);
  const name = (
    <Cell w={SB_COLS.name}>
      <Text>
        {row.name}
        {row.abbr ? <Text style={{ fontWeight: 700 }}>{` ${row.abbr}`}</Text> : null}
      </Text>
      {row.method ? <Text style={{ fontSize: 6.8, color: C.muted }}>{row.method}</Text> : null}
    </Cell>
  );
  if (twoColumn) {
    return (
      <View style={rowBox(height)}>
        {name}
        <Cell w={TWO_COL_RESULT_W}>
          <Text style={{ fontWeight: f.abnormal ? 800 : 700, color: f.abnormal ? C.red : undefined }}>{row.result ?? ""}</Text>
        </Cell>
      </View>
    );
  }
  return (
    <View style={rowBox(height)}>
      {name}
      <Cell w={SB_COLS.result} align="center">
        <Text style={f.abnormal ? { color: C.red, fontWeight: 800 } : undefined}>{row.result ?? ""}</Text>
      </Cell>
      <Cell w={SB_COLS.flag} align="center">
        {f.label ? (
          <View style={{ backgroundColor: f.color, borderRadius: 2.25, paddingHorizontal: 3, minWidth: 11.25, height: 9 }}>
            <Text style={{ color: "#fff", fontSize: 6.8, fontWeight: 800, textAlign: "center", lineHeight: 1.3 }}>{f.label}</Text>
          </View>
        ) : null}
      </Cell>
      <Cell w={SB_COLS.unit} align="center">
        <Text>{row.unit ?? ""}</Text>
      </Cell>
      {Array.isArray(row.range) ? (
        <Cell w={SB_COLS.range}>
          {row.range.map((l, k) => (
            <Text key={k} style={{ fontSize: 7, lineHeight: 9 / 7 }}>
              {l}
            </Text>
          ))}
        </Cell>
      ) : (
        <Cell w={SB_COLS.range} align="center">
          <Text>{row.range ?? ""}</Text>
        </Cell>
      )}
    </View>
  );
}

/* ----------------------------------------------------------------- signature */

function Signature({ lab, images }: { lab: LabProfile; images: SbPdfImages }) {
  const S = SB_SIGN;
  return (
    <>
      {images.qc && <Image src={images.qc} style={{ position: "absolute", left: i(S.qc.x), top: i(S.qc.y), width: i(S.qc.s), height: i(S.qc.s) }} />}
      <Image
        src={images.signature}
        style={{ position: "absolute", left: i(S.centerX - S.sign.w / 2), top: i(S.sign.y), width: i(S.sign.w), height: i(S.sign.h), objectFit: "contain" }}
      />
      <View style={{ position: "absolute", left: i(S.centerX - 1.3), width: i(2.6), top: i(S.nameY) }}>
        <Text style={{ textAlign: "center", fontSize: S.nameSize, fontWeight: 800 }}>{lab.signatory.name}</Text>
        <Text style={{ textAlign: "center", fontSize: S.roleSize, color: C.muted }}>{lab.signatory.designation}</Text>
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
        <Text key={k} style={{ fontWeight: r.bold ? 800 : 400, color: r.color, fontSize: r.size }}>
          {r.text}
        </Text>
      ))}
    </>
  );
}
