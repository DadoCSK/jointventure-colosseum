# Joint Venture — implementation status

Updated 9 October 2026.

Phase 1's four-page design and content corrections are retained. Phase 2 now includes a deployed Bavaria project program/PDA, dedicated JV Test USD mint, project-controlled vault, onchain contribution records and the Solflare financing interface. Phase 2F document integrity is now implemented and deployed on the same program. Financing architecture and EUR economics are unchanged.

## Existing financing implementation

The minimal Bavaria project was deployed and initialized on Solana Devnet first, with financing disabled. Its project account and vault were read back before the financing instruction was added, locally tested and deployed as an upgrade to the same program.

The project stores the approved €250,000 target, €220,000 infrastructure budget and approximately €33,000 contracted monthly revenue. EUR figures are integer cents; the €75,000 demo commitment was not seeded as onchain financing. Live test-token totals began at zero.

Financing accepts the dedicated six-decimal JV Test USD mint, validates the project and vault, calls the SPL token program from the Joint Venture instruction, and atomically records the contribution against project + wallet. A nonce rejects repeated attempts. The project authority can pause financing. No arbitrary recipient wallet is used as the financing architecture.

The Solflare interface provides amount validation, project/mint/vault review, balance and fee checks, a separate signing action, signature validation, transaction links and confirmation checking. Uncertain attempts retain their signature and block another submission until checked. Portfolio test positions are read onchain, separately from the unchanged EUR demo data. Wallet/pending state remains in memory; onchain positions persist.

A real Devnet smoke transaction recorded **1.25 JV Test USD** from an isolated test wallet. Its position, project total and vault balance were verified. This is demo-token activity, not real agricultural financing or a EUR investment.

Verification passed: local program security tests, exact amount checks, TypeScript, ESLint, production build, Rust formatting and 13 browser regressions. All four routes passed overflow and automated accessibility checks at 1440px, 768px, 390px and 320px. The browser read the live Devnet total, and the deployed program binary matched the tested artifact. No hydration or browser errors occurred in the completed page checks.

## Public deployment

| Account | Address |
| --- | --- |
| Program | `Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ` |
| Bavaria PDA | `9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U` |
| Vault PDA | `2JGPfGiDD6wCUJ4dJyrYKQm7RP7NgQ56hdSCVNgJADHN` |
| JV Test USD mint | `BUb2CzJvDu7GuFjZ9a41z7uTQNCbgi97yybPs6uepYgL` |

