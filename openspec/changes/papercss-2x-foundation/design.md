# Design

## Context

See `proposal.md` for motivation. The constraints that shape the approach:

**Downstream cannot be the escape valve.** The consumer that surfaced these defects is a Hugo theme that vendors `dist/paper.css` byte-for-byte and is contractually required to keep doing so. It cannot patch the file, and it cannot stop shipping. Every defect therefore has to be fixed here, and the reason each fix must be verified by something other than review is that four separate defects survived review for years.

**The build is healthy; the repository around it is not.** Verified on this branch, not assumed:

| Property | State |
|---|---|
| `npm run css:build` | succeeds |
| Build determinism | two consecutive builds produce byte-identical `dist/` (sha256 match) |
| `npm run lint` (stylelint 13, `sass-guidelines`) | passes |
| GitHub Actions workflows | **none** — `.github/` holds only a pull-request template |
| `dist/` tracked and in sync | tracked; rebuild leaves no diff |
| `npm audit` | 92 findings, 3 critical (the un-merged Dependabot branches) |
| Installed lint toolchain | stylelint 13 (2019), Node 22 in the devcontainer path |

So the framework's CSS is in better shape than its safety net. That shapes the pipeline: most gates start green, which is exactly the condition under which a green pipeline means nothing — so the first job of the pipeline is to be *capable* of failing.

**Where the four defects live, precisely.**

| # | Location | Defect |
|---|---|---|
| 1 | `src/components/_accordion.scss:24-25` | `> input { display: none }` — toggle out of tab order |
| 2 | `src/components/_navbar.scss:13-26` + `docs/content/docs/components/navbar.md` | `.bar*` documented as `div`s inside a `label` |
| 3 | `src/components/_navbar.scss:140` | `padding: none` |
| 4 | `src/components/_accordion.scss:33`, `src/components/_navbar.scss:125` | `max-height: 960px` clips |
| 5 | `docs/config.toml` | `defaultMarkdownHandler = "blackfriday"`, removed in Hugo 0.100 |
| 6 | `src/core/_config.scss:6,10` | Google Fonts `@import url(...)` inlined into `dist/` |

**Measured baseline for the documentation gate.** `html-validate` 11.16.2 at `html-validate:recommended` over the 33 pages the docs build produces (Hugo 0.131 + goldmark): **4240 errors**.

| Count | Rule |
|---|---|
| 2775 | `attr-quotes` |
| 1303 | `no-trailing-whitespace` |
| 37 | `no-inline-style` |
| 33 | `element-required-attributes` |
| 18 | `no-implicit-button-type` |
| 15 | `form-dup-name` |
| 15 | `void-style` |
| 12 | `element-permitted-content` |
| 8 | `wcag/h71` |
| 8 | `no-implicit-close` |
| 7 | `no-redundant-for` |
| 4 | `prefer-button` |
| 3 | `unique-landmark` |
| 2 | `no-raw-characters` |

Two facts about that number matter for reading the gate.

**It is 97% style.** `attr-quotes` and `no-trailing-whitespace` are 4078 of 4240. The framework's *actual* teaching defects are the other 162, and `element-permitted-content` (12) is the one that propagated downstream. Recording a 4240 baseline is honest but nearly unreadable, so the first task in the docs group is to clear the two style rules; the ratchet is what makes that visible rather than hidden.

**`attr-quotes` is a house style, not a defect.** The docs templates use `attr='value'` consistently, breaking only where a value contains a quote. The rule is therefore left **enabled** and the 60 offending occurrences are converted, rather than switching the rule off. Turning it off would be a one-line diff that permanently weakens the gate for anyone who adds a mismatched attribute later.

## Goals / Non-Goals

**Goals:**
- Gates that can fail, on artifacts that are actually shipped.
- A `dist/` that provably corresponds to `src/`.
- A documentation site buildable on a supported Hugo.
- The four defects fixed at the source, each verified by a gate rather than by review.
- The documentation site valid enough that copying from it is safe.
- A build toolchain made of maintained tools, so the gates run on one toolchain rather than two and nothing depends on a version no one supports.
- Every capability the 1.9 release shipped still present in 2.0, verified rather than assumed — most sharply the dark theme.
- A recorded changelog for every release the project has tagged, and a written upgrade path into 2.0.
- Releases produced by pushing a tag, not by hand-editing version numbers and dragging files into a web form.
- Documentation that points at the artifacts this repository actually publishes, verified rather than assumed.

