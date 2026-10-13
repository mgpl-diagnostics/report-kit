import { ReportDocument } from "./ReportDocument";
import { SidebarReport } from "./sidebar/SidebarReport";
import type { LabProfile, Report, ReportDesign, ReportVariant } from "../shared/types";

export interface LabReportProps {
  report: Report;
  variant: ReportVariant;
  /** Default "sidebar" */
  design?: ReportDesign;
  lab?: LabProfile;
  fontBase?: string;
}

/** One entry point for both designs. */
export function LabReport({ design = "sidebar", ...props }: LabReportProps) {
  return design === "classic" ? <ReportDocument {...props} /> : <SidebarReport {...props} />;
}
