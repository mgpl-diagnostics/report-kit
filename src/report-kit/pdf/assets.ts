import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { Font } from "@react-pdf/renderer";
import { FONTS } from "../layout";

/** Image ready for react-pdf's <Image src={...}> */
export interface PdfImage {
  data: Buffer;
  format: "png" | "jpg";
}

const cache = new Map<string, Promise<PdfImage>>();

/**
 * Loads an image for the PDF. Accepts the same `src` strings as the HTML preview:
 *   "/report-assets/logo.svg"  -> read from `publicDir`
 *   "https://…"                -> fetched
 *   "data:image/svg+xml;base64,…"
 * SVGs are rasterised with resvg (react-pdf cannot embed SVG files).
 */
export function loadImage(src: string, publicDir: string): Promise<PdfImage> {
  const key = `${publicDir}|${src}`;
  let p = cache.get(key);
  if (!p) {
    p = load(src, publicDir);
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return p;
}

async function load(src: string, publicDir: string): Promise<PdfImage> {
  let data: Buffer;
  let kind: string;

  if (src.startsWith("data:")) {
    const m = src.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
    if (!m) throw new Error("Bad data URI");
    data = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
    kind = m[1];
  } else if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Image ${src}: HTTP ${res.status}`);
    data = Buffer.from(await res.arrayBuffer());
    kind = res.headers.get("content-type") ?? extname(new URL(src).pathname);
  } else {
    const path = join(publicDir, decodeURI(src.split("?")[0]));
    data = await readFile(path);
    kind = extname(path);
  }

  if (/svg/i.test(kind)) return svgToPng(data);
  if (/jpe?g/i.test(kind)) return { data, format: "jpg" };
  return { data, format: "png" };
}

/** Rasterises an SVG for react-pdf (which cannot embed SVG files). 1600px wide ≈ 500+ dpi on the page. */
export function svgToPng(svg: string | Buffer, width = 1600): PdfImage {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: "rgba(0,0,0,0)" }).render().asPng();
  return { data: Buffer.from(png), format: "png" };
}

let registeredFrom: string | null = null;

/** Registers the report fonts (same .woff files the HTML preview uses). */
export function registerFonts(fontDir: string) {
  if (registeredFrom === fontDir) return;
  const f = (file: string) => join(fontDir, file);
  Font.register({
    family: FONTS.body,
    fonts: [
      { src: f("carlito-400.woff"), fontWeight: 400 },
      { src: f("carlito-700.woff"), fontWeight: 700 },
      { src: f("carlito-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: f("carlito-700-italic.woff"), fontWeight: 700, fontStyle: "italic" },
    ],
  });
  Font.register({ family: FONTS.title, src: f("archivo-black-400.woff") });
  Font.register({ family: FONTS.address, src: f("barlow-semi-condensed-300.woff"), fontWeight: 300 });
  // Never hyphenate medical terms
  Font.registerHyphenationCallback((word) => [word]);
  registeredFrom = fontDir;
}
