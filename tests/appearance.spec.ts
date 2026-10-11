import { test, expect } from '@playwright/test';

for (const saved of ['classic', 'industrial', 'invalid', null]) {
  test(`Industrial renders before paint regardless of obsolete preference ${saved}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(value => {
      if (value === null) localStorage.removeItem('jv-ui-variant');
      else localStorage.setItem('jv-ui-variant', value);
      new MutationObserver((_, observer) => {
        if (document.querySelector('h1')) {
          (window as Window & { firstTheme?: string }).firstTheme = document.documentElement.dataset.theme;
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    }, saved);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'jointventure-industrial');
    expect(await page.evaluate(() => (window as Window & { firstTheme?: string }).firstTheme)).toBe('jointventure-industrial');
    await expect(page.getByRole('group', { name: 'Appearance', exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('Industrial works without storage and mobile navigation has no appearance controls', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw Error('Unavailable'); } }); });
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/facility');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('#mobile-navigation').getByRole('link')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /^(Classic|Industrial)$/ })).toHaveCount(0);
  await page.locator('#mobile-navigation').getByRole('link', { name: 'Project', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'jointventure-industrial');
});

for (const width of [320, 390, 768, 1440]) {
  test(`all routes and hero content fit ${width}px with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('https://api.devnet.solana.com', route => route.fulfill({ json: { jsonrpc: '2.0', id: route.request().postDataJSON().id, error: { code: -32005, message: 'Layout fixture unavailable' } } }));
    for (const route of ['/', '/projects', '/projects/bavaria', '/facility', '/documents', '/portfolio']) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (route === '/') {
        for (const selector of ['.overview-copy', '.overview-facility', '.business-metrics', '.dashboard-shortcuts']) {
          const bounds = await page.locator(selector).boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        }
      }

    }
  });
}
