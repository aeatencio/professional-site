import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projection = JSON.parse(await readFile(
  new URL('../data/professional-public-projection.v1.json', import.meta.url),
  'utf8'
));
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

function collectStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

const expected = [
  projection.shared.name,
  projection.shared.professionalIdentity,
  projection.shared.location,
  projection.shared.email,
  ...collectStrings(projection.shared.links),
  ...collectStrings(projection.site)
];

for (const text of expected) {
  assert.ok(html.includes(text), `Built page is missing projection content: ${text}`);
}

console.log('Verified built page contains all current site projection content');
