import fs from 'node:fs';
import {chainClient} from './chain-client.mjs';
const local=process.argv.includes('--local');
const {program,project,authority}=await chainClient({local});
const enabled=!process.argv.includes('--pause');
const signature=await program.methods.setFinancingEnabled(enabled).accountsStrict({authority:authority.publicKey,project}).rpc();
if((await program.account.project.fetch(project)).financingEnabled!==enabled) throw new Error('Financing state readback failed');
if(!local) {
  const manifest=JSON.parse(fs.readFileSync('src/chain/deployment.json','utf8'));
  manifest.stage=enabled?'financing-enabled':'financing-paused';
  manifest.financingControlSignature=signature;
  fs.copyFileSync('chain/target/idl/joint_venture.json','src/chain/idl/joint_venture.json');
  fs.copyFileSync('chain/target/types/joint_venture.ts','src/chain/joint_venture.ts');
  fs.writeFileSync('src/chain/deployment.json',JSON.stringify(manifest,null,2)+'\n');
}
console.log(JSON.stringify({network:local?'localnet':'devnet',project:project.toBase58(),enabled,signature}));
