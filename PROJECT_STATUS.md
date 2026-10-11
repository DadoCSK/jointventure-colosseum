# Joint Venture — implementation status

Updated 10 October 2026.

**Phase 3 — Product Truth & Demo Polish is complete.** Bavaria is now presented as the real founding project behind Joint Venture. Its €250,000 business requirement is separate from a live 100 JV Test USD technical demo. The fictional €75,000 Bavaria commitment has been removed. No protocol code, deployment or financing transaction architecture changed; no public deployment was performed.

The sections below retain prior milestone history; Phase 3 supersedes their earlier demo business copy.

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


## Follow-up acceptance check — 9 October 2026

Requested checks: (1) installed-Solflare browser anchoring with the project authority, and (2) live record display and matching/altered-file comparison.

**Check 2 passed against the actual Devnet harmless fixture.** A browser read displayed the recorded PDA and fingerprint. Selecting the original public fixture produced “Fingerprint matches the anchored record.” Selecting an altered copy produced “Fingerprint does not match the anchored record.” Production document cards stayed pending and no browser page errors occurred. Explorer returned HTTP 429 again; the correctly targeted account was read successfully through Devnet RPC.

**Check 1 remains blocked, not passed.** The user confirmed that only the financing wallet is available in Solflare. That wallet is not the Bavaria project authority and cannot create document records. The existing harmless record is also immutable; a future browser creation test needs a separate explicitly test-only document ID. No authority was changed, no private key was imported/shared, no production category was filled with test data, and no new transaction was submitted. Native browser-control permissions were unavailable, so the installed wallet was not operated by the agent.

A final read-only state comparison passed: all six original accounts unchanged; total/vault 3.25 JV Test USD, user position 2, wallet balance 9,998. No application or program code changed during these acceptance checks. The saved public state verification receipt was refreshed.


## Phase 3 — Product Truth & Demo Polish

### What changed

- Added the prominent homepage origin story, “Built from a real financing problem,” before marketplace opportunities. It explains the licensed association, secured facility, executed agreement and remaining financing barrier. A founding-project summary presents €250,000 total, €220,000 infrastructure/equipment, €30,000 working capital, ~€33,000/month contracted rental revenue, licence obtained and commercial agreement executed, with a View Founding Project link.
- Bavaria is titled **Bavaria Controlled Cultivation Infrastructure** and marked **FOUNDING PROJECT · REAL-WORLD PILOT** across the hero, marketplace and detail page. Its first-position marketplace card uses the existing cream/green design with a stronger subtle border/background. Fictional examples are explicitly **DEMO PROJECT**: Netherlands Greenhouse Expansion and Spanish Indoor Produce Facility. No extra projects were created.
- Added “Joint Venture was created from this project” near the top of Bavaria, plus Project Readiness. Facts include licence obtained, rental agreement executed, facility secured under lease, GmbH infrastructure company, cultivation by association members and pre-operational stage. The optional approximately €50,000 phased start is secondary; the full target stays €250,000. Facts are attributed to the project developer, with no document authentication claims.
- Removed Bavaria’s fabricated €75,000 commitment, 30% EUR bar and €175,000 remaining figure. Bavaria has no numeric EUR capital-raised value; it shows Open / Seeking financing. Replaced the invented detailed allocation with the supplied approximate €220,000 infrastructure/equipment and €30,000 initial working capital, totalling €250,000. Contracted revenue is distinguished from current operating revenue and investor returns; financial projections are explicitly not guaranteed.
- Replaced invented homepage traction aggregates with actual MVP scope: one real founding project, two fictional examples and a Devnet technical demo. The hero transparency notice no longer overlaps financial metrics when the longer founding-project title wraps. Existing typography, palette, artwork, wordmark, cards and navigation remain.
- Fictional EUR portfolio examples now reference the fictional Netherlands project, avoiding an apparent EUR commitment to the real Bavaria business. They remain explicitly separate from live wallet/position data.

### Live Devnet demo and refresh behavior

