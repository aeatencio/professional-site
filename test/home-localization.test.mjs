import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  homeCopy,
  spanishRoles,
  spanishCurrentItems,
  spanishBackgroundItems
} from '../lib/home-copy.ts';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { homeIdentityGraph, isIndexableSitemapUrl } from '../lib/site-identity.mjs';

test('both Home routes render the shared component with an explicit language', async () => {
  for (const [path, language] of [['index.astro', 'en'], ['es/index.astro', 'es']]) {
    const page = await readFile(new URL(`../src/pages/${path}`, import.meta.url), 'utf8');
    assert.match(page, /import HomePage from/);
    assert.ok(page.includes(`<HomePage language="${language}" />`));
    assert.doesNotMatch(page, /<section|<main|navigator\.language|redirect/);
  }
});

test('English Home uses the complete original projection without copy changes', async () => {
  const projection = await loadLocalPublicProjection();
  assert.deepEqual(homeCopy('en').site, projection.site);
  assert.deepEqual(homeCopy('en').shared, projection.shared);
  assert.equal(homeCopy('en').path, '/');
  assert.deepEqual(homeCopy('en').ui, {
    primary: 'Primary', menu: 'Menu', language: 'Language', skip: 'Skip to content',
    cv: 'CV', readCv: 'Read the CV', downloadPdf: 'Download PDF',
    downloadA4: 'Download the CV as an A4 PDF',
    downloadLetter: 'Download the CV as a US Letter PDF', letter: 'US Letter', footerCv: 'CV'
  });
});

test('Spanish copy covers every section with natural wording and its own CV', () => {
  const english = homeCopy('en');
  const spanish = homeCopy('es');
  assert.equal(spanish.path, '/es/');
  assert.equal(spanish.shared.professionalIdentity, 'Desarrollador de software · Profesor de Informática');
  assert.equal(spanish.site.sections.background.heading, 'Formación');
  assert.deepEqual(spanish.site.sections.background.items.map((item) => item.heading), [
    'Colegio Nacional de Buenos Aires', 'Formación en sistemas', 'Una formación amplia'
  ]);
  assert.match(spanish.site.sections.background.items[2].paragraphs[0], /12 de las 15 materias del plan aprobadas/);
  assert.match(spanish.site.sections.contact.paragraphs[0], /querés.*escribime/);
  // The Spanish web CV and PDFs are Spanish documents: nothing points back to English.
  assert.equal(spanish.ui.readCv, 'Ver el CV');
  assert.equal(spanish.ui.footerCv, 'CV');
  assert.equal(spanish.ui.downloadPdf, 'Descargar PDF');
  assert.equal(spanish.ui.downloadA4, 'Descargar el CV en PDF A4');
  assert.equal(spanish.ui.downloadLetter, 'Descargar el CV en PDF tamaño Carta');
  assert.equal(spanish.site.sections.cv.paragraphs[0], 'Una versión breve de mi trayectoria, para leer en línea o descargar.');
  assert.doesNotMatch(JSON.stringify(spanish.ui), /inglés/i);
  assert.doesNotMatch(JSON.stringify(spanish), /Docente|Fundación académica|En todas las disciplinas|unidades del curso|CV en inglés|PDF en inglés/);

  function assertTranslated(source, localized, path = 'site') {
    if (typeof source === 'string') {
      assert.equal(typeof localized, 'string', path);
      assert.ok(localized.trim(), `${path} is empty`);
      if (!/\.(organization|period)$/.test(path)) {
        assert.notEqual(source, localized, `${path} is still in English`);
      }
    } else if (Array.isArray(source)) {
      assert.equal(source.length, localized.length, path);
      source.forEach((value, index) => assertTranslated(value, localized[index], `${path}.${index}`));
    } else {
      assert.deepEqual(Object.keys(source), Object.keys(localized), path);
      for (const key of Object.keys(source)) assertTranslated(source[key], localized[key], `${path}.${key}`);
    }
  }
  assertTranslated(english.site, spanish.site);
});

