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
    professionalIdentity: 'Software Developer · IT Teacher',
    location: 'Synthetic City',
    email: 'synthetic@example.com',
    links: [{ label: 'Profile', url: 'https://example.com/profile' }]
  },
  site: {
    title: 'Synthetic professional site',
    description: 'Synthetic public description.',
    sections: {
      home: { paragraphs: ['Synthetic home copy.'] },
      experience: {
        heading: 'Experience',
        paragraphs: ['Synthetic experience summary.'],
        softwareDevelopment: {
          heading: 'Software development',
          roles: [{
            organization: 'Synthetic Organization',
            period: '2000–2001',
            role: 'Software Developer',
            description: 'Synthetic role description.'
          }]
        },
        currentDevelopment: {
          heading: 'Current development',
          paragraphs: ['Synthetic current development summary.'],
          items: [{
            heading: 'Synthetic project',
            paragraphs: ['Synthetic project description.']
          }]
        },
        teaching: {
          heading: 'Teaching',
          paragraphs: ['Synthetic teaching summary.']
        }
      },
      background: {
        heading: 'Background',
        items: [{
          heading: 'Synthetic education',
          paragraphs: ['Synthetic education description.']
        }]
      },
      workingTogether: {
        heading: 'Working together',
        paragraphs: ['Synthetic collaboration copy.']
      },
      contact: {
        heading: 'Contact',
        paragraphs: ['Synthetic contact copy.']
      }
    }
  },
  cv: validCv()
});

const validCv = () => ({
  title: 'Synthetic software CV',
  profile: {
    heading: 'Profile',
    text: 'Synthetic profile summary.'
  },
  softwareExperience: {
    heading: 'Software experience',
    roles: [{
      organization: 'Synthetic Organization',
      role: 'Software Developer',
      period: '2000–2001',
      summary: 'Synthetic software role.',
      technologies: ['Synthetic technology']
    }]
  },
  currentDevelopment: {
    heading: 'Current development',
    text: 'Synthetic current development.'
  },
  teaching: {
    heading: 'Teaching',
    text: 'Synthetic teaching experience.'
  },
  education: {
    heading: 'Education',
    items: [{
      institution: 'Synthetic University',
      qualification: 'Synthetic qualification',
      period: '2000'
    }]
  },
  technicalBackground: {
    heading: 'Technical background',
    professionalExperience: {
      heading: 'Professional experience',
      items: ['Synthetic technology']
    },
    currentPractice: {
      heading: 'Current practice',
      items: ['Synthetic current practice']
    }
  },
  languages: {
    heading: 'Languages',
    items: [{
      language: 'Synthetic language',
      proficiency: 'Synthetic proficiency'
    }]
  }
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

test('complete CV is required; missing, empty, and partial CV are rejected', () => {
  const complete = valid();
  assert.deepEqual(validatePublicProjection(schema, complete), []);
  assert.ok(complete.site.sections.home.paragraphs.length > 0);
  assert.ok(complete.cv.softwareExperience.roles.length > 0);

  const missing = valid();
  delete missing.cv;
  assert.notDeepEqual(validatePublicProjection(schema, missing), []);

  const empty = valid();
  empty.cv = {};
  assert.notDeepEqual(validatePublicProjection(schema, empty), []);

  const partial = valid();
  partial.cv = { title: 'Incomplete CV' };
  assert.notDeepEqual(validatePublicProjection(schema, partial), []);
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
  assert.equal(projection.shared.location, 'Buenos Aires, Argentina');
  assert.equal(projection.shared.email, 'aeatencio@gmail.com');
  assert.deepEqual(
    projection.shared.links.map(({ label }) => label),
    ['GitHub', 'LinkedIn']
  );
  assert.equal(projection.cv.title, 'Software Developer');
  assert.deepEqual(
    projection.cv.softwareExperience.roles.map(({ organization }) => organization),
    ['Manas Technology Solutions', 'Mobile Streams', 'RVM Soluciones']
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
    projection => projection.site.sections.experience.softwareDevelopment.roles[0],
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

  const privateCv = valid();
  privateCv.cv = validCv();
  privateCv.cv.profile.privateLocators = ['private://source'];
  assert.notDeepEqual(validatePublicProjection(schema, privateCv), []);
});

test('productive consumer contains no private-repository dependency', async () => {
  const files = [
    '../package.json',
    '../astro.config.mjs',
    '../scripts/validate-public-projection.mjs',
    '../lib/load-public-projection.mjs',
    '../lib/public-projection.mjs',
    '../src/pages/index.astro',
    '../src/pages/cv/index.astro',
    '../src/pages/cv/letter.astro',
    '../src/components/CvDocument.astro',
    '../src/components/CvActions.astro',
    '../src/layouts/CvLayout.astro',
    '../lib/cv-pdf.mjs',
    '../lib/printable-cv.mjs',
    '../lib/headless-chrome.mjs',
    '../scripts/generate-cv-pdfs.mjs',
    '../scripts/verify-built-content.mjs',
    '../scripts/verify-home-overflow.mjs'
  ];

  for (const file of files) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(contents.includes('professional-source'), false);
  }
});
