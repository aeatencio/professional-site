import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadLocalPublicProjection, loadPublicProjection, PublicProjectionLoadError } from '../lib/load-public-projection.mjs';
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

async function temporaryProjection(t, { schemaValue = schema, projectionValue = valid(), schemaText, projectionText } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'public-projection-consumer-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const schemaPath = join(directory, 'schema.json');
  const projectionPath = join(directory, 'projection.json');
  await Promise.all([
    writeFile(schemaPath, schemaText ?? JSON.stringify(schemaValue)),
    writeFile(projectionPath, projectionText ?? JSON.stringify(projectionValue))
  ]);
  return { directory, schemaPath, projectionPath };
}

test('generic loader accepts caller-provided fixture paths and cleans them afterward', async t => {
  const paths = await temporaryProjection(t);
  const projection = await loadPublicProjection(paths);
  assert.equal(projection.publicId, 'synthetic-profile');
  assert.equal(projection.representations.site[0].text, 'Synthetic site wording');
});

test('productive entry loads the repository-local projection without path parameters', async () => {
  const projection = await loadLocalPublicProjection();
  assert.equal(projection.contract, 'professional-public-projection/v1');
  assert.equal(projection.publicId, 'synthetic-profile');
});

test('loader reports contextual read, parse, schema, privacy, and integrity failures', async t => {
  const missing = join(tmpdir(), `missing-public-projection-${Date.now()}.json`);
  await assert.rejects(loadPublicProjection({ schemaPath: missing, projectionPath: missing }), error => {
    assert.ok(error instanceof PublicProjectionLoadError);
    assert.match(error.stage, /^read-(schema|projection)$/);
    return true;
  });

  const malformed = await temporaryProjection(t, { projectionText: '{' });
  await assert.rejects(loadPublicProjection(malformed), error => error instanceof PublicProjectionLoadError && error.stage === 'parse-projection');

  const wrongVersion = valid(); wrongVersion.version = 2;
  const invalidSchemaShape = await temporaryProjection(t, { projectionValue: wrongVersion });
  await assert.rejects(loadPublicProjection(invalidSchemaShape), error => {
    assert.equal(error.stage, 'validation');
    assert.ok(error.details.some(detail => detail.stage === 'schema'));
    return true;
  });

  const privateField = valid(); privateField.values[0].evidenceReferences = ['private'];
  const invalidPrivacy = await temporaryProjection(t, { projectionValue: privateField });
  await assert.rejects(loadPublicProjection(invalidPrivacy), error => {
    assert.ok(error.details.some(detail => detail.stage === 'privacy'));
    return true;
  });

  const orphan = valid(); orphan.representations.site[0].factId = 'orphan';
  const invalidIntegrity = await temporaryProjection(t, { projectionValue: orphan });
  await assert.rejects(loadPublicProjection(invalidIntegrity), error => {
    assert.ok(error.details.some(detail => detail.stage === 'integrity'));
    return true;
  });
});

test('rejects an unknown version and unknown fields', () => {
  const version = valid(); version.version = 2;
  assert.notDeepEqual(validatePublicProjection(schema, version), []);
  const field = valid(); field.unexpected = true;
  assert.notDeepEqual(validatePublicProjection(schema, field), []);
});

test('rejects private and internal fields in relevant nested public structures', () => {
  const placements = [
    projection => projection.values[0],
    projection => projection.representations,
    projection => projection.representations.site[0],
    projection => projection.representations.cv[0]
  ];
  const privateKeys = [
    'evidence', 'evidenceReferences', 'privateLocators', 'openQuestions',
    'internalNotes', 'secrets', 'humanApproval', 'publicationPermission',
    'traceability', 'facts', 'technicalMetadata'
  ];
  for (const key of privateKeys) {
    for (const place of placements) {
      const projection = valid(); place(projection)[key] = 'private';
      assert.ok(validatePublicProjection(schema, projection).some(error => error.stage === 'privacy'));
    }
  }
});

test('rejects canonical-source and approval internals at the projection root', () => {
  for (const key of ['facts', 'openQuestions', 'internalNotes', 'humanApproval', 'publicationPermission', 'traceability', 'secrets']) {
    const projection = valid(); projection[key] = 'private';
    assert.notDeepEqual(validatePublicProjection(schema, projection), []);
  }
});

test('rejects missing, orphaned, and duplicate representation references', () => {
  const missing = valid(); missing.representations.site = [];
  assert.ok(validatePublicProjection(schema, missing).some(error => error.stage === 'integrity' && /exactly once/.test(error.message)));
  const orphan = valid(); orphan.representations.cv[0].factId = 'orphan';
  assert.ok(validatePublicProjection(schema, orphan).some(error => error.stage === 'integrity' && /exactly once/.test(error.message)));
  const duplicate = valid(); duplicate.values.push({ ...duplicate.values[0] });
  assert.ok(validatePublicProjection(schema, duplicate).some(error => error.stage === 'integrity' && /Duplicate/.test(error.message)));
});

test('productive consumer files contain no direct private-repository reference', async () => {
  const files = ['../package.json', '../astro.config.mjs', '../scripts/validate-public-projection.mjs', '../lib/load-public-projection.mjs', '../lib/public-projection.mjs'];
  for (const file of files) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(contents.includes('professional-source'), false);
  }
});
