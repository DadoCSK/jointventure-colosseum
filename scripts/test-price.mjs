import assert from 'node:assert/strict';
const original=globalThis.fetch;
try{
 let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({solana:{eur:123.45,last_updated_at:Math.floor(Date.now()/1000)}});};
 const primary=await import('../src/app/api/sol-eur/route.ts?primary');
 assert.equal((await (await primary.GET()).json()).price.eur,123.45);await primary.GET();assert.equal(calls,1,'Brief cache avoids duplicate provider calls');
 globalThis.fetch=async url=>{calls++;if(String(url).includes('coingecko'))throw Error('Unavailable');return Response.json({error:[],result:{SOLEUR:{c:['124.10','1']}}});};
 const fallback=await import('../src/app/api/sol-eur/route.ts?fallback');const result=await (await fallback.GET()).json();assert.equal(result.price.eur,124.10);assert.equal(result.price.source,'Kraken');
 globalThis.fetch=async()=>Response.json({solana:{eur:-1,last_updated_at:0},error:['Unavailable']});
 const failed=await import('../src/app/api/sol-eur/route.ts?failure');assert.equal((await (await failed.GET()).json()).price,null);
 let resolve;globalThis.fetch=()=>new Promise(done=>{resolve=()=>done(Response.json({solana:{eur:125,last_updated_at:Math.floor(Date.now()/1000)}}));});
 const concurrent=await import('../src/app/api/sol-eur/route.ts?concurrent');const first=concurrent.GET(),second=concurrent.GET();resolve();assert.equal((await (await first).json()).price.eur,125);assert.equal((await (await second).json()).price.eur,125);
 console.log('PASS: actual-price parsing, brief cache, concurrent request coalescing, Kraken fallback, invalid/stale/unavailable price without hardcoded fallback');
}finally{globalThis.fetch=original;}
