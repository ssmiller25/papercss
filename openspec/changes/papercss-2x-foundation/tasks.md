# Tasks

## 1. Documentation Toolchain

*Capability: `build-verification`. Prerequisite for everything else: until this lands, no supported Hugo can build the docs, so there is nothing to validate.* **Landed.**

- [x] 1.1 Replace `defaultMarkdownHandler = "blackfriday"` and the `[markup.blackFriday]` block in `docs/config.toml` with a goldmark configuration, and verify the docs build on a current Hugo
- [x] 1.2 Verify the build produces every page the previous toolchain produced, and record any page-count difference with its cause
- [x] 1.3 Confirm `markup.goldmark.renderer.unsafe = true` is required by the component demos, and record that requirement in a comment at the setting rather than leaving it looking incidental
- [x] 1.4 Remove `hugo-bin` from `devDependencies`, and verify `npm install` no longer depends on an install script that a current npm refuses to run

*1.1–1.3 landed. The `[markup]` block became goldmark with `renderer.unsafe = true` and a comment stating that the component demos are raw HTML in Markdown and are the reason it is required. Verified the docs build on Hugo 0.131 with **no** warnings. The superseded top-level `pygments*` keys were removed as well, with `[markup.highlight]` replacing them; removing them was verified to leave the built output **byte-identical**, so the two spellings were confirmed equivalent rather than assumed to be.*

*1.4 also removed `pre-commit` — same class of problem: an abandoned package whose install script current npm refuses to run, duplicating a gate that now exists properly. Page count went 41 → 42 under goldmark; the extra page is goldmark's, and every page the old toolchain produced is still produced.*

*`package-lock.json` shrank by 1411 lines. It was deliberately kept at `lockfileVersion: 1` rather than letting a current npm rewrite it to v3, to avoid an unrelated 5328-line lockfile migration in this change.*

## 2. Verification Foundation

*Capability: `build-verification`. Makes the gates capable of failing. Lands green: it records the measured baseline rather than fixing anything, because a gate that lands red teaches everyone to ignore it.* **Landed.**

- [x] 2.1 Pin every tool the gates invoke — Hugo, `html-validate`, `stylelint` — in the environment definition, and verify no gate resolves to an unpinned range
- [x] 2.2 Provide Hugo from the environment definition at a pinned version, replacing the npm-installed binary, and verify the docs build through it
- [x] 2.3 Create a correctness-only ruleset for generated CSS, and verify it reports unknown properties, at-rules, functions, units, and declaration values without reporting formatting
- [x] 2.4 Record in that ruleset why `declaration-block-no-duplicate-properties` is not enforced on generated CSS, naming the custom-property fallback pattern that makes it a false positive
- [x] 2.5 Create `.htmlvalidate.json` declaring the rule set enforced against the built documentation, and verify a deliberately invalid page fails
- [x] 2.6 Record the measured baseline in `.htmlvalidate-baseline.json` as a per-rule ceiling, and verify a deliberately introduced violation fails while an unmodified build passes
- [x] 2.7 Add `scripts/check-html.mjs` to walk the built output, run `html-validate`, and enforce the per-rule ceilings, and verify it reports the excluded count on every run
- [x] 2.8 Add a build-determinism gate that builds twice and compares the outputs, and verify it fails when a template is made non-deterministic
- [x] 2.9 Add a gate asserting the tracked distribution matches a fresh build, and verify it fails when the tracked file is edited by hand
- [x] 2.10 Add a `check` target to the `Makefile` running the full sequence, and verify it appears in `make help`
- [x] 2.11 Add the environment definition and a continuous integration workflow that invokes `make check`, and verify the workflow runs the same sequence as the local command

*All five gates verified to fail when they should, not merely to pass: an injected invalid CSS value, a `src/` change without a rebuild, a deliberately non-reproducible build, an injected invalid HTML page, and an uncommitted `dist/` under `CI=1`. Recorded baseline: **4240 across 33 pages**.*

*Three things were not as planned, and each changed the design:*

- **`ignoreProperties` is unusable on `declaration-property-value-no-unknown`.** Rejected as an invalid option value in both stylelint 16.26.1 and 17.16.0 — even for an ordinary property name like `color` — because the rule's own validator expects a different shape than the option takes. The rule equally rejects the `languageOptions` spelling its deprecation notice points at. Only `propertiesSyntax` works, and it emits a deprecation warning on every run pointing at an alternative the rule does not accept. This is a stylelint defect, not a configuration mistake; the warning is expected and is documented in the config so a future maintainer does not "fix" it.
- **The first run of the generated-CSS gate produced a false positive, not a bug.** `_reset.scss` sets `-webkit-text-decoration-skip: objects`, and `objects` looked like a typo for `ink`. It is not: it was a value of `text-decoration-skip` in CSS Text Decoration Level 3 and is still the initial value of `text-decoration-skip-self` in Level 4. Level 4 narrowed the unprefixed property to `none | auto`, and the rule validates against the current definition, so it rejects a value the prefixed property accepts. Correcting the value set via `propertiesSyntax` keeps the property under check rather than muting it.
- **The `dist/` comparison has to run before anything else builds.** `check` originally began with `build`, which synced `dist/` to `src/` and so destroyed the only evidence that `dist/` had been stale — the gate could not fail, and testing it proved as much. `check` now performs the comparison first, which leaves a fresh build in place for the later gates. Related: the "is the *committed* stylesheet current" question is only meaningful against a commit, so that half runs in CI only (`CI=1`) and is skipped locally, where a rebuilt-but-uncommitted `dist/` differs from `HEAD` by design.

*Two stylelints exist in this environment deliberately: the project-local 13 lints the SCSS with the ruleset the sources were written against, and a pinned global 17 runs the generated-CSS gate, because that gate needs `declaration-property-value-no-unknown`, which the local version does not have. Unifying them requires migrating the sources off 76 flagged global Sass function calls — tracked as task 4.8, and since performed at task 4.4.*

## 3. Declaration Value Correction

*Capability: `component-contract`. Lands with the pipeline because the new stylesheet gate fails on it and a gate that lands red is worse than no gate.* **Landed.**

- [x] 3.1 Correct `padding: none` on the navbar's collapsible body to a real padding value, and verify the new stylesheet gate passes and the rule's intended effect is what now happens
- [x] 3.2 Re-run the full gate and confirm the corrected declaration changes no other component's rendering

*3.1 corrected `padding: none` to `padding: 0`, with the reasoning recorded at the declaration: `none` is not a padding value, browsers dropped it silently, and the sibling rule `input[id^=collapsible]:checked ~ div.collapsible-body` already sets `padding: 0` on the same element. **This is a rendering change**, not a pure correction: the navbar's collapsible body previously kept the accordion's `padding: 0 0.75rem` because the invalid declaration was discarded, and now has no inner padding. That matches the surrounding intent, but it is a visual difference and is recorded as such rather than being presented as a no-op fix.*

*3.2 verified by diffing the built stylesheet before and after: exactly one line changed, `padding: none` → `padding: 0`. No other declaration moved.*

- [x] 3.3 Decide whether `_reset.scss`'s `-webkit-text-decoration-skip: objects` should be modernized, dropped as obsolete, or kept as-is, and record the decision

*3.3 decided: **dropped as obsolete**, with the reasoning recorded at the declaration. `objects` skips ink over glyph descenders but not spaces, which is what `text-decoration-skip: auto` does — and `auto` is already the initial value, so browsers skip descenders by default. In a *reset* the job is to undo a browser default, not restate one, so the declaration was doing nothing observable. It also cannot be carried unprefixed: CSS Text Decoration Level 4 narrowed `text-decoration-skip` to `none | auto`, so `objects` was only ever valid on the prefixed property.*

*Verified rather than assumed. `declaration-property-value-no-unknown` now runs **unmodified** — the `propertiesSyntax` override in `.stylelint-dist.cjs` is deleted, and stylelint 17.16.0 exits 0 against both built stylesheets. Confirmed the rule was not neutered in the process by injecting `padding: none` and `color: notacolour` into a copy: both are reported. Confirmed by diff that exactly one declaration left `dist/paper.css`, with `dist/paper.min.css` moving by the corresponding single line.*

