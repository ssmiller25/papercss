# Proposal

## Why

This repository is being forked to become PaperCSS 2.x. The reason is concrete: a downstream consumer — the `r15-papercss-hugo-theme` Hugo theme — has been forced to carry a permanent CSS override layer to work around four defects that live here and cannot be fixed from outside. Every one of them is a bug in this framework, not a misunderstanding of it.

The four, all confirmed against a built stylesheet:

1. **The collapsible toggle is unreachable by keyboard.** `_accordion.scss:24-25` sets `> input { display: none }`. That removes the control from the tab order entirely, so the navbar's hamburger and every `collapsible` cannot be operated without a pointer. It is a load-bearing rule for the click-to-toggle pattern and cannot simply be deleted, but `display: none` is the wrong way to keep it off-screen.
2. **The framework documents invalid markup.** The navbar docs tell users to put `<div class="bar1">` inside a `<label>`. A `label`'s content model is phrasing content, so a `div` is not permitted there. The theme hit this as 96 `element-permitted-content` errors — 4 on every one of its 24 pages, all from this one documented pattern. PaperCSS only ever *styles* `.bar1/.bar2/.bar3` by class, so nothing requires them to be `div`s.
3. **`padding: none` is not a valid CSS value.** `_navbar.scss:140`. Browsers drop the declaration silently, so the rule appears to work and does nothing.
4. **Tall collapsible bodies are clipped.** `_accordion.scss:33` and `_navbar.scss:125` both set `max-height: 960px` when expanded. Any body taller than 960px is cut off with no scroll and no ellipsis — silently losing content. There is a clean upstream PR open against this and it has sat unmerged.

Two further problems surfaced while building the verification pipeline, and both are prerequisites rather than nice-to-haves:

5. **The documentation site cannot be built by a supported Hugo.** `docs/config.toml` sets `defaultMarkdownHandler = "blackfriday"`, removed in Hugo 0.100. The repo therefore pins `hugo-bin@^0.62.3`, which resolves to a July 2020 build. The docs are this framework's primary teaching surface and they are pinned to an EOL toolchain because of one config line.
6. **There are no quality gates at all.** `.github/` contains a pull-request template and nothing else. `npm run lint` exists and passes, but nothing runs it automatically; `dist/` is tracked in git with no check that it matches `src/`; and no gate would notice that `padding: none` is not a value. The four defects above are all exactly what such a gate should have caught.

So the fork is not a fork of convenience — it is four upstream bugs plus a documentation site that cannot be rebuilt on a current toolchain.

One more thing surfaced while planning the toolchain work:

7. **The dark theme has no safety net.** `src/core/_config.scss` computes both themes with 56 `darken()`/`lighten()` calls, every component reads the result through `var(--…)`, and there is no per-component dark styling — so there is also nothing that would catch a loss. One missing custom property degrades every component reading it, and no gate notices, because a missing custom property is not invalid CSS.

Those calls are deprecated with removal targeted at Dart Sass 3.0.0, so nothing is at risk on the current toolchain — the palette compiles as before and warns. That is precisely why it needs a gate rather than a deadline: the failure mode is silent by construction, so it will not announce itself when 3.0.0 lands, and by then the migration will be someone else's problem. Recording every theme property with its resolved value turns "did the theme survive this upgrade" from a judgement call into a build result.

That is the whole thesis of this change in miniature — a shipped artifact that looks fine and is wrong — which is why the theme gets its own recorded baseline rather than a line in a review checklist.

## What Changes

**Verification pipeline (lands first, on its own)**
- One `make check` entry point that runs every gate, wired to CI so the two cannot drift.
- A gate on the **generated stylesheet**, not only the SCSS source. `stylelint` over `src/` passes today and never would have caught `padding: none`; a correctness ruleset over `dist/paper.css` does, via `declaration-property-value-no-unknown`.
- A gate on the **generated documentation HTML**, with a recorded per-rule baseline that fails only on regression — the same ratchet the downstream theme now uses.
- Build determinism: build twice, require byte-identical output.
- `dist/` in sync with `src/`: rebuild and require no git diff, so a hand-edited stylesheet cannot ship.
- Pin every tool. `hugo-bin` is removed in favour of a Hugo pinned in the devcontainer, and the linters are pinned exactly.

**Documentation toolchain (prerequisite for the above)**
- Move `docs/` off blackfriday to goldmark, unblocking any supported Hugo.

