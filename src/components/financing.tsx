"use client";
import {useEffect,useState} from 'react';
import {ArrowUpRight,CheckCircle2,RefreshCw} from 'lucide-react';
import {Modal} from './modal';
import {useWallet} from './wallet-provider';
import Link from 'next/link';
import {bavaria} from '@/data/projects';
import deployment from '@/chain/deployment.json';
import {formatSolLamports,parseSolAmount} from '@/chain/amount';
import {EurEquivalent,PriceLabel} from './market-price';
import type {FinanceReview,ProjectReadout} from '@/chain/client';

const explorer=(address:string)=>`https://explorer.solana.com/address/${address}?cluster=devnet`;
function ProjectLinks() {
  return <div className="chain-links">
    {([['Program',deployment.programId],['Project PDA',deployment.projectPda],['Project SOL Vault',deployment.solVaultPda]] as const).map(([label,address])=><a className="text-link" href={explorer(address)} target="_blank" rel="noreferrer" key={label}>{label} <ArrowUpRight size={13}/></a>)}
  </div>;
}
export function OnchainProject({portfolio=false}:{portfolio?:boolean}) {
  const {address,price,projectResult,projectLoading:loading,projectError:error,refreshProject}=useWallet();
  const current=projectResult?.address===address?projectResult.data:null;
  useEffect(()=>{if(!portfolio||address)void refreshProject();},[portfolio,address,refreshProject]);
  return <section className="panel onchain-panel" aria-label={portfolio?'Your Devnet Position':'Live Devnet Financing'}>
    <div className="onchain-heading"><span className="eyebrow">SOLANA DEVNET</span><span className="simulation-badge">DEVNET DEMO</span></div>
    <h2>{portfolio?'Your Devnet Position':'Live Devnet Financing'}</h2>
    <p>Devnet SOL has no monetary value. Demo contributions are not real capital.</p>
    {portfolio&&<div className="position-project"><span>Project</span><strong>{bavaria.name}</strong></div>}
    {loading&&<p role="status">Reading Devnet…</p>}
    {current&&<div className="chain-metrics" aria-live="polite">
      {!portfolio&&<><div><span>Devnet SOL contributed</span><strong data-live-total>{formatSolLamports(current.totalLamports)} SOL</strong></div><div><span>Devnet demo equivalent</span><strong><EurEquivalent lamports={current.totalLamports} price={price}/></strong></div></>}
      {address&&<><div className={portfolio?'primary-position':''}><span>Contributed · Devnet demo position</span><strong data-live-position>{formatSolLamports(current.contributedLamports)} SOL</strong></div><div className={portfolio?'primary-equivalent':''}><span>Current EUR equivalent · Demo</span><strong><EurEquivalent lamports={current.contributedLamports} price={price}/></strong></div>{!portfolio&&<div><span>Wallet balance</span><strong>{formatSolLamports(current.balanceLamports)} SOL</strong></div>}</>}
      <div><span>Project SOL vault balance</span><strong data-live-vault>{formatSolLamports(current.vaultBalanceLamports)} SOL</strong><small>Includes account rent and any direct deposits.</small></div>
      {error&&<small>Last successful read shown.</small>}
      <div><span>Network</span><strong>Solana Devnet</strong></div><div><span>Demo financing</span><strong>{current.enabled?'Enabled':'Paused'}</strong></div>
    </div>}
    <PriceLabel price={price}/>
    {error&&<p role="alert" className="input-error">{error}</p>}
    {!current&&!loading&&!error&&<p className="fine-print">{portfolio&&!address?'Connect a wallet to read your position.':'No chain data read yet.'}</p>}
    <button className="btn btn-outline" disabled={loading||(portfolio&&!address)} onClick={()=>void refreshProject()}><RefreshCw size={14}/>{loading?'Reading Devnet…':'Read Devnet records'}</button>
    <details className="technical-details"><summary>Onchain accounts</summary><ProjectLinks/></details>
  </section>;
}

