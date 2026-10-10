#!/usr/bin/env node
/*
 * Verify that a release is internally consistent before anything is published.
 *
 * Run through `make check`, or against a tag directly:
 *
 *     node scripts/check-release.mjs --tag v2.0.0
 *
 * Why this exists
 * ---------------
 * The version used to live in three files with nothing checking that they
 * agreed, and the stylesheet was uploaded to the GitHub Release by hand. A
 * release could therefore be labelled 1.8.3 while built from 1.8.2 sources,
 * and nothing would notice. This script makes the tag the single source of
 * truth: `package.json`'s version and the version the documentation reads must
 * both match it, or the release fails.
 *
 * What it checks
 * --------------
 *   Tag agreement   With a tag (from `--tag`, or GitHub's GITHUB_REF_TYPE=tag
 *                   and GITHUB_REF_NAME), package.json and docs/data/release.json
 *                   must both carry that version. With no tag, they must agree
 *                   with each other.
 *   Changelog       CHANGELOG.md must carry a section for the version. An
 *                   undocumented release is the failure this exists to prevent.
 *   Artifact set    dist/paper.css and dist/paper.min.css must exist and be
 *                   non-empty. This is the set a release publishes.
 *   Tagged tree     With a tag, git must contain the artifacts at that tag.
 *                   The CDNs serve the repository tree at the ref, not the
 *                   GitHub Release attachments, so attaching a build without
 *                   committing it produces a release that downloads from GitHub
 *                   and 404s on every CDN.
 *
 * A prerelease version (it contains a hyphen, e.g. 2.0.0-rc.1) is reported so
 * the release workflow can publish it as a prerelease rather than as latest.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG = path.join(ROOT, "package.json");
const RELEASE_DATA = path.join(ROOT, "docs", "data", "release.json");
const CHANGELOG = path.join(ROOT, "CHANGELOG.md");

// The released artifact set, defined once. The release workflow publishes this
// same list; anything else in dist/ is not part of a release. The typeface files
// are here because the stylesheet loads them at runtime: a release that omits
// them is incomplete even though paper.css downloads fine.
const ARTIFACTS = [
  "dist/paper.css",
  "dist/paper.min.css",
  "dist/fonts/neucha-cyrillic.woff2",
  "dist/fonts/neucha-latin.woff2",
  "dist/fonts/patrick-hand-sc-vietnamese.woff2",
  "dist/fonts/patrick-hand-sc-latin-ext.woff2",
  "dist/fonts/patrick-hand-sc-latin.woff2",
  "dist/fonts/OFL.txt",
];

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
  return condition;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const explicitTag = argValue("--tag");
const envTag =
  process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined;
const tag = explicitTag || envTag;
const expected = tag ? tag.replace(/^v/, "") : undefined;

const pkg = JSON.parse(readFileSync(PKG, "utf8"));
const release = JSON.parse(readFileSync(RELEASE_DATA, "utf8"));
const version = expected ?? pkg.version;
const prerelease = version.includes("-");

console.log(
  `release check: ${version}${prerelease ? " (prerelease)" : ""}` +
    (tag ? ` from tag ${tag}` : " (no tag; using package.json)")
);

// The tag is the single source of truth; the other two must agree with it.
check(
  pkg.version === version,
  `package.json declares ${pkg.version}, expected ${version}`
);
check(
  release.version === version,
  `docs/data/release.json declares ${release.version}, expected ${version}`
);

// A release with no changelog entry is undocumented by definition.
let changelog = "";
try {
  changelog = readFileSync(CHANGELOG, "utf8");
} catch {
  failures.push("CHANGELOG.md is missing");
}
if (changelog) {
  const heading = new RegExp(`^##\\s+${escapeRegExp(version)}(\\s|—|-|$)`, "m");
  check(heading.test(changelog), `CHANGELOG.md has no section for ${version}`);
}

// The artifact set a release publishes must exist and be non-empty.
for (const artifact of ARTIFACTS) {
  const full = path.join(ROOT, artifact);
  if (!check(existsSync(full), `missing artifact ${artifact}`)) continue;
  check(statSync(full).size > 0, `artifact ${artifact} is empty`);
}

// The CDNs read the repository tree at the tag, not the Release attachments,
// so the artifacts must be committed at the tag - not merely attached.
if (tag) {
  let tagExists = true;
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", `${tag}^{commit}`], {
      cwd: ROOT,
      stdio: "ignore",
    });
  } catch {
    tagExists = false;
  }
  if (!tagExists) {
    console.warn(`  note: tag ${tag} is not present locally; skipping the tagged-tree check`);
  } else {
    for (const artifact of ARTIFACTS) {
      try {
        execFileSync("git", ["cat-file", "-e", `${tag}:${artifact}`], {
          cwd: ROOT,
          stdio: "ignore",
        });
      } catch {
        failures.push(
          `${artifact} is not present in the tree at ${tag} - commit it before releasing, or the CDN URL for that tag will 404`
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("\nrelease check failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`  artifacts: ${ARTIFACTS.join(", ")}`);
console.log("release check passed.");
