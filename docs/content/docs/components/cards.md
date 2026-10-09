---
title: Cards
description: PaperCSS Cards
---
### Full card example

It is possible to not put all the sub-classes like card-title, card-subtitle, card-text, ... But instead the framework will recognize the element properly if it's a h4, h5, p, ... And you need to put all this content on a div with card class. Cards fill the width of their container by default; constrain the width from your own stylesheet if you need a narrower card.

{{< demo >}}
<div class="row flex-center">
  <div class="card">
    <img class="image-top" src="https://picsum.photos/768" alt="Card example image">
    <div class="card-body">
      <h4 class="card-title">My awesome Paper card!</h4>
      <h5 class="card-subtitle">Nice looking subtitle.</h5>
      <p class="card-text">This card fills the width of the row it sits in, which is the framework default.</p>
      <button type="button">Let me go here!</button>
    </div>
  </div>
</div>
{{< /demo >}}

#### Code:

```html
<div class="card">
  <img src="https://picsum.photos/768" alt="Card example image">

  <div class="card-body">
    <h4 class="card-title">My awesome Paper card!</h4>
    <h5 class="card-subtitle">Nice looking subtitle.</h5>
    <p class="card-text">This card fills the width of the row it sits in, which is the framework default.</p>
    <button type="button">Let me go here!</button>
  </div>
</div>
```

### Card title, text, links

{{< demo >}}
<div class="row flex-center">
  <div class="card">
    <div class="card-body">
      <h4 class="card-title">My awesome Paper card!</h4>
      <h5 class="card-subtitle">Nice looking subtitle.</h5>
      <p class="card-text">This is another example of a card without image. Cards are also meant to be used without images, but with text/links/buttons.</p>
      <a class="card-link" href="#">First link</a>
      <a class="card-link" href="#">Second link</a>
    </div>
  </div>
</div>
{{< /demo >}}

#### Code:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">My awesome Paper card!</h4>
    <h5 class="card-subtitle">Nice looking subtitle.</h5>
    <p class="card-text">This is another example of a card without image. Cards are also meant to be used without images, but with text/links/buttons.</p>
    <a class="card-link" href="#">First link</a>
    <a class="card-link" href="#">Second link</a>
  </div>
</div>
```

### Image on top or bottom

{{< demo >}}
<div class="row flex-center">
  <div class="card">
    <div class="card-body">
      <h4 class="card-title">My awesome Paper card!</h4>
      <h5 class="card-subtitle">Nice looking subtitle.</h5>
      <p class="card-text">You can also place image on the bottom of the card.</p>
      <button type="button">Let me go here!</button>
    </div>
    <img class="image-bottom" src="https://unsplash.it/550/250" alt="Card example image">
  </div>
</div>
{{< /demo >}}

#### Code:

```html
<div class="card">
  <div class="card-body">
    <h4 class="card-title">My awesome Paper card!</h4>
    <h5 class="card-subtitle">Nice looking subtitle.</h5>
    <p class="card-text">You can also place image on the bottom of the card.</p>
    <button type="button">Let me go here!</button>
  </div>
  <img class="image-bottom" src="https://unsplash.it/550/250" alt="Card example image">
</div>
```

### Header and footer

{{< demo >}}
<div class="row flex-center">
  <div class="card">
    <div class="card-header">Header</div>
    <div class="card-body">
      <h4 class="card-title">My awesome Paper card!</h4>
      <h5 class="card-subtitle">Nice looking subtitle.</h5>
      <p class="card-text">You can also place image on the bottom of the card.</p>
      <button type="button">Let me go here!</button>
    </div>
    <div class="card-footer">Footer</div>
  </div>
</div>
{{< /demo >}}

#### Code:

```html
<div class="card">
  <div class="card-header">Header</div>
    <div class="card-body">
      <h4 class="card-title">My awesome Paper card!</h4>
      <h5 class="card-subtitle">Nice looking subtitle.</h5>
      <p class="card-text">You can also place image on the bottom of the card.</p>
      <button type="button">Let me go here!</button>
    </div>
  <div class="card-footer">Footer</div>
</div>
```
