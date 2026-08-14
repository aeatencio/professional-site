import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validatePublicProjection } from '../lib/public-projection.mjs';

const schema = JSON.parse(await readFile(new URL('../contracts/professional-public-projection.v1.schema.json', import.meta.url), 'utf8'));
const valid = () => ({
  contract: 'professional-public-projection/v1', version: 1, publicId: 'synthetic-profile',
  values: [{ id: 'synthetic-fact', kind: 'project', value: 'Synthetic value' }],
  representations: {
    site: [{ factId: 'synthetic-fact', text: 'Synthetic site wording' }],
    cv: [{ factId: 'synthetic-fact', text: 'Synthetic CV wording' }]
  },
  metadata: { generatedAt: '2026-01-01T00:00:00.000Z', language: 'es' }
});

test('accepts a valid projection and independent representations', () => {
  const projection = valid();
  assert.deepEqual(validatePublicProjection(schema, projection), []);
  assert.notEqual(projection.representations.site[0].text, projection.representations.cv[0].text);
});

test('rejects an unknown version and unknown fields', () => {
  const version = valid(); version.version = 2;
  assert.notDeepEqual(validatePublicProjection(schema, version), []);
  const field = valid(); field.unexpected = true;
  assert.notDeepEqual(validatePublicProjection(schema, field), []);
});

test('rejects private evidence and locators at any depth', () => {
  for (const key of ['evidenceReferences', 'privateLocators']) {
    const projection = valid(); projection.metadata[key] = ['private'];
    assert.notDeepEqual(validatePublicProjection(schema, projection), []);
  }
});

test('rejects canonical-source and approval internals', () => {
  for (const key of ['facts', 'openQuestions', 'internalNotes', 'humanApproval', 'publicationPermission', 'traceability', 'secrets']) {
    const projection = valid(); projection[key] = 'private';
    assert.notDeepEqual(validatePublicProjection(schema, projection), []);
  }
});

test('rejects missing, orphaned, and duplicate representation references', () => {
  const missing = valid(); missing.representations.site = [];
  assert.throws(() => validatePublicProjection(schema, missing), /exactly once/);
  const orphan = valid(); orphan.representations.cv[0].factId = 'orphan';
  assert.throws(() => validatePublicProjection(schema, orphan), /exactly once/);
  const duplicate = valid(); duplicate.values.push({ ...duplicate.values[0] });
  assert.throws(() => validatePublicProjection(schema, duplicate), /Duplicate/);
});

test('consumer implementation has no private repository dependency', async () => {
  const files = ['../package.json', '../astro.config.mjs', '../scripts/validate-public-projection.mjs', '../lib/public-projection.mjs'];
  for (const file of files) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(contents.includes('professional-source'), false);
  }
});
