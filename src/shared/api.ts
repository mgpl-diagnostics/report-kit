// The contract between the browser client and the backend API. Types + route names only —
// no rendering code lives here, so importing it costs nothing in a client bundle.
import type { ProfileId, Results, TemplateId } from "../server/templates";
import type { Patient, Report, ReportDesign, ReportVariant } from "./types";

export type { ProfileId, Results, TemplateId };

/** Default mount point of the backend handler */
export const DEFAULT_BASE_PATH = "/api/mgpl";

/** Routes, relative to the base path */
export const ROUTES = {
  health: "/health",
  templates: "/templates",
  samples: "/samples",
  report: "/report",
  letterhead: "/letterhead",
  assets: "/assets",
} as const;

export type OutputFormat = "pdf" | "html";

/**
 * POST /report body. Send ONE of:
 *  - `patient` + `tests` (template ids + results, built on the server)
 *  - `patient` + `profile`
 *  - `report` (an already built Report)
 *  - `sample` (demo id, only when the server enables samples)
 */
export interface ReportRequest {
  patient?: Patient;
  tests?: { template: TemplateId; results: Results }[];
  profile?: { id: ProfileId; results: Partial<Record<TemplateId, Results>> };
  report?: Report;
  sample?: string;
  /** default "header" */
  variant?: ReportVariant;
  /** default "sidebar" */
  design?: ReportDesign;
  /** default "pdf" */
  format?: OutputFormat;
  /** PDF only: send as a download with this name */
  fileName?: string;
  download?: boolean;
}

/** GET /templates */
export interface TemplateCatalog {
  templates: TemplateInfo[];
  profiles: { id: ProfileId; name: string; tests: TemplateId[] }[];
}
export interface TemplateInfo {
  id: TemplateId;
  name: string;
  category?: string;
  specimen?: string;
  method?: string;
  /** result keys to send in `tests[].results` */
  fields: { key: string; label: string; unit?: string; range?: string | string[] }[];
}

/** GET /samples (demo) */
export interface SampleInfo {
  id: string;
  label: string;
  group: "design" | "template" | "profile";
  source: string;
}

/** Error body for any non-2xx response */
export interface ApiError {
  error: string;
}
