// Node-only: where this package's bundled assets live on disk (works from src/ and dist/, any chunk depth).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let root: string | undefined;

/** Absolute path of the @mgpl-diagnostics/report-kit package folder. */
export function packageRoot(): string {
  if (root) return root;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const pkg = join(dir, "package.json");
    if (existsSync(pkg) && JSON.parse(readFileSync(pkg, "utf8")).name === "@mgpl-diagnostics/report-kit") return (root = dir);
    dir = dirname(dir);
  }
  throw new Error("@mgpl-diagnostics/report-kit: cannot locate the package folder");
}

/** Folder holding report-assets/ (images) and report-fonts/ (woff). Use as `publicDir` for PDFs. */
export const assetsDir = () => join(packageRoot(), "assets");
