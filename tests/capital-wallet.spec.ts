import {test,expect} from '@playwright/test';
import {bavaria,useOfFunds} from '../src/data/projects';
import fs from 'node:fs';

test('historical capital is separate from current raise and Devnet; protocol sources unchanged',async({page})=>{
  expect(bavaria.target).toBe(250000);expect(bavaria.totalProjectCapital).toBe(350000);expect(bavaria.alreadyInvested).toBe(100000);
  expect(useOfFunds.reduce((sum,item)=>sum+item.amount,0)).toBe(250000);
  expect(JSON.parse(fs.readFileSync('src/chain/deployment.json','utf8')).projectPda).toBe('9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U');
  for(const route of ['/','/projects/bavaria']){await page.goto(route);await expect(page.locator('.business-capital')).toContainText('€350,000');await expect(page.locator('.business-capital')).toContainText('€100,000');await expect(page.locator('.business-capital')).toContainText('€250,000');await expect(page.locator('.business-capital')).toContainText('29%');await expect(page.locator('main')).toContainText('licensing, legal, regulatory and facility/project preparation');}
  await expect(page.locator('.onchain-panel')).toContainText('Technical demo only. JV Test USD has no monetary value.');
  await expect(page.locator('.onchain-panel')).not.toContainText('€100,000');
});

test('picker lists only registered compatible wallets plus the supported web fallback',async({page})=>{
  await page.addInitScript(()=>{
    const listeners=new Set<(change:unknown)=>void>();
    let accounts:unknown[]=[];let reject=false;
    const account={address:'11111111111111111111111111111111',publicKey:new Uint8Array(32),chains:['solana:devnet'],features:['solana:signTransaction']};
    const wallet={version:'1.0.0',name:'Example Wallet',icon:'data:image/png;base64,',chains:['solana:devnet'],get accounts(){return accounts;},features:{
      'standard:connect':{connect:async()=>{if(reject)throw Error('Rejected');accounts=[account];return {accounts};}},
      'standard:disconnect':{disconnect:async()=>{accounts=[];listeners.forEach(fn=>fn({accounts}));}},
      'standard:events':{on:(_name:string,fn:(change:unknown)=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);}},
      'solana:signTransaction':{supportedTransactionVersions:['legacy'],signTransaction:async()=>[]},
    }};
    window.addEventListener('wallet-standard:app-ready',event=>{
      const api=(event as CustomEvent<{register:(wallet:unknown)=>()=>void}>).detail;
      const remove=api.register(wallet);api.register({...wallet,name:'Unsupported Wallet',chains:['ethereum:mainnet']});
      Object.assign(window,{fixtureRemoveWallet:remove,fixtureReject:()=>{reject=true;},fixtureChange:()=>{accounts=[];listeners.forEach(fn=>fn({accounts}));}});
    });
  });
  await page.route('https://api.devnet.solana.com',route=>route.fulfill({json:{jsonrpc:'2.0',id:route.request().postDataJSON().id,result:{context:{slot:1},value:0}}}));
  await page.goto('/');await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();
  const picker=page.locator('dialog[open]');await expect(picker.getByRole('button',{name:/Example Wallet/})).toBeVisible();await expect(picker.getByRole('button',{name:/Unsupported Wallet|Phantom/})).toHaveCount(0);
  await picker.getByRole('button',{name:/Example Wallet/}).click();await expect(page.locator('.wallet-button')).toContainText('1111…1111');
  await page.evaluate(()=>{(window as unknown as {fixtureChange:()=>void}).fixtureChange();});await expect(page.locator('.wallet-button')).toContainText('Connect Wallet');
  await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();await page.evaluate(()=>{(window as unknown as {fixtureRemoveWallet:()=>void}).fixtureRemoveWallet();});await expect(page.locator('dialog[open]').getByRole('button',{name:/Example Wallet/})).toHaveCount(0);
});
