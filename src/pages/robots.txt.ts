import type { APIRoute } from 'astro';

const robotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('A site URL is required to emit robots.txt');
  }

  return new Response(robotsTxt(new URL('sitemap-index.xml', site)), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
