import astroConfig from '../astro.config.mjs';
import { loadLocalPublicProjection } from '../lib/load-public-projection.mjs';
import { CV_PDF, PUBLIC_SITE_ORIGIN, repoPath } from '../lib/cv-pdf.mjs';
import {
  evaluate,
  findBrowser,
  openPage,
  sleep,
  withHeadlessBrowser
} from '../lib/headless-chrome.mjs';

const desktopWidths = [1366, 1025];
const mobileViewports = [
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
  { width: 667, height: 375 }
];
const directionalViewports = [
  { width: 1366, height: 900, mobile: false },
  { width: 1025, height: 900, mobile: false },
  ...mobileViewports.map((viewport) => ({ ...viewport, mobile: true }))
];
const noJavaScriptWidths = [390, 320];
const footerViewports = [
  { width: 1366, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
  { width: 320, height: 700, mobile: true }
];
const projection = await loadLocalPublicProjection();

await findBrowser();

if (new URL(astroConfig.site).origin !== PUBLIC_SITE_ORIGIN) {
  throw new Error(`astro.config site must be ${PUBLIC_SITE_ORIGIN}`);
}

await withHeadlessBrowser(repoPath('dist'), async ({ cdp, origin }) => {
  const homeUrl = new URL('/', origin).href;
  await assertHomeDocument(origin, homeUrl);

  for (const width of desktopWidths) {
    await assertDesktopNavigation(cdp, homeUrl, width);
  }

  for (const viewport of mobileViewports) {
    await assertMobileNavigation(cdp, homeUrl, viewport);
  }

  for (const width of noJavaScriptWidths) {
    await assertNoJavaScriptNavigation(cdp, homeUrl, width);
  }

  for (const viewport of directionalViewports) {
    await assertDirectionalHeader(cdp, homeUrl, viewport);
  }

  await assertReducedMotion(cdp, homeUrl);
  for (const { width, height, mobile } of footerViewports) {
    await assertFooter(cdp, homeUrl, width, height, mobile);
  }
  await assertViewOnlineNavigation(cdp, homeUrl);
  await assertCvSitePages(cdp, origin);
  await assertFooterNavigation(cdp, homeUrl);
});

async function assertDesktopNavigation(cdp, homeUrl, width) {
  const page = await openAt(cdp, homeUrl, width, 900, false);
  const { targetId, sessionId } = page;

  const initial = await evaluate(cdp, sessionId, `(() => {
    const header = document.querySelector('.site-header');
    const desktop = document.querySelector('.primary-nav__desktop-list');
    const mobile = document.querySelector('[data-mobile-navigation]');
    const cv = document.querySelector('.primary-nav__cv--desktop');
    const cvSummary = cv?.querySelector(':scope > summary');
    const topLevel = [...(desktop?.children ?? [])].map((item) =>
      item.querySelector(':scope > a, :scope > details > summary')?.textContent?.trim() ?? ''
    );
    return {
      pathname: location.pathname,
      heading: document.querySelector('#home-heading')?.textContent ?? '',
      headerPosition: header ? getComputedStyle(header).position : '',
      headerBackground: header ? getComputedStyle(header).backgroundColor : '',
      desktopDisplay: desktop ? getComputedStyle(desktop).display : '',
      mobileDisplay: mobile ? getComputedStyle(mobile).display : '',
      topLevel,
      cvOpen: cv?.open ?? null,
      cvSummaryText: cvSummary?.textContent?.trim() ?? '',
      ariaExpanded: cvSummary?.getAttribute('aria-expanded') ?? null,
      ariaControls: cvSummary?.getAttribute('aria-controls') ?? null,
      heroActions: document.querySelectorAll('.chapter--home .actions').length,
      ...window.__layoutMetrics()
    };
  })()`);

  if ((initial.pathname.replace(/\/$/, '') || '/') !== '/') {
    throw new Error(`Desktop layout check loaded ${initial.pathname}, expected /`);
  }
  if (initial.heading !== projection.shared.professionalIdentity) {
    throw new Error('Desktop layout check did not load the Home document');
  }
  if (initial.headerPosition !== 'sticky' || initial.headerBackground === 'rgba(0, 0, 0, 0)') {
    throw new Error(`Home header is not sticky with an opaque background at ${width}px`);
  }
  if (initial.desktopDisplay === 'none' || initial.mobileDisplay !== 'none') {
    throw new Error(`Desktop navigation visibility is incorrect at ${width}px`);
  }
  if (JSON.stringify(initial.topLevel) !== JSON.stringify([
    'Experience',
    'Background',
    'Working together',
    'CV',
    'Contact'
  ])) {
    throw new Error(`Desktop top-level navigation is incorrect at ${width}px: ${initial.topLevel.join(', ')}`);
  }
  if (initial.cvOpen !== false || initial.cvSummaryText !== 'CV') {
    throw new Error(`Desktop CV disclosure is not initially closed at ${width}px`);
  }
  if (initial.ariaExpanded !== null || initial.ariaControls !== null) {
    throw new Error('Native CV summary must not receive manual aria-expanded or aria-controls');
  }
  if (initial.heroActions !== 0) {
    throw new Error('The hero still contains the duplicated actions navigation');
  }
  assertNoHorizontalOverflow(initial, width, 'Desktop Home');

  await assertSummaryDecoration(cdp, sessionId, '.primary-nav__cv--desktop > summary', false, false, `desktop CV idle at ${width}px`);
  await clickSelector(cdp, sessionId, '.primary-nav__cv--desktop > summary');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--desktop', `desktop pointer at ${width}px`);
  await assertSummaryDecoration(cdp, sessionId, '.primary-nav__cv--desktop > summary', true, true, `desktop CV hover at ${width}px`);
  await movePointerToSelector(cdp, sessionId, '#home-heading');
  await assertSummaryDecoration(cdp, sessionId, '.primary-nav__cv--desktop > summary', false, true, `desktop CV open without hover at ${width}px`);

  await focusSelector(cdp, sessionId, '.primary-nav__cv--desktop a[href="/cv/"]');
  await clickSelector(cdp, sessionId, '#experience-heading');
  let outsideClosed = await disclosureState(cdp, sessionId, '.primary-nav__cv--desktop');
  if (outsideClosed.open || outsideClosed.focusInsideClosedContent) {
    throw new Error(`Outside pointer did not close desktop CV without hidden focus at ${width}px: ${JSON.stringify(outsideClosed)}`);
  }

  await focusSelector(cdp, sessionId, '.primary-nav__cv--desktop > summary');
  await pressKey(cdp, sessionId, 'Enter');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--desktop', `desktop Enter at ${width}px`);

  await pressKey(cdp, sessionId, 'Escape');
  let escaped = await disclosureState(cdp, sessionId, '.primary-nav__cv--desktop');
  if (escaped.open || !escaped.summaryFocused || !escaped.focusVisible || !escaped.summaryUnderlined) {
    throw new Error(`Desktop Escape did not close CV and return visible focus at ${width}px`);
  }

  await pressKey(cdp, sessionId, ' ');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--desktop', `desktop Space at ${width}px`);
  await pressKey(cdp, sessionId, 'Tab');
  let active = await activeLink(cdp, sessionId);
  if (active.text !== 'View online') {
    throw new Error(`Desktop CV first Tab reached ${active.text || 'nothing'} at ${width}px`);
  }
  await pressKey(cdp, sessionId, 'Tab');
  active = await activeLink(cdp, sessionId);
  if (active.text !== 'Download PDF') {
    throw new Error(`Desktop CV second Tab reached ${active.text || 'nothing'} at ${width}px`);
  }

  await preventNextNavigation(cdp, sessionId, '.primary-nav__cv--desktop a[download]');
  await pressKey(cdp, sessionId, 'Enter');
  const downloaded = await disclosureState(cdp, sessionId, '.primary-nav__cv--desktop');
  if (downloaded.open || !downloaded.summaryFocused) {
    throw new Error(`Desktop Download PDF left focus in hidden content at ${width}px`);
  }

  for (const [hash, label] of [
    ['#experience', 'Experience'],
    ['#background', 'Background'],
    ['#working-together', 'Working together'],
    ['#contact', 'Contact']
  ]) {
    await activateByEnter(cdp, sessionId, `.primary-nav__desktop-list a[href="${hash}"]`);
    await sleep(75);
    const sticky = await anchorMetrics(cdp, sessionId, hash);
    assertAnchorNearHeader(sticky, hash, `Desktop ${label} at ${width}px`);
  }

  await cdp.send('Target.closeTarget', { targetId });
  console.log(`Desktop navigation, disclosures, offsets and overflow verified at ${width}px`);
}

async function assertMobileNavigation(cdp, homeUrl, { width, height }) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, width, height, true);
  const label = `${width}x${height}`;

  const initial = await evaluate(cdp, sessionId, `(() => {
    const navigation = document.querySelector('[data-mobile-navigation]');
    const summary = navigation?.querySelector(':scope > summary');
    const desktop = document.querySelector('.primary-nav__desktop-list');
    const header = document.querySelector('.site-header');
    return {
      hasJsMarker: document.documentElement.classList.contains('js'),
      headerPosition: header ? getComputedStyle(header).position : '',
      open: navigation?.open ?? null,
      mobileDisplay: navigation ? getComputedStyle(navigation).display : '',
      desktopDisplay: desktop ? getComputedStyle(desktop).display : '',
      summaryText: summary?.textContent?.trim() ?? '',
      ariaExpanded: summary?.getAttribute('aria-expanded') ?? null,
      ariaControls: summary?.getAttribute('aria-controls') ?? null,
      ...window.__layoutMetrics()
    };
  })()`);

  if (!initial.hasJsMarker || initial.headerPosition !== 'sticky') {
    throw new Error(`Enhanced mobile header is not sticky at ${label}`);
  }
  if (initial.mobileDisplay === 'none' || initial.desktopDisplay !== 'none') {
    throw new Error(`Mobile navigation visibility is incorrect at ${label}`);
  }
  if (initial.open !== false || initial.summaryText !== 'Menu') {
    throw new Error(`Mobile navigation is not initially closed at ${label}`);
  }
  if (initial.ariaExpanded !== null || initial.ariaControls !== null) {
    throw new Error('Native Menu summary must not receive manual aria-expanded or aria-controls');
  }
  assertNoHorizontalOverflow(initial, width, 'Closed mobile Home');

  if (width === 390) await assertSkipLink(cdp, sessionId);

  await assertSummaryDecoration(cdp, sessionId, '[data-mobile-navigation] > summary', false, false, `mobile Menu idle at ${label}`);
  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');
  await assertSummaryDecoration(cdp, sessionId, '[data-mobile-navigation] > summary', true, true, `mobile Menu hover at ${label}`);
  await movePointerToSelector(cdp, sessionId, '.identity-mark');
  await assertSummaryDecoration(cdp, sessionId, '[data-mobile-navigation] > summary', false, true, `mobile Menu open without hover at ${label}`);
  await clickSelector(cdp, sessionId, '.primary-nav__cv--mobile > summary');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--mobile', `mobile pointer at ${label}`);
  await assertSummaryDecoration(cdp, sessionId, '.primary-nav__cv--mobile > summary', true, true, `mobile CV hover at ${label}`);
  await movePointerToSelectorAt(cdp, sessionId, '.primary-nav__mobile-panel', 0.98, 0.98);
  await assertSummaryDecoration(cdp, sessionId, '.primary-nav__cv--mobile > summary', false, true, `mobile CV open without hover at ${label}`);
  await assertMobilePanel(cdp, sessionId, width, height, label);

  await focusSelector(cdp, sessionId, '.primary-nav__cv--mobile a[download]');
  await clickSelectorAt(cdp, sessionId, '.primary-nav__mobile-panel', 0.98, 0.98);
  let outsideClosed = await disclosureState(cdp, sessionId, '.primary-nav__cv--mobile');
  let outsideOuter = await disclosureState(cdp, sessionId, '[data-mobile-navigation]');
  if (outsideClosed.open || outsideClosed.focusInsideClosedContent || !outsideOuter.open) {
    throw new Error(`Pointer inside Menu but outside CV did not close only CV at ${label}`);
  }

  await clickSelector(cdp, sessionId, '.primary-nav__cv--mobile > summary');
  await focusSelector(cdp, sessionId, '.primary-nav__cv--mobile a[download]');
  await clickSelector(cdp, sessionId, '.identity-mark');
  outsideClosed = await disclosureState(cdp, sessionId, '.primary-nav__cv--mobile');
  outsideOuter = await disclosureState(cdp, sessionId, '[data-mobile-navigation]');
  if (outsideClosed.open || outsideOuter.open || outsideOuter.focusInsideClosedContent) {
    throw new Error(`Pointer outside Menu did not close inner then outer without hidden focus at ${label}`);
  }

  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');

  await focusSelector(cdp, sessionId, '.primary-nav__cv--mobile > summary');
  await pressKey(cdp, sessionId, 'Enter');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--mobile', `mobile Enter at ${label}`);
  await pressKey(cdp, sessionId, 'Escape');
  let nested = await disclosureState(cdp, sessionId, '.primary-nav__cv--mobile');
  let outer = await disclosureState(cdp, sessionId, '[data-mobile-navigation]');
  if (nested.open || !nested.summaryFocused || !nested.summaryUnderlined || !outer.open) {
    throw new Error(`First mobile Escape did not close only CV at ${label}`);
  }
  await pressKey(cdp, sessionId, 'Escape');
  outer = await disclosureState(cdp, sessionId, '[data-mobile-navigation]');
  if (outer.open || !outer.summaryFocused || !outer.focusVisible || !outer.summaryUnderlined) {
    throw new Error(`Second mobile Escape did not close Menu and restore visible focus at ${label}`);
  }

  await pressKey(cdp, sessionId, ' ');
  await focusSelector(cdp, sessionId, '.primary-nav__cv--mobile > summary');
  await pressKey(cdp, sessionId, ' ');
  await assertCvOptions(cdp, sessionId, '.primary-nav__cv--mobile', `mobile Space at ${label}`);
  await pressKey(cdp, sessionId, 'Tab');
  let active = await activeLink(cdp, sessionId);
  if (active.text !== 'View online') {
    throw new Error(`Mobile CV first Tab reached ${active.text || 'nothing'} at ${label}`);
  }
  await pressKey(cdp, sessionId, 'Tab');
  active = await activeLink(cdp, sessionId);
  if (active.text !== 'Download PDF') {
    throw new Error(`Mobile CV second Tab reached ${active.text || 'nothing'} at ${label}`);
  }
  await preventNextNavigation(cdp, sessionId, '.primary-nav__cv--mobile a[download]');
  await pressKey(cdp, sessionId, 'Enter');
  nested = await disclosureState(cdp, sessionId, '.primary-nav__cv--mobile');
  outer = await disclosureState(cdp, sessionId, '[data-mobile-navigation]');
  if (nested.open || outer.open || !outer.summaryFocused) {
    throw new Error(`Mobile Download PDF left focus in hidden content at ${label}`);
  }

  await openMobileTree(cdp, sessionId);
  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');
  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');
  nested = await disclosureState(cdp, sessionId, '.primary-nav__cv--mobile');
  if (nested.open) {
    throw new Error(`Nested CV retained stale open state after Menu closed at ${label}`);
  }
  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');

  for (const [selector, hash, name] of [
    ['.identity a[href="#home"]', '#home', 'identity'],
    ['[data-mobile-navigation] a[href="#experience"]', '#experience', 'Experience'],
    ['[data-mobile-navigation] a[href="#background"]', '#background', 'Background'],
    ['[data-mobile-navigation] a[href="#working-together"]', '#working-together', 'Working together'],
    ['[data-mobile-navigation] a[href="#contact"]', '#contact', 'Contact']
  ]) {
    await openMobileTree(cdp, sessionId);
    await activateByEnter(cdp, sessionId, selector);
    await sleep(100);
    const result = await evaluate(cdp, sessionId, `(() => {
      const outer = document.querySelector('[data-mobile-navigation]');
      const inner = document.querySelector('.primary-nav__cv--mobile');
      return {
        outerOpen: outer?.open ?? null,
        innerOpen: inner?.open ?? null,
        focusInsideClosedDisclosure: Boolean(
          (!outer?.open && outer?.contains(document.activeElement))
          || (!inner?.open && inner?.contains(document.activeElement))
        )
      };
    })()`);
    if (result.outerOpen || result.innerOpen || result.focusInsideClosedDisclosure) {
      throw new Error(`${name} did not close inner then outer disclosures cleanly at ${label}`);
    }
    const anchor = await anchorMetrics(cdp, sessionId, hash);
    assertAnchorNearHeader(anchor, hash, `Mobile ${name} at ${label}`);
  }

  await cdp.send('Target.closeTarget', { targetId });
  console.log(`Mobile navigation, nested disclosures, offsets and overflow verified at ${label}`);
}

