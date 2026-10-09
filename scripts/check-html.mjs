#!/usr/bin/env node
/*
 * Validate the documentation this repository builds and compare the result
 * against the committed baselines in .htmlvalidate-baseline.json.
 *
 * Run through `make check`, or directly:
 *
 *     npm run docs:build && node scripts/check-html.mjs
 *
 * Tools invoked
 * -------------
 *   hugo          Not invoked here. `make check` builds the documentation
 *                 first; this script only reads the published output and fails
 *                 with a clear message if that output is missing.
 *   html-validate The only HTML validator used, and the only external command
 *                 this script runs. Called with `--formatter=json` so its report
 *                 can be counted per rule. It is asked one question: is this
 *                 document valid? It is given no severity, baseline, or
 *                 exclusion arguments.
 *   stylelint     Not invoked here. The stylesheet gates run separately, from
 *                 the Makefile, so this gate and the CSS gates can fail
 *                 independently.
 *
 * Why this script exists at all
 * -----------------------------
 * For a CSS framework the documentation *is* reference implementation: the
 * navbar snippet a reader copies is a contract, and an invalid element nesting
 * in an example becomes invalid markup in every project that follows it. That
 * is not hypothetical - the documented `<div class="barN">` inside a `<label>`
 * reached a downstream consumer and produced 96 validity errors across its
 * pages. So the docs are gated like any other shipped artifact.
 *
 * Demos and page chrome are held to separate baselines
 * ----------------------------------------------------
 * One ceiling covering both lets a gain in the template pay for a regression
 * in a demo. The demos are what a reader copies; the chrome is not. So the
 * live demos are wrapped in the `demo` shortcode, which emits empty marker
 * spans around each one, and this script splits every violation by whether its
 * line falls inside a marked demo region or outside it. The two regions are
 * counted and ratcheted independently, so a violation in either fails only its
 * own baseline.
 *
 * The demo-region count is part of the demo baseline
 * --------------------------------------------------
 * A demo that stops rendering - or stops being marked - would silently shrink
 * the gated set, which is the same class of failure as a baseline nobody
 * tightens. So the number of demo regions is recorded, and a change to it is
 * reported as a structural change rather than passing as a reduction. A gate
 * that can be satisfied by validating less is not a gate.
 *
 * What this script adds, because no tool above offers it
 * -------------------------------------------------------
 *   Discovery     Walking the built tree rather than using a shell glob, so the
 *                 file set does not depend on `globstar` being enabled. A
 *                 root-level page is exactly what a naive `**` pattern drops.
 *   Scoping       Identifying generated redirect stubs by content and excluding
 *                 them as files, so the exclusion is visible and counted on
 *                 every run rather than being a rule switched off somewhere.
 *   Ratcheting    A per-rule ceiling read from the committed baseline. Neither
 *                 html-validate nor stylelint has an equivalent; the only
 *                 threshold either offers is `--max-warnings`, which caps an
 *                 aggregate and therefore lets a gain in one rule pay for a
 *                 regression in another.
 *
 * The baselines are a ratchet, not a target. Lower them with
 * `node scripts/check-html.mjs --update` (or `make check-docs-update-baseline`)
 * once counts have actually dropped. A passing run never raises or lowers a
 * ceiling on its own - otherwise the recorded debt creeps upward one
 * "improvement" at a time and stops meaning anything.
 */

