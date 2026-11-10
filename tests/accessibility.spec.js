// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const pages = require('./pages');

for (const page of pages) {
  test(`${page} has no axe WCAG A/AA violations`, async ({ page: p }) => {
    await p.goto(`/${page}`);
    const results = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
}
