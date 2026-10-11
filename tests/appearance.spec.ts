import { test, expect } from '@playwright/test';

for (const saved of ['classic', 'industrial', 'invalid', null]) {
  test(`restores ${saved} before content paint without hydration errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(value => {
      if (value === null) localStorage.removeItem('jv-ui-variant');
      else localStorage.setItem('jv-ui-variant', value);
      new MutationObserver((_, observer) => {
        if (document.querySelector('h1')) {
          (window as Window & { firstAppearance?: string }).firstAppearance = document.documentElement.dataset.uiVariant;
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    }, saved);
    await page.goto('/');
    const variant = saved === 'industrial' ? 'industrial' : 'classic';
    await expect(page.locator('html')).toHaveAttribute('data-ui-variant', variant);
    await expect(page.getByRole('button', { name: variant === 'industrial' ? 'Industrial' : 'Classic', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => (window as Window & { firstAppearance?: string }).firstAppearance)).toBe(variant);
    expect(errors).toEqual([]);
  });
}

test('unavailable storage defaults safely and allows keyboard switching', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto('/projects');
  await expect(page.locator('html')).toHaveAttribute('data-ui-variant', 'classic');
  const industrial = page.getByRole('button', { name: 'Industrial', exact: true });
  await industrial.focus();
  await page.keyboard.press('Enter');
  await expect(industrial).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Classic', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-ui-variant', 'classic');
});

test('switch preserves the project route; stores only appearance', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/projects\/bavaria$/);
  const current = await page.locator('html').getAttribute('data-ui-variant');
  const next = current === 'classic' ? 'Industrial' : 'Classic';
  await page.getByRole('button', { name: next, exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/bavaria$/);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['jv-ui-variant']);
  await page.reload();
  await expect(page.getByRole('button', { name: next, exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('mobile control synchronizes and financing input survives switching', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.route('https://api.devnet.solana.com', route => route.fulfill({ json: { jsonrpc: '2.0', id: route.request().postDataJSON().id, error: { code: -32005, message: 'Unavailable' } } }));
  await page.goto('/projects/bavaria');
  await page.getByRole('button', { name: 'Finance this project' }).click();
  await page.getByLabel('Amount', { exact: true }).fill('12.345');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const current = await page.locator('html').getAttribute('data-ui-variant');
  const next = current === 'classic' ? 'Industrial' : 'Classic';
  await page.locator('#mobile-navigation').getByRole('button', { name: next, exact: true }).click();
  await expect(page.locator('#mobile-navigation').getByRole('button', { name: next, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await page.getByRole('button', { name: 'Finance this project' }).click();
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('12.345');
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