import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// docs/config.toml sets publishDir = "../public", so the docs land at the
// repository root rather than inside docs/.
const SITE = path.join(ROOT, "public");
const CONFIG = path.join(ROOT, ".htmlvalidate.json");
const BASELINE = path.join(ROOT, ".htmlvalidate-baseline.json");
const ALIAS_REFRESH = /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i;
// The `demo` shortcode emits these around each live demo. Attribute order and
// quote style are not assumed, so a template edit cannot silently stop the
// partition from matching.
const DEMO_START = /data-docs-demo\s*=\s*["']start["']/;
const DEMO_END = /data-docs-demo\s*=\s*["']end["']/;

const update = process.argv.slice(2).includes("--update");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function collectHtml(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtml(full, found);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

// The line ranges, per file, that sit inside a marked demo. Lines are 1-based to
// match html-validate's report; the marker lines themselves are excluded, so a
// violation is attributed to the demo only when it is strictly between a start
// and its end.
function demoRegions(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const regions = [];
  let open = null;
  lines.forEach((line, index) => {
    const lineNo = index + 1;
    if (DEMO_START.test(line)) {
      if (open !== null) fail(`${path.relative(ROOT, file)}: nested demo start at line ${lineNo}`);
      open = lineNo;
    } else if (DEMO_END.test(line)) {
      if (open === null) fail(`${path.relative(ROOT, file)}: demo end without a start at line ${lineNo}`);
      regions.push([open, lineNo]);
      open = null;
    }
  });
  if (open !== null) fail(`${path.relative(ROOT, file)}: demo start at line ${open} is never closed`);
  return regions;
}

function sortedByRule(byRule) {
  return Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b)));
}

function summarise(label, total, byRule, baseline) {
  console.log(`${label}: ${total} errors (baseline ${baseline.total})`);
  for (const rule of Object.keys(byRule).sort((a, b) => byRule[b] - byRule[a] || a.localeCompare(b))) {
    const count = byRule[rule];
    const allowed = baseline.byRule[rule] ?? 0;
    const mark = count > allowed ? "REGRESSION" : count < allowed ? "improved  " : "at baseline";
    console.log(`  ${mark}  ${rule}: ${count} (baseline ${allowed})`);
  }
  for (const rule of Object.keys(baseline.byRule).sort()) {
    if (!(rule in byRule)) {
      console.log(`  resolved    ${rule}: 0 (baseline ${baseline.byRule[rule]})`);
    }
  }
}

let generated;
try {
  generated = collectHtml(SITE);
} catch {
  fail("public/ does not exist - run `npm run docs:build` first");
}

if (generated.length === 0) {
  fail("public/ contains no HTML - did the documentation build produce output?");
}

const pages = generated.filter((file) => !ALIAS_REFRESH.test(readFileSync(file, "utf8")));
const aliases = generated.length - pages.length;

if (pages.length === 0) {
  fail("no pages found - the redirect-stub filter may be matching too broadly");
}

const regionMap = new Map();
let demoRegionCount = 0;
let demoPageCount = 0;
for (const file of pages) {
  const regions = demoRegions(file);
  regionMap.set(file, regions);
  demoRegionCount += regions.length;
  if (regions.length > 0) demoPageCount += 1;
}

if (demoRegionCount === 0) {
  fail("no demo regions found - the `demo` shortcode markers are missing from the built output");
}

// `html-validate` exits non-zero whenever it reports anything, so a non-zero
// status is expected here and only an unusable report is a real failure. The
// report is streamed to a file rather than piped, because a pipe buffer
// truncates a report of this size long before it is complete - silently, and
// with a JSON parse error that looks like a tool bug.
const reportDir = mkdtempSync(path.join(os.tmpdir(), "check-html-"));
const reportPath = path.join(reportDir, "report.json");
const reportFd = openSync(reportPath, "w");

let run;
try {
  run = spawnSync("html-validate", ["--config", CONFIG, "--formatter", "json", ...pages], {
    cwd: ROOT,
    stdio: ["ignore", reportFd, "pipe"],
    encoding: "utf8",
  });
} finally {
  closeSync(reportFd);
}

if (run.error) {
  rmSync(reportDir, { recursive: true, force: true });
  fail(`could not run html-validate: ${run.error.message}`);
}

const report = readFileSync(reportPath, "utf8");
rmSync(reportDir, { recursive: true, force: true });

let results;
try {
  results = JSON.parse(report);
} catch {
  fail(`html-validate produced no parsable report (exit ${run.status})\n${run.stderr || report.slice(0, 2000)}`);
}