*One landed note is now superseded, and it is worth recording rather than quietly editing. Section 2 recorded the `propertiesSyntax` deprecation warning as "expected and unavoidable", because stylelint rejects the `languageOptions` spelling it points at. That was true while the override was needed. It is no longer needed, so the warning is gone: re-running with the old override reproduces the warning, and the committed config emits none. The override existed only to keep this one declaration checkable, so retiring the declaration retired the workaround with it — which leaves stylelint 17 running this ruleset clean.*

## 4. Build Toolchain Replacement

*Capability: `build-verification`. Deliberately **not** last. The pipeline currently needs two stylelints — local 13 for the sources, plus a pinned global 17 for the generated-CSS gate, because 13 has no `declaration-property-value-no-unknown`. That is a direct consequence of the 2019 tree, and it means the gate that catches `padding: none` cannot run through `npm run lint`. 2.0 is the breaking release, so it is the place to move once. This group also runs before the framework fixes so every later verification runs against the toolchain that actually ships.*

*Verified before planning, so the tasks below are counts and not estimates: **76** global Sass built-in calls (33 `lighten`, 29 `darken`, 8 `map-get`, 2 `map-keys`, 2 `str-slice`, 1 `str-index`, 1 `str-length`), **29** `@import`s in `src/styles.scss` with no `@use`/`@forward` anywhere, and **109** `!default` declarations in `_config.scss`. Installed sass is 1.29.0.*

*Corrected after further measurement. This group originally targeted Sass 2.x, on the assumption that 2.0 removes `@import` and the global built-ins. It does not — there is no Sass 2.x, and `latest` is 1.105.1. Compiling the current sources with it reports:*

| Deprecation | Occurrences | Removal target |
|---|---|---|
| `@import` | 29 | **3.0.0** |
| global built-ins | 14 | **3.0.0** |
| `darken()` / `lighten()` | 62 | 3.0.0 |
| **`/` division** | **2 sites** | **2.0.0** |

*plus `164 repetitive deprecation warnings omitted` — roughly 186 real occurrences in total.*

*So the target is the current **1.x**, and the work is much smaller than planned: fix the two `/` division sites in `src/layout/_flexbox.scss`, and migrate the 76 built-in calls so the color-function warnings go away. **`@import` stays**, which is the significant consequence — the 109 `!default` overrides keep working, so **2.0 ships with no Sass-consumer break** and no new configuration mechanism is needed. The `@use` migration remains available as separate work when 3.0.0 forces it.*

- [x] 4.1 Record the resolved declaration set for every selector in `dist/paper.css` — property **and** value — so the replacement can be verified for equivalence rather than by byte comparison. A set of property names alone is not acceptable, because it would pass a wholesale palette rewrite (see the dark theme requirement in `component-contract`)
*4.1 delivered `scripts/record-css-declarations.mjs` and the committed record `.css-declarations.json`: **596 rules, 1603 declarations**, sha256 `7a7be54e`. Values are recorded, not just property names — a name-only record would produce an identical result for a toolchain change that rewrote every colour in the palette, which is the specific failure the record exists to prevent.*

*Writing the parser surfaced three bugs worth recording, because each would have made the comparison quietly incomplete rather than failing:*

- ***Multi-line selectors were truncated to their last line.*** `article,\naside,\nfooter {` recorded as `footer`. The prelude has to be buffered until the brace arrives, or a rule loses most of its identity.*
- ***At-rule conditions were dropped from nested selectors.*** `nav .collapsible-body` appears under several `@media` breakpoints and resolves differently at each; keyed on selector alone, the comparison collapsed them into one entry and a change inside a single breakpoint would be masked by its siblings. Rules are now keyed by their full path through the at-rule chain.*
- ***Each rule was included in its own path*** — `stack.push()` ran before the path was computed, producing selectors like `nav ul nav ul`. This corrupts the comparison key silently.*

*The parser also blanks comments rather than deleting them, so the line numbers it reports when it cannot classify a line actually point at it.*

*Duplicate selectors are **real** in this stylesheet rather than a parsing artefact — `html` appears four times, `a` twice, because the reset and component layers each style them. Keying on selector alone kept only the last, so a change to the first `html` rule would have been invisible. Rules are keyed on (selector, occurrence) and the key *sequence* is compared as well, so a reordering is caught even when every declaration matches.*

*Verified to fail, not merely to pass — five cases: a palette rewrite (`html.dark { --primary }: #000 -> #fff`), a missing custom property in the dark theme, a change to the first of four `html` rules specifically, a cascade reordering with identical declarations, and a hypothetical `@import` removal (the 3.0 migration this change deliberately defers). An unmodified build reports 0 differences and exits 0.*

*Duplicate-selector and reordering detection are what make this a gate rather than a diff: both are invisible to a name-only or per-selector comparison, and both change what the stylesheet does.*

- [x] 4.2 Record the current `npm audit` finding count, so what the replacement resolves is measurable
*4.2 recorded: **73 findings — 2 critical, 22 high, 48 moderate, 1 low.** Only **6 are direct** dependencies (`postcss` high; `autoprefixer`, `cssnano`, `stylelint`, `stylelint-config-sass-guidelines`, `stylelint-order` moderate); the other 67 are transitive. `dependencies` is empty, so nothing here ships: consumers use the prebuilt `dist/paper.css` and never execute this tree.*

*This is already lower than the **92 findings / 3 critical** recorded in design.md's Context table, and the difference is explained rather than assumed: group 1 removed `hugo-bin` and `pre-commit`, and their dependency trees accounted for 19 findings and 1 critical. The Context table figure was accurate when written and is now stale, so it is corrected rather than left to drift further.*

- [x] 4.3 Replace `sass` with the current 1.x release, and convert the two `/` division sites in `src/layout/_flexbox.scss` to `math.div` — the only constructs Dart Sass 2.0 actually removes, and this repository's only instances of them. `@import` is deliberately **not** migrated; see the correction above
*4.3 landed: `sass` 1.29.0 → **1.105.1**, and both `/` division sites in `create-flex-classes` now use `math.div` (via `@use 'sass:math'`). The `slash-div` deprecation is gone from the build.*

*Two things were found that the spec did not anticipate:*

- ***The division count was wrong.*** *The spec said one site at `_flexbox.scss:8`. There are **two** — lines 7 and 8, `flex` and `max-width` in the same loop. The original count came from a deduplicated warning, which reports the first occurrence and omits the repeat. Corrected in the task, in Decision 9, and in the proposal.*

- ***The bump surfaced a deprecation the plan had not accounted for.*** *`build/build.js` called `sass.renderSync` and `build/hot-reload.js` called `sass.render`, both the legacy JS API — deprecated and **removed in Dart Sass 2.0.0**, the one thing on the 2.0 list after the division. Upgrading the compiler without changing these would have left the build one major release from breaking. Both now use `sass.compile` / `sass.compileAsync`. The `legacy-js-api` warning is gone. The first attempt at the second file kept a `util.promisify(sass.compileAsync)` wrapper and was caught by smoke-testing rather than shipped: Node warns `DEP0174` because `compileAsync` already returns a Promise, so the wrapper is both unnecessary and itself deprecated. It is now called directly, and `util` is no longer imported.*

*Installing the new compiler also rewrote `package-lock.json` from `lockfileVersion` 1 to 3 — the 5328-line migration group 1 deliberately deferred rather than trigger mid-change. It has now happened as a consequence of the version bump, so task 4.11's rewrite is effectively done and only needs its `npm ci` verification when reached.*

***The palette shifted, and it was accepted deliberately rather than missed.*** *The upgrade changes **122 recorded differences** against the pre-change stylesheet: one rule split in two, and 121 declaration values changed. Categorised and verified channel by channel:*

- *116 are **notation only** — hex → `rgb(%)`, `rgba()` → `hsla()`, `gray` → `rgb(50%, 50%, 50%)`. Every one resolves to the same 8-bit colour.*
- *5 are **genuine 1/255 shifts**, all in `muted` greys in both themes: `--muted-light-10` (161,**168**,174 → 161,**167**,174) and `--muted-dark-10`/`--muted-text` (108,**117**,125 → 108,**116**,125).*

*The 5 shifts are not a measurement artefact. The true green channel is exactly `167.5`; Sass 1.79+ emits percentages truncated to 12 significant digits, and the truncated value resolves to `167.49999999999`, which a browser rounds to 167 where the exact value rounds to 168. Verified directly: sass ≤ 1.77 reproduces `#a1a8ae` exactly, 1.79–1.89 emit the unrounded `167.5`, and 1.105.1 emits the truncated percentage.*

