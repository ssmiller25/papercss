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
| `npm audit` | 92 findings, 3 critical when first measured. **Now 73 / 2** — group 1 removed `hugo-bin` and `pre-commit`, whose trees accounted for 19 findings and 1 critical. Re-measured at task 4.2 |
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
- A framework other websites can link without downloading anything and without a package registry, served from the tagged repository by open CDNs.
- The remaining dependency findings measured and classified, with resolution split into a follow-up so it cannot gate the release.
- A documentation site published at a repository-owned address rather than the upstream project's domain.

**Non-Goals:**
- Restyling. No visual change to any component.
- Changing the *values* in the colour palette or `$colors` map. The palette is preserved value-for-value; only the Sass functions that compute it are replaced.
- Adding capabilities 1.9 does not have. `prefers-color-scheme` is not introduced — the dark theme stays class-activated, because adding an automatic mode is a feature and this change is a defect-and-toolchain release.
- Resolving the 92 `npm audit` findings. Most are resolved incidentally by the toolchain replacement; the remainder are measured against the pre-change baseline and classified by reachability here (group 17), but their resolution is sequenced separately (the `dependency-hardening` change), because the Dependabot branches carrying those bumps have been unmerged upstream since 2023 and merging them wholesale is a distinct piece of work with its own regression surface.
- Publishing to a package registry. A release does not run `npm publish` or push to any registry; distribution outside GitHub Releases is served from the tagged tree by open CDNs. This is a removal, not a deferral.
- The documentation's page-chrome accessibility defects and style debt. They are split into `docs-accessibility` and `docs-style-cleanup`; only the demos a consumer copies are held to zero here.

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

### Decision 9: The build toolchain is replaced with maintained tools

**Rationale.** The forcing argument is already visible in the landed notes for section 2: the pipeline needs **two** stylelints today, because stylelint 13 lacks `declaration-property-value-no-unknown`, so the gate that catches `padding: none` cannot run through `npm run lint`. That workaround is a direct consequence of the 2019 tree, and it means the most important gate in the repository depends on a tool resolved from outside the project. Everything else is past end-of-life and `hugo-bin` is already broken. 2.0 is the breaking release, so it is the place to move once rather than accumulate a second migration later.

**What Sass actually requires, measured rather than assumed.** This decision originally targeted Sass 2.x, on the understanding that 2.0 removes `@import` and the global built-in functions. That is wrong, and the correction changes the plan materially. Verified by compiling the current sources with `sass@1.105.1`:

| Deprecation | Occurrences | Removal target |
|---|---|---|
| `@import` | 29 | **3.0.0** |
| global built-ins (`map-get`, `map-keys`, `str-slice`, `str-index`, `str-length`) | 14 | **3.0.0** |
| `darken()` / `lighten()` | 62 | 3.0.0 |
| **`/` division** | **2 sites** | **2.0.0** |

There is no Sass 2.x to move to — `latest` is 1.105.1 and no 2.x release exists. So the target is **the current 1.x**, and the work is: fix the two `/` division sites in `src/layout/_flexbox.scss` (lines 7 and 8, both in `create-flex-classes`), and migrate the 76 global built-in calls off the global namespace so the color-function warnings go away. `@import` stays.

**The consequence worth the most: 2.0 ships with no Sass-consumer break.** `_config.scss` carries **109 `!default` declarations**, and that is how consumers configure the framework — assign `$primary` before importing, and the `!default` honours it. That mechanism works identically on 1.x. Migrating to `@use` would move configuration to `with (...)` and break every Sass consumer, but nothing forces that before 3.0.0, so 2.0 does not do it. The migration remains available as separately reviewable work when 3.0.0 makes it necessary.

**Consequence for verification.** Modern equivalents emit different generated output — different minification, different prefixing, possibly reordered declarations — so "the built stylesheet is unchanged" is verified as **equivalence of resolved declarations per selector, values included**, not as a byte diff. A one-time byte difference is expected and recorded rather than treated as a regression.

**Ordering.** This lands *before* the framework defect fixes, not last. Every later verification then runs against the toolchain that actually ships, and the two-stylelint workaround disappears as part of it instead of lingering as a permanent oddity.

**Cost accepted.** Migrating 76 built-in calls is real work in the sources. Adopting the remaining ~186 `@import`-related deprecation warnings is not, and is not done.

### Decision 10: The dark theme is a preserved surface, verified by resolved value

