import { test, expect } from '@playwright/test';

test('digital twin leads the page and browser telemetry drifts, pauses and stays bounded', async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith('http://localhost:3000')) external.push(request.url()); });
  await page.goto('/facility');
  await expect(page.getByRole('heading', { name: 'Facility Digital Twin', exact: true })).toBeVisible();
  await expect(page.getByText('SIMULATED DIGITAL TWIN', { exact: true })).toBeVisible();
  await expect(page.getByText('Simulated preview of the planned Bavaria cultivation environment.', { exact: true })).toBeVisible();
  await expect(page.locator('.facility-scene')).toBeVisible();
  await expect(page.locator('[data-sensor="temperature"]')).not.toHaveText('24.3 °C', { timeout: 10000 });
  const temperature = parseFloat(await page.locator('[data-sensor="temperature"]').innerText());
  const humidity = parseFloat(await page.locator('[data-sensor="humidity"]').innerText());
  const co2 = parseFloat(await page.locator('[data-sensor="co2"]').innerText());
  expect(temperature).toBeGreaterThanOrEqual(23.7); expect(temperature).toBeLessThanOrEqual(24.9);
  expect(humidity).toBeGreaterThanOrEqual(58); expect(humidity).toBeLessThanOrEqual(64);
  expect(co2).toBeGreaterThanOrEqual(780); expect(co2).toBeLessThanOrEqual(844);
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  const paused = await page.locator('.twin-viewport').innerText();
  await page.waitForTimeout(500);
  expect(await page.locator('.twin-viewport').innerText()).toBe(paused);
  await expect(page.locator('.facility-scene')).toHaveClass(/scene-paused/);
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await expect.poll(() => page.locator('.twin-viewport').innerText()).not.toBe(paused);
  expect(external).toEqual([]); expect(errors).toEqual([]);
});

test('zone inspection and operations share simulated values and security stays planned', async ({ page }) => {
  await page.goto('/facility');
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect HVAC', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#zone-detail-title')).toHaveText('HVAC');
  const cooling = (await page.locator('[data-sensor="hvac"]').innerText()).split(' · ')[1];
  await expect(page.locator('.zone-details dd').first()).toHaveText(cooling);
  await expect(page.locator('[data-system="hvac"]')).toHaveText(`Cooling ${cooling}`);
  for (const name of ['Irrigation', 'Lighting', 'Power', 'Security', 'Sensors', 'Zone B']) {
    await page.locator('.zone-selector').getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.zone-details')).toBeVisible();
    await expect(page.locator('.zone-state')).toHaveText(name === 'Security' ? 'Planned' : 'Simulated Online');
  }
  await expect(page.locator('[data-system="security"]')).toHaveText('Pre-operational');
  await page.locator('.zone-selector').getByRole('button', { name: 'Sensors', exact: true }).click();
  await expect(page.locator('.zone-details dd').first()).toHaveText(await page.locator('[data-sensor="temperature"]').innerText());
});

test('one accessible environment chart switches by click and arrow keys', async ({ page }) => {
  await page.goto('/facility');
  await expect(page.getByText('Simulated 24h telemetry', { exact: true })).toBeVisible();
  await expect(page.locator('.trend-chart')).toHaveCount(1);
  for (const name of ['Temperature', 'Humidity', 'CO₂']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.locator('.trend-chart')).toHaveAccessibleName(new RegExp(`${name}: simulated 24h telemetry`));
    const points = (await page.locator('.trend-chart polyline').getAttribute('points'))!.split(' ').map(p => p.split(',').map(Number));
    expect(points).toHaveLength(49);
    for (let i = 0; i < points.length; i++) {
      expect(points[i][1]).toBeGreaterThan(40); expect(points[i][1]).toBeLessThan(180);
      if (i) expect(Math.abs(points[i][1] - points[i-1][1])).toBeLessThan(15);
    }
  }
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Temperature', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Humidity', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('commercial canopy and illustrative height and targets change across all growth stages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/facility');
  await expect(page.getByText('SIMULATED GROWTH CYCLE', { exact: true })).toBeVisible();
  await expect(page.locator('.cycle-day')).toHaveText('Vegetative · Day 18');
  const model = page.locator('.growth-plant');
  await expect(model).toHaveAttribute('data-model-ready', 'true');
  const initial = await model.screenshot();
  for (const [day, stage] of [[1,'Propagation'],[14,'Vegetative'],[28,'Vegetative'],[45,'Flowering'],[60,'Processing']] as const) {
    await page.getByRole('button', { name: `Day ${day}`, exact: true }).click();
    await expect(page.locator('.cycle-day')).toHaveText(`${stage} · Day ${day}`);
    await expect(model).toHaveAccessibleName(new RegExp(`Simulated ${stage.toLowerCase()}.*day ${day}`));
    await expect(model).toHaveAttribute('data-model-day', String(day));
  }
  expect((await model.screenshot()).equals(initial)).toBe(false);
  await expect(page.locator('.cycle-insight dd').first()).toHaveText('Harvested');
  await page.locator('.cycle-stepper').getByRole('button', { name: /Drying/ }).click();
  await expect(page.locator('.cycle-day')).toHaveText('Drying · Day 55');
  await expect(page.locator('.cycle-insight dd').nth(1)).toHaveText('19°C · 55% RH');
  await page.getByLabel('Explore growth').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.cycle-day')).toHaveText('Drying · Day 54');
});

