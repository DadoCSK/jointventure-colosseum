import fs from 'node:fs';
import assert from 'node:assert/strict';
import anchor from '@coral-xyz/anchor';
import {Connection,PublicKey} from '@solana/web3.js';
import {getAssociatedTokenAddressSync, getAccount} from '@solana/spl-token';
const deployment=JSON.parse(fs.readFileSync('src/chain/deployment.json','utf8'));
const connection=new Connection(deployment.rpc,{commitment:'finalized',disableRetryOnRateLimit:true});
assert.equal(await connection.getGenesisHash(),'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
const programId=new PublicKey(deployment.programId);
const beforeFile='chain/receipts/phase-2f-state-before.json';
if(process.argv.includes('--snapshot')) {
  if(fs.existsSync(beforeFile)) throw Error('Snapshot already exists; refusing to overwrite the baseline');
  const accounts=await connection.getProgramAccounts(programId);
  const keys=[deployment.programId,deployment.projectPda,deployment.vaultPda,deployment.mint,...accounts.map(a=>a.pubkey.toBase58())];
  const snapshot={network:'devnet',capturedAt:new Date().toISOString(),deployment,accounts:[]};
  for(const address of [...new Set(keys)]) {
    const account=await connection.getAccountInfo(new PublicKey(address));
    assert.ok(account,'Missing account '+address);
    snapshot.accounts.push({address,owner:account.owner.toBase58(),data:account.data.toString('base64'),lamports:account.lamports,executable:account.executable});
  }
  fs.writeFileSync(beforeFile,JSON.stringify(snapshot,null,2)+'\n');
  console.log('Captured public state baseline for '+snapshot.accounts.length+' existing accounts');
} else {
  const before=JSON.parse(fs.readFileSync(beforeFile,'utf8'));
  for(const key of ['programId','projectPda','vaultPda','mint','authority']) assert.equal(deployment[key],before.deployment[key]);
  for(const expected of before.accounts) {
    const current=await connection.getAccountInfo(new PublicKey(expected.address));
    assert.ok(current,'Existing account disappeared');
    assert.equal(current.data.toString('base64'),expected.data,'Existing account data changed: '+expected.address);
    assert.equal(current.owner.toBase58(),expected.owner);
    assert.equal(current.lamports,expected.lamports);
    assert.equal(current.executable,expected.executable);
  }
  const program=new anchor.Program(JSON.parse(fs.readFileSync('src/chain/idl/joint_venture.json','utf8')),{connection});
  const state=await program.account.project.fetch(new PublicKey(deployment.projectPda));
  const positions=await program.account.position.all();
  const acceptance=JSON.parse(fs.readFileSync('chain/receipts/wallet-acceptance.json','utf8'));
  const source=getAssociatedTokenAddressSync(new PublicKey(deployment.mint),new PublicKey(acceptance.investor));
  const walletToken=await getAccount(connection,source,'finalized');
  assert.equal(walletToken.amount.toString(), '9998000000', 'Accepted user wallet balance changed');
  const result={network:'devnet',verifiedAt:new Date().toISOString(),allExistingAccountsUnchanged:true,accountsVerified:before.accounts.length,projectPda:deployment.projectPda,vaultPda:deployment.vaultPda,mint:deployment.mint,totalFinancedUnits:state.totalFinancedUnits.toString(),positions:positions.map(p=>({address:p.publicKey.toBase58(),investor:p.account.investor.toBase58(),units:p.account.contributedUnits.toString(),nextNonce:p.account.nextNonce.toString()}))};
  result.userWalletTokenBalanceUnits=walletToken.amount.toString();
  fs.writeFileSync('chain/receipts/phase-2f-state-after.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}