**Non-Goals:**
- Restyling. No visual change to any component.
- Changing the *values* in the colour palette or `$colors` map. The palette is preserved value-for-value; only the Sass functions that compute it are replaced.
- Adding capabilities 1.9 does not have. `prefers-color-scheme` is not introduced — the dark theme stays class-activated, because adding an automatic mode is a feature and this change is a defect-and-toolchain release.
- Resolving the 92 `npm audit` findings. Most are resolved incidentally by the toolchain replacement; the remainder are recorded as measured and sequenced separately, because the Dependabot branches carrying those bumps have been unmerged upstream since 2023 and merging them wholesale is a distinct piece of work with its own regression surface.

## Decisions

### Decision 1: Gate the generated stylesheet, not only the SCSS

**Rationale.** `npm run lint` passes today and would have passed with `padding: none` still in the tree, because `stylelint-config-sass-guidelines` at version 7 checks formatting and Sass idiom, not whether a declaration value is real. `padding: none` is syntactically valid CSS that browsers discard — only a value-aware rule catches it. Running `declaration-property-value-no-unknown` over `dist/paper.css` catches it in one line of configuration.

**Consequence.** Two stylesheet configs, because the two artifacts have different jobs. `src/**/*.scss` is hand-written and gets the authoring ruleset. `dist/paper.css` is generated by sass, autoprefixer, and cssnano, and its formatting is those tools' business — holding generated output to 359 `rule-empty-line-before` and 80 `number-max-precision` complaints would be noise, not signal. The generated config is therefore correctness-only: unknown properties, at-rules, functions, units, and declaration values.

**On what is deliberately excluded from the generated config.** `declaration-block-no-duplicate-properties` fires 180 times on `dist/paper.css` and every one is a false positive. PaperCSS's `color()` mixin emits a literal fallback followed by the custom property:

```css
.text-primary {
  color: #41403e;
  color: var(--primary);
}
```

That is deliberate progressive enhancement — the literal for browsers without custom properties, the variable for those with them. The rule is left off with this reason recorded, because "we turned off a duplicate-property rule" is otherwise indistinguishable from "we did not care about duplicate properties".

### Decision 2: Baseline, then ratchet — and never auto-lower

**Rationale.** Landing 4240 errors and 4240 new failures at once is unreviewable and produces a permanently red gate. Recording the measured result and failing only on increases lets unrelated correctness work land on its own.

The ceiling is **per rule**, not just an aggregate. A single total lets a gain in one rule pay for a regression in another; in this repository specifically, clearing 2775 `attr-quotes` would otherwise license 2775 new ones.

Lowering a ceiling is a deliberate act — `make check-update-baseline` — never a side effect of a passing run. Otherwise the baseline drifts upward one "improvement" at a time and stops meaning anything.

**Alternative considered:** fix everything first, gate at zero. Rejected — the style cleanup alone is a 4240-error commit.

### Decision 3: The docs site is the reference implementation, not sample code

**Rationale.** A CSS framework's documentation markup is a contract. Every user who copies the navbar snippet gets whatever the docs demonstrate, including the `<div class="barN">` inside a `<label>` that produced 96 errors in the downstream theme. Treating docs markup as incidental is what let defect 2 ship for years.

So the docs are validated by the same gate as everything else, and their correctness defects are tracked to zero rather than baselined indefinitely. The 12 `element-permitted-content` are the framework's own; the `lang` and landmark defects are the docs template's. Both are this repository's problem.

One ceiling cannot carry both, though — see Decision 7.

### Decision 4: Hugo pinned in the devcontainer; `hugo-bin` removed

**Rationale.** `hugo-bin` cannot coexist with the goldmark migration and is broken independently of it. Its install script fetches a binary at install time, which npm 11 refuses to run without explicit approval — so on a current Node it installs no Hugo at all, and `npm run hugo:build` fails with a module error rather than a missing binary. What it does install when permitted is Hugo 0.74.3 from July 2020.

