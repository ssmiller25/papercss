#!/usr/bin/env node
/*
 * Write provenance metadata for a release, so a downloaded artifact can be
 * tied back to the repository and commit it was built from. Attached to the
 * GitHub Release alongside the artifacts.
 *
 *     node scripts/write-provenance.mjs
 *
 * It reads the version from GitHub's tag ref when available and falls back to
 * docs/data/release.json locally, then records the digests of the artifact set
 * that exists.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(readFileSync(path.join(ROOT, "docs", "data", "release.json"), "utf8"));

const tag = process.env.GITHUB_REF_NAME || `v${release.version}`;
const version = tag.replace(/^v/, "");

const candidates = [
  "dist/paper.css",
  "dist/paper.min.css",
  `papercss-${version}-src.tar.gz`,
];

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

const provenance = {
  repository: process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
    : release.repository,
  commit: process.env.GITHUB_SHA || null,
  ref: process.env.GITHUB_REF || null,
  tag,
  version,
  workflowRun:
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  generatedAt: new Date().toISOString(),
  artifacts: candidates
    .filter((file) => existsSync(path.join(ROOT, file)))
    .map((file) => ({
      path: file,
      bytes: statSync(path.join(ROOT, file)).size,
      sha256: sha256(path.join(ROOT, file)),
    })),
};

writeFileSync(path.join(ROOT, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(`wrote provenance.json for ${tag} (${provenance.artifacts.length} artifacts)`);
