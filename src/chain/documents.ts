import {Program, utils} from '@coral-xyz/anchor';
import {Connection, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import idl from './idl/joint_venture.json';
import deployment from './deployment.json';
import type {JointVenture} from './joint_venture';
import {digestBytes} from './document-hash';

export type IntegrityRecord = {pda: string; project: string; authority: string; documentId: string; documentName: string; hashHex: string; createdAt: string};
export type DocumentReview = {address: string; documentId: string; documentName: string; hashHex: string};
export type DocumentReceipt = {signature: string; lastValidBlockHeight: number; pda: string};
function client(documentId: string) {
  if (!/^[a-z0-9-]{1,32}$/.test(documentId)) throw new Error('Use a document ID of 1–32 lowercase letters, digits or hyphens.');
  const connection = new Connection('https://api.devnet.solana.com', {commitment: 'confirmed', disableRetryOnRateLimit: true, fetch: (input, init) => fetch(input, {...init, signal: AbortSignal.timeout(12000)})});
  const program = new Program<JointVenture>(idl as unknown as JointVenture, {connection});
  const [project] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('project'), utils.bytes.utf8.encode('bavaria')], program.programId);
  if (program.programId.toBase58() !== deployment.programId || project.toBase58() !== deployment.projectPda) throw new Error('Unexpected project configuration.');
  const [pda, bump] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('document'), project.toBuffer(), utils.bytes.utf8.encode(documentId)], program.programId);
  return {connection, program, project, pda, bump};
}
async function validateProject(documentId: string) {
  const context = client(documentId);
  if (await context.connection.getGenesisHash() !== 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG') throw new Error('This operation requires Solana Devnet.');
  const raw = await context.connection.getAccountInfo(context.project);
  if (!raw?.owner.equals(context.program.programId)) throw new Error('Invalid Bavaria project owner.');
  const state = context.program.coder.accounts.decode('project', raw.data);
  if (state.slug !== 'bavaria') throw new Error('Invalid Bavaria project.');
  return {...context, authority: state.authority as PublicKey};
}
export async function readDocument(documentId: string): Promise<IntegrityRecord | null> {
  const {connection, program, project, pda, bump, authority} = await validateProject(documentId);
  const raw = await connection.getAccountInfo(pda);
  if (!raw) return null;
  if (!raw.owner.equals(program.programId)) throw new Error('Unexpected document record owner.');
  const record = program.coder.accounts.decode('documentRecord', raw.data);
  if (!record.project.equals(project) || !record.authority.equals(authority) || record.documentId !== documentId || record.bump !== bump || record.sha256Hash.length !== 32) throw new Error('The integrity record does not match this project and document ID.');
  return {pda: pda.toBase58(), project: project.toBase58(), authority: record.authority.toBase58(), documentId, documentName: record.documentName, hashHex: record.sha256Hash.map((byte: number) => byte.toString(16).padStart(2, '0')).join(''), createdAt: new Date(record.createdAt.toNumber() * 1000).toISOString()};
}
export async function submitDocument(review: DocumentReview, sign: (transaction: Transaction) => Promise<Transaction>, connected: () => boolean, submitted: (receipt: DocumentReceipt) => void): Promise<DocumentReceipt> {
  digestBytes(review.hashHex);
  const hash = utils.bytes.hex.decode(review.hashHex);
  if (!review.documentName.trim() || new TextEncoder().encode(review.documentName).length > 64) throw new Error('Use a non-empty document name of at most 64 bytes.');
  const {connection, program, project, pda, authority} = await validateProject(review.documentId);
  if (authority.toBase58() !== review.address) throw new Error('Only the project authority can anchor a fingerprint.');
  if (await connection.getAccountInfo(pda)) throw new Error('An immutable record already exists for this document ID.');
  const block = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({feePayer: authority, ...block}).add(await program.methods.recordDocument(review.documentId, review.documentName, hash).accountsStrict({authority, project, documentRecord: pda, systemProgram: SystemProgram.programId}).instruction());
  const message = transaction.serializeMessage();
  if (!connected()) throw new Error('The connected wallet changed. Review again.');
  const signed = await sign(transaction);
  if (!connected() || !message.equals(signed.serializeMessage()) || !signed.signature) throw new Error('The signing wallet or transaction changed. Nothing was submitted.');
  const wire = signed.serialize();
  const receipt = {signature: utils.bytes.bs58.encode(signed.signature), lastValidBlockHeight: block.lastValidBlockHeight, pda: pda.toBase58()};
  submitted(receipt);
  if (await connection.sendRawTransaction(wire, {skipPreflight: false, maxRetries: 2}) !== receipt.signature) throw new Error('Unexpected submission response. Check the saved signature.');
  return receipt;
}
export async function checkDocumentReceipt(receipt: DocumentReceipt): Promise<'confirmed' | 'failed' | 'pending' | 'expired'> {
  const {connection} = client('integrity-test-v1');
  if (await connection.getGenesisHash() !== 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG') throw new Error('This operation requires Solana Devnet.');
  const [statuses, height] = await Promise.all([connection.getSignatureStatuses([receipt.signature], {searchTransactionHistory: true}), connection.getBlockHeight('confirmed')]);
  const status = statuses.value[0];
  if (status?.err) return 'failed';
  if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return 'confirmed';
  return !status && height > receipt.lastValidBlockHeight ? 'expired' : 'pending';
}
