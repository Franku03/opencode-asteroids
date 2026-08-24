---
description: Crea un git worktree en .worktrees/ con un nombre derivado del contexto del argumento.
agent: build
---

El usuario ejecutó `/worktree`. El argumento (puede contener espacios; es la descripción/contexto de la tarea) es:

$ARGUMENTS

Analiza ese argumento y deriva un nombre conciso para el worktree que refleje el contexto: minúsculas, en kebab-case, sin espacios ni caracteres especiales.

Ejecuta **únicamente** este comando:

git worktree add .worktrees/<nombre-del-worktree>

Restricciones estrictas:
- No cambies de directorio (no uses `cd` ni el parámetro `workdir`).
- No realices ninguna otra acción: sin commits, sin `git checkout`, sin editar archivos, sin crear ramas manualmente.
- Solo ejecuta el comando `git worktree add` indicado, reemplazando `<nombre-del-worktree>` por el nombre derivado.
- Si los argumentos exceden de 3, resúmelos a un nombre significativo.