*This contradicts the proposal's non-goal that palette values are "preserved exactly", so that non-goal is **amended** rather than quietly violated: it now states preservation to within 1/255 per channel, names the cause, and points at the CHANGELOG entry. `color.adjust` does not avoid it — the truncation is in Sass's colour serialisation, so task 4.4's migration meets the same boundary.*

*The record was re-baselined after the bump, because the bump is the intended change and **4.4 must verify against the post-bump baseline** — otherwise its check would fail on differences this task already accepted.*

*> **Resolved by 4.6.** The 1/255 shift described above no longer exists in the shipped artifacts. The upgraded minifier rounds the channels back to the original values, and both `paper.css` and `paper.min.css` now resolve the five `muted` greys to the same 8-bit values as before the bump. The non-goal in the proposal is therefore restored to "the palette is preserved" rather than "within 1/255". The account above is kept because it is the reason the values were measured rather than assumed, and because a reviewer diffing an intermediate commit would otherwise have to reconstruct it.*

*Verified: build succeeds, `--check` reports 0 differences against the re-baselined record, and `slash-div` and `legacy-js-api` warnings are both absent. Remaining warnings are the 5 deduped `color-functions` and 5 deduped `global-builtin` for 4.4, and 5 deduped `import` which is deliberately accepted.*

- [x] 4.4 Migrate the 76 global built-in calls off the global namespace, and verify the built stylesheet's resolved declarations match the committed record exactly. The colour calls use a clamping helper, **not** `color.adjust`: `lighten`/`darken` clamp lightness to 0-100% and `color.adjust` does not. The 14 `map.*`/`string.*` calls are mechanical
*4.4 landed. All 62 `color-functions` and `global-builtin` warnings are gone; only the accepted `@import` warnings remain. The record reports **0 differences**, so the palette is byte-identical to the post-bump baseline.*

*Two corrections to the spec's premise, both found by measuring rather than substituting:*

- ***The count was 76, not 73.*** *The original figure omitted `str-slice` (2) and `str-index` (1) because the scan that produced it only looked for the five functions already listed. The full set is 33 `lighten`, 29 `darken`, 8 `map-get`, 2 `map-keys`, 2 `str-slice`, 1 `str-index`, 1 `str-length`. Corrected in the proposal, the group note, the removal table, and Decision 9.*

- ***`color.adjust` is not the equivalent of `lighten`/`darken`, and the migration it implied would have broken the palette.*** *`lighten`/`darken` clamp the resulting lightness to 0-100%; `color.adjust` does not. `color.scale` uses a different formula again. This is load-bearing: `--primary-dark` is `black` only because `darken(#41403e, 50%)` clamps -25% to 0, and the same is true of `--secondary-dark`, `--danger-dark`, `--main-background-light`, and three `html.dark` values. Migrating to `color.adjust` as planned put seven declarations out of range as `hsl(40, 2.36%, -25.0980392157%)` and similar — verified, not predicted. `paper.min.css` was unaffected because cssnano clamps them back, so the damage would have been confined to the shipped, human-readable `paper.css` — the artifact a consumer reads and copies from. That is exactly the "looks fine, is wrong" shape this change exists to prevent.*

*So the 62 colour calls migrate to a new `adjust-lightness($color, $amount)` helper in `src/core/_color.scss`, which restores the clamping. Positive amounts lighten and negative darken, and it is verified value-identical to both originals, including `rgba` inputs where the alpha channel is preserved (the `--white-dark-light-80` case Decision 10 flags). The 14 `map.*` and `string.*` calls are mechanical and need no helper.*

*Two details worth recording:*

- *`str-replace` is a **local** function, not a built-in, so its name is unchanged; only its body's `str-index`/`str-slice`/`str-length` calls migrated. It is exercised by `_forms.scss`, so the record's 0 differences actually test that path rather than leaving it dead code.*
- *The helper's rationale is written as `//` comments rather than `/* */`, because Sass emits loud comments into the built stylesheet. The first version added 28 lines of rationale to `dist/paper.css`; the source keeps the reasoning and the output gains only a three-line header.*

*The helper is also a deliberate addition to the framework's global namespace. It is `adjust-lightness` rather than `shade` to be unambiguous at 62 call sites, and it follows the existing convention of unprefixed global helpers such as `str-replace` and `resp`.*

- [x] 4.5 Verify the configuration mechanism still works after the toolchain change — a real `!default` override, assigned before `@import`, honoured by the current compiler. This is a regression guard on a public API this change deliberately preserves, so that a future 3.0.0 migration is a conscious break rather than an accident
*4.5 landed as a durable guard rather than a one-off: `scripts/check-config-override.mjs`, wired into `make check` as `check-config` and listed by `make help`. A verification performed once proves nothing about the next change, and the documented configuration mechanism is precisely what the coming `@import` → `@use` migration would break.*

*The check makes **two** assertions, and both are needed:*

- *the **contract** — `$primary` assigned before `@import 'styles'` appears as `--primary` in the compiled output;*
- *the **control** — without the assignment, the default `#41403e` appears. Without this the check could pass for the wrong reason, since an output that stopped declaring `--primary` at all would otherwise not be distinguished from a working override.*

*It compiles its own fixture rather than reading `dist/paper.css`, because the point is to exercise the consumer's path, which the shipped stylesheet does not represent.*

*Both assertions were verified to fail, not merely to pass: dropping `!default` from `$primary` in `_config.scss` produces "assigning `$primary` before the import had no effect", and changing the default to `#000000` produces "the default `--primary` is no longer `#41403e`". Each names the cause and points at the migration requirement.*

*Why it matters for 3.0.0: converting even one partial to the module system stops the shared global scope that makes assignment-before-`@import` work. Today that would happen silently — nothing else in this repository reads consumer configuration. With this guard, the same change fails with an explanation, so a 3.0.0 migration is a deliberate breaking change with a UPGRADE.md entry rather than an accident a consumer discovers when their colours stop applying.*

*One observation, recorded but **not** fixed because it is pre-existing and out of scope. `src/layout/_flexbox.scss` declares `$number-columns: 12;` without `!default`, so a consumer assigning `$number-columns` before the import gets no effect — confirmed by test, and verified to predate this change. It reads as a variable the framework invites you to configure and is not one.*

*Resolved as **Decision 13**: the value is left as it is and marked as internal, rather than made overridable or renamed private. It is one of four such constants (`$number-columns`, and `$base`/`$large`/`$small` in `_utilities.scss`), all top-level without `!default`, used only in their own file, and undocumented as configurable — the configuration surface is the 109 `!default` declarations in `_config.scss`. Making this one overridable would add a public, unvalidated surface that contradicts the documented 12-column contract; renaming is cosmetic under `@import` and is made structural for free by the module migration. Each of the four declarations now carries a comment stating it is internal, and a new `component-contract` requirement — **internal constants are distinguishable from configuration** — carries the rule past this change.*

- [x] 4.6 Replace `postcss`, `autoprefixer`, and `cssnano` with current releases, and verify the resolved declarations still match the committed record. **Include colour normalisation of the unminified output**: sass 1.79+ stopped rounding colour channels to 8-bit and emits full-precision `rgb(80.3767176162%, …)` instead of `#cdcccb`, which cssnano already normalises in `paper.min.css` but nothing does for `paper.css` — a 7.1% size increase and a much harder file to read. Adding `postcss-colormin` (the plugin cssnano already uses internally) to the autoprefixer step restores `#cdcccb`, removes the 7%, and strips 116 notation-only differences out of the record so every later toolchain comparison is readable
*4.6 landed: postcss 7 → **8.5.29**, autoprefixer 9 → **10.6.1**, cssnano 4 → **9.4.0**, plus **postcss-colormin 9.0.7** added to normalise the unminified output. The result was better than the task aimed for, in two ways.*

***The 7.1% bloat is gone, and then some.*** *`paper.css` is 69,378 bytes against 69,348 before the whole toolchain replacement — a 30-byte difference rather than the ~5 KB the Sass bump had introduced — and `paper.min.css` is **2.3% smaller** than it was (53,228 vs 54,454), because cssnano 9 minifies better than cssnano 4.*

