# Upgrading PaperCSS

What changed between 1.9 and 2.0, and what to do about it.

This is written as changes land rather than reconstructed at the end, so it can
be ahead of a given commit. `CHANGELOG.md` records what has actually shipped;
this records what to do about it.

Each section states what something was, what it is now, why it changed, and the
substitution a consumer needs to make. If you find one out of step with the
release, that is a defect in this file.

## 2.0.0

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
