import {test, expect, type Page} from '@playwright/test';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const load = createRequire(import.meta.url);
const {Program, BN} = load('@coral-xyz/anchor') as typeof import('@coral-xyz/anchor');
const {Connection, PublicKey} = load('@solana/web3.js') as typeof import('@solana/web3.js');
import idl from '../src/chain/idl/joint_venture.json' with {type: 'json'};
import deployment from '../src/chain/deployment.json' with {type: 'json'};
const fixturePath = 'tests/fixtures/integrity-test.txt';
const contents = fs.readFileSync(fixturePath);
const hash = createHash('sha256').update(contents).digest('hex');
const name = 'Harmless integrity test fixture';
const project = new PublicKey(deployment.projectPda);
const program = new Program(idl, {connection: new Connection(deployment.rpc)});
const [recordPda, recordBump] = PublicKey.findProgramAddressSync([Buffer.from('document'), project.toBuffer(), Buffer.from('integrity-test-v1')], program.programId);
async function rpc(page: Page, options: {fail?: boolean; tamperProject?: boolean; missing?: boolean} = {}) {
  await page.route(deployment.rpc, async route => {
    const request = route.request().postDataJSON();
    if (options.fail) {await route.fulfill({json: {jsonrpc: '2.0', id: request.id, error: {code: -32005, message: 'Unavailable'}}}); return;}
    let result: unknown;
    if (request.method === 'getGenesisHash') result = deployment.genesisHash;
    else if (request.method === 'getAccountInfo') {
      let data: Buffer | null = null;
      if (request.params[0] === deployment.projectPda) data = await program.coder.accounts.encode('project', {version: 1, bump: PublicKey.findProgramAddressSync([Buffer.from('project'), Buffer.from('bavaria')], program.programId)[1], vaultBump: 1, authority: new PublicKey(deployment.authority), acceptedMint: new PublicKey(deployment.mint), slug: 'bavaria', name: 'Bavaria Cultivation Facility', targetEurCents: new BN(25_000_000), infrastructureEurCents: new BN(22_000_000), contractedMonthlyRevenueEurCents: new BN(3_300_000), totalFinancedUnits: new BN(3_250_000), financingEnabled: true});
      if (request.params[0] === recordPda.toBase58() && !options.missing) data = await program.coder.accounts.encode('documentRecord', {project: options.tamperProject ? new PublicKey(deployment.mint) : project, authority: new PublicKey(deployment.authority), documentId: 'integrity-test-v1', documentName: name, sha256Hash: Array.from(Buffer.from(hash, 'hex')), createdAt: new BN(1791580000), bump: recordBump});
      result = {context: {slot: 1}, value: data ? {owner: deployment.programId, data: [data.toString('base64'), 'base64'], lamports: 1_000_000, executable: false, rentEpoch: 0} : null};
    } else throw Error('Unexpected RPC for document read: ' + request.method);
    await route.fulfill({json: {jsonrpc: '2.0', id: request.id, result}});
  });
}
async function openFixture(page: Page) {
  await page.goto('/documents');
  await page.locator('[data-document-id="integrity-test-v1"]').getByRole('button', {name: 'View record'}).click();
  return page.locator('dialog[open]');
}
test('production documents stay pending; file hashing is local and uses exact SHA-256', async ({page}) => {
  const external: string[] = [];
  page.on('request', request => {if (!request.url().startsWith('http://localhost:3000')) external.push(request.url());});
  await rpc(page, {fail: true});
  await page.goto('/documents');
  for (const id of ['license', 'rental', 'budget']) {
    const card = page.locator(`[data-document-id="${id}"]`);
    await expect(card).toContainText('Integrity record pending');
    await expect(card.locator('.integrity-short-hash')).toHaveCount(0);
  }
  await page.locator('[data-document-id="license"]').getByRole('button', {name: 'View record'}).click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('input[type=file]').setInputFiles(fixturePath);
  await expect(dialog.locator('[data-local-hash]')).toHaveText(hash);
  await expect(dialog).toContainText('this hash has not been anchored');
  await expect(dialog.getByRole('button', {name: 'Anchor fingerprint in Solflare'})).toBeDisabled();
  expect(external.every(url => new URL(url).origin === deployment.rpc)).toBe(true);
  await page.keyboard.press('Escape');
});
test('reads a real-format record, displays timestamp/PDA links, matches and detects altered local files', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const requests: string[] = []; page.on('request', request => {if (new URL(request.url()).origin === deployment.rpc) requests.push(request.postData() ?? '');});
  await rpc(page);
  const dialog = await openFixture(page);
  await dialog.getByRole('button', {name: 'Read integrity record'}).click();
  await expect(dialog).toContainText('Integrity anchored on Solana');
  await expect(dialog).toContainText(recordPda.toBase58());
  await expect(dialog.locator('time')).toHaveAttribute('datetime', new Date(1791580000 * 1000).toISOString());
  await expect(dialog.getByRole('link', {name: 'View record on Devnet Explorer'})).toHaveAttribute('href', `https://explorer.solana.com/address/${recordPda.toBase58()}?cluster=devnet`);
  await expect(dialog).toContainText('does not independently authenticate');
  await expect(dialog).toContainText('It does not represent the licence');
  await dialog.locator('input[type=file]').setInputFiles(fixturePath);
  await expect(dialog).toContainText('Fingerprint matches the anchored record.');
  await dialog.locator('input[type=file]').setInputFiles({name: 'changed-local-test.txt', mimeType: 'text/plain', buffer: Buffer.from('different harmless content')});
  await expect(dialog).toContainText('Fingerprint does not match the anchored record.');
  for (const request of requests) {expect(request).not.toContain(contents.toString()); expect(request).not.toContain('changed-local-test.txt'); expect(request).not.toContain('sendTransaction');}
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-document-id="integrity-test-v1"]')).toContainText('Integrity anchored on Solana');
  expect(errors).toEqual([]);
});
test('RPC failure leaves the project and financing usable and never invents a fingerprint', async ({page}) => {
  await rpc(page, {fail: true});
  const dialog = await openFixture(page);
  await dialog.getByRole('button', {name: 'Read integrity record'}).click();
  await expect(dialog).toContainText('Devnet records are unavailable');
  await expect(dialog).toContainText('Integrity record pending');
  await expect(dialog.locator('.integrity-details')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/projects/bavaria');
  await expect(page.getByRole('heading', {name: 'Bavaria Controlled Cultivation Infrastructure'})).toBeVisible();
  await expect(page.locator('progress')).toHaveCount(0);
  await expect(page.locator('.onchain-panel')).toContainText('Live Devnet data is unavailable');
  await page.getByRole('button', {name: 'Finance this project'}).click();
  await expect(page.locator('dialog[open]')).toContainText('JV TEST USD');
});
test('a missing record remains pending and a record referencing another project is rejected', async ({page}) => {
  const options = {missing: true, tamperProject: false};
  await rpc(page, options);
  const dialog = await openFixture(page);
  await dialog.getByRole('button', {name: 'Read integrity record'}).click();
  await expect(dialog.getByRole('button', {name: 'Read integrity record'})).toBeEnabled();
  await expect(dialog).toContainText('Integrity record pending');
  options.missing = false; options.tamperProject = true;
  await dialog.getByRole('button', {name: 'Read integrity record'}).click();
  await expect(dialog).toContainText('Devnet records are unavailable');
  await expect(dialog.locator('.integrity-details')).toHaveCount(0);
});