Meanwhile `docs/config.toml` demands blackfriday, which Hugo removed in 0.100, so the docs can only be built by a version that can never be current. The pin is caused by one config line.

Migrating to goldmark and pinning a current Hugo in the devcontainer fixes the toolchain and removes a dependency that fights the installer. Verified: the docs build on Hugo 0.131 with goldmark, 42 pages, after replacing the `[markup]` block.

**Consequence.** Hugo becomes a devcontainer/system prerequisite rather than an npm one. `npm run hugo:build` keeps working for anyone who has it on `PATH`, and the Makefile and CI both go through the devcontainer so they get the pinned version.

**On `unsafe = true`.** The goldmark renderer needs it, because the component demos *are* raw HTML in markdown — that is the entire mechanism by which the docs render live examples. It stays, deliberately, and is called out in the config rather than left to look like an oversight.

### Decision 5: `dist/` in sync, and the build must be reproducible

**Rationale.** `dist/` is tracked in git, which means it can be edited by hand and shipped without ever passing through sass. A rebuild that leaves a git diff catches exactly that, and costs one command. It also catches the inverse failure — someone edits `src/` and forgets to rebuild.

Determinism is a precondition for that check meaning anything: if two builds of identical input differed, "no diff after rebuild" would be noise. It currently holds — two consecutive builds are byte-identical — so the gate starts green and is asserting something real.

### Decision 6: One `make check`, invoked by CI

**Rationale.** The downstream theme's first pipeline had `htmlhint` in a workflow and nothing equivalent locally, and the two drifted until the local command did not exist at all. Here, CI runs `make check` and the Makefile is the only place the sequence is written down, so they cannot disagree.

`npm` scripts remain the primitives (`css:build`, `lint`); the Makefile composes them with the new gates rather than replacing them, so nothing that already works stops working.

### Decision 7: Live demos and page chrome are gated separately

**Rationale.** One baseline covering both means a demo fix and a template fix compete for the same ceiling, and the split is not cosmetic. 97% of the recorded count is template style; the defects with contractual weight live in the demos. A consumer copies the demo, not the chrome — so the demo region is the one whose count actually predicts whether copying from these docs is safe, and today it is indistinguishable from 1303 trailing-whitespace errors.

**Mechanism.** Demos are produced by Hugo shortcodes, so the demo regions are identifiable: each demo-emitting shortcode marks its output, and `scripts/check-html.mjs` partitions the built pages at those marks to produce two disjoint file sets, each with its own per-rule ceiling.

**On the obvious weakness.** A demo that stops rendering — or stops being marked — would silently shrink the gated set, which is the same class of failure as a baseline nobody tightens. So the recorded baseline also carries the **number of demo regions**, and a change to that count is reported as a structural change requiring review rather than passing as a reduction. A gate that can be satisfied by validating less is not a gate.

### Decision 8: The `input[id^=collapsible]` identifier contract is frozen

**Rationale.** Every collapsible rule is conditioned on this shape, which makes it load-bearing in the most literal sense: it is what identifies the element the framework acts on. Two consequences follow, and both argue for freezing it.

The first is that a change would not fail loudly. The downstream theme vendors `dist/paper.css` byte-for-byte and reproduces the documented markup; if the shape changed, its collapsibles would silently stop being styled — no error, no gate, just a navbar that stopped opening. The second is that the shape is load-bearing for the *fix* as well as the contract: it is the selector that identifies which element to keep focusable and visible-by-focus when `display: none` is replaced (task group 7). A looser identifier would hide controls the framework never meant to hide.

**Consequence.** 2.x does not change it. Any future change is a 3.x proposal carrying a documented migration, because it can only be made safely by migrating consumers' markup at the same time.

### Decision 9: The build toolchain is replaced with maintained tools, including the Sass module system

**Rationale.** The forcing argument is already visible in the landed notes for section 2: the pipeline needs **two** stylelints today, because stylelint 13 lacks `declaration-property-value-no-unknown`, so the gate that catches `padding: none` cannot run through `npm run lint`. That workaround is a direct consequence of the 2019 tree, and it means the most important gate in the repository depends on a tool resolved from outside the project. Everything else is past end-of-life and `hugo-bin` is already broken. 2.0 is the breaking release, so it is the right place to move once rather than accumulate a second migration later.

