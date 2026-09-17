import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CV_PDF, PUBLIC_SITE_ORIGIN, verifyCvPdfs } from '../lib/cv-pdf.mjs';
import { SOCIAL_CARD, socialCardAlt, verifySocialCard } from '../lib/social-card.mjs';
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
assert.match(siteHtml, /<section id="cv" class="chapter chapter--cv" aria-labelledby="cv-heading">/);
assert.match(siteHtml, new RegExp(`<h2 id="cv-heading">${projection.site.sections.cv.heading}<\\/h2>`));
assert.match(siteHtml, /<a class="cv-band__read" href="\/cv\/">[^<]+<\/a>/);
assert.equal(/<section id="cv"[\s\S]*?<\/(?:section)>/.exec(siteHtml)?.[0]?.includes('<img'), false);
assert.equal(siteHtml.includes('cv-a4-preview.png'), false, 'Home still references the retired CV preview');
assert.match(
  siteHtml,
  new RegExp(`href="${CV_PDF.a4.href}"[^>]*download="${CV_PDF.a4.download}"[^>]*aria-label="[^"]+"[^>]*>A4<`)
);
assert.match(
  siteHtml,
  new RegExp(`href="${CV_PDF.letter.href}"[^>]*download="${CV_PDF.letter.download}"[^>]*aria-label="[^"]+"[^>]*>US Letter<`)
);
const homeCvIndex = siteHtml.indexOf('id="cv"');
assert.ok(
  siteHtml.indexOf('id="background"') < homeCvIndex
    && homeCvIndex < siteHtml.indexOf('id="working-together"'),
  'The Home CV section must sit between Background and Working together'
);
assert.match(siteHtml, /<a href="#cv">CV<\/a>/, 'Home navigation must reach the CV section');
assert.equal(
  (siteHtml.match(/href="\/cv\/">CV</g) ?? []).length,
  1,
  'Only the Home footer colophon links straight to /cv/ with the CV label'
);
assert.match(cvHtml, /href="\/cv\/" aria-current="page">CV</);
assert.match(cvLetterHtml, /href="\/cv\/" aria-current="page">CV</);
assert.equal(cvHtml.includes('href="#cv"'), false, 'CV routes must not offer a same-page CV anchor');
assert.equal(cvHtml.includes('cv-a4-preview.png'), false);
assert.equal(cvLetterHtml.includes('cv-a4-preview.png'), false);
assert.equal(siteHtml.includes('>View online<'), false);
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
assert.match(cvHtml, /rel="canonical" href="https:\/\/andresatencio\.com\/cv\/"/);
assert.match(cvLetterHtml, /rel="canonical" href="https:\/\/andresatencio\.com\/cv\/"/);
assert.match(siteHtml, /rel="canonical" href="https:\/\/andresatencio\.com\/"/);
assert.equal(siteHtml.includes('<a href="https://andresatencio.com"'), false, 'Home contact should not duplicate the site URL');
assert.equal(siteHtml.includes('https://andresatencio.com/cv'), false, 'Home uses an absolute public CV URL');
assert.equal(/noindex/i.test(siteHtml), false, 'Home is marked noindex');
assert.equal(/noindex/i.test(cvHtml), false, 'CV is marked noindex');
assert.equal(/noindex/i.test(cvLetterHtml), false, 'US Letter CV is marked noindex');
assert.match(
  siteHtml,
  new RegExp(`property="og:title" content="${projection.site.title}"`)
);
assert.match(siteHtml, /property="og:url" content="https:\/\/andresatencio\.com\/"/);
assert.match(siteHtml, /property="og:type" content="profile"/);

const socialCardUrl = `${PUBLIC_SITE_ORIGIN}${SOCIAL_CARD.href}`;
const socialCardDescription = socialCardAlt(projection.shared);

await verifySocialCard({ dist: true });

const homeSocialTags = [
  `property="og:image" content="${socialCardUrl}"`,
  `property="og:image:type" content="${SOCIAL_CARD.type}"`,
  `property="og:image:width" content="${SOCIAL_CARD.width}"`,
  `property="og:image:height" content="${SOCIAL_CARD.height}"`,
  `property="og:image:alt" content="${socialCardDescription}"`,
  `property="og:site_name" content="${projection.shared.name}"`,
  'name="twitter:card" content="summary_large_image"',
  `name="twitter:image" content="${socialCardUrl}"`,
  `name="twitter:image:alt" content="${socialCardDescription}"`
];

for (const tag of homeSocialTags) {
  const occurrences = siteHtml.split(tag).length - 1;
  assert.equal(occurrences, 1, `Built Home must emit ${tag} exactly once`);
}

