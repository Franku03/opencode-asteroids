# AGENTS.md

Compact guide for OpenCode sessions working in this repo.

## Stack

- Single-file HTML5 Canvas game. No framework, no bundler, no dependencies, no `package.json`.
- `index.html` loads `game.js` via a plain `<script>` (no ES modules). Do not introduce `import`/`export` — the file relies on globals (`canvas`, `ctx`, `W`, `H`, `keys`).
- Canvas is fixed `800×600`, set in **both** `index.html` (`width`/`height` attrs) and `game.js` (`W`, `H` consts). Change them together.

## Run / verify

There is no build, lint, typecheck, or test step. Verification is manual:

```bash
npx serve .      # then open http://localhost:3000
```

Opening `index.html` directly via `file://` also works (no fetch/modules). After any change, reload the browser and play to confirm.

## Architecture (all in `game.js`)

- One file, top-to-bottom: input → utils → entity classes (`Bullet`, `Asteroid`, `ShootingStar`, `PowerUp`, `Ship`, `Particle`) → game state → `update(dt)` → `draw()` → `requestAnimationFrame` loop.
- Entity tables (`bullets`, `asteroids`, `powerups`, `particles`) are plain arrays filtered each frame by `dead` flag. New entities spawned mid-iteration are pushed to a separate array and concatenated after the loop (see bullet/asteroid collision in `update`). `ShootingStar` instances live in the `asteroids` array and are spawned via `newAsteroids` (not pushed directly to `asteroids`) to avoid mid-iteration mutation.
- Toroidal space: positions wrapped with `wrap(v, max)`. All movement uses `dt` (seconds). `dt` is clamped to `0.05` in `loop` to avoid the spiral-of-death after tab switches.
- State machine: `'playing' | 'dead' | 'gameover'`, transitions live in `update()`. `initGame()` is the only (re)entry point.
- Tunables are inline consts per class (e.g. `ROT`, `THRUST`, `DRAG` in `Ship.update`; `RADII`/`SPEEDS`/`POINTS` arrays indexed by `size` 1–3). There is no config file. Power-up tunables live as module consts near the asteroid tables: shared `POWERUP_DROP_CHANCE`, `POWERUP_TTL`, `POWERUP_RADIUS`; "Velocidad" `SPEED_BOOST_DURATION`, `SPEED_BOOST_MULT`; "Triple Shot" `TRIPLE_SHOT_DURATION`, `TRIPLE_SPREAD_ANGLE`, `TRIPLE_SHOT_DROP_CHANCE`; "Escudo" `SHIELD_DROP_CHANCE`, `SHIELD_DURATION`, `SHIELD_HIT_COST`, `SHIELD_RADIUS`. Estrella Fugaz tunables live alongside them: `SHOOTING_STAR_CHANCE`, `SHOOTING_STAR_SPEED`, `SHOOTING_STAR_TTL`, `SHOOTING_STAR_POINTS`, `SHOOTING_STAR_RADIUS`, `SHOOTING_STAR_TRAIL`.
- Power-ups: `PowerUp` orbs share one class with a `type` field (`'velocidad'` | `'triple'` | `'escudo'`); getters `color`/`accent`/`glow` resolve per type and `draw` renders a 3-way icon (rayo / 3 balas en abanico / arco concéntrico con cruz). Asteroid destruction is centralized in `destroyAsteroid(a, splits)` (used by bullets and the shield), which rolls **independent** drops per type (`POWERUP_DROP_CHANCE`, `TRIPLE_SHOT_DROP_CHANCE`, `SHIELD_DROP_CHANCE`) plus `SHOOTING_STAR_CHANCE`. Pickup dispatch in `update` sets the matching ship timer: `speedBoost` (THRUST × `SPEED_BOOST_MULT`), `tripleShot` (`Ship.tryShoot` returns 3 bullets spread ±`TRIPLE_SPREAD_ANGLE`) or `shield` (anillo de radio `SHIELD_RADIUS` que destruye asteroides al contacto, consumiendo `SHIELD_HIT_COST` s por impacto; parpadea el último 1,5 s). Pickup resets (not stacks) the timer; all effects clear on death (`killShip`) and respawn/level reset (`Ship.reset`). `Ship.draw` shows a colored halo per active effect (velocidad cian r=16, triple naranja r=20, escudo verde r=`SHIELD_RADIUS`); `drawHUD` stacks a `drawPowerBar` per active effect (VELOCIDAD/TRIPLE/ESCUDO).
- Skins de la nave: la tabla `SKINS` (junto a los tunables de Estrella Fugaz) define por skin `name`, `color`, `flame` y `verts` (polígono apuntando a +x). El índice activo es el global `shipSkin`, cargado desde `localStorage` con `try/catch` y clampeado al rango válido; `setSkin(i)` normaliza módulo y persiste. Es cosmético: la hitbox (`ship.radius`) no cambia. `drawShipShape(verts, color, scale, lineWidth)` (en utils) traza el polígono; lo usan `Ship.draw` (escala 1) y `drawLifeIcon` (escala 0.45) para que los iconos de vida reflejen la skin activa. El ciclo con `C` se lee al inicio de `update()`, antes de los branch de estado, así que funciona en `playing`/`dead`/`gameover`.
- Estrella Fugaz: `ShootingStar extends Asteroid` (size-1 base, overridden `radius`/`points`/`vx`/`vy`/`rotSpeed`). Spawns on asteroid destruction (`SHOOTING_STAR_CHANCE`) into `newAsteroids`. Has a `ttl` (expires on its own, blink last 1.5 s) and a comet-like golden `trail`. `split()` returns `[]` (no fragments). Scoring reads `a.points` (set in `Asteroid` constructor from `POINTS[size]`), so the subclass overrides points without conditionals in the loop. Counts toward `asteroids.length`, so it blocks `nextLevel` until destroyed or expired.

## Input model (easy to get wrong)

- `keys[code]` — currently-held state (use for continuous actions like thrust/rotate).
- `pressed(code)` — edge-detected "just pressed this frame"; **consumed on read**. Use for discrete actions (shoot, restart, cycle skin). Calling it twice per frame silently drops the event. `KeyC` (skin) is read exactly once at the top of `update()`, before the state branches, so it works in every state.

## Conventions

- UI strings and code comments are in **Spanish**; identifiers are in English. Match this when editing.
- `'use strict'` at top of `game.js`; keep it.

## Known doc drift

None currently. `README.md` and `game.js` are in sync (Velocidad, Triple Shot, Escudo, Estrella Fugaz and skins all implemented). Treat the code as the source of truth, not the README, when resolving conflicts.
