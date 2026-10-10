# Design

## Context

The documentation gate's baseline is dominated by `attr-quotes` and `no-trailing-whitespace`, with `no-inline-style` behind them; `papercss-2x-foundation` measured the distribution. This change is deliberately separate from `docs-accessibility`: it touches the appearance of source, not semantics. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- The three style rules reach zero with the rules left enabled, and the baseline is tightened in the same change.

**Non-Goals:**
- Correctness or accessibility defects (owned by `papercss-2x-foundation` for demos and `docs-accessibility` for chrome).
- Any change to the rendered appearance of a page.

## Decisions

### Decision 1: Clear the violations; do not disable the rules

Disabling `attr-quotes` is a one-line diff that permanently weakens the gate for every future attribute. The house style is already consistent; the deviations are the anomaly, so they are fixed.

### Decision 2: Inline styles move to the documentation stylesheet

These are documentation-site presentation values, not framework API. Putting them in the site stylesheet keeps the framework's class surface unchanged.

### Decision 3: Both regions are tightened in one change

The style rules span the whole page including demos. Tightening one region and leaving the other would strand half the improvement in a permanently higher ceiling.

## Risks / Trade-offs

**Whitespace stripping changes rendered layout** → Trailing whitespace is invisible; verify with a diff of the built pages against the pre-change build, expecting only whitespace changes.

**An inline style is load-bearing for a demo** → A demo relying on an inline style is a demo defect; move the value into the site stylesheet so the copied example still renders correctly.

## Migration Plan

Single change. Rollback is a revert; no consumer artifact is touched.
