# Joint Venture Devnet MVP

Agricultural infrastructure financing with Next.js App Router, TypeScript, Tailwind CSS, DaisyUI, Lucide React and Solflare. The approved cream/green design is retained. Bavaria now has a real project account and token vault on Solana Devnet; financing calls the Joint Venture program and records per-wallet test contributions.

## Run

```sh
npm install
npm run dev
# http://localhost:3000

npm run typecheck
npm run lint
npm run build
npm run test:e2e
node scripts/test-amount.mjs
```

Routes: `/`, `/projects`, `/projects/bavaria`, `/portfolio`. Browser tests require Chromium (`npx playwright install chromium`). Node 24 was used, including its TypeScript stripping for the amount-check and mint scripts.

## Devnet deployment

| Account | Public address |
| --- | --- |
| Program | `Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ` |
| Bavaria project PDA | `9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U` |
| Project vault PDA | `2JGPfGiDD6wCUJ4dJyrYKQm7RP7NgQ56hdSCVNgJADHN` |
| JV Test USD mint | `BUb2CzJvDu7GuFjZ9a41z7uTQNCbgi97yybPs6uepYgL` |

[View the project on Devnet Explorer](https://explorer.solana.com/address/9zPe8V8s9WFhoJxHTfViwu9dhvgK3gc8bN3XiCGjEo1U?cluster=devnet). Public addresses and generated IDL are in `src/chain/`; deployment and verification receipts are in `chain/receipts/`.

The minimal project was deployed and initialized **before** adding the financing instruction and upgrading the same program. The project stores the agreed EUR metrics in integer cents and fixes the accepted mint. Initialization checks the deployed program's upgrade authority. The vault accepts classic SPL tokens and is controlled by the project PDA, not a recipient wallet. Financing validates the project, mint, source owner and vault, transfers through the program, and atomically updates the project total and a position PDA derived from project + investor. Expected nonces reject replayed attempts. An authority-only instruction can pause financing.

JV Test USD has six decimals and is a dedicated demo token—not official USDC, a stablecoin, or redeemable currency. Its name is an application label; token metadata has not been published. No production investment terms, yield, repayment schedule or EUR exchange rate is implied. Test tokens are held in the project vault; the MVP has **no withdrawal or repayment instruction**. Upgrade and mint authorities are retained for development. This program has not undergone an independent security audit.

## Try financing with Solflare

1. Set Solflare to Devnet and connect. Connection alone shares the public address and reads native test SOL; it requests no transaction signature.
2. Have Devnet SOL for fees and first-position rent, and the dedicated JV Test USD token. The development authority can issue demo tokens to an explicitly supplied wallet:

   ```sh
   node scripts/mint-test-usd.mjs YOUR_PUBLIC_WALLET_ADDRESS 10000
   ```

   This script uses the existing local CLI authority (or `JV_ADMIN_KEYPAIR`) and checks Devnet. Private keys are never sent to the frontend. The app provides no public minting endpoint.
3. On Bavaria, select **Finance this project**, enter an amount with up to six decimals, then **Review commitment**. Review the wallet, mint, project and vault links and the test-token limitations.
4. Select **Approve in Solflare** and approve the Devnet transaction. The app checks token balance, SOL fees/rent, project state and position nonce before signing. It validates the signed message and signature before submission.
5. Inspect the transaction link. If confirmation is pending or unavailable, use **Check confirmation**. The app retains the signature and blocks another submission while that attempt remains unresolved; it never automatically creates another deposit.
6. In **My Portfolio**, use **Read Devnet records** to read the connected wallet's persistent onchain test position. The EUR demo portfolio remains separate.

App connection and pending-receipt state are in memory across client navigation and reset on a full refresh. Keep a pending transaction's Explorer link before refreshing; reconnect and read the onchain position before another review. Position nonces protect against replaying the same attempt. No automatic reconnection is performed. A user subsequently confirmed two actual wallet approvals, and both financing transactions were verified on Devnet. Installed-wallet rejection, account switching, reconnect behavior and mobile handoff still need manual validation; automated browser tests use a signing fixture.

## Demo content

Bavaria is the real founding project, currently pre-operational; the Netherlands and Spain projects are fictional demos. The real full-deployment target is €250,000 and the capital raise is open; no fictional EUR progress is shown. Approximate contracted monthly revenue is €33,000 and the infrastructure budget is €220,000. The supplied approximate allocation is €220,000 infrastructure/equipment plus €30,000 initial working capital. These figures do not describe live token deposits. The homepage scope metrics show one founding project, two fictional examples and a technical Devnet demo.

Cultivation Licence, Customer Rental Agreement and Infrastructure Budget display **Integrity record pending**, with no invented fingerprints. Phase 2F supports local SHA-256 hashing, authority-only anchoring and live record reads/file matching; only an explicitly harmless public test fixture has been anchored. Matching bytes do not authenticate the issuer, legality or contents. Project listing is informational and the GitHub link remains unavailable until a repository URL is supplied. There is no backend, database, custodial user account or Mainnet functionality.

The user-wallet acceptance check recorded two finalized **1 JV Test USD** contributions with successive nonces. Its position totals **2 JV Test USD**; the project total and vault were **3.25 JV Test USD** at verification. See `chain/receipts/wallet-acceptance.json`. These are real Devnet test-token records, separate from the EUR demo portfolio.

The Devnet smoke test recorded **1.25 JV Test USD** using an isolated test wallet through the financing instruction. Its public receipt is in `chain/receipts/financing-smoke.json`; this is test activity, separate from the EUR demo commitments. Direct SPL transfers into the vault are not attributed as project financing; recorded totals derive only from successful program financing instructions.

## Product truth and live demo (Phase 3)

Bavaria is the real project that inspired Joint Venture, clearly distinguished from the two fictional marketplace examples. The licence, lease and commercial rental agreement are business facts supplied by the project developer, not independently authenticated documents. The business is not operating yet; contracted monthly rental revenue is approximately €33,000 and financial projections are not guaranteed returns.

A separate **Live Devnet Financing Demo** reads the existing Project PDA automatically and displays recorded contributions against an illustrative **100 JV Test USD** target. The token has no monetary value and there is no EUR conversion. After confirmed financing, the project total and connected wallet Position/token balance are re-read automatically. The success view shows the signed/confirmed receipt amount, updated live total, Explorer link and View Portfolio action. Opening Portfolio also re-reads the connected wallet position; fictional EUR examples reference a fictional project and remain separate.

RPC failures never fabricate a zero or progress; previous successful reads are labelled when refresh fails. Other-wallet activity needs a new read/page visit. Pending receipts and display state remain in memory. No program upgrade, protocol changes or public deployment were needed for Phase 3. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for tests and limitations.

## Document integrity (Phase 2F)

Open Bavaria → **View record** → **Read integrity record**. The harmless test fixture card reads an actual Devnet record. Select `tests/fixtures/integrity-test.txt` locally to see a match; changing the bytes produces a mismatch. The three actual project categories remain pending because their documents are unavailable. Do not commit sensitive documents to this repository.

Browser Web Crypto hashes files in memory (20 MiB limit, HTTPS/localhost required). There is no upload endpoint, document storage or onchain file content. Only the 32-byte digest, public category ID/name, authority and chain timestamp are recorded. Matching a fingerprint proves matching bytes; it does not authenticate the issuer, truth, legality or content.

Only the existing project authority can select a file and choose **Anchor fingerprint in Solflare**. Recording is permanent; duplicate IDs are rejected and replacement/versioning is not implemented. The UI retains uncertain signatures for status checking; save the Explorer link before refreshing. No frontend private keys are used. Document IDs are 1–32 lowercase ASCII letters/digits/hyphens and names are at most 64 UTF-8 bytes.

```sh
# On the initialized local validator, alongside the original tests:
node scripts/test-documents.mjs
# Explicitly anchor/read back only the public harmless fixture on Devnet:
node scripts/record-integrity-fixture.mjs
# Read-only check against the saved pre-upgrade public state:
node scripts/check-integrity-upgrade.mjs
```

The same program was upgraded compatibly; original Project/Position layouts and financing interfaces remain intact. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) for the fixture address, public receipts, state preservation and current limitations. Explorer links are correctly constructed, but automated access returned HTTP 429. Default Turbopack encountered a machine process/port restriction; the verified production build command here is `npm run build -- --webpack`.

