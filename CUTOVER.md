# 2.0 cutover runbook

> **Temporary.** This file exists only for the 2.0 cutover. The stable 2.0.0
> release (step 6) removes it and archives the `papercss-2x-foundation` OpenSpec
> change, in the same commit the `v2.0.0` tag is created on.

The ordered procedure for cutting this fork's first release. It follows
`DISTRIBUTING.md`; where the two differ, this file is the specific 2.0 sequence
and `DISTRIBUTING.md` is the general rule. It tracks OpenSpec group 20.

## Preconditions

- `make check` is green on `release20`, and
  `openspec validate papercss-2x-foundation` passes.
- Immutable releases are enabled and the SSH signing key is registered on GitHub
  (tasks 19.2 / 19.3). **Unlock the key first** — it has a passphrase, and a tag
  cannot be signed without it:
  ```sh
  ssh-add ~/.ssh/id_ed25519
  ```
- The `github-pages` environment allows `release20` (Settings → Environments →
  `github-pages`). That is removed in step 7.

## 1. Merge to `main` (20.1)

Open a pull request from `release20` into `main`. Never push to `main` directly,
so `make check` runs on the merge commit. Merge only once the **Verify**
workflow is green.

## 2. Dry-run the release (20.2)

With the pipeline live on `main`, dispatch the **Release** workflow in dry-run
mode:

```sh
gh workflow run release.yml --ref main -f dry_run=true
gh run watch
```

Confirm it assembles `paper.css`, `paper.min.css`,
`papercss-2.0.0-src.tar.gz`, and `provenance.json`, and publishes nothing.

## 3. Push the signed prerelease tag (20.3)

The GitHub UI cannot produce a signed tag, so create and push it locally:

```sh
git checkout main && git pull
git tag -s v2.0.0-rc.1 -m v2.0.0-rc.1
git push origin v2.0.0-rc.1
gh run watch
```

The tag push triggers the **Release** workflow; the release is created and the
artifacts attached only after `make check` passes. If the gates fail, no release
is created — fix the tree, delete and re-push the tag.

## 4. Verify the prerelease end to end (20.4)

```sh
make check-signing TAG=v2.0.0-rc.1   # every artifact attested; release immutable
make check-cdn TAG=v2.0.0-rc.1       # both CDNs serve the tagged build
git verify-tag v2.0.0-rc.1           # tag signature valid locally
gh release verify v2.0.0-rc.1        # GitHub-signed immutable release
```

Then confirm by hand:

- The release is marked **pre-release** and is not offered as "Latest".
- The `CHANGELOG.md` 2.0.0 entry is present.
- The files both CDNs serve match the digests recorded in the release's
  `provenance.json` (the CDNs serve the repository tree, not the Release
  assets).
- The documented download and clone URLs resolve to the tagged artifacts.

## 5. Lock the Pages environment to `main` (20.5)

Remove `release20` from the `github-pages` environment's deployment branches and
tags (Settings → Environments → `github-pages` → Deployment branches and tags),
leaving `main`. Confirm a push to `main` still deploys and a push to `release20`
is rejected.

## 6. Publish the stable `v2.0.0` and clean up (20.6)

Once rc.1 is verified and every task is complete, this is the final release of
the change, so it also removes the runbook and archives the change. In one
commit on `main`:

1. Replace `## 2.0.0 — unreleased` in `CHANGELOG.md` with a dated heading.
2. Delete `CUTOVER.md` (this file).
3. Archive the OpenSpec change, so its spec deltas land in `openspec/specs/`:

   ```sh
   openspec archive papercss-2x-foundation
   ```

Commit and merge to `main`, then push the signed stable tag:

```sh
git tag -s v2.0.0 -m v2.0.0
git push origin v2.0.0
gh run watch
```

Verify as in step 4 with `TAG=v2.0.0`, and confirm the documented download and
CDN URLs now resolve to `2.0.0`. The `v2.0.0` tag therefore carries the tree
without `CUTOVER.md` and with the change archived.

## 7. Follow-up fixes, if needed (20.7)

If 2.0.0 needs integration or compatibility fixes, do **not** mutate its tag.
Cut a follow-up branch from `main` (for example `release/2.0.1`), land the fixes
with their own gates and a `2.0.1` changelog entry, and release `v2.0.1` as a
new tag.