async function assertSkipLink(cdp, sessionId) {
  await evaluate(cdp, sessionId, `(() => {
    window.scrollTo(0, 480);
    document.activeElement?.blur();
  })()`);
  await pressKey(cdp, sessionId, 'Tab');
  const focused = await evaluate(cdp, sessionId, `(() => {
    const skip = document.querySelector('.skip-link');
    const box = skip?.getBoundingClientRect();
    return {
      focused: document.activeElement === skip,
      visible: (box?.width ?? 0) > 0 && (box?.height ?? 0) > 0
        && (box?.top ?? -1) >= 0 && (box?.bottom ?? Infinity) <= innerHeight,
      focusVisible: skip?.matches(':focus-visible') ?? false
    };
  })()`);
  if (!focused.focused || !focused.visible || !focused.focusVisible) {
    throw new Error(`Skip link keyboard focus state is invalid: ${JSON.stringify(focused)}`);
  }
  await pressKey(cdp, sessionId, 'Enter');
  await sleep(75);
  assertAnchorNearHeader(await anchorMetrics(cdp, sessionId, '#main'), '#main', 'Skip link #main');
}

async function assertDirectionalHeader(cdp, homeUrl, { width, height, mobile }) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, width, height, mobile);
  const label = `${width}x${height}`;
  const disclosureSelector = mobile
    ? '[data-mobile-navigation] > summary'
    : '.primary-nav__cv--desktop > summary';

  assertHeaderVisible(await headerState(cdp, sessionId), `initial header at ${label}`);

  await scrollToY(cdp, sessionId, 20);
  assertHeaderVisible(await headerState(cdp, sessionId), `near-top header at ${label}`);

  await scrollToY(cdp, sessionId, 420);
  const hidden = await headerState(cdp, sessionId);
  assertHeaderHidden(hidden, `downward header at ${label}`);
  const documentTopBefore = hidden.experienceDocumentTop;

  for (const y of [419, 421, 420, 418, 420]) {
    await scrollToY(cdp, sessionId, y, 35);
  }
  const jittered = await headerState(cdp, sessionId);
  assertHeaderHidden(jittered, `jittered header at ${label}`);
  await sleep(250);
  assertHeaderHidden(await headerState(cdp, sessionId), `stopped header at ${label}`);

  await scrollToY(cdp, sessionId, 410);
  const revealed = await headerState(cdp, sessionId);
  assertHeaderVisible(revealed, `upward header at ${label}`);
  if (Math.abs(revealed.experienceDocumentTop - documentTopBefore) > 0.5) {
    throw new Error(`Header transform caused layout shift at ${label}`);
  }

  await scrollToY(cdp, sessionId, 430);
  assertHeaderHidden(await headerState(cdp, sessionId), `resumed downward header at ${label}`);

  await pressKey(cdp, sessionId, 'Tab');
  await pressKey(cdp, sessionId, 'Tab');
  const focused = await headerState(cdp, sessionId);
  assertHeaderVisible(focused, `keyboard-focused header at ${label}`);
  if (!focused.focusInside || !focused.focusVisible
    || focused.activeTop < 0 || focused.activeBottom > height) {
    throw new Error(`Keyboard focus is not visibly inside the header at ${label}: ${JSON.stringify(focused)}`);
  }

  await clickSelector(cdp, sessionId, '#experience-heading');

  await scrollToY(cdp, sessionId, 0);
  const pointer = await pointerDownSelector(cdp, sessionId, '.identity a');
  await scrollToY(cdp, sessionId, 420);
  assertHeaderVisible(await headerState(cdp, sessionId), `active-pointer header at ${label}`);
  await pointerUp(cdp, sessionId, pointer);
  await scrollToY(cdp, sessionId, 440);
  assertHeaderHidden(await headerState(cdp, sessionId), `completed-pointer header at ${label}`);

  await scrollToY(cdp, sessionId, 0);
  await clickSelector(cdp, sessionId, disclosureSelector);
  await scrollToY(cdp, sessionId, 420);
  const pinned = await headerState(cdp, sessionId);
  assertHeaderVisible(pinned, `open-disclosure header at ${label}`);
  if (!pinned.disclosureOpen) {
    throw new Error(`Disclosure did not remain open during downward scroll at ${label}`);
  }
  if (mobile) {
    await clickSelector(cdp, sessionId, '.primary-nav__cv--mobile > summary');
    await scrollToY(cdp, sessionId, 440);
    const nestedPinned = await headerState(cdp, sessionId);
    const nestedOpen = await evaluate(
      cdp,
      sessionId,
      "document.querySelector('.primary-nav__cv--mobile')?.open ?? false"
    );
    assertHeaderVisible(nestedPinned, `open-mobile-CV header at ${label}`);
    if (!nestedOpen) {
      throw new Error(`Mobile CV did not remain open during downward scroll at ${label}`);
    }
  }
  await pressKey(cdp, sessionId, 'Escape');
  await clickSelector(cdp, sessionId, '#home-heading');

  await scrollToY(cdp, sessionId, 0);
  await movePointerToSelector(cdp, sessionId, '.site-header');
  await scrollToY(cdp, sessionId, 420);
  assertHeaderHidden(await headerState(cdp, sessionId), `hovered downward header at ${label}`);

  await scrollToY(cdp, sessionId, 0);
  await dispatchWheel(cdp, sessionId, width / 2, Math.min(height - 20, 400), 420);
  const wheeled = await headerState(cdp, sessionId);
  if (wheeled.scrollY < 16) {
    throw new Error(`Wheel input did not scroll at ${label}`);
  }
  assertHeaderHidden(wheeled, `wheel-scrolled header at ${label}`);

  if (mobile) {
    await scrollToY(cdp, sessionId, 0);
    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    }, sessionId);
    await dispatchTouchScroll(cdp, sessionId, width / 2, Math.min(height - 20, height * 0.75), 420);
    const touched = await headerState(cdp, sessionId);
    if (touched.scrollY < 16) {
      throw new Error(`Touch gesture did not scroll at ${label}`);
    }
    assertHeaderHidden(touched, `touch-scrolled header at ${label}`);
  }

  await cdp.send('Target.closeTarget', { targetId });
  console.log(`Directional header, focus, input and stability verified at ${label}`);
}

