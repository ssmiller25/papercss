---
title: Get PaperCSS
menu: main
weight: -270
---

#### Download

Download the latest version ({{< version >}}) using either of the links below. Or
download an older release via GitHub.

{{< download-buttons >}}

#### CDN

Don't want to download it? You can link to PaperCSS through
[jsDelivr](https://www.jsdelivr.com/), which serves the stylesheet straight from
the GitHub release tag — no package registry involved. You can use either:

{{< cdn-links >}}

Here's a quick snippet to get started with PaperCSS:

{{< cdn-snippet >}}

#### Build it Yourself

If you'd rather customize things, you can build the CSS yourself via the git repo:

```sh
git clone https://github.com/ssmiller25/papercss.git
cd papercss
npm install
npm run build
```

Grab the CSS out of the `/dist` folder created.

You can also go into `src/core/_config.scss` before building to change around the
global styles of your new CSS.

#### Upgrading

Upgrading across a major version? [UPGRADE.md](https://github.com/ssmiller25/papercss/blob/main/UPGRADE.md)
states the before, after, reason and substitution for each breaking change, and
[CHANGELOG.md](https://github.com/ssmiller25/papercss/blob/main/CHANGELOG.md)
records what shipped in every release. UPGRADE.md is the canonical location for
the breaking changes; this page does not restate them.
