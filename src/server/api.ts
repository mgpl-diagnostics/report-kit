// Backend HTTP API for the report kit, built on the standard Fetch `Request`/`Response`, so it runs
// unchanged in Next.js route handlers, Hono, Bun, Deno — and in Express / node:http via toNodeHandler().
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_BASE_PATH, ROUTES, type ReportRequest, type SampleInfo, type TemplateCatalog } from "../shared/api";
import type { LabProfile, Report } from "../shared/types";
import { renderLetterheadHtml, renderReportHtml } from "./html";
import { defaultLab } from "./signatures";
import { assetsDir } from "./paths";
import { renderLetterheadPdf, renderReportPdf } from "./pdf";
import { getSampleReport, SAMPLES } from "./samples";
import { buildProfileReport, buildReport, PROFILES, TEMPLATES, type ProfileId, type TemplateId } from "./templates";

export type ApiHandler = (req: Request) => Promise<Response>;

export interface ApiOptions {
  /** Where the handler is mounted (default "/api/mgpl") */
  basePath?: string;
  /** Lab branding (default: MGPL_LAB + private signatures from MGPL_SIGNATURE_* env vars) */
  lab?: LabProfile;
  /** Expose demo samples: GET /samples and `{ sample: id }` requests (default false) */
  samples?: boolean;
  /** Access-Control-Allow-Origin for browser clients on another origin, e.g. "https://app.example.com" or "*" */
  cors?: string;
  /** Max JSON body size in bytes (default 1 MB) */
  maxBodyBytes?: number;
  /** Public URL of this API when behind a proxy (default: taken from the request) */
  publicUrl?: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ helpers */

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}

export function pdfResponse(pdf: Buffer, fileName: string, download: boolean): Response {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName.replace(/[^\w.-]+/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function htmlResponse(html: string): Response {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function readJson<T>(req: Request, maxBytes: number): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, `Body larger than ${maxBytes} bytes`);
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, `Body larger than ${maxBytes} bytes`);
  try {
    return JSON.parse(text || "{}") as T;
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
}

/** The public URL prefix of this API, e.g. "https://lab.example.com/api/mgpl" */
export function apiBaseUrl(req: Request, opts: ApiOptions): string {
  const base = (opts.basePath ?? DEFAULT_BASE_PATH).replace(/\/$/, "");
  return (opts.publicUrl ?? new URL(req.url).origin + base).replace(/\/$/, "");
}

/** Lab profile whose "/report-assets/…" images point at this API's GET /assets route. */
export function labWithAssetUrls(lab: LabProfile, assetBase: string): LabProfile {
  const u = (src: string) => (src.startsWith("/report-assets/") ? `${assetBase}${src}` : src);
  return {
    ...lab,
    logoSrc: u(lab.logoSrc),
    qcStampSrc: lab.qcStampSrc && u(lab.qcStampSrc),
    icons: { emailSrc: u(lab.icons.emailSrc), phoneSrc: u(lab.icons.phoneSrc) },
    signatory: { ...lab.signatory, signatureHeaderSrc: u(lab.signatory.signatureHeaderSrc), signatureNonHeaderSrc: u(lab.signatory.signatureNonHeaderSrc) },
  };
}

const ASSET_TYPES: Record<string, string> = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", woff: "font/woff" };

/** GET /assets/report-assets/<file> | /assets/report-fonts/<file> — the package's bundled files. */
export async function serveAsset(rel: string, cors?: string): Promise<Response> {
  const m = rel.match(/^\/(report-assets|report-fonts)\/([\w.-]+)$/);
  const type = m && ASSET_TYPES[m[2].split(".").pop()!.toLowerCase()];
  if (!m || !type) return json({ error: "Not found" }, 404);
  try {
    const data = await readFile(join(assetsDir(), m[1], m[2]));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", ...(cors ? { "Access-Control-Allow-Origin": cors } : {}) },
    });
  } catch {
    return json({ error: "Not found" }, 404);
  }
}

