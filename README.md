# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Al destruir un asteroide puede soltar un power-up "Velocidad" que duplica el empuje de la nave durante 5 segundos.

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

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-up "Velocidad"

Al destruir un asteroide existe una probabilidad (≈10 %) de que suelte un power-up **Velocidad**, representado por un orbe cian con un rayo. Al recogerlo con la nave:

- Duplica la fuerza de empuje (THRUST) durante **5 segundos**.
- Muestra un halo cian alrededor de la nave y un contador `VELOCIDAD x.xs` en el HUD.
- Recoger un segundo orbe mientras el efecto está activo **reinicia el temporizador** a 5 s (no se apila más allá de 2×).
- El efecto se pierde al morir o al cambiar de nivel.
- Si no se recoge, el orbe desaparece del campo a los 10 s.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up "Velocidad": empuje duplicado durante 5 s al recoger el orbe
