import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export const DEVNET_RPC = 'https://api.devnet.solana.com';
export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
export function adminKeypair() {
  const filename = process.env.JV_ADMIN_KEYPAIR ?? path.join(os.homedir(), '.config/solana/id.json');
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(filename,'utf8'))));
}
export function localKeypair(name) {
  fs.mkdirSync('.localkeys',{recursive:true,mode:0o700});
  const filename = `.localkeys/${name}.json`;
  if(!fs.existsSync(filename)) fs.writeFileSync(filename,JSON.stringify(Array.from(Keypair.generate().secretKey)),{mode:0o600});
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(filename,'utf8'))));
}
export async function chainClient({local=false}={}) {
  const connection = new Connection(local?'http://127.0.0.1:8899':DEVNET_RPC, 'confirmed');
  if(!local && await connection.getGenesisHash() !== DEVNET_GENESIS) throw new Error('Refusing a non-Devnet network');
  const authority = adminKeypair();
  const idl = JSON.parse(fs.readFileSync('chain/target/idl/joint_venture.json','utf8'));
  const provider = new AnchorProvider(connection,new Wallet(authority),{commitment:'confirmed',preflightCommitment:'confirmed'});
  const program = new Program(idl,provider);
  const [project] = PublicKey.findProgramAddressSync([Buffer.from('project'),Buffer.from('bavaria')],program.programId);
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'),project.toBuffer()],program.programId);
  const [programData] = PublicKey.findProgramAddressSync([program.programId.toBuffer()],LOADER);
  return {connection,authority,provider,program,project,vault,programData};
}