export function FinancingHistory() {
  const {address, financeReceipt: receipt, financeState} = useWallet();
  const currentReceipt = receipt && receipt.address === address ? receipt : null;
  return <section className="panel financing-history"><span className="eyebrow">DEVNET EXPLORER</span><h2>Transaction history</h2>
    {currentReceipt ? <div className="history-row"><strong>{currentReceipt.amount} SOL</strong><span>{financeState}</span><a className="text-link" href={`https://explorer.solana.com/tx/${currentReceipt.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View transaction <ArrowUpRight size={14}/></a></div> : <p>No transaction submitted in this app session.</p>}
    {address && <a className="text-link" href={explorer(address)} target="_blank" rel="noreferrer">Wallet activity on Explorer <ArrowUpRight size={14}/></a>}
    <small>Latest app-session transaction only. Earlier records are on Explorer.</small>
  </section>;
}

export function InvestmentModal({triggerLabel="Finance this project"}:{triggerLabel?:string}) {
  const wallet=useWallet();
  const [amount,setAmount]=useState('0.50');
  const [review,setReview]=useState<FinanceReview|null>(null);
  const [readout,setReadout]=useState<ProjectReadout|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [showReceipt,setShowReceipt]=useState(true);
  const valid=parseSolAmount(amount)!==null;
  const currentReview=review && review.address===wallet.address && review.amount===amount?review:null;
  const receipt=wallet.financeReceipt;
  const receiptVisible=!!receipt && (showReceipt || wallet.financeState==='pending');
  async function prepare() {
    if(!wallet.address || loading || !valid) return;
    const address=wallet.address;
    setLoading(true);setError(null);
    try {
      const {prepareFinance}=await import('@/chain/client');
      const {data,review:prepared}=await prepareFinance(address,amount);
      setReadout(data);setReview(prepared);
    } catch(e) {setError(e instanceof Error?e.message:'Unable to read the project. Try again.');}
    finally {setLoading(false);}
  }
  return <>
    <Modal trigger={<>{triggerLabel} <ArrowUpRight size={18}/></>} title="Finance Bavaria Project" className="btn btn-primary finance-button">
      <span className="modal-phase">NATIVE SOL · SOLANA DEVNET</span>
      {receiptVisible ? <div className={`completion ${wallet.financeState==='confirmed'?'financing-confirmed':''}`}>
        {wallet.financeState==='confirmed' && <CheckCircle2 size={36}/>}
        <h3>{wallet.financeState==='confirmed'?'Financing recorded on Solana':wallet.financeState==='failed'?'Transaction failed':wallet.financeState==='expired'?'Transaction expired':'Confirmation pending'}</h3>
        {wallet.financeState!=='confirmed'&&<p role="status">{wallet.financeState==='expired'?'No transaction was found before its blockhash expired. Refresh your position before a new review.':wallet.financeState==='failed'?'No contribution was recorded by this failed transaction.':'Keep the signature and check its status before another commitment.'}</p>}
        {wallet.financeState==='confirmed' && <div className="success-summary">
          <div className="success-amount" role="status"><span className="simulation-badge">DEVNET DEMO EQUIVALENT</span><strong>{receipt!.amount} SOL</strong><span><EurEquivalent lamports={parseSolAmount(receipt!.amount)!.toString()} price={wallet.price}/></span><small>At current market price · not real capital</small></div>
          <p><span>Project</span><strong>{bavaria.name}</strong></p>
          <p><span>Network</span><strong>Solana Devnet</strong></p>
          <p><span>Updated project demo total</span><strong>{wallet.projectResult && !wallet.projectError && !wallet.projectLoading ? `${formatSolLamports(wallet.projectResult.data.totalLamports)} SOL` : wallet.projectLoading ? 'Reading confirmed chain state…' : 'Unavailable — retry the live read'}</strong></p>
          {wallet.projectError && <p role="alert">{wallet.projectError}</p>}
        </div>}
        <div className="receipt-actions"><a className="btn btn-outline" aria-label="View transaction on Solana Explorer" href={`https://explorer.solana.com/tx/${receipt!.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View Transaction <ArrowUpRight size={14}/></a>{wallet.financeState==='confirmed'&&<Link className="btn btn-primary" href="/portfolio" onClick={event=>event.currentTarget.closest('dialog')?.close()}>View Portfolio</Link>}</div>
        <details className="technical-details" open={wallet.financeState!=='confirmed'}><summary>Receipt details</summary><code className="wallet-address">{receipt!.signature}</code><PriceLabel price={wallet.price}/><p>EUR equivalent uses the displayed market price; it is not recorded onchain.</p></details>
        {wallet.financeState==='pending'?<button className="btn btn-outline" disabled={wallet.busy} onClick={()=>void wallet.checkFinancing()}>Check confirmation</button>:<button className="text-link review-again" onClick={()=>{setShowReceipt(false);setReview(null);setError(null);}}>Review another commitment</button>}
      </div>:currentReview ? <div>
        <h3>Review financing</h3>
        <p><strong>{currentReview.amount} SOL</strong> to the Project SOL Vault.</p>
        <p className="fine-print">Devnet demonstration only. Devnet SOL has no monetary value and this does not constitute a real investment.</p>
        <label>Signing wallet</label><code className="wallet-address">{currentReview.address}</code>
        <p><EurEquivalent lamports={parseSolAmount(currentReview.amount)!.toString()} price={wallet.price}/> estimated value</p><PriceLabel price={wallet.price}/>
        <span className="modal-phase">SOLANA DEVNET</span><ProjectLinks/>
        <p className="fine-print">Balance: {formatSolLamports(readout!.balanceLamports)} SOL. Fees and any new account rent are additional.</p>
        <details className="technical-details"><summary>Transaction details</summary><p>Native SOL stays in the project-derived vault. No withdrawals or repayments are implemented. EUR estimates use the displayed market price and are not stored onchain.</p></details>
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
        <p>Devnet demonstration only. Devnet SOL has no monetary value and this does not constitute a real investment.</p>
        <label htmlFor="amount">Amount</label>
        <div className="amount-fields">
          <input id="amount" className="input input-bordered" type="text" inputMode="decimal" maxLength={26} required value={amount} onChange={event=>{setAmount(event.target.value);setReview(null);}} aria-describedby="amount-help"/>
          <label className="sr-only" htmlFor="currency">Currency</label><select id="currency" className="select select-bordered" defaultValue="SOL"><option>SOL</option></select>
        </div>
        <p id="amount-help" className="fine-print">Up to nine decimals. Leave SOL for network fees and new account rent.</p>
        <p className="fine-print">Wallet balance: {wallet.balance===null?'Unavailable':`${wallet.balance.toFixed(4)} SOL`}</p>
        <p><span>Estimated equivalent · Demo </span><EurEquivalent lamports={(parseSolAmount(amount)??BigInt(0)).toString()} price={wallet.price}/></p><PriceLabel price={wallet.price}/>
        {!valid && <p className="input-error">Enter a positive amount with at most nine decimals.</p>}
        {wallet.address?<button disabled={!valid || loading || wallet.busy} className="btn btn-primary full-width" type="submit">{loading?'Checking Devnet…':'Review Financing'}</button>:<button className="btn btn-primary full-width" type="button" disabled={wallet.busy} onClick={event=>{event.currentTarget.closest('dialog')?.close();void wallet.connect();}}>Connect Wallet</button>}
        {!wallet.address && <p className="fine-print">Connect first; review before signing.</p>}
      </form>}
      {(error || wallet.financeError) && <p role="alert" className="input-error">{error || wallet.financeError}</p>}
    </Modal>
    {wallet.financeState==='signing' && <p role="status" className="fine-print">Preparing the transaction or waiting for wallet…</p>}
    {wallet.financeState==='pending' && <p role="status" className="fine-print">A financing attempt is pending. Open the dialog to check its signature.</p>}
  </>;
}
