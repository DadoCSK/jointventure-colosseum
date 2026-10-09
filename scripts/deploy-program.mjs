import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Connection, Keypair } from '@solana/web3.js';
import { DEVNET_RPC, DEVNET_GENESIS, adminKeypair, localKeypair } from './chain-client.mjs';

const local = process.argv.includes('--local');
const rpc = local ? 'http://127.0.0.1:8899' : DEVNET_RPC;
const connection = new Connection(rpc, 'confirmed');
if (!local && await connection.getGenesisHash() !== DEVNET_GENESIS) throw new Error('Refusing a non-Devnet deployment');
const binary = 'chain/target/deploy/joint_venture.so';
const programFile = '.localkeys/joint-venture-program.json';
const program = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(programFile, 'utf8'))));
const idl = JSON.parse(fs.readFileSync('chain/target/idl/joint_venture.json','utf8'));
if(idl.address!==program.publicKey.toBase58()) throw new Error('Program identity differs from its generated interface');
const adminFile = process.env.JV_ADMIN_KEYPAIR ?? path.join(os.homedir(), '.config/solana/id.json');
const existing = await connection.getAccountInfo(program.publicKey);
const size = fs.statSync(binary).size;
const balance = await connection.getBalance(adminKeypair().publicKey);
console.log(JSON.stringify({network:local?'localnet':'devnet',programId:program.publicKey.toBase58(),binaryBytes:size,authorityBalanceSol:balance/1e9,operation:existing?'upgrade':'initial deployment'}));
const bufferName=local?'local-deployment-buffer':'devnet-deployment-buffer';
localKeypair(bufferName);
const result = spawnSync(process.env.JV_SOLANA_CLI ?? 'solana', ['program','deploy',binary,'--program-id',programFile,'--buffer',`.localkeys/${bufferName}.json`,'--keypair',adminFile,'--url',rpc,'--commitment','confirmed','--max-len',String(size),'--output','json'], {encoding:'utf8'});
if(result.status !== 0) {
  const output=result.stderr || result.stdout;
  // Never relay the CLI's ephemeral recovery mnemonic to logs.
  throw new Error(output.slice(output.lastIndexOf('Error:')) || 'Deployment failed; use the private saved buffer keypair to resume.');
}
console.log(result.stdout);
if(!local) {
  fs.mkdirSync('chain/receipts',{recursive:true});
  fs.writeFileSync(`chain/receipts/deploy-${Date.now()}.json`,JSON.stringify({network:'devnet',programId:program.publicKey.toBase58(),binarySha256:createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),binaryBytes:size,deployedAt:new Date().toISOString(),result:JSON.parse(result.stdout)},null,2)+'\n');
}
