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
  assert.match(homeCss, /\.experience-block--software \{\s*position:\s*relative;[\s\S]*?border-bottom:\s*1px solid var\(--color-line\)/);
  assert.match(homeCss, /\.experience-block--software \.role:last-child \{\s*border-bottom:\s*none/);
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
  const [nav, layout, homeCss, shellCss] = await Promise.all([
    readFile(new URL('../src/components/PrimaryNav.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/home.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/site-shell.css', import.meta.url), 'utf8')
  ]);

  assert.match(layout, /class="identity"[\s\S]*?href=\{homeHref\}/);
  assert.match(layout, /isHome \? '#home' : '\/'/);
  assert.equal(layout.includes('slot name="contextual"'), false);
  assert.equal(layout.includes('cvFormat'), false);
  assert.match(layout, /import '\.\.\/styles\/site-shell\.css'/);
  assert.equal(layout.includes("import '../styles/home.css'"), false);
  assert.match(layout, /class="site-header" data-directional-header/);
  assert.match(layout, /class="site-header__inner">[\s\S]*?class="identity"[\s\S]*?<PrimaryNav \/>/);
  assert.match(layout, /const TOP_TOLERANCE = 24/);
  assert.match(layout, /const HIDE_DISTANCE = 16/);
  assert.match(layout, /const REVEAL_DISTANCE = 8/);
  assert.match(layout, /requestAnimationFrame\(updateHeader\)/);
  assert.match(layout, /addEventListener\('scroll', queueUpdate, \{ passive: true \}\)/);
  assert.match(layout, /active\.matches\(':focus-visible'\)/);
  assert.match(layout, /event\.key === 'Tab'/);
  assert.match(layout, /site-header--instant/);
  assert.match(layout, /querySelector\('details\[open\]'\)/);
  assert.match(layout, /header\.addEventListener\('toggle', revealAndReset, true\)/);
  assert.match(layout, /addEventListener\('pointerdown'/);
  assert.match(layout, /window\.addEventListener\('pointerup', endPointerInteraction\)/);
  assert.match(layout, /window\.addEventListener\('pointercancel', endPointerInteraction\)/);
  assert.equal(layout.includes("addEventListener('pointerover'"), false);
  assert.equal(layout.includes("addEventListener('mouseenter'"), false);
  assert.equal(layout.includes("matches(':hover')"), false);
  assert.match(layout, /addEventListener\('hashchange'/);
  assert.match(layout, /<footer class="site-footer">[\s\S]*?<p>\{name\}<\/p>[\s\S]*?<a href="\/cv\/">CV<\/a>/);
  assert.equal(nav.includes("{ href: '#home', label: 'Home' }"), false);
  assert.match(nav, /<nav class="primary-nav" aria-label="Primary" data-primary-navigation>/);
  assert.match(nav, /sectionHref\('#experience'\)/);
  assert.match(nav, /href=\{contactHref\}>Contact</);
  assert.match(nav, /<details class="primary-nav__mobile" data-mobile-navigation>/);
  assert.match(nav, /<summary><span>Menu<\/span><\/summary>/);
  assert.match(nav, /isCvPage/);
  assert.match(nav, /aria-current="page">CV</);
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

  assert.match(shellCss, /\.page > \.site-header \{[\s\S]*?position:\s*sticky;[\s\S]*?z-index:\s*20/);
  assert.match(shellCss, /\.page > \.site-header \{[\s\S]*?display:\s*grid;[\s\S]*?grid-column:\s*1 \/ -1;[\s\S]*?grid-template-columns:/);
  assert.match(shellCss, /\.page > \.site-header \{[\s\S]*?background-color:\s*var\(--color-ivory\);[\s\S]*?border-bottom:\s*1px solid var\(--color-cobalt\)/);
  assert.equal(/\.page > \.site-header \{[\s\S]*?\}/.exec(shellCss)?.[0]?.includes('background-image'), false);
  assert.match(shellCss, /\.page > \.site-header \{[\s\S]*?border-bottom:\s*1px solid var\(--color-cobalt\)/);
  assert.match(shellCss, /\.site-header \.site-header__inner \{[\s\S]*?position:\s*relative;[\s\S]*?display:\s*flex;[\s\S]*?grid-column:\s*2/);
  assert.match(shellCss, /\.page > \.site-header \{[\s\S]*?transform:\s*translateY\(0\);[\s\S]*?transition:\s*transform 160ms ease-out/);
  assert.match(shellCss, /\.site-header\.site-header--hidden \{\s*transform:\s*translateY\(calc\(-100% - 2rem\)\)/);
  assert.match(shellCss, /\.site-header\.site-header--instant \{\s*transition:\s*none/);
  assert.match(shellCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.page > \.site-header \{\s*transition:\s*none/);
  assert.equal(shellCss.includes('will-change'), false);
  assert.match(shellCss, /\.page > \.site-footer \{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?justify-content:\s*space-between/);
  assert.match(shellCss, /\.page > \.site-footer a \{[\s\S]*?color:\s*var\(--color-cobalt\);[\s\S]*?white-space:\s*nowrap/);
  assert.match(shellCss, /\.page > \.site-footer a:hover,[\s\S]*?\.page > \.site-footer a:focus-visible \{\s*text-decoration:\s*underline/);
  assert.match(shellCss, /html \{\s*scroll-padding-top:\s*var\(--site-header-offset\)/);
  assert.match(homeCss, /\.page main#main,[\s\S]*?scroll-margin-top:\s*0/);
  assert.match(shellCss, /@media \(max-width: 64rem\)/);
  assert.match(shellCss, /\.page \.primary-nav__desktop-list \{\s*display:\s*none/);
  assert.match(shellCss, /\.primary-nav__mobile \{\s*display:\s*block/);
  assert.match(shellCss, /\.primary-nav__mobile-panel \{[\s\S]*?position:\s*static;[\s\S]*?max-height:\s*none;[\s\S]*?overflow:\s*visible/);
  assert.match(shellCss, /\.js \.primary-nav__mobile-panel \{[\s\S]*?position:\s*absolute;[\s\S]*?overflow-y:\s*auto/);
  assert.match(shellCss, /\.js \.primary-nav__mobile-panel \{[\s\S]*?right:\s*0;[\s\S]*?left:\s*auto;[\s\S]*?width:\s*max-content;[\s\S]*?max-width:\s*min\(13\.5rem, 100%\)/);
  assert.match(shellCss, /\.primary-nav__mobile-list > li > a,[\s\S]*?\.primary-nav__cv--mobile > summary \{[\s\S]*?width:\s*auto;[\s\S]*?min-height:\s*2\.5rem;[\s\S]*?justify-content:\s*flex-end/);
  assert.match(shellCss, /\.primary-nav__cv--mobile \.primary-nav__cv-options \{[\s\S]*?font-size:\s*0\.9rem/);
  assert.match(shellCss, /\.primary-nav__cv--mobile \.primary-nav__cv-options a \{[\s\S]*?min-height:\s*2\.25rem;[\s\S]*?justify-content:\s*flex-end/);
  assert.match(shellCss, /\.js \.page > \.site-header \{[\s\S]*?position:\s*sticky/);
  assert.equal(shellCss.includes('border-inline'), false);
  assert.equal(shellCss.includes('primary-nav__group-label'), false);
  assert.equal(shellCss.includes('primary-nav__cv-actions'), false);
  assert.equal(shellCss.includes('summary::after'), false);
  assert.equal(shellCss.includes('content: "+"'), false);
  assert.equal(shellCss.includes('content: "−"'), false);
  assert.match(shellCss, /\.page \.primary-nav a,[\s\S]*?\.primary-nav__cv > summary,[\s\S]*?\.primary-nav__mobile > summary \{\s*text-underline-offset:\s*0\.2em/);
  assert.match(shellCss, /\.primary-nav__cv > summary:hover,[\s\S]*?\.primary-nav__cv > summary:focus-visible,[\s\S]*?\.primary-nav__mobile > summary:hover,[\s\S]*?\.primary-nav__mobile > summary:focus-visible \{\s*text-decoration:\s*underline/);
  assert.equal(shellCss.includes('[open] > summary {\n  text-decoration: underline'), false);
  assert.equal(homeCss.includes('.page > .site-header'), false);
  assert.equal(homeCss.includes('.primary-nav__mobile'), false);
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
  assert.match(verifier, /assertDirectionalHeader/);
  assert.match(verifier, /assertReducedMotion/);
  assert.match(verifier, /prefers-reduced-motion/);
  assert.match(verifier, /assertFooterNavigation/);
  assert.match(verifier, /site-footer a\[href="\/cv\/"\]/);
  assert.match(verifier, /Input\.dispatchTouchEvent/);
  assert.match(verifier, /type: 'mouseWheel'/);
  assert.match(verifier, /jittered header/);
  assert.match(verifier, /layout shift/);
  assert.match(verifier, /assertHeaderSurface/);
  assert.match(verifier, /does not cover the viewport width/);
  assert.match(verifier, /does not have the opaque smooth surface/);
  assert.match(verifier, /does not have a full-width rule and shadow/);
  assert.match(verifier, /compact right-aligned dropdown/);
  assert.match(verifier, /alignment or touch targets/);
  assert.match(verifier, /Escape/);
  assert.match(verifier, /summaryFocused/);
  assert.match(verifier, /focusInsideClosedDisclosure/);
  assert.match(verifier, /View online/);
  assert.match(verifier, /Download PDF/);
  assert.match(verifier, /assertCvSitePages/);
  assert.match(verifier, /A4 PDF/);
  assert.match(verifier, /US Letter PDF/);
  assert.match(verifier, /cv-actions/);
  assert.match(verifier, /shared site shell/);
  assert.match(verifier, /does not mix CV actions/);
  assert.match(verifier, /screen presentation/);
  assert.equal(verifier.includes('aria-label="Back to site"'), false);
  assert.equal(verifier.includes('assertDesktopCvChrome'), false);
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
