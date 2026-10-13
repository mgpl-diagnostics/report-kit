// @mgpl-diagnostics/report-kit/server — BACKEND ONLY (Node.js ≥ 20).
// Everything that builds and renders reports lives here: templates, React document components,
// PDF (react-pdf), HTML strings and the HTTP API. Browsers use "@mgpl-diagnostics/report-kit/client".

// HTTP API — mount in any backend
export {
  createReportApi,
  templateCatalog,
  reportFromRequest,
  labWithAssetUrls,
  serveAsset,
  apiBaseUrl,
  json,
  pdfResponse,
  htmlResponse,
  readJson,
  withCors,
  HttpError,
  type ApiHandler,
  type ApiOptions,
} from "./api";
export { toNodeHandler } from "./node";

// Rendering
export { renderReportPdf, renderLetterheadPdf, type RenderPdfOptions } from "./pdf";
export { ReportPdf, SbLetterheadPdf, SidebarLetterheadPdf, SidebarReportPdf, type SbPdfImages } from "./pdf";
export { loadImage, registerFonts, svgToPng } from "./pdf";
export { renderReportHtml, renderLetterheadHtml, inlineLab, type RenderHtmlOptions } from "./html";
export { assetsDir, packageRoot } from "./paths";
export { defaultLab, labFromEnv, withSignatureFiles, imageFileToDataUri } from "./signatures";

// Documents (React components rendered on the server)
export { LabReport, type LabReportProps } from "./LabReport";
export { ReportDocument, type ReportDocumentProps } from "./ReportDocument";
export { SbLetterhead, SidebarLetterhead, SidebarReport, type SidebarReportProps } from "./sidebar/SidebarReport";
export { sidebarCss } from "./sidebar/styles";
export { sbLayoutPages, sbRowHeight } from "./sidebar/measure";
export * as SIDEBAR_LAYOUT from "./sidebar/layout";
export { reportCss } from "./styles";
export * as LAYOUT from "./layout";
export { headerCells, layoutPages, rowBox } from "./measure";

// Data
export * from "./templates";
export { MGPL_LAB } from "./lab";
export { getSampleReport, SAMPLES, type Sample } from "./samples";
export { formatDate, formatDateTime, formatDoctor, fullName, resolveFlag } from "./format";
export { qrSvg, reportQrValue } from "./qr";
export { barcodeSvg } from "./barcode";

// Shared types + API contract
export * from "../shared/types";
export * from "../shared/api";
