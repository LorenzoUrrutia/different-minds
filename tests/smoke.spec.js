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
