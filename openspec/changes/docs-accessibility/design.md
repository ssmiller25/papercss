# Design

## Context

The documentation gate partitions each built page into a demo region and a page-chrome region and records a separate per-rule ceiling for each (`papercss-2x-foundation`, Decision 7). This change owns the chrome region; the demo region is already at zero and must not be disturbed. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Page chrome reaches zero recorded violations, and the chrome ceiling is tightened in the same change.

**Non-Goals:**
- Any change to the demo region or its baseline.
- Any change to the framework's shipped CSS or the components the docs demonstrate.
- Presentation style (`attr-quotes`, inline styles); that is `docs-style-cleanup`.

## Decisions

### Decision 1: Landmark names come from the content, not from position

A landmark named "navigation 1" is unique but useless. Each repeated landmark is named for what it contains (for example "Site" and "On this page"), which is what an assistive-technology user needs. Auto-numbering is rejected as unique but meaningless.

### Decision 2: `input`-as-button examples become real `<button>` elements

`prefer-button` and `no-implicit-button-type` clear by making the control a real button. This edits a documented example, so it follows the demo rule: the docs must teach valid markup. The framework styles buttons by element as well as class, so the rendered appearance is verified rather than assumed.

### Decision 3: Form controls are handled by region, not globally

A control inside a demo is the demo region's concern and is already at zero; this change owns only chrome controls (header, search, footer). Editing a demo to satisfy a chrome rule would violate the demo/chrome separation.

## Risks / Trade-offs

**A chrome fix alters markup a demo also uses** → Re-run the full documentation gate and require the demo region's baseline to be unchanged.

**Landmark names drift as pages change** → The gate requires only uniqueness and non-emptiness; names are content, not a contract.

## Migration Plan

Single change: fix chrome, tighten the chrome ceiling to zero, land together. Rollback is a revert; the demo region is untouched either way.
