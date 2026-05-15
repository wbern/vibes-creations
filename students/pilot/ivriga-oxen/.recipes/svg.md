# Inline SVG

## When to use

A character, an icon, a logo, a map, a simple infographic — anything
where the shapes are finite, named, and benefit from being styleable
with CSS.

## Minimal working example

```html
<!doctype html>
<html lang="sv">
<head><meta charset="utf-8"><title>gubbe</title>
<style>
  body { display: grid; place-items: center; min-height: 100vh; background: #eef; }
  svg { width: 60vmin; height: 60vmin; }
  .face { fill: gold; stroke: #333; stroke-width: 2; }
  .eye  { fill: #333; }
  .mouth { fill: none; stroke: #333; stroke-width: 3; stroke-linecap: round; }
  .face:hover { fill: tomato; }
</style></head>
<body>
  <svg viewBox="0 0 100 100">
    <circle class="face" cx="50" cy="50" r="40"/>
    <circle class="eye"  cx="35" cy="42" r="4"/>
    <circle class="eye"  cx="65" cy="42" r="4"/>
    <path   class="mouth" d="M30 65 Q50 80 70 65"/>
  </svg>
</body>
</html>
```

## Pitfalls

- **`viewBox` is required** for scaling. Without it the SVG renders at
  whatever `width`/`height` you set in pixels and won't scale to its
  container. `viewBox="0 0 100 100"` gives a 100×100 logical canvas
  regardless of pixel size.
- **SVG has its own namespace.** Building SVG from JS with `innerHTML`
  often drops the namespace and the shapes don't render. Use
  `document.createElementNS("http://www.w3.org/2000/svg", "circle")`
  when constructing dynamically.
- Inline SVG inherits CSS like normal HTML — kids can write
  `circle { fill: red }` and it just works. Use classes, not inline
  `fill="…"`, so styling is easy to tweak.
- SVG y-axis points **down** (top-left is `0,0`). Same as canvas, but
  the opposite of what kids learned in math class.
- For external SVG files: `<img src="cat.svg">` works but breaks CSS
  styling of the inner shapes. Inline (`<svg>…</svg>` in the HTML) is
  what unlocks the kid's ability to tweak colors.
