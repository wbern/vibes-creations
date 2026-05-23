# Toolkit recipes

You're inside a student's workspace. The student is 9–13, on a tablet,
watching an iframe preview of `index.html` (and whatever else you save
in this directory's parent). Each file here is a minimal-working-example
plus a pitfall checklist for one toolkit — so you don't have to
synthesise boilerplate from memory and trip on the same gotchas every
time.

## Pick by project shape

| The kid is making… | Read |
| --- | --- |
| a picture, a page, a card, a quiz, a story | `html-css.md` |
| a character or icon with named shapes | `svg.md` |
| a drawing app, paint tool, pixel art, particles | `canvas2d.md` |
| generative art, an animation loop, bouncing things | `p5.md` |
| a game with characters that move, collide, score | `kaplay.md` |
| a spinning 3D model, custom geometry | `threejs.md` |
| a 3D *place* (room, scene, planet) | `aframe.md` |

Default to 2D unless the kid is describing a *place* rather than a
picture. 3D pays in pitfalls, not in features, for one-session projects.

## Also read (cross-cutting concerns)

These apply on top of a project-shape recipe. Read when the trigger fires.

| Project has… | Read |
| --- | --- |
| on-screen buttons AND keyboard input (most games) | `adaptive-controls.md` |

## Workshop-specific rules (apply to every recipe)

1. **Relative paths only** for assets. The preview is served from
   `/<classroom>/<student>/preview/`. A `<img src="/foo.png">` (leading
   slash) resolves against the workshop's nginx root and 404s; use
   `foo.png` or `./foo.png` instead. Same for `<a-asset-item src>`,
   three.js loaders, `<model-viewer src>`, etc.
2. **Save small, check visibly.** Livereload is wired into the preview —
   every save reloads the kid's iframe automatically. Save after each
   small change so the kid sees it work.
3. **You can't see the preview yourself.** After a change that should
   produce something visible, ask the kid (via `say`) whether they see
   what you expected. Describe the specific thing to look for ("see a
   pink cube?"), not just "does it work?". If they say nothing
   appeared, suspect the recipe's pitfall list before rewriting.
