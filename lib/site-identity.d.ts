export const HOME_PATH: '/';
export const CV_PATH: '/cv/';
export const CV_LETTER_PATH: '/cv/letter/';

export function absoluteUrl(pathname: string, site: string | URL): string;
export function pagePathname(pageUrl: string): string;
export function isIndexableSitemapUrl(pageUrl: string): boolean;

export function homeIdentityGraph(options: {
  shared: {
    name: string;
    professionalIdentity: string;
    location: string;
    language: string;
    links: Array<{ label: string; url: string }>;
  };
  title: string;
  site: string | URL;
}): Record<string, unknown>;
