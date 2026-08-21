import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cvPageUrl = new URL('../src/pages/cv.astro', import.meta.url);
const cvCssUrl = new URL('../src/styles/cv.css', import.meta.url);

test('CV presentation derives visible profile URLs and keeps canonical hrefs', async () => {
  const cvPage = await readFile(cvPageUrl, 'utf8');

  assert.match(cvPage, /function visibleProfileUrl/);
  assert.match(cvPage, /aria-label=\{link\.label\}/);
  assert.match(cvPage, /href=\{link\.url\}/);
  assert.match(cvPage, /visibleProfileUrl\(link\.url\)/);
  assert.equal(cvPage.includes('{link.label}</a>'), false);
  assert.equal(cvPage.includes('github.com/aeatencio'), false);
  assert.equal(cvPage.includes('linkedin.com/in/aeatencio'), false);
});

test('CV markup keeps the required source order without CSS order', async () => {
  const cvPage = await readFile(cvPageUrl, 'utf8');
  const cvCss = await readFile(cvCssUrl, 'utf8');

  const positions = [
    'cv-masthead',
    'cv-contact',
    'cv-profile',
    'cv-primary',
    'cv-current-development',
    'cv-secondary'
  ].map((className) => {
    const index = cvPage.indexOf(`class="${className}"`);
    assert.ok(index >= 0, `Missing class ${className}`);
    return index;
  });

  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index] > positions[index - 1], 'CV sections are out of source order');
  }

  assert.equal(cvPage.includes('<aside'), false);
  assert.equal(cvPage.includes('<strong'), false);
  assert.match(cvPage, /class="cv-context-label"/);
  assert.match(cvPage, /class="cv-highlights"/);

  assert.equal(/\border\s*:/.test(cvCss), false);
  assert.match(cvCss, /hyphens:\s*none/);
  assert.match(cvCss, /print-color-adjust:\s*exact/);
  assert.match(cvCss, /--cv-font-display:\s*Georgia/);
  assert.match(cvCss, /--cv-font-sans:\s*"Segoe UI"/);
  assert.match(cvCss, /--cv-ink:\s*#1c1916/);
  assert.match(cvCss, /--cv-blue:\s*#163a86/);
  assert.match(cvCss, /--cv-line:\s*#b5bbc9/);
});

test('CV print stylesheet targets a single A4 sheet', async () => {
  const cvCss = await readFile(cvCssUrl, 'utf8');

  assert.match(cvCss, /@page\s*\{[\s\S]*?size:\s*A4;/);
  assert.match(cvCss, /width:\s*210mm/);
  assert.match(cvCss, /min-height:\s*297mm/);
  assert.equal(/page-break-before:\s*always/.test(cvCss), false);
});