**Sass goes to 2.x, and that is a public-API change, not just a build change.** PaperCSS ships its Sass source to npm, and `src/styles.scss` is a flat tree of 29 `@import`s sharing one global namespace — no `@use` or `@forward` anywhere. Dart Sass 2.0 removes `@import` outright and removes the global built-in functions, of which this repository has **73**: 33 `lighten`, 29 `darken`, 8 `map-get`, 2 `map-keys`, 1 `str-length`. So the migration is not a search-and-replace; it is a conversion of every partial to the module system, plus an entry point that forwards the public API.

The consequence that matters most is not internal. `_config.scss` carries **109 `!default` declarations**, and that is how consumers configure the framework: today a Sass consumer assigns `$primary` before importing and the `!default` honours it. Under `@use` that mechanism does not exist; configuration moves to `with (...)`. Every Sass consumer of this framework therefore has a migration, and it is stated in `UPGRADE.md` with the substitution for each shape.

**Consequence for verification.** Modern equivalents emit different generated output — different minification, different prefixing, possibly reordered declarations — so "the built stylesheet is unchanged" is verified as **equivalence of resolved declarations per selector, values included**, not as a byte diff. A one-time byte difference is expected and recorded rather than treated as a regression.

**Ordering.** This lands *before* the framework defect fixes, not last. Every later verification then runs against the toolchain that actually ships, and the two-stylelint workaround disappears as part of it instead of lingering as a permanent oddity.

**Cost accepted.** Converting 29 partials, migrating 73 built-in calls, and migrating the 76 global Sass function calls the modern stylelint flags is the largest single piece of work in this change. It is scoped as its own task group precisely because it is that large.

### Decision 10: The dark theme is a preserved surface, verified by resolved value

**Rationale.** Dark mode is one `html.dark` block at `src/core/_config.scss:247`, generated by `@each` over a shared theme map, and every component consumes the theme through `var(--…)`. So there is no per-component dark styling to lose — and no per-component dark styling to catch a loss. One missing custom property degrades every component that reads it, produces no build error, and no stylelint rule objects, because a missing custom property is not invalid CSS. It is precisely the failure this change exists to eliminate, and it is one dependency bump away.

The dependency is not hypothetical. All 56 of the `darken`/`lighten` calls that compute the theme palette are deprecated as of Dart Sass 1.79 and **removed in 2.0** — which Decision 9 adopts. Left unmigrated, the palette compiles to nothing and the stylesheet still builds.

**How it is verified.** By resolved value, not by presence. The recorded baseline captures every custom property the light theme declares *with its value*, and the gate compares values. A check that compared only property names would pass a wholesale palette rewrite, which is the exact outcome that must not pass silently.

**Consequence.** Dark-theme preservation is a **prerequisite** of the Sass 2.x migration, not a parallel task, and the `rgba` cases are called out rather than left to whichever function the migration happens to reach for: `lighten()` on an `rgba` lightens the colour channels and leaves alpha alone, and the maintained equivalents do not all agree on that, so `--white-dark-light-80` is verified channel by channel.

### Decision 11: Release history and upgrade path are committed artifacts

**Rationale.** 2.0 changes the toggle's element type, its focusability, the height cap, and the default font loading. Each is a silent behaviour change for a consumer who reads only the release notes, and none raises an error — which is the same argument as Decision 10, applied to documentation.

The gap is larger than it sounds. The repository has **no `CHANGELOG.md` at all**, and 24 tagged releases are undocumented. So 2.0 would otherwise be the first release in the project's history to be documented anywhere, and the version consumers are migrating *from* would have no record of what it contains. The 25 existing tags make the history reconstructable, so there is no excuse for leaving it.

**Consequence.** `CHANGELOG.md` is reconstructed from the tags with a dated entry and user-visible changes per release. `UPGRADE.md` states, per breaking change, the before and after, why it changed, and the substitution a consumer must make — including the Sass consumer migration from Decision 9 and the dark-theme confirmation from Decision 10. Component tasks write into these files as they land rather than reconstructing them at the end, so neither document is written from memory after the fact.

