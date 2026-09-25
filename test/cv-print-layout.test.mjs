import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CV_PRINT_COLUMNS,
  CV_PRINT_MIN_BOTTOM_MM,
  assertCvPrintSafeArea,
  formatCvPrintSafeArea,
  isCanonicalCvPrintEnvironment
} from '../lib/cv-print-layout.mjs';

const linux = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36';

function measurement(primary, secondary) {
  const column = (bottomMarginMm) => bottomMarginMm === null ? null : {
    bottom: 1000,
    bottomMarginMm,
    text: 'Technologies: C#, ASP.NET, Visual Basic, SQL Server',
    element: 'p.cv-technologies'
  };
  return {
    pathname: '/cv/',
    format: 'a4',
    platform: linux,
    fonts: ['Georgia', 'Segoe UI'],
    columns: { primary: column(primary), secondary: column(secondary) }
  };
}

test('printed CV columns keep a real bottom margin of at least 9mm', () => {
  assert.equal(CV_PRINT_MIN_BOTTOM_MM, 9);
  assert.deepEqual(Object.keys(CV_PRINT_COLUMNS), ['primary', 'secondary']);
  assert.doesNotThrow(() => assertCvPrintSafeArea(measurement(9, 10.4), '/cv/'));
  assert.throws(
    () => assertCvPrintSafeArea(measurement(10.2, 4.4), '/es/cv/'),
    /\/es\/cv\/: the secondary column ends 4\.4mm above the page bottom .*keep at least 9mm/
  );
  assert.throws(() => assertCvPrintSafeArea(measurement(8.99, 12), '/cv/'), /primary column ends 9\.0mm/);
  assert.throws(() => assertCvPrintSafeArea(measurement(12, null), '/cv/'), /secondary CV column has no visible content/);
  assert.throws(() => assertCvPrintSafeArea({ error: 'missing #cv-main.cv-page' }, '/cv/'), /missing #cv-main/);
  assert.match(formatCvPrintSafeArea(measurement(10.25, 11)), /^primary 10\.3mm \(“Technologies: .*”\); secondary 11\.0mm/);
});

test('the bottom margin is enforced only with the canonical platform and fonts', () => {
  assert.equal(isCanonicalCvPrintEnvironment(measurement(10, 10)), true);
  assert.equal(isCanonicalCvPrintEnvironment({ ...measurement(10, 10), fonts: ['DejaVu Sans', 'DejaVu Serif'] }), false);
  assert.equal(isCanonicalCvPrintEnvironment({ ...measurement(10, 10), fonts: ['Segoe UI'] }), false);
  assert.equal(isCanonicalCvPrintEnvironment({
    ...measurement(10, 10),
    platform: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0'
  }), false);
});

test('PDF generation and the layout check both measure the printed bottom margin', async () => {
  const [generator, layoutCheck, cvCss] = await Promise.all([
    readFile(new URL('../scripts/generate-cv-pdfs.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/verify-home-overflow.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/cv.css', import.meta.url), 'utf8')
  ]);
  assert.match(generator, /measureCvPrintSafeArea\(cdp, sessionId\)[\s\S]*?assertCvPrintSafeArea\(safeArea, pdf\.route\)[\s\S]*?Page\.printToPDF/);
  assert.match(layoutCheck, /Emulation\.setEmulatedMedia', \{ media: 'print' \}[\s\S]*?measureCvPrintSafeArea[\s\S]*?assertCvPrintSafeArea\(measurement, label\)/);

  // Spanish papers recover room with vertical rhythm, never with smaller type.
  const spanishRules = [...cvCss.matchAll(/\.cv-document\[data-cv-format="(?:a4|letter)"\]:lang\(es\) \{([^}]*)\}/g)];
  assert.equal(spanishRules.length, 2);
  for (const [, body] of spanishRules) {
    const properties = [...body.matchAll(/(--[\w-]+):/g)].map(([, name]) => name);
    assert.ok(properties.length > 0);
    assert.ok(properties.every((name) => /^--cv-(masthead|stack|role|edu)-gap$/.test(name)), properties.join(', '));
  }
});