async function assertReducedMotion(cdp, homeUrl) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, 390, 844, true);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  }, sessionId);
  const loaded = cdp.waitEvent('Page.loadEventFired');
  await cdp.send('Page.reload', {}, sessionId);
  await loaded;
  await sleep(75);

  const initial = await headerState(cdp, sessionId);
  if (initial.transitionDuration !== '0s') {
    throw new Error(`Reduced motion retained a header transition: ${initial.transitionDuration}`);
  }
  await scrollToY(cdp, sessionId, 420, 60);
  assertHeaderHidden(await headerState(cdp, sessionId), 'reduced-motion downward header');
  await scrollToY(cdp, sessionId, 410, 60);
  assertHeaderVisible(await headerState(cdp, sessionId), 'reduced-motion upward header');

  await cdp.send('Target.closeTarget', { targetId });
  console.log('Reduced-motion directional behavior verified without animation');
}

async function assertFooter(cdp, homeUrl, width, height, mobile) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, width, height, mobile);
  await evaluate(cdp, sessionId, 'window.scrollTo(0, document.documentElement.scrollHeight)');
  await sleep(220);
  const result = await evaluate(cdp, sessionId, `(() => {
    const footer = document.querySelector('.site-footer');
    const footerBox = footer?.getBoundingClientRect();
    const name = footer?.querySelector('p');
    const nameBox = name?.getBoundingClientRect();
    const links = [...(footer?.querySelectorAll('a') ?? [])];
    const linkBox = links[0]?.getBoundingClientRect();
    return {
      text: footer?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      name: name?.textContent?.trim() ?? '',
      linkCount: links.length,
      hrefs: links.map((link) => link.getAttribute('href')),
      labels: links.map((link) => link.textContent?.trim()),
      forbidden: ['GitHub', 'LinkedIn', 'Download PDF', '@'].filter((value) => footer?.textContent?.includes(value)),
      footerTop: footerBox?.top ?? -1,
      footerBottom: footerBox?.bottom ?? -1,
      rowDelta: Math.abs((nameBox?.top ?? 0) - (linkBox?.top ?? 0)),
      headerHidden: document.querySelector('.site-header')?.classList.contains('site-header--hidden') ?? false,
      ...window.__layoutMetrics()
    };
  })()`);
  if (result.name !== projection.shared.name
    || result.linkCount !== 1
    || result.hrefs[0] !== '/cv/'
    || result.labels[0] !== 'CV'
    || result.forbidden.length) {
    throw new Error(`Footer content is incorrect at ${width}px: ${JSON.stringify(result)}`);
  }
  if (result.footerTop < 0 || result.footerBottom > height + 1 || result.rowDelta > 2) {
    throw new Error(`Footer is not a single visible row at ${width}px: ${JSON.stringify(result)}`);
  }
  if (!result.headerHidden) {
    throw new Error(`Header is not hidden at the footer at ${width}px`);
  }
  assertNoHorizontalOverflow(result, width, `Footer at ${width}px`);
  await cdp.send('Target.closeTarget', { targetId });
  console.log(`Footer content, row, hidden header and overflow verified at ${width}px`);
}

async function assertFooterNavigation(cdp, homeUrl) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, 390, 844, true);
  await evaluate(cdp, sessionId, 'window.scrollTo(0, document.documentElement.scrollHeight)');
  await sleep(200);
  await activateByEnter(cdp, sessionId, '.site-footer a[href="/cv/"]');
  await sleep(150);
  const result = await evaluate(cdp, sessionId, `(() => ({
    pathname: location.pathname,
    hasCvMain: Boolean(document.querySelector('#cv-main')),
    hasPrimaryNav: Boolean(document.querySelector('.primary-nav')),
    hasSiteHeader: Boolean(document.querySelector('.site-header')),
    hasSiteFooter: Boolean(document.querySelector('.site-footer'))
  }))()`);
  if (result.pathname !== '/cv/' || !result.hasCvMain || !result.hasPrimaryNav || !result.hasSiteHeader || !result.hasSiteFooter) {
    throw new Error(`Footer CV link did not reach the CV page in the site shell: ${JSON.stringify(result)}`);
  }
  await cdp.send('Target.closeTarget', { targetId });
  console.log('Footer CV keyboard navigation and shared site shell verified');
}

