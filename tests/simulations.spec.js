// @ts-check
// Safety checks for the simulations (sim-*.html). See CLAUDE.md:
// the simulations are intentionally difficult; these tests check the safety
// layer around them (warning, Esc pause/exit, flashing cap, calmer version,
// screen-reader description) and run axe once each simulation is running.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoAxeViolations(page) {
  // Check the settled screen the student reads, not a frame mid fade-in.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`
  );
  expect(summary, summary.join('\n')).toEqual([]);
}

// Each simulation: its page, what proves it has (not) started, and how to read its paused state.
const SIMS = [
  {
    name: 'ADHD',
    file: 'sim-adhd.html',
    started: (page) => expect(page.locator('#question-text')).not.toBeEmpty(),
    notStarted: async (page) => {
      await expect(page.locator('#question-text')).toBeEmpty();
      expect(await page.locator('#adhdAmbientAudio').evaluate((a) => /** @type {HTMLAudioElement} */ (a).paused)).toBe(true);
    },
  },
  {
    name: 'Dyslexia',
    file: 'sim-dyslexia.html',
    started: (page) => expect(page.locator('#paper-content .char').first()).toBeVisible(),
    notStarted: (page) => expect(page.locator('#paper-content')).toBeEmpty(),
  },
  {
    name: 'Dyscalculia',
    file: 'sim-dyscalculia.html',
    started: (page) => expect(page.locator('#operatorEl')).toBeVisible(),
    notStarted: (page) => expect(page.locator('#simTaskArea')).toBeEmpty(),
  },
];

// The sim scripts keep their state in top-level `let` variables (e.g. `paused`),
// which aren't properties of window. Tests read them with eval() inside the test
// browser only, on fixed strings, never on the site itself.
const isPaused = (page) => page.evaluate(() => /* global from the sim script */ eval('paused'));

async function start(page, sim, mode = 'standard') {
  await page.goto(`/${sim.file}`);
  await page.locator(`#simWarning [data-start="${mode}"]`).click();
  await sim.started(page);
}

for (const sim of SIMS) {
  test.describe(`${sim.name} simulation`, () => {
    test('shows a warning first, and nothing runs until Start', async ({ page }) => {
      await page.goto(`/${sim.file}`);
      const warning = page.getByRole('dialog', { name: new RegExp(`Before you start: ${sim.name}`) });
      await expect(warning).toBeVisible();
      await expect(warning.getByRole('button', { name: 'Start', exact: true })).toBeFocused();
      await expect(warning.getByRole('button', { name: 'Start calmer version' })).toBeVisible();
      await expect(warning.getByRole('link', { name: 'Go back' })).toHaveAttribute('href', 'simulations.html');
      await expect(warning).toContainText('Esc');
      // Background can't be reached while the warning is open.
      expect(await page.locator('main').evaluate((m) => /** @type {HTMLElement} */ (m).inert)).toBe(true);
      await page.waitForTimeout(500);
      await sim.notStarted(page);

      await warning.getByRole('button', { name: 'Start', exact: true }).click();
      await expect(warning).toHaveCount(0);
      await sim.started(page);
      expect(await page.locator('main').evaluate((m) => /** @type {HTMLElement} */ (m).inert)).toBe(false);
    });

    test('has a screen-reader description of what it shows', async ({ page }) => {
      await page.goto(`/${sim.file}`);
      const desc = page.locator('#simDescription');
      await expect(desc).toHaveClass(/sr-only/);
      expect((await desc.textContent() || '').trim().length).toBeGreaterThan(80);
    });

    test('has no axe violations once running', async ({ page }) => {
      await start(page, sim);
      await page.waitForTimeout(300);
      await expectNoAxeViolations(page);
    });

    test('Esc pauses with a menu; Esc resumes; Exit leaves', async ({ page }) => {
      await start(page, sim);
      expect(await isPaused(page)).toBe(false);

      await page.keyboard.press('Escape');
      const menu = page.getByRole('dialog', { name: 'Simulation paused' });
      await expect(menu).toBeVisible();
      await expect(menu.getByRole('button', { name: 'Resume' })).toBeFocused();
      expect(await isPaused(page)).toBe(true);
      await expectNoAxeViolations(page);

      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      expect(await isPaused(page)).toBe(false);

      await page.keyboard.press('Escape');
      await menu.getByRole('link', { name: 'Exit simulation' }).click();
      await expect(page).toHaveURL(/simulations\.html$/);
    });

    test('Restart in the pause menu goes back to the warning', async ({ page }) => {
      await start(page, sim);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Restart from the beginning' }).click();
      await expect(page.getByRole('dialog', { name: /Before you start/ })).toBeVisible();
    });

    test('calmer version is offered and is the default with reduced motion', async ({ browser }) => {
      const normal = await browser.newPage();
      await normal.goto(`/${sim.file}`);
      await expect(normal.locator('#simWarning .sim-safety-btn--primary')).toHaveAttribute('data-start', 'standard');
      await normal.close();

      const ctx = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(`/${sim.file}`);
      const primary = page.locator('#simWarning .sim-safety-btn--primary');
      await expect(primary).toHaveAttribute('data-start', 'calm');
      await expect(primary).toBeFocused();
      await expect(page.locator('#simWarning')).toContainText('reduce motion');
      await page.keyboard.press('Enter');
      await sim.started(page);
      await expect(page.locator('body')).toHaveClass(/sim-calm/);
      expect(await page.evaluate(() => window.SimSafety.calm)).toBe(true);
      await ctx.close();
    });
  });
}

