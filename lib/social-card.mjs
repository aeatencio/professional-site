/**
 * Social preview images for the site, one per supported language.
 *
 * Each language has one committed PNG with the same design and format. Home
 * currently opts into its language's card through `BaseLayout`; CV routes stay
 * out on purpose so the card does not change their PDF fingerprints. Absolute
 * URLs are derived from `Astro.site` through `absoluteUrl`, so the canonical
 * origin stays declared in one place.
 *
 * The alt text is built from the public projection rather than hardcoded, so
 * professional copy keeps living in the projection.
 */
import { readFile } from 'node:fs/promises';

function socialCard(file) {
  return {
    href: `/images/social/${file}`,
    publicPath: `public/images/social/${file}`,
    distPath: `dist/images/social/${file}`,
    type: 'image/png',
    width: 1200,
    height: 630
  };
}

export const SOCIAL_CARDS = {
  en: socialCard('social-card.png'),
  es: socialCard('social-card-es.png')
};

export function socialCardAlt(shared) {
  return `${shared.name} — ${shared.professionalIdentity}`;
}

export function inspectPng(buffer) {
  if (buffer.byteLength < 24
    || buffer[0] !== 0x89
    || buffer.subarray(1, 4).toString('ascii') !== 'PNG'
    || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('File is not a PNG');
  }

  return {
    bytes: buffer.byteLength,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    interlace: buffer[28]
  };
}

export async function verifySocialCard({ dist = false } = {}) {
  for (const card of Object.values(SOCIAL_CARDS)) {
    await verifySocialCardFile(card, dist ? [card.publicPath, card.distPath] : [card.publicPath]);
  }
}

async function verifySocialCardFile(card, paths) {
  for (const relativePath of paths) {
    let buffer;
    try {
      buffer = await readFile(new URL(`../${relativePath}`, import.meta.url));
    } catch (cause) {
      throw new Error(`Social card is missing at ${relativePath}`, { cause });
    }

    const png = inspectPng(buffer);
    if (png.width !== card.width || png.height !== card.height) {
      throw new Error(
        `${relativePath} is ${png.width}x${png.height}, expected ${card.width}x${card.height}`
      );
    }
    if (png.interlace !== 0) {
      throw new Error(`${relativePath} is interlaced; Social card PNG must be non-interlaced`);
    }
  }
}
