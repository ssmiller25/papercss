# Proposal

## Why

The documentation gate's recorded baseline is dominated by three style rules — `attr-quotes` and `no-trailing-whitespace` account for 97% of it, with inline styles behind them. They are style, not correctness, which is why they were split out of the 2.x foundation release. But a baseline this large makes every future gate run unreadable: a genuine violation is indistinguishable from thousands of house-style deviations. This change clears them and tightens the baseline in the same step, so the gate reports signal rather than noise.

## What Changes

- Convert single-quoted attributes to double quotes across templates and content, leaving `attr-quotes` enabled.
- Strip the template-internal whitespace that leaks into rendered pages, leaving `no-trailing-whitespace` enabled.
- Move inline presentation out of markup and into stylesheets, leaving `no-inline-style` active.
- Tighten both regions' recorded baselines in the same change and confirm every rule still disabled states why.

## Capabilities

### New Capabilities
- `docs-style`: the documentation site's markup is free of the house-style deviations that would otherwise dominate the validation baseline, so the gate's recorded result reflects correctness rather than churn.

### Modified Capabilities
None. Correctness of the demos is established by `papercss-2x-foundation`; page-chrome semantics are established by `docs-accessibility`. This change covers presentation style only.

## Impact

- Affected markup: `docs/layouts/**`, `docs/content/**`, and shortcode output.
- Affected baseline: `.htmlvalidate-baseline.json` (both regions tightened in the same change).
- No framework CSS or consumer-visible change.
- Depends on `papercss-2x-foundation` for the gate and its per-region baseline. Independent of `docs-accessibility`.
