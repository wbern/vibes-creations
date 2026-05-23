# KAPLAY

## When to use

A 2D *game* with characters that move, collide, and respond — platformer,
shooter, top-down adventure, button-mashing toy. KAPLAY (formerly Kaboom.js)
gives you a tagged scene graph, AABB collision, gravity, and animation
helpers without writing a render loop. If the kid just wants a drawing app
or particle effect with no game logic, reach for `canvas2d.md` instead. If
they want generative art / a sketch loop with no collision, reach for
`p5.md`.

## Minimal working example

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>katt &amp; mus</title>
  <style>html,body{margin:0;height:100%;overflow:hidden;background:#f0f0f0}</style>
  <script src="https://cdn.jsdelivr.net/npm/kaplay@3001.0.19/dist/kaplay.js"></script>
</head>
<body>
  <script>
    const k = kaplay({
      width: innerWidth,
      height: innerHeight,
      letterbox: true,
      texFilter: "linear",
      background: [240, 240, 240],
    });

    // Built-in mascot — runs with zero assets. For a kid's own drawing:
    //   k.loadSprite("cat", "assets/cat.png");
    k.loadBean();

    const cat = k.add([
      k.sprite("bean"),
      k.pos(120, 120),
      k.area(),
      "cat",
    ]);

    k.add([
      k.sprite("bean"),
      k.pos(400, 200),
      k.scale(0.6),
      k.area(),
      "mouse",
    ]);

    k.onKeyDown("right", () => cat.move(200, 0));
    k.onKeyDown("left",  () => cat.move(-200, 0));
    k.onKeyDown("up",    () => cat.move(0, -200));
    k.onKeyDown("down",  () => cat.move(0, 200));

    cat.onCollide("mouse", (m) => {
      m.destroy();
      k.shake(8);
    });
  </script>
</body>
</html>
```

## Pitfalls

- **Pin to `kaplay@3001.0.19`**, not `@latest`. KAPLAY 4000 is in alpha and
  changes the init contract (multiple `kaplay()` calls, different defaults).
  3001 is the stable line the docs and tutorials describe.
- **`texFilter` default is `"nearest"`** — pixel-art friendly but makes
  hand-drawn PNGs and photos look jaggy. Pass `texFilter: "linear"` in the
  init options for kid-drawn content. Per-sprite override exists if a
  mix is needed.
- **One `kaplay()` per page in 3001.x.** Calling it twice corrupts the
  canvas — the second init writes over the first. To "restart", either
  `k.go("scene-name")` (if scenes are set up) or `location.reload()`.
- **Asset paths are relative.** `k.loadSprite("cat", "assets/cat.png")`
  works; `"/assets/cat.png"` 404s under the preview's subpath. Put PNGs
  next to `index.html` (e.g. in `assets/`) and reference without a
  leading slash.
- **Sound needs a user gesture on iOS Safari.** `k.play("boing")` triggered
  from `onKeyDown` / `onClick` works; firing on load is silently blocked.
  The audio context unlocks on the first tap — design the first sound
  around a tap, not a timer.
- **Use `area()` and `body()` deliberately.** `area()` enables collision
  detection (the AABB shape, queryable via `onCollide`). `body()` adds
  physics (gravity, jumping, ground detection). A static decoration
  needs neither.
- **Tag everything you want to find later.** Pass a string in the
  component array: `k.add([k.sprite("coin"), "coin"])`. Then
  `k.get("coin")` returns every live coin. Tags are also what
  `onCollide("tagA", "tagB", …)` matches against.
- **`onKeyDown` needs a focused window.** The sketch runs inside an
  iframe; the host SPA forwards arrow keys / Space / WASD even when focus
  is elsewhere, so arrow-key controls work out of the box. But: prefer
  on-screen buttons over keyboard as the *primary* control surface —
  phones have no arrow keys and most kids test on phones first.
- **Scene introspection (for the AI, not the kid).** KAPLAY's scene
  graph is queryable at runtime: `k.get("*")` lists every entity,
  `k.get("cat")[0].pos` reads a position, `obj.use(k.color(255,0,0))`
  recolours live. The `evaluate` MCP can run small reads like
  `k.get("*").map(o => ({tags: o.tags, pos: o.pos}))` to figure out
  what's on screen before deciding where to put the next thing. Prefer
  small read-only queries; mutations belong in the source file.
