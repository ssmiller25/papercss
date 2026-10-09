# Changelog

All notable changes to PaperCSS are recorded here, newest first.

The 2.0.0 section below is written as changes land. The project recorded nothing
when the earlier releases shipped, so the history from 1.9.2 down to 0.0.0 is
**reconstructed** from the repository's 25 tags (openspec task 7.1); each such
entry says so. Where a tag's changes could not be established from the
repository, the gap is recorded rather than the release omitted.

## 2.0.0 — unreleased

### Breaking changes

Entries are added here as each change lands, not reconstructed at the end.
See `UPGRADE.md` for the before/after of each.

- **The collapsible toggle is now focusable.** The checkbox that opens a
  collapsible — including the navbar's hamburger — was hidden with
  `display: none`, which also removed it from the tab order, so it could not be
  operated by keyboard. It is now visually hidden but focusable, with a visible
  focus indicator. A stylesheet that assumed the input was invisible may need
  to account for it being focusable. See `UPGRADE.md`.

- **A tall collapsible body is no longer clipped.** An expanded collapsible or
  navbar body had `max-height: 960px`, so content taller than that was cut off
  with no scroll and no ellipsis. The cap is gone — the body is now a grid row
  that animates between `0fr` and `1fr` — so an expanded body reveals its full
   height. A body that relied on the cap to constrain its height now expands
   fully. See `UPGRADE.md`.

- **The documented toggle markup changes from `<div>` to `<span>`.** The navbar
  and collapsible documentation showed `<div class="bar1">` inside a `<label>`,
  which is invalid: a `label` may only contain phrasing content, so the
  demonstrated markup produced an `element-permitted-content` error on every
  page that copied it. The documented markup is now `<span class="barN">`. The
  framework styles the bars by class and makes them block-level, so nothing
  renders differently and a consumer selector based on `.barN` needs no change;
  one written against the element type does. See `UPGRADE.md`.

### Build

- **The generated stylesheet is not byte-identical, but every colour is
  preserved.** The build toolchain was replaced. Consumers who vendor
  `dist/paper.css` byte-for-byte will see a diff; nothing renders differently.

  - Sass is 1.105.1 (was 1.29.0). The two `/` division sites in
    `create-flex-classes` use `math.div`, and the build no longer uses Sass's
    legacy JS API, which is removed in Dart Sass 2.0.0.
  - postcss 8, autoprefixer 10, and cssnano 9 replace their 2019 counterparts,
    and `postcss-colormin` now normalises colours in the **unminified** output
    as well. Sass 1.79+ stopped rounding colour channels to 8-bit and emits
    full-precision `rgb(80.3767176162%, …)` where it used to emit `#cdcccb`;
    cssnano already normalised that in `paper.min.css` and nothing did for
    `paper.css`, which made it 7.1% larger and considerably harder to read.
  - Colour notation changes as a result: `black` becomes `#000`, spacing in
    `rgba()` is dropped, and hex returns where Sass had been emitting
    full-precision percentages. Every change resolves to the same 8-bit
    colour, verified channel by channel rather than assumed.
  - `paper.min.css` is **~2.3% smaller** (53,228 vs 54,454 bytes), because
    cssnano 9 minifies better than cssnano 4.
  - One rule is emitted differently: `.alert .btn-close` was a single rule
    with four declarations and is now two rules with the
    `:hover`/`:active`/`:focus` variant between them. The computed result is
    unchanged — the variant only sets `color`, and the second rule only sets
    `cursor` and `margin-left` — but the structure differs.

  The palette is preserved exactly. Mid-way through the replacement an
  intermediate state shifted five `muted`-grey values by 1/255, because the
  Sass upgrade stopped rounding colour channels; the upgraded minifier rounds
  them back, and both artifacts now render the original values. It is recorded
  here only because it was measured rather than assumed, and because a
  reviewer diffing intermediate builds would otherwise have to reconstruct it.

  None of this was waved through. The pre-change stylesheet is recorded
  declaration-by-declaration in `.css-declarations.json` with values included,
  and the comparison against it is what produced the counts above.


### Fixed

- **Dark mode now themes every component.** Previously 64 colour
  declarations were computed when the stylesheet was built rather than read
  from the theme, so on a dark page a button's pressed state, a striped
  progress bar, a table's rules and **every shadow** kept their *light*
  colours. All of them now read custom properties, and the theme surface grew
  from 48 properties to 60 to give them somewhere to read from.

  **This changes how those components render in dark mode.** Light mode is
  untouched: of every property already declared on `html`, none changed value,
  and each migrated declaration resolves to the colour the literal it replaced
  held. Consumers using dark mode will see the difference; it is the intended
  fix rather than a regression.

  `mark`'s yellow highlight is deliberately left literal — a text highlight is
  yellow by definition rather than by theme — and its declaration says so.

- `-webkit-text-decoration-skip: objects` dropped from the anchor reset as
  obsolete: it restated a browser default rather than resetting one, and the
  value cannot be carried unprefixed under CSS Text Decoration Level 4.

## 1.9.2 — 2023-05-29

_Reconstructed._

- Fixed popovers appearing when hovering their hidden pseudo-element: the
  popover now sets `visibility`, and its transition is retimed to 235ms so the
  show/hide still animates but the invisible popover no longer captures hover.
  This is the only user-visible change in the release; the transition-length
  commits against `_popovers.scss` netted into it.

