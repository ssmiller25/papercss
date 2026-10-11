# Design

## Context

`papercss-2x-foundation` group 4 replaces the 2019 toolchain and group 17 records the before/after audit count (73 → 18) and classifies each remaining finding by reachability. All 18 are development-only and transitive; consumers use the prebuilt `dist/paper.css` and never execute this tree. They are nevertheless reached by build, lint, and development commands, and they stand behind open Dependabot alerts and update pull requests that predate the toolchain replacement. This change owns resolution, the Dependabot backlog, and the one exception it cannot fix. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Resolve every `npm audit` finding a published version can resolve.
- Close every open Dependabot alert and update pull request, and remove stale Dependabot branches.
- Record `braces` as a named exception with a tracking issue.

**Non-Goals:**
- Fixing `braces` itself; no patched release exists.
- Any change to the shipped stylesheet.
- Removing build tooling merely to lower a count.

## Decisions

### Decision 1: Resolve by `overrides` pin and top-level bump, verified by the gates

`npm audit fix` proposes downgrades (`stylelint` → `7.7.0`, `stylelint-config-sass-guidelines` → `3.1.0`, `stylelint-scss` → `1.5.2`), so it is not used. Resolution is an `overrides` block pinning fixed transitive versions, plus top-level bumps where a parent clears the leaf outright. The audit is measured live; the routes below are the plan, not a committed snapshot. The declaration record and the determinism gate hold the output invariant, so a bump that changes what ships fails the change rather than passing silently.

Resolution routes:

| Finding | Route |
|---|---|
| `lodash`, `ansi-regex` (4.x), `semver`, `path-parse` | bump `concurrently` to a current major |
| `pathval`, `get-func-name` | remove `chai`, which is a direct dependency with no import in the tree |
| `minimatch`, `brace-expansion` | bump `rimraf` to a current major |
| `chokidar` (flagged only through `braces`) | bump `chokidar` to a current major |
| `ini` | `overrides: ini 1.3.8` |
| any leaf still below its patch | `overrides:` pin to the patched version |

Two bumps carry a code change. `rimraf` 3 exports `sync` and accepts `disableGlob`; version 4 and later exports `rimrafSync` and globs by default, so `build/build.js` changes. `chokidar` 4 and later dropped glob support, so `build/hot-reload.js`'s `watch('./src/**/*.scss')` passes the directory instead.

### Decision 2: A finding with no patched release is a named exception, not a suppression

`braces` (GHSA-vfj7-8cjw-p6xm / CVE-2026-93687, CVSS 7.5, CWE-407) has an advisory range of `<= 3.0.3`, and the newest published version is `3.0.3`: every published version is vulnerable and `first_patched_version` is null. `overrides` cannot move to a fix that does not exist, and Dependabot does not flag it at all. It reaches the tree only through `stylelint → globby → fast-glob → micromatch → braces` once Decision 1 removes the `chokidar` path. The change records it as the single exception with a GitHub issue carrying the advisory, the impact, and the dependency change required, rather than suppressing or ignoring it.

### Decision 3: Close the Dependabot backlog by superseding, not merging

The open update pull requests were opened against the pre-2.x tree, against a lockfile this change alters. Merging them would reintroduce that lockfile; the fix lands through Decision 1 instead. Each is commented with where the fix landed, closed, and its branch deleted, and the stale branches left by the already-closed pull requests are deleted too. A Dependabot pull request is not required to be merged to be correct; it is superseded.

### Decision 4: The close-out runs after the change is merged

A Dependabot alert updates only once the fix is on the default branch, so commenting, closing, and branch removal happen after this change is merged to `main`, as a post-merge step, not from the feature branch.

### Decision 5: Reachability and consumer impact are different axes

Foundation classifies a finding by whether the build or development workflow reaches it; this change's justification asks whether a consumer can be affected. A development-only finding can be reached by a build command and still be unable to affect a consumer, which is exactly the `braces` case: reached by `npm run lint:dist`, never by a consumer.

## Risks / Trade-offs

**A parent bump changes the toolchain** → Mitigated by the declaration-equivalence record and the determinism gate: a bump that changes output fails the record.

**`braces` stays open** → Accepted and tracked; no published version is free of the advisory, so waiting for upstream is the only resolution and the issue carries that decision.

**The Dependabot count drifts with the advisory database** → The audit is measured live, so a reopened alert is a new finding to classify rather than a regression in this change. This is why the close-out is verified live rather than pinned in a committed snapshot.

## Migration Plan

Resolve or record, each verified by `npm audit` and the gates in the same change. A revert restores the previous lockfile and `package.json`; the Dependabot close-out is not reversible by revert alone, which is why it is separate and last.

## braces exception record (issue body)

The issue this change opens, verbatim (opened as [#13](https://github.com/ssmiller25/papercss/issues/13)):

```markdown
## Summary

`braces` is reported by `npm audit` with no available fix. Every published version
is covered by the advisory, so no upgrade resolves it. `dependency-hardening`
records it as a tracked exception, and this issue carries the decision.

## Advisory

- GHSA: GHSA-vfj7-8cjw-p6xm
- CVE: CVE-2026-93687
- Severity: high - CVSS 3.1 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)
- CWE: CWE-407 Inefficient Algorithmic Complexity
- Title: braces vulnerable to stack-exhaustion denial of service through deeply
  nested patterns
- Affected range: `<= 3.0.3` - every published version
- First patched version: none; the newest published version is 3.0.3

## How it reaches this repository

    stylelint@17 -> globby -> fast-glob -> micromatch -> braces@3.0.3

`braces` also reached the tree through `chokidar@3`. `dependency-hardening`
bumps `chokidar` to 5, which no longer depends on it, leaving only the stylelint
path.

## Impact

Development only. `braces` is reached by `npm run lint:dist` through stylelint;
consumers use the prebuilt `dist/paper.css` and never execute this tree. The
pattern that triggers the advisory is repository-controlled rather than
attacker-supplied, so practical exposure is low. The finding is retained because
`npm audit` reports it and there is no way to clear it.

## Why it cannot be resolved in dependency-hardening

`overrides` cannot pin a version that does not exist, and `npm audit fix`
proposes downgrading `stylelint` to `7.7.0`, which is not acceptable. Dependabot
does not flag `braces` at all.

## Dependency change required

A patched `braces` release, or a `micromatch` / `fast-glob` / `globby` /
`stylelint` release that drops the `braces` dependency. When a patched release
exists, add `overrides: { braces: <patched> }` and retire this exception.

## Acceptance

`npm audit` no longer reports `braces` (or the stylelint cluster that depends on
it), with `make check` green.

Reference: `openspec/changes/dependency-hardening`.
```