***The 1/255 muted-grey shift is gone entirely.*** *This was not the plan. At 4.3 the Sass upgrade stopped rounding colour channels, shifting five `muted` grey values down by one 8-bit step, and that was accepted and recorded. Running the upgraded minifier over the output restores them: cssnano 9 rounds `167.5 → 168` and `116.5 → 117`, and the minified file now reads `#a1a8ae` and `#6c757d` — the original values — while the unminified file carries the exact `rgb(161.3053,167.5,173.6947)`, which rounds to the same. So the palette is preserved after all, and the proposal's non-goal is restored to a flat "the palette is preserved" rather than the "within 1/255" amendment it briefly needed.*

*Two things are worth recording about the notation.*

- *Most colours return to hex, but five do not: where a channel is a genuine half-step (`167.5`, `116.5`) colormin cannot express it in 8-bit hex, so it emits exact fractional `rgb()` instead. That is correct and renders identically, and it is why `paper.css` is 30 bytes over the pre-change figure rather than under it.*
- *The plugins are now **called** (`autoprefixer()`, `cssnano()`, `colormin()`) rather than passed as functions. PostCSS 8 accepts a plugin factory, but each of these exports a function that returns the plugin, so passing the function itself is a quiet way to get a no-op — the kind of change that produces a plausible stylesheet with no colour normalisation at all.*

*Verified: the build is deterministic (identical sha256 across two runs), the record reports 0 differences against the re-baselined output, and a token-level comparison against the pre-change 4.1 record finds no genuine value differences — only notation (`black` → `#000`, spacing inside `rgba()`, hex where full-precision percentages were) and the single `.alert .btn-close` rule split from 4.3.*

*One environment finding, not fixed here. cssnano 9 and postcss-colormin 9 require Node `^22.22.3 || ^24.15.0 || >=26.0`, and the devcontainer pin is a floating `ARG NODE_VERSION=22` — which contradicts the same Dockerfile's comment that everything is "pinned exactly", and now carries a real minimum rather than being a harmless floor. Pinning the Node version is task 4.12's kind of work and is noted there.*

- [x] 4.7 Replace `stylelint` 13 and `stylelint-config-sass-guidelines` with a current stylelint and an equivalent configuration, and verify the sources still pass the authoring ruleset
- [x] 4.8 Migrate the sources off the 76 global Sass function calls the modern configuration flags, and verify the flag count reaches zero with the resolved declarations unchanged. These are migrated rather than silenced by disabling rules, so the authoring gate is not weakened to make the migration land
*4.7 landed: stylelint 13.8.0 → **17.16.0**, `stylelint-config-sass-guidelines` 7.1.0 → **13.0.0**, `stylelint-scss` 3.18.0 → **7.3.0**. `.stylelintrc.json` became **`.stylelintrc.cjs`** so each exclusion can state its reason, matching `.stylelint-dist.cjs`. The sources pass.*

*Three things were found by measuring rather than migrating:*

- ***Task 4.8 is already satisfied by 4.4.*** *The modern configuration enables `scss/no-global-function-names`, and run against the pre-4.4 sources it reports exactly **76** violations — the same 76 calls migrated at 4.4, verified by linting a checkout of `8e591dd`. Run against the current sources it reports **0**. The "76" in that task was always these calls; there was never a second set. 4.8 is therefore marked done rather than left to duplicate work that has already happened.*

- ***Two of the five dependencies were dead.*** *`stylelint-config-standard` and `stylelint-order` were referenced nowhere except `package.json` — not by `.stylelintrc.json`, and not by `sass-guidelines` 13, whose dependencies are `@stylistic/stylelint-plugin`, `postcss-scss` and `stylelint-scss`. They were leftovers from the stylelint 13 setup and are removed.*

- ***One override was suppressing nothing.*** *`selector-max-compound-selectors: null` was carried over from the old config, but the preset sets it to 3 and the sources comply — 0 violations at 3, 16 at 2. The disable is removed so the rule stays active and a future selector that genuinely grows too compound is caught. The other four overrides are load-bearing, and the config now records the count each one hides: `max-nesting-depth` 99 at the preset default, `selector-no-qualifying-type` 44, `scss/selector-no-redundant-nesting-selector` 3, `scss/at-extend-no-missing-placeholder` 1.*

*The `at-extend` rationale was checked rather than assumed: `_forms.scss` extends the `.disabled` class, and `.disabled` is public API — `docs/content/docs/components/buttons.md` documents `<button class="disabled">` — so it cannot become a `%placeholder` without breaking every page that uses it.*

*Verified the gate can still fail, not merely that it passes: `color-named` rejects `black`, `declaration-block-single-line-max-declarations` rejects two declarations on one line, and the stylistic rules are live. Both `lint:src` and `lint:dist` pass under the local stylelint 17, which is the precondition for 4.9 collapsing the two-linter workaround.*

- [x] 4.9 Unify the two stylelints into one project-local version, and verify `make check` runs the generated-CSS gate through the project's own install with no tool resolved from outside it
*4.9 landed. There is now **one stylelint**, the project-local 17.16.0, and every gate runs it from `node_modules`.*

- *`make check-dist` calls `npm run lint:dist` instead of invoking a global `stylelint --config-basedir "$(npm root --global)"`. The `--config-basedir` was never needed for its own sake: it existed to point a globally-installed stylelint 17 at shareable configs, and `.stylelint-dist.cjs` extends nothing, so there is no shareable config to resolve.*
- *The devcontainer no longer installs stylelint globally. `ARG STYLELINT_VERSION` and the global install are removed, and the comment that explained the two-linter arrangement is replaced with the reason stylelint is deliberately absent from the global installs — it is a project dependency now, like the rest.*
- *`html-validate` and Hugo remain global. Neither can be a project dependency: Hugo because `hugo-bin` cannot install on a current npm, `html-validate` because it is the one validator the documentation gate uses and is pinned in the environment definition.*

*Verified as far as this machine allows. `stylelint` is **not on PATH** here, so `make check-dist` passing is proof the gate resolves the project install rather than finding a global one — the strongest available evidence short of the devcontainer itself. `make check-config` and `npm run lint:src` also pass, and `make -n check` confirms the sequence still runs the generated-CSS gate through `check-dist`.*

*This closes the workaround the pipeline was landed with: the two-stylelint split was a direct consequence of the 2019 tree, and section 2 recorded it as deliberate rather than permanent. The group 4 note that explained the split is now historical.*
- [x] 4.10 Add the recorded-declaration-set comparison to `make check`, and verify it fails when a declaration's value changes and passes when only formatting changes
*4.10 landed. Two Makefile targets, following the `check-docs` / `check-docs-update-baseline` pattern:*

- *`check-declarations` runs `node scripts/record-css-declarations.mjs --check`, and is in the `make check` sequence directly after `check-dist`, since both inspect the generated stylesheet.*
- *`check-declarations-update` re-records. It is a separate named target rather than a flag on the checking target, so regenerating the baseline is a deliberate act someone types, not something that can happen as a side effect of a passing run.*

*Both behaviours the task asks for were verified at the **make** level, not just the script level:*

- ***Passes on a formatting-only change.*** *Indentation changed, trailing whitespace added, blank lines inserted and a comment introduced into `dist/paper.css` all report 0 differences. That is what makes the record usable: the comparison is on resolved declarations, so a reformat is silent and only a value or structure change speaks.*
- ***Fails on a value change.*** *`--primary: #41403e` → `#41403f` produces `make: *** [check-declarations] Error 1`, naming the rule, the property, and both values, and pointing at `check-declarations-update` and the CHANGELOG.*

*The record was regenerated so its embedded `$comment` refers to `make check-declarations-update` rather than the raw node invocation — the previous text pointed at the node command only because this task had not landed. The digest is computed over the statements and rules rather than the whole file, so it is unchanged, and the diff is exactly one line. The script's usage header and failure message were updated to match.*