**Rationale.** Dark mode is one `html.dark` block at `src/core/_config.scss:247`, generated by `@each` over a shared theme map, and every component consumes the theme through `var(--…)`. So there is no per-component dark styling to lose — and no per-component dark styling to catch a loss. One missing custom property degrades every component that reads it, produces no build error, and no stylelint rule objects, because a missing custom property is not invalid CSS. It is precisely the failure this change exists to eliminate.

The theme's palette is computed by 62 `darken()`/`lighten()` calls, 56 of them in `_config.scss`. Those are **deprecated, with removal targeted at Dart Sass 3.0.0** — not 2.0.0, and not yet. This decision previously claimed the theme was one dependency bump from vanishing; that overstated it, and the correction matters. On 1.105.1 the palette compiles exactly as before and emits a deprecation warning per call site. Nothing is at risk today.

**Why the gate is still worth building.** The theme's fragility does not come from the deprecation timeline; it comes from the structure. One missing custom property silently degrades every component reading it, and nothing in the pipeline would notice — which is the same failure mode as `padding: none`, where a declaration the browser discards leaves a rule that looks correct. The gate is what makes the theme's completeness a checked property of the build rather than a reviewer's memory. It is insurance against the 3.0.0 migration and against any future edit to the theme map, not a response to an emergency.

**How it is verified.** By resolved value, not by presence. The recorded baseline captures every custom property the light theme declares *with its value*, and the gate compares values. A check that compared only property names would pass a wholesale palette rewrite, which is the exact outcome that must not pass silently.

**Consequence.** The `rgba` cases are called out rather than left to whichever function the migration happens to reach for: `lighten()` on an `rgba` lightens the colour channels and leaves alpha alone, and `color.adjust` and `color.scale` do not all agree on that, so `--white-dark-light-80` is verified channel by channel.

### Decision 11: Release history and upgrade path are committed artifacts

**Rationale.** 2.0 changes the toggle's element type, its focusability, the height cap, and the default font loading. Each is a silent behaviour change for a consumer who reads only the release notes, and none raises an error — which is the same argument as Decision 10, applied to documentation.

The gap is larger than it sounds. The repository has **no `CHANGELOG.md` at all**, and 24 tagged releases are undocumented. So 2.0 would otherwise be the first release in the project's history to be documented anywhere, and the version consumers are migrating *from* would have no record of what it contains. The 25 existing tags make the history reconstructable, so there is no excuse for leaving it.

**Consequence.** `CHANGELOG.md` is reconstructed from the tags with a dated entry and user-visible changes per release. `UPGRADE.md` states, per breaking change, the before and after, why it changed, and the substitution a consumer must make — including the confirmation from Decision 10 that the dark theme's surface is unchanged. Component tasks write into these files as they land rather than reconstructing them at the end, so neither document is written from memory after the fact.

### Decision 12: A release is a tag, verified — and the tag is the only version number

**Rationale.** `DISTRIBUTING.md` documents the current release as: update the version in `package.json`, `package-lock.json` and `docs/content/_index.md`; commit; tag; open the GitHub UI; drag `paper.css` and `paper.min.css` into "Attach Binaries"; then `npm publish`. Every step is manual and no step checks the others. The version lives in three files with nothing verifying they agree, and the stylesheet is uploaded by hand, so a release can be labelled `1.8.3` while built from `1.8.2` sources — a mismatch that is invisible precisely because consumers have no way to check.

The deeper cost is that the documentation's download links are **already wrong, and have been long enough to be load-bearing**. `docs/content/_index.md` points its GitHub Releases buttons at `github.com/rhyneav/papercss` and its "build it yourself" clone URL at `github.com/papercss/papercss` — both the upstream project, not this fork. So the primary download buttons on this fork's documentation hand a visitor the original author's 1.9.2 build, and the build instructions describe a repository whose sources differ from the ones being shipped. A pipeline that publishes here does not fix that on its own; the documentation has to be repointed and gated, which is why this decision covers both halves.

**Mechanism.** The tag is the single source of truth. `package.json`'s version must agree with it, and disagreement fails the release rather than warning. The tag is pressed **through the GitHub release process**: creating a draft release creates the tag, the tag push runs the workflow, and the workflow publishes the draft only after `make check` passes — so the release exists as a draft while the gates run and cannot be offered to consumers until they pass. `make check` is Decision 6's single entry point, reused rather than restated in a second place that can drift. A prerelease tag is published as a prerelease and does not become the latest release, so `2.0.0-rc.1` cannot quietly ship as `2.0.0`.

