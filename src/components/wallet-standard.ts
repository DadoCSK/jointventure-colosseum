import type { Wallet, WalletAccount } from '@wallet-standard/base';
import type { StandardConnectFeature, StandardDisconnectFeature, StandardEventsFeature } from '@wallet-standard/features';
import type { SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import type { PublicKey, Transaction } from '@solana/web3.js';

type CompatibleWallet = Wallet & {features: StandardConnectFeature & StandardDisconnectFeature & StandardEventsFeature & SolanaSignTransactionFeature};
export type WalletSession = {
  publicKey: PublicKey|null; connected:boolean;
  connect:()=>Promise<void>; disconnect:()=>Promise<void>; signTransaction:(transaction:Transaction)=>Promise<Transaction>;
  on:(event:'connect'|'disconnect'|'error',listener:()=>void)=>unknown; removeAllListeners:()=>unknown;
};
export function compatible(wallet:Wallet):wallet is CompatibleWallet {
  const f=wallet.features;
  return wallet.chains.includes('solana:devnet') &&
    typeof (f['standard:connect'] as StandardConnectFeature['standard:connect'])?.connect==='function' &&
    typeof (f['standard:disconnect'] as StandardDisconnectFeature['standard:disconnect'])?.disconnect==='function' &&
    typeof (f['standard:events'] as StandardEventsFeature['standard:events'])?.on==='function' &&
    typeof (f['solana:signTransaction'] as SolanaSignTransactionFeature['solana:signTransaction'])?.signTransaction==='function' &&
    (f['solana:signTransaction'] as SolanaSignTransactionFeature['solana:signTransaction']).supportedTransactionVersions?.includes('legacy');
}
// Wallet Standard's app-ready/register-wallet handshake, using the installed standard types.
export function discoverWallets(update:(wallets:Wallet[])=>void) {
  const registered=new Set<Wallet>();
  const publish=()=>update([...registered].filter(compatible));
  const api=Object.freeze({register:(...wallets:Wallet[])=>{
    const added=wallets.filter(wallet=>!registered.has(wallet));added.forEach(wallet=>registered.add(wallet));publish();
    return()=>{added.forEach(wallet=>registered.delete(wallet));publish();};
  }});
  const register=(event:Event)=>{const callback=(event as CustomEvent<(ready:typeof api)=>void>).detail;if(typeof callback==='function')callback(api);};
  window.addEventListener('wallet-standard:register-wallet',register);
  window.dispatchEvent(new CustomEvent('wallet-standard:app-ready',{detail:api}));
  return()=>window.removeEventListener('wallet-standard:register-wallet',register);
}
export async function standardSession(wallet:Wallet):Promise<WalletSession> {
  if(!compatible(wallet))throw Error('This wallet does not support Devnet transaction signing.');
  const {PublicKey,Transaction}=await import('@solana/web3.js');
  let account:WalletAccount|null=null,unsubscribe:(()=>void)|null=null;
  const listeners={connect:new Set<()=>void>(),disconnect:new Set<()=>void>(),error:new Set<()=>void>()};
  const emit=(event:keyof typeof listeners)=>listeners[event].forEach(listener=>listener());
  const choose=(accounts:readonly WalletAccount[])=>{
    const next=accounts.find(a=>a.chains.includes('solana:devnet')&&a.features.includes('solana:signTransaction'))??null;
    if(next&&new PublicKey(next.publicKey).toBase58()!==next.address)throw Error('Wallet account identity mismatch.');
    account=next;session.publicKey=next?new PublicKey(next.publicKey):null;session.connected=!!next;
    emit(next?'connect':'disconnect');
  };
  const session:WalletSession={
    publicKey:null,connected:false,
    on:(event,listener)=>{listeners[event].add(listener);},
    removeAllListeners:()=>{unsubscribe?.();unsubscribe=null;Object.values(listeners).forEach(set=>set.clear());},
    connect:async()=>{
      unsubscribe?.();unsubscribe=wallet.features['standard:events'].on('change',change=>{try{if(change.accounts)choose(change.accounts);if(change.chains||change.features){if(!compatible(wallet))choose([]);}}catch{choose([]);emit('error');}});
      try{const result=await wallet.features['standard:connect'].connect();choose(result.accounts);if(!session.connected)throw Error('No compatible Devnet account was authorized.');}catch(error){unsubscribe?.();unsubscribe=null;choose([]);throw error;}
    },
    disconnect:async()=>{try{await wallet.features['standard:disconnect'].disconnect();}finally{unsubscribe?.();unsubscribe=null;choose([]);}},
    signTransaction:async transaction=>{
      if(!account||!session.connected)throw Error('Wallet disconnected.');
      const [result]=await wallet.features['solana:signTransaction'].signTransaction({account,chain:'solana:devnet',transaction:new Uint8Array(transaction.serialize({requireAllSignatures:false,verifySignatures:false}))});
      if(!result?.signedTransaction)throw Error('Wallet returned no signed transaction.');
      return Transaction.from(result.signedTransaction);
    },
  };
  return session;
}
