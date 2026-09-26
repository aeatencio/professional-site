import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cvCopy,
  spanishCvRoles,
  spanishCvEducation,
  spanishCvDevelopmentExperience,
  spanishCvLanguages
} from '../lib/cv-copy.ts';
import { homeCopy } from '../lib/home-copy.ts';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { LOCALIZED_PATHS } from '../lib/site-identity.mjs';

test('CV routes render the shared document with an explicit language copy', async () => {
  for (const [path, language, format] of [
    ['cv/index.astro', 'en', 'a4'],
    ['cv/letter.astro', 'en', 'letter'],
    ['es/cv/index.astro', 'es', 'a4'],
    ['es/cv/letter.astro', 'es', 'letter']
  ]) {
    const page = await readFile(new URL(`../src/pages/${path}`, import.meta.url), 'utf8');
    assert.ok(page.includes(`const copy = cvCopy('${language}');`), path);
    assert.ok(page.includes(`<CvLayout copy={copy} format="${format}">`), path);
    assert.ok(page.includes('<CvDocument copy={copy} />'), path);
    assert.doesNotMatch(page, /<main|<section|navigator\.language|redirect/);
  }
  assert.deepEqual(LOCALIZED_PATHS.cv, { en: '/cv/', es: '/es/cv/' });
});

test('English CV uses the unchanged projection and the existing labels', async () => {
  const projection = await loadLocalPublicProjection();
  const english = cvCopy('en');
  assert.equal(english.path, '/cv/');
  assert.deepEqual(english.cv, projection.cv);
  assert.deepEqual(english.shared, homeCopy('en').shared);
  assert.deepEqual(english.ui, {
    skip: 'Skip to content',
    language: 'Language',
    website: 'Website',
    technologies: 'Technologies:',
    pdfA4: 'A4 PDF',
    pdfLetter: 'US Letter PDF'
  });
});

test('Spanish CV translates every visible string without changing facts', () => {
  const english = cvCopy('en');
  const spanish = cvCopy('es');
  assert.equal(spanish.path, '/es/cv/');
  assert.deepEqual(spanish.shared, homeCopy('es').shared);
  assert.equal(spanish.cv.title, 'Desarrollador de software');

  // Names, periods and technologies are reused; `Bachiller` and a year read the
  // same in both languages.
  const unchanged = /\.(roles\.\d+\.(organization|period)|technologies\.\d+|institution|currentPractice\.items\.\d+)$/;
  const identical = new Set(['Bachiller', '2017']);
  function assertTranslated(source, localized, path = 'cv') {
    if (typeof source === 'string') {
      assert.equal(typeof localized, 'string', path);
      assert.ok(localized.trim(), `${path} is empty`);
      if (unchanged.test(path)) {
        assert.equal(localized, source, `${path} must keep the projected value`);
      } else if (!identical.has(source)) {
        assert.notEqual(localized, source, `${path} is still in English`);
      }
    } else if (Array.isArray(source)) {
      assert.equal(localized.length, source.length, path);
      source.forEach((value, index) => assertTranslated(value, localized[index], `${path}.${index}`));
    } else {
      assert.deepEqual(Object.keys(localized), Object.keys(source), path);
      for (const key of Object.keys(source)) assertTranslated(source[key], localized[key], `${path}.${key}`);
    }
  }
  assertTranslated(english.cv, spanish.cv);

  // Periods that are phrases in English are translated; years stay put.
  const periods = spanish.cv.education.items.map((item) => item.period);
  assert.deepEqual(periods, ['2017', 'Veterinaria y Letras', 'En curso', 'Colegio preuniversitario de la Universidad de Buenos Aires']);
  assert.deepEqual(
    spanish.cv.softwareExperience.roles.map((role) => role.period),
    english.cv.softwareExperience.roles.map((role) => role.period)
  );
});

test('Spanish CV lists stay keyed to projected entries', () => {
  const { cv } = cvCopy('en');
  assert.deepEqual(Object.keys(spanishCvRoles).sort(), cv.softwareExperience.roles.map((role) => role.organization).sort());
  assert.deepEqual(Object.keys(spanishCvEducation).sort(), cv.education.items.map((item) => item.institution).sort());
  assert.deepEqual(Object.keys(spanishCvLanguages).sort(), cv.languages.items.map((item) => item.language).sort());
  assert.deepEqual(
    Object.keys(spanishCvDevelopmentExperience).sort(),
    [...cv.technicalBackground.professionalExperience.items].sort()
  );
  for (const role of cv.softwareExperience.roles) {
    assert.equal('highlights' in spanishCvRoles[role.organization], 'highlights' in role, role.organization);
  }
  for (const item of cv.education.items) {
    assert.equal('detail' in spanishCvEducation[item.institution], 'detail' in item, item.institution);
  }
});

test('Spanish CV Current development stays compact and equivalent to the projection', () => {
  const english = cvCopy('en').cv.currentDevelopment;
  const spanish = cvCopy('es').cv.currentDevelopment;
  assert.equal(
    english.text,
    'My current development work spans institutional tools, software for teaching and learning, and personal projects.'
  );
  assert.equal(spanish.heading, 'Desarrollo actual');
  assert.equal(
    spanish.text,
    'Mi trabajo actual de desarrollo abarca herramientas institucionales, software para la enseñanza y el aprendizaje, y proyectos personales.'
  );
  for (const text of [english.text, spanish.text]) {
    assert.doesNotMatch(text, /Aula|bulletin|boletin|professional site|sitio profesional|this site|este sitio|dev-setup|DevOps/i);
    assert.doesNotMatch(text, /\b(?:small|tiny|little|modest)\b|pequeñ/i);
  }
});

test('Spanish CV follows the Spanish Home terminology and offers its own PDFs', () => {
  const spanish = cvCopy('es');
  const serialized = JSON.stringify(spanish.cv);
  for (const phrase of [
    'Profesor de Informática',
    'responsable de la formación profesional en Informática del bachillerato del CFP N.º 7',
    'Tecnicatura Universitaria en Programación de la UNAHUR',
    'Analista en Sistemas de Información',
    '12 de 15 materias aprobadas',
    'Desde fines de 2023'
  ]) {
    assert.ok(serialized.includes(phrase), `Missing ${phrase}`);
  }
  assert.doesNotMatch(serialized, /Docente|Fundación académica|unidades del curso|Software Developer|IT Teacher/);
  assert.equal(spanish.ui.skip, homeCopy('es').ui.skip);
  assert.equal(spanish.ui.language, homeCopy('es').ui.language);
  assert.equal(spanish.ui.technologies, 'Tecnologías:');
  assert.equal(spanish.ui.pdfA4, 'PDF A4');
  assert.equal(spanish.ui.pdfLetter, 'PDF Carta');
  assert.doesNotMatch(JSON.stringify(spanish.ui), /inglés/i);
});