async function assertNoJavaScriptNavigation(cdp, homeUrl, width) {
  const height = width === 390 ? 844 : 700;
  const first = await openAt(cdp, homeUrl, width, height, true, true);
  await cdp.send('DOM.enable', {}, first.sessionId);
  await cdp.send('CSS.enable', {}, first.sessionId);
  let { root } = await cdp.send('DOM.getDocument', { depth: -1 }, first.sessionId);
  const detailsId = await queryNode(cdp, first.sessionId, root.nodeId, '[data-mobile-navigation]');
  const summaryId = await queryNode(cdp, first.sessionId, detailsId, ':scope > summary');
  const headerId = await queryNode(cdp, first.sessionId, root.nodeId, '.site-header');
  if (await computedProperty(cdp, first.sessionId, headerId, 'position') !== 'static') {
    throw new Error(`No-JavaScript mobile header remains sticky at ${width}px`);
  }

  await clickNode(cdp, first.sessionId, summaryId);
  const cvId = await queryNode(cdp, first.sessionId, detailsId, '.primary-nav__cv--mobile');
  const cvSummaryId = await queryNode(cdp, first.sessionId, cvId, ':scope > summary');
  await clickNode(cdp, first.sessionId, cvSummaryId);
  await sleep(75);

  if (!(await hasAttribute(cdp, first.sessionId, detailsId, 'open'))
    || !(await hasAttribute(cdp, first.sessionId, cvId, 'open'))) {
    throw new Error(`Native disclosures did not open without JavaScript at ${width}px`);
  }
  const panelId = await queryNode(cdp, first.sessionId, detailsId, '.primary-nav__mobile-panel');
  if (await computedProperty(cdp, first.sessionId, panelId, 'position') !== 'static'
    || await computedProperty(cdp, first.sessionId, panelId, 'overflow-y') !== 'visible') {
    throw new Error(`No-JavaScript panel is not in unrestricted document flow at ${width}px`);
  }
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: panelId }, first.sessionId);
  for (const label of ['Experience', 'Background', 'Working together', 'CV', 'View online', 'Download PDF', 'Contact']) {
    if (!outerHTML.includes(label)) {
      throw new Error(`No-JavaScript mobile panel is missing ${label} at ${width}px`);
    }
  }
  for (const expected of [
    'href="/cv/"',
    `href="${CV_PDF.a4.href}"`,
    `download="${CV_PDF.a4.download}"`,
    'type="application/pdf"'
  ]) {
    if (!outerHTML.includes(expected)) {
      throw new Error(`No-JavaScript CV destination is missing ${expected} at ${width}px`);
    }
  }
  await cdp.send('Target.closeTarget', { targetId: first.targetId });

  const second = await openAt(cdp, homeUrl, width, height, true, true);
  await cdp.send('DOM.enable', {}, second.sessionId);
  ({ root } = await cdp.send('DOM.getDocument', { depth: -1 }, second.sessionId));
  const secondDetailsId = await queryNode(cdp, second.sessionId, root.nodeId, '[data-mobile-navigation]');
  const secondSummaryId = await queryNode(cdp, second.sessionId, secondDetailsId, ':scope > summary');
  await clickNode(cdp, second.sessionId, secondSummaryId);
  const backgroundId = await queryNode(cdp, second.sessionId, secondDetailsId, 'a[href="#background"]');
  await clickNode(cdp, second.sessionId, backgroundId);
  await sleep(100);

  const history = await cdp.send('Page.getNavigationHistory', {}, second.sessionId);
  const currentUrl = history.entries.find((entry) => entry.id === history.currentIndex)?.url
    ?? history.entries[history.currentIndex]?.url
    ?? '';
  const targetId = await queryNode(cdp, second.sessionId, root.nodeId, '#background');
  const secondPanelId = await queryNode(cdp, second.sessionId, secondDetailsId, '.primary-nav__mobile-panel');
  const targetBox = await boxForNode(cdp, second.sessionId, targetId);
  const panelBox = await boxForNode(cdp, second.sessionId, secondPanelId);
  if (!currentUrl.endsWith('/#background')) {
    throw new Error(`No-JavaScript Background reached ${currentUrl} at ${width}px`);
  }
  if (targetBox.top < -1 || targetBox.top > 32 || targetBox.bottom <= 0) {
    throw new Error(`No-JavaScript Background is not immediately visible at ${width}px: ${JSON.stringify(targetBox)}`);
  }
  if (panelBox.bottom > targetBox.top + 1) {
    throw new Error(`No-JavaScript panel overlays Background at ${width}px`);
  }

  await cdp.send('Target.closeTarget', { targetId: second.targetId });
  console.log(`No-JavaScript native disclosures and in-flow Background navigation verified at ${width}px`);
}

async function assertViewOnlineNavigation(cdp, homeUrl) {
  const { targetId, sessionId } = await openAt(cdp, homeUrl, 1366, 900, false);
  await clickSelector(cdp, sessionId, '.primary-nav__cv--desktop > summary');
  await activateByEnter(cdp, sessionId, '.primary-nav__cv--desktop a[href="/cv/"]');
  await sleep(150);
  const result = await evaluate(cdp, sessionId, `(() => ({
    pathname: location.pathname,
    hasCvMain: Boolean(document.querySelector('#cv-main')),
    hasCvActions: Boolean(document.querySelector('.cv-actions')),
    hasCvChrome: Boolean(document.querySelector('.cv-chrome')),
    hasPrimaryNav: Boolean(document.querySelector('.primary-nav')),
    hasSiteHeader: Boolean(document.querySelector('.site-header')),
    hasSiteFooter: Boolean(document.querySelector('.site-footer'))
  }))()`);
  if (result.pathname !== '/cv/' || !result.hasCvMain || !result.hasCvActions || result.hasCvChrome
    || !result.hasPrimaryNav || !result.hasSiteHeader || !result.hasSiteFooter) {
    throw new Error(`View online did not reach the A4 CV page in the site shell: ${JSON.stringify(result)}`);
  }
  await cdp.send('Target.closeTarget', { targetId });
  console.log('View online keyboard navigation and shared CV site shell verified');
}

async function assertCvSitePages(cdp, origin) {
  const a4Url = new URL(CV_PDF.a4.route, origin).href;
  const letterUrl = new URL(CV_PDF.letter.route, origin).href;
  const a4Desktop = [];

  for (const viewport of [
    { width: 1366, height: 900, mobile: false },
    { width: 1025, height: 900, mobile: false },
    { width: 768, height: 900, mobile: true },
    { width: 390, height: 844, mobile: true },
    { width: 320, height: 700, mobile: true },
    { width: 667, height: 375, mobile: true }
  ]) {
    const snapshot = await assertCvViewport(cdp, a4Url, viewport, false);
    if (viewport.width >= 1025) a4Desktop.push(snapshot);
    if (viewport.width <= 390 || viewport.width === 667) {
      await assertCvMobileMenu(cdp, a4Url, viewport);
    }
  }

  const letterDesktop = await assertCvViewport(
    cdp,
    letterUrl,
    { width: 1366, height: 900, mobile: false },
    false
  );
  await assertCvViewport(cdp, letterUrl, { width: 390, height: 844, mobile: true }, false);
  await assertCvMobileMenu(cdp, letterUrl, { width: 390, height: 844, mobile: true });
  assertEquivalentScreen(a4Desktop[0], letterDesktop, 'A4 and Letter desktop screen presentation');

  await assertCvViewport(cdp, a4Url, { width: 390, height: 844, mobile: true }, true);
  await assertCvKeyboard(cdp, a4Url);

  for (const pdf of Object.values(CV_PDF)) {
    const response = await fetch(new URL(pdf.href, origin));
    const bytes = new Uint8Array(await response.arrayBuffer()).subarray(0, 5);
    if (!response.ok || new TextDecoder().decode(bytes) !== '%PDF-') {
      throw new Error(`${pdf.href} did not resolve to a PDF`);
    }
  }

  console.log('CV site pages, downloads and responsive web composition verified');
}

