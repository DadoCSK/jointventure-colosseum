'use client';
import {useEffect,useState} from 'react';
import type {MarketPrice as Quote} from '@/app/api/sol-eur/route';
export type MarketPrice=Quote&{ageMinutes:number};
export function useMarketPrice(){
  const [price,setPrice]=useState<MarketPrice|null>(null);
  useEffect(()=>{
    const controller=new AbortController();let busy=false;
    const read=async()=>{if(busy)return;busy=true;setPrice(previous=>previous&&Date.now()-previous.updatedAt<=300000?previous:null);try{
      const response=await fetch('/api/sol-eur',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});
      const {price:next}=await response.json();
      if(!response.ok||!next||!Number.isFinite(next.eur)||next.eur<=0||!Number.isFinite(next.updatedAt)||Date.now()-next.updatedAt>300000||next.updatedAt>Date.now()+60000)throw Error('Price unavailable');
      if(!controller.signal.aborted)setPrice({...next,ageMinutes:Math.max(0,Math.floor((Date.now()-next.updatedAt)/60000))});
    }catch{if(!controller.signal.aborted)setPrice(null);}finally{busy=false;}};
    void read();const timer=setInterval(()=>{if(!document.hidden)void read();},60000);
    const visible=()=>{if(!document.hidden)void read();};document.addEventListener('visibilitychange',visible);
    return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[]);
  return price;
}
export function demoEquivalent(lamports:string,price:MarketPrice|null):number|null{return price?Number(BigInt(lamports))/1e9*price.eur:null;}
export const euro=(value:number)=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function EurEquivalent({lamports,price}:{lamports:string;price:MarketPrice|null}){const value=demoEquivalent(lamports,price);return <>{value===null?'EUR equivalent unavailable':`≈ ${euro(value)}`}</>;}
export function PriceLabel({price}:{price:MarketPrice|null}){return <small className="market-price">{price?<>SOL market price {euro(price.eur)} · {price.source} · {price.source==='Kraken'?'Fetched':'Updated'} {price.ageMinutes} min ago</>:'SOL market price unavailable · Financing remains available'}</small>;}
