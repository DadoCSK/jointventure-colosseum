import { BN, Program, utils } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getAccount, getMint, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import idl from './idl/joint_venture.json';
import deployment from './deployment.json';
import type { JointVenture } from './joint_venture';
import { parseTokenAmount } from './amount';

export { deployment };
export type ProjectReadout = {totalUnits:string; contributedUnits:string; nonce:string; balanceUnits:string; enabled:boolean; hasPosition:boolean};
export type FinanceReview = {address:string; amount:string; nonce:string};
export type FinanceReceipt = {signature:string; lastValidBlockHeight:number; address:string; amount:string; nonce:string};
export type Confirmation = 'confirmed'|'failed'|'pending'|'expired';
function client() {
  const connection=new Connection(deployment.rpc,{commitment:'confirmed',disableRetryOnRateLimit:true,fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(12000)})});
  const program=new Program<JointVenture>(idl as unknown as JointVenture,{connection});
  const project=new PublicKey(deployment.projectPda);
  const vault=new PublicKey(deployment.vaultPda);
  const mint=new PublicKey(deployment.mint);
  const [derivedProject]=PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('project'),utils.bytes.utf8.encode('bavaria')],program.programId);
  const [derivedVault]=PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('vault'),project.toBuffer()],program.programId);
  if(!program.programId.equals(new PublicKey(deployment.programId)) || !derivedProject.equals(project) || !derivedVault.equals(vault)) throw new Error('Project configuration does not match its PDA addresses.');
  return {connection,program,project,vault,mint};
}
function positionAddress(investor:PublicKey, project:PublicKey, programId:PublicKey) {
  return PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('position'),project.toBuffer(),investor.toBuffer()],programId)[0];
}
export async function readProject(address?:string):Promise<ProjectReadout> {
  const {connection,program,project,vault,mint}=client();
  if(await connection.getGenesisHash()!==deployment.genesisHash) throw new Error('This operation requires Solana Devnet.');
  const [raw,state,mintState,vaultState]=await Promise.all([connection.getAccountInfo(project),program.account.project.fetch(project),getMint(connection,mint),getAccount(connection,vault)]);
  if(!raw?.owner.equals(program.programId) || state.slug!=='bavaria' || !state.acceptedMint.equals(mint) || mintState.decimals!==6 || !vaultState.owner.equals(project) || !vaultState.mint.equals(mint)) throw new Error('The onchain project or token vault differs from the approved configuration.');
  const result:ProjectReadout={totalUnits:state.totalFinancedUnits.toString(),contributedUnits:'0',nonce:'0',balanceUnits:'0',enabled:state.financingEnabled,hasPosition:false};
  if(address) {
    const investor=new PublicKey(address);
    const position=positionAddress(investor,project,program.programId);
    const source=getAssociatedTokenAddressSync(mint,investor);
    const [positionRaw,sourceRaw]=await Promise.all([connection.getAccountInfo(position),connection.getAccountInfo(source)]);
    if(positionRaw) {
      if(!positionRaw.owner.equals(program.programId)) throw new Error('Unexpected position account owner.');
      const record=await program.account.position.fetch(position);
      if(!record.project.equals(project) || !record.investor.equals(investor)) throw new Error('Unexpected project position.');
      result.contributedUnits=record.contributedUnits.toString();
      result.nonce=record.nextNonce.toString();
      result.hasPosition=true;
    }
    if(sourceRaw) {
      const token=await getAccount(connection,source);
      if(!token.owner.equals(investor) || !token.mint.equals(mint)) throw new Error('Unexpected wallet token account.');
      result.balanceUnits=token.amount.toString();
    }
  }
  return result;
}
export async function submitFinance(review:FinanceReview, sign:(transaction:Transaction)=>Promise<Transaction>, stillConnected:()=>boolean, onSubmitted:(receipt:FinanceReceipt)=>void):Promise<FinanceReceipt> {
  const units=parseTokenAmount(review.amount);
  if(units===null || !/^\d+$/.test(review.nonce)) throw new Error('Enter a positive amount with at most six decimals.');
  const latest=await readProject(review.address);
  if(!latest.enabled) throw new Error('Bavaria financing is paused.');
  if(latest.nonce!==review.nonce) throw new Error('Your position changed. Refresh and review a new commitment.');
  if(units>BigInt(latest.balanceUnits)) throw new Error('Insufficient JV Test USD. Obtain the dedicated demo token first.');
  const {connection,program,project,vault,mint}=client();
  const investor=new PublicKey(review.address);
  const block=await connection.getLatestBlockhash('confirmed');
  const transaction=new Transaction({feePayer:investor,...block}).add(await program.methods.finance(new BN(units.toString()),new BN(review.nonce)).accountsStrict({investor,project,mint,vault,source:getAssociatedTokenAddressSync(mint,investor),position:positionAddress(investor,project,program.programId),tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId}).instruction());
  const [fee,sol]=await Promise.all([connection.getFeeForMessage(transaction.compileMessage()),connection.getBalance(investor)]);
  const rent=latest.hasPosition?0:await connection.getMinimumBalanceForRentExemption(89);
  if(fee.value===null || sol<fee.value+rent) throw new Error('Insufficient Devnet SOL for transaction fees and the position account rent.');
  if(!stillConnected()) throw new Error('The connected wallet changed. Review again.');
  const message=transaction.serializeMessage();
  const signed=await sign(transaction);
  if(!stillConnected()) throw new Error('The connected wallet changed. The transaction was not submitted.');
  if(!message.equals(signed.serializeMessage()) || !signed.signature) throw new Error('The wallet returned a different transaction. Nothing was submitted.');
  const wire=signed.serialize(); // verifies the expected wallet signature
  const signature=utils.bytes.bs58.encode(signed.signature);
  const receipt={signature,lastValidBlockHeight:block.lastValidBlockHeight,...review};
  // Keep the signature even if submission times out: the RPC may already have received it.
  onSubmitted(receipt);
  const returned=await connection.sendRawTransaction(wire,{skipPreflight:false,maxRetries:2});
  if(returned!==signature) throw new Error('Unexpected transaction response. Check the saved signature before retrying.');
  return receipt;
}
export async function checkFinance(receipt:FinanceReceipt):Promise<Confirmation> {
  const {connection}=client();
  if(await connection.getGenesisHash()!==deployment.genesisHash) throw new Error('This operation requires Solana Devnet.');
  const [statuses,height]=await Promise.all([connection.getSignatureStatuses([receipt.signature],{searchTransactionHistory:true}),connection.getBlockHeight('confirmed')]);
  const status=statuses.value[0];
  if(status?.err) return 'failed';
  if(status?.confirmationStatus==='confirmed' || status?.confirmationStatus==='finalized') return 'confirmed';
  if(status) return 'pending';
  return height>receipt.lastValidBlockHeight?'expired':'pending';
}
