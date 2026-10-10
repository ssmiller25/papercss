# Distributing PaperCSS

A release is a tag, pressed through the GitHub release process.
`.github/workflows/release.yml` runs the repository's own gates and, only if they
pass, attaches the artifact set to the release and publishes it. Nothing is
published by hand, and nothing is published to npm or any other package
registry.

## Cutting a release

The tag is the single source of truth. Do not publish anything by hand.

1. Prepare the version. `make check` runs `node scripts/check-release.mjs` and
   fails when these disagree with the tag:
   - `package.json`'s `version`
   - `docs/data/release.json`'s `version`
   - a section in `CHANGELOG.md` for the version
2. Commit the final source and the regenerated `dist/`.
3. Merge to `main` through a pull request and confirm the **Verify** workflow is
   green. Do not tag from a feature branch.
4. Press the tag through the GitHub release process: create a **draft** release
   for the tag, for example `v2.0.0`. Creating the release creates the tag, and
   the tag push triggers the **Release** workflow:

   ```sh
   gh release create v2.0.0 --draft --target main --title v2.0.0 --generate-notes
   ```

5. Watch the **Release** workflow complete. It runs `make check`; only when the
   gates pass does it upload the artifact set and publish the draft. If the
   gates fail, the release stays a draft with no artifacts — fix the tree and
   delete and re-push the tag rather than publishing a failed build.
6. Confirm the pipeline is fully green and the artifacts are attached before
   announcing the release.

A release cut from a tree that fails its gates, or with a version that disagrees
with the tag, fails before anything is published.

## What a release publishes

- `paper.css`
- `paper.min.css`
- `papercss-<version>-src.tar.gz` — the SCSS source, for consumers who build
  from source
- `provenance.json` — the repository, commit and digests the artifacts were
  built from

## Signing a release

Every release is verifiable without a long-lived signing key:

- **Build provenance.** The Release workflow attests every released artifact
  with `actions/attest`, keyless and bound to this repository and the release
  workflow through GitHub's OIDC identity. Verify one with:

  ```sh
  gh attestation verify paper.css --repo ssmiller25/papercss \
    --signer-workflow ssmiller25/papercss/.github/workflows/release.yml
  ```

- **Immutable releases.** Enable **Immutable releases** in the repository (or
  organization) settings. GitHub then signs the published release and prevents
  its assets and tag from being added to, modified, or deleted afterwards.
  Verify with `gh release verify v2.0.0`.

- **SSH-signed tags.** The tag is signed with an SSH key already registered on
  the maintainer's GitHub account as a signing key, so the repository tree the
  CDNs serve is covered too. Configure git once:

  ```sh
  git config gpg.format ssh
  git config user.signingkey ~/.ssh/id_ed25519.pub
  ```

  Create the tag with `git tag -s v2.0.0 -m v2.0.0` and push it (or create the
  draft release from the signed tag). GitHub shows it as **Verified**, and
  `git verify-tag v2.0.0` checks it locally.

Cosign bundles and GPG-signed checksums are deliberately **not** used; see
`AGENTS.md` for why.

## Cutover for 2.0 and follow-up releases

The first release of a major line has an order later releases do not:

1. Merge the change branch into `main` through a pull request, so `make check`
   runs on the merge commit. Do not push to `main` directly.
2. With the pipeline live on `main`, dispatch the **Release** workflow in
   dry-run mode and confirm it assembles the full artifact set and publishes
   nothing.
3. Press a prerelease tag (`v2.0.0-rc.1`) through a draft release and verify it
   end to end: artifacts downloadable, changelog entry present, documented
   download and clone URLs resolving, both CDNs serving the build, and the
   release marked as a prerelease rather than current.
4. Publish the stable `v2.0.0` once the candidate is verified.

If the candidate needs integration or compatibility fixes, do **not** mutate its
tag. Cut a dedicated follow-up branch from `main` (for example
`release/2.0.1`), land the fixes with their own gates and a `2.0.1` changelog
entry, and release `v2.0.1` as a new tag.

## Distribution to other websites

There is no package registry. Other sites consume the released stylesheet
through open CDNs that serve the tagged repository tree:

- jsDelivr (primary):
  `https://cdn.jsdelivr.net/gh/ssmiller25/papercss@v2.0.0/dist/paper.min.css`
- Statically (fallback):
  `https://cdn.statically.io/gh/ssmiller25/papercss@v2.0.0/dist/paper.min.css`

Because the CDN reads the repository tree at the tag, `dist/paper.css` and
`dist/paper.min.css` must be committed at the tagged commit. The
`dist/`-in-sync gate already requires that, so a release cannot attach a build
that the CDN does not have. A release that only attached the files would
download from GitHub and 404 on the CDN.

An exact tag is immutable. jsDelivr caches a tagged file permanently, so a
corrected or re-tagged release is published under a new tag rather than by
mutating an existing one. There is no CDN purge step because every documented
URL is an exact tag; a mutable alias (`@latest`, a partial version, a branch or
a commit) is rejected by `make check-consumption`, since that is the only shape
that could serve a stale copy.

Verify a published release with:

```sh
make check-cdn TAG=v2.0.0       # both CDNs serve the tagged build
make check-signing TAG=v2.0.0   # every artifact is attested and the release is immutable
```

## Package registry

PaperCSS is not published to any package registry. Consumers obtain the
framework from the GitHub Release or the CDNs above.