test('Spanish lists stay keyed to projected entries and preserve identity, dates and technology names', () => {
  const english = homeCopy('en');
  const spanish = homeCopy('es');
  for (const key of ['name', 'location', 'email', 'links']) {
    assert.deepEqual(spanish.shared[key], english.shared[key]);
  }
  const enRoles = english.site.sections.experience.softwareDevelopment.roles;
  const esRoles = spanish.site.sections.experience.softwareDevelopment.roles;
  assert.deepEqual(Object.keys(spanishRoles).sort(), enRoles.map((role) => role.organization).sort());
  assert.deepEqual(Object.keys(spanishCurrentItems).sort(), english.site.sections.experience.currentDevelopment.items.map((item) => item.heading).sort());
  assert.deepEqual(Object.keys(spanishBackgroundItems).sort(), english.site.sections.background.items.map((item) => item.heading).sort());
  enRoles.forEach((role, index) => {
    assert.equal(esRoles[index].organization, role.organization);
    assert.equal(esRoles[index].period, role.period);
    assert.equal(esRoles[index].description, spanishRoles[role.organization].description);
  });
  const serialized = JSON.stringify(spanish.site);
  for (const name of ['Surveda', 'Elixir/Phoenix', 'JavaScript/TypeScript', 'React', 'Node.js', 'Python', 'Ruby on Rails', 'PostgreSQL', 'Flutter/Dart', 'Android/Java', 'C#', 'ASP.NET', 'Angular', 'SQL Server', 'Visual Basic', 'Astro', 'TypeScript', 'UNAHUR', 'IES Juan B. Justo', 'Universidad del Salvador']) {
    assert.ok(serialized.includes(name), `Missing projected name ${name}`);
  }
});

test('language switch uses named native links to the equivalent page', async () => {
  const [component, nav] = await Promise.all([
    readFile(new URL('../src/components/LanguageSwitch.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8')
  ]);
  assert.match(component, /role="group" aria-label=\{label\}/);
  assert.match(component, /href=\{alternates\.en\} lang="en" hreflang="en" aria-label="English"/);
  assert.match(component, /href=\{alternates\.es\} lang="es" hreflang="es" aria-label="Español"/);
  for (const language of ['en', 'es']) {
    assert.ok(component.includes(`aria-current={language === '${language}' ? 'page' : undefined}`));
  }
  assert.doesNotMatch(component, /<script|onclick|flag|tabindex/);
  assert.equal((nav.match(/alternates=\{LOCALIZED_PATHS\.home\}/g) ?? []).length, 2);
});

test('localized identity graphs share a person and website but describe separate language pages', () => {
  const graphs = ['en', 'es'].map((language) => {
    const copy = homeCopy(language);
    return homeIdentityGraph({ shared: copy.shared, title: copy.site.title, path: copy.path, site: 'https://andresatencio.com' })['@graph'];
  });
  const [enPerson, esPerson] = graphs.map((graph) => graph.find((node) => node['@type'] === 'Person'));
  assert.equal(enPerson['@id'], esPerson['@id']);
  assert.equal(enPerson.url, esPerson.url);
  assert.equal(enPerson.name, esPerson.name);
  assert.deepEqual(enPerson.sameAs, esPerson.sameAs);
  assert.deepEqual(graphs[0][0], graphs[1][0]);
  for (const [index, language] of ['en', 'es'].entries()) {
    const page = graphs[index].find((node) => node['@type'] === 'ProfilePage');
    assert.equal(page.inLanguage, language);
    assert.equal(page.url, `https://andresatencio.com${homeCopy(language).path}`);
    assert.equal(page['@id'], `${page.url}#profilepage`);
    assert.equal(page.mainEntity['@id'], enPerson['@id']);
    assert.equal(isIndexableSitemapUrl(page.url), true);
  }
  assert.equal(isIndexableSitemapUrl('https://andresatencio.com/es/cv/'), true);
  assert.equal(isIndexableSitemapUrl('https://andresatencio.com/cv/letter/'), false);
  assert.equal(isIndexableSitemapUrl('https://andresatencio.com/es/cv/letter/'), false);
});