**Framework defect fixes (specified here, landing after the pipeline)**
- Replace `display: none` on the collapsible input with a visually-hidden pattern that keeps the toggle focusable and shows a focus indicator.
- Correct the height cap so an arbitrarily tall collapsible body is fully visible, modelling the pending upstream approach rather than inventing a third one.
- Correct `padding: none`.
- Change the documented toggle markup to `<span class="barN">` and update the SCSS so the framework teaches valid HTML.
- Stop inlining a render-blocking Google Fonts `@import` into the shipped stylesheet by default.

**Reference-implementation markup**
- Treat `docs/` as the reference implementation rather than incidental sample code, and drive its `lang`, landmark, form-labelling, and duplicate-id defects to zero.
- Split the documentation gate so the *live demos* are validated separately from the surrounding page chrome, each with its own recorded ceiling, since a consumer copies the demo rather than the template.

**Build toolchain modernization**
- Replace the 2019 toolchain with maintained equivalents: sass, postcss, autoprefixer, cssnano, stylelint and its configuration, and the lockfile format.
- Move to the current Sass 1.x. The only construct Dart Sass 2.0 actually removes is `/` division, and this repository has two sites, both in `create-flex-classes`; `@import` and the global built-ins are deprecated with removal targeted at 3.0.0.
- Migrate the 76 deprecated global built-in calls (`lighten`, `darken`, `map-get`, `map-keys`, `str-slice`, `str-index`, `str-length`) off the global namespace, leaving `@import` in place. The ~186 remaining `@import` deprecation warnings are accepted rather than cleared. Note the colour calls cannot use the suggested `color.adjust`, which does not clamp the way `lighten`/`darken` do — see the design.
- Replace the two-stylelint workaround with one project-local linter, so the gate that catches an invalid declaration value runs through `npm run lint`.
- Verify the replacement by resolved declaration values per selector rather than by byte comparison, since the modern tools emit differently-formatted output.

**Dark theme preservation**
- Record every custom property both themes declare, with its resolved value, and gate on that record — because one missing custom property degrades every component that reads it, silently and without failing any gate.
- Gate on the presence of the `html.dark` block and on its declaring every property the light theme declares.

**Release documentation**
- Reconstruct `CHANGELOG.md` from the repository's 25 existing tags; the project currently ships no changelog at all, so 24 releases are undocumented.
- Add `UPGRADE.md` stating, per breaking change, the before and after, why it changed, and the substitution.

**Release pipeline**
- Replace the manual release in `DISTRIBUTING.md` with a tag-triggered workflow that runs `make check` before publishing anything, so no release is cut from a tree that fails its own gates.
- Treat the tag as the only version number, failing the release when `package.json` disagrees rather than warning — today the version is duplicated across three files with nothing verifying they agree.
- Publish `paper.css`, `paper.min.css` and an SCSS source archive as GitHub Release artifacts, with provenance tying each to the commit it was built from. The source archive is required once `@import` is gone, or the documented Sass path has nothing to consume.
- Publish prereleases as prereleases, so a release candidate cannot ship as the stable version.
- Repoint the documentation at this repository's releases. It currently sends its primary download buttons to `github.com/rhyneav/papercss` and its clone URL to `github.com/papercss/papercss` — both upstream — so the documented download and build instructions hand users the original author's framework.
- Move the documentation's hardcoded version to a single gated source, so six duplicated `1.9.2` strings become a build failure rather than a stale link.
- Leave `npm publish` as a documented manual step; a release that half-succeeds is worse than either channel alone.

## Capabilities

### New Capabilities

- `build-verification`: the gates that decide whether this repository may ship — a correctness ruleset over the built stylesheet, a ratcheted baseline over the built documentation partitioned into demos and page chrome, build determinism, `dist/`-in-sync-with-`src/`, dark-theme completeness, exact tool pinning on maintained versions, and a tag-triggered release that cannot run before those gates pass.
- `component-contract`: what the collapsible and navbar components guarantee to the people using them — the frozen `input[id^=collapsible]` identifier contract, keyboard operability, no content-clipping height cap, a documented valid toggle markup, and the dark theme as a preserved surface.
- `docs-markup`: the documentation site as reference implementation — valid, accessible, self-consistent markup on every page, with the demos that users copy driven to zero independently of the page template.
- `release-documentation`: what a release owes the people upgrading to it — a changelog covering every tagged release, an upgrade document that states each breaking change's before, after, reason, and substitution, and documentation that points at the artifacts this repository publishes.

