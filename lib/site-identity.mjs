/**
 * Canonical page URLs and Home identity JSON-LD.
 *
 * Derived from the public projection and `Astro.site`. Indexable HTML is the
 * Home document and the canonical CV web view. `/cv/letter/` is a paper-format
 * route of that same CV, not a second public document.
 */

export const HOME_PATH = '/';
export const CV_PATH = '/cv/';
export const CV_LETTER_PATH = '/cv/letter/';

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
  const pathname = pagePathname(pageUrl);
  return pathname === '/' || pathname === '/cv';
}

export function homeIdentityGraph({ shared, title, site }) {
  const pageUrl = absoluteUrl(HOME_PATH, site);
  const origin = new URL(pageUrl).origin;
  const personId = `${origin}/#person`;
  const profilePageId = `${origin}/#profilepage`;
  const websiteId = `${origin}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: pageUrl,
        name: shared.name,
        inLanguage: shared.language,
        publisher: { '@id': personId }
      },
      {
        '@type': 'ProfilePage',
        '@id': profilePageId,
        url: pageUrl,
        name: title,
        isPartOf: { '@id': websiteId },
        about: { '@id': personId },
        mainEntity: { '@id': personId }
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: shared.name,
        url: pageUrl,
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
