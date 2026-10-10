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

The framework has no runtime dependencies: `dist/paper.css` is self-contained,
and everything in `package.json`'s `devDependencies` is build and development
tooling.

You can choose which components you may want to use. Only the components that get imported into `src/styles.scss` will be compiled into `dist/paper.css`.

You can also play with original, source files, written in SCSS, in `src/`. Every release attaches an SCSS source archive (`papercss-<version>-src.tar.gz`), and `src/` is in the repository, so you can build from source.

## Documentation

You can view the docs at [getpapercss.com](https://www.getpapercss.com). Those are directly from the `master` branch; this means those features are stable and ready to be used in your project.

You can also view the develop branch at [develop.getpapercss.com](https://develop.getpapercss.com), this includes new features that are coming soon in the master branch. Be warned, a feature in develop can be removed without any prevention.

## Releases and upgrading

Every release is published on the [releases page](https://github.com/ssmiller25/papercss/releases). Two documents matter when you upgrade:

- [CHANGELOG.md](CHANGELOG.md) — what changed in each release.
- [UPGRADE.md](UPGRADE.md) — for each breaking change, its before and after, why it changed, and the substitution to make.

`UPGRADE.md` is the canonical location for breaking changes. The changelog and
the documentation point to it rather than restating the before/after, so there
is only one place to keep correct.

## Customizing

You can customize PaperCSS easily, clone the repo, run `npm install` and make any changes to `.scss` files in `src/`.

The main place you might want to make changes would be `core/_config.scss`, where you can specify new colors or fonts for your CSS build.

After you make changes, be sure to build the new CSS files. Do so by running `npm run css:build` and get them from the `dist/` folder.

## Contributing

This project is open source and contributions are very welcomed. It is also as beginner friendly as possible, so don't be afraid to jump in if you've never contributed to any Git project before! Feel free to reach out if you are new and need help with the process.

Please before sending a PR, make sure you are properly using the `.editorconfig` file with your IDE. If your IDE doesn't natively support `editorconfig` files, you can use an extension/package/module. For example in Atom there is the [editorconfig package](https://atom.io/packages/editorconfig), as well for [Sublime Text](https://github.com/sindresorhus/editorconfig-sublime), [VS Code](https://github.com/editorconfig/editorconfig-vscode), [Vim](https://github.com/editorconfig/editorconfig-vim), ...

Once you are ready to contribute, here the workflow you should follow:

- Fork the repo then clone it: `git clone git@github.com:[your_username]/papercss.git`
- `cd papercss` then install dependencies: `npm install`
- Change your current branch to `develop`: `git checkout develop`
- Create your new branch where you will write your code: `git checkout -b feature-thing develop`. Please be sure to prepend your new feature branch with "feature-"
- Write some code!
- To build the scss (in `src/`) to css (in `dist/`), run `npm run css:build`. Note: you will need to re-run this command to include the latest changes in `src/`.
- To preview your changes, you can run `npm start`. This will start a `localhost` server.
- Check to make sure your code is following style rules with `npm run stylelint`
- Once done commit and push your changes to your fork. The linter is also run as a pre-commit hook.
- Open a pull request on the origin papercss repo. Be sure to include any pictures and/or details on what you have done; it will help reviewers **a lot**!
- When your changes are approved, they will be merged into the `develop` branch, which will finally be merged into the `master` branch when we reach a milestone regarding features and bug fixes. Check out [Vincent Driessen's blog post](http://nvie.com/posts/a-successful-git-branching-model/), [GitFlow](https://datasift.github.io/gitflow/IntroducingGitFlow.html), or [#27](https://github.com/rhyneav/papercss/issues/27) for more details on how this works.

Note: If you have a hotfix (usually typos and minor documentation tweaks), create your hotfix branch off of the master branch instead of develop: `git checkout -b hotfix-thing master`. The changes will be merged into both the master and develop to keep the branches consistent.

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

Code and documentation under [ISC license](https://github.com/papercss/papercss/blob/master/license).

Shout out to Tiffany Rayside for creating Imperfect Buttons, which was an inspiration for this project. https://codepen.io/tmrDevelops/pen/VeRvKX
