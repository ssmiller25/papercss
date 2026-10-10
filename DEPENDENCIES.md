# Dependency audit

PaperCSS ships no runtime dependency. `package.json`'s `dependencies` is empty;
every dependency is a development dependency, and consumers use the prebuilt
`dist/paper.css` and never run this tree. This file records the repository's
`npm audit` result so a change in dependency risk is measurable rather than
assumed, and classifies every remaining finding by whether a build or
development command reaches it.

Resolving the reachable findings is the separate `dependency-hardening` change;
this file is the classification that change consumes.

## Count against the pre-replacement baseline

| Measured | critical | high | moderate | low | total |
| --- | --- | --- | --- | --- | --- |
| Before the toolchain replacement (task 4.2) | 2 | 22 | 48 | 1 | 73 |
| After the toolchain replacement (this record) | 0 | 17 | 1 | 0 | 18 |

**Reproduce.** With the committed `package-lock.json` installed:

```sh
npm ci
npm audit --json | node -e 'const a=require("fs").readFileSync(0,"utf8");const m=JSON.parse(a).metadata.vulnerabilities;console.log(m)'
```

The counts are advisory-database dependent, so a new advisory can appear between
runs without a dependency changing. The comparison is meaningful when the
dependency tree changes: if the total rises, the increase is a regression to
explain, not to accept silently.

**Delta.** The toolchain replacement (group 4) replaced the 2019 build tools and
their trees and resolved 55 findings, including both criticals, and introduced
none. The remaining 18 are all in development dependencies.

## Reachability

A finding is **reachable** when a build or development command loads the package
that carries it; the command is named. It is **unreachable** when no such
command does; the reason is recorded. No finding is left unclassified.

| Package | Severity | Direct | Reached by | Classification |
| --- | --- | --- | --- | --- |
| `@stylistic/stylelint-plugin` | high | no | `npm run lint` — loaded by `stylelint-config-sass-guidelines` | reachable |
| `ansi-regex` | high | no | `npm run dev` — `concurrently` → `yargs` | reachable |
| `brace-expansion` | high | no | `npm run css:build` — `rimraf` → `glob` → `minimatch` | reachable |
| `braces` | high | no | `npm run lint` and `npm run dev` — `stylelint`/`micromatch`, `chokidar` | reachable |
| `chokidar` | high | yes | `npm run dev` — `build/hot-reload.js` | reachable |
| `fast-glob` | high | no | `npm run lint` — `stylelint` | reachable |
| `get-func-name` | high | no | — | unreachable — only `chai` pulls it in, and no command imports `chai` |
| `globby` | high | no | `npm run lint` — `stylelint` | reachable |
| `ini` | high | no | `npm run lint` — `stylelint` → `global-modules` → `global-prefix` | reachable |
| `lodash` | high | no | `npm run dev` — `concurrently` | reachable |
| `micromatch` | high | no | `npm run lint` — `stylelint` | reachable |
| `minimatch` | high | no | `npm run css:build` — `rimraf` → `glob` | reachable |
| `path-parse` | moderate | no | `npm run dev` — `concurrently` → `read-pkg` → `resolve` | reachable |
| `pathval` | high | no | — | unreachable — only `chai` pulls it in, and no command imports `chai` |
| `semver` | high | no | `npm run dev` — `concurrently` → `read-pkg` | reachable |
| `stylelint` | high | yes | `npm run lint` — `npm run lint:src` and `lint:dist` | reachable |
| `stylelint-config-sass-guidelines` | high | yes | `npm run lint` — `extends` in `.stylelintrc.cjs` | reachable |
| `stylelint-scss` | high | yes | `npm run lint` — loaded by the preset | reachable |

Sixteen findings are reachable and are the input to `dependency-hardening`. Two
(`get-func-name`, `pathval`) are unreachable: they exist only because `chai` is a
development dependency that no build or development command imports, so the
vulnerable code is never loaded.
