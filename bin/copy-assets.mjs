#!/usr/bin/env node
// Copies the report images + fonts into a web app's static folder so the HTML preview can load them.
//   npx mgpl-report-assets            -> ./public/report-assets, ./public/report-fonts
//   npx mgpl-report-assets static     -> ./static/...
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(process.argv[2] ?? "public");
mkdirSync(dest, { recursive: true });
for (const d of ["report-assets", "report-fonts"]) {
  cpSync(join(pkg, "assets", d), join(dest, d), { recursive: true });
  console.log(`@mgpl-diagnostics/report-kit: copied ${d} -> ${join(dest, d)}`);
}
