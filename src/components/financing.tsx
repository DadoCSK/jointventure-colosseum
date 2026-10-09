"use client";
import {useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2,RefreshCw} from 'lucide-react';
import {Modal} from './modal';
import {useWallet} from './wallet-provider';
import deployment from '@/chain/deployment.json';
import {formatTokenUnits,parseTokenAmount} from '@/chain/amount';
import type {FinanceReview,ProjectReadout} from '@/chain/client';

const explorer=(address:string)=>`https://explorer.solana.com/address/${address}?cluster=devnet`;
function ProjectLinks() {
  return <div className="chain-links">
    {([['Project PDA',deployment.projectPda],['Project vault',deployment.vaultPda],['JV Test USD mint',deployment.mint]] as const).map(([label,address])=><a className="text-link" href={explorer(address)} target="_blank" rel="noreferrer" key={label}>{label} <ArrowUpRight size={13}/></a>)}
  </div>;
}
export function OnchainProject({portfolio=false}:{portfolio?:boolean}) {
  const {address}=useWallet();
  const [result,setResult]=useState<{address:string|null;data:ProjectReadout}|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const request=useRef(0);
  const current=result && result.address===(portfolio?address:null)?result.data:null;
  async function refresh() {
    const id=++request.current;
    const account=portfolio?address:null;
    setLoading(true);setError(null);setResult(null);
    try {
      const {readProject}=await import('@/chain/client');
      const data=await readProject(account??undefined);
      if(request.current===id) setResult({address:account,data});
    } catch {if(request.current===id) setError('Unable to read the Devnet project. Try refreshing.');}
    finally {if(request.current===id) setLoading(false);}
  }
  return <section className="panel onchain-panel" aria-label={portfolio?'Your Devnet contribution':'Bavaria on Solana Devnet'}>
    <span className="eyebrow">LIVE DEVNET · TEST TOKENS</span>
    <h2>{portfolio?'Your Bavaria test position':'Bavaria project account'}</h2>
    <p>{portfolio?'Read the connected wallet’s contribution from the project program.':'A real Joint Venture project PDA with a program-controlled token vault.'}</p>
    <ProjectLinks/>
    {current && <div className="chain-metrics" aria-live="polite">
      <div><span>Recorded project deposits</span><strong>{formatTokenUnits(current.totalUnits)} JV Test USD</strong></div>
      {portfolio && address && <>
        <div><span>Your recorded contribution</span><strong>{formatTokenUnits(current.contributedUnits)} JV Test USD</strong></div>
        <div><span>Your wallet’s demo-token balance</span><strong>{formatTokenUnits(current.balanceUnits)} JV Test USD</strong></div>
      </>}
      <p className="fine-print">Financing {current.enabled?'enabled':'paused'} on Devnet.</p>
    </div>}
    {error && <p role="alert" className="input-error">{error}</p>}
    <button className="btn btn-outline" disabled={loading || (portfolio && !address)} onClick={()=>void refresh()}><RefreshCw size={14}/>{loading?'Reading Devnet…':'Read Devnet records'}</button>
    {portfolio && !address && <p className="fine-print">Connect Solflare to read your position.</p>}
    <p className="fine-print">JV Test USD is a dedicated demo token, not official USDC. Live test-token deposits are separate from the EUR case metrics and demo portfolio. No exchange rate, repayment or return is implied.</p>
  </section>;
}
export function InvestmentModal() {
  const wallet=useWallet();
  const [amount,setAmount]=useState('10000');
  const [review,setReview]=useState<FinanceReview|null>(null);
  const [readout,setReadout]=useState<ProjectReadout|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [showReceipt,setShowReceipt]=useState(true);
  const valid=parseTokenAmount(amount)!==null;
  const currentReview=review && review.address===wallet.address && review.amount===amount?review:null;
  const receipt=wallet.financeReceipt;
  const receiptVisible=!!receipt && (showReceipt || wallet.financeState==='pending');
  async function prepare() {
    if(!wallet.address || loading || !valid) return;
    const address=wallet.address;
    setLoading(true);setError(null);
    try {
      const {readProject}=await import('@/chain/client');
      const data=await readProject(address);
      if(!data.enabled) throw Error('Bavaria financing is paused.');
      if(parseTokenAmount(amount)!>BigInt(data.balanceUnits)) throw Error('Insufficient JV Test USD. Obtain the dedicated Devnet demo token first.');
      setReadout(data);setReview({address,amount,nonce:data.nonce});
    } catch(e) {setError(e instanceof Error?e.message:'Unable to read the project. Try again.');}
    finally {setLoading(false);}
  }
  return <>
    <Modal trigger={<>Finance this project <ArrowUpRight size={18}/></>} title="Finance Bavaria" className="btn btn-primary finance-button">
      <span className="modal-phase">JV TEST USD · SOLANA DEVNET</span>
      {receiptVisible ? <div className="completion">
        {wallet.financeState==='confirmed' && <CheckCircle2 size={36}/>}
        <h3>{wallet.financeState==='confirmed'?'Test financing confirmed':wallet.financeState==='failed'?'Transaction failed':wallet.financeState==='expired'?'Transaction expired':'Confirmation pending'}</h3>
        <p role="status">{wallet.financeState==='confirmed'?`${receipt!.amount} JV Test USD was recorded against Bavaria. EUR demo totals remain separate.`:wallet.financeState==='expired'?'No transaction was found before its blockhash expired. Refresh your position before a new review.':wallet.financeState==='failed'?'No contribution was recorded by this failed transaction.':'Keep the signature and check its status before another commitment.'}</p>
        <a className="text-link" href={`https://explorer.solana.com/tx/${receipt!.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View transaction on Devnet <ArrowUpRight size={14}/></a>
        <code className="wallet-address">{receipt!.signature}</code>
        {wallet.financeState==='pending'?<button className="btn btn-outline" disabled={wallet.busy} onClick={()=>void wallet.checkFinancing()}>Check confirmation</button>:<button className="btn btn-outline" onClick={()=>{setShowReceipt(false);setReview(null);setError(null);}}>Review another commitment</button>}
      </div>:currentReview ? <div>
        <h3>Review your test commitment</h3>
        <p><strong>{currentReview.amount} JV Test USD</strong> to the Bavaria project vault.</p>
        <label>Signing wallet</label><code className="wallet-address">{currentReview.address}</code>
        <ProjectLinks/>
        <p className="fine-print">Your wallet holds {formatTokenUnits(readout!.balanceUnits)} JV Test USD. Solflare will request a Devnet transaction signature. Devnet SOL pays fees and first-position rent. Test tokens will be held in the project vault; this MVP has no withdrawal or repayment instruction.</p>
        <p className="fine-print">This creates an onchain demo contribution, with no EUR conversion or established investment terms.</p>
        <div className="wallet-panel-actions">
          <button className="btn btn-primary" disabled={wallet.busy} onClick={async(event)=>{
            const dialog=event.currentTarget.closest('dialog');
            dialog?.close();setShowReceipt(true);
            await wallet.financeProject(currentReview);
            if(dialog?.isConnected && !dialog.open) dialog.showModal();
          }}>{wallet.busy?'Waiting for Solflare…':'Approve in Solflare'}</button>
          <button className="btn btn-outline" disabled={wallet.busy} onClick={()=>setReview(null)}>Back</button>
        </div>
      </div>:<form onSubmit={event=>{event.preventDefault();void prepare();}}>
        <p>Finance Bavaria through its Joint Venture program using dedicated Devnet test tokens.</p>
        <label htmlFor="amount">Amount</label>
        <div className="amount-fields">
          <input id="amount" className="input input-bordered" type="text" inputMode="decimal" maxLength={26} required value={amount} onChange={event=>{setAmount(event.target.value);setReview(null);}} aria-describedby="amount-help"/>
          <label className="sr-only" htmlFor="currency">Currency</label><select id="currency" className="select select-bordered" defaultValue="JV Test USD"><option>JV Test USD</option></select>
        </div>
        <p id="amount-help" className="fine-print">Positive amount, up to six decimals. JV Test USD is not official USDC and has no real monetary value. Project metrics are in EUR; no currency conversion is performed.</p>
        {!valid && <p className="input-error">Enter a positive amount with at most six decimals.</p>}
        {wallet.address?<button disabled={!valid || loading || wallet.busy} className="btn btn-primary full-width" type="submit">{loading?'Checking Devnet…':'Review commitment'}</button>:<button className="btn btn-primary full-width" type="button" disabled={wallet.busy} onClick={event=>{event.currentTarget.closest('dialog')?.close();void wallet.connect();}}>Connect Solflare</button>}
        {!wallet.address && <p className="fine-print">Connection shares your public address. A financing signature is requested only after reviewing a commitment.</p>}
      </form>}
      {(error || wallet.financeError) && <p role="alert" className="input-error">{error || wallet.financeError}</p>}
    </Modal>
    {wallet.financeState==='signing' && <p role="status" className="fine-print">Preparing the transaction or waiting for Solflare…</p>}
    {wallet.financeState==='pending' && <p role="status" className="fine-print">A financing attempt is pending. Open the dialog to check its signature.</p>}
  </>;
}