[Project Explorer](https://explorer.solana.com/address/9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U?cluster=devnet). Public receipts are in `chain/receipts/`; setup and verification commands are in `README.md` and `chain/README.md`. Private keys remain in ignored local files.

## Phase 2F — completed

JV Test USD is a demo token, not official USDC or redeemable currency. No EUR conversion, interest rate, term or repayment schedule is established. Test tokens stay in the project vault; withdrawals and repayments are not implemented. Development upgrade and mint authorities remain active. The program is not independently audited; dependency advisories are documented in the README.

### Program and browser changes

Added authority-only `record_document(document_id, document_name, sha256_hash)` and a separate `DocumentRecord` account. Seeds are `["document", project_public_key, document_id]`. The canonical existing Bavaria project must be owned by this program and its authority must sign. Document IDs allow 1–32 lowercase ASCII letters, digits or hyphens; names require 1–64 UTF-8 bytes with nonblank content. The instruction rejects hashes other than exactly 32 bytes and stores `[u8; 32]`. The record also contains project, authority, ID/name, chain timestamp and bump. Duplicate records fail; no replacement, versioning or account closing was added.

The Project and Position account layouts, existing instruction interfaces, discriminators and error codes are unchanged. Document recording takes Project read-only. Compatibility evidence is in `chain/receipts/phase-2f-compatibility.json`. The same deployed program was upgraded on 9 October 2026; no new program, project, vault or mint was created. Upgrade receipt: `chain/receipts/deploy-1791577143523.json`. The deployed binary was dumped and compared byte for byte with the tested artifact.

The existing document cards now support explicit live reads, local file comparison and authority-only Solflare anchoring. Browser Web Crypto calculates SHA-256 from a locally selected file; no contents or filename are sent to the program or a backend. Only category metadata and digest are in the transaction. Files are capped at 20 MiB and hashing requires HTTPS or localhost. Anchored records show a shortened fingerprint, timestamp and DocumentRecord Explorer link; the modal shows the full fingerprint and PDA. RPC failure leaves the page and financing usable. Uncertain document submissions retain their signature in memory for confirmation checking.

**Integrity means matching bytes, not authentication.** A matching local file has the same fingerprint as the one recorded at that time. Joint Venture does not independently authenticate the issuer, truth, legality or contents. Fingerprints and metadata are public; actual documents are not uploaded, stored or placed onchain.

### Actual harmless Devnet test record

No actual sensitive Bavaria documents were available. Only `tests/fixtures/integrity-test.txt`, explicitly labelled harmless public test text, was anchored. It is unrelated to the three project documents.

- Document ID: `integrity-test-v1`
- Name: `Harmless integrity test fixture`
- DocumentRecord PDA: `3ToaWp5zopbmmVgHLhmBNXK3315G9eLNSAhphV5Jzf5x`
- SHA-256: `d493d66455e037afb996d79e8f2cf5b8c69c7092f77d1dfe5ecbd223b1319746`
- Onchain timestamp: `2026-10-09T20:19:18.000Z`
- Transaction: `4vVFxDRKRBB4MLe6ju4DffBNJ1x7umo6Pform2Cnzue3U6Rw7CFXhZ19PekDwejW4CjjHCjVNBHUTCKH5BiKHfqD`
- [DocumentRecord on Devnet Explorer](https://explorer.solana.com/address/3ToaWp5zopbmmVgHLhmBNXK3315G9eLNSAhphV5Jzf5x?cluster=devnet)

Public receipt: `chain/receipts/document-integrity-test.json`. The fixture script is idempotent and verifies any existing record against the actual fixture bytes. The browser read this actual account and matched the locally selected fixture, independently of the Node hashing used by the script.

**Cultivation Licence, Customer Rental Agreement and Infrastructure Budget remain “Integrity record pending.”** Their deterministic accounts were confirmed absent. Invented fingerprints were removed; none is represented as a real document record. Project listing, fictional projects, EUR portfolio positions and platform aggregates remain labelled demonstrations.

### Verification results

- Anchor/SBF build, IDL generation and Rust formatting passed.
- Original initialization and financing/security tests passed against the upgraded local program. Financing tests passed again after document records were created locally.
- New local document tests passed: creation, exact 32-byte digest, correct project/authority, timestamp/bump, unchanged Project data, duplicate rejection/immutability, unauthorized authority, invalid project, empty/oversized/invalid ID, blank/oversized name, 31/33-byte hashes and malformed instruction rejection.
- All **17 Playwright tests** passed (13 existing financing/wallet tests plus 4 document tests). Browser checks cover local hashing without upload, real-format record decoding, full/short fingerprint and timestamp/PDA links, matching/altered files, missing/mismatched records and RPC failure recovery.
- TypeScript, ESLint and exact amount checks passed. Production build passed using `npm run build -- --webpack`. Default Turbopack failed on this machine with a local process/port permission error, including after escalation; no application build configuration was changed.
- All four routes served successfully. All 16 route/viewport combinations at 1440, 768, 390 and 320 px passed overflow and automated WCAG 2 A/AA checks. Existing navigation, filters, informational actions, modal focus handling and financing validation passed without console/page errors or unexpected external requests.
- Live browser Devnet read and local-file matching passed. Explorer URLs contain the correct account and Devnet cluster. Explorer returned HTTP 429 to automated access, so its remote page availability could not be confirmed; the account itself was confirmed through RPC.
- All **six pre-existing accounts** retained identical raw data, ownership, lamports and executable state after upgrade and fixture recording. These include Program, Project, Vault, Mint and both Positions. Snapshots/readback: `chain/receipts/phase-2f-state-before.json` and `phase-2f-state-after.json`. Project and vault totals remain **3.25 JV Test USD**, user position **2** with nonce **2**, smoke position **1.25** with nonce **1**, and user wallet balance **9,998**. Existing Project bytes preserve all EUR metrics, mint, vault and financing-enabled state.
- No private documents or secrets were added. Only public fixture text, code, account data and receipts were added. Private keys, local ledgers and generated binaries remain ignored. This workspace has no Git repository, so no commit was created.

### Limits and pending work

Records are immutable for this milestone. Real project documents are unavailable and remain pending; anchoring them later requires the project authority to select its local document and explicitly approve in Solflare. The harmless record was signed using the existing local Devnet authority; the production-document authority UI has not been manually exercised with installed Solflare. Existing user financing approvals remain verified. RPC availability, in-memory pending state and unaudited development authorities remain MVP limits. No document storage, downloads, authentication service, repayments, withdrawals or Mainnet functionality was added.

**Real user-wallet financing has now been verified.** The user confirmed approving two transactions. Both finalized through the Bavaria financing instruction for 1 JV Test USD each, using successive nonces 0 and 1. Readback showed a 2 JV Test USD wallet position, 9,998 JV Test USD remaining in the wallet, and 3.25 JV Test USD in both the recorded project total and vault (including the earlier 1.25-token smoke test). The supplied transaction’s wallet debit and vault credit were verified exactly; the EUR project-case metrics remain unchanged. The public acceptance receipt is in `chain/receipts/wallet-acceptance.json`. No application code changed during this acceptance check.

The remaining manual checks are wallet rejection, account switching, disconnect/reconnect and mobile handoff. Rejection and account-change behavior already pass browser fixtures; these have not yet been confirmed with the installed wallet. Open My Portfolio and select Read Devnet records to verify the connected wallet displays its 2-token contribution separately from the EUR demo position.

**Phase 2F is complete. Work stops here pending further user instructions.** No subsequent milestone has been started. Mainnet and production financing remain outside this MVP.
