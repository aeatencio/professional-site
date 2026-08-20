import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projection = JSON.parse(await readFile(
  new URL('../data/professional-public-projection.v1.json', import.meta.url),
  'utf8'
));
const [siteHtml, cvHtml] = await Promise.all([
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/cv/index.html', import.meta.url), 'utf8')
]);

function collectStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

const expectedSite = [
  projection.shared.name,
  projection.shared.professionalIdentity,
  projection.shared.location,
  projection.shared.email,
  ...collectStrings(projection.shared.links),
  ...collectStrings(projection.site)
];

for (const text of expectedSite) {
  assert.ok(siteHtml.includes(text), `Built site is missing projection content: ${text}`);
}

const expectedCv = [
  projection.shared.name,
  projection.cv.title,
  projection.shared.location,
  projection.shared.email,
  ...collectStrings(projection.shared.links),
  ...collectStrings(projection.cv)
];

for (const text of expectedCv) {
  assert.ok(cvHtml.includes(text), `Built CV is missing projection content: ${text}`);
}

assert.equal(siteHtml.includes('Magic Calendar'), false, 'CV selected-work leaked into Home');
assert.equal(
  cvHtml.includes(projection.site.sections.home.paragraphs[0]),
  false,
  'Home copy leaked into the CV'
);
assert.ok(cvHtml.includes(`mailto:${projection.shared.email}`), 'Built CV email is not linked');

console.log('Verified built Home and CV contain only their projected content');
