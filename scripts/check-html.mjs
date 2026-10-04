#!/usr/bin/env node
/*
 * Validate the documentation this repository builds and compare the result
 * against the committed error baseline in .htmlvalidate-baseline.json.
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
 * The baseline is a ratchet, not a target. Lower it with
 * `node scripts/check-html.mjs --update` (or `make check-update-baseline`) once
 * counts have actually dropped. A passing run never raises or lowers a ceiling
 * on its own - otherwise the recorded debt creeps upward one "improvement" at a
 * time and stops meaning anything.
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

const byRule = {};
for (const result of results) {
  for (const message of result.messages) {
    if (message.severity !== 2) continue;
    byRule[message.ruleId] = (byRule[message.ruleId] || 0) + 1;
  }
}
const total = Object.values(byRule).reduce((sum, count) => sum + count, 0);

if (update) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        total,
        pages: pages.length,
        aliasesExcluded: aliases,
        byRule: Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b))),
      },
      null,
      2
    )}\n`
  );
  console.log(`Updated ${path.relative(ROOT, BASELINE)}: ${total} errors across ${pages.length} pages`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {
  fail(`${path.relative(ROOT, BASELINE)} is missing or unreadable - run with --update to create it`);
}

const regressions = [];
if (total > baseline.total) {
  regressions.push(`total errors: ${total} (baseline ${baseline.total})`);
}
for (const rule of new Set([...Object.keys(byRule), ...Object.keys(baseline.byRule)])) {
  if ((byRule[rule] ?? 0) > (baseline.byRule[rule] ?? 0)) {
    regressions.push(`${rule}: ${byRule[rule]} (baseline ${baseline.byRule[rule] ?? 0})`);
  }
}

console.log(`html-validate: ${total} errors across ${pages.length} pages (${aliases} redirect stubs excluded)`);
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

if (regressions.length > 0) {
  console.error(`\nHTML error budget exceeded:\n  ${regressions.join("\n  ")}`);
  console.error("\nFix these, or run `make check-update-baseline` if the baseline itself is wrong.");
  process.exit(1);
}

console.log("\nHTML error budget met.");