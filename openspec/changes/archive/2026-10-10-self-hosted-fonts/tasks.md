# Tasks

## 1. Font assets and licence

- [x] 1.1 Add `src/fonts/` and download the upstream `woff2` subsets into it: Neucha (cyrillic, latin) and Patrick Hand SC (vietnamese, latin-ext, latin). Verify each is a valid `woff2` (`file src/fonts/*.woff2` reports Web Open Font Format) and that the set matches the `unicode-range`s in the Google CSS.
- [x] 1.2 Add `src/fonts/OFL.txt` with the SIL OFL 1.1 text and a header naming each font's copyright line (Neucha, Jovanny Lemonad; Patrick Hand SC), kept separate from the project's `LICENSE.md`. Verify both copyright lines are present and the file is not the ISC licence.

## 2. Source: bundled `@font-face` and the config default

- [x] 2.1 In `src/core/_config.scss`, change `$font-src` to default to the bundled sentinel and branch the existing import: `false` emits nothing (opt out), the sentinel emits the bundled `@font-face`, any other value `@import url($font-src)` (redirect). Verify `node scripts/check-config-override.mjs` still passes (the `$primary` contract is untouched).
- [x] 2.2 Add a partial (e.g. `src/content/_font-face.scss`) that emits one `@font-face` per bundled subset with a relative `url('fonts/<name>.woff2')` and the upstream `unicode-range`, gated on the `$font-src` branch; import it from `src/styles.scss`. Verify `npm run css:build` emits the `@font-face` rules with relative `url()` and no `fonts.googleapis.com`.
- [x] 2.3 Extend `scripts/check-config-override.mjs` (or add a sibling check) to assert: the default build emits the bundled `@font-face`; `$font-src: false` emits none and the stack falls back; a URL value emits an `@import url(...)`. Verify the check fails when the default `@font-face` is removed.

## 3. Build: publish fonts beside the stylesheet

- [x] 3.1 Add the font destination paths to `build/constants.js` (`dist/fonts/`, `docs/static/assets/fonts/`) and copy `src/fonts/*` (including `OFL.txt`) to both from `build/build.js`, alongside the existing CSS writes. Verify `npm run css:build` leaves all subset files and `OFL.txt` in both `dist/fonts/` and `docs/static/assets/fonts/`.
- [x] 3.2 Re-record the generated stylesheet's declaration baseline with `make check-declarations-update`, and confirm the diff is only the new `@font-face` declarations. Verify `make check-declarations` passes and reports no other change.

## 4. Docs load their own copy

- [x] 4.1 Remove the Google Fonts `<link>` from `docs/layouts/partials/head/includes.html`; the already-linked `/assets/paper.css` now supplies (and references) the fonts. Verify no `fonts.googleapis.com`/`fonts.gstatic.com` reference remains under `docs/` and `make check-docs` passes.

## 5. Release surface covers the fonts

- [x] 5.1 Add the font files and `OFL.txt` to the released artifact set in `scripts/check-release.mjs`, `scripts/write-provenance.mjs`, `scripts/check-cdn.mjs`, and `scripts/check-signing.mjs`, and to `files=` and `subject-path:` in `.github/workflows/release.yml`. Verify `make check-release` fails if a font file is removed from `dist/fonts/`, and passes when present.
- [x] 5.2 Confirm the release-check completeness path treats a missing referenced typeface as an incomplete set. Verify by deleting one `dist/fonts/*.woff2` and observing `make check-release` fail with a font-named error.

## 6. Release documents and the README claim

- [x] 6.1 Add a `## 2.0.1` changelog section recording the default-font change as non-breaking, and a note for consumers who added the 2.0 Google `<link>` (remove it). Verify `node scripts/check-release.mjs` accepts the `2.0.1` section, and that `docs/data/release.json` and `package.json` agree on `2.0.1`.
- [x] 6.2 Correct the `README.md` "self-contained" wording to state that `paper.css` is self-contained apart from the typeface files it ships beside, and note that the intended look needs no extra step. Verify `make check-consumption` still passes (no registry path introduced).

## 7. Integration

- [x] 7.1 Run `make check` end to end and confirm every gate passes with the bundled fonts in the tree. Verify by inspecting the final summary output for a clean pass of build, lint, declarations, theme, docs, consumption, release, and browser checks.
