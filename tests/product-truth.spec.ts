import { test, expect } from '@playwright/test';
import { bavaria, projects, useOfFunds } from '../src/data/projects';
const rpc = 'https://api.devnet.solana.com';

test('Bavaria is the only project; navigation has no marketplace or fictional EUR data', async ({ page }) => {
  expect(projects).toEqual([bavaria]);
  expect(useOfFunds.map(item => item.amount)).toEqual([90000,70000,25000,15000,10000,10000,30000]);
  expect(useOfFunds.reduce((sum, item) => sum + item.amount, 0)).toBe(250000);
  await page.route(rpc, route => route.fulfill({ json: { jsonrpc: '2.0', id: route.request().postDataJSON().id, error: { code: -32005, message: 'Unavailable' } } }));
  for (const route of ['/', '/projects', '/projects/bavaria', '/facility', '/documents', '/portfolio']) {
    await page.goto(route);
    if (route === '/projects') await expect(page).toHaveURL(/\/projects\/bavaria$/);
    await expect(page.locator('main')).not.toContainText(/Netherlands|Spanish Indoor|€10,000.*commit|€75,000|128,000|99,000/);
    await expect(page.getByRole('link', { name: 'Marketplace', exact: true })).toHaveCount(0);
    await expect(page.locator('.filters, .project-grid, .portfolio-metrics')).toHaveCount(0);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Built from a real financing problem' })).toBeVisible();
  await expect(page.locator('.overview-facility')).toContainText('FOUNDING PROJECT · REAL BUSINESS');
  await expect(page.getByRole('link', { name: 'Explore the Bavaria Project', exact: true })).toHaveAttribute('href', '/projects/bavaria');
  await expect(page.locator('.business-metrics .metric strong')).toHaveText(['€350,000','€100,000','€250,000','~€33k/month']);
  await expect(page.locator('.business-capital')).not.toContainText('Devnet');
  await expect(page.getByRole('heading', {level:1})).toHaveText('Finance real infrastructure.Verify what your capital is building.');
  await expect(page.getByRole('link', {name:'See How It Works'})).toHaveAttribute('href','#how-it-works');
  await expect(page.locator('main progress')).toHaveCount(0);
  await expect(page.locator('.capital-flow li')).toHaveText(['Capital','Infrastructure','Facility','Production','Revenue']);
  await page.getByRole('button', { name: 'Finance on Devnet', exact: true }).click();
  await expect(page.locator('dialog[open]')).toContainText('NATIVE SOL');
});

test('unavailable chain read keeps the project usable without fake EUR progress', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route(rpc, route => route.fulfill({ json: { jsonrpc: '2.0', id: route.request().postDataJSON().id, error: { code: -32005, message: 'Unavailable' } } }));
  await page.goto('/projects/bavaria');
  await expect(page.locator('.onchain-panel')).toContainText('Live Devnet data is unavailable');
  await expect(page.locator('progress')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('€250,000');
  await expect(page.locator('main')).toContainText('€30,000');
  await expect(page.locator('main')).toContainText('Pre-operational');
  await expect(page.locator('main')).toContainText('FOUNDING PROJECT · REAL BUSINESS');
  await expect(page.getByRole('heading', { name: 'Project Readiness' })).toBeVisible();
  await page.getByRole('button', { name: 'Finance this project' }).click();
  await expect(page.locator('dialog[open]')).toContainText('no monetary value');
  expect(errors).toEqual([]);
});

test('mobile navigation reaches all focused pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.route(rpc, route => route.fulfill({ json: { jsonrpc: '2.0', id: route.request().postDataJSON().id, error: { code: -32005, message: 'Unavailable' } } }));
  await page.goto('/');
  for (const [name, route] of [['Project','/projects/bavaria'],['Facility','/facility'],['Documents','/documents'],['Portfolio','/portfolio'],['Overview','/']]) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.locator('#mobile-navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}$`));
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);
  }
});
