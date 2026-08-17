import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projection = JSON.parse(await readFile(
  new URL('../data/professional-public-projection.v1.json', import.meta.url),
  'utf8'
));
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

function collectSectionText(section) {
  return [
    ...(section.heading ? [section.heading] : []),
    ...section.paragraphs,
    ...(section.groups ?? []).flatMap(collectSectionText)
  ];
}

const expected = [
  projection.shared.name,
  projection.shared.professionalIdentity,
  projection.site.title,
  projection.site.description,
  ...Object.values(projection.site.sections).flatMap(collectSectionText)
];

for (const text of expected) {
  assert.ok(html.includes(text), `Built page is missing projection content: ${text}`);
}

console.log('Verified built page contains all current site projection content');
