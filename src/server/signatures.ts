// Real signatures stay OUT of git. The public package ships a placeholder; a server points these
// environment variables at private image files and every report/invoice uses them automatically:
//
//   MGPL_SIGNATURE_FILE=/secure/signature.jpg            (both variants)
//   MGPL_SIGNATURE_HEADER_FILE=/secure/sig-scan.jpg      (header variant, overrides the above)
//   MGPL_SIGNATURE_NONHEADER_FILE=/secure/sig-green.png  (non-header variant, overrides the above)
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { MGPL_LAB } from "./lab";
import type { LabProfile } from "../shared/types";

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };
const cache = new Map<string, string>();

/** A private image file as a data URI (usable in both the PDF and the HTML output). */
export function imageFileToDataUri(path: string): string {
  const abs = resolve(path);
  let uri = cache.get(abs);
  if (!uri) {
    const type = MIME[extname(abs).toLowerCase()];
    if (!type) throw new Error(`Signature must be .png, .jpg or .svg: ${path}`);
    uri = `data:${type};base64,${readFileSync(abs).toString("base64")}`;
    cache.set(abs, uri);
  }
  return uri;
}

/** Lab profile with signatures loaded from private files (undefined entries keep the current image). */
export function withSignatureFiles(lab: LabProfile, files: { header?: string; nonHeader?: string }): LabProfile {
  return {
    ...lab,
    signatory: {
      ...lab.signatory,
      signatureHeaderSrc: files.header ? imageFileToDataUri(files.header) : lab.signatory.signatureHeaderSrc,
      signatureNonHeaderSrc: files.nonHeader ? imageFileToDataUri(files.nonHeader) : lab.signatory.signatureNonHeaderSrc,
    },
  };
}

/** `lab` with signatures taken from the MGPL_SIGNATURE_* environment variables, if set. */
export function labFromEnv(lab: LabProfile = MGPL_LAB, env: Record<string, string | undefined> = process.env): LabProfile {
  const both = env.MGPL_SIGNATURE_FILE;
  const header = env.MGPL_SIGNATURE_HEADER_FILE ?? both;
  const nonHeader = env.MGPL_SIGNATURE_NONHEADER_FILE ?? both;
  return header || nonHeader ? withSignatureFiles(lab, { header, nonHeader }) : lab;
}

/** The lab used when none is passed: MGPL_LAB + private signatures from the environment. */
export const defaultLab = (): LabProfile => labFromEnv(MGPL_LAB);
