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
  assert.equal(projection.shared.email, 'aeatencio@gmail.com');
  assert.equal(projection.site.sections.experience.heading, 'Experience');
  assert.equal(projection.site.sections.background.heading, 'Background');
  assert.deepEqual(
    projection.site.sections.experience.softwareDevelopment.roles.map(({ organization }) => organization),
    ['RVM Soluciones', 'Mobile Streams', 'Manas Technology Solutions']
  );
  assert.equal(
    projection.site.sections.experience.currentDevelopment.heading,
    'Current development'
  );
  assert.equal(
    projection.site.sections.experience.currentDevelopment.paragraphs.length,
    1
  );
  assert.equal(
    projection.site.sections.experience.currentDevelopment.items.length,
    3
  );
  assert.equal(
    projection.site.sections.experience.teaching.heading,
    'Teaching and technology education'
  );
  assert.ok(
    projection.site.sections.experience.teaching.paragraphs.some((paragraph) =>
      paragraph.includes('UNAHUR')
    )
  );
  assert.equal(
    projection.site.sections.workingTogether.heading,
    'Working together'
  );
  assert.equal(projection.site.sections.workingTogether.paragraphs.length, 2);
  assert.equal(projection.site.sections.contact.heading, 'Contact');
  assert.equal(projection.cv.title, 'Software Development CV');
  assert.deepEqual(
    projection.cv.softwareExperience.roles.map(({ organization }) => organization),
    ['Manas Technology Solutions', 'Mobile Streams', 'RVM Soluciones']
  );
  assert.match(projection.cv.currentDevelopment.text, /bulletin-generation tool/);
  assert.match(projection.cv.teaching.text, /CFP No\. 7/);
  assert.ok(projection.cv.teaching.text.includes('UNAHUR'));
  assert.deepEqual(
    projection.cv.technicalBackground.professionalExperience.items,
    [
      'JavaScript/TypeScript',
      'React',
      'Node.js',
      'Python',
      'C#',
      'ASP.NET',
      'Android/Java',
      'SQL Server',
      'PostgreSQL'
    ]
  );
  assert.deepEqual(
    projection.cv.technicalBackground.currentPractice.items,
    ['HTML', 'CSS', 'GitHub', 'static web development']
  );
  assert.deepEqual(
    projection.cv.languages.items.map(({ language }) => language),
    ['Spanish', 'English']
  );
});

test('Astro owns structure while site and CV copy stay in the projection', async () => {
  const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const cvPage = await readFile(new URL('../src/pages/cv.astro', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const cvLayout = await readFile(new URL('../src/layouts/CvLayout.astro', import.meta.url), 'utf8');

  assert.equal(
    page.includes("import projection from '../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(
    cvPage.includes("import projection from '../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(page.includes('I’m a software developer and IT teacher based in Buenos Aires.'), false);
  assert.equal(page.includes('RVM Soluciones'), false);
  assert.equal(page.includes('Since moving into teaching as my main activity'), false);
  assert.equal(page.includes('part-time, remote-friendly software work'), false);
  assert.equal(page.includes('Buenos Aires, Argentina'), false);
  assert.equal(page.includes('aeatencio@gmail.com'), false);
  assert.equal(page.includes('loadLocalPublicProjection'), false);
  assert.equal(page.includes('projection.cv'), false);
  assert.equal(cvPage.includes('Manas Technology Solutions'), false);
  assert.equal(cvPage.includes('Software developer with around fifteen years'), false);
  assert.equal(cvPage.includes('aeatencio@gmail.com'), false);
  assert.equal(layout.includes('Andrés Atencio'), false);
  assert.equal(cvLayout.includes('Andrés Atencio'), false);
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

  for (const internalNarrative of [
    'private factual source',
    'public content layer',
    'supporting content pipeline'
  ]) {
    assert.equal(serialized.includes(internalNarrative), false);
  }
});