test('canopy foliage moves, rotates, pauses and preserves its context across appearance changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/facility');
  const model = page.locator('.growth-plant');
  await expect(model).toHaveAttribute('data-model-ready', 'true');
  const initial = await model.screenshot();
  await page.waitForTimeout(500);
  expect((await model.screenshot()).equals(initial)).toBe(false);
  await page.getByRole('button', { name: 'Pause plant motion' }).click();
  await page.waitForTimeout(100);
  const paused = await model.screenshot();
  await page.waitForTimeout(200);
  expect((await model.screenshot()).equals(paused)).toBe(true);
  await model.focus(); await page.keyboard.press('ArrowRight');
  expect((await model.screenshot()).equals(paused)).toBe(false);
  await model.evaluate(node => { (node as HTMLElement).dataset.contextMarker = 'preserved'; });
  const current = await page.locator('html').getAttribute('data-ui-variant');
  await page.getByRole('button', { name: current === 'industrial' ? 'Classic' : 'Industrial', exact: true }).first().click();
  await expect(model).toHaveAttribute('data-context-marker', 'preserved');
  await expect(page.getByRole('button', { name: 'Resume plant motion' })).toHaveAttribute('aria-pressed', 'true');
});

test('reduced motion is still and the no-WebGL fallback preserves stage controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/facility');
  const model = page.locator('.growth-plant');
  await expect(model).toHaveAttribute('data-model-ready', 'true');
  const initial = await model.screenshot();
  await page.waitForTimeout(200);
  expect((await model.screenshot()).equals(initial)).toBe(true);
  await expect(page.locator('.twin-fan').first()).toHaveCSS('animation-name', 'none');
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]) === 'webgl') return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.reload();
  await expect(page.getByText('3D preview unavailable on this device.')).toBeVisible();
  await page.getByRole('button', { name: 'Day 45', exact: true }).click();
  await expect(page.locator('.cycle-day')).toHaveText('Flowering · Day 45');
});

test('actual supplied logo is used in navigation and footer without stretching', async ({ page }) => {
  await page.goto('/facility');
  const logos = page.locator('.brand-asset img');
  await expect(logos).toHaveCount(2);
  for (const logo of await logos.all()) {
    await expect(logo).toHaveAttribute('src', /jv-logo-black-l/);
    expect(await logo.evaluate(node => { const image = node as HTMLImageElement; return image.complete && image.naturalWidth > 0 && image.clientWidth === image.clientHeight; })).toBe(true);
  }
  await expect(page.locator('nav').getByRole('link', { name: 'Joint Venture', exact: true })).toBeVisible();
});

for (const width of [320,390,768,1440]) {
  test(`digital twin and growth controls work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/facility');
    await page.locator('.zone-selector').getByRole('button', { name: 'HVAC', exact: true }).click();
    await expect(page.locator('#zone-detail-title')).toHaveText('HVAC');
    await page.locator('.cycle-stepper').getByRole('button', { name: /Flowering/ }).click();
    await expect(page.locator('.cycle-day')).toHaveText('Flowering · Day 45');
    await page.getByLabel('Explore growth').focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.cycle-day')).toHaveText('Propagation · Day 2');
    await page.getByRole('button', { name: 'Day 28', exact: true }).click();
    await expect(page.locator('.cycle-day')).toHaveText('Vegetative · Day 28');
    await page.getByRole('tab', { name: 'CO₂', exact: true }).click();
    await expect(page.locator('.trend-chart')).toHaveAccessibleName(/CO₂: simulated 24h telemetry/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const overlays = await page.locator('.telemetry-overlay').all();
    const bounds = await Promise.all(overlays.map(item => item.boundingBox()));
    for (const box of bounds) { expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(width); }
  });
}
