import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import astroConfig from '../astro.config.mjs';
import {
  CV_PDF,
  CV_PDFS,
  CV_PDF_ENVIRONMENT,
  PUBLIC_SITE_ORIGIN,
  assertCanonicalCvPdf,
  inspectPdf,
  printToPdfParams,
  repoPath,
  verifyCvPdfs
} from '../lib/cv-pdf.mjs';

test('CV routes and downloads keep distinct destinations per language and paper', () => {
  assert.deepEqual(
    CV_PDFS.map(({ language, format, route, href, download }) => [language, format, route, href, download]),
    [
      ['en', 'a4', '/cv/', '/cv/andres-atencio-cv-a4.pdf', 'Andres-Atencio-CV-A4.pdf'],
      ['en', 'letter', '/cv/letter/', '/cv/andres-atencio-cv-letter.pdf', 'Andres-Atencio-CV-US-Letter.pdf'],
      ['es', 'a4', '/es/cv/', '/es/cv/andres-atencio-cv-es-a4.pdf', 'Andres-Atencio-CV-ES-A4.pdf'],
      ['es', 'letter', '/es/cv/letter/', '/es/cv/andres-atencio-cv-es-carta.pdf', 'Andres-Atencio-CV-ES-Carta.pdf']
    ]
  );
  for (const pdf of CV_PDFS) {
    assert.equal(CV_PDF[pdf.language][pdf.format], pdf);
    assert.notEqual(pdf.href, pdf.route);
    assert.equal(pdf.publicPath, `public${pdf.href}`);
    assert.equal(pdf.distPath, `dist${pdf.href}`);
  }
  assert.equal(new Set(CV_PDFS.map((pdf) => pdf.download)).size, CV_PDFS.length);
});

test('canonical public site origin is andresatencio.com', () => {
  assert.equal(PUBLIC_SITE_ORIGIN, 'https://andresatencio.com');
  assert.equal(new URL(astroConfig.site).origin, PUBLIC_SITE_ORIGIN);
});

test('printToPDF options differ by paper size and keep zero margins', () => {
  const a4 = printToPdfParams(CV_PDF.en.a4);
  const letter = printToPdfParams(CV_PDF.en.letter);

  assert.equal(a4.preferCSSPageSize, true);
  assert.equal(a4.printBackground, true);
  assert.equal(a4.displayHeaderFooter, false);
  assert.equal(a4.marginTop, 0);
  assert.equal(a4.paperWidth, CV_PDF.en.a4.paper.widthIn);
  assert.equal(a4.paperHeight, CV_PDF.en.a4.paper.heightIn);
  assert.equal(letter.paperWidth, CV_PDF.en.letter.paper.widthIn);
  assert.equal(letter.paperHeight, CV_PDF.en.letter.paper.heightIn);
  assert.notEqual(a4.paperWidth, letter.paperWidth);
  assert.notEqual(a4.paperHeight, letter.paperHeight);
  assert.deepEqual(printToPdfParams(CV_PDF.es.a4), a4);
  assert.deepEqual(printToPdfParams(CV_PDF.es.letter), letter);
});

test('PDF generator validates the live CV before printing', async () => {
  const [generator, pkg] = await Promise.all([
    readFile(new URL('../scripts/generate-cv-pdfs.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8')
  ]);

  assert.match(pkg, /"cv:pdf": "npm run projection:validate && node scripts\/generate-cv-pdfs\.mjs"/);
  assert.match(generator, /assertExpectedDocument/);
  assert.match(generator, /assertLoadedCv/);
  assert.match(generator, /assertPrintChromeHidden/);
  assert.match(generator, /Emulation\.setEmulatedMedia/);
  assert.match(generator, /printToPdfParams\(pdf\)/);
  assert.match(generator, /response\.status !== 200/);
  assert.match(generator, /text\/html/);
  assert.match(generator, /id="cv-main"/);
  assert.match(generator, /data-cv-format/);
  assert.match(generator, /PUBLIC_SITE_ORIGIN/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.cv-actions'\)\)/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.site-header'\)\)/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.site-footer'\)\)/);
  assert.match(generator, /for \(const pdf of CV_PDFS\)/);
  assert.match(generator, /info\.lang !== pdf\.language/);
  assert.match(generator, /assertCanonicalCvPdf\(inspection, pdf\.publicPath\)/);
  // The versioned PDFs are replaced only after every one printed canonically.
  assert.ok(generator.indexOf('assertCanonicalCvPdf(') < generator.indexOf('copyFile(tmpFile'));
  assert.equal(generator.includes('toString(\'latin1\')'), false);
});

test('committed CV PDFs match the recorded files and stay one page', async () => {
  await verifyCvPdfs();
});

test('CV PDFs include the public site URL and not workers.dev', async () => {
  const siteHost = new URL(PUBLIC_SITE_ORIGIN).host;

  for (const pdf of CV_PDFS) {
    const buffer = await readFile(repoPath(pdf.publicPath));
    const inspection = inspectPdf(buffer);
    const latin1 = buffer.toString('latin1');
    assert.equal(inspection.pageCount, 1, `${pdf.publicPath} must stay one page`);
    assert.ok(latin1.includes(siteHost), `${pdf.publicPath} is missing the public site URL`);
    assert.ok(
      latin1.includes(PUBLIC_SITE_ORIGIN),
      `${pdf.publicPath} is missing the canonical site href`
    );
    assert.equal(latin1.includes('workers.dev'), false, `${pdf.publicPath} still contains workers.dev`);
  }
});

test('committed PDFs come from the canonical environment and its font set', async () => {
  assert.deepEqual(CV_PDF_ENVIRONMENT.fonts, ['Georgia', 'SegoeUI', 'SegoeUI-Bold']);
  for (const pdf of CV_PDFS) {
    const inspection = inspectPdf(await readFile(repoPath(pdf.publicPath)));
    assert.ok(inspection.creator.includes(CV_PDF_ENVIRONMENT.platform), pdf.publicPath);
    assert.deepEqual(inspection.fonts, CV_PDF_ENVIRONMENT.fonts, pdf.publicPath);
  }

  const windows = {
    creator: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeadlessChrome/153.0.0.0',
    fonts: ['Georgia', 'SegoeUI', 'SegoeUI-Bold', 'SegoeUI-Semibold']
  };
  assert.throws(() => assertCanonicalCvPdf(windows, 'windows.pdf'), /canonical Linux PDF environment/);
  const semibold = { creator: `Mozilla/5.0 (${CV_PDF_ENVIRONMENT.platform}) HeadlessChrome/153.0.0.0`, fonts: windows.fonts };
  assert.throws(() => assertCanonicalCvPdf(semibold, 'semibold.pdf'), /SegoeUI-Semibold/);
});
