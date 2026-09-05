import assert from 'node:assert/strict';
import test from 'node:test';
import astroConfig from '../astro.config.mjs';
import {
  PUBLIC_SITE_ORIGIN,
  printToPdfParams,
  CV_PDF
} from '../lib/cv-pdf.mjs';
import {
  digestCvPrintInputs,
  localAssetPathsFromHtml,
  localUrlsFromCss,
  resolveLocalAssetPath,
  stylesheetHrefsFromHtml
} from '../lib/printable-cv.mjs';

function sampleInputs({
  css = '.cv-page { width: 210mm; }',
  htmlExtra = '',
  letterCss = css,
  site = PUBLIC_SITE_ORIGIN
} = {}) {
  const a4Html = `<!doctype html><html><head><style>@page { size: 210mm 297mm; }</style><link rel="stylesheet" href="/_astro/cv.css"></head><body data-cv-format="a4"><main id="cv-main" class="cv-page">A4</main>${htmlExtra}</body></html>`;
  const letterHtml = `<!doctype html><html><head><style>@page { size: 215.9mm 279.4mm; }</style><link rel="stylesheet" href="/_astro/cv.css"></head><body data-cv-format="letter"><main id="cv-main" class="cv-page">Letter</main>${htmlExtra}</body></html>`;

  return {
    site,
    astroSite: astroConfig.site,
    documents: [
      {
        format: 'a4',
        route: CV_PDF.a4.route,
        paper: CV_PDF.a4.paper,
        printToPDF: printToPdfParams(CV_PDF.a4),
        html: a4Html,
        stylesheets: [{ href: '/_astro/cv.css', css }],
        assets: []
      },
      {
        format: 'letter',
        route: CV_PDF.letter.route,
        paper: CV_PDF.letter.paper,
        printToPDF: printToPdfParams(CV_PDF.letter),
        html: letterHtml,
        stylesheets: [{ href: '/_astro/cv.css', css: letterCss }],
        assets: []
      }
    ]
  };
}

test('print input digest covers both paper sizes, site origin and print settings', () => {
  const digest = digestCvPrintInputs(sampleInputs());
  assert.equal(digest.length, 64);

  const withoutLetter = sampleInputs();
  withoutLetter.documents = withoutLetter.documents.slice(0, 1);
  assert.notEqual(digestCvPrintInputs(withoutLetter), digest);

  const otherSite = sampleInputs({ site: 'https://example.invalid' });
  assert.notEqual(digestCvPrintInputs(otherSite), digest);

  const otherPrint = sampleInputs();
  otherPrint.documents[0].printToPDF = {
    ...otherPrint.documents[0].printToPDF,
    printBackground: false
  };
  assert.notEqual(digestCvPrintInputs(otherPrint), digest);
});

test('print input digest treats full HTML and unfiltered CSS as inputs', () => {
  const baseline = digestCvPrintInputs(sampleInputs());

  const chromeChange = sampleInputs({
    htmlExtra: '<p class="cv-actions">A4 PDF</p>'
  });
  assert.notEqual(digestCvPrintInputs(chromeChange), baseline);

  const screenCssChange = sampleInputs({
    css: '.cv-page { width: 210mm; } @media screen { .hero-art { width: 10rem; } }'
  });
  assert.notEqual(digestCvPrintInputs(screenCssChange), baseline);

  const pageRuleChange = sampleInputs({
    css: '.cv-page { width: 210mm; } @page { margin: 4mm; }'
  });
  assert.notEqual(digestCvPrintInputs(pageRuleChange), baseline);
});

test('HTML and CSS collectors keep local assets and drop non-assets', () => {
  const html = `
    <link rel="stylesheet" href="/_astro/cv.css">
    <a href="/">Home</a>
    <a href="/cv/letter/">US Letter</a>
    <a href="/cv/andres-atencio-cv-a4.pdf">Download</a>
    <img src="/images/hero/developer-at-laptop.png" alt="">
  `;

  assert.deepEqual(stylesheetHrefsFromHtml(html), ['/_astro/cv.css']);
  assert.deepEqual(localAssetPathsFromHtml(html), ['/images/hero/developer-at-laptop.png']);
  assert.deepEqual(
    localUrlsFromCss('.x { background: url("/fonts/site.woff2"); } .y { background: url(../images/mark.svg); } .z { background: url(https://example.com/x.png); }'),
    ['/fonts/site.woff2', '../images/mark.svg']
  );
  assert.equal(
    resolveLocalAssetPath('/_astro/cv.css', '../images/mark.svg'),
    '/images/mark.svg'
  );
  assert.equal(resolveLocalAssetPath('/_astro/cv.css', '/cv/andres-atencio-cv-a4.pdf'), null);
});
