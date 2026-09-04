import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Home keeps shrinking safeguards while its new styles stay page-local', async () => {
  const [globalCss, homeCss, page] = await Promise.all([
    readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/home.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8')
  ]);

  assert.match(globalCss, /\.page \{[\s\S]*?max-width:\s*100%/);
  assert.match(globalCss, /\.page > \* \{[\s\S]*?min-width:\s*0/);
  assert.match(globalCss, /h1 \{[\s\S]*?overflow-wrap:\s*break-word/);
  assert.match(globalCss, /\.chapter \{[\s\S]*?min-width:\s*0/);
  assert.match(globalCss, /\.actions \{/);
  assert.match(page, /import '\.\.\/styles\/home\.css'/);
  assert.equal(page.includes('class="actions"'), false);
  assert.equal(page.includes('View experience'), false);
  assert.equal(page.includes('Contact me'), false);
  assert.match(homeCss, /\.page \.chapter--home \{[\s\S]*?align-items:\s*center/);
  assert.match(homeCss, /\.page \.chapter--home \.hero-art \{[\s\S]*?width:\s*min/);
});

test('Home no longer references the retired Working together folder illustration', async () => {
  const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

  assert.equal(page.includes('/images/working-together/folder.png'), false);
  assert.equal(page.includes('chapter-art--folder'), false);
});

test('Experience notebook follows the complete software role list and recomposes in flow', async () => {
  const [page, homeCss] = await Promise.all([
    readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/home.css', import.meta.url), 'utf8')
  ]);

  assert.match(
    page,
    /class="experience-block experience-block--software"[\s\S]*?class="role-list"[\s\S]*?chapter-art--notebook[\s\S]*?currentDevelopment/
  );
  assert.match(homeCss, /\.experience-block--software \{\s*position:\s*relative/);
  assert.match(
    homeCss,
    /\.experience-block--software > \.chapter-art--notebook \{[\s\S]*?position:\s*absolute;[\s\S]*?right:\s*0;[\s\S]*?bottom:\s*clamp/
  );
  assert.match(
    homeCss,
    /@media \(max-width: 54rem\)[\s\S]*?\.experience-block--software > \.chapter-art--notebook \{[\s\S]*?position:\s*static;[\s\S]*?margin-left:\s*auto/
  );
});

test('Primary navigation uses native CV disclosures and progressive enhancement', async () => {
  const [nav, layout, homeCss] = await Promise.all([
    readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/home.css', import.meta.url), 'utf8')
  ]);

  assert.match(layout, /class="identity"[\s\S]*?href="#home"/);
  assert.equal(nav.includes("{ href: '#home', label: 'Home' }"), false);
  assert.match(nav, /<nav class="primary-nav" aria-label="Primary" data-primary-navigation>/);
  assert.match(nav, /<details class="primary-nav__mobile" data-mobile-navigation>/);
  assert.match(nav, /<summary><span>Menu<\/span><\/summary>/);
  assert.match(nav, /<details class="primary-nav__cv primary-nav__cv--desktop" data-cv-disclosure>[\s\S]*?<summary>CV<\/summary>/);
  assert.match(nav, /<details class="primary-nav__cv primary-nav__cv--mobile" data-cv-disclosure>[\s\S]*?<summary>CV<\/summary>/);
  assert.equal((nav.match(/>View online<\/a>/g) ?? []).length, 2);
  assert.equal((nav.match(/>Download PDF<\/a>/g) ?? []).length, 2);
  assert.equal(nav.includes('>View CV</a>'), false);
  assert.equal(nav.includes('>Download CV</a>'), false);
  assert.equal(nav.includes('primary-nav__group-label'), false);
  assert.equal(nav.includes('primary-nav__cv-group'), false);
  assert.equal(nav.includes('primary-nav__cv-actions'), false);
  assert.equal(nav.includes('role="menu"'), false);
  assert.equal(nav.includes('role="menuitem"'), false);
  assert.equal(nav.includes('aria-expanded'), false);
  assert.equal(nav.includes('aria-controls'), false);
  assert.match(nav, /import \{ CV_PDF \}/);
  assert.equal((nav.match(/href="\/cv\/">View online</g) ?? []).length, 2);
  assert.match(nav, /href=\{CV_PDF\.a4\.href\}/);
  assert.match(nav, /download=\{CV_PDF\.a4\.download\}/);
  assert.match(nav, /type="application\/pdf"/);
  assert.match(nav, /event\.key !== 'Escape'/);
  assert.match(nav, /mobileNavigation\.open = false/);
  assert.match(nav, /summary\?\.focus\(\)/);
  assert.match(nav, /document\.addEventListener\('click'/);
  assert.match(nav, /\[\.\.\.cvDisclosures\]\.reverse\(\)/);
  assert.match(nav, /focus\(\{ preventScroll: true \}\)/);
  assert.match(nav, /a\[href\^="#"\]/);
  assert.match(layout, /document\.documentElement\.classList\.add\('js'\)/);

  assert.match(homeCss, /\.page > \.site-header \{[\s\S]*?position:\s*sticky;[\s\S]*?z-index:\s*20/);
  assert.match(homeCss, /html \{\s*scroll-padding-top:\s*var\(--home-header-offset\)/);
  assert.match(homeCss, /\.page main#main,[\s\S]*?scroll-margin-top:\s*0/);
  assert.match(homeCss, /@media \(max-width: 64rem\)/);
  assert.match(homeCss, /\.page \.primary-nav__desktop-list \{\s*display:\s*none/);
  assert.match(homeCss, /\.primary-nav__mobile \{\s*display:\s*block/);
  assert.match(homeCss, /\.primary-nav__mobile-panel \{[\s\S]*?position:\s*static;[\s\S]*?max-height:\s*none;[\s\S]*?overflow:\s*visible/);
  assert.match(homeCss, /\.js \.primary-nav__mobile-panel \{[\s\S]*?position:\s*absolute;[\s\S]*?overflow-y:\s*auto/);
  assert.match(homeCss, /\.js \.page > \.site-header \{[\s\S]*?position:\s*sticky/);
  assert.equal(homeCss.includes('border-inline'), false);
  assert.equal(homeCss.includes('primary-nav__group-label'), false);
  assert.equal(homeCss.includes('primary-nav__cv-actions'), false);
  assert.equal(homeCss.includes('summary::after'), false);
  assert.equal(homeCss.includes('content: "+"'), false);
  assert.equal(homeCss.includes('content: "−"'), false);
  assert.match(homeCss, /\.page \.primary-nav a,[\s\S]*?\.primary-nav__cv > summary,[\s\S]*?\.primary-nav__mobile > summary \{\s*text-underline-offset:\s*0\.2em/);
  assert.match(homeCss, /\.primary-nav__cv > summary:hover,[\s\S]*?\.primary-nav__cv > summary:focus-visible,[\s\S]*?\.primary-nav__mobile > summary:hover,[\s\S]*?\.primary-nav__mobile > summary:focus-visible \{\s*text-decoration:\s*underline/);
  assert.equal(homeCss.includes('[open] > summary {\n  text-decoration: underline'), false);
});

test('Layout verification covers responsive navigation and deployment runs it', async () => {
  const [pkg, verifier, workflow] = await Promise.all([
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/verify-home-overflow.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
  ]);

  assert.match(pkg, /"layout:check": "npm run build && node scripts\/verify-home-overflow\.mjs"/);
  assert.match(verifier, /1024/);
  assert.match(verifier, /768/);
  assert.match(verifier, /390/);
  assert.match(verifier, /320/);
  assert.match(verifier, /667/);
  assert.match(verifier, /scriptExecutionDisabled/);
  assert.match(verifier, /Escape/);
  assert.match(verifier, /summaryFocused/);
  assert.match(verifier, /focusInsideClosedDisclosure/);
  assert.match(verifier, /View online/);
  assert.match(verifier, /Download PDF/);
  assert.match(verifier, /assertAnchorNearHeader/);
  assert.match(verifier, /assertSummaryDecoration/);
  assert.match(verifier, /summaryUnderlined/);
  assert.match(verifier, /#background/);
  assert.match(verifier, /#working-together/);
  assert.match(verifier, /#contact/);
  assert.match(verifier, /#main/);
  assert.match(verifier, /primary-nav__mobile-panel/);
  assert.match(verifier, /CV_PDF\.a4\.href/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm run layout:check/);
});
