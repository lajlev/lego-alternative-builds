#!/usr/bin/env node
/*
 * Files instruction PDFs you downloaded from Rebrickable into the catalogue.
 *
 * Rebrickable names a MOC's free-instructions download
 *   MOC-<id>_<designer>_<original-name>.pdf
 * and drops it in ~/Downloads. This script matches those by the MOC id in
 * each build's `url`, moves them to builds/10698-<slug>/instructions.pdf,
 * points data.json at the local file, and regenerates data.js.
 *
 * Usage:
 *   1. Open the MOC pages that still link out (see: node import-downloaded-pdfs.mjs --list)
 *   2. Click the free "Download" button on each — files land in ~/Downloads
 *   3. node import-downloaded-pdfs.mjs           # imports whatever it finds
 *      node import-downloaded-pdfs.mjs --force   # also replace existing PDFs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const DL = process.env.DOWNLOADS_DIR || join(homedir(), "Downloads");
const force = process.argv.includes("--force");
const builds = JSON.parse(readFileSync(join(ROOT, "data.json")));

const mocId = (b) => (b.url.match(/MOC-(\d+)/) || [])[1];

if (process.argv.includes("--list")) {
  const out = builds.filter(
    (b) => !b.instructions && !/youtu\.?be|youtube\.com/.test(b.instructions_url || "")
  );
  console.log(`${out.length} builds have a Rebrickable PDF to fetch (open each, click Download):\n`);
  for (const b of out) console.log(`  ${b.url}`);
  const vids = builds.filter(
    (b) => !b.instructions && /youtu\.?be|youtube\.com/.test(b.instructions_url || "")
  );
  if (vids.length) console.log(`\n(${vids.length} more are video-only, no PDF: ${vids.map((b) => b.title).join(", ")})`);
  process.exit(0);
}

const isPdf = (p) => {
  try { return readFileSync(p).subarray(0, 5).toString() === "%PDF-"; }
  catch { return false; }
};

let imported = 0;
const files = existsSync(DL) ? readdirSync(DL).filter((f) => /\.pdf$/i.test(f)) : [];

for (const b of builds) {
  const id = mocId(b);
  if (!id) continue;
  const dest = join(ROOT, "builds", `10698-${b.id}`, "instructions.pdf");
  if (b.instructions && existsSync(dest) && !force) continue;

  const hit = files.find((f) => new RegExp(`(^|[^0-9])MOC-${id}([^0-9]|_|$)`).test(f));
  if (!hit) continue;

  const src = join(DL, hit);
  if (!isPdf(src)) { console.warn(`skip ${hit} — not a PDF`); continue; }

  mkdirSync(join(ROOT, "builds", `10698-${b.id}`), { recursive: true });
  copyFileSync(src, dest);
  b.instructions = `builds/10698-${b.id}/instructions.pdf`;
  imported++;
  console.log(`✓ ${b.title.padEnd(38)} ← ${hit}`);
}

if (imported) {
  writeFileSync(join(ROOT, "data.json"), JSON.stringify(builds, null, 2) + "\n");
  execFileSync("node", [join(ROOT, "build-data.mjs")], { stdio: "inherit" });
}
console.log(
  `\n${imported} imported. Local PDFs: ${builds.filter((b) => b.instructions).length}/${builds.length}.`
);
