import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import astroConfig from '../astro.config.mjs';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import {
  CV_LETTER_PATH,
  CV_PATH,
  HOME_PATH,
  absoluteUrl,
  homeIdentityGraph,
  isIndexableSitemapUrl
} from '../lib/site-identity.mjs';

function nodeByType(graph, type) {
  const nodes = graph['@graph'];
  assert.ok(Array.isArray(nodes), 'Identity JSON-LD must use @graph');
  const matches = nodes.filter((node) => node['@type'] === type);
  assert.equal(matches.length, 1, `Expected one ${type} node`);
  return matches[0];
}

test('absolute URLs and sitemap membership follow the canonical site', () => {
  const site = astroConfig.site;

  assert.equal(absoluteUrl(HOME_PATH, site), 'https://andresatencio.com/');
  assert.equal(absoluteUrl(CV_PATH, site), 'https://andresatencio.com/cv/');
  assert.equal(isIndexableSitemapUrl(absoluteUrl(HOME_PATH, site)), true);
  assert.equal(isIndexableSitemapUrl(absoluteUrl(CV_PATH, site)), true);
  assert.equal(isIndexableSitemapUrl(absoluteUrl(CV_LETTER_PATH, site)), false);
  assert.equal(isIndexableSitemapUrl(absoluteUrl('/robots.txt', site)), false);
  assert.equal(isIndexableSitemapUrl(absoluteUrl('/cv/andres-atencio-cv-a4.pdf', site)), false);
});

test('Home identity graph models ProfilePage, Person and sameAs from the projection', async () => {
  const projection = await loadLocalPublicProjection();
  const serialized = JSON.stringify(homeIdentityGraph({
    shared: projection.shared,
    title: projection.site.title,
    site: astroConfig.site
  }));
  const graph = JSON.parse(serialized);
  const person = nodeByType(graph, 'Person');
  const profilePage = nodeByType(graph, 'ProfilePage');
  const website = nodeByType(graph, 'WebSite');
  const github = projection.shared.links.find((link) => link.label === 'GitHub');
  const linkedIn = projection.shared.links.find((link) => link.label === 'LinkedIn');
  const pageUrl = 'https://andresatencio.com/';

  assert.ok(github);
  assert.ok(linkedIn);

  assert.equal(projection.shared.name, 'Andrés Atencio');
  assert.equal(person.name, 'Andrés Atencio');
  assert.equal(person.url, pageUrl);
  assert.equal(person.jobTitle, projection.shared.professionalIdentity);
  assert.equal(person.homeLocation?.name, projection.shared.location);
  assert.deepEqual(person.sameAs, [github.url, linkedIn.url]);
  assert.equal(person.sameAs.includes('https://github.com/aeatencio'), true);
  assert.equal(person.sameAs.includes('https://www.linkedin.com/in/aeatencio/'), true);
  assert.equal(profilePage.url, pageUrl);
  assert.equal(profilePage.mainEntity['@id'], person['@id']);
  assert.equal(profilePage.about['@id'], person['@id']);
  assert.equal(person.mainEntityOfPage['@id'], profilePage['@id']);
  assert.equal(website.url, pageUrl);
  assert.equal(website.name, projection.shared.name);
  assert.equal(website.publisher['@id'], person['@id']);
  assert.equal(profilePage.isPartOf['@id'], website['@id']);
  assert.equal(serialized.includes('Software developer Buenos Aires'), false);
  assert.equal(Object.hasOwn(person, 'email'), false);
});

test('layouts declare canonical metadata from the site origin', async () => {
  const [layout, cvLayout, page, robots, config] = await Promise.all([
    readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/CvLayout.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/HomePage.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/robots.txt.ts', import.meta.url), 'utf8'),
    readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8')
  ]);

  assert.match(layout, /canonicalPath/);
  assert.match(layout, /rel="canonical"/);
  assert.match(layout, /property="og:title"/);
  assert.match(layout, /property="og:description"/);
  assert.match(layout, /property="og:url"/);
  assert.match(layout, /property="og:type"/);
  assert.match(layout, /name="twitter:card"/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /IdentityTag = isHome \? 'h1' : 'p'/);
  assert.equal(layout.includes('https://andresatencio.com'), false);
  assert.match(cvLayout, /canonicalPath=\{copy\.path\}/);
  assert.match(layout, /rel="alternate" hreflang="x-default" href=\{absoluteUrl\(alternates\.en, Astro\.site\)\}/);
  assert.equal(cvLayout.includes('rel="canonical"'), false);
  assert.equal(cvLayout.includes('PUBLIC_SITE_ORIGIN'), false);
  assert.match(page, /canonicalPath=\{copy.path\}/);
  assert.match(page, /homeIdentityGraph/);
  assert.match(page, /ogType="profile"/);
  assert.match(page, /aria-labelledby="site-identity home-heading"/);
  assert.match(page, /class="home-identity"/);
  assert.equal(page.includes('<h1 id="home-heading">'), false);
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /sitemap-index\.xml/);
  assert.equal(robots.includes('Disallow'), false);
  assert.match(config, /@astrojs\/sitemap/);
  assert.match(config, /isIndexableSitemapUrl/);
});