function cvSnapshotScript(includeLayoutMetrics) {
  const metrics = includeLayoutMetrics
    ? 'window.__layoutMetrics()'
    : `{
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        overflowing: []
      }`;

  return `(() => {
    const page = document.querySelector('.cv-page');
    const doc = document.querySelector('.cv-document');
    const header = document.querySelector('.site-header');
    const inner = document.querySelector('.site-header__inner');
    const actions = document.querySelector('.cv-actions');
    const main = document.querySelector('#cv-main');
    const footer = document.querySelector('.site-footer');
    const panel = document.querySelector('.primary-nav__mobile-panel');
    const menu = document.querySelector('[data-mobile-navigation]');
    const h1 = document.querySelector('#cv-main h1');
    const profile = document.querySelector('.cv-profile p');
    const contact = document.querySelector('.cv-contact');
    const period = document.querySelector('.cv-period');
    const body = document.querySelector('.cv-body');
    const pageBox = page?.getBoundingClientRect();
    const docBox = doc?.getBoundingClientRect();
    const headerBox = header?.getBoundingClientRect();
    const innerBox = inner?.getBoundingClientRect();
    const actionsBox = actions?.getBoundingClientRect();
    const mainBox = main?.getBoundingClientRect();
    const footerBox = footer?.getBoundingClientRect();
    const panelBox = panel?.getBoundingClientRect();
    const h1Box = h1?.getBoundingClientRect();
    const overlaps = (a, b) => a && b && !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    const parseAlpha = (color) => {
      const match = String(color).match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
      return match ? Number(match[4] ?? 1) : 1;
    };
    const pageStyle = page ? getComputedStyle(page) : null;
    const bodyStyle = body ? getComputedStyle(body) : null;
    const nav = document.querySelector('.primary-nav');
    return {
      pathname: location.pathname,
      hasChrome: Boolean(document.querySelector('.cv-chrome')),
      hasBack: Boolean(document.querySelector('.cv-chrome__back')),
      headerCount: document.querySelectorAll('.site-header').length,
      headerChildCount: header?.children.length ?? 0,
      hasSiteHeader: Boolean(header),
      hasPrimaryNav: Boolean(nav),
      hasSiteFooter: Boolean(footer),
      hasCvMain: Boolean(main),
      hasCvActions: Boolean(actions),
      format: doc?.getAttribute('data-cv-format') ?? '',
      viewOnline: Boolean(nav?.innerHTML?.includes('View online')),
      navDownloadPdf: Boolean(nav?.innerHTML?.includes('Download PDF')),
      current: [...(nav?.querySelectorAll('a[aria-current="page"]') ?? [])].map((link) => link.textContent?.trim() ?? ''),
      identityHref: document.querySelector('.identity a')?.getAttribute('href') ?? '',
      skipHref: document.querySelector('.skip-link')?.getAttribute('href') ?? '',
      experienceHref: document.querySelector('.primary-nav a[href="/#experience"]')?.getAttribute('href')
        ?? document.querySelector('.primary-nav a[href="#experience"]')?.getAttribute('href')
        ?? '',
      backgroundHref: document.querySelector('.primary-nav a[href="/#background"]')?.getAttribute('href')
        ?? '',
      contactHref: document.querySelector('.primary-nav a[href="/#contact"]')?.getAttribute('href')
        ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      actionLinks: [...(actions?.querySelectorAll('a') ?? [])].map((link) => ({
        text: link.textContent?.trim() ?? '',
        href: link.getAttribute('href') ?? '',
        download: link.getAttribute('download'),
        type: link.getAttribute('type'),
        visible: link.getBoundingClientRect().height > 0,
        height: link.getBoundingClientRect().height,
        width: link.getBoundingClientRect().width
      })),
      pageWidth: pageBox?.width ?? 0,
      docWidth: docBox?.width ?? 0,
      pageBackground: pageStyle?.backgroundColor ?? '',
      pageMinHeight: pageStyle?.minHeight ?? '',
      pageBoxShadow: pageStyle?.boxShadow ?? '',
      h1Size: h1 ? Number.parseFloat(getComputedStyle(h1).fontSize) : 0,
      profileSize: profile ? Number.parseFloat(getComputedStyle(profile).fontSize) : 0,
      contactSize: contact ? Number.parseFloat(getComputedStyle(contact).fontSize) : 0,
      periodSize: period ? Number.parseFloat(getComputedStyle(period).fontSize) : 0,
      bodyColumns: bodyStyle?.gridTemplateColumns ?? '',
      h1Top: h1Box?.top ?? -1,
      h1Bottom: h1Box?.bottom ?? -1,
      innerBottom: innerBox?.bottom ?? -1,
      headerBottom: headerBox?.bottom ?? -1,
      headerHeight: headerBox ? headerBox.bottom - headerBox.top : 0,
      actionsTop: actionsBox?.top ?? -1,
      mainTop: mainBox?.top ?? -1,
      mainBottom: mainBox?.bottom ?? -1,
      footerTop: footerBox?.top ?? -1,
      menuOpen: menu?.open ?? false,
      panelPosition: panel ? getComputedStyle(panel).position : '',
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : '',
      panelAlpha: panel ? parseAlpha(getComputedStyle(panel).backgroundColor) : 0,
      panelOverflowY: panel ? getComputedStyle(panel).overflowY : '',
      panelTop: panelBox?.top ?? -1,
      panelBottom: panelBox?.bottom ?? -1,
      panelLeft: panelBox?.left ?? -1,
      panelRight: panelBox?.right ?? -1,
      actionsInPanel: Boolean(panel && actions && panel.contains(actions)),
      panelOverlapsActions: overlaps(panelBox, actionsBox),
      ...${metrics}
    };
  })()`;
}

