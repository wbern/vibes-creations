# Canvas 2D (raw)

## When to use

A drawing app, paint tool, pixel-art editor, stamp toy, particle effect,
generative art when you want pixel-level control. If the kid wants a
render loop with friendly helpers (`ellipse`, `mouseX`), reach for p5
instead — see `p5.md`.

## Minimal working example — drawing app

```html
<!doctype html>
<html lang="sv">
<head><meta charset="utf-8"><title>rita</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; }
  canvas { display: block; background: white; touch-action: none; cursor: crosshair; }
</style></head>
<body>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById("c");
    const ctx = c.getContext("2d");

    function size() {
      c.width  = innerWidth;
      c.height = innerHeight;
      ctx.lineWidth   = 4;
      ctx.lineCap     = "round";
      ctx.strokeStyle = "#c0392b";
    }
    size();
    addEventListener("resize", size);

    let drawing = false;
    c.addEventListener("pointerdown", e => {
      drawing = true;
      const r = c.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    });
    c.addEventListener("pointermove", e => {
      if (!drawing) return;
      const r = c.getBoundingClientRect();
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
    });
    addEventListener("pointerup", () => { drawing = false; });
  </script>
</body>
</html>
```

## Pitfalls

- **Set `width` and `height` as canvas attributes**, not just CSS. CSS
  alone scales the bitmap → blurry pixels. The example uses
  `c.width = innerWidth` (the attribute), then CSS handles layout.
- **Pointer coordinates need `getBoundingClientRect()`**. `e.clientX`
  is page-relative; subtract `rect.left`/`rect.top` to get canvas-local
  coords. Without this, drawing appears offset.
- **`touch-action: none`** on the canvas (or its container) — otherwise
  finger drags scroll the page instead of drawing.
- **Use `requestAnimationFrame`** for animation loops, not `setInterval`
  — RAF pauses when the tab is hidden, runs at 60 fps, syncs with the
  browser.
- **Clear with `ctx.clearRect(0, 0, c.width, c.height)`** at the top of
  each frame if you're animating. Without it, every frame piles on top
  of the last (sometimes that's the point — for trails).
- **Resetting `c.width` clears the canvas.** Surprising on resize: if
  you re-set `c.width = innerWidth` from the resize handler, the
  drawing disappears. Save to an `OffscreenCanvas` or `ImageData` first
  if persistence across resize matters.
- For Retina sharpness, scale by `devicePixelRatio` (skip until needed —
  it's polish, not a v0.1 pitfall).
- **Keyboard handlers need a focused window.** Your page runs inside an
  iframe; `addEventListener('keydown', …)` only fires when the iframe has
  keyboard focus. The host SPA focuses you on load and forwards arrow
  keys / Space / WASD even when focus is elsewhere — so you can rely on
  arrow-key controls working out of the box. But: prefer on-screen
  buttons over keyboard as the *primary* control surface, because phones
  have no arrow keys and most kids test on phones first. Add keyboard as
  a desktop bonus, not the only path.
