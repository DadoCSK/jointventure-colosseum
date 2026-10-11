"use client";
import {useRef, useState, type ChangeEvent} from 'react';
import {ArrowUpRight, Clock3, FileText} from 'lucide-react';
import {Modal} from './modal';
import {useWallet} from './wallet-provider';
import {hashLocalFile} from '@/chain/document-hash';
import type {DocumentReceipt, IntegrityRecord} from '@/chain/documents';
import type {VerificationRecord} from '@/data/projects';
import deployment from '@/chain/deployment.json';

export const INTEGRITY_EXPLANATION = 'Matching fingerprints prove identical bytes. This does not independently authenticate the issuer or contents.';
const shortHash = (hex: string) => `${hex.slice(0, 12)}…${hex.slice(-12)}`;

export function DocumentIntegrityCard({record, testOnly = false}: {record: VerificationRecord; testOnly?: boolean}) {
  const wallet = useWallet();
  const [anchored, setAnchored] = useState<IntegrityRecord | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DocumentReceipt | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const fileRequest = useRef(0);
  const isAuthority = wallet.address === deployment.authority;
  const pending = !!receipt && confirmation !== 'failed' && confirmation !== 'expired' && confirmation !== 'confirmed';

  async function read() {
    setReading(true); setReadError(null);
    try {
      const {readDocument} = await import('@/chain/documents');
      const result = await readDocument(record.id);
      if (result && result.documentName !== record.title) throw new Error('The recorded document label differs from this category.');
      setAnchored(result);
    } catch {
      setReadError('Devnet records are unavailable. Try reading again; this page and financing remain available.');
    } finally {setReading(false);}
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const request = ++fileRequest.current;
    setHash(null); setLocalError(null); setFileName(file?.name ?? null);
    if (!file) {setHashing(false); return;}
    setHashing(true);
    try {
      const result = await hashLocalFile(file);
      if (request === fileRequest.current) setHash(result);
    } catch (error) {
      if (request === fileRequest.current) setLocalError(error instanceof Error ? error.message : 'Unable to hash this local file.');
    } finally {if (request === fileRequest.current) setHashing(false);}
  }

  async function check(current = receipt) {
    if (!current || checking) return;
    setChecking(true); setLocalError(null);
    try {
      const {checkDocumentReceipt} = await import('@/chain/documents');
      const status = await checkDocumentReceipt(current);
      setConfirmation(status);
      if (status === 'confirmed') await read();
    } catch {setLocalError('Confirmation is unavailable. Keep the transaction link and check again before another attempt.');}
    finally {setChecking(false);}
  }

  const status = anchored ? 'Integrity anchored on Solana' : 'Integrity record pending';
  return <article className="verification-card" data-document-id={record.id}>
    <div className="document-identity"><FileText size={23} aria-hidden="true"/><div>{testOnly && <span className="mock-label">HARMLESS TEST FIXTURE · NOT A PROJECT DOCUMENT</span>}<span className="document-column-label">{testOnly?'DEMO RECORD':'DOCUMENT'}</span><h3>{record.title}</h3></div></div>
    {!testOnly&&<div className="document-business-status"><span className="document-column-label">PROJECT STATUS</span><strong>{record.id==='license'?'Obtained':record.id==='rental'?'Executed':'Project budget'}</strong></div>}
    <div className="document-chain-status"><span className="document-column-label">ONCHAIN INTEGRITY</span><span className="verification-status"><Clock3 size={14} aria-hidden="true"/>{status}</span></div>
    {anchored && <>
      <code className="integrity-short-hash">{shortHash(anchored.hashHex)}</code>
      <time dateTime={anchored.createdAt}>{anchored.createdAt.replace('T', ' ').replace('.000Z', ' UTC')}</time>
      <a className="text-link" href={`https://explorer.solana.com/address/${anchored.pda}?cluster=devnet`} target="_blank" rel="noreferrer">DocumentRecord on Devnet <ArrowUpRight size={14}/></a>
    </>}
    <Modal trigger={<>View record <ArrowUpRight size={14}/></>} title={record.title} className="text-link">
      <span className="modal-phase">{testOnly ? 'HARMLESS TEST FIXTURE · SOLANA DEVNET' : 'DOCUMENT INTEGRITY · SOLANA DEVNET'}</span>
      <p role="status">{status}</p>
      {testOnly && <p>Public test text. It does not represent the licence, agreement or budget.</p>}
      <details className="technical-details"><summary>How integrity works</summary><p>{INTEGRITY_EXPLANATION}</p></details>
      <button className="btn btn-outline" disabled={reading} onClick={() => void read()}>{reading ? 'Reading Devnet…' : 'Read integrity record'}</button>
      {readError && <p role="alert" className="input-error">{readError}</p>}
      {anchored ? <div className="integrity-details">
        <p>Document name: {anchored.documentName}</p>
        <p>Recorded at: <time dateTime={anchored.createdAt}>{anchored.createdAt}</time></p>
        <p>SHA-256 fingerprint</p><code className="fingerprint">{anchored.hashHex}</code>
        <p>DocumentRecord PDA</p><code className="wallet-address">{anchored.pda}</code>
        <a className="text-link" href={`https://explorer.solana.com/address/${anchored.pda}?cluster=devnet`} target="_blank" rel="noreferrer">View record on Devnet Explorer <ArrowUpRight size={14}/></a>
      </div> : <p className="fine-print">No fingerprint read. Project documents remain unauthenticated.</p>}
      <div className="local-document-check">
        <label htmlFor={`local-file-${record.id}`}>Select a local file to calculate its SHA-256 fingerprint</label>
        <input id={`local-file-${record.id}`} type="file" onChange={event => void selectFile(event)} disabled={wallet.busy || pending} className="file-input file-input-bordered"/>
        <p className="fine-print">Local only · no upload · maximum 20 MiB.</p>
        {hashing && <p role="status">Calculating SHA-256 locally…</p>}
        {hash && <>
          <p>Local file: <span className="integrity-file-name">{fileName}</span></p>
          <code className="fingerprint" data-local-hash>{hash}</code>
          {anchored ? <p role="status">{hash === anchored.hashHex ? 'Fingerprint matches the anchored record.' : 'Fingerprint does not match the anchored record.'}</p> : <p role="status">Local fingerprint calculated. Read the onchain record to compare; this hash has not been anchored.</p>}
        </>}
      </div>
      {!anchored && <>
        <p className="fine-print">Authority only · permanent record · fingerprint and metadata only.</p>
        <button className="btn btn-primary" disabled={!isAuthority || !hash || hashing || reading || wallet.busy || pending} onClick={async event => {
          if (!hash || !wallet.address || !isAuthority) return;
          const dialog = event.currentTarget.closest('dialog');
          dialog?.close(); setLocalError(null); setConfirmation(null); setReceipt(null);
          let submittedReceipt: DocumentReceipt | null = null;
          try {
            await wallet.anchorDocument({address: wallet.address, documentId: record.id, documentName: record.title, hashHex: hash}, next => {submittedReceipt = next; setReceipt(next); setConfirmation('pending');});
            await check(submittedReceipt);
          } catch (error) {
            setLocalError(submittedReceipt ? 'Submission is uncertain. Keep the signature and check before another attempt.' : error instanceof Error ? error.message : 'The wallet request did not complete.');
          } finally {if (dialog?.isConnected && !dialog.open) dialog.showModal();}
        }}>Anchor fingerprint in Wallet</button>
        {!isAuthority && <p className="fine-print">Project authority required to anchor. Anyone can read and compare.</p>}
      </>}
      {receipt && <div className="integrity-details">
        <p role="status">Document transaction: {confirmation ?? 'pending'}</p>
        <a className="text-link" href={`https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View document transaction <ArrowUpRight size={14}/></a>
        <code className="wallet-address">{receipt.signature}</code>
        {pending && <button className="btn btn-outline" disabled={checking || wallet.busy} onClick={() => void check()}>Check document confirmation</button>}
      </div>}
      {localError && <p role="alert" className="input-error">{localError}</p>}
    </Modal>
  </article>;
}

export function IntegrityTestFixture() {
  return <div className="integrity-test-fixture">
    <a className="text-link fixture-download" href="/integrity-test.txt" download>Download harmless test file <ArrowUpRight size={14} aria-hidden="true"/></a>
    <DocumentIntegrityCard testOnly record={{id: 'integrity-test-v1', title: 'Harmless integrity test fixture', status: 'Integrity record pending'}}/>
  </div>;
}
