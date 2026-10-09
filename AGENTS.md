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

## Verify before shipping

Run `make check` (or let CI run it). It is the single entry point for the gate
sequence; do not restate the sequence in a second place that can drift.
