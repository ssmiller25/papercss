# AGENTS

Instructions for automated agents and maintainers working in this repository.
These are internal policy; the user-facing documentation should not carry them.

## Distribution: no package registry

PaperCSS is **not** published to npm or any other package registry. Do not:

- add an `npm publish` step to `.github/workflows/release.yml`, `DISTRIBUTING.md`,
  or any script;
- document installing the framework from a registry (`npm install papercss`,
  `yarn add papercss`, the `node_modules/papercss/...` locations, `unpkg.com/papercss`,
  or the `cdn.jsdelivr.net/npm/papercss` path);
- add `package.json` publish configuration or restore `.npmignore`.

Consumers obtain the framework from its GitHub Release or from the open CDNs
that serve the tagged repository tree (jsDelivr primary, Statically fallback).
`make check-consumption` enforces this: it fails on a registry-based
consumption path and on a mutable CDN alias.

## Release model

A release is a tag, pressed through the GitHub release process. The tag is the
single source of truth:

- `package.json`'s `version`, `docs/data/release.json`'s `version`, and a
  `CHANGELOG.md` section must all agree with the tag;
- `node scripts/check-release.mjs` (run from `make check`) enforces this, and
  also that the built `dist/` is committed at the tagged commit;
- the artifact set is defined once in `scripts/check-release.mjs`:
  `paper.css`, `paper.min.css`, and the SCSS source archive.

Do not reintroduce a manual release step or a second version source. See
`DISTRIBUTING.md` for the cutover procedure.

## Signed releases

A release is signed in three GitHub-native layers, all keyless except the tag:

- `actions/attest` produces a keyless build-provenance attestation for every
  released artifact, bound to this repository and the release workflow.
- Immutable releases make GitHub sign the published release and prevent its
  assets and tag from being added to, modified or deleted afterwards.
- The tag is SSH-signed with a key the maintainer already holds for Git.

Cosign keyless bundles and GPG-signed checksums are deliberately **not** used:
they add a dependency, or a long-lived key to protect and rotate, for a
verification path few consumers of a stylesheet will run, and either can be
added later without redoing this work. Do not add them without revisiting that
decision.

## Verify before shipping

Run `make check` (or let CI run it). It is the single entry point for the gate
sequence; do not restate the sequence in a second place that can drift.

## Dependencies

PaperCSS has **no runtime dependencies**: `package.json`'s `dependencies` is
empty, and consumers use the prebuilt `dist/paper.css` and never run this tree.
Everything in `devDependencies` is build or development tooling, so a finding
there does not reach a consumer.

Do not commit a snapshot of the `npm audit` result — it goes stale as the
advisory database and the dependency tree change. Audit live when a task needs
it:

- `make audit` runs `npm audit` against the current tree. Compare the count
  with the pre-toolchain baseline (**73 findings: 2 critical, 22 high, 48
  moderate, 1 low**); an unexplained increase is a regression, not something to
  accept silently.
- Classify each finding by tracing it to its top-level dependency with
  `npm explain <package>`, then asking whether a build or development command
  uses that dependency (a `package.json` script, or an import under `build/`,
  `scripts/`, `tests/`, or the stylelint config). A finding reachable that way
  is for the `dependency-hardening` change to resolve; one that is not is
  justified, not chased.

## Browser verification

Component behavior that only a layout engine can show — keyboard operability,
focus, the collapsible height — is checked with Playwright, not by driving a
system browser:

- `make test-browser` (or `npm run test:browser`) runs
  `tests/collapsible.spec.mjs` in Playwright's own headless Chromium, and is
  part of `make check`. The devcontainer installs that browser; on a fresh
  machine run `npx playwright install chromium` once.
- Never drive `/Applications/Google Chrome.app` or the system Chrome directly.
  It uses the real profile and triggers OS prompts; use Playwright's bundled
  browser instead.
- For ad-hoc page interaction, a Playwright MCP server is configured in
  `opencode.json`. Restart opencode after changing that file: config is loaded
  once at startup.
