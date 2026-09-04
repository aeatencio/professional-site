import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cvDocumentUrl = new URL('../src/components/CvDocument.astro', import.meta.url);
const cvA4PageUrl = new URL('../src/pages/cv/index.astro', import.meta.url);
const cvLetterPageUrl = new URL('../src/pages/cv/letter.astro', import.meta.url);
const cvLayoutUrl = new URL('../src/layouts/CvLayout.astro', import.meta.url);
const cvCssUrl = new URL('../src/styles/cv.css', import.meta.url);

test('CV presentation derives visible profile URLs and keeps canonical hrefs', async () => {
  const cvPage = await readFile(cvDocumentUrl, 'utf8');

  assert.match(cvPage, /function visibleProfileUrl/);
  assert.match(cvPage, /aria-label=\{link\.label\}/);
  assert.match(cvPage, /href=\{link\.url\}/);
  assert.match(cvPage, /visibleProfileUrl\(link\.url\)/);
  assert.equal(cvPage.includes('{link.label}</a>'), false);
  assert.equal(cvPage.includes('github.com/aeatencio'), false);
  assert.equal(cvPage.includes('linkedin.com/in/aeatencio'), false);
  assert.match(cvPage, /Astro\.site/);
  assert.match(cvPage, /aria-label="Website"/);
  assert.equal(cvPage.includes('professional-site.aeatencio.workers.dev'), false);
  assert.equal(cvPage.includes('andresatencio.com'), false);
});

