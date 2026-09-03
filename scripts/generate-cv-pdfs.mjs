import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import astroConfig from '../astro.config.mjs';
import {
  CV_PDF,
  CV_PDF_FINGERPRINT_PATH,
  PUBLIC_SITE_ORIGIN,
  inspectPdf,
  printToPdfParams,
  repoPath,
  sha256
} from '../lib/cv-pdf.mjs';
import {
  evaluate,
  findBrowser,
  openPage,
  sleep,
  withHeadlessBrowser
} from '../lib/headless-chrome.mjs';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { printableCvFingerprint } from '../lib/printable-cv.mjs';

const distDir = repoPath('dist');
const tmpRoot = repoPath('tmp', 'cv-pdf');
const astroBin = repoPath('node_modules', 'astro', 'bin', 'astro.mjs');

const projection = await loadLocalPublicProjection();

await findBrowser();

await rm(tmpRoot, { recursive: true, force: true });
await mkdir(tmpRoot, { recursive: true });
await mkdir(repoPath('public', 'cv'), { recursive: true });

console.log('Building current CV HTML');
await runProcess(process.execPath, [astroBin, 'build']);

const printableSha256 = await printableCvFingerprint();
const fingerprint = {
  printableSha256,
  files: {}
};

await withHeadlessBrowser(distDir, async ({ cdp, origin }) => {
  for (const pdf of Object.values(CV_PDF)) {
    const url = new URL(pdf.route, origin).href;
    console.log(`Printing ${pdf.route} to ${pdf.publicPath}`);
    await assertExpectedDocument(origin, url, pdf);
    const { targetId, sessionId } = await openPage(cdp, url);
    await assertLoadedCv(cdp, sessionId, pdf, projection);
    await cdp.send('Emulation.setEmulatedMedia', { media: 'print' }, sessionId);
    await sleep(400);
    await assertPrintChromeHidden(cdp, sessionId);
    const { data } = await cdp.send('Page.printToPDF', printToPdfParams(pdf), sessionId);
    await cdp.send('Target.closeTarget', { targetId });

    const buffer = Buffer.from(data, 'base64');
    const inspection = inspectPdf(buffer);
    if (inspection.pageCount !== 1) {
      throw new Error(`${pdf.publicPath} has ${inspection.pageCount} pages; expected 1`);
    }

    const tmpFile = path.join(tmpRoot, path.basename(pdf.publicPath));
    await writeFile(tmpFile, buffer);
    await copyFile(tmpFile, repoPath(pdf.publicPath));
    await mkdir(path.dirname(repoPath(pdf.distPath)), { recursive: true });
    await copyFile(tmpFile, repoPath(pdf.distPath));
    fingerprint.files[pdf.publicPath] = {
      sha256: sha256(buffer),
      bytes: buffer.byteLength
    };
  }
});

await writeFile(
  repoPath(CV_PDF_FINGERPRINT_PATH),
  `${JSON.stringify(fingerprint, null, 2)}\n`
);
console.log(`Wrote ${CV_PDF_FINGERPRINT_PATH}`);

async function assertExpectedDocument(origin, url, pdf) {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status !== 200) {
    throw new Error(`${pdf.route} returned HTTP ${response.status}`);
  }
  if (!contentType.includes('text/html')) {
    throw new Error(`${pdf.route} returned ${contentType || 'no content type'}, expected HTML`);
  }

  const html = await response.text();
  if (!html.includes('id="cv-main"') || html.includes('Not found')) {
    throw new Error(`${pdf.route} is not the CV document`);
  }
  if (!html.includes(`data-cv-format="${pdf.format}"`)) {
    throw new Error(`${pdf.route} does not declare format ${pdf.format}`);
  }

  const finalUrl = new URL(response.url);
  const expectedUrl = new URL(pdf.route, origin);
  if (finalUrl.origin !== expectedUrl.origin || finalUrl.pathname !== expectedUrl.pathname) {
    throw new Error(`Unexpected CV URL ${finalUrl.href}; expected ${expectedUrl.href}`);
  }
}

async function assertLoadedCv(cdp, sessionId, pdf, publicProjection) {
  const info = await evaluate(cdp, sessionId, `({
    href: location.href,
    pathname: location.pathname,
    statusGone: document.body.textContent.includes('Not found'),
    hasMain: Boolean(document.querySelector('#cv-main')),
    mainClass: document.querySelector('#cv-main')?.className ?? '',
    format: document.body.dataset.cvFormat ?? '',
    name: document.querySelector('#cv-main h1')?.textContent ?? '',
    siteHref: document.querySelector('#cv-main a[rel="me"][aria-label="Website"]')?.getAttribute('href') ?? '',
    workersDev: document.querySelector('#cv-main')?.innerHTML.includes('workers.dev') ?? true
  })`);

  const expectedPath = pdf.route.replace(/\/$/, '') || '/';
  const actualPath = info.pathname.replace(/\/$/, '') || '/';
  if (actualPath !== expectedPath) {
    throw new Error(`Loaded ${info.pathname}, expected ${pdf.route}`);
  }
  if (info.statusGone || !info.hasMain || info.mainClass !== 'cv-page') {
    throw new Error(`${pdf.route} did not load the CV document`);
  }
  if (info.format !== pdf.format) {
    throw new Error(`${pdf.route} has format ${info.format}, expected ${pdf.format}`);
  }
  if (info.name !== publicProjection.shared.name) {
    throw new Error(`${pdf.route} heading is ${info.name}, expected ${publicProjection.shared.name}`);
  }
  if (info.siteHref !== PUBLIC_SITE_ORIGIN && info.siteHref !== `${PUBLIC_SITE_ORIGIN}/`) {
    throw new Error(`${pdf.route} site URL is ${info.siteHref}, expected ${PUBLIC_SITE_ORIGIN}`);
  }
  if (info.workersDev) {
    throw new Error(`${pdf.route} still presents a workers.dev URL as public identity`);
  }
  if (new URL(astroConfig.site).origin !== PUBLIC_SITE_ORIGIN) {
    throw new Error(`astro.config site is not ${PUBLIC_SITE_ORIGIN}`);
  }
}

async function assertPrintChromeHidden(cdp, sessionId) {
  const print = await evaluate(cdp, sessionId, `({
    chrome: document.querySelector('.cv-chrome')
      ? getComputedStyle(document.querySelector('.cv-chrome')).display
      : 'missing',
    skip: document.querySelector('.skip-link')
      ? getComputedStyle(document.querySelector('.skip-link')).display
      : 'missing',
    page: document.querySelector('#cv-main')
      ? getComputedStyle(document.querySelector('#cv-main')).display
      : 'missing'
  })`);

  if (print.chrome !== 'none') {
    throw new Error(`CV chrome is visible in print (display: ${print.chrome})`);
  }
  if (print.skip !== 'none') {
    throw new Error(`Skip link is visible in print (display: ${print.skip})`);
  }
  if (print.page === 'none' || print.page === 'missing') {
    throw new Error('Printable CV document is not visible under print media');
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: repoPath() });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}
