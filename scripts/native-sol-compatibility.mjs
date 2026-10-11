import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Connection,PublicKey} from '@solana/web3.js';
import {BorshAccountsCoder} from '@coral-xyz/anchor';
const deployment=JSON.parse(fs.readFileSync('src/chain/deployment.json','utf8'));
const file='chain/receipts/native-sol-state-before.json';
const connection=new Connection(deployment.rpc,{commitment:'finalized',disableRetryOnRateLimit:true});
assert.equal(await connection.getGenesisHash(),deployment.genesisHash);
const idl=JSON.parse(fs.readFileSync('src/chain/idl/joint_venture.json','utf8'));
if(process.argv.includes('--snapshot')){
  assert.ok(!fs.existsSync(file),'Refusing to overwrite pre-upgrade snapshot');
  const programAccounts=await connection.getProgramAccounts(new PublicKey(deployment.programId));
  const keys=[deployment.programId,deployment.vaultPda,deployment.mint,...programAccounts.map(a=>a.pubkey.toBase58())];
  const accounts=[];
  for(const address of keys){const a=await connection.getAccountInfo(new PublicKey(address));assert.ok(a);accounts.push({address,owner:a.owner.toBase58(),lamports:a.lamports,executable:a.executable,data:a.data.toString('base64')});}
  fs.writeFileSync(file,JSON.stringify({network:'devnet',capturedAt:new Date().toISOString(),deployment,idl,accounts},null,2)+'\n');
  console.log('Saved pre-upgrade public account/IDL snapshot: '+accounts.length+' accounts');
}else{
  const before=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const name of ['project','position','documentRecord']){
    assert.deepEqual(idl.accounts.find(a=>a.name===name),before.idl.accounts.find(a=>a.name===name),'Discriminator changed: '+name);
    assert.deepEqual(idl.types.find(a=>a.name===name),before.idl.types.find(a=>a.name===name),'Serialized layout changed: '+name);
  }
  for(const category of ['instructions','types','errors','events'])for(const entry of before.idl[category]??[])assert.deepEqual((idl[category]??[]).find(e=>e.name===entry.name),entry,'Legacy interface changed: '+category+' '+entry.name);
  for(const key of ['programId','projectPda','vaultPda','mint','authority'])assert.equal(deployment[key],before.deployment[key]);
  const oldCoder=new BorshAccountsCoder(before.idl),newCoder=new BorshAccountsCoder(idl);
  for(const old of before.accounts){
    const a=await connection.getAccountInfo(new PublicKey(old.address));assert.ok(a);
    assert.equal(a.data.toString('base64'),old.data,'Legacy data changed: '+old.address);assert.equal(a.owner.toBase58(),old.owner);assert.equal(a.lamports,old.lamports);assert.equal(a.executable,old.executable);
    if(old.owner===deployment.programId){
      const data=Buffer.from(old.data,'base64');const name=before.idl.accounts.find(a=>Buffer.from(a.discriminator).equals(data.subarray(0,8))).name;
      const encode=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x);
      assert.equal(encode(newCoder.decode(name,data)),encode(oldCoder.decode(name,data)));
    }
  }
  const result={verifiedAt:new Date().toISOString(),allLegacyAccountsUnchanged:true,oldAndNewLayoutsIdentical:true,accountsVerified:before.accounts.length,snapshotSha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
  fs.writeFileSync('chain/receipts/native-sol-compatibility.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
