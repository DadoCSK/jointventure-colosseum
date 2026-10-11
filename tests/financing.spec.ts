import {test,expect,type Page} from '@playwright/test';
import {createRequire} from 'node:module';
const load=createRequire(import.meta.url);
const {Program,BN,utils,BorshInstructionCoder}=load('@coral-xyz/anchor') as typeof import('@coral-xyz/anchor');
const {Connection,Keypair,PublicKey,Transaction}=load('@solana/web3.js') as typeof import('@solana/web3.js');
import type {PublicKey as PublicKeyType} from '@solana/web3.js';
import idl from '../src/chain/idl/joint_venture.json' with {type:'json'};
import deployment from '../src/chain/deployment.json' with {type:'json'};

async function fixture(page:Page, standard=false) {
  const investor=Keypair.generate(); // Fixture key stays in Node; no real wallet is used.
  const address=investor.publicKey.toBase58();
  const project=new PublicKey(deployment.projectPda),mint=new PublicKey(deployment.mint);
  const program=new Program(idl,{connection:new Connection(deployment.rpc)});
  const [position]=PublicKey.findProgramAddressSync([Buffer.from('sol-position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId);

  const controls={reject:false,outcome:'confirmed' as 'confirmed'|'pending'|'failed',statusUnavailable:false,height:90,wrongNetwork:false,balance:BigInt(20_000_000_000),sol:20e9,signs:0,sends:0,nonce:0,contribution:BigInt(0),projectTotal:BigInt(3_250_000_000),amount:BigInt(1_250_000_000),readFailure:false,price:true,hasVault:true};
  const sign=(encoded:string)=>{
    controls.signs++;
    if(controls.reject) throw Error('User rejected request');
    const transaction=Transaction.from(utils.bytes.bs58.decode(encoded));
    expect(transaction.instructions).toHaveLength(1);
    expect(transaction.instructions[0].programId.toBase58()).toBe(deployment.programId);
    expect(transaction.instructions[0].keys.map(k=>k.pubkey.toBase58())).toContain(deployment.projectPda);
    expect(transaction.instructions[0].keys.map(k=>k.pubkey.toBase58())).toContain(deployment.solVaultPda);
    transaction.partialSign(investor);
    return utils.bytes.bs58.encode(transaction.serialize());
  };
  await page.exposeFunction('fixtureSign',sign);
  if(standard){
    await page.exposeFunction('fixtureStandardSign',(bytes:number[])=>Array.from(utils.bytes.bs58.decode(sign(utils.bytes.bs58.encode(new Uint8Array(bytes))))));
    await page.addInitScript(({address,bytes})=>{
      const account={address,publicKey:new Uint8Array(bytes),chains:['solana:devnet'],features:['solana:signTransaction']};
      let accounts:typeof account[]=[];const listeners=new Set<(change:{accounts:typeof accounts})=>void>();
      const wallet={version:'1.0.0',name:'Phantom',icon:'data:image/png;base64,',chains:['solana:devnet'],get accounts(){return accounts;},features:{
        'standard:connect':{version:'1.0.0',connect:async()=>{accounts=[account];listeners.forEach(fn=>fn({accounts}));return {accounts};}},
        'standard:disconnect':{version:'1.0.0',disconnect:async()=>{accounts=[];listeners.forEach(fn=>fn({accounts}));}},
        'standard:events':{version:'1.0.0',on:(_event:string,fn:(change:{accounts:typeof accounts})=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);}},
        'solana:signTransaction':{version:'1.0.0',supportedTransactionVersions:['legacy'],signTransaction:async(input:{transaction:Uint8Array;chain:string})=>{if(input.chain!=='solana:devnet')throw Error('Wrong chain');const result=await (window as unknown as {fixtureStandardSign:(bytes:number[])=>Promise<number[]>}).fixtureStandardSign(Array.from(input.transaction));return [{signedTransaction:new Uint8Array(result)}];}},
      }};
      window.addEventListener('wallet-standard:app-ready',event=>(event as CustomEvent<{register:(wallet:unknown)=>void}>).detail.register(wallet));
    },{address,bytes:Array.from(investor.publicKey.toBytes())});
  }
  await page.route('https://connect.solflare.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><script>
    const send=data=>parent.postMessage({channel:'solflareIframeToWalletAdapter',data},'http://localhost:3000');
    addEventListener('message',async e=>{
      if(e.data.channel!=='solflareWalletAdapterToIframe')return;
      const {id,method,params}=e.data.data;
      try {
        if(method==='signTransaction')send({type:'response',id,result:await window.fixtureSign(params.transaction)});
        else if(method==='disconnect')send({type:'response',id,result:null});
        else throw Error('Unexpected wallet request '+method);
      }catch(error){send({type:'response',id,error:error.message});}
    });
    send({type:'event',event:{type:'connect',data:{publicKey:${JSON.stringify(address)},adapter:'extension'}}});
  </script>`}));
  await page.route(deployment.rpc,async route=>{
    const request=route.request().postDataJSON();
    const context={slot:1};
    if(controls.readFailure && ['getAccountInfo','getMultipleAccounts'].includes(request.method)){await route.fulfill({json:{jsonrpc:'2.0',id:request.id,error:{code:-32005,message:'Read unavailable'}}});return;}
    let result:unknown;
    const account=(data:Buffer,owner:PublicKeyType)=>({data:[data.toString('base64'),'base64'],owner:owner.toBase58(),lamports:1_000_000,executable:false,rentEpoch:0});
    const getInfo=async(key:string)=>{
        let value:unknown=null;
        if(key===deployment.projectPda) value=account(await program.coder.accounts.encode('project',{version:1,bump:PublicKey.findProgramAddressSync([Buffer.from('project'),Buffer.from('bavaria')],program.programId)[1],vaultBump:PublicKey.findProgramAddressSync([Buffer.from('vault'),project.toBuffer()],program.programId)[1],authority:new PublicKey(deployment.authority),acceptedMint:mint,slug:'bavaria',name:'Bavaria Cultivation Facility',targetEurCents:new BN(25_000_000),infrastructureEurCents:new BN(22_000_000),contractedMonthlyRevenueEurCents:new BN(3_300_000),totalFinancedUnits:new BN(controls.projectTotal.toString()),financingEnabled:true}),program.programId);
        else if(key===deployment.solVaultPda&&controls.hasVault){value=account(await program.coder.accounts.encode('solVault',{project,totalLamports:new BN(controls.projectTotal.toString()),bump:PublicKey.findProgramAddressSync([Buffer.from('sol-vault'),project.toBuffer()],program.programId)[1]}),program.programId);(value as {lamports:number}).lamports=Number(controls.projectTotal)+1_000_000;}
        else if(key===position.toBase58() && controls.nonce>0)value=account(await program.coder.accounts.encode('solPosition',{project,investor:investor.publicKey,contributedLamports:new BN(controls.contribution.toString()),nextNonce:new BN(controls.nonce),bump:PublicKey.findProgramAddressSync([Buffer.from('sol-position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId)[1]}),program.programId);
      return value;
    };
    switch(request.method) {
      case 'getGenesisHash':result=controls.wrongNetwork?'wrong-network':deployment.genesisHash;break;
      case 'getBalance':result={context,value:controls.sol};break;
      case 'getAccountInfo':result={context,value:await getInfo(request.params[0])};break;
      case 'getMultipleAccounts':result={context,value:await Promise.all(request.params[0].map(getInfo))};break;
      case 'getLatestBlockhash':result={context,value:{blockhash:Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:100}};break;
      case 'getFeeForMessage':result={context,value:5000};break;
      case 'getMinimumBalanceForRentExemption':result=1_000_000;break;
      case 'sendTransaction':{
        controls.sends++;
        const transaction=Transaction.from(Buffer.from(request.params[0],'base64'));
        expect(transaction.verifySignatures()).toBe(true);
        const instruction=new BorshInstructionCoder(program.idl).decode(transaction.instructions[0].data)!;
        expect(instruction.name).toBe('financeSol');
        const args=instruction.data as {lamports:{toString():string};expectedNonce:{toString():string}};
        expect(args.lamports.toString()).toBe(controls.amount.toString());
        expect(args.expectedNonce.toString()).toBe('0');
        if(controls.outcome==='confirmed'){controls.hasVault=true;controls.nonce=1;controls.contribution=controls.amount;controls.projectTotal+=controls.amount;controls.sol-=Number(controls.amount)+5000;}
        result=utils.bytes.bs58.encode(transaction.signature!);break;
      }
      case 'getSignatureStatuses':
        if(controls.statusUnavailable){await route.fulfill({json:{jsonrpc:'2.0',id:request.id,error:{code:-32005,message:'RPC unavailable'}}});return;}
        result={context,value:[controls.outcome==='pending'?null:{slot:1,confirmations:1,err:controls.outcome==='failed'?{InstructionError:[0,'Custom']}:null,confirmationStatus:'confirmed'}]};break;
      case 'getBlockHeight':result=controls.height;break;
      default:throw Error('Unexpected RPC '+request.method);
    }
    await route.fulfill({json:{jsonrpc:'2.0',id:request.id,result}});
  });
  await page.route('**/api/sol-eur',route=>route.fulfill({json:{price:controls.price?{eur:120,updatedAt:Date.now(),source:'CoinGecko'}:null}}));
  await page.goto('/projects/bavaria');
  await page.locator('.site-header').getByRole('button',{name:'Connect Wallet'}).click();
  await page.locator('dialog[open]').getByRole('button',{name:standard?'Phantom':'Solflare'}).click();
  await expect(page.locator('.site-header .wallet-button')).toContainText(address.slice(0,4));
  await page.getByRole('button',{name:'Finance this project'}).click();
  return {controls,dialog:page.locator('dialog[open]'),address};
}
async function review(page:Page,amount='1.25') {
  const dialog=page.locator('dialog[open]');
  await dialog.getByLabel('Amount',{exact:true}).fill(amount);
  await dialog.getByRole('button',{name:'Review Financing'}).click();
  await expect(dialog.getByRole('heading',{name:'Review financing'})).toBeVisible();
}
test('validates exact amounts, reviews project accounts, confirms one program transaction and reads the position',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const {controls,dialog,address}=await fixture(page);
  for(const amount of ['','0','-1','1e3','0.0000000001']){await dialog.getByLabel('Amount',{exact:true}).fill(amount);await expect(dialog.getByRole('button',{name:'Review Financing'})).toBeDisabled();}
  await review(page);
  await expect(dialog).toContainText(address);
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
  await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Financing recorded on Solana');
  expect(controls.signs).toBe(1);expect(controls.sends).toBe(1);
  await expect(page.locator('[data-demo-eur]')).toContainText('€540.00');
  await expect(page.locator('[data-live-vault]')).toHaveText('4.501 SOL');
  await expect(page.locator('[data-live-position]')).toHaveText('1.25 SOL');
  for (const width of [320,1440]) {
    await page.setViewportSize({width,height:900});
    await dialog.evaluate(async element=>{await Promise.all(element.getAnimations({subtree:true}).filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation=>animation.finished.catch(()=>{})));});
    await expect(dialog.locator('.success-amount')).toContainText('1.25 SOL');
    await expect(dialog.locator('.success-amount')).toContainText('DEVNET DEMO EQUIVALENT');
    await expect(dialog.getByRole('link',{name:'View Portfolio'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:testInfo.outputPath(`success-${width}.png`)});
  }
  await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Portfolio',exact:true}).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole('heading',{name:'Portfolio',exact:true})).toBeVisible();
  await expect(page.locator('[data-live-position]')).toHaveText('1.25 SOL');
  await expect(page.locator('main')).not.toContainText('€10,000');
  expect(errors).toEqual([]);
});
test('wallet rejection submits nothing and permits review retry',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.reject=true;
  await review(page);await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('User rejected');
  expect(controls.sends).toBe(0);
  controls.reject=false;
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Financing recorded on Solana');
  expect(controls.sends).toBe(1);
});
test('pending confirmation blocks another submission and can be checked',async({page})=>{
  const {controls,dialog,address}=await fixture(page);controls.outcome='pending';
  await review(page);await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Confirmation pending');
  const signature = await dialog.locator('code.wallet-address').innerText();
  await page.keyboard.press('Escape');
  await page.locator('nav').getByRole('link', {name:'Facility',exact:true}).click();
  await page.locator('nav').getByRole('link', {name:'Project',exact:true}).click();
  await expect(page.locator('.site-header .wallet-button')).toContainText(address.slice(0,4));
  await expect(page.locator('[data-live-total]')).toHaveText('3.25 SOL');
  await page.getByRole('button',{name:'Finance this project'}).click();
  await expect(dialog).toContainText('Confirmation pending');
  await expect(dialog.locator('code.wallet-address')).toHaveText(signature);
  await expect(page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'})).toHaveCount(0);
  controls.outcome='confirmed';
  await page.locator('dialog[open]').getByRole('button',{name:'Check confirmation'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Financing recorded on Solana');
  expect(controls.sends).toBe(1);
});
test('insufficient native SOL and a wrong network stop before signing',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.sol=0;
  await dialog.getByLabel('Amount',{exact:true}).fill('1.25');
  await dialog.getByRole('button',{name:'Review Financing'}).click();
  await expect(dialog).toContainText('Insufficient Devnet SOL');
  controls.sol=20e9;controls.wrongNetwork=true;
  await dialog.getByRole('button',{name:'Review Financing'}).click();
  await expect(dialog).toContainText('requires Solana Devnet');
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
});
test('insufficient Devnet SOL and a changed position stop before wallet approval',async({page})=>{
  const {controls,dialog}=await fixture(page);
  await review(page);controls.sol=0;await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Insufficient Devnet SOL');
  controls.sol=20e9;controls.nonce=1;
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Your position changed');
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
});
test('confirmation RPC failure retains the signature and permits status checking without a new deposit',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.statusUnavailable=true;
  await review(page);await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Confirmation is unavailable');
  await expect(page.locator('dialog[open]').getByRole('link',{name:'View transaction on Solana Explorer'})).toHaveAttribute('href',/cluster=devnet/);
  controls.statusUnavailable=false;
  await page.locator('dialog[open]').getByRole('button',{name:'Check confirmation'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Financing recorded on Solana');
  expect(controls.sends).toBe(1);
});
test('failed and expired transactions provide a fresh review rather than resubmitting',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.outcome='failed';
  await review(page);await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Transaction failed');
  await page.locator('dialog[open]').getByRole('button',{name:'Review another commitment'}).click();
  controls.outcome='pending';controls.height=101;
  await review(page);await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Transaction expired');
  expect(controls.sends).toBe(2);expect(controls.nonce).toBe(0);
});

test('10-SOL confirmed contribution refreshes live demo total and wallet position automatically',async({page})=>{
  const {controls}=await fixture(page); controls.amount=BigInt(10_000_000_000);
  await expect(page.locator('[data-live-total]')).toHaveText('3.25 SOL');
  await expect(page.locator('[data-demo-eur]')).toContainText('€390.00');
  await review(page,'10');
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Financing recorded on Solana');
  await expect(page.locator('dialog[open]')).toContainText('13.25 SOL');
  await expect(page.locator('[data-demo-eur]')).toContainText('€1,590.00');
  expect(Number(await page.locator('[data-demo-width]').getAttribute('data-demo-width'))).toBeCloseTo(1590/350000*100,8);
  await expect(page.locator('.capital-callout')).toContainText('+10 SOL');
  await expect(page.locator('[data-live-position]')).toHaveText('10 SOL');
  await expect(page.locator('[data-live-total]')).toHaveText('13.25 SOL');
  await expect(page.locator('dialog[open]')).toContainText('10 SOL');
  await expect(page.locator('dialog[open]').getByRole('link',{name:'View transaction on Solana Explorer'})).toHaveAttribute('href',/https:\/\/explorer.solana.com\/tx\/.*\?cluster=devnet/);
  await page.locator('dialog[open]').getByRole('link',{name:'View Portfolio'}).click();
  await expect(page.locator('[data-live-position]')).toHaveText('10 SOL');
  await expect(page.locator('.financing-history')).toContainText('10 SOL');
  await expect(page.locator('.financing-history').getByRole('link',{name:'View transaction',exact:true})).toHaveAttribute('href',/https:\/\/explorer.solana.com\/tx\/.*\?cluster=devnet/);
  expect(controls.sends).toBe(1);
});
test('pending and rejected contributions never fabricate progress; RPC failure leaves business facts usable',async({page})=>{
  const {controls}=await fixture(page);
  await expect(page.locator('[data-live-total]')).toHaveText('3.25 SOL');
  controls.reject=true; await review(page);
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('User rejected');
  await expect(page.locator('[data-demo-eur]')).toContainText('€390.00');
  controls.reject=false;controls.outcome='pending';
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Confirmation pending');
  await expect(page.locator('[data-demo-eur]')).toContainText('€390.00');
  await page.keyboard.press('Escape'); controls.readFailure=true;
  await page.getByRole('button',{name:'Read Devnet records'}).click();
  await expect(page.locator('.onchain-panel')).toContainText('Last successful read shown');
  await expect(page.getByRole('heading',{name:'Project Readiness'})).toBeVisible();
  await expect(page.locator('main')).toContainText('€250,000');
  await expect(page.locator('main')).not.toContainText('€75,000');
});

test('detected Phantom Wallet Standard signs the native finance instruction and refreshes portfolio',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const {controls,dialog}=await fixture(page,true);await review(page);await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
  await expect(dialog).toContainText('Financing recorded on Solana');expect(controls.signs).toBe(1);expect(controls.sends).toBe(1);
  await page.keyboard.press('Escape');await page.getByRole('link',{name:'Portfolio',exact:true}).click();await expect(page.locator('[data-live-position]')).toHaveText('1.25 SOL');expect(errors).toEqual([]);
});

test('market-price failure never blocks native SOL financing or portfolio',async({page})=>{
  const {controls,dialog}=await fixture(page,true);controls.price=false;
  await page.reload();await page.locator('.site-header').getByRole('button',{name:'Connect Wallet'}).click();await page.locator('dialog[open]').getByRole('button',{name:'Phantom'}).click();await page.getByRole('button',{name:'Finance this project'}).click();
  await expect(page.locator('dialog[open]')).toContainText('EUR equivalent unavailable');await review(page,'0.50');controls.amount=BigInt(500_000_000);
  await dialog.getByRole('button',{name:'Approve in Wallet'}).click();await expect(dialog).toContainText('Financing recorded on Solana');await expect(page.locator('[data-live-total]')).toHaveText('3.75 SOL');await expect(page.locator('[data-demo-eur]')).toContainText('Unavailable');
  await dialog.getByRole('link',{name:'View Portfolio'}).click();await expect(page.locator('[data-live-position]')).toHaveText('0.5 SOL');await expect(page.locator('main')).toContainText('EUR equivalent unavailable');
});

test('entire native wallet balance cannot be financed without fee and rent reserves',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.sol=500_000_000;
  await dialog.getByLabel('Amount',{exact:true}).fill('0.50');await dialog.getByRole('button',{name:'Review Financing'}).click();await expect(dialog).toContainText('Insufficient Devnet SOL');expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
});


test('first native financing reserves both vault and position rent and creates readable records',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.hasVault=false;controls.projectTotal=BigInt(0);controls.sol=501_500_000;controls.amount=BigInt(500_000_000);
  await dialog.getByLabel('Amount',{exact:true}).fill('0.50');await dialog.getByRole('button',{name:'Review Financing'}).click();await expect(dialog).toContainText('Insufficient Devnet SOL');expect(controls.signs).toBe(0);
  controls.sol=503_000_000;await review(page,'0.50');await dialog.getByRole('button',{name:'Approve in Wallet'}).click();await expect(dialog).toContainText('Financing recorded on Solana');await expect(page.locator('[data-live-total]')).toHaveText('0.5 SOL');await expect(page.locator('[data-live-position]')).toHaveText('0.5 SOL');await expect(page.locator('[data-live-vault]')).toHaveText('0.501 SOL');
});
