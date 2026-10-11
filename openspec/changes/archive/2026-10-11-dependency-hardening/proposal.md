# Proposal

## Why

The 2.x toolchain replacement resolves most of the repository's `npm audit` findings — 73 at the baseline, 18 after — and `papercss-2x-foundation` group 17 records that count and classifies each remaining finding by reachability. All 18 are development-only and transitive; consumers use the prebuilt `dist/paper.css` and never execute this tree. They are nevertheless reached by build, lint, and development commands, and they stand behind a backlog of open Dependabot alerts and update pull requests that predate the toolchain replacement. This change resolves what can be resolved, closes that backlog, and records the one finding no published version fixes as a tracked exception rather than an open count.

Resolution is kept separate from the foundation release because an unmergeable upstream bump could otherwise gate it.

## What Changes

- Resolve every `npm audit` finding a published version can resolve, using `overrides` pins and top-level dependency bumps, verified against the recorded declaration set and the determinism gate.
- Record the finding whose advisory covers every published version — `braces` — as the single named exception, with the advisory, its impact, and the dependency change required, tracked in a GitHub issue to be addressed outside this change.
- Close every open Dependabot alert, which closes once the fix lands.
- Close every open Dependabot update pull request — not by merging, but by commenting where the fix landed, closing it, and deleting its branch — and delete the stale branches left by already-closed Dependabot pull requests. This runs after this change is merged to `main`.

## Capabilities

### New Capabilities
- `dependency-hardening`: the repository resolves the development dependency findings its build can reach, closes its Dependabot backlog, and records the one finding it cannot fix — with the advisory and the required dependency change — as a tracked exception, so remaining risk is a decision a consumer can inspect rather than an open count.

### Modified Capabilities
None.

## Impact

- `package.json` (an `overrides` block, top-level bumps, and the removal of the unused `chai`) and `package-lock.json`.
- No shipped artifact changes: `dependencies` is empty and consumers use `dist/paper.css`; the declaration record and the determinism gate hold that invariant.
- GitHub state: Dependabot alerts and pull requests are closed, stale Dependabot branches are deleted, and one tracking issue is opened.
- Consumes the count and reachability classification produced by `papercss-2x-foundation` group 4 and group 17.
