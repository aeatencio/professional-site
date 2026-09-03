import astroConfig from '../astro.config.mjs';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { PUBLIC_SITE_ORIGIN, repoPath } from '../lib/cv-pdf.mjs';
import { evaluate, findBrowser, openPage, withHeadlessBrowser } from '../lib/headless-chrome.mjs';

const widths = [390, 320];
const projection = await loadLocalPublicProjection();

await findBrowser();

if (new URL(astroConfig.site).origin !== PUBLIC_SITE_ORIGIN) {
  throw new Error(`astro.config site must be ${PUBLIC_SITE_ORIGIN}`);
}

await withHeadlessBrowser(repoPath('dist'), async ({ cdp, origin }) => {
  const homeUrl = new URL('/', origin).href;
  await assertHomeDocument(origin, homeUrl);

  for (const width of widths) {
    const { targetId, sessionId } = await openPage(cdp, homeUrl);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true
    }, sessionId);

    const metrics = await evaluate(cdp, sessionId, `(() => {
      const heading = document.querySelector('#home-heading')?.textContent ?? '';
      const clientWidth = document.documentElement.clientWidth;
      const overflowing = [];
      for (const el of document.body.querySelectorAll('*')) {
        const box = el.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        if (box.right > clientWidth + 1 || box.left < -1) {
          overflowing.push(el.className || el.tagName);
        }
      }
      return {
        pathname: location.pathname,
        heading,
        hasHome: Boolean(document.querySelector('#home')),
        downloadLabel: document.querySelector('.actions a[download]')?.textContent ?? '',
        clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        overflowing
      };
    })()`);

    if ((metrics.pathname.replace(/\/$/, '') || '/') !== '/') {
      throw new Error(`Home layout check loaded ${metrics.pathname}, expected /`);
    }
    if (!metrics.hasHome || metrics.heading !== projection.shared.professionalIdentity) {
      throw new Error(`Home layout check did not load the Home document at ${width}px`);
    }
    if (metrics.downloadLabel !== 'Download CV') {
      throw new Error(`Home download label is ${metrics.downloadLabel}, expected Download CV`);
    }
    if (metrics.scrollWidth > metrics.clientWidth || metrics.bodyScroll > metrics.clientWidth) {
      throw new Error(
        `Home overflows horizontally at ${width}px (scrollWidth ${Math.max(metrics.scrollWidth, metrics.bodyScroll)} > clientWidth ${metrics.clientWidth})`
      );
    }
    if (metrics.overflowing.length) {
      throw new Error(
        `Home has elements outside the viewport at ${width}px: ${metrics.overflowing.slice(0, 8).join(', ')}`
      );
    }

    await cdp.send('Target.closeTarget', { targetId });
    console.log(`Home has no horizontal overflow at ${width}px`);
  }
});

async function assertHomeDocument(origin, url) {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status !== 200) {
    throw new Error(`Home returned HTTP ${response.status}`);
  }
  if (!contentType.includes('text/html')) {
    throw new Error(`Home returned ${contentType || 'no content type'}, expected HTML`);
  }

  const html = await response.text();
  if (!html.includes('id="home"') || html.includes('Not found')) {
    throw new Error('Home route did not return the Home document');
  }
  if (!html.includes(projection.shared.professionalIdentity)) {
    throw new Error('Home document is missing the professional identity');
  }
  if (!html.includes(projection.shared.name)) {
    throw new Error('Home document is missing the public name');
  }
  if (!html.includes('>Download CV<')) {
    throw new Error('Home document is missing the Download CV action');
  }

  const finalUrl = new URL(response.url);
  const expectedUrl = new URL('/', origin);
  if (finalUrl.origin !== expectedUrl.origin || (finalUrl.pathname.replace(/\/$/, '') || '/') !== '/') {
    throw new Error(`Unexpected Home URL ${finalUrl.href}; expected ${expectedUrl.href}`);
  }
}
