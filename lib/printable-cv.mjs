import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import astroConfig from '../astro.config.mjs';
import {
  CV_PDF,
  PUBLIC_SITE_ORIGIN,
  printToPdfParams,
  repoPath
} from './cv-pdf.mjs';

const ASSET_EXTENSIONS = new Set([
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2'
]);

/**
 * Fingerprint of the effective CV print inputs.
 *
 * Boundary: the built HTML for `/cv/` and `/cv/letter/` (including head,
 * metadata, `@page`, on-screen chrome and `#cv-main`), every local stylesheet those
 * documents load, every local font/image those documents or stylesheets
 * reference, `Astro.site`, and the `Page.printToPDF` options used for each
 * paper size.
 *
 * This is deliberately conservative. False positives include on-screen-only
 * chrome, skip-link markup, screen-only CSS in a shared stylesheet, comments,
 * and any other local asset referenced by the built CV pages even if print
 * media does not paint it. Those changes require regenerating the versioned
 * PDFs. That is preferred to a stale PDF passing because a heuristic omitted
 * a rule that actually affected print.
 */
export async function printableCvFingerprint() {
  return digestCvPrintInputs(await collectCvPrintInputs());
}

export async function collectCvPrintInputs() {
  const documents = [];

  for (const pdf of Object.values(CV_PDF)) {
    const htmlPath = repoPath('dist', ...routeToDistParts(pdf.route), 'index.html');
    const html = await readFile(htmlPath, 'utf8');
    if (!html.includes(`data-cv-format="${pdf.format}"`)) {
      throw new Error(`Built CV HTML is missing data-cv-format="${pdf.format}"`);
    }
    if (!html.includes('id="cv-main"')) {
      throw new Error(`Built CV HTML is missing #cv-main for ${pdf.format}`);
    }
    if (!/@page\s*\{/.test(html)) {
      throw new Error(`Built CV HTML is missing an @page rule for ${pdf.format}`);
    }

    const stylesheets = [];
    for (const href of stylesheetHrefsFromHtml(html)) {
      if (!isLocalPath(href)) continue;
      const css = await readFile(repoPath('dist', href.replace(/^\//, '')), 'utf8');
      stylesheets.push({ href, css });
    }

    const assetPaths = new Set(localAssetPathsFromHtml(html));
    for (const sheet of stylesheets) {
      for (const url of localUrlsFromCss(sheet.css)) {
        const resolved = resolveLocalAssetPath(sheet.href, url);
        if (resolved) assetPaths.add(resolved);
      }
    }

    const assets = [];
    for (const assetPath of [...assetPaths].sort()) {
      if (path.extname(assetPath.split('?')[0]).toLowerCase() === '.css') continue;
      const bytes = await readFile(repoPath('dist', assetPath.replace(/^\//, '').split('?')[0]));
      assets.push({ path: assetPath, bytes });
    }

    documents.push({
      format: pdf.format,
      route: pdf.route,
      paper: pdf.paper,
      printToPDF: printToPdfParams(pdf),
      html,
      stylesheets,
      assets
    });
  }

  return {
    site: PUBLIC_SITE_ORIGIN,
    astroSite: astroConfig.site,
    documents
  };
}

export function digestCvPrintInputs(inputs) {
  const hash = createHash('sha256');
  hash.update(`site:${inputs.site}\0`);
  hash.update(`astroSite:${inputs.astroSite}\0`);

  for (const document of inputs.documents) {
    hash.update(`format:${document.format}\0`);
    hash.update(`route:${document.route}\0`);
    hash.update(`paper:${JSON.stringify(document.paper)}\0`);
    hash.update(`printToPDF:${JSON.stringify(document.printToPDF)}\0`);
    hash.update(document.html);
    hash.update('\0');

    for (const sheet of document.stylesheets) {
      hash.update(sheet.href);
      hash.update('\0');
      hash.update(sheet.css);
      hash.update('\0');
    }

    for (const asset of document.assets) {
      hash.update(asset.path);
      hash.update('\0');
      hash.update(asset.bytes);
      hash.update('\0');
    }
  }

  return hash.digest('hex');
}

export function stylesheetHrefsFromHtml(html) {
  const hrefs = [
    ...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g),
    ...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g)
  ].map((match) => match[1]);

  return [...new Set(hrefs)];
}

export function localAssetPathsFromHtml(html) {
  const paths = [];
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const value = match[1];
    if (!isLocalPath(value) || !isFingerprintedAsset(value)) continue;
    const assetPath = value.split('?')[0];
    if (path.extname(assetPath).toLowerCase() === '.css') continue;
    paths.push(assetPath);
  }
  return [...new Set(paths)];
}

export function localUrlsFromCss(css) {
  const urls = [];
  for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const value = match[2].trim();
    if (!value || value.startsWith('data:') || /^[a-z]+:/i.test(value)) continue;
    urls.push(value.split('?')[0]);
  }
  return [...new Set(urls)];
}

export function resolveLocalAssetPath(stylesheetHref, cssUrl) {
  if (cssUrl.startsWith('/')) {
    return isFingerprintedAsset(cssUrl) ? cssUrl.split('?')[0] : null;
  }
  if (!isLocalPath(stylesheetHref)) return null;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(stylesheetHref), cssUrl));
  const withSlash = resolved.startsWith('/') ? resolved : `/${resolved}`;
  return isFingerprintedAsset(withSlash) ? withSlash : null;
}

function routeToDistParts(route) {
  return route.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
}

function isLocalPath(value) {
  return value.startsWith('/') && !value.startsWith('//');
}

function isFingerprintedAsset(value) {
  return ASSET_EXTENSIONS.has(path.extname(value.split('?')[0]).toLowerCase());
}
