import { BN, Program, utils } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import idl from './idl/joint_venture.json';
import deployment from './deployment.json';
import type { JointVenture } from './joint_venture';
import { parseSolAmount } from './amount';

export { deployment };
// Native accounting only. Legacy Project/Position token totals remain untouched.
export type ProjectReadout = {totalLamports:string; contributedLamports:string; nonce:string; balanceLamports:string; vaultBalanceLamports:string; enabled:boolean; hasPosition:boolean; hasVault:boolean};
export type FinanceReview = {address:string; amount:string; nonce:string};
export type FinanceReceipt = {signature:string; lastValidBlockHeight:number; address:string; amount:string; nonce:string};
export type Confirmation = 'confirmed'|'failed'|'pending'|'expired';
function makeClient() {
  const connection=new Connection(deployment.rpc,{commitment:'confirmed',disableRetryOnRateLimit:true,fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(12000)})});
  const program=new Program<JointVenture>(idl as unknown as JointVenture,{connection});
  const project=new PublicKey(deployment.projectPda),vault=new PublicKey(deployment.solVaultPda);
  const [derivedProject]=PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('project'),utils.bytes.utf8.encode('bavaria')],program.programId);
  const [derivedVault,vaultBump]=PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('sol-vault'),project.toBuffer()],program.programId);
  if(program.programId.toBase58()!==deployment.programId || !derivedProject.equals(project) || !derivedVault.equals(vault))throw Error('Project configuration does not match its PDA addresses.');
  return {connection,program,project,vault,vaultBump};
}
let sharedClient:ReturnType<typeof makeClient>|undefined;
function client(){return sharedClient??=makeClient();}

