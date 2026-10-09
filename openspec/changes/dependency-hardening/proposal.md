# Proposal

## Why

The 2.x toolchain replacement resolves most of the repository's `npm audit` findings — 73 at the baseline, 18 after — and `papercss-2x-foundation` group 17 records that count and classifies each remaining finding by reachability. This change takes the subset that is actually reachable from the build and resolves it; findings that cannot affect the build or a consumer are justified rather than chased. Resolution is kept separate because an unmergeable upstream bump could otherwise gate the foundation release.

## What Changes

- Resolve every finding classified as reachable by `papercss-2x-foundation` group 17.
- For each finding left unresolved, record why it cannot affect a consumer, since consumers use the prebuilt stylesheet and never execute this tree.

## Capabilities

### New Capabilities
- `dependency-hardening`: the repository resolves the development dependency findings that are reachable from its build, and justifies the remainder, so that remaining risk is a recorded decision rather than an unexamined count.

### Modified Capabilities
None.

## Impact

- `package.json`, `package-lock.json`, and any build or CI configuration touched while resolving a finding.
- No shipped artifact changes: `dependencies` is empty and consumers use `dist/paper.css`.
- Consumes the classification produced by `papercss-2x-foundation` group 4 (toolchain) and group 17 (classification); it is not meaningful before those land.
