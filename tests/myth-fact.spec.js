// @ts-check
// The Myth/Fact flip-card quiz on the three topic pages.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

for (const file of ['adhd.html', 'dyslexia.html', 'dyscalculia.html']) {
  test.describe(`Myth/Fact quiz on ${file}`, () => {
    test('works with the keyboard and a screen reader', async ({ page }) => {
      await page.goto(`/${file}`);
      const card = page.locator('.myth-fact-card.is-active');
      const myth = card.getByRole('button', { name: 'Myth' });
      const next = card.locator('.myth-fact-next');

      // Before answering only the front is reachable, and choices are described by the statement.
      // (The back face is hidden with backface-visibility, which Playwright can't see,
      // so check reachability: it is inert and Tab skips it.)
      expect(await next.evaluate((b) => !!b.closest('[inert]'))).toBe(true);
      await card.getByRole('button', { name: 'Fact' }).focus();
      await page.keyboard.press('Tab');
      await expect(next).not.toBeFocused();
      const statement = (await card.locator('.myth-fact-statement').textContent() || '').trim();
      await expect(myth).toHaveAccessibleDescription(statement);

      // Answer with the keyboard: focus moves to Next, which reads out the feedback in words.
      await myth.focus();
      await page.keyboard.press('Enter');
      await expect(next).toBeFocused();
      await expect(next).toHaveAccessibleDescription(/^(✓ )?(Correct|Incorrect)\b.+/);
      expect(await myth.evaluate((b) => !!b.closest('[inert]'))).toBe(true);

      const results = await new AxeBuilder({ page })
        .include('.myth-fact-grid')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);

      // Next: focus moves to the next card's first choice.
      await page.keyboard.press('Enter');
      const nextCard = page.locator('.myth-fact-card.is-active');
      await expect(nextCard.getByRole('button', { name: 'Myth' })).toBeFocused();
      await expect(nextCard.getByRole('button', { name: 'Myth' })).toBeVisible();
    });

    test('text is not clipped at 200% text size', async ({ page }) => {
      await page.goto(`/${file}`);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const cards = page.locator('.myth-fact-card');
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        // Show each card's front and back in turn and check nothing overflows.
        const overflow = await cards.nth(i).evaluate((card) => {
          card.classList.add('is-active');
          const faces = Array.from(card.querySelectorAll('.myth-fact-face'));
          const back = card.querySelector('.myth-fact-explanation');
          if (back) back.textContent = card.getAttribute('data-explanation');
          return faces.map((f) => f.scrollHeight - f.clientHeight);
        });
        for (const o of overflow) expect(o).toBeLessThanOrEqual(1);
      }
    });
  });
}
