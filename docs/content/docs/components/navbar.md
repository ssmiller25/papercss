---
title: Navbar
description: PaperCSS Navbar
---

{{< demo >}}
<nav class="border fixed split-nav" aria-label="Primary">
  <div class="nav-brand">
    <h3><a href="/">Get PaperCSS</a></h3>
  </div>
  <div class="collapsible">
    <input id="collapsible0" type="checkbox" name="collapsible0">
    <label for="collapsible0">
      <span class="bar1"></span>
      <span class="bar2"></span>
      <span class="bar3"></span>
    </label>
    <div class="collapsible-body">
      <ul class="inline">
        <li><a href="/docs/">Documentation</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="https://github.com/rhyneav/papercss" target="_blank">Github</a></li>
      </ul>
    </div>
  </div>
</nav>

<nav class="border split-nav" aria-label="Secondary">
  <div class="nav-brand">
    <h3><a href="#">Get PaperCSS</a></h3>
  </div>
  <div class="collapsible">
    <input id="collapsible1" type="checkbox" name="collapsible1">
    <label for="collapsible1">
      <span class="bar1"></span>
      <span class="bar2"></span>
      <span class="bar3"></span>
    </label>
    <div class="collapsible-body">
      <ul class="inline">
        <li><a href="#">Documentation</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Github</a></li>
      </ul>
    </div>
  </div>
</nav>
{{< /demo >}}

#### Code:

Add ```.fixed``` to ```<nav>``` to fix the nav to the top to have it scroll the whole page. It's also mobile responsive and will show a hamburger menu on small screens. No JavaScript required!

```html
<nav class="border fixed split-nav" aria-label="Primary">
  <div class="nav-brand">
    <h3><a href="#">Get PaperCSS</a></h3>
  </div>
  <div class="collapsible">
    <input id="collapsible1" type="checkbox" name="collapsible1">
    <label for="collapsible1">
      <span class="bar1"></span>
      <span class="bar2"></span>
      <span class="bar3"></span>
    </label>
    <div class="collapsible-body">
      <ul class="inline">
        <li><a href="#">Documentation</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Github</a></li>
      </ul>
    </div>
  </div>
</nav>
```

### Not Split Navbar

{{< demo >}}
<nav class="border" aria-label="Site">
  <div class="nav-brand">
    <h3><a href="#">Get PaperCSS</a></h3>
  </div>
  <div class="collapsible">
    <input id="collapsible2" type="checkbox" name="collapsible2">
    <label for="collapsible2">
      <span class="bar1"></span>
      <span class="bar2"></span>
      <span class="bar3"></span>
    </label>
    <div class="collapsible-body">
      <ul class="inline">
        <li><a href="#">Documentation</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Github</a></li>
      </ul>
    </div>
  </div>
</nav>
{{< /demo >}}

#### Code:

```html
<nav class="border fixed" aria-label="Site">
  <div class="nav-brand">
    <h4><a href="#">Get PaperCSS</a></h4>
  </div>
  <div class="collapsible">
    <input id="collapsible2" type="checkbox" name="collapsible2">
    <label for="collapsible2">
      <span class="bar1"></span>
      <span class="bar2"></span>
      <span class="bar3"></span>
    </label>
    <div class="collapsible-body">
      <ul class="inline">
        <li><a href="#">Documentation</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Github</a></li>
      </ul>
    </div>
  </div>
</nav>
```
