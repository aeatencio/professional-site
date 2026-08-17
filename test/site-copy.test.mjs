import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';

test('local projection is the authority for current professional copy', async () => {
  const projection = await loadLocalPublicProjection();

  assert.equal(projection.shared.name, 'Andrés Atencio');
  assert.equal(
    projection.shared.professionalIdentity,
    'Software Developer · IT Teacher'
  );
  assert.equal(projection.site.sections.experience.heading, 'Experience');
  assert.equal(projection.site.sections.background.heading, 'Background');
  assert.equal(
    projection.site.sections.workingTogether.heading,
    'Working together'
  );
  assert.equal(projection.site.sections.contact.heading, 'Contact');
  assert.deepEqual(projection.cv, {});
});

test('Astro owns structure while professional copy stays out of page and layout source', async () => {
  const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

  assert.equal(
    page.includes("import projection from '../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(page.includes('Software development and IT teaching are one present trajectory.'), false);
  assert.equal(page.includes('Selected work, a reverse chronology of software roles'), false);
  assert.equal(page.includes('Public availability stays generic'), false);
  assert.equal(page.includes('loadLocalPublicProjection'), false);
  assert.equal(layout.includes('Andrés Atencio'), false);
});

test('public content has no workflow or private-source fields', async () => {
  const serialized = await readFile(
    new URL('../data/professional-public-projection.v1.json', import.meta.url),
    'utf8'
  );

  for (const prohibited of [
    'values',
    'representations',
    'factId',
    'evidenceReferences',
    'privateLocators',
    'openQuestions',
    'internalNotes',
    'humanApproval',
    'publicationPermission',
    'approved',
    'factualStatus',
    'traceability'
  ]) {
    assert.equal(serialized.includes(`"${prohibited}"`), false);
  }
});
