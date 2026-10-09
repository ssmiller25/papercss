# Changelog

All notable changes to PaperCSS are recorded here, newest first.

Every release the project has tagged should have an entry. The 1.x history is
reconstructed from the repository's 25 tags rather than written from memory;
that work is tracked as openspec task 6.1 and the entries there are marked as
reconstructed.

## 2.0.0 — unreleased

### Breaking changes

Entries are added here as each change lands, not reconstructed at the end.
See `UPGRADE.md` for the before/after of each.

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