**Artifact set.** `paper.css`, `paper.min.css`, and an SCSS source archive. The third is not optional: the framework documents building from its Sass source, so a consumer needs `src/` in the release for that path to work at all — and it is what makes the preserved `!default` configuration mechanism in Decision 9 usable by anyone who wants to customise the palette rather than just consume the compiled CSS.

**Why GitHub Releases only, with no package registry.** An earlier draft kept `npm publish` as a documented manual step. That is removed rather than deferred, for the reason that made it a candidate for deferral in the first place: a release that half-succeeds is worse than either channel alone, and keeping a second channel means keeping a second failure mode and a second set of documented instructions for a path this fork does not want to promise. Removing it also removes the consumption paths that depend on it — the `npm install` instructions, the `node_modules/papercss/...` locations, the unpkg snippet, and the `.npmignore` file that exists only to shape an `npm pack`. The artifact set is identical either way, so nothing is lost but the ambiguity.

**Consequence.** The documented version is read from one place and gated against the tag, so the six hardcoded `1.9.2` strings in the documentation become a build failure rather than a stale link.

**Split across capabilities.** The mechanism is a `build-verification` concern — it is CI deciding what may ship. The consumer-facing half is `release-documentation` — where the artifacts are pointed at and whether the documented paths are satisfiable by what is published. Two capabilities, one decision, because both halves have to land together for either to be worth anything.

### Decision 13: Internal constants are marked, not made configurable

**The question.** Task 4.5's guard found that `src/layout/_flexbox.scss:3` declares `$number-columns: 12;` **without** `!default`, so a consumer who assigns it before the import gets no effect. It reads like configuration — a top-level `$` in the framework's source — and is not. Should it be made overridable, renamed private, or left alone?

**What the codebase says.** It is not a lone anomaly. `$base`, `$large`, and `$small` in `_utilities.scss` are the same thing: top-level, no `!default`, used only in their own file, undocumented as configurable. The configuration surface is the **109 `!default` declarations in `_config.scss`**; these four are internal constants that happen to be globally visible because `@import` has no scope. The docs reinforce that reading for this specific value: *"the flexgrid is a grid system that supports up to 12 columns per row."*

**Options considered.**

*Make it overridable.* Rejected. It is the only option that adds capability, but it adds it in the worst place. Once settable it is a permanent public commitment — `component-contract` requires a configurable value to stay configurable, which at 3.0.0 means `@forward` and `with ()` support on the critical path. It contradicts the documented 12-column contract. And it is unvalidated: `@for $i from 1 through $number-columns` with `0`, a negative, or a non-integer yields empty output or a bare Sass error, so publishing it invites exactly the mistake. Output scales at five breakpoints — 12 columns is 60 rules, 16 is 80. If a configurable grid is wanted it is a legitimate feature, but it belongs in its own change with validation, docs, and `@forward`, not folded into a toolchain group as an incidental `!default`.

*Rename it private.* Rejected as premature. Under `@import` a `-`/`_` prefix is a signal, not a guarantee: it does not prevent access or assignment. Nothing in `src/` currently uses the convention, so it would introduce one, and applying it consistently means renaming two files' worth of constants during a toolchain change. More to the point, the migration already does this structurally — under `@use`, any member not `@forward`ed is private by construction, with no prefix required. Renaming now buys a convention the module system is about to provide for free.

*Leave it, and mark it.* **Chosen.**

**What is done instead.** The behaviour is unchanged, and each of the four declarations carries a comment stating that it is internal and that assigning it before the import has no effect. That is the cheap half of the fix: it does not add API, does not contradict the docs, and does not churn the spacing scale, but it removes the silent no-op from the "looks fine, is wrong" class by making the intent readable where the mistake would be made. A `component-contract` requirement — *internal constants are distinguishable from configuration* — carries the rule forward past this change, and states that the module migration must make internal values private by construction without stranding any value a consumer can configure today.

**Why this is a decision rather than a note.** The trap is real and repeated across four values, and the cheapest option is not the obvious one: the naming invites configuration, and the natural fix is to grant it. Recording the reasoning here means the next person to notice `$number-columns` finds a deliberate choice with its costs stated, rather than re-deriving the question and reaching for `!default`.

### Decision 14: Distribution is registry-free, served from the tag by open CDNs

