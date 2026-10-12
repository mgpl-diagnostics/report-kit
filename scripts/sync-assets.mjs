// Copies third-party assets from node_modules into /public so the HTML preview
// and the Node PDF renderer use exactly the same files.
//   - fonts  : @fontsource/*      -> public/report-fonts/
//   - icons  : @tabler/icons (MIT) -> public/report-assets/
//   - qc-stamp.svg : circular "QUALITY CONTROL / APPROVED" stamp. Letters are converted to
//                    vector paths with opentype.js, so it renders identically everywhere.
// Run: npm run assets
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (...p) => join(root, "node_modules", ...p);

const fontsDir = join(root, "public", "report-fonts");
mkdirSync(fontsDir, { recursive: true });
const fonts = [
  ["carlito", "carlito-latin-400-normal.woff", "carlito-400.woff"],
  ["carlito", "carlito-latin-700-normal.woff", "carlito-700.woff"],
  ["carlito", "carlito-latin-400-italic.woff", "carlito-400-italic.woff"],
  ["carlito", "carlito-latin-700-italic.woff", "carlito-700-italic.woff"],
  ["archivo-black", "archivo-black-latin-400-normal.woff", "archivo-black-400.woff"],
  ["barlow-semi-condensed", "barlow-semi-condensed-latin-300-normal.woff", "barlow-semi-condensed-300.woff"],
  // Navy Sidebar design
  ["manrope", "manrope-latin-400-normal.woff", "manrope-400.woff"],
  ["manrope", "manrope-latin-500-normal.woff", "manrope-500.woff"],
  ["manrope", "manrope-latin-600-normal.woff", "manrope-600.woff"],
  ["manrope", "manrope-latin-700-normal.woff", "manrope-700.woff"],
  ["manrope", "manrope-latin-800-normal.woff", "manrope-800.woff"],
];
for (const [pkg, file, out] of fonts) {
  copyFileSync(nm("@fontsource", pkg, "files", file), join(fontsDir, out));
  console.log(`font  ${out}`);
}

// Tabler icons. `color` replaces currentColor (an <img> SVG cannot inherit CSS colour).
const assetsDir = join(root, "public", "report-assets");
const icons = [
  ["outline/mail-forward.svg", "icon-email.svg", "#000000"],
  ["outline/phone-call.svg", "icon-phone.svg", "#000000"],
];
for (const [src, out, color] of icons) {
  const svg = readFileSync(nm("@tabler", "icons", "icons", src), "utf8")
    .replace(/currentColor/g, color)
    .replace(/\s*class="[^"]*"/, "")
    // explicit size so rasterisers (PDF) get a sharp image
    .replace(/width="24"/, 'width="256"')
    .replace(/height="24"/, 'height="256"');
  writeFileSync(join(assetsDir, out), svg);
  console.log(`icon  ${out}  (tabler ${src})`);
}

// ---------------------------------------------------------------- QC stamp
const GREEN = "#1E9B3C";
const font = opentype.parse(readFileSync(nm("@fontsource", "archivo-black", "files", "archivo-black-latin-400-normal.woff")).buffer);
const C = 100; // centre of a 200×200 viewBox
const deg = (r) => (r * 180) / Math.PI;

/** Lays `text` along a circle. top=true: reads over the top, letters pointing outward.
 *  top=false: reads along the bottom, letters upright (tops toward the centre). */
function arcText(text, { radius, size, spacing, top }) {
  const glyphs = font.stringToGlyphs(text);
  const scale = size / font.unitsPerEm;
  const widths = glyphs.map((g) => g.advanceWidth * scale + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  const span = total / radius;
  let x = 0;
  return glyphs
    .map((g, k) => {
      const w = widths[k] - spacing;
      const mid = (x + w / 2) / radius;
      x += widths[k];
      const theta = top ? -Math.PI / 2 - span / 2 + mid : Math.PI / 2 + span / 2 - mid;
      const px = (C + radius * Math.cos(theta)).toFixed(2);
      const py = (C + radius * Math.sin(theta)).toFixed(2);
      const rot = deg(top ? theta + Math.PI / 2 : theta - Math.PI / 2).toFixed(2);
      const d = g.getPath(-w / 2, 0, size).toPathData(2);
      return d ? `<path transform="translate(${px} ${py}) rotate(${rot})" d="${d}"/>` : "";
    })
    .join("");
}

// Tick from Tabler "check" (M5 12l5 5l10 -10), scaled into the centre ring
const tick = readFileSync(nm("@tabler", "icons", "icons", "outline", "check.svg"), "utf8").match(/<path d="([^"]+)"/)[1];

const stamp = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200" role="img" aria-label="Quality Control Approved">
  <circle cx="100" cy="100" r="97" fill="#fff"/>
  <circle cx="100" cy="100" r="95" fill="none" stroke="${GREEN}" stroke-width="4"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="${GREEN}" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="58" fill="none" stroke="${GREEN}" stroke-width="3"/>
  <g fill="${GREEN}">
    ${arcText("QUALITY CONTROL", { radius: 67, size: 19, spacing: 1.2, top: true })}
    ${arcText("APPROVED", { radius: 82, size: 19, spacing: 4, top: false })}
    <circle cx="27" cy="117" r="3.6"/>
    <circle cx="173" cy="117" r="3.6"/>
  </g>
  <g transform="translate(100 102) scale(4.3) translate(-12.5 -12)">
    <path d="${tick}" fill="none" stroke="#14692A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${tick}" fill="none" stroke="#2DBE4E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;
writeFileSync(join(assetsDir, "qc-stamp.svg"), stamp);
console.log("stamp qc-stamp.svg  (opentype.js + tabler check)");
