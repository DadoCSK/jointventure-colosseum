// Public market data only. Never participates in signing or onchain accounting.
export type MarketPrice = {eur:number;updatedAt:number;source:'CoinGecko'|'Kraken'};
let cached:MarketPrice|null=null,expires=0,inflight:Promise<MarketPrice|null>|null=null;
async function fetchPrice():Promise<MarketPrice|null>{
  try{
    const response=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=eur&include_last_updated_at=true',{cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw Error('Price unavailable');
    const json=await response.json(),eur=json.solana?.eur,updatedAt=json.solana?.last_updated_at*1000;
    if(typeof eur!=='number'||!Number.isFinite(eur)||eur<=0||!Number.isFinite(updatedAt)||updatedAt>Date.now()+60000||Date.now()-updatedAt>300000)throw Error('Invalid or stale price');
    return {eur,updatedAt,source:'CoinGecko'};
  }catch{
    try{
      const response=await fetch('https://api.kraken.com/0/public/Ticker?pair=SOLEUR',{cache:'no-store',signal:AbortSignal.timeout(4000)});
      if(!response.ok)throw Error('Price unavailable');
      const json=await response.json();if(json.error?.length)throw Error('Price unavailable');
      const ticker=Object.values(json.result??{})[0] as {c?:string[]}|undefined,eur=Number(ticker?.c?.[0]);
      if(!Number.isFinite(eur)||eur<=0)throw Error('Invalid price');
      return {eur,updatedAt:Date.now(),source:'Kraken'}; // retrieval time: this API has no quote timestamp
    }catch{return null;}
  }
}
export async function GET(){
  if(Date.now()>=expires){
    inflight??=fetchPrice().then(price=>{cached=price;expires=Date.now()+(price?60000:15000);return price;}).finally(()=>{inflight=null;});
    await inflight;
  }
  return Response.json({price:cached},{headers:{'Cache-Control':cached?'public, max-age=30':'no-store'}});
}
