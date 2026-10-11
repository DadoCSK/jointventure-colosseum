// Explicit Devnet-only browser smoke. Private signing key stays in Node, never in the page.
import fs from 'node:fs';import assert from 'node:assert/strict';
import anchor from '@coral-xyz/anchor';
import {PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import {chromium,expect} from '@playwright/test';
import {chainClient,localKeypair} from './chain-client.mjs';
const {Program,Wallet,AnchorProvider,BN,utils,BorshInstructionCoder}=anchor;
const receiptFile='chain/receipts/native-sol-smoke.json',attemptFile='chain/receipts/native-sol-smoke-attempt.json';
const {connection,program,project,authority,provider}=await chainClient();
const investor=localKeypair('native-sol-smoke');
const [solVault]=PublicKey.findProgramAddressSync([Buffer.from('sol-vault'),project.toBuffer()],program.programId);
const [solPosition]=PublicKey.findProgramAddressSync([Buffer.from('sol-position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId);
const investorProgram=new Program(program.idl,new AnchorProvider(connection,new Wallet(investor),{commitment:'confirmed'}));
if(fs.existsSync(receiptFile)){
 const receipt=JSON.parse(fs.readFileSync(receiptFile));const tx=await connection.getTransaction(receipt.signature,{commitment:'confirmed',maxSupportedTransactionVersion:0});assert.ok(tx&&!tx.meta.err);console.log('Existing verified smoke transaction '+receipt.signature+'; no duplicate contribution');process.exit(0);
}
if(fs.existsSync(attemptFile))throw Error('A browser smoke signature already exists. Check '+attemptFile+' before any retry; refusing another deposit.');
let warmup=fs.existsSync('chain/receipts/native-sol-smoke-warmup.json')?JSON.parse(fs.readFileSync('chain/receipts/native-sol-smoke-warmup.json')).signature:null;
const existing=await connection.getAccountInfo(solPosition);
if(!existing){
 if(await connection.getBalance(investor.publicKey)<5_000_000)await provider.sendAndConfirm(new Transaction().add(SystemProgram.transfer({fromPubkey:authority.publicKey,toPubkey:investor.publicKey,lamports:5_000_000})));
 warmup=await investorProgram.methods.financeSol(new BN(1),new BN(0)).accountsStrict({investor:investor.publicKey,project,solVault,solPosition,systemProgram:SystemProgram.programId}).rpc();
 fs.writeFileSync('chain/receipts/native-sol-smoke-warmup.json',JSON.stringify({network:'devnet',signature:warmup,investor:investor.publicKey.toBase58(),lamports:'1',purpose:'Create native vault/position; first-time account rent is additional to contribution and network fee'},null,2)+'\n');
}
const beforePosition=await program.account.solPosition.fetch(solPosition),beforeVault=await program.account.solVault.fetch(solVault);
assert.equal(beforePosition.nextNonce.toString(),'1','Refusing to repeat the measured smoke');
const before={investor:await connection.getBalance(investor.publicKey),vault:await connection.getBalance(solVault),position:beforePosition.contributedLamports.toString(),projectTotal:beforeVault.totalLamports.toString()};
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.exposeFunction('nativeSmokeSign',bytes=>{
   const tx=Transaction.from(new Uint8Array(bytes));assert.equal(tx.instructions.length,1);assert.ok(tx.instructions[0].programId.equals(program.programId));
   const decoded=new BorshInstructionCoder(program.idl).decode(tx.instructions[0].data);assert.equal(decoded.name,'financeSol');assert.equal(decoded.data.lamports.toString(),'100000');assert.equal(decoded.data.expectedNonce.toString(),'1');
   const keys=tx.instructions[0].keys.map(k=>k.pubkey.toBase58());assert.ok(keys.includes(project.toBase58())&&keys.includes(solVault.toBase58())&&keys.includes(solPosition.toBase58()));assert.ok(tx.feePayer.equals(investor.publicKey));
   tx.partialSign(investor);const signature=utils.bytes.bs58.encode(tx.signature);
   fs.writeFileSync(attemptFile,JSON.stringify({network:'devnet',signature,lamports:'100000',nonce:'1',investor:investor.publicKey.toBase58(),before,createdAt:new Date().toISOString()},null,2)+'\n');
   return Array.from(tx.serialize());
 });
 await page.addInitScript(({address,bytes})=>{
   const account={address,publicKey:new Uint8Array(bytes),chains:['solana:devnet'],features:['solana:signTransaction']};let accounts=[];const listeners=new Set();
   const wallet={version:'1.0.0',name:'Devnet smoke wallet (test)',icon:'data:image/png;base64,',chains:['solana:devnet'],get accounts(){return accounts;},features:{
     'standard:connect':{version:'1.0.0',connect:async()=>{accounts=[account];return{accounts};}},
     'standard:disconnect':{version:'1.0.0',disconnect:async()=>{accounts=[];listeners.forEach(fn=>fn({accounts}));}},
     'standard:events':{version:'1.0.0',on:(_event,fn)=>{listeners.add(fn);return()=>listeners.delete(fn);}},
     'solana:signTransaction':{version:'1.0.0',supportedTransactionVersions:['legacy'],signTransaction:async input=>{if(input.chain!=='solana:devnet')throw Error('Wrong network');return[{signedTransaction:new Uint8Array(await window.nativeSmokeSign(Array.from(input.transaction)))}];}},
   }};
   window.addEventListener('wallet-standard:app-ready',event=>event.detail.register(wallet));
 },{address:investor.publicKey.toBase58(),bytes:Array.from(investor.publicKey.toBytes())});
 await page.goto('http://localhost:3000/projects/bavaria');
 await page.locator('.site-header').getByRole('button',{name:'Connect Wallet'}).click();await page.locator('dialog[open]').getByRole('button',{name:'Devnet smoke wallet (test)'}).click();
 await expect(page.locator('.wallet-button')).toContainText(investor.publicKey.toBase58().slice(0,4));
 await page.getByRole('button',{name:'Finance this project'}).click();const dialog=page.locator('dialog[open]');await dialog.getByLabel('Amount',{exact:true}).fill('0.0001');await dialog.getByRole('button',{name:'Review Financing'}).click();
 await expect(dialog.getByRole('heading',{name:'Review financing'})).toBeVisible({timeout:25000});await dialog.getByRole('button',{name:'Approve in Wallet'}).click();
 for(let i=0;i<12;i++){
   if((await dialog.innerText()).includes('Financing recorded on Solana'))break;
   const check=dialog.getByRole('button',{name:'Check confirmation'});if(await check.isVisible()&&!await check.isDisabled())await check.click();await page.waitForTimeout(1000);
 }
 await expect(dialog).toContainText('Financing recorded on Solana',{timeout:20000});
 const signature=await dialog.locator('code.wallet-address').innerText();assert.equal(signature,JSON.parse(fs.readFileSync(attemptFile)).signature);
 const tx=await connection.getTransaction(signature,{commitment:'confirmed',maxSupportedTransactionVersion:0});assert.ok(tx&&!tx.meta.err);
 const position=await program.account.solPosition.fetch(solPosition),vault=await program.account.solVault.fetch(solVault);
 const after={investor:await connection.getBalance(investor.publicKey),vault:await connection.getBalance(solVault),position:position.contributedLamports.toString(),projectTotal:vault.totalLamports.toString()};
 assert.equal(before.investor-after.investor,100000+tx.meta.fee);assert.equal(after.vault-before.vault,100000);assert.equal(BigInt(after.position)-BigInt(before.position),100000n);assert.equal(BigInt(after.projectTotal)-BigInt(before.projectTotal),100000n);
 await expect(page.locator('[data-live-total]')).toHaveText('0.000100001 SOL',{timeout:20000});await expect(page.locator('[data-live-position]')).toHaveText('0.000100001 SOL');await expect(page.locator('[data-live-vault]')).toHaveText(after.vault/1e9+' SOL');
 await expect(dialog.getByRole('link',{name:'View transaction on Solana Explorer'})).toHaveAttribute('href',`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
 await page.keyboard.press('Escape');await page.screenshot({path:'/tmp/jv-native-sol-real-smoke.png',fullPage:true});
 await page.locator('nav').getByRole('link',{name:'Portfolio',exact:true}).click();await expect(page.locator('[data-live-position]')).toHaveText('0.000100001 SOL',{timeout:20000});await expect(page.locator('main')).not.toContainText('JV Test USD');
 assert.deepEqual(errors,[],'Browser errors');
 const result={network:'devnet',verifiedAt:new Date().toISOString(),programId:program.programId.toBase58(),project:project.toBase58(),solVault:solVault.toBase58(),solPosition:solPosition.toBase58(),investor:investor.publicKey.toBase58(),signature,warmupSignature:warmup,lamports:'100000',sol:'0.0001',feeLamports:tx.meta.fee,before,after,frontendUpdatedWithoutRefresh:true,portfolioReadback:true,explorer:`https://explorer.solana.com/tx/${signature}?cluster=devnet`,browserErrors:errors};
 fs.writeFileSync(receiptFile,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
