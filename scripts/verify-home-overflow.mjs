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
const noJavaScriptWidths = [390, 320];
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

  await assertViewOnlineNavigation(cdp, homeUrl);
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
  await clickSelector(cdp, sessionId, '#home-heading');
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
    hasCvChrome: Boolean(document.querySelector('.cv-chrome')),
    hasPrimaryNav: Boolean(document.querySelector('.primary-nav'))
  }))()`);
  if (result.pathname !== '/cv/' || !result.hasCvMain || !result.hasCvChrome || result.hasPrimaryNav) {
    throw new Error(`View online did not reach the isolated A4 CV page: ${JSON.stringify(result)}`);
  }
  await cdp.send('Target.closeTarget', { targetId });
  console.log('View online keyboard navigation and CV-specific chrome verified');
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
  const cvHtml = await cvResponse.text();
  const letterHtml = await letterResponse.text();
  if (!cvResponse.ok || !cvHtml.includes('id="cv-main"') || !cvHtml.includes('class="cv-chrome"')) {
    throw new Error('View online does not resolve to the built A4 CV page with its own chrome');
  }
  if (!letterResponse.ok || !letterHtml.includes('id="cv-main"') || !letterHtml.includes('class="cv-chrome"')) {
    throw new Error('US Letter CV does not retain its own chrome');
  }
  if (cvHtml.includes('primary-nav__mobile-panel') || letterHtml.includes('primary-nav__mobile-panel')) {
    throw new Error('Home navigation leaked into a CV page');
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
    return {
      position: panel ? getComputedStyle(panel).position : '',
      left: box?.left ?? -1,
      right: box?.right ?? -1,
      top: box?.top ?? -1,
      bottom: box?.bottom ?? -1,
      ...window.__layoutMetrics()
    };
  })()`);
  if (result.position !== 'absolute' || result.left < -1 || result.right > width + 1
    || result.top < -1 || result.bottom > height + 1) {
    throw new Error(`Enhanced mobile panel is outside the ${label} viewport: ${JSON.stringify(result)}`);
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
