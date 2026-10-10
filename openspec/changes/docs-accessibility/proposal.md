# Proposal

## Why

The 2.x foundation change drives the documentation's *copied demos* to zero validity and accessibility violations, but deliberately leaves the surrounding page template carrying a recorded, non-zero baseline. That leaves real defects — a missing `lang`, unnamed landmarks, unlabelled or ambiguously named form controls, and buttons without a `type` — shipping in the reference documentation. They are not the framework's runtime contract, so they were split out of 2.0; they are still this repository's own defects, and this change closes them.

## What Changes

- Add the missing `lang` attribute to the documentation base template.
- Give every repeated landmark region a non-empty, unique accessible name.
- Give every form control an associated label and a unique `name`, and give every `fieldset` a `legend`.
- Add an explicit `type` to every button and convert `input`-as-button controls to real `<button>` elements.
- Remove redundant `for` attributes and close implicitly closed elements.
- Tighten the page-chrome region's recorded `html-validate` baseline to zero in the same change.

## Capabilities

### New Capabilities
- `docs-accessibility`: the documentation site's page chrome as valid, accessible markup — language declaration, distinguishable landmarks, labelled and uniquely named form controls, typed buttons, and closed elements — measured by the page-chrome region of the documentation gate.

### Modified Capabilities
None. The demo region's contract is established by `papercss-2x-foundation`; this change adds the page-chrome contract as a separate capability.

## Impact

- Affected markup: `docs/layouts/**` (base template and partials) and `docs/content/**` where page-level chrome is authored.
- Affected gate baseline: the page-chrome region of `.htmlvalidate-baseline.json`.
- No framework CSS changes and no consumer-visible change to the shipped stylesheet.
- Depends on `papercss-2x-foundation` landing the demo/chrome partition in `scripts/check-html.mjs` and its recorded per-region baseline; without that partition there is no chrome region to tighten.
