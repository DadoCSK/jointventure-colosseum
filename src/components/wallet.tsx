"use client";

import { ArrowUpRight, RefreshCw, Wallet } from "lucide-react";
import { Modal } from "./modal";
import { useWallet } from "./wallet-provider";

const shortAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;
const sol = (balance: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 9 }).format(balance);

function ConnectAction() {
  const { connect, busy } = useWallet();
  return (
    <button
      className="btn btn-primary"
      disabled={busy}
      onClick={(event) => {
        // Close the native top-layer dialog so Solflare's connection interface is interactive.
        event.currentTarget.closest("dialog")?.close();
        void connect();
      }}
    >
      Continue to Solflare <ArrowUpRight size={16} />
    </button>
  );
}

export function WalletButton() {
  const { address, busy, error, disconnect } = useWallet();
  return (
    <div className="wallet-control">
      <Modal
        title="Solflare wallet"
        trigger={
          <>
            <Wallet size={16} />
            {busy
              ? "Connecting…"
              : address
                ? shortAddress(address)
                : "Connect Solflare"}
          </>
        }
        triggerDisabled={busy}
        className="btn btn-outline wallet-button"
      >
        <span className="modal-phase">SOLFLARE · SOLANA DEVNET</span>
        {address ? (
          <>
            <p>
              Your Solflare wallet is connected. The app reads its Devnet SOL
              balance.
            </p>
            <code className="wallet-address">{address}</code>
            <p className="fine-print">
              Demo commitments and verification records are separate from this
              wallet. Financing requires a separate transaction review and
              approval, and sends only JV Test USD to the project vault.
            </p>
            <button
              className="btn btn-outline"
              onClick={(event) => {
                event.currentTarget.closest("dialog")?.close();
                void disconnect();
              }}
            >
              Disconnect Solflare
            </button>
          </>
        ) : (
          <>
            <p>
              Connect Solflare to share your public address and read your SOL
              balance on Solana Devnet. Set Solflare to Devnet to compare the
              balances.
            </p>
            <p className="fine-print">
              Devnet SOL is for testing. This step does not request a signature
              or transfer funds.
            </p>
            <ConnectAction />
            <p className="fine-print">
              New to Solflare?{" "}
              <a
                href="https://solflare.com"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Get Solflare <ArrowUpRight size={12} />
              </a>
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="input-error">
            {error}
          </p>
        )}
      </Modal>
      {error && (
        <span role="alert" className="wallet-notice">
          {error}
        </span>
      )}
    </div>
  );
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
          <h2 id="wallet-heading">Your Solflare wallet</h2>
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
              Disconnect Solflare
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Connect Solflare to view your wallet address and Devnet SOL balance.
            Portfolio commitments above remain demo data.
          </p>
          <div className="wallet-panel-actions">
            <WalletButton />
          </div>
        </>
      )}
      {busy && (
        <p role="status" className="fine-print">
          Waiting for Solflare…
        </p>
      )}
      {error && address && (
        <p role="alert" className="wallet-error">
          {error}
        </p>
      )}
      <p className="fine-print">
        This app reads Solana Devnet only. Wallet connection does not finance a
        project or authenticate its documents.
      </p>
    </section>
  );
}
