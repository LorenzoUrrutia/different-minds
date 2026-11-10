// @ts-check
const { test, expect } = require('@playwright/test');
const pages = require('./pages');

for (const page of pages) {
  test(`${page} loads without errors and has a title, h1 and lang`, async ({ page: p }) => {
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await p.goto(`/${page}`);
    await expect(p).toHaveTitle(/.+/);
    await expect(p.locator('html')).toHaveAttribute('lang', /.+/);
    await expect(p.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('main nav links all resolve', async ({ page }) => {
  await page.goto('/index.html');
  const hrefs = await page.locator('nav.topnav a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await page.request.get(`/${href}`);
    expect(res.status(), href).toBe(200);
  }
});

test('nav is keyboard reachable with a visible focus indicator', async ({ page }) => {
  await page.goto('/index.html');
  const link = page.locator('nav.topnav a').first();
  await link.focus();
  await expect(link).toBeFocused();
  const outline = await link.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow };
  });
  expect(outline.style !== 'none' && outline.width > 0 || outline.shadow !== 'none').toBe(true);
});

// Same-page links (like citations) glide smoothly, but jump instantly when the
// visitor's device asks for reduced motion.
for (const motion of ['reduce', 'no-preference']) {
  test(`same-page links respect prefers-reduced-motion: ${motion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.addInitScript(() => {
      const original = Element.prototype.scrollIntoView;
      // @ts-ignore
      window.__scrollCalls = [];
      Element.prototype.scrollIntoView = function (opts) {
        // @ts-ignore
        window.__scrollCalls.push(opts && typeof opts === 'object' ? opts.behavior : undefined);
        return original.call(this, opts);
      };
    });
    await page.goto('/adhd.html');
    await page.locator('#what-is a.cite').first().click();
    // @ts-ignore
    const calls = await page.evaluate(() => window.__scrollCalls);
    expect(calls).toEqual([motion === 'reduce' ? 'auto' : 'smooth']);
    if (motion === 'reduce') {
      // No animation: the source is already in view right after the click.
      await expect(page.locator('#source-5')).toBeInViewport();
    }
    await expect(page.locator('#source-5')).toBeFocused();
  });
}
