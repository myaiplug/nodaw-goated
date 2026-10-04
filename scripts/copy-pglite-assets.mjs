import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const outRoot = join(root, ".vercel/output/functions/__server.func");

function findBundles(dir, acc) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) findBundles(path, acc);
    else if (entry.name.includes("pglite") && entry.name.endsWith(".mjs")) acc.push(path);
  }
}

const bundles = [];
findBundles(outRoot, bundles);
if (bundles.length === 0) {
  console.error("[pglite] no bundled module under", outRoot);
  process.exit(1);
}

for (const bundle of bundles) {
  const destDir = dirname(bundle);
  for (const file of files) {
    const from = join(srcDir, file);
    const to = join(destDir, file);
    if (!existsSync(from)) {
      console.error("[pglite] missing", from);
      process.exit(1);
    }
    copyFileSync(from, to);
  }
  console.log("[pglite] assets next to", bundle);
}