test('CV markup keeps the V2 source order without CSS order', async () => {
  const cvPage = await readFile(cvDocumentUrl, 'utf8');
  const cvCss = await readFile(cvCssUrl, 'utf8');

  const positions = [
    'cv-masthead',
    'cv-contact',
    'cv-profile',
    'cv-technical',
    'cv-primary',
    'cv-secondary',
    'cv-current-development'
  ].map((className) => {
    const index = cvPage.indexOf(`class="${className}"`);
    assert.ok(index >= 0, `Missing class ${className}`);
    return index;
  });

  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index] > positions[index - 1], 'CV sections are out of source order');
  }

  assert.ok(
    cvPage.indexOf('cv-technical') < cvPage.indexOf('cv-primary'),
    'Technical Experience must precede Software Experience in the DOM'
  );
  assert.ok(
    cvPage.indexOf('cv-current-development') > cvPage.indexOf('cv-secondary'),
    'Current Development belongs in the secondary column'
  );
  assert.equal(cvPage.includes('<aside'), false);
  assert.equal(cvPage.includes('<strong'), false);
  assert.match(cvPage, /class="cv-context-label"/);
  assert.match(cvPage, /class="cv-highlights"/);

  assert.equal(/\border\s*:/.test(cvCss), false);
  assert.equal(/transform:\s*scale\(/.test(cvCss), false);
  assert.equal(/zoom\s*:/.test(cvCss), false);
  assert.match(cvCss, /hyphens:\s*none/);
  assert.match(cvCss, /print-color-adjust:\s*exact/);
  assert.match(cvCss, /--cv-font-display:\s*Georgia/);
  assert.match(cvCss, /--cv-font-sans:\s*"Segoe UI"/);
  assert.match(cvCss, /--cv-ink:\s*#1e1b19/i);
  assert.match(cvCss, /--cv-cobalt:\s*#173f8a/i);
  assert.match(cvCss, /--cv-link:\s*#1e4e9d/i);
  assert.match(cvCss, /--cv-hairline:\s*#c9d0dc/i);
  assert.match(cvCss, /li::marker/);
  assert.match(cvCss, /\.cv-page::before/);
  assert.match(cvCss, /--cv-rule-hairline:\s*0\.55pt/);
  assert.match(cvCss, /--cv-masthead-gap:/);
  assert.match(cvCss, /\.cv-header \{[\s\S]*?flex:\s*0 0 auto/);
  assert.equal(/--cv-header-h/.test(cvCss), false);
  assert.equal(/--cv-intro-offset/.test(cvCss), false);
  assert.equal(cvCss.includes('.cv-header::after'), false);
  assert.equal(/--cv-rule-header/.test(cvCss), false);
  assert.match(cvCss, /\.cv-role-title \{[\s\S]*?font-size:\s*9pt/);
  assert.match(cvCss, /\.cv-role-title \{[\s\S]*?font-weight:\s*600/);
  assert.match(cvCss, /\.cv-highlights li \{[\s\S]*?font-size:\s*9\.45pt/);
  assert.equal(/border-bottom:\s*1(\.15)?pt/.test(cvCss), false);
  assert.equal(/border-top:\s*0\.55pt/.test(cvCss), false);
});

test('A4 and US Letter share one document and declare paper-specific frames', async () => {
  const [cvDocument, a4Page, letterPage, layout, cvCss] = await Promise.all([
    readFile(cvDocumentUrl, 'utf8'),
    readFile(cvA4PageUrl, 'utf8'),
    readFile(cvLetterPageUrl, 'utf8'),
    readFile(cvLayoutUrl, 'utf8'),
    readFile(cvCssUrl, 'utf8')
  ]);

  assert.match(a4Page, /format="a4"/);
  assert.match(letterPage, /format="letter"/);
  assert.match(a4Page, /<CvDocument/);
  assert.match(letterPage, /<CvDocument/);
  assert.match(layout, /data-cv-format=\{format\}/);
  assert.match(layout, /210mm 297mm/);
  assert.match(layout, /215.9mm 279.4mm/);
  assert.match(cvCss, /--cv-primary-col:\s*113mm/);
  assert.match(cvCss, /--cv-secondary-col:\s*59mm/);
  assert.match(cvCss, /--cv-gutter:\s*8mm/);
  assert.match(cvCss, /--cv-primary-col:\s*117\.6mm/);
  assert.match(cvCss, /--cv-secondary-col:\s*61mm/);
  assert.match(cvCss, /--cv-gutter:\s*8\.3mm/);
  assert.match(cvCss, /\[data-cv-format="letter"\]/);
  assert.equal(cvDocument.includes('format='), false);
});

test('CV chrome is outside the document and hidden in print', async () => {
  const [cvDocument, layout, chrome, cvCss, nav] = await Promise.all([
    readFile(cvDocumentUrl, 'utf8'),
    readFile(cvLayoutUrl, 'utf8'),
    readFile(new URL('../src/components/CvChrome.astro', import.meta.url), 'utf8'),
    readFile(cvCssUrl, 'utf8'),
    readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8')
  ]);

  assert.match(layout, /<CvChrome format=\{format\} \/>/);
  assert.match(layout, /href="#cv-main"/);
  assert.equal(cvDocument.includes('cv-chrome'), false);
  assert.match(cvDocument, /id="cv-main"/);
  assert.match(chrome, /href="\/"/);
  assert.match(chrome, /Back to site/);
  assert.match(chrome, /CV_PDF\.a4\.route/);
  assert.match(chrome, /CV_PDF\.letter\.route/);
  assert.match(chrome, /download=\{pdf\.download\}/);
  assert.match(chrome, /type="application\/pdf"/);
  assert.match(chrome, /<details class="cv-chrome__download">/);
  assert.match(chrome, /<summary>Download PDF<\/summary>/);
  assert.match(chrome, /href=\{CV_PDF\.a4\.href\}/);
  assert.match(chrome, /href=\{CV_PDF\.letter\.href\}/);
  assert.match(chrome, /download=\{CV_PDF\.a4\.download\}/);
  assert.match(chrome, /download=\{CV_PDF\.letter\.download\}/);
  assert.match(chrome, /aria-label="Download A4 PDF"/);
  assert.match(chrome, /aria-label="Download US Letter PDF"/);
  assert.match(chrome, />A4</);
  assert.match(chrome, />US Letter</);
  assert.equal(chrome.includes('>A4 PDF<'), false);
  assert.equal(chrome.includes('>US Letter PDF<'), false);
  assert.match(chrome, /<script>/);
  assert.match(chrome, /event\.key !== 'Escape'/);
  assert.match(chrome, /download\.contains\(event\.target\)/);
  assert.match(chrome, /summary\.focus\(\)/);
  assert.equal(chrome.includes('window.print'), false);
  assert.equal(chrome.includes('andresatencio.com'), false);
  assert.match(nav, /href="\/cv\/">View online</);
  assert.match(nav, /CV_PDF\.a4\.href/);
  assert.equal(layout.includes('PrimaryNav'), false);
  assert.match(
    cvCss,
    /@media print \{[\s\S]*?\.cv-chrome[\s\S]*?display:\s*none/
  );
  assert.match(
    cvCss,
    /@media screen \{\s*\.cv-chrome \{[\s\S]*?\bz-index:\s*2;/
  );
  assert.match(cvCss, /\.cv-document > \.skip-link \{\s*z-index:\s*3;/);
  assert.match(
    cvCss,
    /\.cv-header,\s*\.cv-body \{\s*position:\s*relative;\s*z-index:\s*1;/
  );
  assert.match(cvCss, /\.cv-chrome__download \{\s*display:\s*none;/);
  assert.match(
    cvCss,
    /@media screen and \(max-width: 50rem\) \{[\s\S]*?\.cv-chrome__actions \{\s*display:\s*none;[\s\S]*?\.cv-chrome__download \{\s*display:\s*block;/
  );
  assert.match(cvCss, /\.cv-chrome__download > summary \{[\s\S]*?min-height:\s*2\.75rem/);
  assert.match(cvCss, /\.cv-chrome__download-options a \{[\s\S]*?min-height:\s*2\.75rem/);
});

test('CV print stylesheet targets exact paper boxes without global scaling', async () => {
  const cvCss = await readFile(cvCssUrl, 'utf8');

  assert.match(cvCss, /width:\s*var\(--cv-page-w\)/);
  assert.match(cvCss, /min-height:\s*var\(--cv-page-h\)/);
  assert.match(cvCss, /--cv-page-w:\s*210mm/);
  assert.match(cvCss, /--cv-page-h:\s*297mm/);
  assert.match(cvCss, /--cv-page-w:\s*215\.9mm/);
  assert.match(cvCss, /--cv-page-h:\s*279\.4mm/);
  assert.equal(/page-break-before:\s*always/.test(cvCss), false);
  assert.equal(/transform:\s*scale\(/.test(cvCss), false);
});

test('column-rhythm absolute placement is gated on CSS Anchor Positioning', async () => {
  const cvCss = await readFile(cvCssUrl, 'utf8');
  const defaultSecondary = cvCss.match(/^\.cv-secondary \{[\s\S]*?^\}\r?\n/m);

  assert.ok(defaultSecondary, 'Missing default .cv-secondary rule');
  assert.equal(
    /position\s*:/.test(defaultSecondary[0]),
    false,
    '.cv-secondary must remain in normal flow without Anchor Positioning support'
  );
  assert.match(
    cvCss,
    /@supports \(anchor-name: --cv-technical\) and \(position-anchor: --cv-technical\) and \(top: anchor\(bottom\)\) and \(left: anchor\(left\)\) and \(width: anchor-size\(width\)\)/
  );
  assert.match(
    cvCss,
    /@supports \([\s\S]*?width: anchor-size\(width\)\) \{[\s\S]*?\.cv-secondary \{[\s\S]*?position:\s*absolute;[\s\S]*?position-anchor:\s*--cv-technical;[\s\S]*?top:\s*calc\(anchor\(bottom\) \+ var\(--cv-intro-gap\)\);[\s\S]*?left:\s*anchor\(left\);[\s\S]*?width:\s*anchor-size\(width\);/
  );
});
