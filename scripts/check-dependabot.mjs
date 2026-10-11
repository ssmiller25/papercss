#!/usr/bin/env node
/*
 * Post-merge: verify the Dependabot backlog is closed - no open Dependabot
 * update pull request, no open Dependabot alert, and no stale `dependabot/*`
 * branch left on the remote.
 *
 *     node scripts/check-dependabot.mjs
 *     node scripts/check-dependabot.mjs --repo owner/repo
 *
 * A Dependabot item is repository state on GitHub, not a file, so this cannot
 * be checked by `make check`. It needs network access and `gh` authentication,
 * like `check-signing`, and is run after the change that resolves the
 * dependencies has been merged to the default branch. The task that creates it
 * belongs to the `dependency-hardening` change; it fails while a Dependabot
 * pull request, alert, or branch is open, which is the state before the
 * close-out steps run.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_DATA = path.join(ROOT, "docs", "data", "release.json");

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const release = JSON.parse(readFileSync(RELEASE_DATA, "utf8"));
const repo = argValue("--repo") || process.env.GITHUB_REPOSITORY || `${release.owner}/${release.repo}`;

function run(command, commandArgs) {
  return execFileSync(command, commandArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

const failures = [];

// Open Dependabot update pull requests. `app/dependabot` is the author login
// the integration uses; a pull request opened by it that is still open is one
// that was neither merged nor superseded.
try {
  const prs = JSON.parse(
    run("gh", [
      "pr", "list",
      "--repo", repo,
      "--author", "app/dependabot",
      "--state", "open",
      "--limit", "100",
      "--json", "number,title",
    ]),
  );
  for (const pr of prs) failures.push(`open Dependabot pull request #${pr.number}: ${pr.title}`);
  if (prs.length === 0) console.log("  ok   no open Dependabot pull requests");
} catch (error) {
  failures.push(`could not list Dependabot pull requests: ${error.stderr?.trim() || error.message}`);
}

// Open Dependabot alerts. `--paginate` prints one jq result per line, so the
// count does not depend on how many pages the API returns.
try {
  const out = run("gh", [
    "api",
    "--paginate",
    "--jq", '.[] | "#\\(.number) \\(.dependency.package.name) [\\(.security_advisory.severity)]"',
    `repos/${repo}/dependabot/alerts?state=open`,
  ]);
  const alerts = out.split("\n").filter(Boolean);
  for (const alert of alerts) failures.push(`open Dependabot alert ${alert}`);
  if (alerts.length === 0) console.log("  ok   no open Dependabot alerts");
} catch (error) {
  failures.push(`could not list Dependabot alerts: ${error.stderr?.trim() || error.message}`);
}

// Stale `dependabot/*` branches on the remote, including those left by
// already-closed pull requests. Closing a pull request does not delete its
// head branch, so this is checked directly.
try {
  const out = run("git", ["ls-remote", "--heads", "origin", "dependabot/*"]);
  const branches = out
    .split("\n")
    .filter(Boolean)
    .map((line) => (line.split("\t")[1] || line).replace("refs/heads/", ""));
  for (const branch of branches) failures.push(`stale Dependabot branch ${branch}`);
  if (branches.length === 0) console.log("  ok   no Dependabot branches");
} catch (error) {
  failures.push(`could not list Dependabot branches: ${error.stderr?.trim() || error.message}`);
}

if (failures.length > 0) {
  console.error(`\nDependabot check failed for ${repo}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\nDependabot check passed for ${repo}: no open pull request, alert, or branch.`);