The separate **Live Devnet Financing Demo** automatically reads the existing Bavaria Project through the unchanged validated `readProject` client. Its target is **100 JV Test USD**, purely a frontend visual target with no relationship or conversion to €250,000. The numerator is the onchain recorded financing total; no 3.25 value is hardcoded in application data. At the read-only live check, the browser displayed **3.25 / 100 JV Test USD** with a **3.25%** bar.

The wallet provider keeps the latest RPC read in memory for shared display. On confirmed financing it re-reads the Project, connected wallet Position and token balance; no optimistic contribution is added. Pending, failed and rejected attempts leave prior recorded totals unchanged. Request/identity guards prevent an old wallet read from replacing another wallet’s current position. Loading/error messages are explicit. A failed initial read shows no invented zero/progress; a failed refresh labels the last successful data as such, while keeping business content and financing usable.

The confirmed success view says **Financing recorded on Solana** and shows the actual signed/confirmed contribution amount from the retained transaction receipt, founding-project name, Solana Devnet, refreshed project demo total, transaction Explorer link and View Portfolio action. The signing client validates the exact transaction message and wallet signature before submission; no amount is guessed or converted. The default demo amount is now 10 tokens.

Portfolio automatically reads when a wallet is connected or the page is opened, and consumes the refreshed Position after financing without disconnecting/reconnecting. Full reloads reconstruct from Solana after explicit wallet connection. There is no localStorage, backend or database source of truth. Document integrity behavior is unchanged: three actual project documents remain pending, with the existing harmless fixture separate. No actual private documents were added.

### Verification

- TypeScript, ESLint, exact six-decimal amount tests and production build passed (`npm run build -- --webpack`, the previously verified machine-compatible build option).
- All **21 Playwright tests** passed: the original wallet, financing and document coverage retained with intentional new UI expectations, plus Phase 3 tests. The signed browser fixture verifies **3.25 → 13.25** after a confirmed 10-token contribution, a 13.25% bar, automatic 10-token portfolio position, correct success receipt and Devnet Explorer URL. Pending/rejected attempts retain 3.25, RPC failures remain usable, and business/founding/demo labels are checked.
- All four routes passed overflow and automated WCAG 2 A/AA checks at **320 / 390 / 768 / 1440 px**. Filters, empty states, project notices, native dialog keyboard/focus handling and mobile navigation passed. No new console/page errors or unexpected signing/transaction requests occurred in the page checks.
- Original local initialization/security, financing/security and document-integrity tests passed against the unchanged program binary on a fresh isolated local validator. No Devnet program deployment was performed.
- Program source, deployment manifest, generated IDL and document client checksums stayed identical; `src/chain/client.ts` is byte-for-byte unchanged. The frontend-only shared-read/success changes reuse its existing transaction logic.
- Read-only Devnet comparison confirmed all six original accounts unchanged: Project, Vault, Mint, Program and both Positions. Project/vault remain 3.25 JV Test USD, user position 2 with nonce 2, smoke position 1.25 with nonce 1 and user balance 9,998. Existing EUR Project account data is unchanged.
- Live browser checks confirmed the actual automatic funding-bar read plus the existing DocumentRecord display, original-file match and altered-file mismatch. No production document record was created. The Explorer URL is valid, but automated remote Explorer access still returns HTTP 429.

### Remaining UX limitations

Public Devnet RPC may time out or be rate-limited; the app supports manual retry and clearly labels last-read data. Other-wallet contributions appear on the next read/page visit; no subscription or polling was added. Pending receipts remain in memory, so users should retain their Explorer link before a full reload. Automatic success/portfolio updates passed signed SDK browser fixtures; the installed-Solflare acceptance check for this new success presentation remains manual. Document anchoring in installed Solflare still requires the project-authority account, which the user has not made available; this Phase 2F limitation is unchanged. The three actual project fingerprints remain pending, and neither business facts nor underlying documents are independently authenticated by Joint Venture.

**Stopped after Phase 3. No public deployment, new protocol features, repayments, withdrawals or subsequent milestone work was started.**