test.describe('ADHD simulation details', () => {
  const sim = SIMS[0];

  test('warning mentions the classroom sound', async ({ page }) => {
    await page.goto('/sim-adhd.html');
    await expect(page.locator('#simWarning')).toContainText(/classroom background sound/i);
    await expect(page.locator('#simWarning')).toContainText(/Mute/);
  });

  test('Mute turns the sound off without pausing', async ({ page }) => {
    await start(page, sim);
    const mute = page.locator('#muteBtn');
    const audio = page.locator('#adhdAmbientAudio');
    await expect(mute).toHaveText('Mute');
    await mute.click();
    await expect(mute).toHaveText('Unmute');
    expect(await audio.evaluate((a) => /** @type {HTMLAudioElement} */ (a).muted)).toBe(true);
    expect(await isPaused(page)).toBe(false);
    await mute.click();
    await expect(mute).toHaveText('Mute');
    expect(await audio.evaluate((a) => /** @type {HTMLAudioElement} */ (a).muted)).toBe(false);
  });

  test('pausing stops new distractions; resuming brings them back', async ({ page }) => {
    await start(page, sim);
    await page.keyboard.press('Escape');
    await page.evaluate(() => eval('nextToastTime = 0'));
    await page.waitForTimeout(500);
    await expect(page.locator('#toastLayer .toast')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#toastLayer .toast')).toHaveCount(1);
  });

  test('pause menu does not undo a pause made with the Pause button', async ({ page }) => {
    await start(page, sim);
    await page.locator('#pauseBtn').click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    expect(await isPaused(page)).toBe(true);
  });

  test('interruption is a real dialog: focus moves in, Esc closes it, focus returns', async ({ page }) => {
    await start(page, sim);
    const firstAnswer = page.locator('#answer-buttons button').first();
    await firstAnswer.focus();
    await page.evaluate(() => eval('showInterrupt()'));

    const dialog = page.getByRole('dialog', { name: 'Quick interruption' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Dismiss' })).toBeFocused();
    // Tab never reaches the page behind (it may move on to the browser's own UI, like a native dialog).
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      const outside = await page.evaluate(() => {
        const a = document.activeElement;
        return !!a && a !== document.body && !a.closest('#interruptOverlay');
      });
      expect(outside).toBe(false);
    }
    await dialog.getByRole('button', { name: 'Dismiss' }).focus();
    await expectNoAxeViolations(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Simulation paused' })).toBeHidden();
    await expect(firstAnswer).toBeFocused();
  });

  test('screen shake never happens more than 3 times per second (Strong)', async ({ page }) => {
    await start(page, sim);
    await page.evaluate(() => {
      Math.random = () => 0; // shortest possible gaps
      // @ts-ignore
      window.__shakes = [];
      new MutationObserver(() => {
        // @ts-ignore
        if (document.body.classList.contains('sim-shake')) window.__shakes.push(performance.now());
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    });
    await page.locator('#intensitySelect').selectOption('strong');
    await page.waitForTimeout(4000);
    // @ts-ignore
    const times = await page.evaluate(() => window.__shakes);
    expectAtMostPerSecond(times, 3);
  });

  test('calmer version keeps the toasts but drops the shake and slide-in', async ({ page }) => {
    await start(page, sim, 'calm');
    await page.evaluate(() => eval('spawnToast()'));
    const toast = page.locator('#toastLayer .toast').first();
    await expect(toast).toBeVisible();
    expect(await toast.evaluate((t) => getComputedStyle(t).animationName)).toBe('none');
    expect(await page.evaluate(() => getComputedStyle(document.body).animationName)).toBe('none');
  });
});

test.describe('Dyslexia simulation details', () => {
  const sim = SIMS[1];

  async function countJitterChanges(page, ms) {
    return page.evaluate(async (ms) => {
      const el = document.querySelector('#paper-content .char');
      let last = el.style.transform;
      let changes = 0;
      const end = performance.now() + ms;
      while (performance.now() < end) {
        await new Promise((r) => requestAnimationFrame(r));
        if (el.style.transform !== last) { changes++; last = el.style.transform; }
      }
      return changes;
    }, ms);
  }

  test('has a Pause button that stops the letters moving', async ({ page }) => {
    await start(page, sim);
    const pause = page.getByRole('button', { name: 'Pause' });
    await pause.click();
    await expect(page.locator('#pauseBtn')).toHaveText('Resume');
    expect(await isPaused(page)).toBe(true);
    expect(await countJitterChanges(page, 500)).toBe(0);
    await page.locator('#pauseBtn').click();
    expect(await countJitterChanges(page, 500)).toBeGreaterThan(5);
  });

  test('Esc pause stops the letters moving', async ({ page }) => {
    await start(page, sim);
    await page.keyboard.press('Escape');
    expect(await countJitterChanges(page, 500)).toBe(0);
  });

  test('calmer version moves the letters much less often', async ({ page }) => {
    await start(page, sim, 'calm');
    expect(await countJitterChanges(page, 2000)).toBeLessThanOrEqual(4);
  });
});

test.describe('Dyscalculia simulation details', () => {
  const sim = SIMS[2];

  // Force a swap chance on every tick and record each time the operator changes.
  async function recordSwaps(page, ms) {
    return page.evaluate(async (ms) => {
      Math.random = () => 0.01;
      const op = document.getElementById('operatorEl');
      const original = op.dataset.original;
      const times = [];
      let swapped = false;
      const obs = new MutationObserver(() => {
        const isSwapped = op.textContent !== original;
        if (isSwapped && !swapped) times.push(performance.now());
        swapped = isSwapped;
      });
      obs.observe(op, { childList: true, characterData: true, subtree: true });
      await new Promise((r) => setTimeout(r, ms));
      obs.disconnect();
      return times;
    }, ms);
  }

  for (const level of ['mild', 'medium', 'high']) {
    test(`symbol swaps never exceed 3 per second (${level})`, async ({ page }) => {
      await start(page, sim);
      await page.locator('#intensitySelect').selectOption(level);
      const times = await recordSwaps(page, 3000);
      expect(times.length).toBeGreaterThan(2); // the effect is still there
      expectAtMostPerSecond(times, 3);
    });
  }

  test('calmer version: at most 2 symbol swaps per second', async ({ page }) => {
    await start(page, sim, 'calm');
    await page.locator('#intensitySelect').selectOption('high');
    const times = await recordSwaps(page, 3000);
    expect(times.length).toBeGreaterThan(0);
    expectAtMostPerSecond(times, 2);
  });

  test('Esc pause stops the symbol swapping', async ({ page }) => {
    await start(page, sim);
    await page.locator('#intensitySelect').selectOption('high');
    await page.keyboard.press('Escape');
    const times = await recordSwaps(page, 1000);
    expect(times).toEqual([]);
  });
});

function expectAtMostPerSecond(times, max) {
  for (let i = 0; i < times.length; i++) {
    const inWindow = times.filter((t) => t >= times[i] && t < times[i] + 1000).length;
    expect(inWindow, `events at ${times.map((t) => Math.round(t)).join(', ')}`).toBeLessThanOrEqual(max);
  }
}
