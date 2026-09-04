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
  assert.equal(
    projection.site.sections.experience.teaching.paragraphs[0],
    'I teach Information Technology in Buenos Aires City high schools and serve as Head of IT Training for CFP No. 7’s high school IT track.'
  );
  assert.equal(
    projection.site.sections.experience.teaching.paragraphs[1],
    'At CFP No. 7, I coordinate the IT track’s vocational training and its integration with the general high school curriculum, and teach courses in systems architecture, web interfaces and final projects.'
  );
  assert.equal(
    projection.site.sections.experience.teaching.paragraphs.some((paragraph) =>
      paragraph.includes('vocational-training reference')
    ),
    false
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
  assert.equal(projection.cv.title, 'Software Developer');
  assert.deepEqual(
    projection.cv.softwareExperience.roles.map(({ organization }) => organization),
    ['Manas Technology Solutions', 'Mobile Streams', 'RVM Soluciones']
  );
  const institutionalToolsParagraph =
    projection.site.sections.experience.currentDevelopment.items.find(
      (item) => item.heading === 'Institutional tools'
    )?.paragraphs[0];
  assert.match(institutionalToolsParagraph, /bulletin-generation tool/);
  assert.match(institutionalToolsParagraph, /CFP No\. 7/);
  assert.match(
    projection.cv.currentDevelopment.text,
    /teaching and school workflows/
  );
  assert.match(projection.cv.currentDevelopment.text, /professional site/);
  assert.match(
    projection.cv.teaching.text,
    /Information Technology teacher in Buenos Aires high schools and Head of IT Training for CFP No\. 7’s high school IT track since 2023\./
  );
  assert.ok(projection.cv.teaching.text.includes('UNAHUR'));
  assert.equal(projection.cv.teaching.text.includes('vocational-training reference'), false);
  assert.equal(projection.cv.teaching.text.includes('training reference'), false);
  assert.deepEqual(
    projection.cv.technicalBackground.professionalExperience.items,
    [
      'Full-stack web development',
      'Back-end and database work',
      'APIs and integrations',
      'Automated testing and TDD'
    ]
  );
  assert.deepEqual(
    projection.cv.technicalBackground.currentPractice.items,
    [
      'JavaScript / TypeScript',
      'SQL',
      'C# / .NET',
      'React',
      'Node.js',
      'Python',
      'HTML/CSS',
      'AWS',
      'Git'
    ]
  );
  assert.deepEqual(
    projection.cv.languages.items.map(({ language }) => language),
    ['Spanish', 'English']
  );
  assert.deepEqual(
    projection.cv.education.items.map(({ institution }) => institution),
    [
      'Universidad del Salvador',
      'Universidad de Buenos Aires',
      'IES Juan B. Justo',
      'Colegio Nacional de Buenos Aires'
    ]
  );
  assert.equal(projection.cv.education.items[0].qualification, 'Information Systems Analyst');
  assert.equal(projection.cv.education.items[0].period, '2017');
  assert.equal(projection.cv.education.items[1].qualification, 'Several years of university study');
  assert.equal(
    projection.cv.education.items[1].period,
    'Veterinary Medicine and Literature'
  );
  assert.equal(projection.cv.education.items[3].qualification, 'Bachiller');
  assert.match(
    projection.cv.education.items[3].period,
    /Pre-university high school, Universidad de Buenos Aires/
  );
  const academicFoundation =
    projection.site.sections.background.items.find(
      (item) => item.heading === 'Academic foundation'
    )?.paragraphs[0];
  assert.match(academicFoundation, /pre-university high school of the University of Buenos Aires/);
  assert.equal(academicFoundation.includes('five-year'), false);
  const acrossDisciplines =
    projection.site.sections.background.items.find(
      (item) => item.heading === 'Across disciplines'
    )?.paragraphs[0];
  assert.match(acrossDisciplines, /several years of university study at the University of Buenos Aires/);
  assert.equal(acrossDisciplines.includes('ten courses'), false);
  const educationSerialized = JSON.stringify(projection.cv.education);
  assert.equal(educationSerialized.includes('1998'), false);
  assert.equal(educationSerialized.includes('Five-year'), false);
  assert.equal(educationSerialized.includes('Incomplete'), false);
  assert.equal(educationSerialized.includes('10 courses'), false);
  const serialized = JSON.stringify(projection);
  assert.equal(serialized.includes('secondary school'), false);
  assert.equal(serialized.includes('secondary IT'), false);
  assert.equal(serialized.includes('secondary curriculum'), false);
  assert.match(serialized, /school workflows/);
});

