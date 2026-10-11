# Tasks

## 1. Resolve the resolvable findings

- [x] 1.1 Remove the unused `chai` dependency and verify `pathval` and `get-func-name` leave the tree (`npm explain pathval`)
- [x] 1.2 Bump `concurrently` to a current major and verify `lodash`, `ansi-regex` (4.x), `semver`, and `path-parse` leave the tree
- [x] 1.3 Bump `rimraf` to a current major, update its call sites for the `sync` → `rimrafSync` and dropped `disableGlob` changes, and verify `npm audit` no longer reports `minimatch` or `brace-expansion`
- [x] 1.4 Bump `chokidar` to a current major, update the `watch` call for the dropped glob support, and verify `npm audit` no longer reports `chokidar`
- [x] 1.5 Pin any leaf still resolved below its patch with an `overrides` block, and verify `npm audit` reports no finding except the `braces` cluster
- [x] 1.6 Verify `dependencies` remains empty, the declaration record reports no differences, and two consecutive builds are byte-identical

## 2. Record the braces exception

- [x] 2.1 Open a GitHub issue for `braces` using the body recorded under "braces exception record" in `design.md`
- [x] 2.2 Verify the issue names the advisory, the impact, and the dependency change required, and that every finding `npm audit` still reports belongs to the `braces` cluster

## 3. Close the Dependabot backlog — after this change is merged to `main`

- [x] 3.1 Add a post-merge verification that fails when any Dependabot pull request, alert, or `dependabot/*` branch is open, and verify it fails while one is (needs `gh` auth and network; not part of `make check`, like `check-signing`)
- [ ] 3.2 Comment on each open Dependabot update pull request with where the fix landed, close it, and delete its branch
- [ ] 3.3 Delete the stale branches left by the already-closed Dependabot pull requests
- [ ] 3.4 Verify the post-merge check reports no open Dependabot pull request, alert, or branch

## 4. Verify

- [x] 4.1 Run `make check` and `make audit`; verify the audit reports only the `braces` exception and every gate is green
- [ ] 4.2 Verify every open Dependabot alert is now closed
