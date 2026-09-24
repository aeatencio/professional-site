/**
 * Canonical page URLs and Home identity JSON-LD.
 *
 * Derived from the public projection and `Astro.site`. Indexable HTML is the
 * Home and the canonical CV web view, each in English and Spanish.
 * `/cv/letter/` and `/es/cv/letter/` are paper-format routes of their CV, not
 * second public documents.
 */

export const HOME_PATH = '/';
export const CV_PATH = '/cv/';
export const CV_LETTER_PATH = '/cv/letter/';

/** Equivalent pages by language, for language switching and hreflang. */
export const LOCALIZED_PATHS = /** @type {const} */ ({
  home: { en: HOME_PATH, es: '/es/' },
  cv: { en: CV_PATH, es: '/es/cv/' }
});

const INDEXABLE_PATHNAMES = new Set(
  Object.values(LOCALIZED_PATHS)
    .flatMap((paths) => Object.values(paths))
    .map((path) => path.replace(/\/$/, '') || '/')
);

export function absoluteUrl(pathname, site) {
  if (!site) {
    throw new Error('A site URL is required to build absolute page URLs');
  }

  return new URL(pathname, site).href;
}

export function pagePathname(pageUrl) {
  return new URL(pageUrl).pathname.replace(/\/$/, '') || '/';
}

export function isIndexableSitemapUrl(pageUrl) {
  return INDEXABLE_PATHNAMES.has(pagePathname(pageUrl));
}

export function homeIdentityGraph({ shared, title, site, path = HOME_PATH }) {
  const pageUrl = absoluteUrl(path, site);
  const homeUrl = absoluteUrl(HOME_PATH, site);
  const origin = new URL(pageUrl).origin;
  const personId = `${origin}/#person`;
  const profilePageId = `${pageUrl}#profilepage`;
  const websiteId = `${origin}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: homeUrl,
        name: shared.name,
        inLanguage: ['en', 'es'],
        publisher: { '@id': personId }
      },
      {
        '@type': 'ProfilePage',
        '@id': profilePageId,
        url: pageUrl,
        name: title,
        inLanguage: shared.language,
        isPartOf: { '@id': websiteId },
        about: { '@id': personId },
        mainEntity: { '@id': personId }
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: shared.name,
        url: homeUrl,
        jobTitle: shared.professionalIdentity,
        homeLocation: {
          '@type': 'Place',
          name: shared.location
        },
        sameAs: shared.links.map((link) => link.url),
        mainEntityOfPage: { '@id': profilePageId }
      }
    ]
  };
}