test('Astro owns structure while site and CV copy stay in the projection', async () => {
  const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const cvPage = await readFile(new URL('../src/pages/cv/index.astro', import.meta.url), 'utf8');
  const cvLetterPage = await readFile(new URL('../src/pages/cv/letter.astro', import.meta.url), 'utf8');
  const cvDocument = await readFile(new URL('../src/components/CvDocument.astro', import.meta.url), 'utf8');
  const primaryNav = await readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const cvLayout = await readFile(new URL('../src/layouts/CvLayout.astro', import.meta.url), 'utf8');

  assert.equal(
    page.includes("import projection from '../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(
    cvPage.includes("import projection from '../../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(
    cvLetterPage.includes("import projection from '../../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(
    cvDocument.includes("import projection from '../../data/professional-public-projection.v1.json'"),
    true
  );
  assert.equal(page.includes('I’m a software developer and IT teacher based in Buenos Aires.'), false);
  assert.equal(page.includes('RVM Soluciones'), false);
  assert.equal(page.includes('mostly on existing web and mobile products'), false);
  assert.equal(page.includes('part-time remote software work on a contract or freelance basis'), false);
  assert.equal(page.includes('class="actions"'), false);
  assert.equal(page.includes('View experience'), false);
  assert.equal(page.includes('View CV'), false);
  assert.equal(page.includes('Download CV'), false);
  assert.equal(page.includes('Contact me'), false);
  assert.match(primaryNav, /href="\/cv\/">View online</);
  assert.match(primaryNav, /href=\{CV_PDF\.a4\.href\}/);
  assert.match(primaryNav, /download=\{CV_PDF\.a4\.download\}/);
  assert.match(primaryNav, />Download PDF</);
  assert.equal(primaryNav.includes('>View CV</a>'), false);
  assert.equal(primaryNav.includes('>Download CV</a>'), false);
  assert.match(primaryNav, /href="#contact">Contact</);
  assert.equal(primaryNav.includes('Download A4 CV'), false);
  assert.equal(page.includes('window.print'), false);
  assert.equal(page.includes('Buenos Aires, Argentina'), false);
  assert.equal(page.includes('aeatencio@gmail.com'), false);
  assert.equal(page.includes('loadLocalPublicProjection'), false);
  assert.equal(page.includes('projection.cv'), false);
  assert.equal(cvPage.includes('Manas Technology Solutions'), false);
  assert.equal(cvLetterPage.includes('Manas Technology Solutions'), false);
  assert.equal(cvDocument.includes('Manas Technology Solutions'), false);
  assert.equal(cvPage.includes('Software developer with around fifteen years'), false);
  assert.equal(cvLetterPage.includes('Software developer with around fifteen years'), false);
  assert.equal(cvDocument.includes('Software developer with around fifteen years'), false);
  assert.equal(cvPage.includes('aeatencio@gmail.com'), false);
  assert.equal(cvLetterPage.includes('aeatencio@gmail.com'), false);
  assert.equal(cvDocument.includes('aeatencio@gmail.com'), false);
  assert.equal(cvPage.includes('Software Developer · IT Teacher'), false);
  assert.equal(cvLetterPage.includes('Software Developer · IT Teacher'), false);
  assert.equal(layout.includes('Andrés Atencio'), false);
  assert.equal(cvLayout.includes('Andrés Atencio'), false);
  assert.match(cvLayout, /<CvChrome format=\{format\} \/>/);
  assert.equal(cvDocument.includes('cv-chrome'), false);
  assert.equal(cvDocument.includes('window.print'), false);
  assert.equal(cvLayout.includes('window.print'), false);
  assert.equal(page.includes('andresatencio.com/cv'), false);
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
