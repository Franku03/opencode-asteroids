'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Traza un polígono cerrado y lo estroca (usado por la nave y los iconos de vida)
function drawShipShape(verts, color, scale, lineWidth = 1.5) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(verts[0][0] * scale, verts[0][1] * scale);
  for (let i = 1; i < verts.length; i++)
    ctx.lineTo(verts[i][0] * scale, verts[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// Power-up "Velocidad": duplica el empuje de la nave durante SPEED_BOOST_DURATION segundos
const POWERUP_DROP_CHANCE   = 0.10;  // probabilidad al destruir un asteroide
const POWERUP_TTL           = 10;    // segundos que permanece en el campo
const POWERUP_RADIUS        = 10;
const SPEED_BOOST_DURATION  = 5;     // duración del efecto
const SPEED_BOOST_MULT      = 2;     // multiplicador de THRUST

// Estrella Fugaz: asteroide especial rápido y efímero que aparece al destruir asteroides
const SHOOTING_STAR_CHANCE  = 0.05;  // probabilidad al destruir un asteroide
const SHOOTING_STAR_SPEED   = 240;   // px/s (≈3× SPEEDS[1])
const SHOOTING_STAR_TTL     = 6;     // segundos antes de desaparecer sola
const SHOOTING_STAR_POINTS  = 300;   // recompensa alta
const SHOOTING_STAR_RADIUS  = 9;
const SHOOTING_STAR_TRAIL   = 12;    // nº de posiciones de la estela

// Skins de la nave: cosméticas (no afectan la hitbox). Ciclar con tecla C.
const SKINS = [
  { name: 'Clásica',   color: '#fff', flame: 'rgba(255, 130, 0, 0.85)',  verts: [[ 20,  0], [-12, -9], [ -7,  0], [-12,  9]] },
  { name: 'Carmesí',   color: '#f55', flame: 'rgba(255, 220, 0, 0.85)',  verts: [[ 22,  0], [-14, -7], [-18, -2], [ -8,  0], [-18,  2], [-14,  7]] },
  { name: 'Áurea',     color: '#fd5', flame: 'rgba(255,  70, 0, 0.85)',  verts: [[ 17,  0], [ -9,-13], [-14, -5], [ -6,  0], [-14,  5], [ -9, 13]] },
  { name: 'Esmeralda', color: '#5f5', flame: 'rgba(130, 255, 90, 0.85)', verts: [[ 25,  0], [-15, -5], [ -9,  0], [-15,  5]] },
  { name: 'Púrpura',   color: '#c7f', flame: 'rgba(255,  90,255, 0.85)', verts: [[ 18,  0], [ -3,-11], [-15, -7], [-15,  7], [ -3, 11]] },
];

let shipSkin = 0;
try {
  const v = parseInt(localStorage.getItem('asteroids.skin'), 10);
  if (Number.isInteger(v) && v >= 0 && v < SKINS.length) shipSkin = v;
} catch {}

function setSkin(i) {
  shipSkin = ((i % SKINS.length) + SKINS.length) % SKINS.length;
  try { localStorage.setItem('asteroids.skin', String(shipSkin)); } catch {}
}

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    this.buildVerts();
  }

  buildVerts() {
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella Fugaz (asteroide especial) ───────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    this.radius    = SHOOTING_STAR_RADIUS;
    this.points    = SHOOTING_STAR_POINTS;
    this.ttl       = SHOOTING_STAR_TTL;
    this.trail     = [];
    this.rotSpeed  = rand(-3, 3);
    this.buildVerts();   // polígono al radio correcto

    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
  }

  update(dt) {
    super.update(dt);
    this.trail.push([this.x, this.y]);
    if (this.trail.length > SHOOTING_STAR_TRAIL) this.trail.shift();
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() { return []; }

  draw() {
    // Parpadeo al expirar
    if (this.ttl < 1.5 && Math.floor(this.ttl * 6) % 2 === 0) return;

    // Estela: segmentos que se desvanecen hacia la cola
    for (let i = 1; i < this.trail.length; i++) {
      const dx = this.trail[i][0] - this.trail[i - 1][0];
      const dy = this.trail[i][1] - this.trail[i - 1][1];
      if (Math.abs(dx) > W / 2 || Math.abs(dy) > H / 2) continue;   // wrap: no unir lados opuestos

      const a = i / this.trail.length;
      ctx.strokeStyle = `rgba(255, 215, 0, ${(a * 0.6).toFixed(2)})`;
      ctx.lineWidth   = a * 3;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1][0], this.trail[i - 1][1]);
      ctx.lineTo(this.trail[i][0], this.trail[i][1]);
      ctx.stroke();
    }

    // Núcleo dorado brillante (polígono irregular)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle   = 'rgba(255, 215, 0, 0.9)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp (Velocidad) ────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.radius  = POWERUP_RADIUS;
    this.dead    = false;
    this.ttl     = POWERUP_TTL;
    this.rot     = 0;
    this.rotSpeed = rand(-1.5, 1.5);
    const angle  = rand(0, Math.PI * 2);
    const speed  = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const fading = this.ttl < 3 && Math.floor(this.ttl * 6) % 2 === 0;
    if (fading) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    // Aura
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.35)';
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Cuerpo
    ctx.strokeStyle = '#0df';
    ctx.fillStyle   = 'rgba(0, 220, 255, 0.18)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rayo "Velocidad"
    ctx.rotate(-this.rot);
    ctx.strokeStyle = '#aff';
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo( 5, -7);
    ctx.lineTo(-3,  1);
    ctx.lineTo( 2,  1);
    ctx.lineTo(-5,  7);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;   // timer del power-up "Velocidad" (s)
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedBoost > 0 ? SPEED_BOOST_MULT : 1);  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[shipSkin];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Halo mientras el power-up "Velocidad" esté activo
    if (this.speedBoost > 0) {
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.45)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Silueta de la skin activa
    drawShipShape(skin.verts, skin.color, 1);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoost = 0;   // el efecto se pierde al morir
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin (cosmético, disponible en cualquier estado)
  if (pressed('KeyC')) setSkin(shipSkin + 1);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p  => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p  => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_DROP_CHANCE) powerups.push(new PowerUp(a.x, a.y));
        if (Math.random() < SHOOTING_STAR_CHANCE) newAsteroids.push(new ShootingStar(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up: recoger reinicia el timer del efecto (sin apilar)
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.speedBoost = SPEED_BOOST_DURATION;
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[shipSkin];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawShipShape(skin.verts, skin.color, 0.45, 1.2);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador del power-up "Velocidad" activo
  if (ship.speedBoost > 0) {
    const BAR_X = 14, BAR_Y = 54, BAR_W = 120, BAR_H = 6;
    const pct = ship.speedBoost / SPEED_BOOST_DURATION;

    ctx.fillStyle = '#0df';
    ctx.textAlign = 'left';
    ctx.font      = '15px monospace';
    ctx.fillText('VELOCIDAD', BAR_X, BAR_Y - 4);

    // Fondo de la barra
    ctx.fillStyle   = 'rgba(0, 220, 255, 0.15)';
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.5)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    // Relleno: se vacía de derecha a izquierda
    ctx.fillStyle = '#0df';
    ctx.fillRect(BAR_X, BAR_Y, BAR_W * pct, BAR_H);
  }

  // Skin activa
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'left';
  ctx.font      = '13px monospace';
  ctx.fillText(`SKIN: ${SKINS[shipSkin].name}  [C]`, 14, H - 14);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p  => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
