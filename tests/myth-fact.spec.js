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

test.describe('Myth/Fact cards with a third answer and citations', () => {
  test('a visitor answers "It\'s complicated" on the ADHD overdiagnosis card with the keyboard', async ({ page }) => {
    await page.goto('/adhd.html');
    const card = page.locator('.myth-fact-card.is-active');
    await expect(card.locator('.myth-fact-statement')).toHaveText('ADHD is overdiagnosed');

    // Tab from Myth through Fact to the third answer, then press Enter.
    await card.getByRole('button', { name: 'Myth' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const complicated = card.getByRole('button', { name: "It's complicated" });
    await expect(complicated).toBeFocused();
    await expect(complicated).toHaveAccessibleDescription('ADHD is overdiagnosed');
    await page.keyboard.press('Enter');

    // Feedback is in words (not just color), and focus lands on Next, which reads it out.
    const next = card.locator('.myth-fact-next');
    await expect(next).toBeFocused();
    await expect(card.locator('.myth-fact-result')).toHaveText("✓ Correct: It's complicated.");
    await expect(next).toHaveAccessibleDescription(/^✓ Correct: It's complicated\. Both overdiagnosis and underdiagnosis happen/);

    // Citations in the explanation are real links to this page's Sources section.
    const cites = card.locator('.myth-fact-explanation a.cite');
    await expect(cites).toHaveCount(4);
    await expect(card.getByRole('link', { name: 'Source 11b' })).toHaveAttribute('href', '#source-11b');
    await expect(page.locator('#source-11b')).toContainText('Kazda');

    // Shift+Tab from Next reaches the citation links on the back of the card.
    await page.keyboard.press('Shift+Tab');
    await expect(card.getByRole('link', { name: 'Source 7' })).toBeFocused();

    const results = await new AxeBuilder({ page })
      .include('.myth-fact-grid')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    // Following a citation with Enter moves focus to that entry in the Sources list.
    await page.keyboard.press('Enter');
    await expect(page.locator('#source-7')).toBeFocused();
    await expect(page.locator('#source-7')).toContainText('APSARD');
  });

  test('a wrong answer on the overdiagnosis card names "It\'s complicated" as correct', async ({ page }) => {
    await page.goto('/adhd.html');
    const card = page.locator('.myth-fact-card.is-active');
    await card.getByRole('button', { name: 'Myth' }).click();
    await expect(card.locator('.myth-fact-result')).toHaveText("Incorrect. Correct answer: It's complicated.");
  });

  test('cards without a third answer still show only Myth and Fact', async ({ page }) => {
    await page.goto('/adhd.html');
    const others = page.locator('.myth-fact-card:not([data-correct="complicated"])');
    expect(await others.count()).toBeGreaterThan(0);
    await expect(others.locator('.myth-fact-choice[data-choice="complicated"]')).toHaveCount(0);
  });

  test('"Dyslexia only occurs in the English language" is a Myth', async ({ page }) => {
    await page.goto('/dyslexia.html');
    const card = page.locator('.myth-fact-card', { hasText: 'Dyslexia only occurs in the English language' });
    await expect(card).toHaveAttribute('data-correct', 'myth');

    // Walk to the card with Next, then answer Myth.
    while (!(await card.evaluate((c) => c.classList.contains('is-active')))) {
      const active = page.locator('.myth-fact-card.is-active');
      await active.getByRole('button', { name: 'Myth' }).click();
      await active.locator('.myth-fact-next').click();
    }
    await card.getByRole('button', { name: 'Myth' }).click();
    await expect(card.locator('.myth-fact-result')).toHaveText('✓ Correct: Myth.');
    await expect(card.getByRole('link', { name: 'Source 14' })).toBeVisible();
  });
});
