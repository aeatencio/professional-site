/**
 * Shared social preview image for the site.
 *
 * One committed PNG is the social card asset. Home currently opts into it
 * through `BaseLayout`; CV routes stay out on purpose so the card does not
 * change their PDF fingerprints. Its absolute URL is derived from `Astro.site`
 * through `absoluteUrl`, so the canonical origin stays declared in one place.
 *
 * The alt text is built from the public projection rather than hardcoded, so
 * professional copy keeps living in the projection.
 */
import { readFile } from 'node:fs/promises';

export const SOCIAL_CARD = {
  href: '/images/social/social-card.png',
  publicPath: 'public/images/social/social-card.png',
  distPath: 'dist/images/social/social-card.png',
  type: 'image/png',
  width: 1200,
  height: 630
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
  const paths = dist
    ? [SOCIAL_CARD.publicPath, SOCIAL_CARD.distPath]
    : [SOCIAL_CARD.publicPath];

  for (const relativePath of paths) {
    let buffer;
    try {
      buffer = await readFile(new URL(`../${relativePath}`, import.meta.url));
    } catch (cause) {
      throw new Error(`Social card is missing at ${relativePath}`, { cause });
    }

    const png = inspectPng(buffer);
    if (png.width !== SOCIAL_CARD.width || png.height !== SOCIAL_CARD.height) {
      throw new Error(
        `${relativePath} is ${png.width}x${png.height}, expected ${SOCIAL_CARD.width}x${SOCIAL_CARD.height}`
      );
    }
    if (png.interlace !== 0) {
      throw new Error(`${relativePath} is interlaced; Social card PNG must be non-interlaced`);
    }
  }
}
