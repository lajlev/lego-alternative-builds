#!/usr/bin/env node
/*
 * Regenerates data.js from data.json.
 * Run after editing data.json:  node build-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const builds = JSON.parse(readFileSync(new URL("./data.json", import.meta.url)));

const header = `/*
 * Build catalogue for LEGO 10698 "Large Creative Brick Box".
 * GENERATED from data.json by build-data.mjs — do not edit by hand.
 * This mirror lets the app run straight from file:// without a server.
 */
window.BUILDS = `;

writeFileSync(
  new URL("./data.js", import.meta.url),
  header + JSON.stringify(builds, null, 2) + ";\n"
);

console.log(`Wrote data.js (${builds.length} builds).`);