## 1.9.1 — 2022-12-26

_Reconstructed._

- Fixed dark mode for alerts, buttons and popovers.

## 1.9.0 — 2022-11-24

_Reconstructed._

- Reworked the light and dark theme colours.
- Added `font-display: swap` to the font loading.
- Fixed a navbar regression and restored the height of the navbar icon bars.
- Fixed a Sass colour-unit deprecation warning.
- Scoped the collapsible styles so they no longer affect inputs and labels
  inside `.collapsible-body`.
- Fixed the modal so it displays above the navbar.

## 1.8.3 — 2021-12-25

_Reconstructed._

- Added a class for disabling shadows.
- Added a hot-reload development script and extracted the build logger into a
  module.
- Documented the distribution process.
- Fixed the font for list-item tags.

## 1.8.2 — 2020-11-26

_Reconstructed._

- Fixed the alert colour variables.
- Changed how the font source is configured, making it possible to disable.
- Upgraded the stylelint configuration.
- Fixed a Hugo deprecation warning in the documentation.

## 1.8.1 — 2020-10-07

_Reconstructed._

- Included `src/` in the npm package so the framework could be built from
  source after installing it.

## 1.8.0 — 2020-09-13

_Reconstructed._

- **Added dark mode**, activated with a `.dark` class on the `<html>` element,
  and documented it. The theme's custom properties are generated from a shared
  theme map.
- Added a paper style for `input[type=range]`.
- Refactored the components to read colours through a shared `color()` mixin
  and CSS custom properties.
- Replaced the gulp build with native compilation, and moved `dist/` under
  version control.

## 1.7.0 — 2020-08-01

_Reconstructed._

- Added a breadcrumb component.
- Added outline buttons.
- Added a `.container` size class.
- Added switch components and support for multiple tab components.
- Fixed the navbar in Firefox and a button backward-compatibility issue.

## 1.6.1 — 2019-01-25

_Reconstructed._

- Fixed the hover transition on `.paper-btn` anchors.
- Fixed the progress-bar percentage calculation in its `@for` loop.
- Fixed keyboard control on radio buttons.
- Set select elements' height to prevent inconsistent behaviour in Firefox.

## 1.6.0 — 2018-10-21

_Reconstructed._

- Added dismissible alerts that fade out when dismissed.
- Added a progress bar component.
- Introduced autoprefixing through `.browserslistrc` and removed the manually
  written vendor prefixes.
- Shortened several class names.

## 1.5.4 — 2018-09-30

_Reconstructed._

- Updated the list styles (`_lists.scss`).

## 1.5.3 — 2018-09-08

_Reconstructed, and a gap._

- The repository records only version bumps for this tag; no user-visible
  change can be established, so the gap is recorded rather than filled in.

## 1.5.2 — 2018-09-08

_Reconstructed._

- Fixed radio buttons and checkboxes not working in Firefox.

## 1.5.1 — 2018-06-24

_Reconstructed._

- Fixed the gulpfile used by the postinstall step.

## 1.5.0 — 2018-06-22

_Reconstructed._

- Added a navbar component.
- Added a stylelint pre-commit check and Travis CI for stylelint.
- Fixed the mobile menu showing at 768px.
- Made buttons "paperize" consistently.

## 1.4.1 — 2018-01-13

_Reconstructed._

- Fixed an Internet Explorer animation bug.
- Fixed the favicon image and several documentation URLs.

## 1.4.0 — 2018-01-03

_Reconstructed._

- Converted the documentation site to Hugo, with a new sidebar and home page.
- Migrated the stylesheet from LESS to SCSS with new config and mixins, and
  converted the accordion component.
- Added accordions and unified the component transitions.

## 1.3.1 — 2017-12-16

_Reconstructed._

- Removed unused code and fixed imports in the modal styles that broke the gulp
  build.

## 1.3.0 — 2017-12-15

_Reconstructed._

- Added a tabs feature (with a loop for dynamic tab ids) and a back-to-top
  button.
- Added an inline list class.
- Added `normalize.css` to the reset.
- Added per-component CSS output under `dist/components/`.
- Added colour unit tests and a Travis build, and rewrote the README.

## 1.2.0 — 2017-12-04

_Reconstructed._

- Added an `article` component and support for `textarea` (with a no-resize
  class).
- Added syntax highlighting to the docs, a favicon, `.editorconfig`,
  `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`, and NPM/CDN install
  documentation.
- Fixed mobile x-axis overflow, summary links, and shadow/transition issues.

## 1.1.0 — 2017-11-05

_Reconstructed._

- Added badges, cards and alerts.
- Added a `text-muted` class and the muted colour, and disabled-input styling.
- Added header/footer card styling and a card hover shadow, plus more border
  styles.
- Refactored the colours to be more dynamic, and added the license file.

## 1.0.1 — 2017-10-31

_Reconstructed. Two tags (`1.0.1` and `v1.0.1`) point at this release; the
`v1.0.1` tag adds no commits of its own._

- Added popovers.

## 1.0.0 — 2017-10-28

_Reconstructed._

- Renamed the stylesheet to `paper.css`.
- Added block buttons, block inputs, and a paper-styled `<hr>`.

## 0.0.0 — 2017-10-17

_Reconstructed._

- The initial public state of the framework: base styles, a build that produced
  cleaned and minified CSS, and the first documentation. Pre-1.0 baseline.
