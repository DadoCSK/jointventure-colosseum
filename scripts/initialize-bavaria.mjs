import fs from 'node:fs';
import { createMint, getMint, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import { chainClient, localKeypair, DEVNET_GENESIS, DEVNET_RPC } from './chain-client.mjs';

const local=process.argv.includes('--local');
const {connection,authority,program,project,vault,programData}=await chainClient({local});
const executable=await connection.getAccountInfo(program.programId);
if(!executable?.executable) throw new Error('Deploy the project program before initializing Bavaria');
const mintKeypair=localKeypair(local?'local-test-usd-mint':'jv-test-usd-mint');
let mint;
if(await connection.getAccountInfo(mintKeypair.publicKey)) mint=mintKeypair.publicKey;
else mint=await createMint(connection,authority,authority.publicKey,null,6,mintKeypair,{commitment:'confirmed'});
const mintInfo=await getMint(connection,mint);
if(mintInfo.decimals!==6 || !mintInfo.mintAuthority?.equals(authority.publicKey)) throw new Error('Unexpected JV Test USD mint configuration');
let initializationSignature=null;
if(!(await connection.getAccountInfo(project))) {
  initializationSignature=await program.methods.initializeBavaria().accountsStrict({authority:authority.publicKey,programAccount:program.programId,programData,project,mint,vault,tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId}).rpc();
}
const account=await program.account.project.fetch(project);
const vaultAccount=await getAccount(connection,vault);
if(account.slug!=='bavaria' || !account.authority.equals(authority.publicKey) || !account.acceptedMint.equals(mint) || !vaultAccount.owner.equals(project) || !vaultAccount.mint.equals(mint)) throw new Error('Onchain project/vault does not match the intended Bavaria configuration');
if(account.targetEurCents.toString()!=='25000000' || account.infrastructureEurCents.toString()!=='22000000' || account.contractedMonthlyRevenueEurCents.toString()!=='3300000') throw new Error('Project case values differ from the agreed figures');
const deployment={network:local?'localnet':'devnet',rpc:local?'http://127.0.0.1:8899':DEVNET_RPC,genesisHash:local?await connection.getGenesisHash():DEVNET_GENESIS,programId:program.programId.toBase58(),projectPda:project.toBase58(),vaultPda:vault.toBase58(),authority:authority.publicKey.toBase58(),mint:mint.toBase58(),tokenName:'JV Test USD',tokenSymbol:'JVTEST',decimals:6,stage:account.financingEnabled?'financing-enabled':'project-initialized',initializationSignature};
if(!local) {
  fs.mkdirSync('src/chain/idl',{recursive:true});
  if(fs.existsSync('src/chain/deployment.json')) {
    const previous=JSON.parse(fs.readFileSync('src/chain/deployment.json','utf8'));
    if(previous.projectPda===deployment.projectPda && !initializationSignature) deployment.initializationSignature=previous.initializationSignature;
  }
  fs.copyFileSync('chain/target/idl/joint_venture.json','src/chain/idl/joint_venture.json');
  fs.writeFileSync('src/chain/deployment.json',JSON.stringify(deployment,null,2)+'\n');
  fs.mkdirSync('chain/receipts',{recursive:true});
  if(initializationSignature) fs.writeFileSync('chain/receipts/initialization.json',JSON.stringify({...deployment,verifiedAt:new Date().toISOString()},null,2)+'\n');
}
console.log(JSON.stringify({...deployment,verified:true,totalFinancedUnits:account.totalFinancedUnits.toString()},null,2));
