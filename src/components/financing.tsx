"use client";
import {useEffect,useState} from 'react';
import {ArrowUpRight,CheckCircle2,RefreshCw} from 'lucide-react';
import {Modal} from './modal';
import {useWallet} from './wallet-provider';
import Link from 'next/link';
import {bavaria} from '@/data/projects';
import deployment from '@/chain/deployment.json';
import {formatTokenUnits,parseTokenAmount} from '@/chain/amount';
import type {FinanceReview,ProjectReadout} from '@/chain/client';

const explorer=(address:string)=>`https://explorer.solana.com/address/${address}?cluster=devnet`;
function ProjectLinks() {
  return <div className="chain-links">
    {([['Program',deployment.programId],['Project PDA',deployment.projectPda],['Project vault',deployment.vaultPda],['JV Test USD mint',deployment.mint]] as const).map(([label,address])=><a className="text-link" href={explorer(address)} target="_blank" rel="noreferrer" key={label}>{label} <ArrowUpRight size={13}/></a>)}
  </div>;
}
export const DEMO_TARGET_UNITS = BigInt(100_000_000);
export function OnchainProject({portfolio=false}:{portfolio?:boolean}) {
  const {address, projectResult, projectLoading: loading, projectError: error, refreshProject} = useWallet();
  const current = projectResult && projectResult.address === address ? projectResult.data : null;
  useEffect(() => {
    if (!portfolio || address) void refreshProject();
  }, [portfolio, address, refreshProject]);
  const total = current ? BigInt(current.totalUnits) : null;
  const percent = total === null ? null : Number(total * BigInt(10000) / DEMO_TARGET_UNITS) / 100;
  return <section className="panel onchain-panel" aria-label={portfolio?'Your Devnet Position':'Live Devnet Financing'}>
    <div className="onchain-heading"><span className="eyebrow">SOLANA DEVNET</span><span className="status-badge">Technical demo</span></div>
    <h2>{portfolio?'Your Devnet Position':'Live Devnet Financing'}</h2>
    <p>Technical demo only. JV Test USD has no monetary value.</p>
    {portfolio && <div className="position-project"><span>Project</span><strong>{bavaria.name}</strong></div>}
    {loading && <p role="status">Reading Devnet…</p>}
    {current && <div className="chain-metrics" aria-live="polite">
      <div><span>JV Test USD committed</span><strong data-live-total>{formatTokenUnits(current.totalUnits)} / 100 JV Test USD</strong></div>
      <div><span>Demo target</span><strong>100 JV Test USD</strong></div>
      <div className="live-progress"><span>{percent}% of demo target</span><progress className="progress progress-primary" aria-label="Live Devnet demo financing" aria-valuetext={`${formatTokenUnits(current.totalUnits)} of 100 JV Test USD, ${percent}%`} max={100} value={Math.min(percent!,100)}/></div>
      {address && <>
        <div className={portfolio?'primary-position':''}><span>Your Devnet Position</span><strong data-live-position>{formatTokenUnits(current.contributedUnits)} JV Test USD</strong></div>
        <div><span>Wallet token balance</span><strong>{formatTokenUnits(current.balanceUnits)} JV Test USD</strong></div>
      </>}
      {error && <small>Last successful read shown.</small>}
      <div><span>Network</span><strong>Solana Devnet</strong></div><div><span>Demo financing</span><strong>{current.enabled?'Enabled':'Paused'}</strong></div>
    </div>}
    {error && <p role="alert" className="input-error">{error}</p>}
    {!current && !loading && !error && <p className="fine-print">{portfolio&&!address?'Connect a wallet to read your position.':'No chain data read yet.'}</p>}
    <button className="btn btn-outline" disabled={loading || (portfolio && !address)} onClick={()=>void refreshProject()}><RefreshCw size={14}/>{loading?'Reading Devnet…':'Read Devnet records'}</button>
    <details className="technical-details"><summary>Onchain accounts</summary><ProjectLinks/></details>
  </section>;
}