function assertCvSnapshot(result, viewport, scriptExecutionDisabled) {
  const label = `${result.pathname} ${viewport.width}x${viewport.height}${scriptExecutionDisabled ? ' no-js' : ''}`;
  if (!result.hasSiteHeader || !result.hasPrimaryNav || !result.hasSiteFooter || !result.hasCvMain || !result.hasCvActions) {
    throw new Error(`${label} is missing the shared site shell: ${JSON.stringify(result)}`);
  }
  if (result.hasChrome || result.hasBack || result.headerCount !== 1 || result.headerChildCount !== 1) {
    throw new Error(`${label} still has a second toolbar or rejected chrome: ${JSON.stringify({
      hasChrome: result.hasChrome,
      hasBack: result.hasBack,
      headerCount: result.headerCount,
      headerChildCount: result.headerChildCount
    })}`);
  }
  if (result.viewOnline || result.navDownloadPdf || JSON.stringify(result.current) === JSON.stringify([])) {
    throw new Error(`${label} still has redundant CV navigation: ${JSON.stringify({
      viewOnline: result.viewOnline,
      navDownloadPdf: result.navDownloadPdf,
      current: result.current
    })}`);
  }
  if (!result.current.every((labelText) => labelText === 'CV')) {
    throw new Error(`${label} does not mark CV as the current section: ${JSON.stringify(result.current)}`);
  }
  if (result.identityHref !== '/' || result.skipHref !== '#cv-main') {
    throw new Error(`${label} has incorrect identity or skip link: ${JSON.stringify({
      identityHref: result.identityHref,
      skipHref: result.skipHref
    })}`);
  }
  if (result.experienceHref !== '/#experience' || result.backgroundHref !== '/#background'
    || result.contactHref !== '/#contact') {
    throw new Error(`${label} does not keep Home section destinations: ${JSON.stringify({
      experienceHref: result.experienceHref,
      backgroundHref: result.backgroundHref,
      contactHref: result.contactHref
    })}`);
  }
  if (result.pathname === '/cv/letter/' && result.canonical !== 'https://andresatencio.com/cv/') {
    throw new Error(`${label} is missing the canonical /cv/ link`);
  }
  if (result.pathname === '/cv/' && result.canonical) {
    throw new Error(`${label} should not declare a canonical URL`);
  }
  if (result.innerBottom > result.mainTop + 1) {
    throw new Error(`${label} header overlaps the CV document: ${JSON.stringify(result)}`);
  }
  if (result.footerTop + 1 < result.mainBottom) {
    throw new Error(`${label} footer is not after the document`);
  }
  if (result.pageBackground === 'rgb(255, 255, 255)' || (result.pageBoxShadow && result.pageBoxShadow !== 'none')) {
    throw new Error(`${label} still presents a paper sheet: ${JSON.stringify({
      background: result.pageBackground,
      shadow: result.pageBoxShadow
    })}`);
  }
  if (Math.abs(result.pageWidth - result.docWidth) > 2) {
    throw new Error(`${label} CV is not using the site content width: ${JSON.stringify({
      pageWidth: result.pageWidth,
      docWidth: result.docWidth
    })}`);
  }
  if (viewport.width >= 1025 && result.pageWidth < 850) {
    throw new Error(`${label} still looks like a physical page preview: width ${result.pageWidth}`);
  }
  if (result.h1Top >= viewport.height || result.h1Bottom <= result.headerBottom) {
    throw new Error(`${label} first viewport is not showing the CV heading`);
  }
  if (result.profileSize < 16 || result.h1Size < 24 || result.contactSize < 14 || result.periodSize < 14) {
    throw new Error(`${label} type is too small to read: ${JSON.stringify({
      h1Size: result.h1Size,
      profileSize: result.profileSize,
      contactSize: result.contactSize,
      periodSize: result.periodSize
    })}`);
  }
  const columnCount = String(result.bodyColumns)
    .split(/px(?:\s+|$)/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  if (viewport.width >= 1025 && columnCount < 2) {
    throw new Error(`${label} desktop composition is not two readable columns: ${result.bodyColumns}`);
  }
  if (viewport.width <= 768 && columnCount !== 1) {
    throw new Error(`${label} narrow composition is not a single column: ${result.bodyColumns}`);
  }
  if (JSON.stringify(result.actionLinks.map(({ text }) => text)) !== JSON.stringify(['A4 PDF', 'US Letter PDF'])) {
    throw new Error(`${label} download labels are incorrect: ${JSON.stringify(result.actionLinks)}`);
  }
  const [a4, letter] = result.actionLinks;
  if (a4.href !== CV_PDF.a4.href || a4.download !== CV_PDF.a4.download || a4.type !== 'application/pdf'
    || letter.href !== CV_PDF.letter.href || letter.download !== CV_PDF.letter.download || letter.type !== 'application/pdf') {
    throw new Error(`${label} download attributes are incorrect`);
  }
  if (!result.actionLinks.every(({ visible, height }) => visible && height >= 40)) {
    throw new Error(`${label} download targets are too small: ${JSON.stringify(result.actionLinks)}`);
  }
  assertNoHorizontalOverflow(result, viewport.width, label);
  return result;
}

async function assertCvViewport(cdp, url, viewport, scriptExecutionDisabled) {
  const { targetId, sessionId } = await openAt(
    cdp,
    url,
    viewport.width,
    viewport.height,
    viewport.mobile,
    scriptExecutionDisabled
  );
  const result = await evaluate(cdp, sessionId, cvSnapshotScript(!scriptExecutionDisabled));
  const snapshot = assertCvSnapshot(result, viewport, scriptExecutionDisabled);

  if (!scriptExecutionDisabled && viewport.width >= 1025) {
    await scrollToY(cdp, sessionId, 720);
    const scrolled = await evaluate(cdp, sessionId, `(() => {
      const header = document.querySelector('.site-header');
      return {
        hidden: header?.classList.contains('site-header--hidden') ?? false,
        hasChrome: Boolean(document.querySelector('.cv-chrome')),
        ...window.__layoutMetrics()
      };
    })()`);
    if (!scrolled.hidden) {
      throw new Error(`Desktop ${url} header did not hide on scroll`);
    }
    if (scrolled.hasChrome) {
      throw new Error(`Desktop ${url} still has a second toolbar after scroll`);
    }
    assertNoHorizontalOverflow(scrolled, scrolled.clientWidth, `Scrolled ${url}`);
  }

  await cdp.send('Target.closeTarget', { targetId });
  return snapshot;
}

async function assertCvMobileMenu(cdp, url, viewport) {
  const label = `${url} menu ${viewport.width}x${viewport.height}`;
  const { targetId, sessionId } = await openAt(cdp, url, viewport.width, viewport.height, true);
  await clickSelector(cdp, sessionId, '[data-mobile-navigation] > summary');
  const open = await evaluate(cdp, sessionId, cvSnapshotScript(true));
  if (!open.menuOpen) {
    throw new Error(`${label} did not open`);
  }
  if (open.actionsInPanel || open.viewOnline || open.navDownloadPdf) {
    throw new Error(`${label} mixes CV actions into the global panel: ${JSON.stringify({
      actionsInPanel: open.actionsInPanel,
      viewOnline: open.viewOnline,
      navDownloadPdf: open.navDownloadPdf
    })}`);
  }
  if (open.panelAlpha < 1 || open.panelBackground === 'rgba(0, 0, 0, 0)') {
    throw new Error(`${label} panel is not opaque: ${JSON.stringify({
      background: open.panelBackground,
      alpha: open.panelAlpha
    })}`);
  }
  if (open.panelOverlapsActions && (open.panelPosition !== 'absolute' || open.panelAlpha < 1)) {
    throw new Error(`${label} does not mix CV actions behind an opaque panel: ${JSON.stringify({
      position: open.panelPosition,
      alpha: open.panelAlpha
    })}`);
  }
  if (open.panelLeft < -1 || open.panelRight > viewport.width + 1 || open.panelTop < -1) {
    throw new Error(`${label} panel is not contained: ${JSON.stringify(open)}`);
  }
  if (open.panelBottom > viewport.height + 1 && !['auto', 'scroll', 'overlay'].includes(open.panelOverflowY)) {
    throw new Error(`${label} open menu does not fit or scroll internally: ${JSON.stringify({
      bottom: open.panelBottom,
      overflowY: open.panelOverflowY
    })}`);
  }
  assertNoHorizontalOverflow(open, viewport.width, label);
  await pressKey(cdp, sessionId, 'Escape');
  const closed = await evaluate(cdp, sessionId, `(() => ({
    open: document.querySelector('[data-mobile-navigation]')?.open ?? null
  }))()`);
  if (closed.open) {
    throw new Error(`${label} did not close on Escape`);
  }
  await cdp.send('Target.closeTarget', { targetId });
}

async function assertCvKeyboard(cdp, url) {
  const { targetId, sessionId } = await openAt(cdp, url, 390, 844, true);
  await activateByEnter(cdp, sessionId, '[data-mobile-navigation] > summary');
  const opened = await evaluate(cdp, sessionId, `(() => ({
    open: document.querySelector('[data-mobile-navigation]')?.open ?? false
  }))()`);
  if (!opened.open) {
    throw new Error('Keyboard activation did not open the CV mobile menu');
  }
  await pressKey(cdp, sessionId, 'Escape');
  const escaped = await evaluate(cdp, sessionId, `(() => {
    const menu = document.querySelector('[data-mobile-navigation]');
    const summary = menu?.querySelector(':scope > summary');
    return {
      open: menu?.open ?? null,
      summaryFocused: document.activeElement === summary
    };
  })()`);
  if (escaped.open || !escaped.summaryFocused) {
    throw new Error(`Escape did not close the CV mobile menu and return focus: ${JSON.stringify(escaped)}`);
  }

  const { targetId: desktopId, sessionId: desktopSession } = await openAt(cdp, url, 1366, 900, false);
  await preventNextNavigation(cdp, desktopSession, '.cv-actions a');
  await activateByEnter(cdp, desktopSession, '.cv-actions a');
  await sleep(80);
  const download = await evaluate(cdp, desktopSession, `(() => {
    const link = document.querySelector('.cv-actions a');
    return {
      href: link?.getAttribute('href') ?? '',
      text: link?.textContent?.trim() ?? '',
      focused: document.activeElement === link,
      focusVisible: link?.matches(':focus-visible') ?? false
    };
  })()`);
  if (download.href !== CV_PDF.a4.href || download.text !== 'A4 PDF') {
    throw new Error(`Keyboard did not reach the A4 PDF action: ${JSON.stringify(download)}`);
  }
  await cdp.send('Target.closeTarget', { targetId: desktopId });
  await cdp.send('Target.closeTarget', { targetId });
}

function assertEquivalentScreen(a, b, label) {
  const keys = ['pageWidth', 'pageBackground', 'h1Size', 'profileSize', 'contactSize', 'bodyColumns', 'pageMinHeight'];
  for (const key of keys) {
    if (String(a[key]) !== String(b[key])) {
      throw new Error(`${label} differs for ${key}: ${a[key]} vs ${b[key]}`);
    }
  }
}

async function assertHomeDocument(origin, url) {
  const [response, cvResponse, letterResponse, pdfResponse] = await Promise.all([
    fetch(url),
    fetch(new URL('/cv/', origin)),
    fetch(new URL('/cv/letter/', origin)),
    fetch(new URL(CV_PDF.a4.href, origin))
  ]);
  if (response.status !== 200 || !(response.headers.get('content-type') ?? '').includes('text/html')) {
    throw new Error(`Home returned HTTP ${response.status} with an invalid content type`);
  }
  const html = await response.text();
  if (!html.includes('id="home"') || html.includes('Not found')) {
    throw new Error('Home route did not return the Home document');
  }
  if (!html.includes(projection.shared.professionalIdentity) || !html.includes(projection.shared.name)) {
    throw new Error('Home document is missing projected identity content');
  }
  if (html.includes('class="actions"') || html.includes('>View experience<') || html.includes('>Contact me<')) {
    throw new Error('Home document still contains the duplicated hero navigation');
  }
  if (!html.includes('>View online<') || !html.includes('>Download PDF<')
    || html.includes('>View CV<') || html.includes('>Download CV<')) {
    throw new Error('Home document does not contain the corrected CV disclosure labels');
  }
  const footerHtml = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1] ?? '';
  if (!footerHtml.includes(`<p>${projection.shared.name}</p>`)
    || !footerHtml.includes('<a href="/cv/">CV</a>')
    || (footerHtml.match(/<a\b/g) ?? []).length !== 1
    || /GitHub|LinkedIn|Download PDF|mailto:/.test(footerHtml)) {
    throw new Error('Home footer is not the minimal name and direct CV colophon');
  }
  const cvHtml = await cvResponse.text();
  const letterHtml = await letterResponse.text();
  if (!cvResponse.ok || !cvHtml.includes('id="cv-main"') || !cvHtml.includes('class="cv-actions"')
    || cvHtml.includes('class="cv-chrome"') || cvHtml.includes('>View online<')) {
    throw new Error('View online does not resolve to the built A4 CV page as a site page');
  }
  if (!letterResponse.ok || !letterHtml.includes('id="cv-main"') || !letterHtml.includes('class="cv-actions"')
    || letterHtml.includes('class="cv-chrome"') || letterHtml.includes('>View online<')) {
    throw new Error('US Letter CV is not a site page with in-flow CV actions');
  }
  if (!cvHtml.includes('class="site-header"') || !letterHtml.includes('class="site-header"')
    || !cvHtml.includes('class="primary-nav"') || !letterHtml.includes('class="primary-nav"')
    || !cvHtml.includes('class="site-footer"') || !letterHtml.includes('class="site-footer"')) {
    throw new Error('CV routes are missing the shared site header or footer');
  }
  if (!cvHtml.includes('aria-current="page">CV<') || !letterHtml.includes('aria-current="page">CV<')
    || cvHtml.includes('Back to site') || letterHtml.includes('Back to site')) {
    throw new Error('CV routes do not mark CV as current or still include a back control');
  }
  if (!cvHtml.includes('>A4 PDF<') || !cvHtml.includes('>US Letter PDF<')
    || !letterHtml.includes('>A4 PDF<') || !letterHtml.includes('>US Letter PDF<')) {
    throw new Error('CV routes are missing A4 and US Letter PDF actions');
  }
  const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer()).subarray(0, 5);
  if (!pdfResponse.ok || new TextDecoder().decode(pdfBytes) !== '%PDF-') {
    throw new Error('Download PDF does not resolve to the built A4 PDF');
  }
}