function positionAddress(investor:PublicKey,project:PublicKey,programId:PublicKey) {
  return PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('sol-position'),project.toBuffer(),investor.toBuffer()],programId);
}
function safeLamports(value:number):string {
  if(!Number.isSafeInteger(value)||value<0)throw Error('RPC returned an unsupported lamport balance.');
  return value.toString();
}
export async function readProject(address?:string):Promise<ProjectReadout> {
  const {connection,program,project,vault,vaultBump}=client();
  if(await connection.getGenesisHash()!==deployment.genesisHash)throw Error('This operation requires Solana Devnet.');
  const investor=address?new PublicKey(address):null;
  const position=investor?positionAddress(investor,project,program.programId):null;
  const [accounts,balance]=await Promise.all([connection.getMultipleAccountsInfo([project,vault,...(position?[position[0]]:[])]),investor?connection.getBalance(investor):0]);
  const [raw,vaultRaw,positionRaw]=accounts;
  if(!raw?.owner.equals(program.programId))throw Error('Unexpected Bavaria project owner.');
  const state=program.coder.accounts.decode('project',raw.data);
  if(state.slug!=='bavaria'||state.targetEurCents.toString()!=='25000000')throw Error('Unexpected Bavaria project configuration.');
  const result:ProjectReadout={totalLamports:'0',contributedLamports:'0',nonce:'0',balanceLamports:'0',vaultBalanceLamports:'0',enabled:state.financingEnabled,hasPosition:false,hasVault:!!vaultRaw};
  if(vaultRaw){
    if(!vaultRaw.owner.equals(program.programId))throw Error('Unexpected project SOL vault owner.');
    const record=program.coder.accounts.decode('solVault',vaultRaw.data);
    if(!record.project.equals(project)||record.bump!==vaultBump)throw Error('Unexpected project SOL vault.');
    result.totalLamports=record.totalLamports.toString();result.vaultBalanceLamports=safeLamports(vaultRaw.lamports);
    if(BigInt(result.totalLamports)>BigInt(result.vaultBalanceLamports))throw Error('Recorded SOL exceeds the vault balance.');
  }
  if(investor&&position){
    const bump=position[1];
    result.balanceLamports=safeLamports(balance);
    if(positionRaw){
      if(!positionRaw.owner.equals(program.programId)||!vaultRaw)throw Error('Unexpected SOL position owner or vault.');
      const record=program.coder.accounts.decode('solPosition',positionRaw.data);
      if(!record.project.equals(project)||!record.investor.equals(investor)||record.bump!==bump)throw Error('Unexpected project SOL position.');
      result.contributedLamports=record.contributedLamports.toString();result.nonce=record.nextNonce.toString();result.hasPosition=true;
      if(BigInt(result.contributedLamports)>BigInt(result.totalLamports))throw Error('Position exceeds recorded project financing.');
    }
  }
  return result;
}
async function financeTransaction(review:FinanceReview,latest:ProjectReadout) {
  const lamports=parseSolAmount(review.amount);
  if(lamports===null||!/^\d+$/.test(review.nonce)||BigInt(review.nonce)>BigInt('18446744073709551615'))throw Error('Enter a positive SOL amount with at most nine decimals.');
  if(!latest.enabled)throw Error('Bavaria financing is paused.');
  if(latest.nonce!==review.nonce)throw Error('Your position changed. Refresh and review new financing.');
  const {connection,program,project,vault}=client(),investor=new PublicKey(review.address);
  const block=await connection.getLatestBlockhash('confirmed');
  const transaction=new Transaction({feePayer:investor,...block}).add(await program.methods.financeSol(new BN(lamports.toString()),new BN(review.nonce)).accountsStrict({investor,project,solVault:vault,solPosition:positionAddress(investor,project,program.programId)[0],systemProgram:SystemProgram.programId}).instruction());
  const [fee,balance,positionRent,vaultRent]=await Promise.all([
    connection.getFeeForMessage(transaction.compileMessage()),connection.getBalance(investor),
    latest.hasPosition?0:connection.getMinimumBalanceForRentExemption(89),latest.hasVault?0:connection.getMinimumBalanceForRentExemption(49),
  ]);
  if(fee.value===null)throw Error('Transaction fee is unavailable. Try reviewing again.');
  const required=lamports+BigInt(safeLamports(fee.value))+BigInt(positionRent)+BigInt(vaultRent);
  if(BigInt(safeLamports(balance))<required)throw Error('Insufficient Devnet SOL. Leave enough for financing, network fees and new account rent.');
  return {connection,transaction,block};
}
export async function prepareFinance(address:string,amount:string) {
  const data=await readProject(address),review={address,amount,nonce:data.nonce};
  await financeTransaction(review,data);
  return {data,review};
}
export async function submitFinance(review:FinanceReview,sign:(transaction:Transaction)=>Promise<Transaction>,stillConnected:()=>boolean,onSubmitted:(receipt:FinanceReceipt)=>void):Promise<FinanceReceipt> {
  const latest=await readProject(review.address);
  const {connection,transaction,block}=await financeTransaction(review,latest);
  if(!stillConnected())throw Error('The connected wallet changed. Review again.');
  const message=transaction.serializeMessage(),signed=await sign(transaction);
  if(!stillConnected())throw Error('The connected wallet changed. The transaction was not submitted.');
  if(!message.equals(signed.serializeMessage())||!signed.signature)throw Error('The wallet returned a different transaction. Nothing was submitted.');
  const wire=signed.serialize();
  const signature=utils.bytes.bs58.encode(signed.signature),receipt={signature,lastValidBlockHeight:block.lastValidBlockHeight,...review};
  onSubmitted(receipt);
  if(await connection.sendRawTransaction(wire,{skipPreflight:false,maxRetries:2})!==signature)throw Error('Unexpected transaction response. Check the saved signature before retrying.');
  return receipt;
}
export async function checkFinance(receipt:FinanceReceipt):Promise<Confirmation> {
  const {connection}=client();
  if(await connection.getGenesisHash()!==deployment.genesisHash)throw Error('This operation requires Solana Devnet.');
  const [statuses,height]=await Promise.all([connection.getSignatureStatuses([receipt.signature],{searchTransactionHistory:true}),connection.getBlockHeight('confirmed')]);
  const status=statuses.value[0];
  if(status?.err)return 'failed';
  if(status?.confirmationStatus==='confirmed'||status?.confirmationStatus==='finalized')return 'confirmed';
  if(status)return 'pending';
  return height>receipt.lastValidBlockHeight?'expired':'pending';
}
