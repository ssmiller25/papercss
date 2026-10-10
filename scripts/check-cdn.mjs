#!/usr/bin/env node
/*
 * Verify that the released stylesheets are actually served by the open CDNs
 * that resolve GitHub tags, and that what they serve matches the release.
 *
 *     node scripts/check-cdn.mjs --tag v2.0.0
 *
 * jsDelivr is primary and Statically is documented as the fallback. Both read
 * the repository tree at the ref, so this also confirms the artifacts were
 * committed at the tag rather than only attached to the GitHub Release.
 *
 * Run after a release is published, once the CDNs have had a moment to fetch
 * the new tag. It requires network access and a published tag, so it is a
 * post-release check rather than part of `make check`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_DATA = path.join(ROOT, "docs", "data", "release.json");
const ARTIFACTS = ["dist/paper.css", "dist/paper.min.css"];

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const rawTag = argValue("--tag") || argValue("--version");
if (!rawTag) {
  console.error("usage: node scripts/check-cdn.mjs --tag v2.0.0");
  process.exit(2);
}
const tag = rawTag.startsWith("v") ? rawTag : `v${rawTag}`;

const release = JSON.parse(readFileSync(RELEASE_DATA, "utf8"));
const hosts = [
  { name: "jsDelivr", base: `https://cdn.jsdelivr.net/gh/${release.owner}/${release.repo}@${tag}` },
  { name: "Statically", base: `https://cdn.statically.io/gh/${release.owner}/${release.repo}@${tag}` },
];

const failures = [];

for (const artifact of ARTIFACTS) {
  const local = readFileSync(path.join(ROOT, artifact), "utf8");
  for (const host of hosts) {
    const url = `${host.base}/${artifact}`;
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) {
        failures.push(`${host.name} ${url} -> HTTP ${response.status}`);
        continue;
      }
      const served = await response.text();
      if (served !== local) {
        failures.push(`${host.name} ${url} does not match the released ${artifact}`);
        continue;
      }
      console.log(`  ok   ${host.name} serves ${artifact} for ${tag}`);
    } catch (error) {
      failures.push(`${host.name} ${url} -> ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`\nCDN check failed for ${tag}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\nCDN check passed for ${tag}: both CDNs serve the released stylesheets.`);
