import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { isIndexableSitemapUrl } from './lib/site-identity.mjs';

export default defineConfig({
  site: 'https://andresatencio.com',
  integrations: [
    sitemap({
      filter: isIndexableSitemapUrl
    })
  ]
});
