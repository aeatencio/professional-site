import assert from 'node:assert/strict';
import { homeCopy } from '../lib/home-copy.ts';
import { cvCopy } from '../lib/cv-copy.ts';
import { readFile } from 'node:fs/promises';
import { CV_PDF, PUBLIC_SITE_ORIGIN, verifyCvPdfs } from '../lib/cv-pdf.mjs';
import { LOCALIZED_PATHS } from '../lib/site-identity.mjs';
import { SOCIAL_CARD, socialCardAlt, verifySocialCard } from '../lib/social-card.mjs';
import { printableCvFingerprint, stylesheetHrefsFromHtml } from '../lib/printable-cv.mjs';

const projection = JSON.parse(await readFile(
  new URL('../data/professional-public-projection.v1.json', import.meta.url),
  'utf8'
));
const [siteHtml, cvHtml, cvLetterHtml, spanishHtml, spanishCvHtml, spanishCvLetterHtml] = await Promise.all([
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/cv/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/cv/letter/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/es/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/es/cv/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/es/cv/letter/index.html', import.meta.url), 'utf8')
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

for (const [language, html] of [['en', siteHtml], ['es', spanishHtml]]) {
  const copy = homeCopy(language);
  const url = `${PUBLIC_SITE_ORIGIN}${copy.path}`;
  for (const text of [...collectStrings(copy.site), ...collectStrings(copy.shared), ...Object.values(copy.ui)]) {
    assert.ok(html.includes(text), `${language} Home is missing localized content: ${text}`);
  }
  assert.match(html, new RegExp(`<html lang="${language}"`));
  assert.ok(html.includes(`rel="canonical" href="${url}"`));
  for (const [hreflang, path] of [['en', '/'], ['es', '/es/'], ['x-default', '/']]) {
    assert.equal(html.split(`rel="alternate" hreflang="${hreflang}" href="${PUBLIC_SITE_ORIGIN}${path}"`).length - 1, 1);
  }
  for (const property of ['og:title', 'og:description', 'og:url', 'og:type', 'og:locale', 'og:locale:alternate']) {
    assert.equal((html.match(new RegExp(`property="${property}"`, 'g')) ?? []).length, 1);
  }
  for (const [attribute, value] of [
    ['property="og:title"', copy.site.title],
    ['property="og:description"', copy.site.description],
    ['property="og:url"', url],
    ['property="og:locale"', language === 'es' ? 'es_AR' : 'en_US'],
    ['property="og:locale:alternate"', language === 'es' ? 'en_US' : 'es_AR'],
    ['name="description"', copy.site.description],
    ['name="twitter:title"', copy.site.title],
    ['name="twitter:description"', copy.site.description],
    ['property="og:image:alt"', socialCardAlt(copy.shared)],
    ['name="twitter:image:alt"', socialCardAlt(copy.shared)]
  ]) assert.ok(html.includes(`${attribute} content="${value}"`), `Missing ${language} ${attribute}`);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h1 class="identity" id="site-identity">/);
  assert.match(html, /<a href="#home">/);
  assert.doesNotMatch(html, /noindex|navigator\.language/);

  const switches = [...html.matchAll(/<div class="language-switch"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.equal(switches.length, 2, 'Desktop and mobile must both provide language links');
  for (const [, markup] of switches) {
    assert.match(markup, /href="\/" lang="en" hreflang="en" aria-label="English"/);
    assert.match(markup, /href="\/es\/" lang="es" hreflang="es" aria-label="Español"/);
    assert.equal((markup.match(/aria-current="page"/g) ?? []).length, 1);
    assert.match(markup, new RegExp(`hreflang="${language}"[^>]*aria-current="page"`));
  }
  for (const hash of ['experience', 'background', 'cv', 'working-together', 'contact']) {
    assert.equal(html.split(`href="#${hash}"`).length - 1, 2);
    assert.ok(html.includes(`id="${hash}"`));
  }
  const cvPath = LOCALIZED_PATHS.cv[language];
  assert.ok(html.includes(`href="${cvPath}">${copy.ui.readCv}</a>`), `${language} Home must link to its own CV`);
  assert.ok(html.includes(`href="${cvPath}">${copy.ui.footerCv}</a>`), `${language} footer must link to its own CV`);
  for (const pdf of Object.values(CV_PDF[language])) {
    assert.ok(html.includes(`href="${pdf.href}" download="${pdf.download}"`), `${language} Home must offer ${pdf.href}`);
  }
  const otherLanguage = language === 'es' ? 'en' : 'es';
  for (const pdf of Object.values(CV_PDF[otherLanguage])) {
    assert.equal(html.includes(pdf.href), false, `${language} Home must not offer the ${otherLanguage} PDF ${pdf.href}`);
  }
  if (language === 'es') {
    const cvBand = html.match(/<section id="cv"[\s\S]*?<\/section>/)?.[0] ?? '';
    const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(cvBand && footer, 'Spanish Home is missing its CV band or footer');
    assert.doesNotMatch(cvBand + footer, /inglés/i, 'Spanish Home must not send the CV back to English');
  }

  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const page = graph.find((node) => node['@type'] === 'ProfilePage');
  const person = graph.find((node) => node['@type'] === 'Person');
  assert.equal(page.url, url);
  assert.equal(page.inLanguage, language);
  assert.equal(page.name, copy.site.title);
  assert.equal(person['@id'], `${PUBLIC_SITE_ORIGIN}/#person`);
  assert.equal(person.name, projection.shared.name);
  assert.equal(person.jobTitle, copy.shared.professionalIdentity);
  assert.deepEqual(person.sameAs, projection.shared.links.map((link) => link.url));
}

for (const paragraph of collectStrings(projection.site.sections)) {
  if (paragraph.length > 100) assert.equal(spanishHtml.includes(paragraph), false, 'English paragraph leaked into Spanish Home');
}

// The web CV exists in both languages. Each `letter/` route is the US Letter
// paper format of its CV, so it shares that page's canonical and alternates.
for (const [language, route, html] of [
  ['en', '/cv/', cvHtml],
  ['en', '/cv/letter/', cvLetterHtml],
  ['es', '/es/cv/', spanishCvHtml],
  ['es', '/es/cv/letter/', spanishCvLetterHtml]
]) {
  const copy = cvCopy(language);
  const label = `${route} CV`;
  const canonical = `${PUBLIC_SITE_ORIGIN}${copy.path}`;
  assert.match(html, new RegExp(`<html lang="${language}"`), label);
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${label} canonical`);
  for (const [hreflang, path] of [
    ['en', LOCALIZED_PATHS.cv.en],
    ['es', LOCALIZED_PATHS.cv.es],
    ['x-default', LOCALIZED_PATHS.cv.en]
  ]) {
    assert.equal(
      html.split(`rel="alternate" hreflang="${hreflang}" href="${PUBLIC_SITE_ORIGIN}${path}"`).length - 1,
      1,
      `${label} must declare the ${hreflang} alternate once`
    );
  }
  assert.equal((html.match(/rel="alternate"/g) ?? []).length, 3, `${label} alternates`);
  for (const [attribute, value] of [
    ['property="og:locale"', language === 'es' ? 'es_AR' : 'en_US'],
    ['property="og:locale:alternate"', language === 'es' ? 'en_US' : 'es_AR'],
    ['property="og:url"', canonical],
    ['property="og:title"', `${copy.shared.name} — ${copy.cv.title}`],
    ['name="description"', copy.cv.profile.text]
  ]) assert.ok(html.includes(`${attribute} content="${value}"`), `${label} is missing ${attribute}`);
  for (const text of [
    copy.shared.name,
    copy.shared.location,
    copy.shared.email,
    ...collectStrings(copy.shared.links),
    ...collectStrings(copy.cv),
    copy.ui.pdfA4,
    copy.ui.pdfLetter
  ]) {
    assert.ok(html.includes(text), `${label} is missing localized content: ${text}`);
  }
  assert.ok(html.includes(`<a class="skip-link" href="#cv-main">${copy.ui.skip}</a>`), `${label} skip link`);
  assert.ok(
    html.includes(`<p class="identity"><a href="${LOCALIZED_PATHS.home[language]}">`),
    `${label} identity must return to the Home in its language`
  );
  const switches = [...html.matchAll(/<div class="language-switch"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.equal(switches.length, 1, `${label} must offer one language switch`);
  assert.ok(switches[0][0].includes(`aria-label="${copy.ui.language}"`), `${label} switch label`);
  assert.match(switches[0][1], /href="\/cv\/" lang="en" hreflang="en" aria-label="English"/);
  assert.match(switches[0][1], /href="\/es\/cv\/" lang="es" hreflang="es" aria-label="Español"/);
  assert.equal((switches[0][1].match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(switches[0][1], new RegExp(`hreflang="${language}"[^>]*aria-current="page"`));
  const actions = html.match(/<p class="cv-actions">([\s\S]*?)<\/p>/)?.[1] ?? '';
  const pdfs = CV_PDF[language];
  assert.equal(
    actions,
    `<a href="${pdfs.a4.href}" download="${pdfs.a4.download}" type="application/pdf">${copy.ui.pdfA4}</a>`
      + `<a href="${pdfs.letter.href}" download="${pdfs.letter.download}" type="application/pdf">${copy.ui.pdfLetter}</a>`,
    `${label} must offer the ${language} PDFs`
  );
}
for (const [label, html] of [['Spanish CV', spanishCvHtml], ['Spanish US Letter CV', spanishCvLetterHtml]]) {
  for (const text of collectStrings(projection.cv)) {
    if (text.length > 40) {
      assert.equal(html.includes(text), false, `English CV text leaked into the ${label}: ${text}`);
    }
  }
  const chrome = (html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? '')
    + (html.match(/<p class="cv-actions">[\s\S]*?<\/p>/)?.[0] ?? '');
  assert.doesNotMatch(chrome, /inglés/i, `${label} must not send downloads back to English`);
  assert.match(html, /data-shell="document"/);
  assert.equal(html.includes('class="primary-nav"'), false, `${label} must not render primary navigation`);
  assert.equal(html.includes('<footer class="site-footer">'), false);
  assert.equal(html.includes('application/ld+json'), false);
  assert.equal(html.includes('summary_large_image'), false);
  assert.equal(/noindex/i.test(html), false, `${label} is marked noindex`);
}
assert.match(spanishCvHtml, /data-cv-format="a4"/);
assert.match(spanishCvLetterHtml, /data-cv-format="letter"/);

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
  new RegExp(`href="${CV_PDF.en.a4.href}"[^>]*download="${CV_PDF.en.a4.download}"[^>]*aria-label="[^"]+"[^>]*>A4<`)
);
assert.match(
  siteHtml,
  new RegExp(`href="${CV_PDF.en.letter.href}"[^>]*download="${CV_PDF.en.letter.download}"[^>]*aria-label="[^"]+"[^>]*>US Letter<`)
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
assert.match(cvHtml, /data-shell="document"/);
assert.match(cvLetterHtml, /data-shell="document"/);
assert.equal(cvHtml.includes('class="primary-nav"'), false, 'CV routes must not render primary navigation');
assert.equal(cvLetterHtml.includes('class="primary-nav"'), false, 'US Letter CV must not render primary navigation');
assert.equal(cvHtml.includes('data-mobile-navigation'), false);
assert.equal(cvLetterHtml.includes('data-mobile-navigation'), false);
assert.equal(/<header[^>]*data-directional-header/.test(cvHtml), false);
assert.equal(/<header[^>]*data-directional-header/.test(cvLetterHtml), false);
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
assert.match(cvHtml, /<p class="identity">/);
assert.match(cvLetterHtml, /<p class="identity">/);
assert.match(cvHtml, /<a href="\/">/);
assert.match(cvLetterHtml, /<a href="\/">/);
assert.equal(cvHtml.includes('class="primary-nav"'), false);
assert.equal(cvLetterHtml.includes('class="primary-nav"'), false);
assert.equal(cvHtml.includes('<footer class="site-footer">'), false);
assert.equal(cvLetterHtml.includes('<footer class="site-footer">'), false);
assert.equal(cvHtml.includes('aria-current="page">CV<'), false);
assert.equal(cvLetterHtml.includes('aria-current="page">CV<'), false);
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
assert.equal((sitemapUrlset.match(/<loc>/g) ?? []).length, 4);
assert.ok(sitemapUrlset.includes('<loc>https://andresatencio.com/es/</loc>'));
assert.ok(sitemapUrlset.includes('<loc>https://andresatencio.com/es/cv/</loc>'));

assert.match(cvHtml, /class="cv-actions"/);
assert.match(cvLetterHtml, /class="cv-actions"/);
assert.match(cvHtml, />A4 PDF</);
assert.match(cvHtml, />US Letter PDF</);
assert.match(cvLetterHtml, />A4 PDF</);
assert.match(cvLetterHtml, />US Letter PDF</);
assert.match(cvHtml, new RegExp(`href="${CV_PDF.en.a4.href}"[^>]*download="${CV_PDF.en.a4.download}"`));
assert.match(cvHtml, new RegExp(`href="${CV_PDF.en.letter.href}"[^>]*download="${CV_PDF.en.letter.download}"`));
assert.match(
  cvLetterHtml,
  new RegExp(`href="${CV_PDF.en.a4.href}"[^>]*download="${CV_PDF.en.a4.download}"`)
);
assert.match(
  cvLetterHtml,
  new RegExp(`href="${CV_PDF.en.letter.href}"[^>]*download="${CV_PDF.en.letter.download}"`)
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

console.log('Verified both languages of Home and CV, and the four canonical CV PDFs against the printable fingerprint');

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
