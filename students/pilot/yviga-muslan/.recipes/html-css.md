# HTML + CSS only

## When to use

A picture, a page, a card, a quiz, a story, a comic, a dress-up doll
that uses `:checked`, a profile site, a meme template. No JavaScript
errors are possible — huge confidence win for a first project.

## Minimal working example

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>min sida</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #ffd86b; padding: 2rem; }
    h1 { color: #c0392b; }
    .card { background: white; padding: 1rem; border-radius: 12px; max-width: 24rem; transition: transform .2s; }
    .card:hover { transform: scale(1.04) rotate(-1deg); }
  </style>
</head>
<body>
  <h1>Hej!</h1>
  <div class="card">Det här är min sida. Klicka — den hoppar.</div>
</body>
</html>
```

## Pitfalls

- **Relative paths only** for images and CSS: `style.css`, `cat.jpg` —
  never `/style.css`, never `/cat.jpg`. The preview lives under a
  subpath; leading slashes 404.
- Reach for CSS `transition`, `:hover`, `:focus`, `:checked` before
  writing JavaScript. A surprising amount of "interactive" wants no JS.
- `<input type="checkbox" id="x"><label for="x">…</label>` plus a
  sibling-selector lets a checkbox toggle UI with zero JS — perfect
  for show/hide and dress-up dolls.
- Wrap with `<meta name="viewport" content="width=device-width, initial-scale=1">`
  if anything looks tiny on the kid's tablet — without it, mobile
  browsers render at desktop width and shrink-fit.