const demoByRule = {};
const chromeByRule = {};
let demoTotal = 0;
let chromeTotal = 0;
for (const result of results) {
  const regions = regionMap.get(result.filePath) || [];
  for (const message of result.messages) {
    if (message.severity !== 2) continue;
    const inDemo = regions.some(([start, end]) => message.line > start && message.line < end);
    if (inDemo) {
      demoByRule[message.ruleId] = (demoByRule[message.ruleId] || 0) + 1;
      demoTotal += 1;
    } else {
      chromeByRule[message.ruleId] = (chromeByRule[message.ruleId] || 0) + 1;
      chromeTotal += 1;
    }
  }
}

if (update) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        pages: pages.length,
        aliasesExcluded: aliases,
        demo: {
          regions: demoRegionCount,
          pages: demoPageCount,
          total: demoTotal,
          byRule: sortedByRule(demoByRule),
        },
        chrome: {
          pages: pages.length,
          total: chromeTotal,
          byRule: sortedByRule(chromeByRule),
        },
      },
      null,
      2
    )}\n`
  );
  console.log(
    `Updated ${path.relative(ROOT, BASELINE)}: ` +
      `demo ${demoTotal} across ${demoRegionCount} regions on ${demoPageCount} pages, ` +
      `chrome ${chromeTotal} across ${pages.length} pages`
  );
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {
  fail(`${path.relative(ROOT, BASELINE)} is missing or unreadable - run with --update to create it`);
}

if (!baseline.demo || !baseline.chrome) {
  fail(`${path.relative(ROOT, BASELINE)} is not partitioned - run with --update to regenerate it`);
}

const regressions = [];

// A change to the number of demos is structural, not an improvement. It means a
// demo stopped rendering or stopped being marked, so the gate is now covering
// less than it recorded.
if (demoRegionCount !== baseline.demo.regions) {
  regressions.push(
    `demo regions: ${demoRegionCount} (baseline ${baseline.demo.regions}) - ` +
      "a change to the number of demos is a structural change, not a reduction"
  );
}

if (demoTotal > baseline.demo.total) {
  regressions.push(`demo total errors: ${demoTotal} (baseline ${baseline.demo.total})`);
}
for (const rule of new Set([...Object.keys(demoByRule), ...Object.keys(baseline.demo.byRule)])) {
  if ((demoByRule[rule] ?? 0) > (baseline.demo.byRule[rule] ?? 0)) {
    regressions.push(`demo ${rule}: ${demoByRule[rule]} (baseline ${baseline.demo.byRule[rule] ?? 0})`);
  }
}

if (chromeTotal > baseline.chrome.total) {
  regressions.push(`chrome total errors: ${chromeTotal} (baseline ${baseline.chrome.total})`);
}
for (const rule of new Set([...Object.keys(chromeByRule), ...Object.keys(baseline.chrome.byRule)])) {
  if ((chromeByRule[rule] ?? 0) > (baseline.chrome.byRule[rule] ?? 0)) {
    regressions.push(`chrome ${rule}: ${chromeByRule[rule]} (baseline ${baseline.chrome.byRule[rule] ?? 0})`);
  }
}

console.log(
  `html-validate: ${demoTotal + chromeTotal} errors across ${pages.length} pages ` +
    `(${aliases} redirect stubs excluded)`
);
console.log(`\n== demo region: ${demoRegionCount} regions on ${demoPageCount} pages ==`);
summarise("demo", demoTotal, demoByRule, baseline.demo);
console.log(`\n== page chrome: ${pages.length} pages ==`);
summarise("chrome", chromeTotal, chromeByRule, baseline.chrome);

if (regressions.length > 0) {
  console.error(`\nHTML error budget exceeded:\n  ${regressions.join("\n  ")}`);
  console.error("\nFix these, or run `make check-docs-update-baseline` if the baseline itself is wrong.");
  process.exit(1);
}

console.log("\nHTML error budget met.");