**The question.** With `npm publish` removed, how does another website consume PaperCSS? "Download a zip from the GitHub Release" answers it for someone setting up a project by hand, but not for a page that wants a `<link>` to a versioned stylesheet — which is what a CDN URL provides and what the removed unpkg snippet used to provide.

**Options considered.**

- **npm + unpkg/jsDelivr `/npm/`.** Rejected. It reinstates exactly the registry dependency this change removes, and it is what the current documentation points at. The `unpkg.com/papercss@1.9.2/...` links in `docs/content/_index.md` are npm-backed and would break the moment publication stops.
- **`raw.githubusercontent.com`.** Rejected. It serves files as `text/plain`, so a browser refuses to apply them under `<link rel="stylesheet">`; it is not a stylesheet distribution channel.
- **GitHub Pages.** Viable but weaker: a single origin, no multi-CDN failover, and it couples artifact serving to the documentation deploy, so a documentation change becomes a distribution event.
- **An open CDN that resolves a GitHub tag (jsDelivr, Statically).** **Chosen.** Both serve `https://cdn.<host>/gh/<owner>/<repo>@<tag>/<file>` with no account, no submission and no registry. jsDelivr is the primary — multi-CDN (Cloudflare + Fastly), a permanent cache, correct `text/css`, and ~150 billion requests a month — with Statically (bunny.net + Cloudflare) documented as a fallback. Both are npm-free and derive the artifact solely from the GitHub tag.

**The load-bearing constraint.** These CDNs serve the repository *tree* at the ref, not the GitHub Release attachments. So the release must commit `dist/paper.css` and `dist/paper.min.css` at the tag, not merely attach them. That is already required by Decision 5 — `dist/` is tracked and gated in sync with `src/` — so this decision adds no new obligation, but it makes the tracked `dist/` load-bearing for a second reason and it is verified explicitly at task 6.16 rather than assumed. A release that attached artifacts without committing them would download fine from GitHub and 404 on every CDN, which is the "looks fine, is wrong" shape again.

**Consequence.** The documented CDN URL is pinned to a tag, so a consumer's link cannot drift; `@<tag>` is immutable. This is not merely a convention: jsDelivr caches a tagged file **permanently** and its purge API works only for version-aliased URLs, so an exact tag genuinely cannot change under a consumer's feet. A corrected or re-tagged release is therefore served under a **new tag** rather than by mutating an existing one, and the project has no purge step because it needs none (task 6.18). What follows is a gate: every documented CDN URL must be an exact tag, and a mutable alias (`@latest`, a partial version, a branch or a commit) fails, because that is the only shape that could serve a stale copy. The `style`/`jsdelivr` field in `package.json` can name the default file so the bare `/gh/<owner>/<repo>@<tag>` URL resolves to a stylesheet, but the explicit `dist/paper.min.css` path is what the documentation shows because it is unambiguous.

### Decision 15: The documentation site is published at a repository-owned address

**The question.** The documentation currently builds with `baseURL = "https://getpapercss.com"` — the upstream project's domain. The README links readers to `getpapercss.com` and `develop.getpapercss.com`. So this fork's primary teaching surface, like its download links (Decision 12), resolves to someone else's project. Where should it live?

**Options considered.**

- **Leave it on the upstream domain.** Rejected for the same reason the download links were repointed: it sends readers to a differently-versioned framework and gives them no way to tell. It is the same defect as Decision 12's wrong download buttons, on the docs host instead of the buttons.
- **The default GitHub Pages project URL (`https://<owner>.github.io/papercss/`).** Viable and free, but a project path under a personal domain is easy to mistake for a scratch deploy and gives no stable brand address; it also bakes a moving owner name into every canonical link.
- **A third-party host (Netlify, Vercel, Cloudflare Pages).** Rejected as unnecessary: it adds an account, a second CI integration, and a credential to manage for a static site GitHub already serves.
- **GitHub Pages behind a custom subdomain, `https://papercss.r15cookie.com`.** **Chosen.** Pages serves the built site for free from the same repository and CI; the custom domain is the repository owner's existing `r15cookie.com` zone, so the canonical address is stable and owned by this project. The README already references this host, so the intent predates the change.

**Mechanism.** The site is built by the same gated sequence as everything else (Decision 6) and published by a Pages workflow, so the deployed pages are the ones the gates verified. `docs/config.toml`'s `baseURL` becomes `https://papercss.r15cookie.com/`, and `docs/static/CNAME` carries the host so the published artifact tells Pages which domain it belongs to. The custom domain itself is **not committed**: it is a repository setting, and the DNS record lives in a zone this change cannot touch. Both are a manual deployment step the owner performs when the site is ready to be announced (task 18.3), not part of the automated pipeline.

