# Design

## Context

See `proposal.md` for motivation. The constraints that shape the approach:

- **No package registry.** Consumers obtain the stylesheet from a GitHub Release
  zip or from open CDNs (jsDelivr, Statically) that serve the tagged repository
  tree. So any asset the stylesheet loads at runtime must sit next to it in
  `dist/`, committed at the tag, or the CDN resolves it to a 404.
- **A single stylesheet is the product.** `dist/paper.css` and
  `dist/paper.min.css` are the released artifacts; `README.md` calls `paper.css`
  self-contained. There is no second stylesheet and no `fonts` folder today.
- **The build writes one CSS file to two places** (`build/constants.js`):
  `dist/paper.css` and `docs/static/assets/paper.css`. The docs load the latter.
- **The config surface is load-bearing.** `_config.scss` declares `$font-src`
  (`false` by default) with an `@if $font-src { @import url($font-src) }`, and
  `check-config-override.mjs` guards that an assignment before `@import` still
  wins. `$body-font`/`$header-font` already name the typefaces; the built stack
  is already `"Neucha", sans-serif`, so only the `@font-face` rules are new.
- **A recorded declaration baseline** (`make check-declarations`) must be updated
  whenever the built CSS gains declarations.

Both fonts are SIL OFL 1.1 (Neucha by Jovanny Lemonad; Patrick Hand SC), which
permits redistribution provided the licence text and copyright notice travel
with the files. Sizes are small: the Latin `woff2` subsets are 11.9 KB and
14.3 KB.

## Goals / Non-Goals

**Goals:**

- A drop-in consumer gets the framework's typefaces with no extra step, from the
  same source they already chose for the CSS, and no request to Google.
- The existing configuration still works: a source consumer can disable the
  bundled typefaces or redirect them to another source, unchanged.
- The release is complete and verifiable: fonts are published, committed at the
  tag, attested, and covered by the release-consistency gate.

**Non-Goals:**

- No data-URI embedding, no second opt-in stylesheet, no change to the
  `@import`-based configuration mechanism.
- No modification or re-subsetting of the fonts beyond the subsets their
  upstream already publishes.

## Decisions

### D1. Ship the typefaces as external `woff2`, not data-URIs

The files sit in `dist/fonts/` and are referenced by relative `url()`. Chosen
over a base64 embed (the rejected Option B): separate files stay cacheable
across pages and across sites that share the same CDN URL, keep `paper.css`
readable and small (~0 KB added to the CSS body), and preserve `unicode-range`
so a page fetches only the subset it needs. The cost is that `paper.css` is no
longer literally single-file, which the README wording must stop claiming.

### D2. Bundled and on by default, not a separate opt-in stylesheet

The framework's identity is the draw, so the default must render in it (the
rejected Option C). Because the files are served from the same origin as the
stylesheet, this reintroduces no *unrequested* third party — the constraint that
made 2.0 turn fonts off is preserved.

### D3. `url()` is relative, so one stylesheet works from every origin

`@font-face { src: url('fonts/neucha-latin.woff2') }` resolves next to whatever
`paper.css` is served from: `dist/fonts/` on a CDN, `/assets/fonts/` in the
docs, the extracted folder for a Release download. Absolute CDN URLs were
rejected (the rejected Option D): they re-couple the stylesheet to a host and a
tag.

### D4. Keep `$font-src`; change only its default

The non-breaking way to preserve the config surface is to keep the variable and
its two existing meanings, and change only what the default resolves to:

```
$font-src: 'bundled' !default;   // was: false

@if $font-src == false        -> emit no @font-face (opt out; unchanged meaning)
@else if $font-src == 'bundled' -> emit bundled @font-face (new default)
@else                         -> @import url($font-src) (redirect; unchanged meaning)
```

A consumer who set `$font-src: false` to disable still disables; one who set a
URL still redirects. Only the untouched default flips, which is the intended
fix. A new `$font-embed` flag was considered and rejected: it leaves
`$font-src: false` a silent no-op, so disabling would break instead.

### D5. Ship the subsets each family already publishes

Neucha: Cyrillic + Latin. Patrick Hand SC: Vietnamese + Latin-ext + Latin. Each
`@font-face` carries the upstream `unicode-range`, so only the needed subset is
fetched. Shipping the Latin subset alone was rejected because the spec requires
on-demand fetch for extended characters, and these two faces cover non-Latin
scripts.

### D6. The licence travels as its own file beside the fonts

`OFL.txt` (the full OFL 1.1 text) and the two copyright lines ship in the fonts
directory, distinct from the project's `LICENSE.md` (ISC). The `src/` source
archive already tars `src`, so committing the fonts under `src/fonts/` puts them
in the source distribution for free; the build copies them (and the licence) to
`dist/fonts/` and `docs/static/assets/fonts/`.

### D7. The docs load the framework's own copy

`docs/layouts/partials/head/includes.html` drops the Google link. The docs load
`/assets/paper.css` whose `@font-face` already points at `/assets/fonts/`, so no
extra head link is needed — the showcase exercises exactly the consumer path.

## Risks / Trade-offs

- **A consumer who added their own Google link now double-loads** → Recorded as
  a non-breaking note in the `2.0.1` changelog and a README line; nothing errors,
  and removing the link is the fix.
- **Fonts attached to the Release but not committed at the tag → CDN 404** →
  Extend `check-release.mjs`, `check-cdn.mjs`, `write-provenance.mjs`, and
  `check-signing.mjs` to include the font files and licence, so the gates fail
  before publication rather than after.
- **`make check-declarations` fails on the new `@font-face` declarations** →
  Re-record the baseline in the same change (an intended output change), and the
  equivalence check continues to guard declaration *values*.
- **The binary font files are committed inputs, not generated** → They are never
  rebuilt, so reproducibility is unaffected; they are copied verbatim.
- **jsDelivr caches a tagged file permanently** → The relative path references
  only the released, committed filenames; a corrected release uses a new tag,
  which the existing CDN policy already requires.

## Migration Plan

Non-breaking patch. No consumer action is required. The one affected group —
consumers who added the Google `<link>` from the 2.0 `UPGRADE.md` — is told in
the changelog to remove it. Rollback is reverting the change and cutting a new
tag; there is no state to migrate.
