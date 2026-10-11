"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Wallet } from "@wallet-standard/base";
import type { WalletSession } from "./wallet-standard";
import type {FinanceReview,FinanceReceipt,Confirmation,ProjectReadout} from '@/chain/client';
import type {DocumentReview, DocumentReceipt} from '@/chain/documents';

import {useMarketPrice,type MarketPrice} from './market-price';

export const DEVNET_RPC = "https://api.devnet.solana.com";

type WalletContextValue = {
  price: MarketPrice|null;
  address: string | null;
  busy: boolean;
  error: string | null;
  balance: number | null;
  balanceLoading: boolean;
  balanceError: string | null;
  connect: (choice?:Wallet|'solflare') => Promise<void>;
  walletName:string|null;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  financeReceipt: FinanceReceipt | null;
  financeState: 'idle'|'signing'|Confirmation;
  financeError: string | null;
  financeProject: (review:FinanceReview) => Promise<void>;
  checkFinancing: () => Promise<void>;
  projectResult: {address: string | null; data: ProjectReadout} | null;
  projectLoading: boolean;
  projectError: string | null;
  refreshProject: (force?:boolean) => Promise<void>;
  anchorDocument: (review: DocumentReview, submitted: (receipt: DocumentReceipt) => void) => Promise<DocumentReceipt>;
};
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const price=useMarketPrice();
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const adapterRef = useRef<WalletSession | null>(null);
  const addressRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const balanceRequest = useRef<AbortController | null>(null);
  const [financeReceipt,setFinanceReceipt]=useState<FinanceReceipt|null>(null);
  const [financeState,setFinanceState]=useState<'idle'|'signing'|Confirmation>('idle');
  const [financeError,setFinanceError]=useState<string|null>(null);
  const pendingReceipt=useRef<FinanceReceipt|null>(null);
  const [projectResult, setProjectResult] = useState<{address: string | null; data: ProjectReadout} | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const projectRequest = useRef(0);
  const projectRead=useRef<{address:string|null;promise:Promise<void>}|null>(null);
  const refreshProject = useCallback((force=false):Promise<void> => {
    const account=addressRef.current;
    if(!force&&projectRead.current?.address===account)return projectRead.current.promise;
    const request=++projectRequest.current;
    setProjectLoading(true);setProjectError(null);
    const promise=(async()=>{
      try{
        const {readProject}=await import('@/chain/client');const data=await readProject(account??undefined);
        if(mountedRef.current&&request===projectRequest.current&&account===addressRef.current)setProjectResult({address:account,data});
      }catch{
        if(mountedRef.current&&request===projectRequest.current&&account===addressRef.current)setProjectError('Live Devnet data is unavailable. Try reading again. The real business information remains available.');
      }finally{
        if(mountedRef.current&&request===projectRequest.current){setProjectLoading(false);projectRead.current=null;}
      }
    })();
    projectRead.current={address:account,promise};return promise;
  },[]);

  const loadBalance = useCallback(async (account: string) => {
    balanceRequest.current?.abort();
    const controller = new AbortController();
    balanceRequest.current = controller;
    setBalance(null);
    setBalanceError(null);
    setBalanceLoading(true);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } =
        await import("@solana/web3.js");
      if (controller.signal.aborted)
        throw new Error("Balance request cancelled");
      const connection = new Connection(DEVNET_RPC, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }),
      });
      const lamports = await connection.getBalance(new PublicKey(account));
      if (
        mountedRef.current &&
        balanceRequest.current === controller &&
        addressRef.current === account
      ) {
        setBalance(lamports / LAMPORTS_PER_SOL);
      }
    } catch {
      if (
        mountedRef.current &&
        balanceRequest.current === controller &&
        addressRef.current === account
      ) {
        setBalanceError(
          "Unable to read your Devnet balance. The network may be busy; try refreshing.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current && balanceRequest.current === controller)
        setBalanceLoading(false);
    }
  }, []);

  const clearAccount = useCallback(() => {
    addressRef.current = null;
    balanceRequest.current?.abort();
    balanceRequest.current = null;
    if (!mountedRef.current) return;
    setAddress(null);
    setBalance(null);
    setBalanceLoading(false);
    setBalanceError(null);
  }, []);

  const syncAccount = useCallback(() => {
    if (!mountedRef.current) return;
    const account = adapterRef.current?.publicKey?.toBase58() ?? null;
    if (!account) {
      clearAccount();
      return;
    }
    if (account === addressRef.current) return;
    addressRef.current = account;
    setAddress(account);
    setError(null);
    void loadBalance(account);
  }, [clearAccount, loadBalance]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      balanceRequest.current?.abort();
      const adapter = adapterRef.current;
      adapter?.removeAllListeners();
      // Root navigation keeps this provider mounted. Unmounting releases a connected session.
      if (adapter?.connected) void adapter.disconnect().catch(() => {});
    };
  }, []);

  const [wallets,setWallets]=useState<Wallet[]>([]);
  const walletsRef=useRef<Wallet[]>([]);
  const [walletName,setWalletName]=useState<string|null>(null);
  const [pickerOpen,setPickerOpen]=useState(false);
  const picker=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    let cleanup:(()=>void)|undefined,cancelled=false;
    void import('./wallet-standard').then(({discoverWallets})=>{if(!cancelled)cleanup=discoverWallets(found=>{walletsRef.current=found;setWallets(found);});});
    return()=>{cancelled=true;cleanup?.();};
  },[]);
  useEffect(()=>{if(pickerOpen)picker.current?.showModal();else picker.current?.close();},[pickerOpen]);
  const connect = useCallback(async (choice?:Wallet|'solflare') => {
    if (busyRef.current || addressRef.current) return;
    if(choice===undefined){setError(null);setPickerOpen(true);return;}
    setPickerOpen(false);
    busyRef.current = true;setBusy(true);setError(null);
    try {
      adapterRef.current?.removeAllListeners();
      let adapter:WalletSession;
      if(choice==='solflare'){
        const [{SolflareWalletAdapter},{WalletAdapterNetwork}]=await Promise.all([import('@solana/wallet-adapter-solflare'),import('@solana/wallet-adapter-base')]);
        adapter=new SolflareWalletAdapter({network:WalletAdapterNetwork.Devnet});
        setWalletName('Solflare');
      }else{
        const wallet=choice;
        if(!walletsRef.current.includes(wallet))throw Error('Wallet is no longer available.');
        const {standardSession}=await import('./wallet-standard');
        adapter=await standardSession(wallet);setWalletName(wallet.name);
      }
      if(!mountedRef.current)return;
      adapter.on('connect',syncAccount);adapter.on('disconnect',clearAccount);
      adapter.on('error',()=>{if(mountedRef.current)setError('The wallet could not complete the request. Please try again.');});
      adapterRef.current=adapter;
      await adapter.connect();syncAccount();
    } catch {
      if(mountedRef.current)setError('Wallet connection was declined, cancelled, or could not complete. Please try again.');
      clearAccount();
    } finally {busyRef.current=false;if(mountedRef.current)setBusy(false);}
  },[clearAccount,syncAccount]);

  const disconnect = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await adapterRef.current?.disconnect();
    } catch {
      if (mountedRef.current)
        setError(
          "The wallet request could not complete. Your app session has been cleared.",
        );
    } finally {
      clearAccount();
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }, [clearAccount]);

  const refreshBalance = useCallback(async () => {
    if (addressRef.current) await loadBalance(addressRef.current);
  }, [loadBalance]);

  const checkFinancing=useCallback(async()=>{
    const receipt=pendingReceipt.current;
    if(!receipt || busyRef.current) return;
    busyRef.current=true;
    setBusy(true);
    try {
      const {checkFinance}=await import('@/chain/client');
      const state=await checkFinance(receipt);
      setFinanceState(state);
      setFinanceError(state==='failed'?'The transaction failed. No financing was recorded.':null);
      if(state!=='pending') pendingReceipt.current=null;
      if(state==='confirmed') {
        if(addressRef.current) void loadBalance(addressRef.current);
        await refreshProject(true);
      }
    } catch {
      setFinanceError('Confirmation is unavailable. Keep this signature and check again before another commitment.');
    } finally {busyRef.current=false;setBusy(false);}
  },[loadBalance,refreshProject]);

  const financeProject=useCallback(async(review:FinanceReview)=>{
    if(busyRef.current || pendingReceipt.current) return;
    const adapter=adapterRef.current;
    if(!adapter?.connected || addressRef.current!==review.address) return;
    busyRef.current=true;
    setBusy(true);
    setFinanceState('signing');
    setFinanceError(null);
    setFinanceReceipt(null);
    try {
      const {submitFinance}=await import('@/chain/client');
      await submitFinance(review,transaction=>adapter.signTransaction(transaction),()=>adapter.connected && addressRef.current===review.address,receipt=>{
        pendingReceipt.current=receipt;setFinanceReceipt(receipt);setFinanceState('pending');
      });
    } catch(error) {
      setFinanceError(pendingReceipt.current?'Submission or confirmation is uncertain. Check the saved signature before another commitment.':error instanceof Error?error.message:'The wallet did not approve the transaction. Nothing was submitted.');
      if(!pendingReceipt.current) setFinanceState('idle');
    } finally {busyRef.current=false;setBusy(false);}
    if(pendingReceipt.current) await checkFinancing();
  },[checkFinancing]);

  const anchorDocument = useCallback(async (review: DocumentReview, submitted: (receipt: DocumentReceipt) => void) => {
    if (busyRef.current || pendingReceipt.current) throw new Error('Finish the pending wallet operation before anchoring a document.');
    const adapter = adapterRef.current;
    if (!adapter?.connected || addressRef.current !== review.address) throw new Error('Connect the project authority wallet first.');
    busyRef.current = true;
    setBusy(true);
    try {
      const {submitDocument} = await import('@/chain/documents');
      return await submitDocument(review, transaction => adapter.signTransaction(transaction), () => adapter.connected && addressRef.current === review.address, submitted);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address, walletName, price,
        busy,
        error,
        balance,
        balanceLoading,
        balanceError,
        connect,
        disconnect,
        refreshBalance,
        financeReceipt,financeState,financeError,financeProject,checkFinancing,
        anchorDocument, projectResult, projectLoading, projectError, refreshProject,
      }}
    >
      {children}
      <dialog ref={picker} className="modal" aria-labelledby="wallet-picker-title" onCancel={()=>setPickerOpen(false)} onClose={()=>setPickerOpen(false)}>
        <div className="modal-box wallet-picker"><button type="button" className="modal-close btn btn-ghost" aria-label="Close wallet selection" onClick={()=>setPickerOpen(false)}>×</button><h2 id="wallet-picker-title">Connect Wallet</h2><span className="modal-phase">SOLANA DEVNET</span><p>Choose a wallet. Connection does not request a signature.</p>
          <div className="wallet-options">{wallets.map((wallet,index)=><button className="btn btn-outline" type="button" key={index} onClick={()=>void connect(wallet)}>{wallet.name}<small>Detected · Wallet Standard</small></button>)}
          <button className="btn btn-outline" type="button" onClick={()=>void connect('solflare')}>Solflare<small>Web wallet</small></button></div>
          {!wallets.length&&<p className="fine-print">No compatible installed wallets detected. Use the supported web wallet.</p>}
        </div>
      </dialog>
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value)
    throw new Error("Wallet components must be inside WalletProvider");
  return value;
}