assert.equal(
  siteHtml.includes('name="twitter:card" content="summary"'),
  false,
  'Home still declares the small twitter:card'
);
assert.equal(
  siteHtml.includes(`content="${SOCIAL_CARD.href}"`),
  false,
  'Home declares a relative social image URL'
);
assert.ok(
  siteHtml.includes(`content="${socialCardUrl}"`),
  'Home social image URL is not absolute'
);

// The CV routes stay on the small summary card: their built head feeds the
// printable-CV fingerprint, so metadata that never reaches paper would force a
// PDF regeneration. Whatever they declare must at least not contradict itself.
for (const [label, html] of [['CV', cvHtml], ['US Letter CV', cvLetterHtml]]) {
  assert.equal(
    (html.match(/property="og:image"/g) ?? []).length,
    0,
    `Built ${label} declares an og:image without the Home social card block`
  );
  assert.equal(
    html.includes('summary_large_image'),
    false,
    `Built ${label} promises a large image card it does not provide`
  );
  assert.equal(
    (html.match(/name="twitter:card"/g) ?? []).length,
    1,
    `Built ${label} must declare exactly one twitter:card`
  );
}

for (const [label, html] of [['Home', siteHtml], ['CV', cvHtml], ['US Letter CV', cvLetterHtml]]) {
  for (const property of ['og:title', 'og:description', 'og:url', 'og:type']) {
    assert.equal(
      (html.match(new RegExp(`property="${property}"`, 'g')) ?? []).length,
      1,
      `Built ${label} must declare exactly one ${property}`
    );
  }
  assert.equal(
    (html.match(/rel="canonical"/g) ?? []).length,
    1,
    `Built ${label} must declare exactly one canonical`
  );
}
assert.match(cvHtml, /property="og:url" content="https:\/\/andresatencio\.com\/cv\/"/);
assert.match(cvLetterHtml, /property="og:url" content="https:\/\/andresatencio\.com\/cv\/"/);
assert.match(siteHtml, /<h1 class="identity" id="site-identity">/);
assert.match(
  siteHtml,
  new RegExp(`<p id="home-heading" class="home-identity">${projection.shared.professionalIdentity}</p>`)
);
assert.equal(cvHtml.includes('id="site-identity"'), false);
assert.equal(cvLetterHtml.includes('id="site-identity"'), false);
assert.equal(cvHtml.includes('application/ld+json'), false);
assert.equal(cvLetterHtml.includes('application/ld+json'), false);

const jsonLdMatch = siteHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(jsonLdMatch, 'Home is missing JSON-LD');
const jsonLd = JSON.parse(jsonLdMatch[1]);
const jsonLdNodes = jsonLd['@graph'];
assert.ok(Array.isArray(jsonLdNodes), 'Home JSON-LD is missing @graph');
const person = jsonLdNodes.find((node) => node['@type'] === 'Person');
const profilePage = jsonLdNodes.find((node) => node['@type'] === 'ProfilePage');
const website = jsonLdNodes.find((node) => node['@type'] === 'WebSite');
assert.equal(person?.name, projection.shared.name);
assert.equal(person?.jobTitle, projection.shared.professionalIdentity);
assert.equal(person?.url, `${PUBLIC_SITE_ORIGIN}/`);
assert.equal(profilePage?.url, `${PUBLIC_SITE_ORIGIN}/`);
assert.equal(profilePage?.mainEntity?.['@id'], person?.['@id']);
assert.equal(website?.publisher?.['@id'], person?.['@id']);
assert.deepEqual(
  person?.sameAs,
  projection.shared.links.map((link) => link.url)
);

const [robotsTxt, sitemapIndex, sitemapUrlset] = await Promise.all([
  readFile(new URL('../dist/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../dist/sitemap-index.xml', import.meta.url), 'utf8'),
  readFile(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8')
]);
assert.match(robotsTxt, /^User-agent: \*\r?\nAllow: \/\r?\n\r?\nSitemap: https:\/\/andresatencio\.com\/sitemap-index\.xml\r?\n$/);
assert.equal(robotsTxt.includes('Disallow'), false);
assert.match(sitemapIndex, /sitemap-0\.xml/);
assert.match(sitemapUrlset, /<loc>https:\/\/andresatencio\.com\/<\/loc>/);
assert.match(sitemapUrlset, /<loc>https:\/\/andresatencio\.com\/cv\/<\/loc>/);
assert.equal(sitemapUrlset.includes('/cv/letter'), false);
assert.equal(sitemapUrlset.includes('.pdf'), false);
assert.equal((sitemapUrlset.match(/<loc>/g) ?? []).length, 2);

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