## Classic / Industrial comparison — 11 October 2026

All four routes now share two appearances. **Classic** retains the existing cream/green pages. **Industrial** uses midnight navy, charcoal panels, silver text, cyan controls and restrained purple lighting. The same page content, wallet provider, financing dialogs, document components and Solana clients serve both appearances; switching does not replace or key the page tree.

### Compare locally

Run `npm run dev` and open `http://localhost:3000`. Use **Classic / Industrial** in the desktop navigation. On smaller screens, open the navigation menu to find the same control. Compare `/`, `/projects`, `/projects/bavaria` and `/portfolio`. New visitors start in Classic. Only the appearance string is remembered in `localStorage` under `jv-ui-variant`; invalid or unavailable storage defaults to Classic, and session switching still works when storage is blocked. An inline head script restores the saved root theme before content paints; React synchronizes the controls with `useSyncExternalStore` without hydration mismatches.

Industrial adds an immersive facility hero, a structured founding-project summary, a full-width Bavaria marketplace card followed by two fictional cards, an illustrative Bavaria masthead, stronger readiness/economics panels and a distinct technical-demo panel. Portfolio places live wallet/Devnet panels ahead of the explicitly fictional EUR examples. Small directional phrases were made independent of panel position. The origin story remains before marketplace opportunities; every business fact, pending production-document status and distinction between EUR requirements and Devnet tokens remains.

The supplied `img2.jpeg` is served locally as `public/images/illustrative-facility.jpeg`. Each use is labeled **“Illustrative facility imagery · Does not depict the Bavaria site.”** The other reference image is not served and its embedded financing wording is not reproduced. No image-generation service or new dependency was used.

The separate `industrial.css` contains the additional DaisyUI theme and root-scoped presentation styles, plus shared navigation styles for the switch. The existing Classic stylesheet was preserved. The UI preference provider wraps the existing wallet provider without remounting it. Route, filters, financing input, connected wallet, pending signature and live readouts stay in memory while changing appearance. No program, IDL, deployment configuration, transaction client or onchain account changes were made for this work; no public deployment or transaction submission against Devnet was performed.

### Verification results

- **64 Playwright tests passed**, split across Classic and Industrial (`npm run test:e2e`; individual runs use `-- --project=classic` or `-- --project=industrial`). Existing wallet, financing, document-integrity and product-truth suites run in both designs. Added saved/default/invalid appearance restoration before content paint, hydration-error monitoring, unavailable storage, Enter/Space keyboard switching, mobile switching, route/filter preservation, financing-input preservation and reduced-motion layout tests. The signed fixture switches with a connected wallet and pending transaction, retains the exact signature and last live total, and confirms without a second submission.
- All **32 appearance/route/viewport combinations** passed document overflow and automated WCAG 2 A/AA checks at **320 / 390 / 768 / 1440 px**, with no browser page errors. Screenshot review covered image crops, readable overlays and the separation of live/demo content. A mobile hero clipping issue found in screenshot review was corrected; direct card/title/readout bounds are now covered in the regression suite. Existing native dialog focus handling and appearance-control keyboard operation passed; visible focus styles are retained, with cyan outlines in Industrial. Reduced-motion preferences disable transitions/animations and smooth scrolling.
- TypeScript (`npm run typecheck`), ESLint (`npm run lint`), exact amount validation (`npm run test:amount`) and production build (`npm run build -- --webpack`) passed. All four routes remain statically prerendered. The webpack option is the established machine-compatible build command.
- Classic screenshots retain the cream/green composition, original illustrations, cards and page ordering, apart from navigation accommodation for the appearance control. Verification used browser wallet/RPC fixtures; no installed-wallet transaction was requested. Existing Devnet availability and manual authority-wallet limitations remain unchanged.

The local comparison server is available at `http://localhost:3000` while `npm run dev` is running. Screenshot/accessibility evidence for this session is in `/tmp/jv-appearance-results.json` and `/tmp/jv-classic-*.png` / `/tmp/jv-industrial-*.png`.