export function withCors(res: Response, cors?: string): Response {
  if (!cors) return res;
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", cors);
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Expose-Headers", "Content-Disposition");
  if (cors !== "*") h.append("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}

/* --------------------------------------------------------------- report API */

export function templateCatalog(): TemplateCatalog {
  return {
    templates: (Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
      const t = TEMPLATES[id];
      return { id, name: t.name, category: t.category, specimen: t.specimen, method: t.method, fields: t.fields };
    }),
    profiles: (Object.keys(PROFILES) as ProfileId[]).map((id) => ({ id, name: PROFILES[id].name, tests: PROFILES[id].tests })),
  };
}

/** Turns a ReportRequest into a Report (throws HttpError 400 on bad input). */
export function reportFromRequest(body: ReportRequest, opts: Pick<ApiOptions, "samples"> = {}): Report {
  try {
    if (body.report) {
      if (!body.report.patient?.name || !Array.isArray(body.report.sections)) throw new Error("report needs patient.name and sections[]");
      return body.report;
    }
    if (body.sample) {
      if (!opts.samples) throw new Error("samples are disabled on this server");
      const r = getSampleReport(body.sample);
      if (!r) throw new Error(`unknown sample "${body.sample}"`);
      return r;
    }
    if (!body.patient?.name || body.patient.age == null || !body.patient.sex) throw new Error("patient needs name, age and sex");
    if (body.profile) return buildProfileReport(body.patient, body.profile.id, body.profile.results ?? {});
    if (Array.isArray(body.tests) && body.tests.length) return buildReport(body.patient, body.tests);
    throw new Error("send tests[], profile, report or sample");
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
}

/**
 * The report backend. Mount it at `basePath`:
 *
 *   // Next.js: app/api/mgpl/[...path]/route.ts
 *   const api = createReportApi();
 *   export const GET = api, POST = api, OPTIONS = api;  export const runtime = "nodejs";
 *
 *   // Express / node:http
 *   app.use("/api/mgpl", toNodeHandler(createReportApi()));
 */
export function createReportApi(opts: ApiOptions = {}): ApiHandler {
  const base = (opts.basePath ?? DEFAULT_BASE_PATH).replace(/\/$/, "");
  const lab = opts.lab ?? defaultLab();
  const max = opts.maxBodyBytes ?? 1_000_000;

  return async (req) => {
    if (req.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), opts.cors);
    let path = new URL(req.url).pathname;
    if (path.startsWith(base)) path = path.slice(base.length) || "/";
    try {
      const res = await route(req, path);
      return withCors(res, opts.cors);
    } catch (e) {
      if (e instanceof HttpError) return withCors(json({ error: e.message }, e.status), opts.cors);
      console.error("[@mgpl-diagnostics/report-kit]", e);
      return withCors(json({ error: "Internal error" }, 500), opts.cors);
    }
  };

  async function route(req: Request, path: string): Promise<Response> {
    const get = req.method === "GET" || req.method === "HEAD";
    const q = new URL(req.url).searchParams;

    if (path.startsWith(ROUTES.assets + "/") && get) return serveAsset(path.slice(ROUTES.assets.length), opts.cors);
    if (path === ROUTES.health && get) return json({ ok: true, service: "report-kit" });
    if (path === ROUTES.templates && get) return json(templateCatalog());
    if (path === ROUTES.samples && get) {
      if (!opts.samples) throw new HttpError(404, "samples are disabled on this server");
      return json(SAMPLES.map((s): SampleInfo => ({ id: s.id, label: s.label, group: s.group, source: s.source })));
    }
    if (path === ROUTES.letterhead && get) {
      if (q.get("format") === "html") {
        const assetBase = apiBaseUrl(req, opts) + ROUTES.assets;
        return htmlResponse(await renderLetterheadHtml({ lab: labWithAssetUrls(lab, assetBase), inline: false, fontBase: `${assetBase}/report-fonts` }));
      }
      return pdfResponse(await renderLetterheadPdf({ lab }), "letterhead.pdf", q.get("download") === "1");
    }
    if (path === ROUTES.report) {
      if (req.method !== "POST") throw new HttpError(405, "Use POST");
      const body = await readJson<ReportRequest>(req, max);
      const report = reportFromRequest(body, opts);
      const variant = body.variant === "non-header" ? "non-header" : "header";
      const design = body.design === "classic" ? "classic" : "sidebar";
      if (body.format === "html") {
        const assetBase = apiBaseUrl(req, opts) + ROUTES.assets;
        return htmlResponse(
          await renderReportHtml({ report, variant, design, lab: labWithAssetUrls(lab, assetBase), inline: false, fontBase: `${assetBase}/report-fonts` }),
        );
      }
      const pdf = await renderReportPdf({ report, variant, design, lab });
      return pdfResponse(pdf, body.fileName ?? `${report.patient.patientId ?? "report"}-${variant}.pdf`, !!body.download);
    }
    throw new HttpError(404, `No route ${req.method} ${path}`);
  }
}
