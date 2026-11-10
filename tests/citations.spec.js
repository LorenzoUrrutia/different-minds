// @ts-check
// Every numbered citation ([5], [11b], ...) must link to an entry in that page's Sources list.
const { test, expect } = require('@playwright/test');
const pages = require('./pages');

for (const file of pages) {
  test(`${file}: every citation points to a source listed on the page`, async ({ page }) => {
    await page.goto(`/${file}`);
    const { cited, listed, badLinks } = await page.evaluate(() => {
      const ids = new Set();
      // Citation links already in the page.
      document.querySelectorAll('a.cite').forEach((a) => ids.add((a.getAttribute('href') || '').replace('#source-', '')));
      const badLinks = Array.from(document.querySelectorAll('a.cite'))
        .filter((a) => !/^#source-\d+[a-z]?$/.test(a.getAttribute('href') || '') || !/^Source \d+[a-z]?$/.test(a.getAttribute('aria-label') || ''))
        .map((a) => a.outerHTML);
      // Citations inside Myth/Fact explanations become links once a card is answered.
      document.querySelectorAll('[data-explanation]').forEach((el) => {
        for (const m of (el.getAttribute('data-explanation') || '').matchAll(/\[(\d+[a-z]?)\]/g)) ids.add(m[1]);
      });
      const listed = Array.from(document.querySelectorAll('.sources-list li[id^="source-"]')).map((li) => li.id.replace('source-', ''));
      return { cited: Array.from(ids).sort(), listed, badLinks };
    });
    expect(badLinks).toEqual([]);
    for (const id of cited) expect(listed, `[${id}] is cited but not in the Sources list`).toContain(id);
    for (const id of listed) expect(cited, `[${id}] is listed but never cited`).toContain(id);
  });
}
