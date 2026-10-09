# Upgrading PaperCSS

What changed between 1.9 and 2.0, and what to do about it.

This is written as changes land rather than reconstructed at the end, so it can
be ahead of a given commit. `CHANGELOG.md` records what has actually shipped;
this records what to do about it.

Each section states what something was, what it is now, why it changed, and the
substitution a consumer needs to make. If you find one out of step with the
release, that is a defect in this file.

## 2.0.0

The following changes can alter a page that upgrades to 2.0. Each states its
before, its after, why, and what to do.

### The documented toggle markup changes from `<div>` to `<span>`

**What it was.** The navbar and collapsible toggle bars were documented as
`<div class="bar1">`, `<div class="bar2">`, `<div class="bar3">` inside a
`<label>`.

**What it is now.** The documented markup uses `<span class="bar1">` and so on.
The framework styles the bars by class, not by element, so the stylesheet is
unchanged.

**Why.** A `<label>` may only contain phrasing content, so a `<div>` there is
invalid HTML. The framework was teaching markup that produced an
`element-permitted-content` error on every page that copied it — one downstream
theme accumulated 96 such errors across 24 pages. PaperCSS only ever styled
`.barN` by class, so the element type was never load-bearing.

**What to do.** Change the element type in your markup.

Before:

```html
<label for="collapsible">
  <div class="bar1"></div>
  <div class="bar2"></div>
  <div class="bar3"></div>
</label>
```

After:

```html
<label for="collapsible">
  <span class="bar1"></span>
  <span class="bar2"></span>
  <span class="bar3"></span>
</label>
```

The styling is identical. If your own CSS selects the bars by element — for
example `label div` — update it to target `.barN`; a selector already based on
the class needs no change.

### The collapsible toggle is now focusable

**What it was.** The checkbox that drives a collapsible
(`input[id^=collapsible]`) was hidden with `display: none`.

**What it is now.** It is visually hidden but still focusable, and shows a focus
indicator. Operating it with the keyboard opens and closes the body.

**Why.** `display: none` removes an element from the tab order, so the navbar's
hamburger and every collapsible were unreachable without a pointer. Keeping a
control off-screen must not remove it from the tab order.

**What to do.** Usually nothing. If your stylesheet targeted the input expecting
it to be invisible, account for it now being focusable — it is hidden
off-screen, not `display: none`. The identifier contract
(`input[id^=collapsible]`) is unchanged, so markup that worked before still
works.

### A tall collapsible body is no longer clipped

**What it was.** An expanded collapsible body had `max-height: 960px`.

**What it is now.** There is no fixed cap; an expanded body reveals its full
height while the open/close transition still animates.

**Why.** Any body taller than 960px had its content cut off with no scroll and
no ellipsis — content was lost silently.

**What to do.** Usually nothing. If you relied on the 960px cap to constrain a
body, set your own `max-height` on `.collapsible-body` (or its content) to get
that behaviour back.

### The framework no longer loads Google Fonts by default

**What it was.** The shipped stylesheet contained a Google Fonts
`@import url(...)`, so every consumer's page blocked rendering on a third-party
request.

**What it is now.** The default is off: the stylesheet initiates no remote font
request. A consumer can opt back in through the documented configuration.

**Why.** A distributed framework should not add a render-blocking third-party
request the consumer did not ask for. Making it opt-in is the correct default.

**What to do.** If you relied on PaperCSS to load the fonts, load them yourself:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC"
/>
```

or, when building from source, set the font source before importing `styles`
(see `$font-src` in `src/core/_config.scss`). If you do not use the framework's
fonts, nothing changes.

### Dark mode now themes every component

**What changed.** Dark mode used to theme only the *base* colours of each
component. Colours derived from them — a button's pressed state, the dark stripe
in a striped progress bar, table rules, and every shadow — were computed when
the stylesheet was built, so they were fixed to their light-theme values and
stayed that way in dark mode. On a dark page you got light-themed pressed
buttons, light stripes and light shadows.

Those now read from the theme, so they follow it. The changes, in full:

- **Activation is unchanged.** Dark mode is still the `.dark` class on the
  `<html>` element, and nothing else. If it worked before it works now.
- **The property surface grew, and nothing was removed.** 48 custom properties
  to 60. Every property that existed still exists with the same value in both
  themes, so if you override `--primary` or any other existing property, nothing
  about that changes.
- **Component rendering changed, in dark mode only.** Pressed buttons, striped
  progress bars, table rules, the `~~~` that follows an `hr`, and shadows now
  follow the active theme where before they did not.
- **Light mode is unchanged.** Verified value for value: no property declared on
  `html` changed, and every migrated declaration resolves to exactly the colour
  the literal it replaced held.

**What to do.** Usually nothing. If you have overridden a shadow or written dark
mode overrides of your own *because* those components were wrong, re-check them
against the new rendering and remove the overrides if they are now redundant.

If you ship a custom theme — your own values for the properties in `_config.scss`
— the twelve new properties are additive, so an existing theme keeps working.
To theme the new ones, add them alongside the others; the twelve are
`--{primary,secondary,success,warning,danger,muted}-light-dark`,
`--primary-light-25`, `--primary-light-30`, `--primary-light-60`,
`--shadow-color-strong`, `--modal-backdrop` and `--range-shadow-color`.

**One deliberate exception.** `mark`'s yellow highlight stays a literal colour.
A text highlight is yellow by definition rather than by theme, so it is not
themed, and its declaration says so.

### Not a breaking change: the build toolchain

The build toolchain was replaced (Sass, PostCSS, autoprefixer, cssnano,
stylelint). This is **not** a breaking change for consumers. The Sass
configuration mechanism is unchanged, so a consumer who configures the palette
by assigning a value before `@import 'styles'` needs no change.

The generated stylesheet is not byte-identical — the new minifier and colour
normaliser emit different notation — but every colour resolves to the same
value and nothing renders differently. See `CHANGELOG.md` for the details.
