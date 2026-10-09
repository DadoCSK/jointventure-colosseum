import fs from 'node:fs';
import assert from 'node:assert/strict';
import anchor from '@coral-xyz/anchor';
import {PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import {getOrCreateAssociatedTokenAccount,mintTo,getAccount,TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {chainClient,localKeypair} from './chain-client.mjs';
const {AnchorProvider,Program,Wallet,BN}=anchor;
const {connection,authority,program,project,vault}=await chainClient();
const investor=localKeypair('devnet-smoke-wallet');
const state=await program.account.project.fetch(project);
const [position]=PublicKey.findProgramAddressSync([Buffer.from('position'),project.toBuffer(),investor.publicKey.toBuffer()],program.programId);
// Re-running verifies the existing proof, rather than depositing again.
if(await connection.getAccountInfo(position)) {
  const record=await program.account.position.fetch(position);
  assert.equal(record.contributedUnits.toString(),'1250000');
  console.log('PASS: existing Devnet smoke contribution is 1.25 JV Test USD');
  process.exit(0);
}
if(await connection.getBalance(investor.publicKey)<10_000_000) await new AnchorProvider(connection,new Wallet(authority),{commitment:'confirmed'}).sendAndConfirm(new Transaction().add(SystemProgram.transfer({fromPubkey:authority.publicKey,toPubkey:investor.publicKey,lamports:10_000_000})));
const source=await getOrCreateAssociatedTokenAccount(connection,authority,state.acceptedMint,investor.publicKey);
await mintTo(connection,authority,state.acceptedMint,source.address,authority,1_250_000n);
const before=state.totalFinancedUnits;
const vaultBefore=(await getAccount(connection,vault)).amount;
const testProgram=new Program(program.idl,new AnchorProvider(connection,new Wallet(investor),{commitment:'confirmed'}));
const signature=await testProgram.methods.finance(new BN(1_250_000),new BN(0)).accountsStrict({investor:investor.publicKey,project,mint:state.acceptedMint,vault,source:source.address,position,tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId}).rpc();
const record=await program.account.position.fetch(position);
assert.equal(record.contributedUnits.toString(),'1250000');
assert.equal(record.nextNonce.toString(),'1');
assert.equal((await program.account.project.fetch(project)).totalFinancedUnits.sub(before).toString(),'1250000');
assert.equal((await getAccount(connection,vault)).amount-vaultBefore,1_250_000n);
const receipt={network:'devnet',amount:'1.25 JV Test USD',project:project.toBase58(),vault:vault.toBase58(),investor:investor.publicKey.toBase58(),position:position.toBase58(),signature,verifiedAt:new Date().toISOString()};
fs.writeFileSync('chain/receipts/financing-smoke.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({...receipt,verified:true}));