**Consequence.** Canonical links must all agree on the new address, or the site's own metadata points somewhere else: the `baseURL`, the `CNAME`, and the hardcoded OpenGraph/Twitter URL are the three places to check (task 18.5). Until the manual step is done, the workflow still publishes to the default Pages URL, so the site is reachable before the domain is wired; the domain is a cutover, not a prerequisite for the build.

## Risks / Trade-offs

**Converting 60 single-quoted attributes touches 11 template files** → Mechanical, and verified by rebuilding and confirming the `attr-quotes` count reaches zero with the rest of the report unchanged. The alternative — disabling the rule — is a smaller diff that permanently weakens the gate.

**Removing `display: none` changes focus behaviour for existing consumers** → That is the point of the fix, but it is a breaking change: a stylesheet that assumed the input was invisible may need to account for a focusable control. The focus indicator must be visible, or the fix trades one accessibility failure for another.

**Dropping the Google Fonts `@import` changes first paint** → Consumers relying on PaperCSS to supply the fonts must link them. Defaulting `$font-src` to `false` makes the framework stop making a render-blocking third-party request on the consumer's behalf, which is the correct default for a distributed framework, but it must be a documented breaking change with the migration stated.

**The baseline hides 162 real defects until they are ratcheted** → Mitigated by the per-rule ceilings and by ordering the docs group so the framework-contract defects are fixed before the style cleanup, so that fixing real problems is never buried under churn.

**`npm audit` findings stay partly open** → Deliberate, and tracked. They are build-time dependencies of this repository only; consumers use the prebuilt `dist/paper.css` and never run it, so they carry none of the risk. The toolchain replacement resolves most of the 92; what remains is recorded with a count and classified by reachability (group 17) so improvement stays measurable, while resolution is the `dependency-hardening` change so a hard upstream bump cannot gate the release.

**The Sass migration can silently alter the theme** → The highest-consequence risk in this change, and the reason Decision 10 exists. The 56 palette-computing `darken`/`lighten` calls are removed in Dart Sass 3.0.0; substituted carelessly, the palette resolves to different colours or to nothing, and the build still succeeds. The risk is real but dated — nothing is at risk on 1.x today, where these calls warn rather than fail. Mitigated by recording every theme custom property with its resolved value *before* migrating, by gating on the presence of the `html.dark` block and the completeness of its property set, and by comparing values rather than accepting a successful compile.

**Migrating the built-in calls risks changing resolved values** → The 76 replacements are not all mechanical equivalents, and the colour ones are the trap: `lighten`/`darken` clamp the resulting lightness to 0-100%, `color.adjust` does not, and `color.scale` uses a different formula entirely. Seven theme values (including `--primary-dark`, which is `black` only because `darken(#41403e, 50%)` clamps -25% to 0) depend on that clamping, and Sass's own deprecation message suggests the non-clamping form. Mitigated by recording the resolved declaration set before touching anything, comparing values per selector afterward, and using a clamping helper verified value-identical to both functions including `rgba` alpha.

**Replacing the linter changes what the authoring gate accepts** → The modern equivalent of `stylelint-config-sass-guidelines` flags 76 global Sass function calls the current configuration does not. Those are migrated as their own task rather than absorbed by disabling rules, so the authoring gate is not quietly weakened to make the migration land.

**Splitting the documentation gate can be satisfied by validating less** → Mitigated by recording the demo-region count in the baseline and failing on a change to it, so the partition cannot quietly stop covering a demo.

**Reconstructing the changelog depends on the tags being legible** → Twenty-five tags is enough to reconstruct a real history, but a tag whose changes cannot be determined must be recorded as a gap rather than omitted, since a silently missing release is the same failure as no changelog at all.

**Publishing from a tag means a bad tag is a published release** → A mistyped `v2.0.1` cannot be unpublished, only superseded. Mitigated by making the gates run *before* publication rather than after, by requiring a `CHANGELOG.md` entry as a precondition, and by treating the first real release as a prerelease (task 19.4) so the mechanics are proven on something that can be superseded cheaply.