async function openAt(cdp, url, width, height, mobile, scriptExecutionDisabled = false) {
  const page = await openPage(cdp, url, {
    scriptExecutionDisabled,
    viewport: { width, height, mobile }
  });
  if (!scriptExecutionDisabled) {
    await evaluate(cdp, page.sessionId, `window.__layoutMetrics = () => {
      const clientWidth = document.documentElement.clientWidth;
      const overflowing = [];
      for (const element of document.body.querySelectorAll('*')) {
        const box = element.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        if (box.right > clientWidth + 1 || box.left < -1) {
          overflowing.push(element.getAttribute('class') || element.tagName);
        }
      }
      return {
        clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScroll: document.body.scrollWidth,
        overflowing
      };
    }`);
  }
  await sleep(75);
  return page;
}

async function scrollToY(cdp, sessionId, y, wait = 220) {
  await evaluate(cdp, sessionId, `window.scrollTo(0, ${y})`);
  await sleep(wait);
}

async function headerState(cdp, sessionId) {
  return evaluate(cdp, sessionId, `(() => {
    const header = document.querySelector('.site-header');
    const box = header?.getBoundingClientRect();
    const inner = header?.querySelector('.site-header__inner');
    const innerBox = inner?.getBoundingClientRect();
    const active = document.activeElement;
    const activeBox = active instanceof HTMLElement ? active.getBoundingClientRect() : null;
    const experience = document.querySelector('#experience');
    const experienceBox = experience?.getBoundingClientRect();
    const layout = window.__layoutMetrics?.() ?? {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      overflowing: []
    };
    return {
      hiddenClass: header?.classList.contains('site-header--hidden') ?? false,
      top: box?.top ?? -1,
      bottom: box?.bottom ?? -1,
      left: box?.left ?? -1,
      right: box?.right ?? -1,
      innerLeft: innerBox?.left ?? -1,
      innerRight: innerBox?.right ?? -1,
      transform: header ? getComputedStyle(header).transform : '',
      transitionDuration: header ? getComputedStyle(header).transitionDuration : '',
      backgroundColor: header ? getComputedStyle(header).backgroundColor : '',
      backgroundImage: header ? getComputedStyle(header).backgroundImage : '',
      borderBottomWidth: header ? getComputedStyle(header).borderBottomWidth : '',
      borderBottomStyle: header ? getComputedStyle(header).borderBottomStyle : '',
      boxShadow: header ? getComputedStyle(header).boxShadow : '',
      disclosureOpen: Boolean(header?.querySelector('details[open]')),
      focusInside: Boolean(header && active && header.contains(active)),
      focusVisible: active instanceof HTMLElement && active.matches(':focus-visible'),
      activeTop: activeBox?.top ?? -1,
      activeBottom: activeBox?.bottom ?? -1,
      scrollY,
      experienceDocumentTop: (experienceBox?.top ?? 0) + scrollY,
      ...layout
    };
  })()`);
}

function assertHeaderVisible(state, label) {
  assertHeaderSurface(state, label);
  if (state.hiddenClass || state.top < -1 || state.bottom <= 0) {
    throw new Error(`${label} is not visible: ${JSON.stringify(state)}`);
  }
}

function assertHeaderHidden(state, label) {
  assertHeaderSurface(state, label);
  if (!state.hiddenClass || state.bottom > -24) {
    throw new Error(`${label} is not fully above the viewport: ${JSON.stringify(state)}`);
  }
}

function assertHeaderSurface(state, label) {
  if (Math.abs(state.left) > 1 || Math.abs(state.right - state.clientWidth) > 1) {
    throw new Error(`${label} does not cover the viewport width: ${JSON.stringify(state)}`);
  }
  if (state.backgroundColor === 'rgba(0, 0, 0, 0)'
    || state.backgroundImage !== 'none') {
    throw new Error(`${label} does not have the opaque smooth surface: ${JSON.stringify(state)}`);
  }
  if (state.borderBottomWidth !== '1px' || state.borderBottomStyle !== 'solid'
    || state.boxShadow === 'none') {
    throw new Error(`${label} does not have a full-width rule and shadow: ${JSON.stringify(state)}`);
  }
  assertNoHorizontalOverflow(state, state.clientWidth, label);
}

async function dispatchWheel(cdp, sessionId, x, y, deltaY) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x,
    y,
    deltaX: 0,
    deltaY
  }, sessionId);
  await sleep(250);
}

async function pointerDownSelector(cdp, sessionId, selector) {
  await cdp.send('DOM.enable', {}, sessionId);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
  const box = await boxForNode(cdp, sessionId, await queryNode(cdp, sessionId, root.nodeId, selector));
  const point = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    ...point,
    button: 'left',
    clickCount: 1
  }, sessionId);
  await sleep(50);
  return point;
}

async function pointerUp(cdp, sessionId, point) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    ...point,
    button: 'left',
    clickCount: 1
  }, sessionId);
  await sleep(50);
}

async function dispatchTouchScroll(cdp, sessionId, x, y, yDistance) {
  const point = (pointY) => ({ x, y: pointY, radiusX: 1, radiusY: 1, force: 1 });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(y)]
  }, sessionId);
  for (let step = 1; step <= 8; step += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point(y - ((yDistance * step) / 8))]
    }, sessionId);
    await sleep(16);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  }, sessionId);
  await sleep(250);
}

async function assertCvOptions(cdp, sessionId, selector, label) {
  const result = await evaluate(cdp, sessionId, `(() => {
    const disclosure = document.querySelector('${selector}');
    const options = [...(disclosure?.querySelectorAll(':scope > .primary-nav__cv-options > li > a') ?? [])]
      .map((link) => ({
        text: link.textContent?.trim() ?? '',
        href: link.getAttribute('href') ?? '',
        download: link.getAttribute('download'),
        type: link.getAttribute('type'),
        visible: link.getBoundingClientRect().height > 0
      }));
    return { open: disclosure?.open ?? null, options, ...window.__layoutMetrics() };
  })()`);
  if (!result.open || JSON.stringify(result.options.map(({ text }) => text)) !== JSON.stringify(['View online', 'Download PDF'])) {
    throw new Error(`CV options are incorrect for ${label}: ${JSON.stringify(result)}`);
  }
  if (!result.options.every(({ visible }) => visible)) {
    throw new Error(`CV options are not visible for ${label}`);
  }
  const [view, download] = result.options;
  if (view.href !== '/cv/' || download.href !== CV_PDF.a4.href
    || download.download !== CV_PDF.a4.download || download.type !== 'application/pdf') {
    throw new Error(`CV options do not use the canonical A4 configuration for ${label}`);
  }
  assertNoHorizontalOverflow(result, result.clientWidth, label);
}

