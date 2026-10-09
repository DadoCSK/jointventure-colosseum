// Records only the public harmless fixture, never a production project document.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PublicKey, SystemProgram} from '@solana/web3.js';
import {chainClient} from './chain-client.mjs';

const {program, connection, authority, project} = await chainClient();
const documentId = 'integrity-test-v1';
const documentName = 'Harmless integrity test fixture';
const digest = createHash('sha256').update(fs.readFileSync('tests/fixtures/integrity-test.txt')).digest();
const [documentRecord, bump] = PublicKey.findProgramAddressSync([Buffer.from('document'), project.toBuffer(), Buffer.from(documentId)], program.programId);
const projectState = await program.account.project.fetch(project);
assert.equal(projectState.authority.toBase58(), authority.publicKey.toBase58());
let signature = null;
if (!await connection.getAccountInfo(documentRecord)) {
  signature = await program.methods.recordDocument(documentId, documentName, digest).accountsStrict({authority: authority.publicKey, project, documentRecord, systemProgram: SystemProgram.programId}).rpc();
}
const record = await program.account.documentRecord.fetch(documentRecord);
assert.equal(record.project.toBase58(), project.toBase58());
assert.equal(record.authority.toBase58(), authority.publicKey.toBase58());
assert.equal(record.documentId, documentId);
assert.equal(record.documentName, documentName);
assert.equal(Buffer.from(record.sha256Hash).toString('hex'), digest.toString('hex'));
assert.equal(record.bump, bump);
assert.ok(record.createdAt.toNumber() > 0);
for (const id of ['license', 'rental', 'budget']) {
  const [productionPda] = PublicKey.findProgramAddressSync([Buffer.from('document'), project.toBuffer(), Buffer.from(id)], program.programId);
  assert.equal(await connection.getAccountInfo(productionPda), null, 'Production document must remain pending: ' + id);
}
const filename = 'chain/receipts/document-integrity-test.json';
const previous = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
const receipt = {network: 'devnet', testOnly: true, fixture: 'tests/fixtures/integrity-test.txt', programId: program.programId.toBase58(), projectPda: project.toBase58(), documentRecordPda: documentRecord.toBase58(), authority: authority.publicKey.toBase58(), documentId, documentName, sha256: digest.toString('hex'), createdAt: new Date(record.createdAt.toNumber() * 1000).toISOString(), signature: signature ?? previous.signature ?? null, explorer: `https://explorer.solana.com/address/${documentRecord.toBase58()}?cluster=devnet`, productionDocumentsPending: true};
fs.writeFileSync(filename, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