### Modified Capabilities

None. This project has no existing specs; `openspec list --specs` is empty.

## Impact

**Affected source**
- `src/components/_accordion.scss` — the `display: none` rule and the `max-height` cap
- `src/components/_navbar.scss` — the `max-height` cap, `padding: none`, the `.bar*` rules, and the backwards-compatibility `+ button` selectors
- `src/core/_config.scss` — the `$font-src` default and its `@import url(...)`; the 109 `!default` declarations and 56 `darken`/`lighten` calls that compute both themes; the `html.dark` block
- `src/core/_config.scss` — 56 `darken`/`lighten` calls and 8 `map-get`/`map-keys`/`str-length` calls migrated to their `sass:` module equivalents
- `src/layout/_flexbox.scss` — the two `/` division sites, the only constructs Dart Sass 2.0 removes
- `docs/config.toml` — markdown handler
- `docs/layouts/**` and `docs/content/**` — the markup the framework teaches

**Tooling and CI**
- New `Makefile`, `.devcontainer/`, `.github/workflows/verify.yml`
- New `scripts/check-html.mjs`, `scripts/check-theme.mjs`, `scripts/check-css-equivalence.mjs`, `scripts/check-release.mjs`, `.htmlvalidate.json`, `.htmlvalidate-baseline.json`, `.stylelint-dist.json`
- New `.github/workflows/release.yml` — tag-triggered, gated on `make check`, attaches the artifact set to the GitHub Release
- `package.json` — `hugo-bin` removed, `sass`/`postcss`/`autoprefixer`/`cssnano`/`stylelint` replaced with current majors, new gate scripts
- `package-lock.json` — rewritten at the current lockfile version
- `dist/paper.css`, `dist/paper.min.css` — tracked and regenerated; content changes once the defect fixes land, and once more for the toolchain replacement's formatting

**Documentation**
- New `CHANGELOG.md` and `UPGRADE.md`; `README.md` gains links to both
- `DISTRIBUTING.md` — rewritten as the tag-and-watch procedure, with the manual `npm publish` step recorded as still manual
- `docs/content/_index.md` — the version moves to a single gated source, and every download and clone URL is repointed at this repository. This file currently sends users to `rhyneav/papercss` and `papercss/papercss` for both downloading and building
- `docs/config.toml` or site data — the single source the documentation reads its version and repository URLs from

**Compatibility**
- **BREAKING** for the toggle markup: `<div class="barN">` becomes `<span class="barN">`. Both are class-styled, so existing CSS keeps working, but any consumer selector written against the element type breaks.
- **BREAKING** for consumers who pin `< 2.0`: the `display: none` removal means the checkbox input is now focusable, so a stylesheet that assumed it was invisible may need adjusting.
- **BREAKING** for consumers relying on the 960px cap: tall bodies now expand fully, changing layout for long content.
- The Google Fonts change is opt-in-by-default-off and therefore not breaking, but consumers who relied on PaperCSS to pull the fonts must now link them.
- `docs/config.toml` moving to goldmark changes rendering of raw HTML in documentation pages. This is internal to the docs site.
- **Unchanged and verified as unchanged:** the dark theme's activation mechanism, its property surface, and every resolved colour value.

**Not in scope**
- A visual redesign. No component is restyled.
- Changing the colour palette or the `$colors` map. Only the functions computing them change. The palette is preserved: measured against the pre-change build, every colour resolves to the same 8-bit value in both `paper.css` and `paper.min.css`. An intermediate state during the toolchain replacement shifted five `muted`-grey values by 1/255 — the Sass upgrade stopped rounding colour channels — and the upgraded minifier rounds them back; that is recorded in `CHANGELOG.md` because it was measured rather than assumed.
- Making dark mode *complete* was originally out of scope, and is no longer. Auditing the theme for task 5.2 found 64 colour declarations fixed at build time rather than read from the theme, so pressed buttons, striped progress bars, table rules and shadows kept their light-theme colours in dark mode. Those now follow the theme. This changes how those components render **in dark mode only** — light mode is untouched, value for value — and it is recorded in `CHANGELOG.md` because this list said it would not happen.
- Adding `prefers-color-scheme` support. The dark theme stays class-activated; automatic mode is a feature, not a defect fix.
- Resolving the remaining `npm audit` findings beyond what the toolchain replacement incidentally resolves.