*This is the gate that would have caught `padding: none`, and it is the one that made every measurement in this group possible: 4.3's colour-notation change, 4.4's clamping discovery and 4.6's restoration of the palette were all found by comparing against this record rather than by inspection.*
- [x] 4.11 Rewrite `package-lock.json` at the current lockfile version, and verify `npm ci` installs the pinned tree from it
- [x] 4.12 Confirm no replacement reintroduces an install script the package manager refuses to run. **Also pin the Node version the environment provides**: cssnano 9 and postcss-colormin 9 require Node `^22.22.3 || ^24.15.0 || >=26.0`, while the devcontainer uses a floating `ARG NODE_VERSION=22` — which contradicts the same Dockerfile's claim that every version is "pinned exactly", and now carries a real minimum rather than a harmless floor
- [x] 4.13 Record the one-time generated-output difference in `CHANGELOG.md`, since consumers vendoring `dist/paper.css` byte-for-byte will see it

*Tasks 4.11–4.13 closed together, as the last three of the toolchain group.*

***4.11 — the lockfile and `npm ci`.*** *The rewrite to `lockfileVersion` 3 had already happened as a side effect of the Sass bump at 4.3, which is why `4.11` was recorded there as needing only its verification. `npm ci` now installs the pinned tree cleanly, and the build, the declaration record and `lint:src` all pass afterwards — so the lockfile is not merely present but sufficient on its own.*

***The audit improvement is now measurable, which is what 4.2 recorded its baseline for.*** *The count went from **73 findings to 18**: critical **2 → 0**, high 22 → 17, moderate 48 → 1, low 1 → 0. The remaining four direct dependencies carrying findings are `chokidar` and three `stylelint` packages. Nothing here ships — `dependencies` is empty and consumers use the prebuilt stylesheet — so the remainder is classified in group 17 and its resolution belongs to the `dependency-hardening` change rather than blocking this group.*

***4.12 — install scripts.*** *The concern was that a replacement might reintroduce the `hugo-bin`/`pre-commit` failure: a **required** dependency whose install script the package manager refuses to run, leaving the package installed but non-functional. Two packages in the tree do declare install scripts, and neither is that:*

- *`fsevents@2.1.3`, an **optional** dependency of `chokidar`, the dev watch tool. macOS-only, ships prebuilt binaries, and `chokidar` falls back to polling without it.*
- *`@parcel/watcher@2.6.0`, an **optional** dependency of `sass` itself, used only for `sass --watch`, which this build does not use. It also ships prebuilt binaries.*

*Neither is required, neither is run by our gates, and `npm ci` exits 0 with both present. The distinction matters and is worth keeping: an optional native module whose build step is skipped is a different thing from `hugo-bin`, which was required and left `npm run build` with no Hugo at all.*

***Also 4.12 — the Node version is pinned.*** *The devcontainer used NodeSource's `setup_${NODE_VERSION}.x`, which accepts only a major, so `ARG NODE_VERSION=22` installed whatever the newest 22.x happened to be — contradicting the same file's claim that every version is "pinned exactly". That stopped being academic when cssnano 9 and postcss-colormin 9 began requiring `^22.22.3 || ^24.15.0 || >=26.0`: a sufficiently old 22.x would have failed `npm install` with an engine error naming the dependency rather than the pin responsible. Node is now installed from the release tarball at **22.23.3**, exactly as Hugo is, so the version the file names is the version that runs.*

***4.13 — the CHANGELOG.*** *Written at 4.6, when the difference it describes was established, rather than reconstructed here. It records the notation changes, the minified size reduction, the one split rule, and the fact that the palette is preserved — including the intermediate 1/255 shift that was accepted at 4.3 and resolved at 4.6.*


## 5. Dark Theme Preservation

*Capability: `component-contract`, `build-verification`. **Not a prerequisite of anything** — this group previously claimed to be, on the basis that the palette would be deleted by the Sass 2.0 migration. That was wrong: `darken`/`lighten` are deprecated with removal targeted at **3.0.0**, so on 1.x the palette compiles exactly as before and merely warns. Nothing is at risk today.*

*The fragility is structural rather than scheduled, which is why the gate is still worth building. Dark mode is one `html.dark` block at `src/core/_config.scss:247` generated over a shared theme map; every component reads the result through `var(--…)`. So there is no per-component dark styling to lose and none to catch a loss — one missing custom property degrades every component reading it, and nothing in the pipeline notices, because a missing custom property is not invalid CSS. That is the same failure mode as `padding: none`: a declaration that looks right and does nothing. Recording the values turns "did the theme survive this upgrade" into a build result rather than a reviewer's recollection — which matters most at 3.0.0, when someone else does the migration.*

*Audited once group 4 landed, and reduced from nine tasks to three. Six were already satisfied by work the toolchain group had to do anyway. They are listed here rather than silently deleted, so the reasoning survives archiving — and so nobody re-adds a gate that already exists under another name.*

