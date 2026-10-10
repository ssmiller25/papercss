# Proposal

## Why

PaperCSS's hand-drawn typefaces are a large part of what the theme *is*, but 2.0
removed the stylesheet's font `@import` without replacing it, so a consumer who
drops in `paper.css` and changes nothing gets `sans-serif` — the framework no
longer looks like itself out of the box. The 2.0 decision was right to stop
making an unrequested, render-blocking request to Google; it was wrong to leave
the identity of the theme behind as an opt-in step in a migration note.

This change restores the out-of-box look the safe way: the framework ships its
own copy of the fonts and loads them by default from the same source as the
stylesheet, so there is no *new* third party and no Google. A consumer who wants
the look does nothing; a consumer who does not can still say no.

## What Changes

- **Ship the framework's two typefaces first-party.** Neucha and Patrick Hand SC
  are added to the repository as subset `woff2` (with `unicode-range`), built to
  `dist/fonts/`, and included in the release artifact set. Both are licensed
  SIL OFL 1.1, which permits redistribution; the licence text and each font's
  copyright notice ship alongside the files, as the licence requires.
- **Load the fonts by default.** The default build emits `@font-face` rules
  whose `url()` resolves relative to the stylesheet, so fonts are fetched from
  the same origin the consumer already chose for the CSS — jsDelivr for a CDN
  consumer, the site origin for the docs, the extracted files for a Release
  download. The body stack becomes `'Neucha', sans-serif` and the heading stack
  `'Patrick Hand SC', sans-serif`. No Google, no host the consumer did not ask
  for.
- **Keep the configuration surface working.** A consumer building from source
  can still point `$font-src` at an alternate source, or turn the bundled fonts
  off. Being able to disable or redirect the fonts is preserved; only the
  *default outcome* changes. Exact variable semantics are a design decision.
- **Point the documentation at this repository's own copy** instead of
  `fonts.googleapis.com`, so the showcase demonstrates the path consumers take.
- **Record the release as `2.0.1`.** This is a patch: no selector is removed or
  renamed, no directive is needed, and no consumer's build stops working. The
  default outcome changes for a consumer who did nothing, which is the intended
  fix, and is recorded as a non-breaking change with a note for the one group it
  touches (see Impact).

### Not in this change

- No second stylesheet and no data-URI embedding. Fonts ship as files beside the
  stylesheet; the `paper.css` / `paper.min.css` names, entry points, and
  consumption paths are unchanged.
- No change to the `@import`-based configuration mechanism itself.

## Capabilities

### New Capabilities

- `web-fonts`: How the framework supplies its typefaces to a consumer — shipped
  with the distribution, served first-party by default, subset for the scripts
  in use, licensed with the notice that must travel with the files, and
  refuseable or redirectable by a consumer building from source.

### Modified Capabilities

- `build-verification`: The published artifact set, and the completeness gate
  that ties it to what the documentation says to obtain, must now include the
  font files and their licence, and the release must serve and attest them from
  the tagged repository tree like the stylesheets.
- `release-documentation`: The release history gains a `2.0.1` entry for the
  changed default, and the documentation's font link must target an artifact
  this repository publishes rather than a third party's.

## Impact

- **Behaviour, not breakage.** A consumer who adopted `2.0.0` and did nothing
  will start fetching the bundled fonts and rendering in Neucha; one who
  followed `UPGRADE.md` and added their own Google `<link>` will now load fonts
  twice and should remove that link. Nothing errors in either case. This is the
  one observable change and is why this is a patch *release* rather than a
  patch-only fix; it is documented in the `2.0.1` changelog entry and a short
  README note rather than in `UPGRADE.md`, which covers major upgrades.
- **Reconciles with `component-contract`.** Its requirement that the stylesheet
  not block on an unrequested third-party host is preserved: the font files are
  served by the same source the consumer already chose for the stylesheet, which
  is not an *unrequested* host. Its configuration-surface requirement is
  preserved by keeping `$font-src` settable.
- **Affected code.** `src/core/_config.scss` (font defaults), a new or extended
  `src/content/_fonts.scss` (`@font-face`), the font binaries, `build/build.js`
  and `build/constants.js` (copy fonts to `dist/fonts/` and the docs assets
  path), `docs/layouts/partials/head/includes.html`, `README.md`, `CHANGELOG.md`,
  the licence notice, `scripts/check-release.mjs` (artifact set),
  `.github/workflows/release.yml` (published files and attestation subjects), and
  the recorded output baseline that `make check-declarations` compares against
  (the new `@font-face` and font-stack declarations).
- **Licensing.** `LICENSE.md` stays the project's ISC licence; the fonts' OFL
  text and copyright lines are added as their own notice so the two are not
  conflated.
