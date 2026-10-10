## Contributing

See what has been added but not yet released in the [repository's commit history](https://github.com/ssmiller25/papercss/commits/main).

This project is open source and contributions are very welcomed. It is also as beginner friendly as possible, so don't be afraid to jump in if you've never contributed to any Git project before! Feel free to reach out if you are new and need help with the process.

Please before sending a PR, make sure you are properly using the `.editorconfig` file with your IDE. If your IDE doesn't natively support `editorconfig` files, you can use an extension/package/module. For example in Atom there is the [editorconfig package](https://atom.io/packages/editorconfig), as well for [Sublime Text](https://github.com/sindresorhus/editorconfig-sublime), [VS Code](https://github.com/editorconfig/editorconfig-vscode), [Vim](https://github.com/editorconfig/editorconfig-vim), ...

### Getting set up

- Fork the repo then clone it: `git clone git@github.com:[your_username]/papercss.git`
- `cd papercss` then install dependencies: `npm install`
- Create your branch off `main`: `git checkout -b feature-thing main`

The `.devcontainer/` provides the exact tools the gates use, pinned to the
versions CI runs: Hugo, `html-validate`, and Playwright's own Chromium. If you
work outside it, you need those on your `PATH` — Hugo for the documentation,
`html-validate` for the documentation gate, and `npx playwright install
chromium` once for the browser gate.

### Building and previewing

- Build the SCSS in `src/` to CSS in `dist/`: `make build-css` (or
  `npm run css:build`). `dist/` is tracked, so commit the rebuilt stylesheet
  with your `src/` change.
- Preview the documentation: `make serve` (or `npm run dev`).

### Verifying your change

`make check` is the single verification entry point, and it runs **the same
sequence continuous integration runs** (`.github/workflows/verify.yml` invokes
`make check` in the devcontainer, so the two cannot drift). Run it before
opening a pull request:

```sh
make check
```

It builds the stylesheet and the documentation, lints both, validates the
documentation against its recorded baseline, checks the generated stylesheet
against the recorded declaration set, verifies the dark theme and the
configuration contract, checks the release consistency, and runs the browser
gate. `make help` lists every target, including the few you should run only
deliberately:

- `make check-docs-update-baseline` re-records the documentation error budget.
  Run it only when counts have genuinely dropped, since it also hides a
  regression you did not fix.
- `make check-declarations-update` re-records the generated stylesheet's
  declarations. Run it only when a change to the output is intended.
- `make test-browser` runs just the Playwright component-contract gate.

Dependency risk is audited live, not snapshotted: run `make audit` and compare
the result against the pre-toolchain baseline. PaperCSS has no runtime
dependencies; everything in `devDependencies` is build and development tooling,
so a finding here does not reach a consumer who uses `dist/paper.css`. See
`AGENTS.md` for how to classify a finding.

### Opening the pull request

- Commit and push your changes to your fork.
- Open a pull request on the origin repo. Be sure to include any pictures and/or details on what you have done; it will help reviewers **a lot**!
- A maintainer reviews and merges into `main`.
