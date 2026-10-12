// Maa Gayatri Path Lab — report kit.
// Browser + server safe entry. Node-only: "@mgpl-diagnostics/report-kit/pdf" (PDF) and "@mgpl-diagnostics/report-kit/server" (HTML strings).

export { LabReport, type LabReportProps } from "./LabReport";
export { ReportDocument, type ReportDocumentProps } from "./ReportDocument";
export { SbLetterhead, SidebarLetterhead, SidebarReport, type SidebarReportProps } from "./sidebar/SidebarReport";
export { sidebarCss } from "./sidebar/styles";
export { sbLayoutPages, sbRowHeight } from "./sidebar/measure";
export * as SIDEBAR_LAYOUT from "./sidebar/layout";
export { qrSvg, reportQrValue } from "./qr";
export { barcodeSvg } from "./barcode";
export { reportCss } from "./styles";
export * as LAYOUT from "./layout";
export { MGPL_LAB } from "./lab";
export { formatDate, formatDateTime, formatDoctor, fullName, resolveFlag } from "./format";
export { headerCells, layoutPages, rowBox } from "./measure";
export * from "./templates";
export * from "./types";
export { getSampleReport, SAMPLES, type Sample } from "./samples";
