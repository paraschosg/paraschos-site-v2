// Fails the build if the JavaScript a visitor actually downloads for a page
// grows past the budget. Sizes are gzipped, matching what the browser fetches
// and what `next build` reports as First Load JS.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 120;

const manifest = JSON.parse(await readFile(".next/app-build-manifest.json", "utf8"));

async function gzippedKb(files) {
  let bytes = 0;
  for (const f of new Set(files.filter((f) => f.endsWith(".js")))) {
    bytes += gzipSync(await readFile(join(".next", f))).length;
  }
  return Math.round(bytes / 1024);
}

let worst = { route: "", kb: 0 };
for (const [route, files] of Object.entries(manifest.pages)) {
  if (route.endsWith("/route")) continue;
  const kb = await gzippedKb(files);
  console.log(`${route.padEnd(24)} ${kb} kB`);
  if (kb > worst.kb) worst = { route, kb };
}

console.log(`\nHeaviest page: ${worst.route} at ${worst.kb} kB gzipped (budget ${BUDGET_KB} kB)`);

if (worst.kb > BUDGET_KB) {
  console.error("Bundle budget exceeded. Trim a dependency or raise the budget deliberately.");
  process.exit(1);
}
