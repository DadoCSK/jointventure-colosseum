"use client";

import { ArrowUpRight, RefreshCw, Wallet } from "lucide-react";
import { Modal } from "./modal";
import { useWallet } from "./wallet-provider";

const shortAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;
const sol = (balance: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 9 }).format(balance);

export function WalletButton() {
  const {address,busy,error,disconnect,connect,walletName}=useWallet();
  return <div className="wallet-control">{address?<Modal title="Wallet details" trigger={<><Wallet size={16}/>{shortAddress(address)}</>} triggerDisabled={busy} className="btn btn-outline wallet-button">
    <span className="modal-phase">SOLANA DEVNET</span><code className="wallet-address">{address}</code><p className="fine-print">{walletName}</p>
    <button className="btn btn-outline" onClick={event=>{event.currentTarget.closest('dialog')?.close();void disconnect();}}>Disconnect Wallet</button>
  </Modal>:<button className="btn btn-outline wallet-button" disabled={busy} onClick={()=>void connect()}><Wallet size={16}/>{busy?'Connecting…':'Connect Wallet'}</button>}
  {error&&<span role="alert" className="wallet-notice">{error}</span>}</div>;
}

export function WalletPanel() {
  const {
    address,
    busy,
    error,
    balance,
    balanceLoading,
    balanceError,
    refreshBalance,
    disconnect,
  } = useWallet();
  return (
    <section className="panel wallet-panel" aria-labelledby="wallet-heading">
      <div className="wallet-panel-heading">
        <div>
          <span className="eyebrow">CONNECTED WALLET</span>
          <h2 id="wallet-heading">Your wallet</h2>
        </div>
        <span className="status-badge">Solana Devnet</span>
      </div>
      {address ? (
        <>
          <div className="wallet-readout">
            <div>
              <p className="wallet-label">Public address</p>
              <code className="wallet-address">{address}</code>
              <a
                className="text-link"
                href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                View on Devnet Explorer <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="wallet-balance">
              <p className="wallet-label">Devnet SOL balance</p>
              <strong aria-live="polite">
                {balanceLoading
                  ? "Loading…"
                  : balance === null
                    ? "Unavailable"
                    : `${sol(balance)} SOL`}
              </strong>
              <small>Test tokens · not a custodial account</small>
            </div>
          </div>
          {balanceError && (
            <p role="alert" className="wallet-error">
              {balanceError}
            </p>
          )}
          <div className="wallet-panel-actions">
            <button
              className="btn btn-outline"
              disabled={balanceLoading}
              onClick={() => void refreshBalance()}
            >
              <RefreshCw size={14} />
              Refresh balance
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              Disconnect Wallet
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Connect a wallet to view your Devnet balance.
          </p>
          <div className="wallet-panel-actions">
            <WalletButton />
          </div>
        </>
      )}
      {busy && (
        <p role="status" className="fine-print">
          Waiting for wallet…
        </p>
      )}
      {error && address && (
        <p role="alert" className="wallet-error">
          {error}
        </p>
      )}

    </section>
  );
}
