import { CV_PDF_ENVIRONMENT } from './cv-pdf.mjs';
import { evaluate } from './headless-chrome.mjs';

/**
 * Minimum distance between the lowest visible CV content of each printed
 * column and the bottom edge of the page. The printed `.cv-page` has a fixed
 * height and visible overflow, and the secondary column is anchored out of
 * flow, so content can run into the nominal bottom margin without overflowing
 * the page. Only a measurement of the rendered text catches that.
 */
export const CV_PRINT_MIN_BOTTOM_MM = 9;

export const CV_PRINT_COLUMNS = {
  primary: ['.cv-masthead', '.cv-profile', '.cv-primary'],
  secondary: ['.cv-contact', '.cv-technical', '.cv-secondary']
};

const CANONICAL_FONT_FAMILIES = ['Georgia', 'Segoe UI'];

/**
 * Measures the printed CV in a page whose media is already emulated as print.
 * Each column reports its lowest rendered line of text (or replaced element).
 * Decorative rules are CSS pseudo-elements or empty spans, so they never count.
 */
export async function measureCvPrintSafeArea(cdp, sessionId) {
  const measurement = await evaluate(cdp, sessionId, `(() => {
    const pxPerMm = 96 / 25.4;
    const columns = ${JSON.stringify(CV_PRINT_COLUMNS)};
    const page = document.querySelector('#cv-main.cv-page');
    if (!page) return { error: 'missing #cv-main.cv-page' };
    const pageRect = page.getBoundingClientRect();

    const isVisible = (element) => {
      for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return false;
        }
      }
      return true;
    };

    const lowestIn = (selectors) => {
      let lowest = null;
      const consider = (bottom, text, element) => {
        if (!lowest || bottom > lowest.bottom) {
          const clean = text.replace(/\\s+/g, ' ').trim();
          lowest = {
            bottom,
            text: clean.length > 60 ? '…' + clean.slice(-60) : clean,
            element: element.tagName.toLowerCase()
              + (element.classList.length ? '.' + [...element.classList].join('.') : '')
          };
        }
      };
      for (const selector of selectors) {
        const root = document.querySelector(selector);
        if (!root || !isVisible(root)) continue;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim() || !isVisible(node.parentElement)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
          if (!rects.length) continue;
          const bottom = Math.max(...rects.map((rect) => rect.bottom));
          const block = node.parentElement.closest('p, li, dd, dt, h1, h2, h3, address') ?? node.parentElement;
          consider(bottom, block.textContent, block);
        }
        for (const element of root.querySelectorAll('img, svg, video, canvas')) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && isVisible(element)) {
            consider(rect.bottom, element.getAttribute('alt') ?? element.tagName, element);
          }
        }
      }
      return lowest;
    };

    const result = {
      pathname: location.pathname,
      format: document.querySelector('[data-cv-format]')?.getAttribute('data-cv-format') ?? '',
      pageHeightMm: pageRect.height / pxPerMm,
      platform: navigator.userAgent,
      columns: {}
    };
    for (const [name, selectors] of Object.entries(columns)) {
      const lowest = lowestIn(selectors);
      result.columns[name] = lowest && {
        ...lowest,
        bottomMarginMm: (pageRect.bottom - lowest.bottom) / pxPerMm
      };
    }
    return result;
  })()`);
  measurement.fonts = await renderedFontFamilies(cdp, sessionId);
  return measurement;
}

// Families Chrome actually rendered for the name, the body copy and a bold
// title. Generic-family probes cannot reveal this: in the canonical environment
// every family, generic ones included, resolves to Georgia or Segoe UI.
async function renderedFontFamilies(cdp, sessionId) {
  await cdp.send('DOM.enable', {}, sessionId);
  await cdp.send('CSS.enable', {}, sessionId);
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 }, sessionId);
  const families = new Set();
  for (const selector of ['#cv-main h1', '#cv-main .cv-profile p', '#cv-main .cv-role-title']) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector }, sessionId);
    if (!nodeId) continue;
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }, sessionId);
    for (const font of fonts) families.add(font.familyName);
  }
  return [...families].sort();
}

/** True when the page renders with the platform and fonts the canonical PDFs use. */
export function isCanonicalCvPrintEnvironment(measurement) {
  return Boolean(measurement.platform?.includes(CV_PDF_ENVIRONMENT.platform))
    && JSON.stringify(measurement.fonts) === JSON.stringify(CANONICAL_FONT_FAMILIES);
}

export function formatCvPrintSafeArea(measurement) {
  if (measurement.error) return measurement.error;
  return Object.entries(measurement.columns)
    .map(([name, column]) => column
      ? `${name} ${column.bottomMarginMm.toFixed(1)}mm (“${column.text}”)`
      : `${name} missing`)
    .join('; ');
}

export function assertCvPrintSafeArea(measurement, label, minimumMm = CV_PRINT_MIN_BOTTOM_MM) {
  if (measurement.error) {
    throw new Error(`${label}: ${measurement.error}`);
  }
  for (const name of Object.keys(CV_PRINT_COLUMNS)) {
    const column = measurement.columns?.[name];
    if (!column) {
      throw new Error(`${label}: the ${name} CV column has no visible content to measure`);
    }
    if (!(column.bottomMarginMm >= minimumMm)) {
      throw new Error(
        `${label}: the ${name} column ends ${column.bottomMarginMm.toFixed(1)}mm above the page bottom `
        + `(“${column.text}” in ${column.element}); keep at least ${minimumMm}mm. `
        + 'Tighten the vertical rhythm or the copy rather than the type.'
      );
    }
  }
}
