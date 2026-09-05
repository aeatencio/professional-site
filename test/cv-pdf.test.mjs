import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import astroConfig from '../astro.config.mjs';
import {
  CV_PDF,
  PUBLIC_SITE_ORIGIN,
  inspectPdf,
  printToPdfParams,
  repoPath,
  verifyCvPdfs
} from '../lib/cv-pdf.mjs';

test('Home download uses the A4 PDF and keeps View CV on a separate URL', () => {
  assert.equal(CV_PDF.a4.href, '/cv/andres-atencio-cv-a4.pdf');
  assert.equal(CV_PDF.letter.href, '/cv/andres-atencio-cv-letter.pdf');
  assert.notEqual(CV_PDF.a4.href, CV_PDF.a4.route);
  assert.notEqual(CV_PDF.letter.href, CV_PDF.letter.route);
  assert.equal(CV_PDF.a4.route, '/cv/');
  assert.equal(CV_PDF.letter.route, '/cv/letter/');
});

test('canonical public site origin is andresatencio.com', () => {
  assert.equal(PUBLIC_SITE_ORIGIN, 'https://andresatencio.com');
  assert.equal(new URL(astroConfig.site).origin, PUBLIC_SITE_ORIGIN);
});

test('printToPDF options differ by paper size and keep zero margins', () => {
  const a4 = printToPdfParams(CV_PDF.a4);
  const letter = printToPdfParams(CV_PDF.letter);

  assert.equal(a4.preferCSSPageSize, true);
  assert.equal(a4.printBackground, true);
  assert.equal(a4.displayHeaderFooter, false);
  assert.equal(a4.marginTop, 0);
  assert.equal(a4.paperWidth, CV_PDF.a4.paper.widthIn);
  assert.equal(a4.paperHeight, CV_PDF.a4.paper.heightIn);
  assert.equal(letter.paperWidth, CV_PDF.letter.paper.widthIn);
  assert.equal(letter.paperHeight, CV_PDF.letter.paper.heightIn);
  assert.notEqual(a4.paperWidth, letter.paperWidth);
  assert.notEqual(a4.paperHeight, letter.paperHeight);
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
  assert.match(generator, /printToPdfParams\(pdf\)/);
  assert.match(generator, /response\.status !== 200/);
  assert.match(generator, /text\/html/);
  assert.match(generator, /id="cv-main"/);
  assert.match(generator, /data-cv-format/);
  assert.match(generator, /PUBLIC_SITE_ORIGIN/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.cv-chrome'\)\)/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.site-header'\)\)/);
  assert.match(generator, /getComputedStyle\(document\.querySelector\('\.site-footer'\)\)/);
  assert.equal(generator.includes('toString(\'latin1\')'), false);
});

test('committed CV PDFs match the recorded files and stay one page', async () => {
  await verifyCvPdfs();
});

test('CV PDFs include the public site URL and not workers.dev', async () => {
  const siteHost = new URL(PUBLIC_SITE_ORIGIN).host;

  for (const pdf of Object.values(CV_PDF)) {
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