async function assertMobilePanel(cdp, sessionId, width, height, label) {
  const result = await evaluate(cdp, sessionId, `(() => {
    const panel = document.querySelector('.primary-nav__mobile-panel');
    const box = panel?.getBoundingClientRect();
    const inner = document.querySelector('.site-header__inner');
    const innerBox = inner?.getBoundingClientRect();
    const header = document.querySelector('.site-header');
    const headerBox = header?.getBoundingClientRect();
    const options = [...(panel?.querySelectorAll('.primary-nav__mobile-list > li > a, .primary-nav__cv--mobile > summary, .primary-nav__cv-options a') ?? [])];
    return {
      position: panel ? getComputedStyle(panel).position : '',
      left: box?.left ?? -1,
      right: box?.right ?? -1,
      top: box?.top ?? -1,
      bottom: box?.bottom ?? -1,
      innerLeft: innerBox?.left ?? -1,
      innerRight: innerBox?.right ?? -1,
      headerBottom: headerBox?.bottom ?? -1,
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      optionsRightAligned: options.every((option) => getComputedStyle(option).justifyContent === 'flex-end'),
      optionsTallEnough: options.every((option) => option.getBoundingClientRect().height >= 36),
      ...window.__layoutMetrics()
    };
  })()`);
  if (result.position !== 'absolute' || result.left < -1 || result.right > width + 1
    || result.top < -1 || result.bottom > height + 1) {
    throw new Error(`Enhanced mobile panel is outside the ${label} viewport: ${JSON.stringify(result)}`);
  }
  const panelWidth = result.right - result.left;
  const innerWidth = result.innerRight - result.innerLeft;
  if (Math.abs(result.right - result.innerRight) > 1
    || Math.abs(result.top - result.headerBottom) > 1
    || panelWidth > (13.5 * result.rootFontSize) + 1
    || panelWidth > innerWidth + 1
    || innerWidth - panelWidth < 32) {
    throw new Error(`Enhanced mobile panel is not a compact right-aligned dropdown at ${label}: ${JSON.stringify(result)}`);
  }
  if (!result.optionsRightAligned || !result.optionsTallEnough) {
    throw new Error(`Enhanced mobile panel alignment or touch targets are incorrect at ${label}: ${JSON.stringify(result)}`);
  }
  assertNoHorizontalOverflow(result, width, `Open mobile Home at ${label}`);
}

async function openMobileTree(cdp, sessionId) {
  await evaluate(cdp, sessionId, `(() => {
    const outer = document.querySelector('[data-mobile-navigation]');
    const inner = document.querySelector('.primary-nav__cv--mobile');
    if (outer) outer.open = true;
    if (inner) inner.open = true;
  })()`);
  await sleep(35);
}

async function anchorMetrics(cdp, sessionId, hash) {
  return evaluate(cdp, sessionId, `(() => {
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    const target = document.querySelector('${hash}')?.getBoundingClientRect();
    return {
      hash: location.hash,
      headerTop: header?.top ?? -1,
      headerBottom: header?.bottom ?? -1,
      targetTop: target?.top ?? -1,
      scrollY,
      maxScrollY: document.documentElement.scrollHeight - innerHeight
    };
  })()`);
}

async function disclosureState(cdp, sessionId, selector) {
  return evaluate(cdp, sessionId, `(() => {
    const disclosure = document.querySelector('${selector}');
    const summary = disclosure?.querySelector(':scope > summary');
    return {
      open: disclosure?.open ?? null,
      summaryFocused: document.activeElement === summary,
      focusVisible: summary?.matches(':focus-visible') ?? false,
      summaryUnderlined: summary ? getComputedStyle(summary).textDecorationLine.includes('underline') : false,
      focusInsideClosedContent: Boolean(
        disclosure && !disclosure.open && disclosure.contains(document.activeElement)
        && document.activeElement !== summary
      )
    };
  })()`);
}

async function assertSummaryDecoration(cdp, sessionId, selector, underlined, open, label) {
  const result = await evaluate(cdp, sessionId, `(() => {
    const summary = document.querySelector('${selector}');
    const link = document.querySelector('.primary-nav a');
    return {
      open: summary?.closest('details')?.open ?? null,
      decoration: summary ? getComputedStyle(summary).textDecorationLine : '',
      offset: summary ? getComputedStyle(summary).textUnderlineOffset : '',
      linkOffset: link ? getComputedStyle(link).textUnderlineOffset : ''
    };
  })()`);
  if (result.open !== open
    || result.decoration.includes('underline') !== underlined
    || result.offset !== result.linkOffset) {
    throw new Error(`${label} has an incorrect summary affordance: ${JSON.stringify(result)}`);
  }
}

async function activeLink(cdp, sessionId) {
  return evaluate(cdp, sessionId, `(() => ({
    text: document.activeElement?.textContent?.trim() ?? '',
    href: document.activeElement?.getAttribute?.('href') ?? '',
    focusVisible: document.activeElement?.matches?.(':focus-visible') ?? false
  }))()`);
}

async function focusSelector(cdp, sessionId, selector) {
  await evaluate(cdp, sessionId, `document.querySelector('${selector}')?.focus()`);
  await sleep(25);
}

async function activateByEnter(cdp, sessionId, selector) {
  await focusSelector(cdp, sessionId, selector);
  await pressKey(cdp, sessionId, 'Enter');
}

async function preventNextNavigation(cdp, sessionId, selector) {
  await evaluate(cdp, sessionId, `document.querySelector('${selector}')?.addEventListener(
    'click',
    (event) => event.preventDefault(),
    { once: true }
  )`);
}

async function pressKey(cdp, sessionId, key) {
  const keyMap = {
    ' ': { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 },
    Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 },
    Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 },
    Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 }
  };
  const params = keyMap[key] ?? { key, code: key };
  const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...params, text }, sessionId);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...params }, sessionId);
  await sleep(50);
}

async function clickSelector(cdp, sessionId, selector) {
  await cdp.send('DOM.enable', {}, sessionId);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
  await clickNode(cdp, sessionId, await queryNode(cdp, sessionId, root.nodeId, selector));
  await sleep(50);
}

async function clickSelectorAt(cdp, sessionId, selector, xRatio, yRatio) {
  await cdp.send('DOM.enable', {}, sessionId);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
  const box = await boxForNode(cdp, sessionId, await queryNode(cdp, sessionId, root.nodeId, selector));
  const x = box.left + ((box.right - box.left) * xRatio);
  const y = box.top + ((box.bottom - box.top) * yRatio);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x, y, button: 'left', clickCount: 1
  }, sessionId);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x, y, button: 'left', clickCount: 1
  }, sessionId);
  await sleep(50);
}

async function movePointerToSelector(cdp, sessionId, selector) {
  await movePointerToSelectorAt(cdp, sessionId, selector, 0.5, 0.5);
}

async function movePointerToSelectorAt(cdp, sessionId, selector, xRatio, yRatio) {
  await cdp.send('DOM.enable', {}, sessionId);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
  const box = await boxForNode(cdp, sessionId, await queryNode(cdp, sessionId, root.nodeId, selector));
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: box.left + ((box.right - box.left) * xRatio),
    y: box.top + ((box.bottom - box.top) * yRatio)
  }, sessionId);
  await sleep(35);
}

async function queryNode(cdp, sessionId, nodeId, selector) {
  const result = await cdp.send('DOM.querySelector', { nodeId, selector }, sessionId);
  if (!result.nodeId) throw new Error(`Could not find ${selector}`);
  return result.nodeId;
}

async function clickNode(cdp, sessionId, nodeId) {
  const box = await boxForNode(cdp, sessionId, nodeId);
  const x = (box.left + box.right) / 2;
  const y = (box.top + box.bottom) / 2;
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x, y, button: 'left', clickCount: 1
  }, sessionId);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x, y, button: 'left', clickCount: 1
  }, sessionId);
}

async function boxForNode(cdp, sessionId, nodeId) {
  const { model } = await cdp.send('DOM.getBoxModel', { nodeId }, sessionId);
  const xs = model.border.filter((_, index) => index % 2 === 0);
  const ys = model.border.filter((_, index) => index % 2 === 1);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  };
}

async function hasAttribute(cdp, sessionId, nodeId, name) {
  const { attributes } = await cdp.send('DOM.getAttributes', { nodeId }, sessionId);
  for (let index = 0; index < attributes.length; index += 2) {
    if (attributes[index] === name) return true;
  }
  return false;
}

async function computedProperty(cdp, sessionId, nodeId, name) {
  const { computedStyle } = await cdp.send('CSS.getComputedStyleForNode', { nodeId }, sessionId);
  return computedStyle.find((property) => property.name === name)?.value ?? '';
}

function assertAnchorNearHeader(metrics, hash, label) {
  if (metrics.hash !== hash) {
    throw new Error(`${label} navigation reached ${metrics.hash || 'no hash'}, expected ${hash}`);
  }
  if (Math.abs(metrics.headerTop) > 1) {
    throw new Error(`${label} did not retain the sticky header at the viewport top`);
  }
  const gap = metrics.targetTop - metrics.headerBottom;
  const constrainedByDocumentEnd = metrics.maxScrollY - metrics.scrollY <= 2 && gap >= -1;
  if (gap < -1 || (gap > 32 && !constrainedByDocumentEnd)) {
    throw new Error(`${label} has an unreasonable sticky offset gap of ${gap.toFixed(1)}px`);
  }
}

function assertNoHorizontalOverflow(metrics, width, label) {
  if (metrics.scrollWidth > metrics.clientWidth || metrics.bodyScroll > metrics.clientWidth) {
    throw new Error(
      `${label} overflows horizontally at ${width}px (scrollWidth ${Math.max(metrics.scrollWidth, metrics.bodyScroll)} > clientWidth ${metrics.clientWidth})`
    );
  }
  if (metrics.overflowing.length) {
    throw new Error(
      `${label} has elements outside the ${width}px viewport: ${metrics.overflowing.slice(0, 8).join(', ')}`
    );
  }
}
