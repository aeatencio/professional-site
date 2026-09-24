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
  assert.equal(projection.site.sections.cv.heading, 'Curriculum vitae');
  assert.equal(projection.site.sections.cv.paragraphs.length, 1);
  assert.deepEqual(
    projection.site.sections.experience.softwareDevelopment.roles.map(({ organization }) => organization),
    ['Manas Technology Solutions', 'Mobile Streams', 'RVM Soluciones']
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
  assert.deepEqual(
    projection.site.sections.workingTogether.paragraphs,
    [
      'I’m comfortable taking ownership of a well-defined piece of work in an existing product, from investigation and technical approach through implementation, testing and delivery. That can include bugs, features, integrations and data changes.',
      'I’m available for part-time remote contract or freelance work, with collaboration that can be mostly asynchronous.',
      'A good place to start is a free 15–20-minute call to see whether there’s a fit. For focused questions that can be addressed during a live conversation, I also offer paid consultation sessions by appointment. Research, codebase review, problem reproduction, implementation and written deliverables are scoped separately.'
    ]
  );
  const workingTogetherSerialized = JSON.stringify(
    projection.site.sections.workingTogether
  );
  assert.doesNotMatch(workingTogetherSerialized, /\b(?:USD|ARS)\b|\$\s*\d/i);
  assert.doesNotMatch(
    workingTogetherSerialized,
    /\b(?:hourly|per[- ]session)\s+(?:rate|price|fee)s?\b|\b(?:rate|price|fee)s?\s+per\s+(?:hour|session)\b/i
  );
  assert.equal(projection.site.sections.contact.heading, 'Contact');
  assert.deepEqual(
    projection.site.sections.contact.paragraphs,
    [
      'If you’d like to discuss a software role or project, or arrange a consultation, get in touch.'
    ]
  );
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
  const page = await readFile(new URL('../src/components/HomePage.astro', import.meta.url), 'utf8');
  const cvPage = await readFile(new URL('../src/pages/cv/index.astro', import.meta.url), 'utf8');
  const cvLetterPage = await readFile(new URL('../src/pages/cv/letter.astro', import.meta.url), 'utf8');
  const cvDocument = await readFile(new URL('../src/components/CvDocument.astro', import.meta.url), 'utf8');
  const primaryNav = await readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const cvLayout = await readFile(new URL('../src/layouts/CvLayout.astro', import.meta.url), 'utf8');

  assert.equal(
    page.includes("from '../../lib/home-copy'"),
    true
  );
  for (const route of [cvPage, cvLetterPage]) {
    assert.ok(route.includes("import { cvCopy } from '../../../lib/cv-copy'"));
    assert.ok(route.includes("const copy = cvCopy('en');"));
  }
  assert.equal(cvDocument.includes('professional-public-projection'), false);
  assert.match(cvDocument, /const \{ shared, cv, ui \} = copy;/);
  assert.equal(page.includes('I’m a software developer and IT teacher based in Buenos Aires.'), false);
  assert.equal(page.includes('RVM Soluciones'), false);
  assert.equal(page.includes('mostly on existing web and mobile products'), false);
  assert.equal(page.includes('part-time remote software work on a contract or freelance basis'), false);
  assert.equal(page.includes('A compact, portable version of the trajectory above.'), false);
  assert.equal(page.includes('class="actions"'), false);
  assert.equal(page.includes('View experience'), false);
  assert.equal(page.includes('View CV'), false);
  assert.equal(page.includes('Download CV'), false);
  assert.equal(page.includes('Contact me'), false);
  assert.match(primaryNav, /sectionHref\('#cv'\)/);
  assert.equal(primaryNav.includes('isCvPage'), false);
  assert.equal(primaryNav.includes('View online'), false);
  assert.equal(primaryNav.includes('Download PDF'), false);
  assert.equal(primaryNav.includes('CV_PDF'), false);
  assert.equal(primaryNav.includes('>View CV</a>'), false);
  assert.equal(primaryNav.includes('>Download CV</a>'), false);
  assert.match(primaryNav, /sectionHref\('#contact'\)/);
  assert.match(primaryNav, /href=\{contactHref\}>\{sections.contact.heading\}</);
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
  assert.match(cvLayout, /class="cv-document"/);
  assert.match(cvLayout, /data-cv-format=\{format\}/);
  assert.match(cvLayout, /canonicalPath=\{copy\.path\}/);
  assert.match(cvLayout, /import BaseLayout from '\.\/BaseLayout\.astro'/);
  assert.match(cvLayout, /shell="document"/);
  assert.equal(cvLayout.includes('<header class="site-header"'), false);
  assert.equal(cvLayout.includes('class="site-footer"'), false);
  assert.equal(cvLayout.includes('CvChrome'), false);
  assert.match(cvDocument, /<CvActions copy=\{copy\} \/>/);
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
