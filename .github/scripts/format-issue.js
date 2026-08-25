// Formatea y etiqueta issues nuevos de forma idempotente.
// Disparado por .github/workflows/format-issue.yml en issues.opened.

const MARKER = '<!-- issue-formatter:ok -->';

// Labels candidatas: nombre -> color (hex sin #).
const LABELS = {
  bug: 'd73a4a',
  enhancement: 'a2eeef',
  question: '0075ca',
  'needs-triage': 'fbca04',
};

// Keywords por label (match sobre título + cuerpo, en minúsculas).
const KEYWORDS = {
  bug: ['error', 'crash', 'crashea', 'crasheo', 'falla', 'fallo', 'roto', 'no funciona', 'glitch', 'bug', 'broken', 'excepción', 'excepcion'],
  enhancement: ['mejora', 'agregar', 'añadir', 'anadir', 'sería bueno', 'seria bueno', 'debería', 'deberia', 'sugerencia', 'propuesta', 'idea', 'feature', 'request', 'nueva', 'nuevo'],
  question: ['cómo', 'como', 'pregunta', 'duda', 'ayuda', 'help', 'question', '?'],
};

// Prioridad de clasificación: el primer match gana.
const PRIORITY = ['bug', 'enhancement', 'question'];

function classify(text) {
  const lower = text.toLowerCase();
  for (const label of PRIORITY) {
    if (KEYWORDS[label].some((kw) => lower.includes(kw))) return label;
  }
  return null;
}

function formatDate(iso) {
  // ISO 8601 -> YYYY-MM-DD (zona del servidor, suficiente para metadata).
  return iso.slice(0, 10);
}

function buildBody(original, meta, stack, checklist) {
  return `${MARKER}\n\n${meta}\n\n---\n\n${original}\n\n---\n\n${stack}\n\n${checklist}\n`;
}

module.exports = async ({ github, context }) => {
  const issue = context.payload.issue;
  if (!issue) {
    core.info('No hay issue en el payload; saliendo.');
    return;
  }

  // Salvaguarda anti-duplicado: si el cuerpo ya tiene el marcador, no hacer nada.
  if (issue.body && issue.body.includes(MARKER)) {
    core.info(`Issue #${issue.number} ya formateado; saliendo.`);
    return;
  }

  // Crear labels candidatas (idempotente: ignora 422 si ya existen).
  for (const [name, color] of Object.entries(LABELS)) {
    try {
      await github.rest.issues.createLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name,
        color,
      });
      core.info(`Label creada: ${name}`);
    } catch (err) {
      // 422 = la label ya existe; cualquier otro error se relanza.
      if (err.status !== 422) throw err;
      core.info(`Label ya existía: ${name}`);
    }
  }

  // Clasificar por keywords.
  const text = `${issue.title || ''}\n${issue.body || ''}`;
  const detected = classify(text);
  const labelsToAdd = detected
    ? [detected, 'needs-triage']
    : ['needs-triage'];

  await github.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issue.number,
    labels: labelsToAdd,
  });
  core.info(`Labels asignadas: ${labelsToAdd.join(', ')}`);

  // Construir el cuerpo formateado preservando el texto original.
  const author = issue.user ? issue.user.login : 'desconocido';
  const date = formatDate(issue.created_at);
  const sha = context.sha.slice(0, 7);

  const meta = [
    '> 📋 **Metadata del reporte**',
    `> - **Autor**: @${author}`,
    `> - **Fecha**: ${date}`,
    `> - **Issue**: #${issue.number}`,
    `> - **Commit**: ${sha}`,
  ].join('\n');

  const stack = [
    '### 🛠️ Stack del proyecto',
    '- HTML5 Canvas (800×600) — renderizado 2D',
    '- JavaScript puro (ES6+) — lógica en `game.js`',
    '- Sin frameworks, sin bundler, sin dependencias',
    "- Cómo correr: `npx serve .` → http://localhost:3000 (o abrir `index.html`)",
  ].join('\n');

  const checklist = [
    '### ✅ Checklist de reproducción',
    '- [ ] Reproducido con `npx serve .`',
    '- [ ] Navegador probado: ___',
    '- [ ] Pasos para reproducir confirmados',
    '- [ ] Errores en consola del navegador: ___',
  ].join('\n');

  const original = (issue.body && issue.body.trim()) || '_Sin descripción._';
  const newBody = buildBody(original, meta, stack, checklist);

  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issue.number,
    body: newBody,
  });

  core.info(`Issue #${issue.number} formateado.`);
};
