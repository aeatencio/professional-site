import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Home grid allows shrinking so the page does not overflow on small screens', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

  assert.match(css, /\.page \{[\s\S]*?max-width:\s*100%/);
  assert.match(css, /\.page > \* \{[\s\S]*?min-width:\s*0/);
  assert.match(css, /h1 \{[\s\S]*?overflow-wrap:\s*break-word/);
  assert.match(css, /\.actions \{[\s\S]*?max-width:\s*var\(--measure\)/);
  assert.match(css, /\.chapter \{[\s\S]*?min-width:\s*0/);
});

test('Home mobile composition stacks copy, illustration and actions deliberately', async () => {
  const [css, page, pkg, overflow, workflow] = await Promise.all([
    readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/verify-home-overflow.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
  ]);

  assert.ok(page.indexOf('class="hero-art"') < page.indexOf('class="actions"'));
  assert.match(page, />Download CV</);
  assert.equal(page.includes('Download A4 CV'), false);

  assert.match(css, /\.chapter--home \.hero-art[\s\S]*?grid-row:\s*auto/);
  assert.match(
    css,
    /@media \(max-width: 54rem\) \{[\s\S]*?\.chapter--home \.actions \{[\s\S]*?flex-direction:\s*column/
  );
  assert.match(
    css,
    /@media \(max-width: 44rem\) \{[\s\S]*?\.primary-nav ul \{[\s\S]*?max-width:\s*22rem/
  );
  assert.match(
    css,
    /@media \(max-width: 22\.5rem\) \{[\s\S]*?\.hero-art \{[\s\S]*?width:\s*min\(52vw, 9\.75rem\)/
  );

  assert.match(pkg, /"layout:check": "npm run build && node scripts\/verify-home-overflow\.mjs"/);
  assert.match(overflow, /const widths = \[390, 320\]/);
  assert.match(overflow, /Home returned HTTP/);
  assert.match(overflow, /professionalIdentity/);
  assert.match(overflow, /Download CV/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm run layout:check/);
});