## Files and tooling

- `chain/programs/joint_venture/src/lib.rs`: project initialization, vault constraints, authority pause control, financing/position records and separate immutable document-integrity records.
- `chain/Cargo.lock`, `chain/Anchor.toml`: locked dependencies and Anchor workspace. See [chain setup](chain/README.md) for local validation and deployment commands.
- `scripts/`: guarded deployment, initialization, pause/enable, demo minting, local program tests, amount checks and idempotent Devnet smoke verification.
- `src/chain/`: public deployment configuration, generated IDL/types, exact token parsing, validated reads and program transaction construction.
- `src/components/financing.tsx`, `wallet-provider.tsx`, `wallet.tsx`: review, signing, confirmation recovery, independent token positions and wallet reads.
- `src/data/projects.ts`: typed EUR demo content and document notices.
- `tests/`: real adapter/SDK browser tests with fixture wallet and RPC responses.

New client dependencies are `@coral-xyz/anchor` 0.32.1 and `@solana/spl-token` 0.4.15, alongside the existing Solflare adapter and web3.js. Rust uses Anchor 0.32.1. The build used official platform-tools v1.57, SBPF v3, and Agave CLI/validator 4.3.0 for deployment/testing. This machine required isolated temporary compiler/Cargo directories because its pre-existing caches are not writable. Program and mint keypairs stay in ignored `.localkeys/`; generated binaries, local ledgers and build directories are also ignored.

## Verification and limits

Local program tests cover unauthorized and duplicate initialization, decimal restrictions, exact case metrics, PDA vault ownership, pause authority, zero amounts, wrong mint/source owner/vault/position, insufficient tokens, successful repeated deposits, replay protection and atomic failure. Exact amount checks cover six decimals and u64 boundaries. Devnet initialization, upgrade, enable and a real program financing transaction were read back and verified.

Frontend verification covers TypeScript, ESLint, production build, wallet/signing fixtures, amount and network validation, rejection, pending and unavailable confirmation, failed/expired transactions, stale positions, insufficient SOL, portfolio reads, and unchanged EUR demo totals. Desktop, tablet, 390px and 320px route checks include overflow, accessibility and keyboard handling.

Final results: TypeScript, ESLint, production build, Rust formatting, local program security tests, exact amount tests and **21 browser regressions pass**. All 16 route/viewport combinations passed automated WCAG 2 A/AA and overflow checks. Browser hydration/console checks passed after waiting for hydration before taking screenshots. A live browser read returned 1.25 JV Test USD, and a Devnet program dump matched the tested binary. These automated checks complement manual accessibility and installed-wallet acceptance testing.

`npm audit` reports 20 findings (10 moderate, 10 high), including development ESLint/glob dependencies and transitive Solana/Anchor dependencies (`bigint-buffer`, `toml`, legacy `uuid`, `stream-json`). No incompatible forced upgrades were applied. The `toml` functionality is Node tooling rather than the browser financing path; the dependency findings still require review before production use. Public Devnet RPC calls can time out or be rate-limited; failed reads show unavailable/error states rather than invented balances.
