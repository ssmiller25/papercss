#!/usr/bin/env node
/*
 * Fail when the documentation describes a way to obtain PaperCSS that a
 * release does not support.
 *
 * This repository publishes to no package registry. The documented consumer
 * paths are the GitHub Release download and the open CDNs that serve the
 * tagged repository tree (jsDelivr primary, Statically fallback). An
 * instruction to `npm install papercss`, to read it from `node_modules`, or to
 * load it from an npm-backed CDN path describes a publication channel that
 * does not exist, so it is a defect rather than a stale link.
 *
 *     node scripts/check-consumption.mjs
 *
 * It scans source documentation, not the built site: the gate should fail on
 * the commit that introduces the instruction, before the site is built.
 *
 * It also enforces that a documented CDN URL is pinned to an exact tag. An
 * exact tag is immutable on both CDNs - jsDelivr caches a tagged file
 * permanently and its purge API only handles version-aliased URLs - so a
 * corrected release is published under a new tag, not by mutating an existing
 * one. A mutable alias (`@latest`, a partial version, a branch or a commit) is
 * the only shape that could serve a stale copy, so it fails here.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Source locations a consumer reads for install and usage instructions.
const TARGETS = [
  path.join(ROOT, "README.md"),
  path.join(ROOT, "CONTRIBUTING.md"),
  path.join(ROOT, "DISTRIBUTING.md"),
  path.join(ROOT, "docs", "content"),
  path.join(ROOT, "docs", "layouts"),
];

// Registry-backed ways to obtain or load the package. Plain `npm install` for
// building from source is fine; installing *papercss* from the registry is not.
const FORBIDDEN = [
  { pattern: /\bnpm\s+(install|i|add)\s+papercss\b/i, why: "installs papercss from the npm registry" },
  { pattern: /\byarn\s+add\s+papercss\b/i, why: "installs papercss from the npm registry" },
  { pattern: /\bpnpm\s+(add|install)\s+papercss\b/i, why: "installs papercss from the npm registry" },
  { pattern: /node_modules\/papercss/i, why: "points at an npm install location" },
  { pattern: /unpkg\.com\/papercss/i, why: "loads papercss from an npm-backed CDN" },
  { pattern: /cdn\.jsdelivr\.net\/npm\/papercss/i, why: "loads papercss from the npm-backed jsDelivr path" },
  { pattern: /npmjs\.com\/package\/papercss/i, why: "links to the npm registry entry" },
  { pattern: /registry\.npmjs\.org\/papercss/i, why: "references the npm registry" },
];

// A documented CDN URL must be pinned to an exact tag. A placeholder such as
// `<version>` is accepted; a mutable or partial ref is not. Only prose is
// scanned - Hugo shortcode templates build URLs from data and are not
// instructions a consumer follows.
const CDN_URL = /\bhttps?:\/\/(?:cdn\.jsdelivr\.net\/gh|cdn\.statically\.io\/gh)\/[^"'`)\]\s]+/g;
const EXACT_TAG = /^v?\d+\.\d+\.\d+(?:-[\w.]+)?$/;
const PLACEHOLDER = /^[<{${]/;

function collectFiles(target) {
  let stat;
  try {
    stat = readdirSync(target, { withFileTypes: true });
  } catch {
    // A plain file, not a directory.
    return [target];
  }
  const files = [];
  for (const entry of stat) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.isFile() && /\.(md|html|toml|json)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
let scanned = 0;

for (const target of TARGETS) {
  for (const file of collectFiles(target)) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    scanned += 1;
    const isTemplate = path.relative(ROOT, file).startsWith(`docs${path.sep}layouts`);
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(ROOT, file),
            line: index + 1,
            why,
            text: line.trim(),
          });
        }
      }

      if (isTemplate) return;

      CDN_URL.lastIndex = 0;
      let match;
      while ((match = CDN_URL.exec(line)) !== null) {
        const ref = match[0].match(/@([^/]+)/);
        if (!ref) {
          violations.push({
            file: path.relative(ROOT, file),
            line: index + 1,
            why: "CDN URL is not pinned to a version",
            text: match[0],
          });
        } else if (!EXACT_TAG.test(ref[1]) && !PLACEHOLDER.test(ref[1])) {
          violations.push({
            file: path.relative(ROOT, file),
            line: index + 1,
            why: `CDN URL uses a mutable or non-exact ref (@${ref[1]})`,
            text: match[0],
          });
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error("documented consumption paths that no release supports:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} - ${v.why}`);
    console.error(`    ${v.text}`);
  }
  console.error(
    "\nThis repository publishes to no package registry. Use the GitHub Release" +
      "\n download or the jsDelivr GitHub-tag URL instead."
  );
  process.exit(1);
}

console.log(`consumption check: ${scanned} files scanned, no registry-based paths documented.`);
