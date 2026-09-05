import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CV_PDF, PUBLIC_SITE_ORIGIN, verifyCvPdfs } from '../lib/cv-pdf.mjs';
import { printableCvFingerprint, stylesheetHrefsFromHtml } from '../lib/printable-cv.mjs';

const projection = JSON.parse(await readFile(
  new URL('../data/professional-public-projection.v1.json', import.meta.url),
  'utf8'
));
const [siteHtml, cvHtml, cvLetterHtml] = await Promise.all([
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/cv/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/cv/letter/index.html', import.meta.url), 'utf8')
]);
const [siteCss, cvCss, cvLetterCss] = await Promise.all([
  readEffectiveCss(siteHtml),
  readEffectiveCss(cvHtml),
  readEffectiveCss(cvLetterHtml)
]);

function collectStrings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

const expectedSite = [
  projection.shared.name,
  projection.shared.professionalIdentity,
  projection.shared.location,
  projection.shared.email,
  ...collectStrings(projection.shared.links),
  ...collectStrings(projection.site)
];

for (const text of expectedSite) {
  assert.ok(siteHtml.includes(text), `Built site is missing projection content: ${text}`);
}

const expectedCv = [
  projection.shared.name,
  projection.cv.title,
  projection.shared.location,
  projection.shared.email,
  ...collectStrings(projection.shared.links),
  ...collectStrings(projection.cv)
];

for (const text of expectedCv) {
  assert.ok(cvHtml.includes(text), `Built CV is missing projection content: ${text}`);
  assert.ok(cvLetterHtml.includes(text), `Built US Letter CV is missing projection content: ${text}`);
}

assert.equal(siteHtml.includes('Magic Calendar'), false, 'CV selected-work leaked into Home');
assert.equal(
  cvHtml.includes(projection.site.sections.home.paragraphs[0]),
  false,
  'Home copy leaked into the CV'
);
assert.ok(cvHtml.includes(`mailto:${projection.shared.email}`), 'Built CV email is not linked');
assert.ok(cvLetterHtml.includes(`mailto:${projection.shared.email}`), 'Built US Letter CV email is not linked');
assert.match(cvHtml, /data-cv-format="a4"/);
assert.match(cvLetterHtml, /data-cv-format="letter"/);

const siteUrl = PUBLIC_SITE_ORIGIN;
const visibleSiteUrl = new URL(PUBLIC_SITE_ORIGIN).host;
assert.ok(cvHtml.includes(`href="${siteUrl}"`), 'Built A4 CV is missing the public site URL');
assert.ok(cvLetterHtml.includes(`href="${siteUrl}"`), 'Built US Letter CV is missing the public site URL');
assert.ok(cvHtml.includes(visibleSiteUrl), 'Built A4 CV is missing the visible site URL');
assert.ok(cvLetterHtml.includes(visibleSiteUrl), 'Built US Letter CV is missing the visible site URL');
assert.equal(cvHtml.includes('workers.dev'), false, 'A4 CV presents workers.dev as public identity');
assert.equal(cvLetterHtml.includes('workers.dev'), false, 'US Letter CV presents workers.dev as public identity');
assert.equal(siteHtml.includes('https://andresatencio.com/cv'), false, 'Home uses an absolute public CV URL');
assert.equal(siteHtml.includes(`href="${siteUrl}"`), false, 'Home contact should not duplicate the site URL');

assert.match(siteHtml, /href="\/cv\/">CV</);
assert.equal(siteHtml.includes('>View online<'), false);
assert.equal(siteHtml.includes('>Download PDF<'), false);
assert.equal(siteHtml.includes(CV_PDF.a4.href), false);
assert.equal(siteHtml.includes('>View CV</a>'), false);
assert.equal(siteHtml.includes('>Download CV</a>'), false);
assert.equal(siteHtml.includes('Download A4 CV'), false);
assert.equal(siteHtml.includes('class="actions"'), false, 'Hero still contains duplicated navigation');
assert.match(siteCss, /primary-nav__mobile-panel/);
assert.match(cvCss, /primary-nav__mobile-panel/);
assert.match(cvLetterCss, /primary-nav__mobile-panel/);
assert.equal(siteHtml.includes('window.print'), false);
assert.equal(cvHtml.includes('window.print'), false);
assert.equal(cvLetterHtml.includes('window.print'), false);

assert.match(cvHtml, /class="site-header"/);
assert.match(cvLetterHtml, /class="site-header"/);
assert.match(cvHtml, /class="primary-nav"/);
assert.match(cvLetterHtml, /class="primary-nav"/);
assert.match(cvHtml, /<footer class="site-footer">/);
assert.match(cvLetterHtml, /<footer class="site-footer">/);
assert.match(cvHtml, /aria-current="page">CV</);
assert.match(cvLetterHtml, /aria-current="page">CV</);
assert.equal(cvHtml.includes('>View online<'), false);
assert.equal(cvLetterHtml.includes('>View online<'), false);
assert.equal(cvHtml.includes('class="cv-chrome"'), false);
assert.equal(cvLetterHtml.includes('class="cv-chrome"'), false);
assert.equal(cvHtml.includes('Back to site'), false);
assert.equal(cvLetterHtml.includes('Back to site'), false);
assert.equal(cvHtml.includes('href="/cv/letter/"'), false);
assert.match(cvLetterHtml, /rel="canonical" href="https:\/\/andresatencio\.com\/cv\/"/);
assert.equal(cvHtml.includes('rel="canonical"'), false);
assert.match(cvHtml, /class="cv-actions"/);
assert.match(cvLetterHtml, /class="cv-actions"/);
assert.match(cvHtml, />A4 PDF</);
assert.match(cvHtml, />US Letter PDF</);
assert.match(cvLetterHtml, />A4 PDF</);
assert.match(cvLetterHtml, />US Letter PDF</);
assert.match(cvHtml, new RegExp(`href="${CV_PDF.a4.href}"[^>]*download="${CV_PDF.a4.download}"`));
assert.match(cvHtml, new RegExp(`href="${CV_PDF.letter.href}"[^>]*download="${CV_PDF.letter.download}"`));
assert.match(
  cvLetterHtml,
  new RegExp(`href="${CV_PDF.a4.href}"[^>]*download="${CV_PDF.a4.download}"`)
);
assert.match(
  cvLetterHtml,
  new RegExp(`href="${CV_PDF.letter.href}"[^>]*download="${CV_PDF.letter.download}"`)
);

await verifyCvPdfs({ dist: true });

const fingerprint = JSON.parse(await readFile(
  new URL('../scripts/cv-pdf-fingerprint.json', import.meta.url),
  'utf8'
));
assert.equal(
  await printableCvFingerprint(),
  fingerprint.printableSha256,
  'Built printable CV no longer matches the recorded PDF fingerprint'
);

console.log('Verified built Home and CV contain only their projected content');

async function readEffectiveCss(html) {
  const stylesheets = await Promise.all(
    stylesheetHrefsFromHtml(html).map((href) =>
      readFile(new URL(`../dist${href}`, import.meta.url), 'utf8')
    )
  );
  const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1]);
  return [...stylesheets, ...inlineStyles].join('\n');
}
