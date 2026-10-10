#!/usr/bin/env node
/*
 * Post-release: verify a published release is verifiable - every released
 * artifact carries a build-provenance attestation, and the release is immutable.
 *
 *     node scripts/check-signing.mjs --tag v2.0.0
 *
 * Run after a release is published. It downloads the release's assets and asks
 * the GitHub CLI two questions:
 *
 *   gh attestation verify   is this file the one the release workflow built?
 *   gh release verify       is the release immutable (signed by GitHub)?
 *
 * A release whose artifacts have no attestation, or that is not immutable, is
 * incomplete rather than merely unverified, so this fails on either. It needs
 * network access, `gh` authentication, and a published tag, so it is a
 * post-release check rather than part of `make check`.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_DATA = path.join(ROOT, "docs", "data", "release.json");

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const rawTag = argValue("--tag") || argValue("--version");
if (!rawTag) {
  console.error("usage: node scripts/check-signing.mjs --tag v2.0.0");
  process.exit(2);
}
const tag = rawTag.startsWith("v") ? rawTag : `v${rawTag}`;

const release = JSON.parse(readFileSync(RELEASE_DATA, "utf8"));
const repo = process.env.GITHUB_REPOSITORY || `${release.owner}/${release.repo}`;
const signerWorkflow = `${repo}/.github/workflows/release.yml`;

function run(command, commandArgs) {
  return execFileSync(command, commandArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

const failures = [];

// Download the published assets, so the gate checks what a consumer receives
// rather than the working tree.
const dir = mkdtempSync(path.join(os.tmpdir(), "check-signing-"));
try {
  try {
    run("gh", ["release", "download", tag, "--repo", repo, "--dir", dir]);
  } catch (error) {
    console.error(`error: could not download release ${tag}: ${error.stderr?.trim() || error.message}`);
    process.exit(1);
  }

  const assets = readdirSync(dir);
  const expected = [
    "paper.css",
    "paper.min.css",
    "neucha-cyrillic.woff2",
    "neucha-latin.woff2",
    "patrick-hand-sc-vietnamese.woff2",
    "patrick-hand-sc-latin-ext.woff2",
    "patrick-hand-sc-latin.woff2",
    "OFL.txt",
    "provenance.json",
  ];
  const archive = assets.find((name) => /^papercss-.*-src\.tar\.gz$/.test(name));
  const subjects = [...expected.filter((name) => assets.includes(name)), ...(archive ? [archive] : [])];

  for (const name of expected) {
    if (!assets.includes(name)) failures.push(`release ${tag} is missing ${name}`);
  }
  if (!archive) failures.push(`release ${tag} is missing the SCSS source archive`);

  for (const name of subjects) {
    try {
      run("gh", ["attestation", "verify", path.join(dir, name), "--repo", repo, "--signer-workflow", signerWorkflow]);
      console.log(`  ok   ${name} has a valid attestation from ${signerWorkflow}`);
    } catch (error) {
      failures.push(`${name} has no valid attestation: ${error.stderr?.trim() || error.message}`);
    }
  }

  // An immutable release is signed by GitHub; `gh release verify` fails when it
  // is not, which is the immutability check.
  try {
    run("gh", ["release", "verify", tag, "--repo", repo]);
    console.log(`  ok   release ${tag} is immutable`);
  } catch (error) {
    failures.push(`release ${tag} is not immutable: ${error.stderr?.trim() || error.message}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\nSigning check failed for ${tag}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\nSigning check passed for ${tag}: every artifact is attested and the release is immutable.`);