**Repointing the documentation will break inbound links** → The current download URLs point at the upstream project, so consumers following them have been getting upstream's build; correcting them changes where those links resolve. Accepted: the links were wrong, and leaving them wrong to preserve habit is the same failure as the rest of this change.

**The artifact set can drift from what the documentation promises** → A release could ship CSS only, or omit the source archive, leaving the documented Sass path unsatisfiable. Mitigated by defining the set once and gating that a release carries all of it — and that the published source archive really contains the entry point a Sass consumer needs, which is easy to break silently in exactly the same way the theme was.

**Removing npm publication breaks consumers who installed from npm** → Existing users of `npm install papercss` will stop receiving updates through that channel. Accepted: the package on npm is upstream's, not this fork's, so those users were never receiving this fork's releases anyway, and the registry path is removed by decision rather than neglect. The install instructions are repointed at the GitHub Release and the CDN, and the change is stated in `UPGRADE.md`.

**The CDNs serve the repository tree, not the GitHub Release attachments** → A release that attached the stylesheets but did not commit them would download from GitHub and 404 on every CDN. Mitigated by Decision 5's `dist/`-in-sync gate and by task 6.16, which verifies the tagged tree contains the artifacts rather than assuming it.

**A CDN can serve a stale cache for a re-tagged version** → Not applicable to the documented URLs: each is pinned to an exact tag, and jsDelivr caches an exact tag permanently, so it cannot drift; a corrected release is a new tag, not a mutated one. The exposure would exist only for a version-aliased URL (`@latest`, a partial version, a branch or a commit), which the documentation does not use and the gate rejects (task 6.18).

**The documentation site's `baseURL` and its deployed address disagree** → Assets and canonical links break or point off-site. Mitigated by setting `baseURL` and `CNAME` together (task 18.2) and by verifying the built pages emit the canonical URL before the domain is wired.

**The custom-domain step depends on settings this repository does not control** → The build and publish can succeed while the domain is not yet serving. Mitigated by making the domain a clearly-owned manual step (task 18.3) and by keeping the pipeline's output reachable at the default Pages URL in the meantime, so the site is never blocked on DNS or certificate issuance.

## Migration Plan

1. **Move the docs off blackfriday** so a supported Hugo can build them. Prerequisite for everything else. **Landed.**
2. **Land the pipeline green.** Per-rule baseline at the measured 4240, pinned tools, `make check`, CI. Nothing is fixed yet; the gate is simply capable of failing. **Landed.**
3. **Correct the one declaration value.** `padding: none`, because the new stylesheet gate fails on it and a gate that lands red teaches everyone to ignore it. **Landed.**
4. **Modernize the build, and gate the theme while doing it.** The toolchain moves to maintained versions and the built-in calls are migrated, with the theme's resolved values recorded first so any change to them is detected rather than absorbed. Then the linter replacement and the value-level equivalence check. Verified by resolved values, not by a byte diff.
5. **Framework fixes, one commit each.** Toggle focus, height cap, toggle markup, fonts — each with the gate that now proves it, and each recorded in `UPGRADE.md` as it lands.
6. **Documentation markup, demos only.** Partition the gate into demo and chrome regions first, then drive the framework-contract defects in the demos to zero. The chrome region keeps its recorded baseline; the chrome defects and the style rules are the `docs-accessibility` and `docs-style-cleanup` follow-up changes.
7. **Release documentation, finalized before the tag.** `CHANGELOG.md` reconstructed from the tags and carried forward release by release; `UPGRADE.md` complete against the recorded set of breaking changes.
8. **Release by tag.** The release pipeline and the documentation it points at are built alongside step 4's group, but the release itself is cut last, so the first tag carries every change in steps 5–7 and nothing is published from a tree that has not passed `make check`. The release publishes to no registry; the tagged tree is served by open CDNs, and the documented CDN URLs are verified against the release rather than assumed.
9. **Publish the documentation site.** The Pages workflow builds and publishes the site through the gated sequence; `baseURL` and `CNAME` are set to `papercss.r15cookie.com`. The owner then performs the manual custom-domain and DNS step when ready to announce (task 18.3). Until then the site is reachable at the default Pages URL, so the cutover is not on the critical path.

Rollback is per-step: steps 1–3 change no component behaviour beyond one corrected declaration, and steps 4–8 each land independently. Step 4 carries the only consumer-visible risk in this plan — the theme's resolved values — and it is guarded by recording them before the change rather than after. Step 8 is not rolled back at all, which is why it is last and why the gates run before publication rather than after.
