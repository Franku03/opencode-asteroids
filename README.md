# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Al destruir un asteroide pueden soltarse power-ups (**Velocidad**, **Triple Shot** o **Escudo**) y, con poca probabilidad, una **Estrella Fugaz**. Cambia la skin de la nave con `C`.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `C`       | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

Al destruir un asteroide pueden soltarse orbes de power-up. Cada tipo tiene su propia probabilidad independiente (pueden soltarse varios a la vez). Si no se recogen, los orbes desaparecen del campo a los 10 s. Recoger un orbe mientras su efecto está activo **reinicia el temporizador** (no se apila). Todos los efectos se pierden al morir o al cambiar de nivel.

### Velocidad  (≈10 %)

Orbe cian con un rayo. Duplica la fuerza de empuje (THRUST) durante **5 segundos**. Muestra un halo cian alrededor de la nave y una barra `VELOCIDAD` en el HUD que se vacía de derecha a izquierda con el tiempo restante.

### Triple Shot  (≈8 %)

Orbe naranja con tres balas en abanico. Cada disparo lanza **3 balas** en abanico (±~8°) durante **5 segundos**. Muestra un halo naranja alrededor de la nave y una barra `TRIPLE` en el HUD.

### Escudo  (≈8 %)

Orbe verde con un arco concéntrico. Genera un anillo protector alrededor de la nave durante **8 segundos** que **destruye asteroides al contacto** (sumando puntos y fragmentos). Cada impacto absorbido consume **1,5 s** del temporizador. El anillo parpadea en el último 1,5 s antes de agotarse. Muestra una barra `ESCUDO` en el HUD.

## Estrella Fugaz

Al destruir un asteroide existe una probabilidad baja (≈5 %) de que aparezca una **Estrella Fugaz**, un asteroide especial representado por un polígono irregular dorado (misma forma que un asteroide, pero más pequeño y brillante) con una estela tipo cometa que se desvanece. Características:

- Se mueve **≈3× más rápido** que un asteroide pequeño (240 px/s).
- **Desaparece sola a los 6 s** si no se destruye, con un parpadeo final los últimos 1,5 s.
- Al destruirla con una bala otorga **300 puntos** y explota en partículas, pero **no se parte** en fragmentos.
- Impacta a la nave igual que un asteroide normal (pierdes una vida).
- Bloquea el avance de nivel mientras exista: destrúyela o espera a que expire.

## Skins

Puedes cambiar la apariencia de la nave pulsando `C` en cualquier momento (incluso en partida o en *Game Over*). La elección se guarda en `localStorage` y se recuerda entre recargas. Cada skin define además un `scale` (multiplica el tamaño y la hitbox) y un `scoreMult` (multiplica los puntos ganados).

| Skin       | Color   | Llama    | Forma              | Tamaño | Puntos |
| ---------- | ------- | -------- | ------------------ | ------ | ------ |
| Clásica    | Blanco  | Naranja  | Triángulo con muesca trasera | ×1 | ×1 |
| Carmesí    | Rojo    | Amarilla | Dardo afilado de alas barridas | ×1 | ×1 |
| Áurea      | Dorado  | Roja     | Crucero ancho      | ×1 | ×1 |
| Esmeralda  | Verde   | Verde    | Interceptor largo y estrecho | ×1 | ×1 |
| Púrpura    | Púrpura | Magenta  | Caza hexagonal     | ×2 | ×2 |

La **Púrpura** es el doble de grande que la nave original (también su hitbox) y suma el **doble de puntos**.

El HUD muestra el nombre de la skin activa en la esquina inferior izquierda.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up "Velocidad": empuje duplicado durante 5 s al recoger el orbe
- Power-up "Triple Shot": dispara 3 balas en abanico durante 5 s
- Power-up "Escudo": anillo protector que destruye asteroides al contacto durante 8 s
- Estrella Fugaz: asteroide dorado rápido y efímero, 300 puntos, desaparece a los 6 s
- Skins: 5 apariencias de nave (forma + color + llama) intercambiables con `C`, persisten en `localStorage`; la Púrpura es ×2 de tamaño (hitbox incluida) y suma ×2 puntos
