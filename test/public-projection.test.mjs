import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  loadLocalPublicProjection,
  loadPublicProjection,
  PublicProjectionLoadError
} from '../lib/load-public-projection.mjs';
import { validatePublicProjection } from '../lib/public-projection.mjs';

const schema = JSON.parse(await readFile(
  new URL('../contracts/professional-public-projection.v1.schema.json', import.meta.url),
  'utf8'
));

const valid = () => ({
  contract: 'professional-public-projection/v1',
  version: 1,
  publicId: 'synthetic-profile',
  shared: {
    language: 'en',
    name: 'Synthetic Person',
    professionalIdentity: 'Software Developer · IT Teacher'
  },
  site: {
    title: 'Synthetic professional site',
    description: 'Synthetic public description.',
    sections: {
      home: { paragraphs: ['Synthetic home copy.'] },
      experience: { heading: 'Experience', paragraphs: [] },
      background: { heading: 'Background', paragraphs: [] },
      workingTogether: { heading: 'Working together', paragraphs: [] },
      contact: { heading: 'Contact', paragraphs: [] }
    }
  },
  cv: {}
});

async function temporaryProjection(
  t,
  { schemaValue = schema, projectionValue = valid(), schemaText, projectionText } = {}
) {
  const directory = await mkdtemp(join(tmpdir(), 'public-projection-consumer-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const schemaPath = join(directory, 'schema.json');
  const projectionPath = join(directory, 'projection.json');
  await Promise.all([
    writeFile(schemaPath, schemaText ?? JSON.stringify(schemaValue)),
    writeFile(projectionPath, projectionText ?? JSON.stringify(projectionValue))
  ]);
  return { schemaPath, projectionPath };
}

test('accepts public site content without requiring equivalent CV content', () => {
  const projection = valid();
  assert.deepEqual(validatePublicProjection(schema, projection), []);
  assert.ok(projection.site.sections.home.paragraphs.length > 0);
  assert.deepEqual(projection.cv, {});
});

test('productive entry validates and loads the repository-local content', async () => {
  const projection = await loadLocalPublicProjection();
  assert.equal(projection.contract, 'professional-public-projection/v1');
  assert.equal(projection.publicId, 'andres-atencio');
  assert.equal(projection.shared.language, 'en');
  assert.equal(
    projection.shared.professionalIdentity,
    'Software Developer · IT Teacher'
  );
});

test('generic loader accepts controlled fixture paths', async t => {
  const paths = await temporaryProjection(t);
  const projection = await loadPublicProjection(paths);
  assert.equal(projection.publicId, 'synthetic-profile');
  assert.equal(projection.site.sections.home.paragraphs[0], 'Synthetic home copy.');
});

test('loader reports contextual read, parse, and schema failures', async t => {
  const missing = join(tmpdir(), `missing-public-projection-${Date.now()}.json`);
  await assert.rejects(
    loadPublicProjection({ schemaPath: missing, projectionPath: missing }),
    error => error instanceof PublicProjectionLoadError
      && /^read-(schema|projection)$/.test(error.stage)
  );

  const malformed = await temporaryProjection(t, { projectionText: '{' });
  await assert.rejects(
    loadPublicProjection(malformed),
    error => error instanceof PublicProjectionLoadError
      && error.stage === 'parse-projection'
  );

  const wrongVersion = valid();
  wrongVersion.version = 2;
  const invalidShape = await temporaryProjection(t, { projectionValue: wrongVersion });
  await assert.rejects(loadPublicProjection(invalidShape), error => {
    assert.equal(error.stage, 'validation');
    assert.ok(error.details.every(detail => detail.stage === 'schema'));
    return true;
  });
});

test('closed schema rejects unknown and private fields wherever objects allow content', () => {
  const placements = [
    projection => projection,
    projection => projection.shared,
    projection => projection.site,
    projection => projection.site.sections.home,
    projection => projection.cv
  ];

  for (const key of [
    'evidenceReferences',
    'privateLocators',
    'openQuestions',
    'internalNotes',
    'humanApproval',
    'publicationPermission',
    'approved',
    'approvedBy',
    'approvedAt',
    'factualStatus',
    'traceability'
  ]) {
    for (const place of placements) {
      const projection = valid();
      place(projection)[key] = 'private';
      assert.notDeepEqual(validatePublicProjection(schema, projection), []);
    }
  }
});

test('productive consumer contains no private-repository dependency', async () => {
  const files = [
    '../package.json',
    '../astro.config.mjs',
    '../scripts/validate-public-projection.mjs',
    '../lib/load-public-projection.mjs',
    '../lib/public-projection.mjs',
    '../src/pages/index.astro'
  ];

  for (const file of files) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(contents.includes('professional-source'), false);
  }
});
