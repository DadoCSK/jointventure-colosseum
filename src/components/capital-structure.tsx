'use client';
import {useEffect,useState} from 'react';
import {bavaria,eur} from '@/data/projects';
import {useWallet} from './wallet-provider';
import {demoEquivalent,euro,EurEquivalent} from './market-price';
import {parseSolAmount} from '@/chain/amount';
export function CapitalStructure({showDemo=true}:{showDemo?:boolean}){
  const {address,price,projectResult,refreshProject,financeReceipt,financeState,projectError}=useWallet();
  const [expiredCallout,setExpiredCallout]=useState<string|null>(null);
  useEffect(()=>{if(showDemo)void refreshProject();},[address,refreshProject,showDemo]);
  useEffect(()=>{if(financeState!=='confirmed'||!financeReceipt)return;const timer=setTimeout(()=>setExpiredCallout(financeReceipt.signature),6000);return()=>clearTimeout(timer);},[financeState,financeReceipt]);
  const current=projectResult?.address===address?projectResult.data:null;
  const demo=showDemo&&current?demoEquivalent(current.totalLamports,price):null;
  const real=bavaria.alreadyInvested/bavaria.totalProjectCapital*100;
  const demoWidth=demo===null?0:Math.min(bavaria.target,demo)/bavaria.totalProjectCapital*100;
  const contribution=financeReceipt?parseSolAmount(financeReceipt.amount):null;
  return <section className="business-capital" aria-label="Business project capital">
    <div className="capital-heading"><span>Total project capital</span><strong>{eur(bavaria.totalProjectCapital)}</strong><span>Project funded <b>29%</b> · real capital</span></div>
    <div className="capital-split-bar" role="img" aria-label={`Real capital €100,000, 29%; current real raise €250,000.${showDemo?` Devnet demo overlay ${demo===null?'unavailable':euro(demo)}.`:''}`}>
      <span style={{width:`${real}%`}}/><span className="capital-demo-segment" data-demo-width={demoWidth} style={{width:`${demoWidth}%`}}/><span className="capital-remaining" style={{width:`${100-real-demoWidth}%`}}/>
    </div>
    <div className="capital-legend"><span><strong>{eur(bavaria.alreadyInvested)}</strong> Real capital already invested · 29%</span>{showDemo&&<span data-demo-eur><strong>{demo===null?'Unavailable':euro(demo)}</strong> Devnet demo equivalent</span>}<span><strong>{eur(bavaria.target)}</strong> Current real raise · 71%</span></div>
    {showDemo&&<small>Demo overlay does not reduce the real €250k raise.{projectError&&current?' Last successful Devnet read shown.':''}</small>}
    {showDemo&&financeState==='confirmed'&&financeReceipt?.signature!==expiredCallout&&contribution&&<p key={financeReceipt!.signature} className="capital-callout" role="status">+{financeReceipt!.amount} SOL · <EurEquivalent lamports={contribution.toString()} price={price}/> demo equivalent</p>}
  </section>;
}
