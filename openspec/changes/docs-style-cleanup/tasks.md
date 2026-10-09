# Tasks

## 1. Attribute quoting

- [ ] 1.1 Convert single-quoted attributes to double quotes across `docs/layouts/**` and `docs/content/**`, and verify `attr-quotes` reaches zero with the rule left enabled

## 2. Whitespace

- [ ] 2.1 Strip the template-internal whitespace that leaks into rendered pages, and verify `no-trailing-whitespace` reaches zero

## 3. Inline presentation

- [ ] 3.1 Move inline presentation out of documentation markup into stylesheets, and verify `no-inline-style` reaches zero

## 4. Baseline

- [ ] 4.1 Tighten both regions' recorded baselines in this same change, and verify a deliberately introduced violation fails the documentation gate
- [ ] 4.2 Verify every rule still disabled in the committed configuration states why it is disabled
