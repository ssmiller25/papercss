<!--
<p align="center">
  <a href="https://papercss.r15cookie.com">
    <img src="https://raw.githubusercontent.com/ssmiller25/papercss/main/docs/static/favicon.ico?raw=true" alt="PaperCSS logo">
  </a>
-->
  <h3 align="center">PaperCSS</h3>

  <p align="center">The less formal CSS framework, with a quick and easy integration.</p>
</p>

A copy maintained by [ssmiller25](https://r15cookie.com) or the original [PaperCSS Framework](https://www.getpapercss.com) and [Source](https://github.com/papercss/papercss)

## Table of contents

- [Table of contents](#table-of-contents)
- [Quick-start](#quick-start)
- [Content of the framework](#content-of-the-framework)
- [Documentation](#documentation)
- [Releases and upgrading](#releases-and-upgrading)
- [Customizing](#customizing)
- [Contributing](#contributing)
- [About](#about)
- [Resources](#resources)
- [Credits and license](#credits-and-license)

## Quick-start

There are several options available:

- [Download the latest release](https://github.com/ssmiller25/papercss/releases), which includes the SCSS source archive.
- Link the stylesheet directly from the CDN. jsDelivr serves it straight from a release tag, so replace `<version>` with one:
  `https://cdn.jsdelivr.net/gh/ssmiller25/papercss@<version>/dist/paper.min.css`
- Clone the repo: `git clone https://github.com/ssmiller25/papercss.git`

PaperCSS is not published to a package registry, so there is no install from npm.

## Content of the framework

We provide compiled CSS (`paper.css`) as well as minified CSS (`paper.min.css`).

The framework has no runtime dependencies. `dist/paper.css` is self-contained
apart from the typeface files it ships beside it: the stylesheet references
`dist/fonts/` by a relative path, so the framework's intended look needs no
extra step — a consumer who includes the stylesheet gets the fonts from the same
source they took the stylesheet from. Everything in `package.json`'s
`devDependencies` is build and development tooling.

You can choose which components you may want to use. Only the components that get imported into `src/styles.scss` will be compiled into `dist/paper.css`.

You can also play with original, source files, written in SCSS, in `src/`. Every release attaches an SCSS source archive (`papercss-<version>-src.tar.gz`), and `src/` is in the repository, so you can build from source.

## Documentation

The documentation is published at [papercss.r15cookie.com](https://papercss.r15cookie.com), built from this repository by the same gates that verify every release. It is the canonical documentation for this framework; the original upstream project's site is a different, separately-versioned framework.

## Releases and upgrading

Every release is published on the [releases page](https://github.com/ssmiller25/papercss/releases). Two documents matter when you upgrade:

- [CHANGELOG.md](CHANGELOG.md) — what changed in each release.
- [UPGRADE.md](UPGRADE.md) — for each breaking change, its before and after, why it changed, and the substitution to make.

`UPGRADE.md` is the canonical location for breaking changes. The changelog and
the documentation point to it rather than restating the before/after, so there
is only one place to keep correct.

### Verifying a release

A release is verifiable, not merely downloadable. Every released artifact
carries a keyless build-provenance attestation bound to this repository and the
release workflow, the release is immutable, and the tag is SSH-signed:

```sh
# Is this file the one this repository's release workflow built?
gh attestation verify paper.css --repo ssmiller25/papercss \
  --signer-workflow ssmiller25/papercss/.github/workflows/release.yml

# Is the release immutable (signed by GitHub)?
gh release verify v2.0.0

# Is the tag the maintainer signed? (GitHub also shows it as Verified.)
git fetch --tags && git verify-tag v2.0.0
```

Cosign bundles and GPG-signed checksums are deliberately not used; see
`AGENTS.md`.

## Customizing

You can customize PaperCSS easily, clone the repo, run `npm install` and make any changes to `.scss` files in `src/`.

The main place you might want to make changes would be `core/_config.scss`, where you can specify new colors or fonts for your CSS build.

After you make changes, be sure to build the new CSS files. Do so by running `npm run css:build` and get them from the `dist/` folder.

## Contributing

This project is open source and contributions are very welcomed, and it is as
beginner friendly as possible. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
setup, build, verification, and pull-request workflow.

## About

PaperCSS was originally made by [@rhyneav](https://github.com/rhyneav) to be something different than the typical mODerN STylEs and clean pages found in every other CSS framework. It was built with LESS and deployed on a single index.html page before being open sourced. It has since evolved; The CSS source has been rewritten in SCSS and the documentation is now built with Hugo (all thanks to some [wonderful contributors](https://github.com/ssmiller25/papercss/graphs/contributors)). This fork/update is maintained by [ssmiller25](https://r15cookie.com). Contributions are welcome.

The goal of PaperCSS is to be as minimal as possible when adding classes. For example, a button should just look like a paper button. There shouldn't be a need to add a class such as `paper-button`. Because of this, adding PaperCSS to a markdown generated page should instantly paper-ize it.

Feel free to use it for wireframes, web apps, blogs, or whatever else you can think of!

If you are new to Git or SCSS, this would be a great project to get your feet wet with. I'd be happy to help walk you through the pull request process.

## Resources

Components:

- [react-papercss-design](https://hacker0limbo.github.io/react-papercss-design/en-US) a React component library based on PaperCSS
- [Spaper](https://oli8.github.io/spaper/) PaperCSS components for Svelte
- [vue-papercss](https://github.com/papercss/vue-papercss) A vue-plugin for the less formal CSS framework
- [RailsPapercss](https://github.com/papercss/rails_papercss_gem) Rails gem for Papercss framework
- [react-native-paper-css](https://github.com/papercss/react-native-paper-css) PaperCSS for react-native
- [React PaperCSS](https://papercss.github.io/React-Paper-CSS-Page/) Another react component library implementation for PaperCSS

Icons:

- [handdrawn.css](https://fxaeberhard.github.io/handdrawn.css/) Another hand-drawn css library with rich icons included
- [hand-drawn-icons](https://github.com/nikhilol/hand-drawn-icons) Icon pack with a hand-drawn style

## Credits and license

Code and documentation under [ISC license](LICENSE.md).

Shout out to Tiffany Rayside for creating Imperfect Buttons, which was an inspiration for this project. https://codepen.io/tmrDevelops/pen/VeRvKX
