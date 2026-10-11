import {test, expect} from '@playwright/test';
const rpc='https://api.devnet.solana.com';
test('founding story precedes fictional examples and real facts have no fake EUR progress',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Built from a real financing problem'})).toBeVisible();
  await expect(page.getByRole('link',{name:'View Founding Project'})).toHaveAttribute('href','/projects/bavaria');
  const order=await page.locator('.founding-story, .project-grid').evaluateAll(nodes=>nodes.map(n=>n.className));
  expect(order[0]).toContain('founding-story');
  await expect(page.locator('.dashboard-card')).not.toContainText('€75,000');
  await page.goto('/projects');
  await expect(page.locator('.founding-card')).toContainText('FOUNDING PROJECT · REAL-WORLD PILOT');
  await expect(page.locator('.founding-card')).toContainText('Bavaria Controlled Cultivation Infrastructure');
  await expect(page.locator('.project-card:not(.founding-card)')).toHaveCount(2);
  for(const name of ['Netherlands Greenhouse Expansion','Spanish Indoor Produce Facility']){
    const card=page.locator('.project-card').filter({has:page.getByRole('heading',{name})});
    await expect(card).toContainText('DEMO PROJECT'); await expect(card).toContainText('Fictional');
  }
});
test('unavailable initial chain read never invents a total and keeps the real project usable',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route(rpc,route=>route.fulfill({json:{jsonrpc:'2.0',id:route.request().postDataJSON().id,error:{code:-32005,message:'Unavailable'}}}));
  await page.goto('/projects/bavaria');
  await expect(page.locator('.onchain-panel')).toContainText('Live Devnet data is unavailable');
  await expect(page.locator('progress')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('€75,000');
  await expect(page.locator('main')).toContainText('Joint Venture was created from this project.');
  await expect(page.locator('main')).toContainText('€250,000');
  await expect(page.locator('main')).toContainText('€30,000');
  await expect(page.locator('main')).toContainText('Pre-operational');
  await expect(page.getByRole('heading',{name:'Project Readiness'})).toBeVisible();
  await page.getByRole('button',{name:'Finance this project'}).click();
  await expect(page.locator('dialog[open]')).toContainText('no real monetary value');
  expect(errors).toEqual([]);
});