export function FinancingHistory() {
  const {address, financeReceipt: receipt, financeState} = useWallet();
  const currentReceipt = receipt && receipt.address === address ? receipt : null;
  return <section className="panel financing-history"><span className="eyebrow">DEVNET EXPLORER</span><h2>Transaction history</h2>
    {currentReceipt ? <div className="history-row"><strong>{currentReceipt.amount} JV Test USD</strong><span>{financeState}</span><a className="text-link" href={`https://explorer.solana.com/tx/${currentReceipt.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View transaction <ArrowUpRight size={14}/></a></div> : <p>No transaction submitted in this app session.</p>}
    {address && <a className="text-link" href={explorer(address)} target="_blank" rel="noreferrer">Wallet activity on Explorer <ArrowUpRight size={14}/></a>}
    <small>Latest app-session transaction only. Earlier records are on Explorer.</small>
  </section>;
}

export function InvestmentModal({triggerLabel="Finance this project"}:{triggerLabel?:string}) {
  const wallet=useWallet();
  const [amount,setAmount]=useState('10');
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
    <Modal trigger={<>{triggerLabel} <ArrowUpRight size={18}/></>} title="Finance Bavaria" className="btn btn-primary finance-button">
      <span className="modal-phase">JV TEST USD · SOLANA DEVNET</span>
      {receiptVisible ? <div className="completion">
        {wallet.financeState==='confirmed' && <CheckCircle2 size={36}/>}
        <h3>{wallet.financeState==='confirmed'?'Financing recorded on Solana':wallet.financeState==='failed'?'Transaction failed':wallet.financeState==='expired'?'Transaction expired':'Confirmation pending'}</h3>
        <p role="status">{wallet.financeState==='confirmed'?`${receipt!.amount} JV Test USD recorded.`:wallet.financeState==='expired'?'No transaction was found before its blockhash expired. Refresh your position before a new review.':wallet.financeState==='failed'?'No contribution was recorded by this failed transaction.':'Keep the signature and check its status before another commitment.'}</p>
        {wallet.financeState==='confirmed' && <div className="success-summary">
          <p><span>Amount</span><strong>{receipt!.amount} JV Test USD</strong></p>
          <p><span>Project</span><strong>{bavaria.name}</strong></p>
          <p><span>Network</span><strong>Solana Devnet</strong></p>
          <p><span>Updated project demo total</span><strong>{wallet.projectResult && !wallet.projectError && !wallet.projectLoading ? `${formatTokenUnits(wallet.projectResult.data.totalUnits)} / 100 JV Test USD` : wallet.projectLoading ? 'Reading confirmed chain state…' : 'Unavailable — retry the live read'}</strong></p>
          {wallet.projectError && <p role="alert">{wallet.projectError}</p>}
          <Link className="btn btn-outline" href="/portfolio" onClick={event=>event.currentTarget.closest('dialog')?.close()}>View Portfolio</Link>
        </div>}
        <a className="text-link" href={`https://explorer.solana.com/tx/${receipt!.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View transaction on Solana Explorer <ArrowUpRight size={14}/></a>
        <code className="wallet-address">{receipt!.signature}</code>
        {wallet.financeState==='pending'?<button className="btn btn-outline" disabled={wallet.busy} onClick={()=>void wallet.checkFinancing()}>Check confirmation</button>:<button className="btn btn-outline" onClick={()=>{setShowReceipt(false);setReview(null);setError(null);}}>Review another commitment</button>}
      </div>:currentReview ? <div>
        <h3>Review your test commitment</h3>
        <p><strong>{currentReview.amount} JV Test USD</strong> to the Bavaria project vault.</p>
        <label>Signing wallet</label><code className="wallet-address">{currentReview.address}</code>
        <ProjectLinks/>
        <p className="fine-print">Balance: {formatTokenUnits(readout!.balanceUnits)} JV Test USD. Devnet SOL covers fees and position rent. No EUR conversion.</p>
        <details className="technical-details"><summary>Transaction details</summary><p>JV Test USD stays in the project vault. No withdrawals, repayments or investment terms are implemented.</p></details>
        <div className="wallet-panel-actions">
          <button className="btn btn-primary" disabled={wallet.busy} onClick={async(event)=>{
            const dialog=event.currentTarget.closest('dialog');
            dialog?.close();setShowReceipt(true);
            await wallet.financeProject(currentReview);
            if(dialog?.isConnected && !dialog.open) dialog.showModal();
          }}>{wallet.busy?'Waiting for wallet…':'Approve in Wallet'}</button>
          <button className="btn btn-outline" disabled={wallet.busy} onClick={()=>setReview(null)}>Back</button>
        </div>
      </div>:<form onSubmit={event=>{event.preventDefault();void prepare();}}>
        <p>Technical demo only. JV Test USD has no monetary value.</p>
        <label htmlFor="amount">Amount</label>
        <div className="amount-fields">
          <input id="amount" className="input input-bordered" type="text" inputMode="decimal" maxLength={26} required value={amount} onChange={event=>{setAmount(event.target.value);setReview(null);}} aria-describedby="amount-help"/>
          <label className="sr-only" htmlFor="currency">Currency</label><select id="currency" className="select select-bordered" defaultValue="JV Test USD"><option>JV Test USD</option></select>
        </div>
        <p id="amount-help" className="fine-print">Up to six decimals. JV Test USD is not official USDC. No EUR conversion.</p>
        {!valid && <p className="input-error">Enter a positive amount with at most six decimals.</p>}
        {wallet.address?<button disabled={!valid || loading || wallet.busy} className="btn btn-primary full-width" type="submit">{loading?'Checking Devnet…':'Review commitment'}</button>:<button className="btn btn-primary full-width" type="button" disabled={wallet.busy} onClick={event=>{event.currentTarget.closest('dialog')?.close();void wallet.connect();}}>Connect Wallet</button>}
        {!wallet.address && <p className="fine-print">Connect first; review before signing.</p>}
      </form>}
      {(error || wallet.financeError) && <p role="alert" className="input-error">{error || wallet.financeError}</p>}
    </Modal>
    {wallet.financeState==='signing' && <p role="status" className="fine-print">Preparing the transaction or waiting for wallet…</p>}
    {wallet.financeState==='pending' && <p role="status" className="fine-print">A financing attempt is pending. Open the dialog to check its signature.</p>}
  </>;
}