### Decision 12: A release is a tag, verified — and the tag is the only version number

**Rationale.** `DISTRIBUTING.md` documents the current release as: update the version in `package.json`, `package-lock.json` and `docs/content/_index.md`; commit; tag; open the GitHub UI; drag `paper.css` and `paper.min.css` into "Attach Binaries"; then `npm publish`. Every step is manual and no step checks the others. The version lives in three files with nothing verifying they agree, and the stylesheet is uploaded by hand, so a release can be labelled `1.8.3` while built from `1.8.2` sources — a mismatch that is invisible precisely because consumers have no way to check.

The deeper cost is that the documentation's download links are **already wrong, and have been long enough to be load-bearing**. `docs/content/_index.md` points its GitHub Releases buttons at `github.com/rhyneav/papercss` and its "build it yourself" clone URL at `github.com/papercss/papercss` — both the upstream project, not this fork. So the primary download buttons on this fork's documentation hand a visitor the original author's 1.9.2 build, and the build instructions describe a repository whose sources differ from the ones being shipped. A pipeline that publishes here does not fix that on its own; the documentation has to be repointed and gated, which is why this decision covers both halves.

**Mechanism.** The tag is the single source of truth. `package.json`'s version must agree with it, and disagreement fails the release rather than warning. `make check` runs before anything is published, so no release is cut from a tree that fails its own gates — reusing Decision 6's single entry point instead of restating the sequence in a second place that can drift. A prerelease tag is published as a prerelease and does not become the latest release, so `2.0.0-rc.1` cannot quietly ship as `2.0.0`.

**Artifact set.** `paper.css`, `paper.min.css`, and an SCSS source archive. The third is not optional: once Decision 9's module migration removes `@import`, a Sass consumer needs `src/` and its entry point, so a CSS-only release would break the source-consumption path the documentation describes.

**Why GitHub Releases only.** `npm publish` stays a documented manual step. Trusted publishing is its own piece of work with its own failure mode, and a release that half-succeeds — GitHub Release created, npm publish rejected — is worse than either channel alone. It is a clean follow-up, and the artifact set is already the same either way.

**Consequence.** The documented version is read from one place and gated against the tag, so the six hardcoded `1.9.2` strings in the documentation become a build failure rather than a stale link.

**Split across capabilities.** The mechanism is a `build-verification` concern — it is CI deciding what may ship. The consumer-facing half is `release-documentation` — where the artifacts are pointed at and whether the documented paths are satisfiable by what is published. Two capabilities, one decision, because both halves have to land together for either to be worth anything.

## Risks / Trade-offs

**Converting 60 single-quoted attributes touches 11 template files** → Mechanical, and verified by rebuilding and confirming the `attr-quotes` count reaches zero with the rest of the report unchanged. The alternative — disabling the rule — is a smaller diff that permanently weakens the gate.

**Removing `display: none` changes focus behaviour for existing consumers** → That is the point of the fix, but it is a breaking change: a stylesheet that assumed the input was invisible may need to account for a focusable control. The focus indicator must be visible, or the fix trades one accessibility failure for another.

**Dropping the Google Fonts `@import` changes first paint** → Consumers relying on PaperCSS to supply the fonts must link them. Defaulting `$font-src` to `false` makes the framework stop making a render-blocking third-party request on the consumer's behalf, which is the correct default for a distributed framework, but it must be a documented breaking change with the migration stated.

**The baseline hides 162 real defects until they are ratcheted** → Mitigated by the per-rule ceilings and by ordering the docs group so the framework-contract defects are fixed before the style cleanup, so that fixing real problems is never buried under churn.

**`npm audit` findings stay partly open** → Deliberate, and tracked. They are build-time dependencies of this repository only; consumers use the prebuilt `dist/paper.css` and never run it, so they carry none of the risk. The toolchain replacement resolves most of the 92; what remains is recorded with a count so improvement stays measurable.