- ***5.1 (derive the theme's property set from the record)*** — *the committed `.css-declarations.json` already carries `html` and `html.dark` as ordinary rules, 48 declarations each, with values. Nothing was recorded separately, which was the task's whole point.*
- ***5.3 (gate that the `html.dark` block exists)*** — *4.10's declaration-set comparison covers it: deleting the block from `dist/paper.css` reports `- html.dark #1` and fails. Verified, not assumed.*
- ***5.4 (theme values unchanged after the 4.4 migration)*** — *4.4's verification was exactly this, and it reported 0 differences against the record.*
- ***5.5 (`rgba` handling during 4.4)*** — *done in 4.4. `adjust-lightness` replaced the calls and was checked against `rgba` input specifically, where `--white-dark-light-80` keeps its alpha.*
- ***5.6 (no theme-related deprecation warning)*** — *the build emits only the accepted `import` warnings; `color-functions` and `global-builtin` went at 4.4.*
- ***5.8 (activation is still one class on the root)*** — *`html.dark` is in the record and the mechanism is unchanged; `docs/content/docs/utilities/dark-mode.md` still documents adding `.dark` to the `<html>` tag.*

*What remains is the part group 4 could not cover: an invariant the record catches only transiently, a check no declaration comparison can make, and the consumer-facing statement.*

- [x] 5.1 Add a gate asserting `html.dark` declares every custom property `html` declares, and verify it fails when one is removed. The record catches a property removed from either rule, but only until it is re-baselined — after that an `html`-only addition leaves `html.dark` silently incomplete, which is the invariant the `component-contract` requirement states. A comparative check is not the same as a historical one
*5.1 landed as `scripts/check-theme.mjs`, wired into `make check` as `check-theme` and placed directly after `check-declarations` — deliberately, because it reads that gate's output and depends on it being current.*

***It reads `.css-declarations.json` rather than parsing the stylesheet itself.*** *That is not a shortcut. The record is not a second source of truth: `check-declarations` fails unless it matches a fresh build, so by the time this runs the record *is* the parsed build. Parsing `dist/paper.css` again would mean a duplicate of the parser that took several corrections to get right — multi-line selectors, at-rule scoping, duplicate selectors — and two copies of a parser that subtle is a worse risk than the indirection.*

***What it checks that the record cannot.*** *`check-declarations` catches a property removed from either theme, but only until the record is re-baselined. After that, a property added to `html` and forgotten in `html.dark` is a change nobody notices: the record updates, every gate passes, and the asymmetry is baked in. A historical check is not a structural one. It asserts the dark set covers the light set, and reports dark-only extras without failing, since the requirement is coverage rather than equality.*

*Three failure modes verified, not just the one the task names:*

- *a single property removed from `html.dark` reports `--primary-dark (declared on html, absent from html.dark)` and exits 1;*
- *the whole `html.dark` block removed fails with the breaking-change note;*
- *renaming the light selector fails on an **empty set** rather than passing vacuously. That last guard matters most: every comparison of the form "A covers B" is trivially true when A is empty, so a selector rename would otherwise turn this gate into a no-op that reports success.*

*At present both themes declare the same 48 properties, so the gate reports success with no extras.*

- [x] 5.2 Render each component from the documentation's dark-mode page in both themes, and verify every one resolves from the theme it should. Neither the record nor the completeness gate can see a component that hardcodes a colour instead of reading a custom property, which is the failure this catches
*5.2 turned out not to be a verification. The gate the task asked for would have failed, because the failure it was meant to catch is not hypothetical — it is the state of the framework. Auditing the theme found **64 colour declarations fixed at build time** rather than read from the theme: pressed button states, the dark end of striped progress bars, table rules, and every shadow. The `color()` mixin themed the base colours, but derived colours were computed by Sass and emitted as literals, so on a dark page a button's pressed state, a striped bar and a table's rules all showed light-theme colours.*

*The components the dark-mode page demonstrates — input, button, progress, table — were therefore the ones affected, which is why the task named them.*

***Fixed rather than recorded, per decision.*** *Twelve custom properties were added, taking the theme surface from 48 to 60:*

- *`--{color}-light-dark` for the six palette colours — the light variant darkened 10%, used by pressed buttons and the darker stripe in gradients. Named relative to the light variant rather than to the base, because that is what it is, and because a base-relative name would compute the wrong dark-theme value.*
- *`--primary-light-25`, `-30`, `-60` — the alternating table row text, the `~~~` rule after an `hr`, and the table row separator, each previously an inline `adjust-lightness($primary, N%)`.*
- *`--shadow-color-strong`, `--modal-backdrop`, `--range-shadow-color` — overlays and the stronger shadows used by form controls, which carry the same value in both themes but are now expressible as such.*

*The `shadow()` mixin was the largest single win for the least effort: `$shadow-small/regular/large/hover` baked in `$shadow-color-regular`, so every shadow in the framework stayed light while a themed `--shadow-color-regular` sat unused beside it. They now read the custom property. Likewise `striped-background()` takes a property name rather than a colour, and the button loops read `--{color}-light` and `--{color}-light-dark`.*

***Light mode is untouched.*** *Verified rather than asserted: of every property already declared on `html`, **zero** changed value; the only additions to that rule are the nine new colour properties. Every migrated declaration resolves to the value the literal it replaced held, so nothing renders differently in the default theme. What changes is dark mode — which is the point.*

*`mark` is the one literal left, and deliberately: `_reset.scss` sets `background-color: #ff0; color: #000` from normalize.css, and a text highlight is yellow by definition rather than by theme. The declaration now says so, so it does not read as an oversight.*

*Verified: the completeness gate reports 60 dark properties covering all 60 on `html`; the declaration record reports 0 differences after re-baselining; two consecutive builds are byte-identical. The `component-contract` requirement this establishes — **components read their colours from the theme** — states the rule for the future, including that a colour identical in both themes is still expressed as a property, so a theme can decide it.*

- [x] 5.3 Record the dark theme's status in `UPGRADE.md`, so a consumer can tell what moved and what did not. **The task originally said "unchanged", and 5.2 changed it** — activation is unchanged, the property surface grew additively from 48 to 60, and component rendering changed in dark mode only. The note records what actually happened rather than the original expectation

- [x] 5.4 Add a **light/dark toggle to the documentation site header**, so any page can be switched live rather than the theme only being demonstrable on one page. Verify it applies the framework's `.dark` class to the root element, is reachable and operable by keyboard, and states the current mode rather than relying on appearance alone. The existing `Dark Mode` page stays exactly as it is and is not replaced by this — the toggle is what makes the theme reviewable while browsing. Its markup is page chrome, so it is held to the documentation gate like any other: if it adds a violation, that is a defect in the toggle rather than a baseline to raise

*5.4 landed. A button in the site header (`nav/main.html`) plus `docs/static/assets/theme-toggle.js`, included with `defer`. The button is present on every page, applies the framework's `.dark` class to `<html>`, and needs nothing else — the framework's activation contract is a single class, so the control is correspondingly small.*

- *Keyboard operation is native: it is a real `<button>`, not a styled `div`, so it is focusable and activates on Enter and Space for free.*
- *State is announced rather than implied. `aria-pressed` carries on/off and the label stays `Dark mode`, which is the standard toggle-button pattern: a label that changes between "enable" and "disable" reads as two different actions rather than one control with two states.*
- *The choice is remembered in `localStorage`, restored before the first paint so the page does not flash the other theme, and the code degrades quietly if storage is unavailable.*
- *The existing `Dark Mode` page is untouched, as the task required.*

***The documentation gate caught this twice, which is the whole reason 5.4 said the toggle is held to it.*** *The first attempt failed with 4240 → 4306 errors: `attr-quotes` +33 and `no-trailing-whitespace` +33, one of each per page, because header markup is on every page. Both were defects in the toggle, not baseline drift, and both were mine:*

- *the `<script>` tag used single-quoted attributes, where the site's house style is double quotes — the same style deviation the `docs-style-cleanup` follow-up change exists to clean up, so it was fixed rather than absorbed;*
- *an **indented HTML comment** that Hugo strips, leaving its leading whitespace behind as a blank-but-indented line. Replaced with a Hugo template comment, `{{- /* … */ -}}`, which trims the surrounding whitespace and leaves nothing. Worth recording because the failure is invisible in the source: the comment reads as documentation and the violation appears only in the rendered output.*

*Verified: `make check-docs` reports **4240 errors at baseline, none new**, and the button is present on all 33 pages.*


*5.3 landed, and its premise was wrong by the time it was reached — worth recording, because the task as written would have documented something untrue.*

***It said the property surface was unchanged. 5.2 changed it.*** *The surface grew from 48 custom properties to 60. The task was written before that decision, so recording "unchanged" would have told consumers the opposite of the truth about their dark styling. The note records the actual state: activation unchanged, the surface grown additively, and rendering changed in dark mode only.*

*`UPGRADE.md` is created here, because this task depended on it existing and the dependency had to be satisfied somehow. Task 7.5 now adds the remaining sections to a file that already exists rather than creating a new one — and per this change's own principle, the dark-theme section is written at the moment the dark-theme change lands rather than reconstructed later.*

*What the entry says, and why each part is there:*

- ***activation is unchanged** — the one part of the original task that held. Dark mode is still `.dark` on `<html>`, so a consumer who had it working keeps it working.*
- ***the surface grew, nothing removed** — every pre-existing property keeps its value in both themes, so an override of `--primary` or any other existing property is unaffected. The twelve new names are listed, because a custom theme is additive rather than broken but does need to know what is now themeable.*
- ***rendering changed in dark mode only, and light mode is untouched** — the claim a consumer actually needs to check against their own pages. Verified rather than asserted: no property on `html` changed value.*
- ***what to do** — usually nothing, which is the honest answer. The exception is a consumer who wrote dark-mode overrides *because* those components were wrong; those may now be redundant.*
- ***the `mark` exception** — stated, because a reader who scans the property list will notice a literal colour remains and should not have to guess whether it was missed.*


## 6. Release Pipeline

*Capability: `build-verification`, `release-documentation`. Replaces the manual procedure in `DISTRIBUTING.md`: hand-edit the version in three files, commit, tag, then create the release in the GitHub UI and drag `dist/` into "Attach Binaries". Nothing verifies those version numbers agree, so a release can be labelled `1.8.3` while built from `1.8.2` sources, and a forgotten edit ships a stale download link. **GitHub Releases only — a release publishes to no package registry.** There is no `npm publish` step and no other tie-in to the npm registry: the artifact set is attached to the GitHub Release, and third-party sites consume it through open CDNs that serve the tagged repository tree (jsDelivr primary, Statically fallback). A release that pushed to a registry and a CDN would have two independent failure modes and a half-published state, so the registry path is removed rather than kept as a manual step.*

- [x] 6.1 Make the tag the single source of truth for a release's version, and add a gate failing when `package.json`'s version disagrees with it. A mismatch is a failure, not a warning
- [x] 6.2 Add `.github/workflows/release.yml`, triggered on a `v*` tag, that runs `make check` before publishing anything — so no release is cut from a tree that fails its own gates, reusing the single entry point rather than restating the sequence in a second place
- [x] 6.3 Define the released artifact set explicitly: `paper.css`, `paper.min.css`, and an SCSS source archive
- [x] 6.4 Verify the source archive is built from the tagged commit's `src/` and contains the entry point a Sass consumer needs — it is not optional once `@import` is gone (task 4.3), so a CSS-only release would break the source-consumption path the docs describe
- [x] 6.6 Require `CHANGELOG.md` to carry an entry for the released version, and fail the release when it does not — an undocumented release is the exact failure this change exists to prevent
- [x] 6.7 Treat a prerelease tag such as `v2.0.0-rc.1` as a prerelease rather than as `2.0.0`, so a release candidate is never published as the stable version or made the `latest` release, and verify the version comparison accepts prerelease forms
- [x] 6.8 Attach provenance metadata to the release so a downloaded artifact can be tied back to this repository and the commit it was built from
- [x] 6.9 Move the documentation's version to a single source the docs build reads, and remove the literals from `docs/content/_index.md`
- [x] 6.10 Add a gate failing when the documented version disagrees with the released tag, so drift is a build failure rather than a stale download link
- [x] 6.11 Repoint every download and build URL in the documentation at **this** repository. `docs/content/_index.md` currently points its GitHub Releases buttons at `github.com/rhyneav/papercss` and its clone URL at `github.com/papercss/papercss` — both the upstream project, so the documented download and build instructions hand users someone else's framework
- [x] 6.12 Update `README.md` to name the released artifacts and the repository they come from, including the SCSS source path for consumers building from source. **Remove the npm quick-start entirely** — `npm install papercss` and `yarn add papercss` are registry paths this repository no longer supports — and repoint the `package.json` repository, homepage and bugs metadata at this repository rather than upstream
- [x] 6.13 Rewrite `DISTRIBUTING.md` as the tag-and-watch procedure. **Remove the `npm publish` step** rather than recording it as manual, state that no npm-registry publication is part of a release, and document how the open CDNs pick up the tag
- [x] 6.15 Define the npm-free consumer paths a release supports — the GitHub Release download and the open CDNs serving the artifact from the tag — and add a gate that fails if the documentation describes a consumption path requiring the npm registry, since no release publishes to it
- [x] 6.16 Verify the tagged commit's tree contains `dist/paper.css` and `dist/paper.min.css`. The CDNs serve the repository tree at the ref, not the GitHub Release attachments, so a release that attaches artifacts without committing them is downloadable from GitHub and absent from every CDN
- [x] 6.17 Document the canonical CDN URLs — `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>/dist/paper.min.css` as primary and `https://cdn.statically.io/gh/<owner>/<repo>@<tag>/dist/paper.min.css` as fallback — and add a post-release smoke check that fetches both for the tagged version and matches the response to the released artifact
- [x] 6.18 Document that an exact-tag CDN URL is immutable by design — the CDN permanently caches a tagged file, so a corrected or re-tagged release is served under a new tag rather than by mutating an existing one, and there is no purge step because every documented URL is an exact tag. Add a gate that fails when a documented CDN URL uses a mutable alias (`@latest`, a partial version, a branch, or a commit) rather than an exact tag, and verify it fails on an aliased URL and passes on the exact-tag URLs this repository documents
- [x] 6.19 Remove the npm-based consumption path from `docs/content/_index.md`: the NPM install section, the `node_modules/papercss/...` locations, and the unpkg/npm CDN snippet, replacing the CDN guidance with the jsDelivr GitHub-tag URL. The registry path is no longer satisfiable, so leaving it documented is a defect
- [x] 6.20 Remove `npm publish`-only artifacts (`package.json` publish fields if any, `.npmignore`) so the repository does not advertise a publication channel it does not use, and verify nothing in the build or gates depends on them
- [x] 6.21 Record the no-registry distribution policy in `AGENTS.md` — not in the user-facing `CONTRIBUTING.md` — so a future agent or maintainer does not reintroduce an npm publication step

## 7. Release Documentation

*Capability: `release-documentation`. The repository recorded nothing for its 24 earlier tagged releases, so `CHANGELOG.md` began at 2.0.0. The 2.0.0 section is written as changes land; the 1.x history is reconstructed from the tags and marked as such.*

- [x] 7.1 Reconstruct `CHANGELOG.md` from the repository's 25 tags, with a dated entry and user-visible changes for each, and identify the entries as reconstructed rather than presenting them as contemporaneous
- [x] 7.2 Verify the reconstructed `1.9.2` entry matches what 1.9.2 actually shipped, since that is the version consumers migrate *from*
- [x] 7.3 Where a tag's changes cannot be established, record the gap explicitly rather than omitting the release
- [x] 7.4 Open a `2.0.0` section in `CHANGELOG.md` and add an entry per change as it lands
- [x] 7.5 Create `UPGRADE.md` with one section per breaking change — toggle element type, toggle focusability, collapsible height cap, default font loading — each stating before, after, why, and the substitution. Note that the toolchain replacement is **not** among them: the Sass configuration mechanism is unchanged (task 4.5), so a consumer who configures the palette by assigning before `@import` needs no change at all
- [x] 7.6 Link both files from `README.md`, and verify a consumer can find the upgrade path without already knowing it exists
- [x] 7.7 Verify `UPGRADE.md`'s sections match the recorded breaking changes in `proposal.md` in both directions, and that none describes a non-breaking change

## 8. Collapsible Keyboard Operability

*Capability: `component-contract`. **Breaking** — the toggle becomes focusable.*

- [x] 8.1 Replace `display: none` on the collapsible input with a visually-hidden pattern that keeps the control focusable, and verify it remains operable by pointer exactly as before
- [x] 8.2 Style the framework's own focus indicator so keyboard focus is visible on the toggle, and verify the indicator is visible against every surface the component renders on
- [x] 8.3 Verify the toggle is the expected tab stop and that operating it with the keyboard opens and closes the body
- [x] 8.4 Verify the same control works in the navbar and in a standalone collapsible, since both are conditioned on the same rule
- [ ] 8.5 Document the breaking change in `UPGRADE.md` with the substitution a consumer must make if their stylesheet assumed the control was invisible, and record it in the `2.0.0` section of `CHANGELOG.md`

## 9. Collapsible Height Cap

*Capability: `component-contract`. **Breaking** — tall bodies now expand fully.*

- [ ] 9.1 Replace the fixed `max-height` on the expanded accordion body with an approach that reveals arbitrary content, modeling the pending upstream fix rather than inventing a third approach
- [ ] 9.2 Apply the same correction to the navbar's collapsible body, and verify the two are not left inconsistent
- [ ] 9.3 Verify a body taller than the old threshold is fully visible, and that no part of it is cut off without a means of reaching it
- [ ] 9.4 Verify the open and closed states still animate and that the transition still runs
- [ ] 9.5 Record the changed layout for long content in `UPGRADE.md` and in the `2.0.0` section of `CHANGELOG.md`, since a consumer relying on the old cap will see different heights

## 10. Toggle Markup

*Capability: `component-contract`, `docs-markup`. **Breaking** — documented element type changes.*

- [ ] 10.1 Change the documented toggle bars from `div` to `span`, and update the framework's own selectors so the styling is unchanged
- [ ] 10.2 Update the navbar and collapsible documentation so the demonstrated markup matches, in both the live demo and the code sample
- [ ] 10.3 Verify the built documentation reports no `element-permitted-content` violation in the demo region
- [ ] 10.4 Verify a consumer's existing class-based selectors still match after the element type changes
- [ ] 10.5 Record the substitution in `UPGRADE.md`, naming both the before and after markup, and in the `2.0.0` section of `CHANGELOG.md`

## 11. Documentation Gate Partition

*Capability: `docs-markup`, `build-verification`. Lands before the markup work so the contract-bearing region is separable from the style churn. One ceiling covering both means a template cleanup can mask an invalid demo — which is the failure that reached the downstream theme as 96 errors on 24 pages.*

- [ ] 11.1 Emit an explicit region marker from the shortcode that renders each live demo, so demo markup is identifiable in the built output
- [ ] 11.2 Partition the built pages at those markers in `scripts/check-html.mjs`, producing two disjoint file sets, and verify the page set is unchanged from the single-set case
- [ ] 11.3 Record a separate per-rule baseline per region, and verify a violation in either fails only its own baseline
- [ ] 11.4 Record the demo-region **count** in the baseline, and verify a change to it is reported as a structural change rather than passing as a reduction — a gate satisfied by validating less is not a gate

## 12. Live Demos as Reference Implementation

*Capability: `docs-markup`. The demos are what a reader copies, so this region reaches zero on its own merits and is not credited with the page chrome's progress.*

- [ ] 12.1 Correct the documented navbar toggle markup that produces `element-permitted-content`, and verify the demo region's count reaches zero for that rule
- [ ] 12.2 Correct every remaining validity or accessibility defect located in a demo, and verify the demo region's baseline reaches zero with the chrome region unchanged
- [ ] 12.3 Verify the demo baseline reaches zero without disabling a rule to absorb a violation, and that every disabled rule states why
- [ ] 12.4 Verify a demo copied verbatim reports no violation without the documentation's own scaffolding around it

## 15. Font Loading

*Capability: `component-contract`. Changes the framework's default network behavior.*

- [ ] 15.1 Default the font source to disabled so the shipped stylesheet initiates no third-party request, and verify the built stylesheet contains no `@import url(...)` to a remote origin
- [ ] 15.2 Provide a documented way for a consumer who wants the framework's fonts to load them, and verify the opt-in is discoverable from the configuration
- [ ] 15.3 Verify the font stack still degrades acceptably with the framework fonts absent
- [ ] 15.4 Record the behavior change in `UPGRADE.md` with the migration stated, and in the `2.0.0` section of `CHANGELOG.md`

## 16. Documentation of the Framework Contract

*Capability: `component-contract`, `docs-markup`.*

- [ ] 16.1 Document the `input[id^=collapsible]` identifier contract explicitly, rather than leaving consumers to infer it from the stylesheet, and record that 2.x does not change it
- [ ] 16.2 Document which element types are interchangeable for the toggle's bars and why, so the constraint is discoverable before a consumer hits it
- [ ] 16.3 Document the breaking changes with before-and-after markup for each, pointing at `UPGRADE.md` as the canonical location rather than restating them in a second place that can drift
- [ ] 16.4 Document the verification workflow for contributors, and verify the documented command runs the same gates as continuous integration

## 17. Dependency Audit Classification

*Capability: `build-verification`. Closes the group 4 audit story without taking on resolution risk. Group 4 already measured the before/after count; this group records it and classifies the remainder by reachability. Resolving the reachable findings is the separate `dependency-hardening` change, so an unmergeable upstream bump cannot block this release.*

- [ ] 17.1 Record the post-replacement `npm audit` finding count against the 4.2 baseline (73 findings before the replacement: 2 critical, 22 high, 48 moderate, 1 low; 18 after: 0 critical, 17 high, 1 moderate), and verify the comparison is reproducible and the delta is explained
- [ ] 17.2 For each remaining finding, record whether it is reachable from the build or development workflow, naming the command or path that reaches it, and verify no finding is left unclassified

## 18. Documentation Site Deployment

*Capability: `build-verification`, `release-documentation`. The documentation is this framework's primary teaching surface, so it is published to a repository-owned address rather than left resolving to the upstream project's domain. GitHub Pages hosts it at **https://papercss.r15cookie.com**, built by the same gates that verify every other artifact.*

- [ ] 18.1 Add a GitHub Pages workflow that builds the documentation through the gated build and publishes the generated output, reusing `make check`'s sequence rather than restating it, and verify the published page set is the same set `make check-docs` validates
- [ ] 18.2 Set `docs/config.toml`'s `baseURL` to `https://papercss.r15cookie.com/` and add `docs/static/CNAME` containing that host, and verify the built pages emit the canonical URL for their assets and links and that the published output contains the `CNAME` file
- [ ] 18.3 **[Manual — owner: ssmiller25]** When the site is ready to be announced, configure the GitHub Pages custom domain in the repository settings, add the DNS record in the `r15cookie.com` zone pointing `papercss.r15cookie.com` at GitHub Pages (a `CNAME` to `<owner>.github.io`), and enable **Enforce HTTPS** once the certificate is issued. Verify `https://papercss.r15cookie.com` serves the published site over HTTPS. This is done at deploy time rather than committed, because the domain and certificate depend on repository settings this change does not control
- [ ] 18.4 Update `README.md` to name `https://papercss.r15cookie.com` as the canonical documentation URL, replacing the upstream `getpapercss.com` and `develop.getpapercss.com` references, and verify no repository metadata presents another project's domain as this one's
- [ ] 18.5 Update the documentation templates' hardcoded canonical links — the OpenGraph/Twitter URL in `docs/layouts/partials/head/opengraph.html` and any other absolute reference — to the new address, and verify no built page or metadata still presents `getpapercss.com` as this project's site

## 19. Signed Releases

*Capability: `build-verification`, `release-documentation`. A release should be verifiable, not merely downloadable. GitHub can sign it natively: `actions/attest` produces keyless Sigstore build-provenance attestations tied to this repository and the release workflow; an immutable release is signed by GitHub and its assets and tag cannot be altered after publication; and an SSH-signed tag covers the repository tree the CDNs serve, which release attestations do not reach. Cosign bundles and GPG-signed checksums are deliberately **not** used. This group must land before the cutover in group 20.*

- [ ] 19.1 Upgrade the build-provenance attestation from `actions/attest-build-provenance@v2` to `actions/attest@v4`, add the `artifact-metadata: write` permission, and extend coverage to every released artifact — `paper.css`, `paper.min.css`, `papercss-<version>-src.tar.gz` and `provenance.json` — and verify `gh attestation verify <file> --repo ssmiller25/papercss --signer-workflow ssmiller25/papercss/.github/workflows/release.yml` accepts each
- [ ] 19.2 **[Manual — owner: ssmiller25]** Enable immutable releases for the repository (or organization), so every published release is signed by GitHub and its assets and tag can no longer be added to, modified or deleted; verify `gh release verify <tag>` and `gh release verify-asset <tag> <file>` succeed against a published release
- [ ] 19.3 Configure SSH signing for release tags, using an SSH key registered on the maintainer's GitHub account as a signing key, and sign the tag (`git tag -s`); verify GitHub shows the tag as **Verified** and `git verify-tag <tag>` accepts it locally
- [ ] 19.4 Verify the signed tag covers the CDN-served artifact: confirm the tag signature validates and that `dist/paper.css` and `dist/paper.min.css` at that tag match the digests recorded in the release's `provenance.json`, since the CDNs serve the repository tree rather than the release assets
- [ ] 19.5 Add a post-release gate that the released artifacts carry a valid attestation and that the release is immutable, and verify it fails against a release or tag that has neither
- [ ] 19.6 Document consumer verification in `README.md` (or the documentation site) — `gh attestation verify`, `gh release verify`, and tag-signature verification — and record in `AGENTS.md` that cosign bundles and GPG-signed checksums are deliberately not used
- [ ] 19.7 Document the maintainer-side signing setup in `DISTRIBUTING.md`: enabling immutable releases, configuring SSH signing, and the verification step to run before announcing a release

## 20. Release Cutover and End-to-End Verification

*Capability: `build-verification`, `release-documentation`. These tasks cannot run until the pipeline, the signed-release work, and every earlier group are in place on `main` and the release workflow is live — which is not true until this change is merged. They are therefore last, and none runs from a feature branch. This group absorbs the former tasks 6.5 (dry run) and 6.14 (end-to-end), moved here because they are the only section-6 work that cannot be executed earlier.*

- [ ] 20.1 Merge this change into `main` through a pull request — never a direct push — so `make check` runs on the merge commit, and verify every required check is green before merging
- [ ] 20.2 With the pipeline live on `main`, dispatch the `Release` workflow in dry-run mode (`workflow_dispatch` with `dry_run: true`) and verify it assembles the full artifact set — `paper.css`, `paper.min.css`, `papercss-<version>-src.tar.gz`, `provenance.json` — and publishes nothing
- [ ] 20.3 Press the first tag through the GitHub release process: create a **draft** release for `v2.0.0-rc.1` (which creates the tag and triggers the `Release` workflow), watch `make check` run, and verify the workflow attaches the artifacts and publishes the draft only after the gates pass
- [ ] 20.4 Verify the prerelease end to end: artifacts downloadable, the `CHANGELOG.md` entry present, documented download and clone URLs resolving to the tagged artifacts, the `jsDelivr` and `Statically` CDN URLs serving the tagged build, the artifacts attestable with `gh attestation verify`, the tag signature valid, and the release marked as a prerelease and not offered as current
- [ ] 20.5 Publish the stable `v2.0.0` release once the prerelease is verified, and verify the documented download and CDN URLs resolve to `2.0.0`
- [ ] 20.6 If the candidate needs further integration or compatibility fixes, cut a dedicated follow-up branch from `main` (for example `release/2.0.1`), land the fixes with their own gates and a `2.0.1` changelog entry, and release `v2.0.1` as a new tag — never mutate the published `v2.0.0` tag

*The page-chrome and style-cleanup groups that an earlier draft bundled here are now separate changes: `docs-accessibility` and `docs-style-cleanup`. The dependency group is split by risk: group 17 measures and classifies here, and resolving the reachable findings is the `dependency-hardening` change.*
