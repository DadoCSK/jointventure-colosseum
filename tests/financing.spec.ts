import {test,expect,type Page} from '@playwright/test';
import {createRequire} from 'node:module';
const load=createRequire(import.meta.url);
const {Program,BN,utils,BorshInstructionCoder}=load('@coral-xyz/anchor') as typeof import('@coral-xyz/anchor');
const {Connection,Keypair,PublicKey,SystemProgram,Transaction}=load('@solana/web3.js') as typeof import('@solana/web3.js');
const {AccountLayout,MintLayout,TOKEN_PROGRAM_ID,getAssociatedTokenAddressSync}=load('@solana/spl-token') as typeof import('@solana/spl-token');
import type {PublicKey as PublicKeyType} from '@solana/web3.js';
import idl from '../src/chain/idl/joint_venture.json' with {type:'json'};
import deployment from '../src/chain/deployment.json' with {type:'json'};

async function fixture(page:Page) {
  const investor=Keypair.generate(); // Fixture key stays in Node; no real wallet is used.
  const address=investor.publicKey.toBase58();
  const project=new PublicKey(deployment.projectPda),mint=new PublicKey(deployment.mint);
  const program=new Program(idl,{connection:new Connection(deployment.rpc)});
  const [position]=PublicKey.findProgramAddressSync([Buffer.from('position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId);
  const source=getAssociatedTokenAddressSync(mint,investor.publicKey);
  const controls={reject:false,outcome:'confirmed' as 'confirmed'|'pending'|'failed',statusUnavailable:false,height:90,wrongNetwork:false,balance:BigInt(20_000_000_000),sol:1e9,signs:0,sends:0,nonce:0,contribution:BigInt(0)};
  await page.exposeFunction('fixtureSign',(encoded:string)=>{
    controls.signs++;
    if(controls.reject) throw Error('User rejected request');
    const transaction=Transaction.from(utils.bytes.bs58.decode(encoded));
    expect(transaction.instructions).toHaveLength(1);
    expect(transaction.instructions[0].programId.toBase58()).toBe(deployment.programId);
    expect(transaction.instructions[0].keys.map(k=>k.pubkey.toBase58())).toContain(deployment.projectPda);
    expect(transaction.instructions[0].keys.map(k=>k.pubkey.toBase58())).toContain(deployment.vaultPda);
    transaction.partialSign(investor);
    return utils.bytes.bs58.encode(transaction.serialize());
  });
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
    let result:unknown;
    const account=(data:Buffer,owner:PublicKeyType)=>({data:[data.toString('base64'),'base64'],owner:owner.toBase58(),lamports:1_000_000,executable:false,rentEpoch:0});
    switch(request.method) {
      case 'getGenesisHash':result=controls.wrongNetwork?'wrong-network':deployment.genesisHash;break;
      case 'getBalance':result={context,value:controls.sol};break;
      case 'getAccountInfo':{
        const key=request.params[0];
        let value:unknown=null;
        if(key===deployment.projectPda) value=account(await program.coder.accounts.encode('project',{version:1,bump:PublicKey.findProgramAddressSync([Buffer.from('project'),Buffer.from('bavaria')],program.programId)[1],vaultBump:PublicKey.findProgramAddressSync([Buffer.from('vault'),project.toBuffer()],program.programId)[1],authority:new PublicKey(deployment.authority),acceptedMint:mint,slug:'bavaria',name:'Bavaria Cultivation Facility',targetEurCents:new BN(25_000_000),infrastructureEurCents:new BN(22_000_000),contractedMonthlyRevenueEurCents:new BN(3_300_000),totalFinancedUnits:new BN(controls.contribution.toString()),financingEnabled:true}),program.programId);
        else if(key===deployment.mint){const data=Buffer.alloc(MintLayout.span);MintLayout.encode({mintAuthorityOption:1,mintAuthority:new PublicKey(deployment.authority),supply:BigInt(20_000_000_000),decimals:6,isInitialized:true,freezeAuthorityOption:0,freezeAuthority:SystemProgram.programId},data);value=account(data,TOKEN_PROGRAM_ID);}
        else if(key===deployment.vaultPda || key===source.toBase58()) {const data=Buffer.alloc(AccountLayout.span);AccountLayout.encode({mint,owner:key===deployment.vaultPda?project:investor.publicKey,amount:key===deployment.vaultPda?controls.contribution:controls.balance,delegateOption:0,delegate:SystemProgram.programId,state:1,isNativeOption:0,isNative:BigInt(0),delegatedAmount:BigInt(0),closeAuthorityOption:0,closeAuthority:SystemProgram.programId},data);value=account(data,TOKEN_PROGRAM_ID);}
        else if(key===position.toBase58() && controls.nonce>0)value=account(await program.coder.accounts.encode('position',{project,investor:investor.publicKey,contributedUnits:new BN(controls.contribution.toString()),nextNonce:new BN(controls.nonce),bump:PublicKey.findProgramAddressSync([Buffer.from('position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId)[1]}),program.programId);
        result={context,value};break;
      }
      case 'getLatestBlockhash':result={context,value:{blockhash:Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:100}};break;
      case 'getFeeForMessage':result={context,value:5000};break;
      case 'getMinimumBalanceForRentExemption':result=1_000_000;break;
      case 'sendTransaction':{
        controls.sends++;
        const transaction=Transaction.from(Buffer.from(request.params[0],'base64'));
        expect(transaction.verifySignatures()).toBe(true);
        const instruction=new BorshInstructionCoder(program.idl).decode(transaction.instructions[0].data)!;
        expect(instruction.name).toBe('finance');
        const args=instruction.data as {amount:{toString():string};expectedNonce:{toString():string}};
        expect(args.amount.toString()).toBe('1250000');
        expect(args.expectedNonce.toString()).toBe('0');
        if(controls.outcome==='confirmed'){controls.nonce=1;controls.contribution=BigInt(1_250_000);controls.balance-=BigInt(1_250_000);}
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
  await page.goto('/projects/bavaria');
  await page.locator('.site-header').getByRole('button',{name:'Connect Solflare'}).click();
  await page.locator('dialog[open]').getByRole('button',{name:'Continue to Solflare'}).click();
  await expect(page.locator('.site-header .wallet-button')).toContainText(address.slice(0,4));
  await page.getByRole('button',{name:'Finance this project'}).click();
  return {controls,dialog:page.locator('dialog[open]'),address};
}
async function review(page:Page) {
  const dialog=page.locator('dialog[open]');
  await dialog.getByLabel('Amount',{exact:true}).fill('1.25');
  await dialog.getByRole('button',{name:'Review commitment'}).click();
  await expect(dialog.getByRole('heading',{name:'Review your test commitment'})).toBeVisible();
}
test('validates exact amounts, reviews project accounts, confirms one program transaction and reads the position',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const {controls,dialog,address}=await fixture(page);
  for(const amount of ['','0','-1','1e3','0.0000001']){await dialog.getByLabel('Amount',{exact:true}).fill(amount);await expect(dialog.getByRole('button',{name:'Review commitment'})).toBeDisabled();}
  await review(page);
  await expect(dialog).toContainText(address);
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
  await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Test financing confirmed');
  expect(controls.signs).toBe(1);expect(controls.sends).toBe(1);
  await expect(page.locator('progress')).toHaveAttribute('value','75000');
  await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'My Portfolio',exact:true}).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByRole('heading',{name:'My Portfolio',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Read Devnet records'}).click();
  await expect(page.locator('.chain-metrics')).toContainText('1.25 JV Test USD');
  await expect(page.locator('.portfolio-metrics')).toContainText('€10,000');
  expect(errors).toEqual([]);
});
test('wallet rejection submits nothing and permits review retry',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.reject=true;
  await review(page);await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('User rejected');
  expect(controls.sends).toBe(0);
  controls.reject=false;
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Test financing confirmed');
  expect(controls.sends).toBe(1);
});
test('pending confirmation blocks another submission and can be checked',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.outcome='pending';
  await review(page);await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Confirmation pending');
  await expect(page.locator('dialog[open]').getByRole('button',{name:'Approve in Solflare'})).toHaveCount(0);
  controls.outcome='confirmed';
  await page.locator('dialog[open]').getByRole('button',{name:'Check confirmation'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Test financing confirmed');
  expect(controls.sends).toBe(1);
});
test('insufficient test tokens and a wrong network stop before signing',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.balance=BigInt(0);
  await dialog.getByLabel('Amount',{exact:true}).fill('1.25');
  await dialog.getByRole('button',{name:'Review commitment'}).click();
  await expect(dialog).toContainText('Insufficient JV Test USD');
  controls.balance=BigInt(20_000_000_000);controls.wrongNetwork=true;
  await dialog.getByRole('button',{name:'Review commitment'}).click();
  await expect(dialog).toContainText('requires Solana Devnet');
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
});
test('insufficient Devnet SOL and a changed position stop before wallet approval',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.sol=0;
  await review(page);await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Insufficient Devnet SOL');
  controls.sol=1e9;controls.nonce=1;
  await page.locator('dialog[open]').getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Your position changed');
  expect(controls.signs).toBe(0);expect(controls.sends).toBe(0);
});
test('confirmation RPC failure retains the signature and permits status checking without a new deposit',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.statusUnavailable=true;
  await review(page);await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Confirmation is unavailable');
  await expect(page.locator('dialog[open]').getByRole('link',{name:'View transaction on Devnet'})).toHaveAttribute('href',/cluster=devnet/);
  controls.statusUnavailable=false;
  await page.locator('dialog[open]').getByRole('button',{name:'Check confirmation'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Test financing confirmed');
  expect(controls.sends).toBe(1);
});
test('failed and expired transactions provide a fresh review rather than resubmitting',async({page})=>{
  const {controls,dialog}=await fixture(page);controls.outcome='failed';
  await review(page);await dialog.getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Transaction failed');
  await page.locator('dialog[open]').getByRole('button',{name:'Review another commitment'}).click();
  controls.outcome='pending';controls.height=101;
  await review(page);await page.locator('dialog[open]').getByRole('button',{name:'Approve in Solflare'}).click();
  await expect(page.locator('dialog[open]')).toContainText('Transaction expired');
  expect(controls.sends).toBe(2);expect(controls.nonce).toBe(0);
});
