import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import astroConfig from '../astro.config.mjs';
import { homeCopy } from '../lib/home-copy.ts';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { absoluteUrl } from '../lib/site-identity.mjs';
import {
  SOCIAL_CARDS,
  inspectPng,
  socialCardAlt,
  verifySocialCard
} from '../lib/social-card.mjs';

const CARD_FILES = { en: 'social-card.png', es: 'social-card-es.png' };

test('each Home language has a social card descriptor for a PNG at the platform size', () => {
  assert.deepEqual(Object.keys(SOCIAL_CARDS).sort(), ['en', 'es']);

  for (const [language, file] of Object.entries(CARD_FILES)) {
    const card = SOCIAL_CARDS[language];
    assert.equal(card.href, `/images/social/${file}`);
    assert.equal(card.publicPath, `public/images/social/${file}`);
    assert.equal(card.distPath, `dist/images/social/${file}`);
    assert.equal(card.type, 'image/png');
    assert.equal(card.width, 1200);
    assert.equal(card.height, 630);
    assert.equal(card.href.startsWith('/'), true, 'href must be root-relative');
    assert.equal(card.href.includes('andresatencio.com'), false);
  }
});

test('social card URLs are absolute and derived from the canonical site', () => {
  assert.equal(
    absoluteUrl(SOCIAL_CARDS.en.href, astroConfig.site),
    'https://andresatencio.com/images/social/social-card.png'
  );
  assert.equal(
    absoluteUrl(SOCIAL_CARDS.es.href, astroConfig.site),
    'https://andresatencio.com/images/social/social-card-es.png'
  );
});

test('committed social cards are distinct 1200x630 non-interlaced PNGs', async () => {
  await verifySocialCard();

  const buffers = [];
  for (const card of Object.values(SOCIAL_CARDS)) {
    const buffer = await readFile(new URL(`../${card.publicPath}`, import.meta.url));
    const png = inspectPng(buffer);

    assert.equal(png.width, 1200);
    assert.equal(png.height, 630);
    assert.equal(png.bitDepth, 8);
    assert.equal(png.colorType, 2, 'card must stay truecolor with no alpha channel');
    assert.equal(png.interlace, 0);
    assert.ok(png.bytes < 5 * 1024 * 1024, 'card must stay under the 5 MB scraper limit');
    buffers.push(buffer);
  }

  assert.equal(buffers[0].equals(buffers[1]), false, 'each language needs its own card');
});

test('inspectPng rejects files that are not PNGs', () => {
  assert.throws(() => inspectPng(Buffer.from('%PDF-1.7 not a png at all')), /not a PNG/);
});

test('social card alt comes from the projection, not from hardcoded copy', async () => {
  const projection = await loadLocalPublicProjection();
  const alt = socialCardAlt(projection.shared);

  assert.equal(alt, 'Andrés Atencio — Software Developer · IT Teacher');
  assert.ok(alt.includes(projection.shared.name));
  assert.ok(alt.includes(projection.shared.professionalIdentity));
  assert.equal(
    socialCardAlt(homeCopy('es').shared),
    'Andrés Atencio — Desarrollador de software · Profesor de Informática'
  );

  const card = await readFile(new URL('../lib/social-card.mjs', import.meta.url), 'utf8');
  assert.equal(card.includes(projection.shared.professionalIdentity), false);
  assert.equal(card.includes('andresatencio.com'), false);
});

test('BaseLayout declares the social image block once, behind an opt-in', async () => {
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

  const once = [
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:type"',
    'property="og:site_name"',
    'property="og:image"',
    'property="og:image:type"',
    'property="og:image:width"',
    'property="og:image:height"',
    'property="og:image:alt"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
    'name="twitter:image:alt"'
  ];

  for (const attribute of once) {
    const occurrences = layout.split(attribute).length - 1;
    assert.equal(occurrences, 1, `BaseLayout must declare ${attribute} exactly once`);
  }

  // Exactly two branches, so a page gets one twitter:card and it always matches
  // whether an image is actually declared.
  assert.equal(layout.split('name="twitter:card"').length - 1, 2);
  assert.match(layout, /name="twitter:card" content="summary_large_image"/);
  assert.match(layout, /name="twitter:card" content="summary"/);
  assert.match(layout, /const hasSocialCard = Boolean\(socialCardAlt\)/);
  assert.match(layout, /socialCardAlt\?: string;/);
  assert.match(layout, /const socialCard = SOCIAL_CARDS\[lang\];/);
  assert.match(layout, /socialCardUrl = absoluteUrl\(socialCard\.href, Astro\.site\)/);
  assert.equal(layout.includes('https://andresatencio.com'), false, 'no hardcoded origin');
  for (const card of Object.values(SOCIAL_CARDS)) {
    assert.equal(layout.includes(card.href), false, 'no hardcoded asset path');
  }
});

test('the Home opts into the social card and the CV layout does not', async () => {
  const [home, cvLayout] = await Promise.all([
    readFile(new URL('../src/components/HomePage.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/CvLayout.astro', import.meta.url), 'utf8')
  ]);

  assert.match(home, /import \{ socialCardAlt \} from '\.\.\/\.\.\/lib\/social-card\.mjs';/);
  assert.match(home, /socialCardAlt=\{socialCardAlt\(shared\)\}/);
  assert.equal(cvLayout.includes('socialCardAlt'), false);
});