**The Sass migration can silently delete the theme** → The highest-consequence risk in this change, and the reason Decision 10 exists. All 56 palette-computing `darken`/`lighten` calls are removed in Dart Sass 2.0; unmigrated, the theme compiles to nothing and the stylesheet still builds. Mitigated by making the dark-theme tasks a prerequisite of the Sass migration, by gating on the presence of the `html.dark` block and the completeness of its property set, and by comparing resolved values rather than accepting a successful compile.

**The module migration breaks every Sass consumer at once** → Accepted as the cost of a single breaking release, and it is the largest migration in the change. Mitigated by an explicit entry point so `@use 'papercss'` works, by preserving `!default` so `with (...)` can still configure the framework, by verifying the built stylesheet's resolved declarations against the recorded set, and by stating each migration shape in `UPGRADE.md` rather than leaving consumers to infer it.

**Replacing the linter changes what the authoring gate accepts** → The modern equivalent of `stylelint-config-sass-guidelines` flags 76 global Sass function calls the current configuration does not. Those are migrated as their own task rather than absorbed by disabling rules, so the authoring gate is not quietly weakened to make the migration land.

**Splitting the documentation gate can be satisfied by validating less** → Mitigated by recording the demo-region count in the baseline and failing on a change to it, so the partition cannot quietly stop covering a demo.

**Reconstructing the changelog depends on the tags being legible** → Twenty-five tags is enough to reconstruct a real history, but a tag whose changes cannot be determined must be recorded as a gap rather than omitted, since a silently missing release is the same failure as no changelog at all.

**Publishing from a tag means a bad tag is a published release** → A mistyped `v2.0.1` cannot be unpublished, only superseded. Mitigated by making the gates run *before* publication rather than after, by requiring a `CHANGELOG.md` entry as a precondition, and by treating the first real release as a prerelease (task 6.14) so the mechanics are proven on something that can be superseded cheaply.

**Repointing the documentation will break inbound links** → The current download URLs point at the upstream project, so consumers following them have been getting upstream's build; correcting them changes where those links resolve. Accepted: the links were wrong, and leaving them wrong to preserve habit is the same failure as the rest of this change.

**The artifact set can drift from what the documentation promises** → A release could ship CSS only, or omit the source archive, leaving the documented Sass path unsatisfiable. Mitigated by defining the set once and gating that a release carries all of it — and that the published source archive really contains the entry point a Sass consumer needs, which is easy to break silently in exactly the same way the theme was.

## Migration Plan

1. **Move the docs off blackfriday** so a supported Hugo can build them. Prerequisite for everything else. **Landed.**
2. **Land the pipeline green.** Per-rule baseline at the measured 4240, pinned tools, `make check`, CI. Nothing is fixed yet; the gate is simply capable of failing. **Landed.**
3. **Correct the one declaration value.** `padding: none`, because the new stylesheet gate fails on it and a gate that lands red teaches everyone to ignore it. **Landed.**
4. **Preserve the dark theme, then modernize the build.** The theme tasks come first *inside* this step, because the Sass 2.x migration removes the functions the palette is computed with. Then the module-system conversion, the linter replacement, and the value-level equivalence check. Verified by resolved values, not by a byte diff.
5. **Framework fixes, one commit each.** Toggle focus, height cap, toggle markup, fonts — each with the gate that now proves it, and each recorded in `UPGRADE.md` as it lands.
6. **Documentation markup.** Partition the gate into demo and chrome regions first, then framework-contract defects in the demos, then the chrome defects, then the two style rules, tightening the baseline in the same change.
7. **Release documentation, finalized before the tag.** `CHANGELOG.md` reconstructed from the tags and carried forward release by release; `UPGRADE.md` complete against the recorded set of breaking changes, including the Sass consumer migration.
8. **Release by tag.** The release pipeline and the documentation it points at are built in step 4's group, but the release itself is cut last, so the first tag carries every change in steps 5–7 and nothing is published from a tree that has not passed `make check`.

Rollback is per-step: steps 1–3 change no component behaviour beyond one corrected declaration, and steps 5–8 each land independently. Step 4 is the only one needing care on rollback, because a consumer who has migrated to the module system cannot un-migrate — which is why it lands before the fixes it would otherwise complicate. Step 8 is not rolled back at all, which is why it is last and why the gates run before publication rather than after.
