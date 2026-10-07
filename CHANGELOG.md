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

- **The generated stylesheet is no longer byte-identical.** Replacing the
  build toolchain changes formatting, colour notation and one rule's
  structure, none of which is a visual change. This matters to consumers who
  vendor `dist/paper.css` byte-for-byte and will therefore see a diff:

  - Sass is now 1.105.1 (was 1.29.0), and the two `/` division sites in
    `create-flex-classes` use `math.div`.
  - The build no longer uses Sass's legacy JS API, which was deprecated and
    is removed in Dart Sass 2.0.0.

  The toolchain replacement altered **122 recorded differences** against the
  pre-change stylesheet: one rule was split in two, and 121 declarations
  changed value. Of those 121:

  - **116 are notation only** — `#cdcccb` becomes
    `rgb(80.3767176162%, ...)`, `rgba(0, 0, 0, 0.2)` becomes
    `hsla(0, 0%, 0%, 0.2)`, `gray` becomes `rgb(50%, 50%, 50%)`. Each
    resolves to the same colour at 8-bit precision, verified channel by
    channel rather than assumed.
  - **5 are genuine 1/255 shifts**, all in `muted` greys, in both themes:

    | Value | Was (8-bit) | Now (8-bit) |
    |---|---|---|
    | `--muted-light-10` | `#a1a8ae` (161, **168**, 174) | (161, **167**, 174) |
    | `--muted-dark-10` | `#6c757d` (108, **117**, 125) | (108, **116**, 125) |
    | `--muted-text` | `#6c757d` (108, **117**, 125) | (108, **116**, 125) |

    The cause is Sass 1.79+ truncating colour percentages to 12 significant
    digits: the green channel of the true value is exactly `167.5`, and the
    truncated percentage resolves to `167.49999999999`, which rounds down to
    167 where the exact value rounds to 168. The change is not perceptible
    (ΔE ≈ 0.1), and it is accepted rather than avoided by pinning a
    two-year-old compiler. It is recorded here because the palette was
    previously documented as preserved exactly, which is no longer true.

  - **One rule is split.** `.alert .btn-close` was emitted as a single rule
    with four declarations; it is now two rules with the `:hover`/`:active`/
    `:focus` variant between them. The computed result is unchanged — the
    variant only sets `color`, and the second rule only sets `cursor` and
    `margin-left` — but the emitted structure differs, which is a change a
    stylesheet author could observe.

  This difference was not waved through. The pre-change stylesheet is
  recorded declaration-by-declaration in `.css-declarations.json` with values
  included, and the comparison is what produced the counts above.

### Fixed

- `-webkit-text-decoration-skip: objects` dropped from the anchor reset as
  obsolete: it restated a browser default rather than resetting one, and the
  value cannot be carried unprefixed under CSS Text Decoration Level 4.
