# Design

## Context

`papercss-2x-foundation` group 4 replaces the 2019 toolchain and group 17 records the before/after audit count (73 → 18) and classifies each remaining finding by reachability. This change consumes that classification and owns resolution only. `dependencies` is empty; consumers use the prebuilt `dist/paper.css`. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Every finding classified as reachable is resolved, and the rest are justified.

**Non-Goals:**
- Re-measuring or re-classifying the tree; that is foundation group 17.
- Any change to the shipped stylesheet.
- Removing build tooling merely to lower a count.

## Decisions

### Decision 1: Prefer a version bump; do not disable or ignore

Resolving by bumping is verifiable with `npm audit` and the declaration record. Ignoring a reachable finding would hide it. If no safe bump exists, the finding's classification is revisited with foundation group 17 rather than suppressed here.

### Decision 2: A consumer-affecting finding is never "unreachable"

The justification rests on consumers never executing this tree. If a finding could affect the shipped artifact, it is a defect to fix, not a note to record.

## Risks / Trade-offs

**Bumping a transitive dependency moves the toolchain** → Mitigated by the declaration-equivalence record and the foundation gates: a bump that changes output fails the record.

**The count is partly outside this repository's control** → Accepted; findings with no available fix are recorded with their reachability rather than chased.

## Migration Plan

Resolve or justify, each with the audit re-run in the same change; a revert restores the previous lockfile.
