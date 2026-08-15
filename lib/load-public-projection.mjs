import { readFile } from 'node:fs/promises';
import { validatePublicProjection } from './public-projection.mjs';

const localSchemaUrl = new URL('../contracts/professional-public-projection.v1.schema.json', import.meta.url);
const localProjectionUrl = new URL('../data/professional-public-projection.v1.json', import.meta.url);

export class PublicProjectionLoadError extends Error {
  constructor(stage, message, options = {}) {
    super(`Public projection ${stage} failed: ${message}`, options);
    this.name = 'PublicProjectionLoadError';
    this.stage = stage;
    if (options.details) this.details = options.details;
  }
}

async function readText(path, label) {
  try {
    return await readFile(path, 'utf8');
  } catch (cause) {
    throw new PublicProjectionLoadError(`read-${label}`, `could not read ${String(path)}`, { cause });
  }
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new PublicProjectionLoadError(`parse-${label}`, `invalid JSON in ${label}`, { cause });
  }
}

export async function loadPublicProjection({ schemaPath, projectionPath }) {
  const [schemaText, projectionText] = await Promise.all([
    readText(schemaPath, 'schema'),
    readText(projectionPath, 'projection')
  ]);
  const schema = parseJson(schemaText, 'schema');
  const projection = parseJson(projectionText, 'projection');
  const errors = validatePublicProjection(schema, projection);
  if (errors.length) {
    throw new PublicProjectionLoadError('validation', 'projection does not satisfy the public contract', { details: errors });
  }
  return projection;
}

export function loadLocalPublicProjection() {
  return loadPublicProjection({ schemaPath: localSchemaUrl, projectionPath: localProjectionUrl });
}
